import { useEffect, useRef, useState } from "react";
import { Menu, X, Bluetooth, ShoppingBag, BarChart3, Calculator, Waves } from "lucide-react";
import { SpmControl } from "@/components/SpmControl";
import type { View } from "@/types";

const LOGO = "/strokem8_logo.png";

interface MenuOption {
  label: string;
  icon: typeof Menu;
  view: View;
}

const MENU_OPTIONS: MenuOption[] = [
  { label: "Connect Sensor", icon: Bluetooth, view: "connect-sensor" },
  { label: "Buy Sensor", icon: ShoppingBag, view: "buy-sensor" },
  { label: "Fit Chart", icon: BarChart3, view: "fit-chart" },
  { label: "Stroke Estimator", icon: Calculator, view: "stroke-estimator" },
  { label: "rowerM8", icon: Waves, view: "rowerm8" },
];

interface Props {
  spm: number;
  onAdjust: (delta: number) => void;
  onStart: () => void;
  onHistory: () => void;
  onNavigate: (view: View) => void;
}

export function HomeScreen({ spm, onAdjust, onStart, onHistory, onNavigate }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [menuOpen]);

  function handleMenuSelect(view: View) {
    setMenuOpen(false);
    onNavigate(view);
  }

  return (
    <div className="flex flex-col items-center justify-between min-h-screen px-6 py-8">
      {/* Header */}
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={LOGO} alt="strokeM8" className="h-8 w-8 rounded-lg object-cover" />
          <span className="text-xl font-bold text-white tracking-tight">strokeM8</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onHistory}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
          >
            History
          </button>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center justify-center h-9 w-9 rounded-lg text-slate-400 hover:text-white transition-colors hover:bg-white/5"
              aria-label="Menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-slate-800/95 backdrop-blur-md border border-white/10 shadow-2xl shadow-black/50 overflow-hidden z-50 animate-menu-in">
                {MENU_OPTIONS.map((option, i) => (
                  <button
                    key={option.view}
                    onClick={() => handleMenuSelect(option.view)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-cyan-500/10 ${
                      i > 0 ? "border-t border-white/5" : ""
                    }`}
                  >
                    <option.icon size={18} className="text-cyan-400" />
                    <span className="text-sm font-medium text-white">{option.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Center: SPM control */}
      <div className="flex flex-col items-center gap-12 w-full">
        <p className="text-slate-400 text-sm tracking-wide text-center max-w-xs">
          Set your target stroke rate, then start rowing to the beat.
        </p>
        <SpmControl spm={spm} onAdjust={onAdjust} />
      </div>

      {/* Start button */}
      <div className="w-full max-w-sm">
        <button
          onClick={onStart}
          className="w-full py-5 rounded-2xl bg-cyan-500 text-slate-950 text-lg font-bold tracking-wide
                     shadow-lg shadow-cyan-500/30 transition-all hover:bg-cyan-400 active:scale-[0.98]"
        >
          START
        </button>
      </div>
    </div>
  );
}
