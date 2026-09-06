import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Ship, Play, RotateCcw } from "lucide-react";
import { SpmControl } from "@/components/SpmControl";
import { useMetronome } from "@/hooks/useMetronome";
import { unlockAudio } from "@/lib/audio";
import { speak, stopSpeaking } from "@/lib/speech";
import { formatTime } from "@/lib/format";

const TARGET_METERS = 500;

interface Props {
  onBack: () => void;
  metersPerStroke: number;
}

export function StrokeEstimatorScreen({ onBack, metersPerStroke }: Props) {
  const metro = useMetronome();
  const [complete, setComplete] = useState(false);
  const completedRef = useRef(false);
  const spmHistoryRef = useRef<number[]>([]);

  const distance = Math.min(metro.strokeCount * metersPerStroke, TARGET_METERS);
  const progress = Math.min(distance / TARGET_METERS, 1);

  const announceRate = useCallback((spm: number) => {
    speak(`${spm} strokes per minute`);
  }, []);

  // Auto-stop when distance reaches 500m
  useEffect(() => {
    if (metro.running && metro.strokeCount * metersPerStroke >= TARGET_METERS && !completedRef.current) {
      completedRef.current = true;
      metro.stop();
      stopSpeaking();
      setComplete(true);
    }
  }, [metro.strokeCount, metro.running, metro]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  function handleStart() {
    unlockAudio();
    completedRef.current = false;
    setComplete(false);
    spmHistoryRef.current = [metro.spm];
    metro.start();
    announceRate(metro.spm);
  }

  function handleReset() {
    metro.stop();
    stopSpeaking();
    completedRef.current = false;
    setComplete(false);
    metro.start();
    spmHistoryRef.current = [metro.spm];
    announceRate(metro.spm);
  }

  function handleAdjust(delta: number) {
    const newSpm = metro.adjustSpm(delta);
    spmHistoryRef.current.push(newSpm);
    if (metro.running) {
      announceRate(newSpm);
    }
  }

  return (
    <div className="flex flex-col min-h-screen px-6 py-8 bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => {
            metro.stop();
            stopSpeaking();
            onBack();
          }}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <span className="font-bold text-white tracking-tight">Stroke Estimator</span>
      </div>

      {/* Stats row */}
      <div className="flex justify-center gap-8 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-white tabular-nums">
            {distance}<span className="text-sm text-slate-400 ml-1">m</span>
          </div>
          <div className="text-[10px] uppercase tracking-widest text-slate-500 mt-0.5">Distance</div>
        </div>
        <div className="w-px bg-white/10" />
        <div className="text-center">
          <div className="text-2xl font-bold text-white tabular-nums">
            {TARGET_METERS}<span className="text-sm text-slate-400 ml-1">m</span>
          </div>
          <div className="text-[10px] uppercase tracking-widest text-slate-500 mt-0.5">Target</div>
        </div>
        <div className="w-px bg-white/10" />
        <div className="text-center">
          <div className="text-2xl font-bold text-white tabular-nums">{metro.strokeCount}</div>
          <div className="text-[10px] uppercase tracking-widest text-slate-500 mt-0.5">Strokes</div>
        </div>
      </div>

      {/* Race lane */}
      <div className="mb-8">
        <div className="relative h-16 rounded-2xl bg-slate-800/60 border border-white/5 overflow-hidden">
          {/* Lane markings */}
          <div className="absolute inset-0 flex items-center">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex-1 border-r border-white/5 last:border-r-0"
              />
            ))}
          </div>
          {/* Progress fill */}
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500/20 to-cyan-400/20 transition-[width] duration-100 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
          {/* Boat marker */}
          <div
            className="absolute top-1/2 -translate-y-1/2 transition-[left] duration-100 ease-linear"
            style={{ left: `calc(${progress * 100}% - 16px)` }}
          >
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-cyan-500 shadow-lg shadow-cyan-500/40">
              <Ship size={18} className="text-slate-950" />
            </div>
          </div>
          {/* Finish line */}
          <div className="absolute inset-y-0 right-0 w-0.5 bg-cyan-300/40" />
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-500 tabular-nums">
          <span>0m</span>
          <span>{Math.round(TARGET_METERS / 4)}m</span>
          <span>{TARGET_METERS / 2}m</span>
          <span>{Math.round(TARGET_METERS * 3 / 4)}m</span>
          <span>{TARGET_METERS}m</span>
        </div>
      </div>

      {/* Phase bar (reused concept from ActiveScreen) */}
      {metro.running && !complete && (
        <div className="w-full max-w-xs mx-auto mb-8">
          <div className="flex justify-between text-xs uppercase tracking-widest mb-2">
            <span className="text-cyan-400 font-medium">Drive</span>
            <span className="text-slate-500 font-medium">Recovery</span>
          </div>
          <div className="h-4 rounded-full bg-slate-800 overflow-hidden border border-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-300 transition-[width] duration-75 ease-linear"
              style={{ width: `${Math.round(metro.phase * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* SPM control */}
      {!complete && !metro.running && (
        <div className="flex-1 flex flex-col items-center justify-center gap-8">
          <p className="text-slate-400 text-sm tracking-wide text-center max-w-xs">
            Set your target stroke rate, then start. Each stroke counts as {metersPerStroke.toFixed(1)}m — reach {TARGET_METERS}m to finish.
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

      {/* Live SPM during run */}
      {metro.running && !complete && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <SpmControl spm={metro.spm} onAdjust={handleAdjust} size="lg" />
          <div className="text-center">
            <div className="text-3xl font-bold text-white tabular-nums">{formatTime(metro.elapsed)}</div>
            <div className="text-xs uppercase tracking-widest text-slate-500 mt-1">Elapsed</div>
          </div>
        </div>
      )}

      {/* Complete message */}
      {complete && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
          <div className="flex items-center justify-center h-20 w-20 rounded-3xl bg-cyan-500/10 border border-cyan-400/20">
            <Ship size={36} className="text-cyan-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Piece complete!</h2>
            <p className="mt-1 text-sm text-slate-400">
              {TARGET_METERS}m in {metro.strokeCount} strokes
            </p>
            <p className="mt-0.5 text-sm text-slate-400">
              Total time: {formatTime(metro.elapsed)}
            </p>
          </div>
          <div className="w-full max-w-sm flex flex-col gap-3">
            <button
              onClick={handleReset}
              className="w-full py-5 rounded-2xl bg-cyan-500 text-slate-950 text-lg font-bold tracking-wide
                         shadow-lg shadow-cyan-500/30 transition-all hover:bg-cyan-400 active:scale-[0.98]
                         flex items-center justify-center gap-2"
            >
              <RotateCcw size={20} />
              Go Again
            </button>
            <button
              onClick={() => {
                metro.stop();
                stopSpeaking();
                onBack();
              }}
              className="w-full py-4 rounded-2xl bg-white/5 text-white text-sm font-medium
                         border border-white/10 transition-all hover:bg-white/10 active:scale-[0.98]"
            >
              Back to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
