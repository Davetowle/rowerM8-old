import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, Minus, Plus, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabase";

const DEFAULT_DPS = 7.0;
const DEFAULT_RATE = 24;
const DPS_MIN = 1;
const DPS_MAX = 14;
const RATE_MIN = 14;
const RATE_MAX = 44;

interface Tier {
  label: string;
  range: [number, number];
  description: string;
}

const TIERS: Tier[] = [
  { label: "Child", range: [1, 2], description: "Small child, first time in a boat" },
  { label: "Coached child", range: [2, 3.5], description: "Child with some coaching" },
  { label: "Beginner", range: [3.5, 5], description: "Untrained adult beginner" },
  { label: "Recreational", range: [5, 7], description: "Recreational adult" },
  { label: "Club", range: [7, 9], description: "Club / collegiate competitive" },
  { label: "Race pace", range: [9, 10.5], description: "Elite, race pace" },
  { label: "Max efficiency", range: [10.5, 14], description: "Elite, low-rate max efficiency" },
];

function getTier(dps: number): Tier {
  for (const t of TIERS) {
    if (dps <= t.range[1]) return t;
  }
  return TIERS[TIERS.length - 1];
}

function formatSplit(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = Math.floor(totalSec % 60);
  const tenths = Math.floor((totalSec * 10) % 10);
  return `${m}:${s.toString().padStart(2, "0")}.${tenths}`;
}

interface Props {
  onBack: () => void;
}

export function DpsScreen({ onBack }: Props) {
  const [dps, setDps] = useState(DEFAULT_DPS);
  const [strokeRate, setStrokeRate] = useState(DEFAULT_RATE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const saveTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase
          .from("user_settings")
          .select("meters_per_stroke")
          .maybeSingle();

        if (error) {
          console.error("[dps] load error:", error.message);
        } else if (data?.meters_per_stroke != null) {
          setDps(Number(data.meters_per_stroke));
        }
      } catch (err) {
        console.error("[dps] load threw:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const tier = useMemo(() => getTier(dps), [dps]);

  const boatSpeed = useMemo(() => (dps * strokeRate) / 60, [dps, strokeRate]);
  const splitSec = useMemo(() => (boatSpeed > 0 ? 500 / boatSpeed : 0), [boatSpeed]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaved(false);
    try {
      const { error } = await supabase
        .from("user_settings")
        .upsert({ meters_per_stroke: dps });

      if (error) {
        console.error("[dps] save error:", error.message);
      } else {
        setSaved(true);
        if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = window.setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error("[dps] save threw:", err);
    } finally {
      setSaving(false);
    }
  }, [dps]);

  const adjustRate = useCallback((delta: number) => {
    setStrokeRate((r) => Math.max(RATE_MIN, Math.min(RATE_MAX, r + delta)));
  }, []);

  const totalScale = DPS_MAX - DPS_MIN;

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
        <span className="font-bold text-white tracking-tight">Rate Your Stroke</span>
      </div>

      <p className="text-sm text-slate-400 text-center mb-8 max-w-sm mx-auto">
        Your distance-per-stroke calibrates how the app estimates total distance from stroke count
        when no GPS sensor is connected.
      </p>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      ) : (
        <>
          {/* Big numeric readout */}
          <div className="text-center mb-2">
            <div className="text-7xl font-bold text-white tabular-nums tracking-tight">
              {dps.toFixed(1)}
              <span className="text-3xl text-slate-500 ml-2 font-normal">m</span>
            </div>
            <p className="text-sm text-cyan-400 font-medium mt-2 transition-all">
              {tier.description}
            </p>
          </div>

          {/* Slider */}
          <div className="w-full max-w-sm mx-auto mt-6 mb-4">
            <input
              type="range"
              min={DPS_MIN}
              max={DPS_MAX}
              step={0.1}
              value={dps}
              onChange={(e) => setDps(parseFloat(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-700
                         [&::-webkit-slider-thumb]:appearance-none
                         [&::-webkit-slider-thumb]:w-7
                         [&::-webkit-slider-thumb]:h-7
                         [&::-webkit-slider-thumb]:rounded-full
                         [&::-webkit-slider-thumb]:bg-cyan-400
                         [&::-webkit-slider-thumb]:shadow-lg
                         [&::-webkit-slider-thumb]:shadow-cyan-500/40
                         [&::-webkit-slider-thumb]:cursor-grab
                         [&::-webkit-slider-thumb]:border-2
                         [&::-webkit-slider-thumb]:border-slate-950
                         [&::-moz-range-thumb]:w-7
                         [&::-moz-range-thumb]:h-7
                         [&::-moz-range-thumb]:rounded-full
                         [&::-moz-range-thumb]:bg-cyan-400
                         [&::-moz-range-thumb]:border-2
                         [&::-moz-range-thumb]:border-slate-950
                         [&::-moz-range-thumb]:cursor-grab"
            />

            {/* Tick marks at each category position */}
            <div className="relative mt-3 h-3">
              {TIERS.map((t) => {
                const center = (t.range[0] + t.range[1]) / 2;
                const leftPct = ((center - DPS_MIN) / totalScale) * 100;
                return (
                  <div
                    key={t.label}
                    className="absolute top-0 w-px h-3 bg-slate-600"
                    style={{ left: `${leftPct}%` }}
                  />
                );
              })}
            </div>
          </div>

          {/* Stroke rate stepper */}
          <div className="w-full max-w-sm mx-auto mt-8 mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs uppercase tracking-widest text-slate-500">
                Stroke Rate
              </label>
              <span className="text-xs text-slate-600">strokes/min</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => adjustRate(-1)}
                disabled={strokeRate <= RATE_MIN}
                className="flex items-center justify-center h-11 w-11 rounded-xl bg-slate-800 text-slate-300
                           border border-white/10 transition-all hover:bg-slate-700 hover:text-white
                           active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Minus size={20} />
              </button>
              <div className="flex-1 text-center">
                <span className="text-4xl font-bold text-white tabular-nums">{strokeRate}</span>
              </div>
              <button
                onClick={() => adjustRate(1)}
                disabled={strokeRate >= RATE_MAX}
                className="flex items-center justify-center h-11 w-11 rounded-xl bg-slate-800 text-slate-300
                           border border-white/10 transition-all hover:bg-slate-700 hover:text-white
                           active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* Live readout panel */}
          <div className="w-full max-w-sm mx-auto rounded-2xl bg-slate-900 border border-cyan-500/20 p-5 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-400 tabular-nums font-mono">
                  {boatSpeed.toFixed(2)}
                </div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">
                  Boat Speed (m/s)
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-400 tabular-nums font-mono">
                  {boatSpeed > 0 ? formatSplit(splitSec) : "--:--.-"}
                </div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">
                  Split / 500m
                </div>
              </div>
            </div>
          </div>

          {/* Save button */}
          <div className="w-full max-w-sm mx-auto">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-5 rounded-2xl bg-cyan-500 text-slate-950 text-lg font-bold tracking-wide
                         shadow-lg shadow-cyan-500/30 transition-all hover:bg-cyan-400 active:scale-[0.98]
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
            >
              {saving ? (
                "SAVING..."
              ) : saved ? (
                <>
                  <Check size={20} />
                  SAVED
                </>
              ) : (
                "USE THIS NUMBER"
              )}
            </button>

            {saved && (
              <p className="text-center text-sm text-cyan-400 mt-3 animate-in fade-in">
                {dps.toFixed(1)} m/stroke saved to your profile.
              </p>
            )}
          </div>

          {/* Collapsible footnote */}
          <div className="w-full max-w-sm mx-auto mt-8">
            <button
              onClick={() => setShowInfo((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-400 transition-colors"
            >
              <ChevronDown
                size={14}
                className={`transition-transform ${showInfo ? "rotate-180" : ""}`}
              />
              Why this matters
            </button>
            {showInfo && (
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                This estimate assumes flat water, no wind, and a single scull. Real conditions —
                current, headwind, boat type, rigging — all shift the actual distance per stroke.
                Use this as a starting point and refine as you gain experience.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
