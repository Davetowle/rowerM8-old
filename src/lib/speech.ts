let cachedVoice: SpeechSynthesisVoice | null = null;

function pickVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  // Prefer an English voice.
  cachedVoice = voices.find((v) => v.lang.startsWith("en")) ?? voices[0];
  return cachedVoice;
}

// Warm up the voice list (loads asynchronously on some browsers).
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoice = null;
    pickVoice();
  };
}

export function speak(text: string): void {
  console.log("[speech] speak()", text);
  if (!("speechSynthesis" in window)) {
    console.warn("[speech] speechSynthesis not supported");
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice();
    if (v) {
      u.voice = v;
      console.log("[speech] using voice", v.name);
    } else {
      console.warn("[speech] no voice loaded yet — speaking with default");
    }
    u.rate = 1;
    u.pitch = 1;
    u.onerror = (e) => console.error("[speech] utterance error:", e);
    window.speechSynthesis.speak(u);
    console.log("[speech] speak() queued");
  } catch (err) {
    console.error("[speech] speak() threw (metronome continues):", err);
  }
}

export function stopSpeaking(): void {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}
