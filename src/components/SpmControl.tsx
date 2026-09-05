import { Minus, Plus } from "lucide-react";

interface Props {
  spm: number;
  onAdjust: (delta: number) => void;
  size?: "lg" | "xl";
}

export function SpmControl({ spm, onAdjust, size = "xl" }: Props) {
  const numSize = size === "xl" ? "text-8xl" : "text-7xl";
  const btnSize = size === "xl" ? "w-20 h-20" : "w-16 h-16";
  const iconSize = size === "xl" ? 36 : 28;

  return (
    <div className="flex items-center justify-center gap-6 sm:gap-10">
      <button
        onClick={() => onAdjust(-1)}
        disabled={spm <= 16}
        className={`${btnSize} rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white transition-all hover:bg-white/20 active:scale-90 disabled:opacity-30 disabled:active:scale-100`}
        aria-label="Decrease stroke rate"
      >
        <Minus size={iconSize} />
      </button>

      <div className="text-center">
        <div
          className={`${numSize} font-bold text-white tabular-nums leading-none`}
          style={{ textShadow: "0 2px 8px rgba(0,0,0,0.7)" }}
        >
          {spm}
        </div>
        <div
          className="text-sm font-medium text-cyan-300/90 tracking-widest uppercase mt-2"
          style={{ textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}
        >
          SPM
        </div>
      </div>

      <button
        onClick={() => onAdjust(1)}
        disabled={spm >= 40}
        className={`${btnSize} rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white transition-all hover:bg-white/20 active:scale-90 disabled:opacity-30 disabled:active:scale-100`}
        aria-label="Increase stroke rate"
      >
        <Plus size={iconSize} />
      </button>
    </div>
  );
}
