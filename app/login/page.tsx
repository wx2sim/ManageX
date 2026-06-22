"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Supabase session error:", error);
          setError(
            "Unable to verify session. Check your Supabase configuration and browser console for details."
          );
          return;
        }

        if (data.session) {
          router.replace("/dashboard");
        }
      } catch (err) {
        console.error("Supabase session fetch failed:", err);
        setError(
          "Unable to reach Supabase. Confirm your Supabase URL and that your browser origin is allowed in Supabase Auth settings."
        );
      }
    };

    loadSession();
  }, [router]);

  const signInWithPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else if (data.session) {
        router.push("/dashboard");
      } else {
        setMessage("Check your email for a confirmation link or complete the login flow.");
      }
    } catch (err) {
      console.error("Supabase login failed:", err);
      setError(
        "Unable to reach Supabase. Confirm your Supabase URL and that your browser origin is allowed in Supabase Auth settings."
      );
    } finally {
      setLoading(false);
    }
  };

 

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,182,193,0.35),transparent_35%),linear-gradient(180deg,_#fff5fb_0%,_#fff_55%,_#ffe4f0_100%)] text-zinc-950">
      <div className="mx-auto flex min-h-screen items-center justify-center px-5 py-5 sm:px-10">
        <div className="w-full max-w-md rounded-[2rem] border border-pink-200/70 bg-white/90 p-10 shadow-[0_40px_120px_rgba(236,72,153,0.14)] backdrop-blur-xl sm:p-12">
          <div className="space-y-2">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-pink-600">Welcome back</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-950">Sign in to your workspace</h1>
              
            </div>

            <form onSubmit={signInWithPassword} className="grid gap-4">
              <label className="block text-left text-sm font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                placeholder="name@example.com"
                required
              />

              <label className="block text-left text-sm font-medium">Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                placeholder="••••••••"
                required
              />

              <button
                type="submit"
                disabled={loading}
                className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-pink-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Logging in…" : "Login"}
              </button>
            </form>

            {error ? (
              <div className="mt-6 rounded-3xl border border-pink-200/80 bg-pink-50 px-4 py-3 text-sm text-pink-700">
                {error}
              </div>
            ) : null}

            {message ? (
              <div className="mt-6 rounded-3xl border border-rose-200/80 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {message}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
