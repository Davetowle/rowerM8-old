import { useCallback, useEffect, useRef, useState } from "react";
import { playBeep } from "@/lib/audio";

/**
 * Drives the 2:1 drive:recovery stroke cycle.
 *
 * At a given SPM, one full cycle = 60/SPM seconds.
 * Drive = cycle/3, Recovery = cycle*2/3 (2:1 ratio).
 * Catch beep fires at cycle start; recovery beep fires after drive duration.
 *
 * `phase` goes 0→1 during drive, then 1→0 during recovery, so a bar can
 * fill during drive and empty during recovery.
 */
export function useMetronome() {
  const [spm, setSpm] = useState(24);
  const [running, setRunning] = useState(false);
  const [strokeCount, setStrokeCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [phase, setPhase] = useState(0); // 0..1

  const spmRef = useRef(spm);
  const runningRef = useRef(running);
  const rafRef = useRef<number | null>(null);
  const cycleStartRef = useRef(0);
  const lastCatchRef = useRef(0);
  const elapsedStartRef = useRef(0);
  const elapsedAccumRef = useRef(0);

  useEffect(() => {
    spmRef.current = spm;
  }, [spm]);
  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  const tick = useCallback(() => {
    // Schedule next frame FIRST so the loop survives any error below.
    rafRef.current = requestAnimationFrame(tick);

    if (!runningRef.current) return;

    console.log("[metronome] tick", { spm: spmRef.current, running: runningRef.current });

    try {
      const now = performance.now();
      const cycleDur = 60000 / spmRef.current; // ms
      const driveDur = cycleDur / 3;
      const recoveryDur = cycleDur * (2 / 3);

      // Elapsed time
      setElapsed(elapsedAccumRef.current + (now - elapsedStartRef.current) / 1000);

      const elapsedInCycle = now - cycleStartRef.current;

      if (elapsedInCycle >= cycleDur) {
        // New cycle — catch beep
        cycleStartRef.current += cycleDur;
        // If we drifted too far, resync
        if (now - cycleStartRef.current > cycleDur) {
          cycleStartRef.current = now;
        }
        lastCatchRef.current = cycleStartRef.current;
        setStrokeCount((c) => c + 1);
        console.log("[metronome] catch beep, stroke", strokeCount + 1);
        playBeep("catch");
        setPhase(0);
      } else if (elapsedInCycle >= driveDur && now - lastCatchRef.current < driveDur + 50) {
        // Recovery beep — fire once when we cross into recovery
        if (now - lastCatchRef.current >= driveDur) {
          console.log("[metronome] recovery beep");
          playBeep("recovery");
          lastCatchRef.current = now; // prevent re-trigger
        }
      }

      // Phase: 0→1 during drive, 1→0 during recovery
      if (elapsedInCycle < driveDur) {
        setPhase(elapsedInCycle / driveDur);
      } else {
        const inRecovery = elapsedInCycle - driveDur;
        setPhase(1 - inRecovery / recoveryDur);
      }
    } catch (err) {
      console.error("[metronome] tick error (loop continues):", err);
    }
  }, []);

  const start = useCallback(() => {
    const now = performance.now();
    cycleStartRef.current = now;
    lastCatchRef.current = now;
    elapsedStartRef.current = now;
    elapsedAccumRef.current = 0;
    setElapsed(0);
    setStrokeCount(0);
    setPhase(0);
    setRunning(true);
    runningRef.current = true;
    playBeep("catch");
    setStrokeCount(1);
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const stop = useCallback(() => {
    setRunning(false);
    runningRef.current = false;
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
    // Update ref immediately so the tick loop sees the new value without
    // waiting for the state effect to flush.
    spmRef.current = next;
    return next;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      runningRef.current = false;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return {
    spm,
    setSpm,
    adjustSpm,
    running,
    start,
    stop,
    strokeCount,
    elapsed,
    phase,
  };
}
