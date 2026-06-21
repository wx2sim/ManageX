"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-50 p-8 text-zinc-900 dark:bg-black dark:text-white">
      <div className="w-full max-w-md rounded-3xl border border-zinc-200/80 bg-white/90 p-10 shadow-xl shadow-zinc-200/50 backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-950/80">
        <h1 className="text-3xl font-semibold">Login</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          This page is a placeholder for Supabase authentication. Next, wire this form into
          `supabase.auth.signInWithPassword` or a social login flow.
        </p>

        <form className="mt-8 grid gap-4">
          <label className="block text-left text-sm font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            placeholder="name@example.com"
          />

          <label className="block text-left text-sm font-medium">Password</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            placeholder="••••••••"
          />

          <button
            type="button"
            disabled
            className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-semibold text-white opacity-60 transition hover:opacity-100 disabled:cursor-not-allowed"
          >
            Connect with Supabase (placeholder)
          </button>
        </form>
      </div>
    </main>
  );
}
