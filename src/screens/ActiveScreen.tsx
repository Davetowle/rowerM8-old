import { SpmControl } from "@/components/SpmControl";
import { formatTime, formatPace } from "@/lib/format";
import type { MetronomeState } from "@/hooks/useMetronome";

interface Props {
  spm: number;
  onAdjust: (delta: number) => void;
  strokeCount: number;
  elapsed: number;
  countdown: number;
  metronomeState: MetronomeState;
  metersPerStroke: number;
  onStop: () => void;
}

export function ActiveScreen({
  spm,
  onAdjust,
  strokeCount,
  elapsed,
  countdown,
  metronomeState,
  metersPerStroke,
  onStop,
}: Props) {
  const isCountingDown = metronomeState === "countdown";
  const countdownLabel = countdown > 0 ? String(countdown) : "ROW";
  const distance = strokeCount * metersPerStroke;
  const pace = formatPace(distance, elapsed);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Full-bleed background image */}
      <img
        src="./5UW1MINSS46bsTii1EQBAa2EmoY0i2Roda_kRTVDeNRabPKqVo5Tj8WDWfpfNYPQZ0yDMGG8TBHaA3Ge.jpg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ objectPosition: "center 60%" }}
      />
      {/* Dark gradient overlay for text legibility */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* UI content layer */}
      <div className="relative z-10 flex flex-col items-center justify-between min-h-screen px-safe-6 pt-safe-8 pb-safe-8">
        {/* Top stats */}
        <div className="w-full flex justify-center gap-8 sm:gap-16">
          <Stat label="Time" value={formatTime(elapsed)} />
          <div className="w-px bg-white/10" />
          <Stat label="Strokes" value={strokeCount.toString()} />
          <div className="w-px bg-white/10" />
          <Stat label="Pace /500m" value={pace} />
        </div>

        {/* Center: stroke pulse dot + SPM */}
        <div className="flex flex-col items-center gap-10 w-full">
          <div className="h-10 flex items-center justify-center">
            <div
              key={strokeCount}
              className="h-3 w-3 rounded-full bg-slate-700 animate-stroke-pulse"
            />
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
