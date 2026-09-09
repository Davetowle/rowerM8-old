import {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { BleClient } from "@capacitor-community/bluetooth-le";
import { Capacitor } from "@capacitor/core";

export type ConnectionState =
  | "disconnected"
  | "scanning"
  | "connecting"
  | "connected"
  | "error";

export interface SensorDevice {
  deviceId: string;
  name?: string;
  rssi?: number;
}

export interface SensorReading {
  timestamp: number;
  raw: DataView;
}

export interface SensorContextValue {
  connectionState: ConnectionState;
  devices: SensorDevice[];
  error: string | null;
  connectedDevice: SensorDevice | null;
  latestReading: SensorReading | null;
  scanForSensors: () => Promise<void>;
  stopScan: () => Promise<void>;
  connectToSensor: (deviceId: string) => Promise<void>;
  disconnect: () => Promise<void>;
  subscribeToData: (cb: (reading: SensorReading) => void) => () => void;
}

const SENSOR_NAME_PREFIXES = ["WT901BLE", "WT9011"];

const WITMOTION_SERVICE_UUID = "0000ffe0-0000-1000-8000-00805f9a34fb";
const WITMOTION_NOTIFY_UUID = "0000ffe1-0000-1000-8000-00805f9a34fb";

export const SensorContext = createContext<SensorContextValue | null>(null);

function isSensorName(name?: string): boolean {
  if (!name) return false;
  return SENSOR_NAME_PREFIXES.some((p) => name.startsWith(p));
}

function isAndroid(): boolean {
  return Capacitor.getPlatform() === "android";
}

async function ensureBleReady(): Promise<void> {
  await BleClient.initialize({ androidNeverForLocation: true });
}

async function requestBlePermissions(): Promise<boolean> {
  if (!isAndroid()) return true;
  try {
    const enabled = await BleClient.isEnabled();
    if (!enabled) {
      await BleClient.requestEnable();
    }
    return true;
  } catch {
    return false;
  }
}

export function SensorProvider({ children }: { children: ReactNode }) {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("disconnected");
  const [devices, setDevices] = useState<SensorDevice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [connectedDevice, setConnectedDevice] =
    useState<SensorDevice | null>(null);
  const [latestReading, setLatestReading] = useState<SensorReading | null>(
    null
  );

  const deviceMapRef = useRef<Map<string, SensorDevice>>(new Map());
  const dataListenersRef = useRef<Set<(r: SensorReading) => void>>(new Set());
  const connectedDeviceIdRef = useRef<string | null>(null);

  const notifyListeners = useCallback((reading: SensorReading) => {
    setLatestReading(reading);
    dataListenersRef.current.forEach((cb) => cb(reading));
  }, []);

  const scanForSensors = useCallback(async () => {
    setConnectionState("scanning");
    setDevices([]);
    deviceMapRef.current.clear();
    setError(null);

    try {
      await ensureBleReady();
      const ok = await requestBlePermissions();
      if (!ok) {
        setError(
          "Bluetooth permission denied. Please enable Bluetooth to scan for sensors."
        );
        setConnectionState("error");
        return;
      }

      await BleClient.requestLEScan({}, (result) => {
        const name = result.device.name;
        if (!isSensorName(name)) return;

        const device: SensorDevice = {
          deviceId: result.device.deviceId,
          name,
          rssi: result.rssi,
        };

        const map = deviceMapRef.current;
        if (!map.has(device.deviceId)) {
          map.set(device.deviceId, device);
          setDevices(Array.from(map.values()));
        }
      });
    } catch (err) {
      console.error("[SensorManager] scan error:", err);
      setError("Failed to start scanning.");
      setConnectionState("error");
    }
  }, []);

  const stopScan = useCallback(async () => {
    try {
      await BleClient.stopLEScan();
    } catch {
      // ignore — scan may already be stopped
    }
  }, []);

  const connectToSensor = useCallback(
    async (deviceId: string) => {
      setConnectionState("connecting");
      setError(null);

      try {
        await stopScan();
        await BleClient.connect(deviceId);
        connectedDeviceIdRef.current = deviceId;

        const device = deviceMapRef.current.get(deviceId);
        setConnectedDevice(device ?? { deviceId });

        await BleClient.startNotifications(
          deviceId,
          WITMOTION_SERVICE_UUID,
          WITMOTION_NOTIFY_UUID,
          (value: DataView) => {
            notifyListeners({
              timestamp: Date.now(),
              raw: value,
            });
          }
        );

        setConnectionState("connected");
      } catch (err) {
        console.error("[SensorManager] connect error:", err);
        setError("Failed to connect to sensor.");
        setConnectionState("error");
        connectedDeviceIdRef.current = null;
      }
    },
    [stopScan, notifyListeners]
  );

  const disconnect = useCallback(async () => {
    const deviceId = connectedDeviceIdRef.current;
    if (deviceId) {
      try {
        await BleClient.stopNotifications(
          deviceId,
          WITMOTION_SERVICE_UUID,
          WITMOTION_NOTIFY_UUID
        );
      } catch {
        // ignore
      }
      try {
        await BleClient.disconnect(deviceId);
      } catch {
        // ignore
      }
    }
    connectedDeviceIdRef.current = null;
    setConnectedDevice(null);
    setLatestReading(null);
    setDevices([]);
    deviceMapRef.current.clear();
    setConnectionState("disconnected");
  }, []);

  const subscribeToData = useCallback(
    (cb: (reading: SensorReading) => void) => {
      dataListenersRef.current.add(cb);
      return () => {
        dataListenersRef.current.delete(cb);
      };
    },
    []
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const deviceId = connectedDeviceIdRef.current;
      if (deviceId) {
        BleClient.disconnect(deviceId).catch(() => {});
      }
      BleClient.stopLEScan().catch(() => {});
    };
  }, []);

  const value: SensorContextValue = {
    connectionState,
    devices,
    error,
    connectedDevice,
    latestReading,
    scanForSensors,
    stopScan,
    connectToSensor,
    disconnect,
    subscribeToData,
  };

  return (
    <SensorContext.Provider value={value}>{children}</SensorContext.Provider>
  );
}
