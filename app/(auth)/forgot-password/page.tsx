'use client';

import { useState, useTransition } from 'react';
import { requestPasswordReset } from '@/actions/auth';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const res = await requestPasswordReset(null, formData);
      if (res?.error) {
        setError(res.error);
      } else if (res?.success) {
        setSuccess(true);
      }
    });
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,182,193,0.35),transparent_35%),linear-gradient(180deg,_#fff5fb_0%,_#fff_55%,_#ffe4f0_100%)] text-zinc-950 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-[2.5rem] border border-pink-200/70 bg-white/90 p-10 shadow-[0_40px_120px_rgba(236,72,153,0.14)] backdrop-blur-xl sm:p-12">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-950">Reset Password</h1>
            <p className="text-xs text-zinc-500">Enter your email address and we will send you a magic link to securely reset your password.</p>
          </div>

          {!success ? (
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

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="mt-2 w-full rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-zinc-500/20 transition hover:bg-zinc-800 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isPending ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          ) : (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center space-y-3">
              <div className="text-emerald-500 text-4xl mb-2">✨</div>
              <h3 className="text-emerald-800 font-bold text-lg">Check your email</h3>
              <p className="text-emerald-700 text-sm">
                We have sent a secure password reset link to your email address. Please click the link to continue.
              </p>
            </div>
          )}

          <div className="text-center mt-6">
            <Link href="/login" className="text-xs font-bold text-zinc-500 hover:text-zinc-700 transition">
              &larr; Back to Login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
