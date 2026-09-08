import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Bluetooth, Loader2, Check } from "lucide-react";
import {
  ensureBleReady,
  requestBlePermissions,
  startScan,
  stopScan,
  connectToDevice,
  type BleDevice,
} from "@/lib/ble";

type Phase = "idle" | "scanning" | "connecting" | "connected";

interface Props {
  onBack: () => void;
}

export function ConnectSensorScreen({ onBack }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [devices, setDevices] = useState<BleDevice[]>([]);
  const [connectedName, setConnectedName] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const deviceMapRef = useRef<Map<string, BleDevice>>(new Map());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await ensureBleReady();
        const ok = await requestBlePermissions();
        if (!ok && !cancelled) {
          setError("Bluetooth permission denied. Please enable Bluetooth to scan for sensors.");
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[ConnectSensor] init error:", err);
          setError("Could not initialize Bluetooth. Make sure it is enabled.");
        }
      }
    })();
    return () => {
      cancelled = true;
      stopScan().catch(() => {});
    };
  }, []);

  const handleStartScan = useCallback(async () => {
    setPhase("scanning");
    setDevices([]);
    deviceMapRef.current.clear();
    setError(null);
    try {
      await startScan((device) => {
        const map = deviceMapRef.current;
        if (!map.has(device.deviceId)) {
          map.set(device.deviceId, device);
          setDevices(Array.from(map.values()));
        }
      });
    } catch (err) {
      console.error("[ConnectSensor] scan error:", err);
      setError("Failed to start scanning.");
      setPhase("idle");
    }
  }, []);

  const handleSelectDevice = useCallback(async (device: BleDevice) => {
    setPhase("connecting");
    setError(null);
    try {
      await stopScan();
      await connectToDevice(device.deviceId);
      setConnectedName(device.name);
      setPhase("connected");
    } catch (err) {
      console.error("[ConnectSensor] connect error:", err);
      setError("Failed to connect to device.");
      setPhase("scanning");
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    setPhase("idle");
    setConnectedName(undefined);
    setDevices([]);
    deviceMapRef.current.clear();
  }, []);

  return (
    <div className="flex flex-col min-h-screen px-safe-6 pt-safe-8 pb-safe-8 bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <span className="font-bold text-white tracking-tight">Connect Sensor</span>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Connected state */}
      {phase === "connected" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
          <div className="flex items-center justify-center h-20 w-20 rounded-3xl bg-cyan-500/10 border border-cyan-400/20">
            <Check size={36} className="text-cyan-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Connected</h2>
            <p className="mt-2 text-sm text-slate-400">
              {connectedName ?? "Sensor"}
            </p>
          </div>
          <button
            onClick={handleDisconnect}
            className="px-6 py-3 rounded-2xl bg-slate-800 text-slate-300 text-sm font-medium
                       border border-white/10 transition-all hover:bg-slate-700 hover:text-white
                       active:scale-[0.98]"
          >
            Disconnect
          </button>
        </div>
      )}

      {/* Idle / scanning / connecting states */}
      {phase !== "connected" && (
        <>
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-cyan-500/10 border border-cyan-400/20">
              <Bluetooth size={28} className="text-cyan-400" />
            </div>
            <p className="text-sm text-slate-400 text-center max-w-xs">
              {phase === "idle" && "Tap below to scan for nearby Bluetooth sensors."}
              {phase === "scanning" && "Searching for devices..."}
              {phase === "connecting" && "Connecting to device..."}
            </p>
          </div>

          {/* Scan button */}
          {phase === "idle" && (
            <div className="w-full max-w-sm mx-auto">
              <button
                onClick={handleStartScan}
                className="w-full py-5 rounded-2xl bg-cyan-500 text-slate-950 text-lg font-bold tracking-wide
                           shadow-lg shadow-cyan-500/30 transition-all hover:bg-cyan-400 active:scale-[0.98]"
              >
                SCAN FOR DEVICES
              </button>
            </div>
          )}

          {/* Scanning spinner */}
          {phase === "scanning" && (
            <div className="flex items-center justify-center gap-2 text-cyan-400 mb-6">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm font-medium">Scanning...</span>
            </div>
          )}

          {/* Connecting spinner */}
          {phase === "connecting" && (
            <div className="flex items-center justify-center gap-2 text-cyan-400 mb-6">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm font-medium">Connecting...</span>
            </div>
          )}

          {/* Device list */}
          {devices.length > 0 && (
            <div className="flex-1 w-full max-w-sm mx-auto">
              <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">
                Found Devices ({devices.length})
              </p>
              <div className="flex flex-col gap-2">
                {devices.map((device) => (
                  <button
                    key={device.deviceId}
                    onClick={() => handleSelectDevice(device)}
                    disabled={phase !== "scanning"}
                    className="flex items-center gap-3 w-full rounded-xl bg-slate-900 border border-white/10
                               px-4 py-3.5 text-left transition-all hover:bg-slate-800 hover:border-cyan-500/30
                               active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Bluetooth size={18} className="text-cyan-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {device.name ?? "Unknown Device"}
                      </p>
                      <p className="text-xs text-slate-500 truncate font-mono">
                        {device.deviceId}
                      </p>
                    </div>
                    {device.rssi != null && (
                      <span className="text-xs text-slate-600 tabular-nums">
                        {device.rssi} dBm
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {phase === "scanning" && devices.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-slate-600">No devices found yet...</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
