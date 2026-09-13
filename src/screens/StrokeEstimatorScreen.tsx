import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Ship, Play, Minus, Plus } from "lucide-react";
import { SpmControl } from "@/components/SpmControl";
import { SummaryScreen } from "@/screens/SummaryScreen";
import { useMetronome } from "@/hooks/useMetronome";
import { unlockAudio, startSilentLoop, stopSilentLoop } from "@/lib/audio";
import { speak, stopSpeaking } from "@/lib/speech";
import { formatTime } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import type { SessionRecord } from "@/types";

const DEFAULT_TARGET = 500;
const DISTANCE_MIN = 100;
const DISTANCE_MAX = 10000;
const DISTANCE_STEP = 50;
const QUICK_TARGETS = [500, 2000];
const PACE_WINDOW_STROKES = 5;
const PACE_UPDATE_INTERVAL_MS = 10_000;

function floorTo1(value: number): number {
  return Math.floor(Math.round(value * 100) / 10) / 10;
}

function formatPaceFromSec(paceSec: number): string {
  if (!isFinite(paceSec) || paceSec <= 0) return "--:--";
  const m = Math.floor(paceSec / 60);
  const s = Math.floor(paceSec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type EstimatorPhase = "idle" | "running" | "summary";

interface Props {
  onBack: () => void;
  metersPerStroke: number;
  confirmDiscard: boolean;
  setConfirmDiscard: (v: boolean) => void;
}

export function StrokeEstimatorScreen({ onBack, metersPerStroke, confirmDiscard, setConfirmDiscard }: Props) {
  const metro = useMetronome();
  const [targetMeters, setTargetMeters] = useState(DEFAULT_TARGET);
  const [phase, setPhase] = useState<EstimatorPhase>("idle");
  const completedRef = useRef(false);
  const spmHistoryRef = useRef<number[]>([]);
  const lastStrokeTsRef = useRef(0);
  const strokePaceBufferRef = useRef<number[]>([]);
  const lastPaceDisplayUpdateRef = useRef(0);
  const [smoothedPace, setSmoothedPace] = useState("--:--");
  const [lastSession, setLastSession] = useState<SessionRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const sessionStartRef = useRef(0);

  const distance = Math.min(metro.strokeCount * metersPerStroke, targetMeters);
  const progress = Math.min(distance / targetMeters, 1);

  const announceRate = useCallback((spm: number) => {
    speak(`${spm} strokes per minute`);
  }, []);

  const handleStop = useCallback(() => {
    metro.stop();
    stopSpeaking();
    stopSilentLoop();
    const avgSpm =
      spmHistoryRef.current.length > 0
        ? Math.round(
            spmHistoryRef.current.reduce((a, b) => a + b, 0) /
              spmHistoryRef.current.length
          )
        : metro.spm;
    const now = Date.now();
    setLastSession({
      id: crypto.randomUUID(),
      date: now,
      durationSec: Math.round(metro.elapsed),
      avgSpm,
      strokeCount: metro.strokeCount,
    });
    setPhase("summary");
  }, [metro]);

  // Auto-stop when distance reaches target
  useEffect(() => {
    if (metro.running && metro.strokeCount * metersPerStroke >= targetMeters && !completedRef.current) {
      completedRef.current = true;
      handleStop();
    }
  }, [metro.strokeCount, metro.running, metro, targetMeters, handleStop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      stopSilentLoop();
    };
  }, []);

  // Per-stroke best pace — display updates at most every 10 seconds
  useEffect(() => {
    if (!metro.running || phase !== "running") return;
    if (metro.strokeCount === 0) return;

    const now = Date.now();

    if (lastStrokeTsRef.current > 0) {
      const cycleDurSec = (now - lastStrokeTsRef.current) / 1000;
      if (cycleDurSec > 0 && metersPerStroke > 0) {
        const paceSec = (500 / metersPerStroke) * cycleDurSec;
        strokePaceBufferRef.current.push(paceSec);
        if (strokePaceBufferRef.current.length > PACE_WINDOW_STROKES) {
          strokePaceBufferRef.current.shift();
        }
      }
    }
    lastStrokeTsRef.current = now;

    if (strokePaceBufferRef.current.length < PACE_WINDOW_STROKES) return;

    const bestPace = Math.min(...strokePaceBufferRef.current);

    if (lastPaceDisplayUpdateRef.current === 0 || now - lastPaceDisplayUpdateRef.current >= PACE_UPDATE_INTERVAL_MS) {
      setSmoothedPace(formatPaceFromSec(bestPace));
      lastPaceDisplayUpdateRef.current = now;
    }
  }, [metro.strokeCount, metro.running, phase, metersPerStroke]);

  function handleStart() {
    unlockAudio();
    startSilentLoop();
    completedRef.current = false;
    spmHistoryRef.current = [metro.spm];
    lastStrokeTsRef.current = 0;
    strokePaceBufferRef.current = [];
    lastPaceDisplayUpdateRef.current = 0;
    setSmoothedPace("--:--");
    sessionStartRef.current = Date.now();
    setPhase("running");
    metro.start();
    announceRate(metro.spm);
  }

  function adjustDistance(delta: number) {
    setTargetMeters((d) => Math.max(DISTANCE_MIN, Math.min(DISTANCE_MAX, d + delta)));
  }

  function handleAdjust(delta: number) {
    const newSpm = metro.adjustSpm(delta);
    spmHistoryRef.current.push(newSpm);
    if (metro.running) {
      announceRate(newSpm);
    }
  }

  async function handleSaveSession() {
    if (!lastSession) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("sessions").insert({
        start_time: new Date(sessionStartRef.current).toISOString(),
        end_time: new Date(lastSession.date).toISOString(),
        duration_sec: lastSession.durationSec,
        spm: lastSession.avgSpm,
        stroke_count: lastSession.strokeCount,
      });
      if (error) console.error("[sessions] insert failed:", error.message);
    } catch (err) {
      console.error("[sessions] insert threw:", err);
    } finally {
      setSaving(false);
      setLastSession(null);
      setConfirmDiscard(false);
      setPhase("idle");
    }
  }

  function handleDiscardSession() {
    setLastSession(null);
    setConfirmDiscard(false);
    setPhase("idle");
  }

  function handleBack() {
    metro.stop();
    stopSpeaking();
    stopSilentLoop();
    onBack();
  }

  if (phase === "summary" && lastSession) {
    return (
      <SummaryScreen
        session={lastSession}
        saving={saving}
        onSave={handleSaveSession}
        onDiscard={handleDiscardSession}
        metersPerStroke={metersPerStroke}
        confirmDiscard={confirmDiscard}
        setConfirmDiscard={setConfirmDiscard}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen px-safe-6 pt-safe-8 pb-safe-8 bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <span className="font-bold text-white tracking-tight">Stroke Estimator</span>
      </div>

      {/* Stats row */}
      <div className="flex justify-center gap-6 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-white tabular-nums">
            {floorTo1(distance).toFixed(1)}<span className="text-sm text-slate-400 ml-1">m</span>
          </div>
          <div className="text-[10px] uppercase tracking-widest text-slate-500 mt-0.5">Distance</div>
        </div>
        <div className="w-px bg-white/10" />
        <div className="text-center">
          <div className="text-2xl font-bold text-white tabular-nums">
            {targetMeters}<span className="text-sm text-slate-400 ml-1">m</span>
          </div>
          <div className="text-[10px] uppercase tracking-widest text-slate-500 mt-0.5">Target</div>
        </div>
        <div className="w-px bg-white/10" />
        <div className="text-center">
          <div className="text-2xl font-bold text-white tabular-nums">{metro.strokeCount}</div>
          <div className="text-[10px] uppercase tracking-widest text-slate-500 mt-0.5">Strokes</div>
        </div>
        <div className="w-px bg-white/10" />
        <div className="text-center">
          <div className="text-2xl font-bold text-cyan-400 tabular-nums">
            {smoothedPace}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-slate-500 mt-0.5">Pace /500m</div>
        </div>
      </div>

      {/* Race lane */}
      <div className="mb-8">
        <div className="relative h-16 rounded-2xl bg-slate-800/60 border border-white/5 overflow-hidden">
          <div className="absolute inset-0 flex items-center">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex-1 border-r border-white/5 last:border-r-0" />
            ))}
          </div>
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500/20 to-cyan-400/20 transition-[width] duration-100 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 transition-[left] duration-100 ease-linear"
            style={{ left: `calc(${progress * 100}% - 16px)` }}
          >
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-cyan-500 shadow-lg shadow-cyan-500/40">
              <Ship size={18} className="text-slate-950" />
            </div>
          </div>
          <div className="absolute inset-y-0 right-0 w-0.5 bg-cyan-300/40" />
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-500 tabular-nums">
          <span>0m</span>
          <span>{Math.round(targetMeters / 4)}m</span>
          <span>{targetMeters / 2}m</span>
          <span>{Math.round(targetMeters * 3 / 4)}m</span>
          <span>{targetMeters}m</span>
        </div>
      </div>

      {/* Stroke pulse dot during running */}
      {phase === "running" && (
        <div className="h-20 flex items-center justify-center mb-8">
          <div
            key={metro.strokeCount}
            className="h-16 w-16 rounded-full bg-slate-700 animate-stroke-pulse"
          />
        </div>
      )}

      {/* Idle: Distance selector + SPM control + Start */}
      {phase === "idle" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <div className="w-full max-w-sm">
            <label className="text-xs uppercase tracking-widest text-slate-500 mb-3 block text-center">
              Target Distance
            </label>
            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={() => adjustDistance(-DISTANCE_STEP)}
                disabled={targetMeters <= DISTANCE_MIN}
                className="flex items-center justify-center h-11 w-11 rounded-xl bg-slate-800 text-slate-300
                           border border-white/10 transition-all hover:bg-slate-700 hover:text-white
                           active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
              >
                <Minus size={20} />
              </button>
              <div className="flex-1 text-center">
                <span className="text-4xl font-bold text-white tabular-nums">{targetMeters}</span>
                <span className="text-lg text-slate-500 ml-1">m</span>
              </div>
              <button
                onClick={() => adjustDistance(DISTANCE_STEP)}
                disabled={targetMeters >= DISTANCE_MAX}
                className="flex items-center justify-center h-11 w-11 rounded-xl bg-slate-800 text-slate-300
                           border border-white/10 transition-all hover:bg-slate-700 hover:text-white
                           active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
              >
                <Plus size={20} />
              </button>
            </div>
            <div className="flex gap-2">
              {QUICK_TARGETS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTargetMeters(t)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95
                              ${targetMeters === t
                                ? "bg-cyan-500/15 border border-cyan-400/30 text-cyan-400"
                                : "bg-slate-800 border border-white/10 text-slate-400 hover:bg-slate-700 hover:text-white"}`}
                >
                  {t >= 1000 ? `${t / 1000}K` : `${t}m`}
                </button>
              ))}
            </div>
          </div>

          <p className="text-slate-400 text-sm tracking-wide text-center max-w-xs">
            Set your target stroke rate, then start. Each stroke counts as {metersPerStroke.toFixed(1)}m — reach {targetMeters}m to finish.
          </p>
          <SpmControl spm={metro.spm} onAdjust={handleAdjust} size="lg" />
          <div className="w-full max-w-sm">
            <button
              onClick={handleStart}
              className="w-full py-5 rounded-2xl bg-cyan-500 text-slate-950 text-lg font-bold tracking-wide
                         shadow-lg shadow-cyan-500/30 transition-all hover:bg-cyan-400 active:scale-[0.98]
                         flex items-center justify-center gap-2"
            >
              <Play size={20} />
              START
            </button>
          </div>
        </div>
      )}

      {/* Running: SPM control + stats + Stop */}
      {phase === "running" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <SpmControl spm={metro.spm} onAdjust={handleAdjust} size="lg" />
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-white tabular-nums">{formatTime(metro.elapsed)}</div>
              <div className="text-xs uppercase tracking-widest text-slate-500 mt-1">Elapsed</div>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-400 tabular-nums">
                {smoothedPace}
              </div>
              <div className="text-xs uppercase tracking-widest text-slate-500 mt-1">Pace /500m</div>
            </div>
          </div>
          <div className="w-full max-w-sm">
            <button
              onClick={handleStop}
              className="w-full py-5 rounded-2xl bg-red-500/90 text-white text-lg font-bold tracking-wide
                         shadow-lg shadow-red-500/20 transition-all hover:bg-red-500 active:scale-[0.98]"
            >
              STOP
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
