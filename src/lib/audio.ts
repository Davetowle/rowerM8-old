let ctx: AudioContext | null = null;
let silentSource: AudioBufferSourceNode | null = null;

function getCtx(): AudioContext {
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/**
 * Play a single short beep per stroke.
 * 880 Hz sine wave with a quick decay — projects well through phone speakers.
 */
export function playBeep(volume = 0.9): void {
  const ac = getCtx();
  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(880, now);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(now);
  osc.stop(now + 0.13);
}

/**
 * Loop a near-silent audio buffer continuously so iOS treats the audio
 * session as "playback" category. This prevents the mute switch from
 * silencing the metronome beeps. Must be started from a user gesture.
 */
export function startSilentLoop(): void {
  const ac = getCtx();
  if (silentSource) return; // already running

  // Generate ~0.5s of near-silence (a tiny DC offset to keep the buffer "active").
  const buffer = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = 0.0001; // near-silent, not truly zero so iOS doesn't optimize it away
  }

  const src = ac.createBufferSource();
  src.buffer = buffer;
  src.loop = true;

  const gain = ac.createGain();
  gain.gain.value = 0.01; // effectively inaudible

  src.connect(gain);
  gain.connect(ac.destination);
  src.start();

  silentSource = src;
  console.log("[audio] silent loop started (iOS mute workaround)");
}

export function stopSilentLoop(): void {
  if (silentSource) {
    try {
      silentSource.stop();
    } catch {
      // already stopped
    }
    silentSource = null;
    console.log("[audio] silent loop stopped");
  }
}

/** Must be called from a user gesture to unlock audio on mobile browsers. */
export function unlockAudio(): void {
  getCtx();
}
