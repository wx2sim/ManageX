'use client';

import { useState, useTransition, useEffect } from 'react';
import { updateUserPassword } from '@/actions/auth';
import { useRouter } from 'next/navigation';

import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [hashProcessed, setHashProcessed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Initialize the browser client to automatically parse the #access_token or ?code from the URL
    // and save the session into cookies for the server to use.
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setHashProcessed(true);
      } else {
        // Fallback in case it takes a second for the auth state change listener to fire
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
          if (session) setHashProcessed(true);
        });
        return () => authListener.subscription.unsubscribe();
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    startTransition(async () => {
      // The updateUserPassword action uses the server client to update the password.
      // Since the user is already authenticated by the magic link, this will succeed.
      const res = await updateUserPassword(null, formData);
      if (res?.error) {
        setError(res.error);
      }
    });
  };

  if (!hashProcessed) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,182,193,0.35),transparent_35%),linear-gradient(180deg,_#fff5fb_0%,_#fff_55%,_#ffe4f0_100%)] text-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,182,193,0.35),transparent_35%),linear-gradient(180deg,_#fff5fb_0%,_#fff_55%,_#ffe4f0_100%)] text-zinc-950 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-[2.5rem] border border-pink-200/70 bg-white/90 p-10 shadow-[0_40px_120px_rgba(236,72,153,0.14)] backdrop-blur-xl sm:p-12">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-950">Set New Password</h1>
            <p className="text-xs text-zinc-500">Please enter your new password below.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                New Password
              </label>
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                minLength={6}
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
              />
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                required
                placeholder="••••••••"
                minLength={6}
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
              className="mt-4 w-full rounded-2xl bg-pink-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 transition hover:bg-pink-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
