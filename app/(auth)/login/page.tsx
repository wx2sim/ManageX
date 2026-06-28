'use client';

import { useState, useTransition } from 'react';
import { signIn } from '@/actions/auth';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      // Since signIn redirects on success, we only handle errors here
      const res = await signIn(null, formData);
      if (res?.error) {
        setError(res.error);
      }
    });
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,182,193,0.35),transparent_35%),linear-gradient(180deg,_#fff5fb_0%,_#fff_55%,_#ffe4f0_100%)] text-zinc-950 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-[2.5rem] border border-pink-200/70 bg-white/90 p-10 shadow-[0_40px_120px_rgba(236,72,153,0.14)] backdrop-blur-xl sm:p-12">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-pink-600 font-bold">Welcome back</p>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-950">Sign In to ManageX</h1>
            <p className="text-xs text-zinc-500">Access your aunt's housing & client management system.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                required
                placeholder="manager@example.com"
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
              />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="mt-2 w-full rounded-2xl bg-pink-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 transition hover:bg-pink-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
