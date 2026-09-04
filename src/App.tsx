import { useCallback, useEffect, useRef, useState } from "react";
import { Bluetooth, ShoppingBag, BarChart3, Waves } from "lucide-react";
import { HomeScreen } from "@/screens/HomeScreen";
import { ActiveScreen } from "@/screens/ActiveScreen";
import { SummaryScreen } from "@/screens/SummaryScreen";
import { HistoryScreen } from "@/screens/HistoryScreen";
import { SplashScreen } from "@/screens/SplashScreen";
import { ComingSoonScreen } from "@/screens/ComingSoonScreen";
import { StrokeEstimatorScreen } from "@/screens/StrokeEstimatorScreen";
import { useMetronome } from "@/hooks/useMetronome";
import { unlockAudio } from "@/lib/audio";
import { speak, stopSpeaking } from "@/lib/speech";
import type { SessionRecord, View } from "@/types";
import type { LucideIcon } from "lucide-react";

const COMING_SOON_SCREENS: Record<string, { title: string; icon: LucideIcon }> = {
  "connect-sensor": { title: "Connect Sensor", icon: Bluetooth },
  "buy-sensor": { title: "Buy Sensor", icon: ShoppingBag },
  "fit-chart": { title: "Fit Chart", icon: BarChart3 },
  rowerm8: { title: "rowerM8", icon: Waves },
};

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<View>("home");
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [lastSession, setLastSession] = useState<SessionRecord | null>(null);

  const metro = useMetronome();
  const spmHistoryRef = useRef<number[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 4000);
    return () => window.clearTimeout(timer);
  }, []);

  // Speak rate on start and whenever it changes during a session
  const announceRate = useCallback((spm: number) => {
    speak(`${spm} strokes per minute`);
  }, []);

  const handleStart = useCallback(() => {
    unlockAudio();
    spmHistoryRef.current = [metro.spm];
    metro.start();
    announceRate(metro.spm);
    setView("active");
  }, [metro, announceRate]);

  const handleStop = useCallback(() => {
    metro.stop();
    stopSpeaking();
    const duration = metro.elapsed;
    const avgSpm =
      spmHistoryRef.current.length > 0
        ? Math.round(
            spmHistoryRef.current.reduce((a, b) => a + b, 0) /
              spmHistoryRef.current.length
          )
        : metro.spm;
    const session: SessionRecord = {
      id: crypto.randomUUID(),
      date: Date.now(),
      durationSec: Math.round(duration),
      avgSpm,
      strokeCount: metro.strokeCount,
    };
    setLastSession(session);
    setSessions((prev) => [session, ...prev]);
    setView("summary");
  }, [metro]);

  const handleAdjust = useCallback(
    (delta: number) => {
      metro.adjustSpm(delta);
      // Track for averaging; speak the new rate during a live session
      const newSpm = Math.max(16, Math.min(40, metro.spm + delta));
      spmHistoryRef.current.push(newSpm);
      if (metro.running) {
        announceRate(newSpm);
      }
    },
    [metro, announceRate]
  );

  const handleSummaryDone = useCallback(() => {
    setView("home");
  }, []);

  if (isLoading) return <SplashScreen />;

  const isComingSoon = view in COMING_SOON_SCREENS;

  return (
    <div className="min-h-screen bg-slate-950 text-white antialiased">
      <div className="max-w-md mx-auto min-h-screen relative">
        {view === "home" && (
          <HomeScreen
            spm={metro.spm}
            onAdjust={handleAdjust}
            onStart={handleStart}
            onHistory={() => setView("history")}
            onNavigate={(v) => setView(v)}
          />
        )}
        {view === "active" && (
          <ActiveScreen
            spm={metro.spm}
            onAdjust={handleAdjust}
            strokeCount={metro.strokeCount}
            elapsed={metro.elapsed}
            phase={metro.phase}
            onStop={handleStop}
          />
        )}
        {view === "summary" && lastSession && (
          <SummaryScreen session={lastSession} onDone={handleSummaryDone} />
        )}
        {view === "history" && (
          <HistoryScreen sessions={sessions} onBack={() => setView("home")} />
        )}
        {view === "stroke-estimator" && (
          <StrokeEstimatorScreen onBack={() => setView("home")} />
        )}
        {isComingSoon && COMING_SOON_SCREENS[view] && (
          <ComingSoonScreen
            title={COMING_SOON_SCREENS[view].title}
            icon={COMING_SOON_SCREENS[view].icon}
            onBack={() => setView("home")}
          />
        )}
      </div>
    </div>
  );
}
