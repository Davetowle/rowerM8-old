import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Bluetooth, Loader2, Check, RefreshCw, AlertCircle } from "lucide-react";
import { useSensor } from "@/hooks/useSensor";

interface Props {
  onBack: () => void;
}

export function ConnectSensorScreen({ onBack }: Props) {
  const sensor = useSensor();
  const {
    connectionState,
    devices,
    error,
    connectedDevice,
    scanForSensors,
    stopScan,
    connectToSensor,
    disconnect,
  } = sensor;

  const [pendingDeviceId, setPendingDeviceId] = useState<string | null>(null);
  const hasScannedRef = useRef(false);

  // Stop scan when leaving the screen
  useEffect(() => {
    return () => {
      stopScan().catch(() => {});
    };
  }, [stopScan]);

  const handleScan = useCallback(async () => {
    hasScannedRef.current = true;
    await scanForSensors();
  }, [scanForSensors]);

  const handleSelectDevice = useCallback(
    async (deviceId: string) => {
      setPendingDeviceId(deviceId);
      await connectToSensor(deviceId);
      setPendingDeviceId(null);
    },
    [connectToSensor]
  );

  const handleRetry = useCallback(async () => {
    await scanForSensors();
  }, [scanForSensors]);

  const handleDisconnect = useCallback(async () => {
    await disconnect();
  }, [disconnect]);

  const isConnected = connectionState === "connected";
  const isScanning = connectionState === "scanning";
  const isConnecting = connectionState === "connecting";
  const isError = connectionState === "error";
  const isIdle = connectionState === "disconnected";

  return (
    <div className="flex flex-col min-h-screen px-safe-6 pt-safe-8 pb-safe-8 bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => {
            stopScan().catch(() => {});
            onBack();
          }}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <span className="font-bold text-white tracking-tight">Connect Sensor</span>
      </div>

      {/* Connection status banner */}
      {isConnected && connectedDevice && (
        <div className="mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 flex items-center gap-3">
          <Check size={18} className="text-emerald-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-emerald-400">Connected</p>
            <p className="text-xs text-slate-400 truncate">
              {connectedDevice.name ?? "Sensor"}
            </p>
          </div>
          <button
            onClick={handleDisconnect}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium
                       border border-white/10 transition-all hover:bg-slate-700 hover:text-white
                       active:scale-[0.98] shrink-0"
          >
            Disconnect
          </button>
        </div>
      )}

      {/* Error banner */}
      {isError && (
        <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 flex items-center gap-3">
          <AlertCircle size={18} className="text-red-400 shrink-0" />
          <p className="text-sm text-red-400 flex-1">
            {error ?? "Couldn't connect — try again"}
          </p>
          <button
            onClick={handleRetry}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium
                       border border-white/10 transition-all hover:bg-slate-700 hover:text-white
                       active:scale-[0.98] shrink-0"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      )}

      {/* Idle / scanning states */}
      {!isConnected && (
        <>
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-cyan-500/10 border border-cyan-400/20">
              <Bluetooth size={28} className="text-cyan-400" />
            </div>
            <p className="text-sm text-slate-400 text-center max-w-xs">
              {isIdle && !hasScannedRef.current && "Tap below to scan for nearby WitMotion sensors."}
              {isIdle && hasScannedRef.current && "No sensor connected. Tap below to scan again."}
              {isScanning && "Searching for WitMotion sensors..."}
              {isConnecting && "Connecting to sensor..."}
            </p>
          </div>

          {/* Scan button */}
          {(isIdle || isError) && (
            <div className="w-full max-w-sm mx-auto mb-6">
              <button
                onClick={handleScan}
                disabled={isConnecting}
                className="w-full py-5 rounded-2xl bg-cyan-500 text-slate-950 text-lg font-bold tracking-wide
                           shadow-lg shadow-cyan-500/30 transition-all hover:bg-cyan-400 active:scale-[0.98]
                           disabled:opacity-50 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2"
              >
                <Bluetooth size={20} />
                SCAN FOR SENSOR
              </button>
            </div>
          )}

          {/* Scanning spinner */}
          {isScanning && (
            <div className="flex items-center justify-center gap-2 text-cyan-400 mb-6">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm font-medium">Scanning...</span>
            </div>
          )}

          {/* Device list */}
          {devices.length > 0 && (
            <div className="flex-1 w-full max-w-sm mx-auto">
              <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">
                Found Sensors ({devices.length})
              </p>
              <div className="flex flex-col gap-2">
                {devices.map((device) => {
                  const isThisConnecting =
                    isConnecting && pendingDeviceId === device.deviceId;
                  const isThisConnected =
                    isConnected &&
                    connectedDevice?.deviceId === device.deviceId;

                  return (
                    <div
                      key={device.deviceId}
                      className={`flex items-center gap-3 w-full rounded-xl px-4 py-3.5 text-left transition-all
                        ${isThisConnected
                          ? "bg-emerald-500/10 border border-emerald-500/30"
                          : "bg-slate-900 border border-white/10 hover:bg-slate-800 hover:border-cyan-500/30"}
                        ${isConnecting && !isThisConnecting ? "opacity-50" : ""}
                        active:scale-[0.98]`}
                    >
                      <Bluetooth
                        size={18}
                        className={`shrink-0 ${isThisConnected ? "text-emerald-400" : "text-cyan-400"}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {device.name ?? "Unknown Sensor"}
                        </p>
                        <p className="text-xs text-slate-500 truncate font-mono">
                          {device.deviceId}
                        </p>
                      </div>
                      {device.rssi != null && (
                        <span className="text-xs text-slate-600 tabular-nums shrink-0">
                          {device.rssi} dBm
                        </span>
                      )}

                      {/* Row state indicators */}
                      {isThisConnecting && (
                        <Loader2 size={18} className="animate-spin text-cyan-400 shrink-0" />
                      )}
                      {isThisConnected && (
                        <div className="flex items-center justify-center h-7 w-7 rounded-full bg-emerald-500/20 shrink-0">
                          <Check size={16} className="text-emerald-400" />
                        </div>
                      )}
                      {!isThisConnecting && !isThisConnected && !isConnecting && (
                        <button
                          onClick={() => handleSelectDevice(device.deviceId)}
                          className="px-3 py-1.5 rounded-lg bg-cyan-500/15 text-cyan-400 text-xs font-medium
                                     border border-cyan-400/20 transition-all hover:bg-cyan-500/25
                                     active:scale-95 shrink-0"
                        >
                          Connect
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {isScanning && devices.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-slate-600">No sensors found yet...</p>
            </div>
          )}

          {(isIdle || isError) && hasScannedRef.current && devices.length === 0 && !isError && (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-slate-600">
                No WitMotion sensors found. Make sure your sensor is powered on and nearby.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
