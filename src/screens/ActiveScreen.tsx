import { useEffect } from "react";
import { SpmControl } from "@/components/SpmControl";
import { formatTime } from "@/lib/format";

interface Props {
  spm: number;
  onAdjust: (delta: number) => void;
  strokeCount: number;
  elapsed: number;
  phase: number;
  onStop: () => void;
}

export function ActiveScreen({ spm, onAdjust, strokeCount, elapsed, phase, onStop }: Props) {
  // Drive phase = fill (0→1), Recovery phase = empty (1→0)
  const fillPercent = Math.round(phase * 100);

  return (
    <div className="flex flex-col items-center justify-between min-h-screen px-6 py-8">
      {/* Top stats */}
      <div className="w-full flex justify-center gap-8 sm:gap-16">
        <Stat label="Time" value={formatTime(elapsed)} />
        <div className="w-px bg-white/10" />
        <Stat label="Strokes" value={strokeCount.toString()} />
      </div>

      {/* Center: phase indicator + SPM */}
      <div className="flex flex-col items-center gap-10 w-full">
        {/* Phase bar */}
        <div className="w-full max-w-xs">
          <div className="flex justify-between text-xs uppercase tracking-widest mb-2">
            <span className="text-cyan-400 font-medium">Drive</span>
            <span className="text-slate-500 font-medium">Recovery</span>
          </div>
          <div className="h-4 rounded-full bg-slate-800 overflow-hidden border border-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-300 transition-[width] duration-75 ease-linear"
              style={{ width: `${fillPercent}%` }}
            />
          </div>
        </div>

        <SpmControl spm={spm} onAdjust={onAdjust} size="lg" />
      </div>

      {/* Stop button */}
      <div className="w-full max-w-sm">
        <button
          onClick={onStop}
          className="w-full py-5 rounded-2xl bg-red-500/90 text-white text-lg font-bold tracking-wide
                     shadow-lg shadow-red-500/20 transition-all hover:bg-red-500 active:scale-[0.98]"
        >
          STOP
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl font-bold text-white tabular-nums">{value}</div>
      <div className="text-xs uppercase tracking-widest text-slate-500 mt-1">{label}</div>
    </div>
  );
}
