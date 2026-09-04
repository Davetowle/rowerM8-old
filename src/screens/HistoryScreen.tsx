import { ArrowLeft } from "lucide-react";
import { formatTime, formatDate } from "@/lib/format";
import type { SessionRecord } from "@/types";

const LOGO = "/yNl_fM1QANg5x3G8U2K43-LdmJV3rvmFV9UjdEyZRnQ-zq1sSniTjS4h297hyV3x0mz5tsjsy_WsQ3Nx.jpg";

interface Props {
  sessions: SessionRecord[];
  onBack: () => void;
}

export function HistoryScreen({ sessions, onBack }: Props) {
  return (
    <div className="flex flex-col min-h-screen px-6 py-8">
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

      {/* List */}
      {sessions.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
          <img src={LOGO} alt="" className="h-12 w-12 rounded-xl object-cover opacity-40" />
          <p className="text-slate-500 text-sm">No sessions yet.</p>
          <p className="text-slate-600 text-xs max-w-xs">
            Start a session from the home screen and your rowing history will appear here.
          </p>
        </div>
      ) : (
        <div className="flex-1 space-y-3 overflow-y-auto pb-4">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="rounded-2xl bg-slate-800/50 border border-white/5 p-4 flex items-center justify-between"
            >
              <div>
                <div className="text-sm text-slate-400">{formatDate(s.date)}</div>
                <div className="flex gap-4 mt-1.5">
                  <MiniStat label="Duration" value={formatTime(s.durationSec)} />
                  <MiniStat label="Avg" value={`${s.avgSpm} SPM`} />
                  <MiniStat label="Strokes" value={s.strokeCount.toString()} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
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
