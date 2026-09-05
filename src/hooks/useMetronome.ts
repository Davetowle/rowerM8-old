import { useCallback, useEffect, useRef, useState } from "react";
import { playBeep } from "@/lib/audio";

export type MetronomeState = "idle" | "countdown" | "running";

export function useMetronome() {
  const [spm, setSpm] = useState(24);
  const [state, setState] = useState<MetronomeState>("idle");
  const [strokeCount, setStrokeCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [phase, setPhase] = useState(0);
  const [countdown, setCountdown] = useState(0);

  const spmRef = useRef(spm);
  const stateRef = useRef(state);
  const rafRef = useRef<number | null>(null);
  const cycleStartRef = useRef(0);
  const elapsedStartRef = useRef(0);
  const elapsedAccumRef = useRef(0);
  const countdownStartRef = useRef(0);
  const lastCountdownRef = useRef(0);
  const onCountdownBeepRef = useRef<((value: number) => void) | null>(null);
  const onRunningRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    spmRef.current = spm;
  }, [spm]);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Stable forever — all mutable state read via refs to avoid stale closures.
  const tick = useCallback(() => {
    rafRef.current = requestAnimationFrame(tick);
    if (stateRef.current === "idle") return;

    try {
      const now = performance.now();

      // --- Countdown phase (3 seconds: "3", "2", "1", then "row") ---
      if (stateRef.current === "countdown") {
        const elapsedCountdown = (now - countdownStartRef.current) / 1000;
        const remaining = 3 - elapsedCountdown;

        if (remaining <= 0) {
          setState("running");
          stateRef.current = "running";
          setCountdown(0);
          lastCountdownRef.current = 0;
          cycleStartRef.current = now;
          elapsedStartRef.current = now;
          elapsedAccumRef.current = 0;
          setElapsed(0);
          setStrokeCount(0);
          setPhase(0);
          onCountdownBeepRef.current?.(0);
          onRunningRef.current?.();
        } else {
          const cdValue = Math.ceil(remaining);
          if (cdValue !== lastCountdownRef.current && cdValue >= 1 && cdValue <= 3) {
            lastCountdownRef.current = cdValue;
            setCountdown(cdValue);
            onCountdownBeepRef.current?.(cdValue);
          }
        }
        return;
      }

      // --- Running phase ---
      const cycleDur = 60000 / spmRef.current;

      setElapsed(elapsedAccumRef.current + (now - elapsedStartRef.current) / 1000);

      const elapsedInCycle = now - cycleStartRef.current;

      if (elapsedInCycle >= cycleDur) {
        cycleStartRef.current += cycleDur;
        if (now - cycleStartRef.current > cycleDur) {
          cycleStartRef.current = now;
        }
        setStrokeCount((c) => c + 1);
        playBeep();
        setPhase(0);
      }

      setPhase(Math.min(1, elapsedInCycle / cycleDur));
    } catch (err) {
      console.error("[metronome] tick error (loop continues):", err);
    }
  }, []);

  const start = useCallback(
    (onCountdownBeep?: (value: number) => void, onRunning?: () => void) => {
      const now = performance.now();
      countdownStartRef.current = now;
      lastCountdownRef.current = 3;
      setCountdown(3);
      setState("countdown");
      stateRef.current = "countdown";
      setElapsed(0);
      setStrokeCount(0);
      setPhase(0);
      onCountdownBeepRef.current = onCountdownBeep ?? null;
      onRunningRef.current = onRunning ?? null;
      onCountdownBeep?.(3);
      rafRef.current = requestAnimationFrame(tick);
    },
    [tick],
  );

  const stop = useCallback(() => {
    setState("idle");
    stateRef.current = "idle";
    setCountdown(0);
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    elapsedAccumRef.current += (performance.now() - elapsedStartRef.current) / 1000;
  }, []);

  const adjustSpm = useCallback((delta: number): number => {
    const next = Math.max(16, Math.min(40, spmRef.current + delta));
    spmRef.current = next;
    setSpm(next);
    return next;
  }, []);

  useEffect(() => {
    return () => {
      stateRef.current = "idle";
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return {
    spm,
    setSpm,
    adjustSpm,
    state,
    running: state === "running",
    countdown,
    start,
    stop,
    strokeCount,
    elapsed,
    phase,
  };
}
