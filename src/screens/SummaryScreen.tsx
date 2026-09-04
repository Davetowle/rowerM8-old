import { formatTime, formatDate } from "@/lib/format";
import type { SessionRecord } from "@/types";

interface Props {
  session: SessionRecord;
  onDone: () => void;
}

export function SummaryScreen({ session, onDone }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-8 gap-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-1">Session Complete</h2>
        <p className="text-sm text-slate-500">{formatDate(session.date)}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        <StatCard label="Duration" value={formatTime(session.durationSec)} />
        <StatCard label="Avg Rate" value={`${session.avgSpm}`} unit="SPM" />
        <StatCard label="Strokes" value={session.strokeCount.toString()} />
        <StatCard
          label="Distance*"
          value={(session.strokeCount * 8).toString()}
          unit="m"
        />
      </div>

      <p className="text-xs text-slate-600 text-center max-w-xs">
        *Distance is a rough estimate (8 m per stroke) — no hardware sensor in this version.
      </p>

      <div className="w-full max-w-sm">
        <button
          onClick={onDone}
          className="w-full py-5 rounded-2xl bg-cyan-500 text-slate-950 text-lg font-bold tracking-wide
                     shadow-lg shadow-cyan-500/30 transition-all hover:bg-cyan-400 active:scale-[0.98]"
        >
          DONE
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-2xl bg-slate-800/50 border border-white/5 p-5 text-center">
      <div className="text-3xl font-bold text-white tabular-nums">
        {value}
        {unit && <span className="text-sm text-slate-400 ml-1 font-normal">{unit}</span>}
      </div>
      <div className="text-xs uppercase tracking-widest text-slate-500 mt-1">{label}</div>
    </div>
  );
}
