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
 * Play a short percussive "thump" per stroke — a low-pitched sine drop
 * combined with a brief filtered-noise transient to evoke a hand slap
 * or dull knock. Under 200ms with a fast exponential decay.
 */
export function playBeep(volume = 1.0): void {
  const ac = getCtx();
  const now = ac.currentTime;

  // --- Body: sine wave with pitch drop for the "thump" ---
  const osc = ac.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.exponentialRampToValueAtTime(45, now + 0.08);

  const gain = ac.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(now);
  osc.stop(now + 0.16);

  // --- Transient: short low-passed noise burst for the "slap" ---
  const noiseBuffer = ac.createBuffer(1, ac.sampleRate * 0.05, ac.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseData.length; i++) {
    noiseData[i] = (Math.random() * 2 - 1) * (1 - i / noiseData.length);
  }
  const noise = ac.createBufferSource();
  noise.buffer = noiseBuffer;

  const noiseFilter = ac.createBiquadFilter();
  noiseFilter.type = "lowpass";
  noiseFilter.frequency.value = 800;

  const noiseGain = ac.createGain();
  noiseGain.gain.setValueAtTime(volume * 0.45, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ac.destination);
  noise.start(now);
  noise.stop(now + 0.05);
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
