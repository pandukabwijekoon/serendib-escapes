"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Lock, ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Authentication failed.");
        setLoading(false);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Network error while signing in.");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0A0F0D] px-6 py-12 text-white">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/60 transition hover:text-[#D4AF37]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Serendib Escapes</span>
        </Link>

        <div className="glass-panel rounded-3xl p-8 shadow-2xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#D4AF37]/40 bg-[#D4AF37]/15 text-[#D4AF37]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">
                Operations Console
              </span>
              <h1 className="font-serif text-2xl font-semibold text-white">
                Concierge Admin Login
              </h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="admin-email"
                className="mb-1.5 block text-xs uppercase tracking-[0.18em] text-white/65"
              >
                Administrator Email
              </label>
              <input
                id="admin-email"
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@serendibescapes.lk"
                className="w-full rounded-xl border border-white/15 bg-[#0A0F0D] px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="mb-1.5 block text-xs uppercase tracking-[0.18em] text-white/65"
              >
                Password
              </label>
              <input
                id="admin-password"
                required
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-white/15 bg-[#0A0F0D] px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-[#D4AF37]"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/40 bg-red-950/50 px-4 py-3 text-xs text-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-[#D4AF37] py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#0A0F0D] transition hover:bg-[#E7C660] disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span>Unlock Dashboard</span>
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-[11px] text-white/45">
            Protected by HttpOnly Strict JWT cookies & exponential backoff rate
            limiting.
          </p>
        </div>
      </div>
    </main>
  );
}
