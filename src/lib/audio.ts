let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/**
 * Play a short tone with a quick exponential decay.
 * Catch = higher pitched click (880 Hz), Recovery = lower (440 Hz).
 */
export function playBeep(kind: "catch" | "recovery", volume = 0.5): void {
  const ac = getCtx();
  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(kind === "catch" ? 880 : 440, now);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(now);
  osc.stop(now + 0.13);
}

/** Must be called from a user gesture to unlock audio on mobile browsers. */
export function unlockAudio(): void {
  getCtx();
}
