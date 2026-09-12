import { useState } from "react";
import { ArrowLeft, User, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Props {
  onBack: () => void;
  onAccountDeleted: () => void;
  userEmail?: string;
}

export function AccountScreen({ onBack, onAccountDeleted, userEmail }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDeleteAccount() {
    setDeleting(true);
    setError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        setError("Not signed in. Please sign in again.");
        return;
      }

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }

      await supabase.auth.signOut();
      onAccountDeleted();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
    } finally {
      setDeleting(false);
    }
  }

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
        <span className="font-bold text-white tracking-tight">Account</span>
      </div>

      {/* Profile card */}
      <div className="flex items-center gap-4 rounded-2xl bg-slate-800/50 border border-white/5 p-5 mb-8">
        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-cyan-500/15 border border-cyan-500/20">
          <User size={20} className="text-cyan-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-widest text-slate-500">Email</p>
          <p className="text-sm font-medium text-white truncate">
            {userEmail ?? "Signed in"}
          </p>
        </div>
      </div>

      {/* Danger zone */}
      <div className="mt-auto">
        <div className="rounded-2xl bg-red-500/5 border border-red-500/20 p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-red-400" />
            <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wider">
              Danger Zone
            </h3>
          </div>
          <p className="text-sm text-slate-400 mb-4">
            Permanently delete your account and all associated data, including
            session history and saved settings. This cannot be undone.
          </p>
          <button
            onClick={() => setConfirmOpen(true)}
            className="w-full py-4 rounded-2xl bg-red-500/10 text-red-400 text-base font-semibold tracking-wide
                       border border-red-500/20 transition-all hover:bg-red-500/20 active:scale-[0.98]
                       flex items-center justify-center gap-2"
          >
            <Trash2 size={18} />
            Delete Account
          </button>
        </div>
      </div>

      {/* Confirmation modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-safe-6 pb-safe bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-slate-800 border border-white/10 shadow-2xl shadow-black/50 p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center justify-center h-14 w-14 rounded-full bg-red-500/15 border border-red-500/20">
                <AlertTriangle size={26} className="text-red-400" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-white text-center mb-2">
              Delete your account?
            </h3>
            <p className="text-sm text-slate-400 text-center mb-6">
              This will permanently delete your account and all data — session
              history, stats, and saved settings. This action cannot be undone.
            </p>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5 mb-4">
                {error}
              </p>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="w-full py-4 rounded-2xl bg-red-500 text-white text-base font-bold tracking-wide
                           shadow-lg shadow-red-500/20 transition-all hover:bg-red-400 active:scale-[0.98]
                           disabled:opacity-50 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    DELETING...
                  </>
                ) : (
                  "DELETE MY ACCOUNT"
                )}
              </button>
              <button
                onClick={() => {
                  setConfirmOpen(false);
                  setError(null);
                }}
                disabled={deleting}
                className="w-full py-4 rounded-2xl bg-slate-700 text-white text-base font-semibold tracking-wide
                           border border-white/10 transition-all hover:bg-slate-600 active:scale-[0.98]
                           disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
