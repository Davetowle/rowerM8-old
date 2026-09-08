import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Clock, Activity, Calendar } from "lucide-react";
import { formatTime, formatDate, formatHoursMinutes } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import type { DbSession } from "@/types";

const LOGO = "./yNl_fM1QANg5x3G8U2K43-LdmJV3rvmFV9UjdEyZRnQ-zq1sSniTjS4h297hyV3x0mz5tsjsy_WsQ3Nx.jpg";

interface Props {
  onBack: () => void;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1; // Monday as start of week
  d.setDate(d.getDate() - diff);
  return d;
}

export function HistoryScreen({ onBack }: Props) {
  const [sessions, setSessions] = useState<DbSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from("sessions")
          .select("id, start_time, end_time, duration_sec, spm, stroke_count")
          .order("start_time", { ascending: false });

        if (error) throw error;
        setSessions(data ?? []);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load sessions";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const stats = useMemo(() => {
    if (sessions.length === 0) return null;

    const totalSessions = sessions.length;
    const totalSeconds = sessions.reduce((sum, s) => sum + s.duration_sec, 0);

    const weekStart = getWeekStart(new Date());
    const weekSessions = sessions.filter(
      (s) => new Date(s.start_time).getTime() >= weekStart.getTime()
    );
    const avgSpmThisWeek =
      weekSessions.length > 0
        ? Math.round(weekSessions.reduce((sum, s) => sum + s.spm, 0) / weekSessions.length)
        : null;

    return { totalSessions, totalSeconds, avgSpmThisWeek };
  }, [sessions]);

  return (
    <div className="flex flex-col min-h-screen px-safe-6 pt-safe-8 pb-safe-8 bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <div className="flex items-center gap-2">
          <img src={LOGO} alt="strokeM8" className="h-6 w-6 rounded-md object-cover" />
          <span className="font-bold text-white">History</span>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-500 text-sm">Loading sessions...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && sessions.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
          <img src={LOGO} alt="" className="h-12 w-12 rounded-xl object-cover opacity-40" />
          <p className="text-slate-500 text-sm">No sessions yet.</p>
          <p className="text-slate-600 text-xs max-w-xs">
            Start a session from the home screen and your rowing history will appear here.
          </p>
        </div>
      )}

      {/* Stats + List */}
      {!loading && !error && sessions.length > 0 && stats && (
        <>
          {/* Stats summary */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <StatCard
              icon={<Activity size={16} />}
              label="Sessions"
              value={stats.totalSessions.toString()}
            />
            <StatCard
              icon={<Clock size={16} />}
              label="Total Time"
              value={formatHoursMinutes(stats.totalSeconds)}
            />
            <StatCard
              icon={<Calendar size={16} />}
              label="Avg SPM"
              value={stats.avgSpmThisWeek !== null ? stats.avgSpmThisWeek.toString() : "--"}
              sublabel="this week"
            />
          </div>

          {/* Session list */}
          <div className="flex-1 space-y-3 overflow-y-auto pb-4">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl bg-slate-800/50 border border-white/5 p-4 flex items-center justify-between"
              >
                <div>
                  <div className="text-sm text-slate-400">{formatDate(new Date(s.start_time).getTime())}</div>
                  <div className="flex gap-4 mt-1.5">
                    <MiniStat label="Duration" value={formatTime(s.duration_sec)} />
                    <MiniStat label="Rate" value={`${s.spm} SPM`} />
                    <MiniStat label="Strokes" value={s.stroke_count.toString()} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sublabel,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel?: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-800/50 border border-white/5 p-4 flex flex-col items-center text-center">
      <div className="text-cyan-400 mb-2">{icon}</div>
      <div className="text-2xl font-bold text-white tabular-nums leading-none">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-1.5">{label}</div>
      {sublabel && <div className="text-[9px] text-slate-600 mt-0.5">{sublabel}</div>}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-white font-semibold text-sm tabular-nums">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-slate-600">{label}</div>
    </div>
  );
}
