import { ArrowLeft } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  icon: LucideIcon;
  onBack: () => void;
}

export function ComingSoonScreen({ title, icon: Icon, onBack }: Props) {
  return (
    <div className="flex flex-col min-h-screen px-6 py-8 bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
        >
          <ArrowLeft size={18} />
          Back
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
        <div className="flex items-center justify-center h-20 w-20 rounded-3xl bg-cyan-500/10 border border-cyan-400/20">
          <Icon size={36} className="text-cyan-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
          <p className="mt-2 text-sm text-slate-500">Coming soon</p>
        </div>
      </div>
    </div>
  );
}
