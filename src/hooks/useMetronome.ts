import { useCallback, useEffect, useRef, useState } from "react";
import { playBeep } from "@/lib/audio";

/**
 * Simple stroke-rate metronome: one beep per stroke at the given SPM.
 *
 * `phase` goes 0→1 across each stroke cycle so the UI bar can animate.
 *
 * A countdown phase ("3, 2, 1, row") runs before the metronome starts
 * ticking, giving the rower time to get into position.
 */
export type MetronomeState = "idle" | "countdown" | "running";

export function useMetronome() {
  const [spm, setSpm] = useState(24);
  const [state, setState] = useState<MetronomeState>("idle");
  const [strokeCount, setStrokeCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [phase, setPhase] = useState(0); // 0..1
  const [countdown, setCountdown] = useState(0); // 3,2,1,0 (0 = "row")

  const spmRef = useRef(spm);
  const stateRef = useRef(state);
  const rafRef = useRef<number | null>(null);
  const cycleStartRef = useRef(0);
  const elapsedStartRef = useRef(0);
  const elapsedAccumRef = useRef(0);
  const countdownStartRef = useRef(0);

  useEffect(() => {
    spmRef.current = spm;
  }, [spm]);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const tick = useCallback(() => {
    // Schedule next frame FIRST so the loop survives any error below.
    rafRef.current = requestAnimationFrame(tick);

    if (stateRef.current === "idle") return;

    console.log("[metronome] tick", {
      spm: spmRef.current,
      state: stateRef.current,
    });

    try {
      const now = performance.now();

      // --- Countdown phase ---
      if (stateRef.current === "countdown") {
        const elapsedCountdown = (now - countdownStartRef.current) / 1000;
        const remaining = 4 - elapsedCountdown; // 4 seconds total (3,2,1,row)

        if (remaining <= 0) {
          // Countdown finished — start the metronome
          setState("running");
          stateRef.current = "running";
          setCountdown(0);
          cycleStartRef.current = now;
          elapsedStartRef.current = now;
          elapsedAccumRef.current = 0;
          setElapsed(0);
          setStrokeCount(0);
          setPhase(0);
          console.log("[metronome] countdown done — metronome running");
        } else {
          const cdValue = Math.ceil(remaining);
          if (cdValue !== countdown) {
            setCountdown(cdValue);
            console.log("[metronome] countdown", cdValue);
          }
        }
        return;
      }

      // --- Running phase ---
      const cycleDur = 60000 / spmRef.current; // ms

      // Elapsed time
      setElapsed(elapsedAccumRef.current + (now - elapsedStartRef.current) / 1000);

      const elapsedInCycle = now - cycleStartRef.current;

      if (elapsedInCycle >= cycleDur) {
        // New stroke — single beep
        cycleStartRef.current += cycleDur;
        if (now - cycleStartRef.current > cycleDur) {
          cycleStartRef.current = now;
        }
        setStrokeCount((c) => c + 1);
        console.log("[metronome] beep, stroke", strokeCount + 1);
        playBeep();
        setPhase(0);
      }

      // Phase: 0→1 across the stroke cycle
      setPhase(Math.min(1, elapsedInCycle / cycleDur));
    } catch (err) {
      console.error("[metronome] tick error (loop continues):", err);
    }
  }, [countdown]);

  /**
   * Start the countdown. The metronome begins ticking after "3, 2, 1, row".
   * `onCountdownBeep` is called for each countdown step so the caller can
   * play a voice or beep.
   */
  const start = useCallback(
    (onCountdownBeep?: (value: number) => void) => {
      const now = performance.now();
      countdownStartRef.current = now;
      setCountdown(3);
      setState("countdown");
      stateRef.current = "countdown";
      setElapsed(0);
      setStrokeCount(0);
      setPhase(0);
      console.log("[metronome] countdown started");
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
    let next = 0;
    setSpm((s) => {
      next = Math.max(16, Math.min(40, s + delta));
      return next;
    });
    spmRef.current = next;
    return next;
  }, []);

  // Cleanup on unmount
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
