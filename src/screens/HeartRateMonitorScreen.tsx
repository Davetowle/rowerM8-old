import { ArrowLeft, HeartPulse } from "lucide-react";

interface Props {
  onBack: () => void;
}

export function HeartRateMonitorScreen({ onBack }: Props) {
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
        <span className="font-bold text-white tracking-tight">Heart Rate Monitor</span>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
        <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-cyan-500/10 border border-cyan-400/20">
          <HeartPulse size={28} className="text-cyan-400" />
        </div>

        <div className="max-w-xs">
          <h2 className="text-xl font-bold text-white tracking-tight">
            Coming Soon
          </h2>
          <p className="mt-3 text-sm text-slate-400 leading-relaxed">
            Heart rate monitor support is coming soon — connect your HRM here in
            a future update.
          </p>
        </div>

        <button
          disabled
          className="w-full max-w-sm py-5 rounded-2xl bg-slate-800 text-slate-500 text-lg font-bold tracking-wide
                     border border-white/5 cursor-not-allowed opacity-60 flex items-center justify-center gap-2"
        >
          <HeartPulse size={20} />
          CONNECT
        </button>
      </div>
    </div>
  );
}
