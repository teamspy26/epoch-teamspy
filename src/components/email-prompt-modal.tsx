"use client";

import { useState } from "react";
import { Mail, X } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import toast from "react-hot-toast";

export function EmailPromptModal() {
  const { appUser, updateProfile } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  if (!appUser || appUser.email || dismissed) return null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Please enter a valid email address");
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ email: trimmed });
      toast.success("Email saved! You'll now receive notifications.");
    } catch {
      toast.error("Failed to save email. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-[#1D9E75] px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Mail className="h-5 w-5 text-white" />
              <span className="text-white font-semibold text-base">Enable Email Notifications</span>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="text-white/70 hover:text-white transition"
              aria-label="Dismiss"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-2 text-[#b2f0da] text-sm">
            Get notified when matches are found, requests are approved, and deliveries complete.
          </p>
        </div>

        <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Your email address</label>
            <input
              type="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1D9E75] focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20 transition"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
            >
              Maybe later
            </button>
            <button
              type="submit"
              disabled={saving || !email.trim()}
              className="flex-1 rounded-xl bg-[#1D9E75] py-2.5 text-sm font-semibold text-white hover:bg-[#178862] disabled:opacity-60 transition"
            >
              {saving ? "Saving…" : "Save email"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
