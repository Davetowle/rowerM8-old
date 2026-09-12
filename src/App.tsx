import { useCallback, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { App as CapacitorApp } from "@capacitor/app";
import { ShoppingBag, Waves } from "lucide-react";
import { HomeScreen } from "@/screens/HomeScreen";
import { ActiveScreen } from "@/screens/ActiveScreen";
import { SummaryScreen } from "@/screens/SummaryScreen";
import { HistoryScreen } from "@/screens/HistoryScreen";
import { SplashScreen } from "@/screens/SplashScreen";
import { ComingSoonScreen } from "@/screens/ComingSoonScreen";
import { ConnectSensorScreen } from "@/screens/ConnectSensorScreen";
import { StrokeEstimatorScreen } from "@/screens/StrokeEstimatorScreen";
import { HeartRateMonitorScreen } from "@/screens/HeartRateMonitorScreen";
import { DpsScreen } from "@/screens/DpsScreen";
import { AuthScreen } from "@/screens/AuthScreen";
import { AccountScreen } from "@/screens/AccountScreen";
import { useMetronome } from "@/hooks/useMetronome";
import { useMetersPerStroke } from "@/hooks/useMetersPerStroke";
import { unlockAudio, startSilentLoop, stopSilentLoop, playBeep } from "@/lib/audio";
import { speak, stopSpeaking } from "@/lib/speech";
import { supabase } from "@/lib/supabase";
import type { SessionRecord, View } from "@/types";
import type { LucideIcon } from "lucide-react";

const COMING_SOON_SCREENS: Record<string, { title: string; icon: LucideIcon }> = {
  "buy-sensor": { title: "Buy Sensor", icon: ShoppingBag },
  rowerm8: { title: "ergM8", icon: Waves },
};

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [view, setView] = useState<View>("home");
  const [lastSession, setLastSession] = useState<SessionRecord | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const metro = useMetronome();
  const { metersPerStroke, reload: reloadMetersPerStroke } = useMetersPerStroke();
  const spmHistoryRef = useRef<number[]>([]);
  const sessionStartRef = useRef<number>(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 4000);
    return () => window.clearTimeout(timer);
  }, []);

  // Initialize auth state and listen for changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // Android hardware back button
  useEffect(() => {
    let listener: { remove: () => Promise<void> } | undefined;

    CapacitorApp.addListener("backButton", ({ canGoBack }) => {
      if ((view === "summary" || view === "stroke-estimator") && confirmDiscard) {
        setConfirmDiscard(false);
      } else if (view !== "home") {
        setView("home");
      } else if (canGoBack) {
        window.history.back();
      } else {
        CapacitorApp.exitApp();
      }
    }).then((l) => {
      listener = l;
    });

    return () => {
      listener?.remove();
    };
  }, [view, confirmDiscard]);

  const announceRate = useCallback((spm: number) => {
    speak(`${spm} strokes per minute`);
  }, []);

  const handleCountdownBeep = useCallback((value: number) => {
    if (value > 0) {
      speak(String(value));
      playBeep(0.7);
    } else {
      speak("row");
      playBeep(0.9);
    }
  }, []);

  const handleRunning = useCallback(() => {
    announceRate(metro.spm);
  }, [announceRate, metro.spm]);

  const handleStart = useCallback(() => {
    unlockAudio();
    startSilentLoop();
    spmHistoryRef.current = [metro.spm];
    sessionStartRef.current = Date.now();
    setView("active");
    metro.start(handleCountdownBeep, handleRunning);
  }, [metro, handleCountdownBeep, handleRunning]);

  const [saving, setSaving] = useState(false);

  const handleStop = useCallback(() => {
    metro.stop();
    stopSpeaking();
    stopSilentLoop();
    const duration = metro.elapsed;
    const avgSpm =
      spmHistoryRef.current.length > 0
        ? Math.round(
            spmHistoryRef.current.reduce((a, b) => a + b, 0) /
              spmHistoryRef.current.length
          )
        : metro.spm;
    const now = Date.now();
    const sessionRecord: SessionRecord = {
      id: crypto.randomUUID(),
      date: now,
      durationSec: Math.round(duration),
      avgSpm,
      strokeCount: metro.strokeCount,
    };
    setLastSession(sessionRecord);
    setView("summary");
  }, [metro]);

  const handleSaveSession = useCallback(async () => {
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
      setView("home");
    }
  }, [lastSession]);

  const handleDiscardSession = useCallback(() => {
    setLastSession(null);
    setView("home");
  }, []);

  const handleAdjust = useCallback(
    (delta: number) => {
      const newSpm = metro.adjustSpm(delta);
      spmHistoryRef.current.push(newSpm);
      if (metro.state === "running") {
        announceRate(newSpm);
      }
    },
    [metro, announceRate]
  );

  const handleLogout = useCallback(async () => {
    setLastSession(null);
    await supabase.auth.signOut();
    setView("home");
  }, []);

  if (isLoading) return <SplashScreen />;

  // While auth is initializing, show splash
  if (!authReady) return <SplashScreen />;

  // Not logged in — show auth screen
  if (!session) {
    return <AuthScreen onAuthed={() => setView("home")} />;
  }

  const isComingSoon = view in COMING_SOON_SCREENS;

  return (
    <div className="min-h-screen text-white antialiased">
      <div className="max-w-md mx-auto min-h-screen relative">
        {view === "home" && (
          <HomeScreen
            spm={metro.spm}
            onAdjust={handleAdjust}
            onStart={handleStart}
            onHistory={() => setView("history")}
            onNavigate={(v) => setView(v)}
            onLogout={handleLogout}
            userEmail={session.user.email}
          />
        )}
        {view === "active" && (
          <ActiveScreen
            spm={metro.spm}
            onAdjust={handleAdjust}
            strokeCount={metro.strokeCount}
            elapsed={metro.elapsed}

            countdown={metro.countdown}
            metronomeState={metro.state}
            metersPerStroke={metersPerStroke}
            onStop={handleStop}
          />
        )}
        {view === "summary" && lastSession && (
          <SummaryScreen
            session={lastSession}
            saving={saving}
            onSave={handleSaveSession}
            onDiscard={handleDiscardSession}
            metersPerStroke={metersPerStroke}
            confirmDiscard={confirmDiscard}
            setConfirmDiscard={setConfirmDiscard}
          />
        )}
        {view === "history" && (
          <HistoryScreen onBack={() => setView("home")} />
        )}
        {view === "stroke-estimator" && (
          <StrokeEstimatorScreen
            onBack={() => setView("home")}
            metersPerStroke={metersPerStroke}
            confirmDiscard={confirmDiscard}
            setConfirmDiscard={setConfirmDiscard}
          />
        )}
        {view === "distance-per-stroke" && (
          <DpsScreen
            onBack={() => {
              reloadMetersPerStroke();
              setView("home");
            }}
          />
        )}
        {view === "connect-sensor" && (
          <ConnectSensorScreen onBack={() => setView("home")} />
        )}
        {view === "heart-rate-monitor" && (
          <HeartRateMonitorScreen onBack={() => setView("home")} />
        )}
        {view === "account" && (
          <AccountScreen
            onBack={() => setView("home")}
            onAccountDeleted={() => setView("home")}
            userEmail={session.user.email}
          />
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
