import { SpmControl } from "@/components/SpmControl";
import { formatTime } from "@/lib/format";
import type { MetronomeState } from "@/hooks/useMetronome";

interface Props {
  spm: number;
  onAdjust: (delta: number) => void;
  strokeCount: number;
  elapsed: number;
  phase: number;
  countdown: number;
  metronomeState: MetronomeState;
  onStop: () => void;
}

export function ActiveScreen({
  spm,
  onAdjust,
  strokeCount,
  elapsed,
  phase,
  countdown,
  metronomeState,
  onStop,
}: Props) {
  const fillPercent = Math.round(phase * 100);
  const isCountingDown = metronomeState === "countdown";
  const countdownLabel = countdown > 0 ? String(countdown) : "ROW";

  return (
    <div className="relative min-h-screen">
      {/* Full-bleed background image — pointer-events-none so it never
          intercepts taps or scrolling. */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `url("/5UW1MINSS46bsTii1EQBAa2EmoY0i2Roda_kRTVDeNRabPKqVo5Tj8WDWfpfNYPQZ0yDMGG8TBHaA3Ge.jpg")`,
          backgroundSize: "cover",
          backgroundPosition: "center 60%",
          backgroundRepeat: "no-repeat",
        }}
      />
      {/* Dark gradient overlay for text legibility */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center justify-between min-h-screen px-6 py-8">
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
              <span className="text-cyan-400 font-medium" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>Stroke</span>
              <span className="text-slate-300 font-medium" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>Cycle</span>
            </div>
            <div className="h-4 rounded-full bg-black/30 overflow-hidden border border-white/10">
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

      {/* Countdown overlay */}
      {isCountingDown && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none">
          <div
            key={countdown}
            className="text-9xl font-bold text-white tabular-nums animate-countdown-pop"
            style={{ textShadow: "0 4px 24px rgba(0,0,0,0.8)" }}
          >
            {countdownLabel}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div
        className="text-3xl font-bold text-white tabular-nums"
        style={{ textShadow: "0 1px 4px rgba(0,0,0,0.7)" }}
      >
        {value}
      </div>
      <div
        className="text-xs uppercase tracking-widest text-slate-200 mt-1"
        style={{ textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}
      >
        {label}
      </div>
    </div>
  );
}
