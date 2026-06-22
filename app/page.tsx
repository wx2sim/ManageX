import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,182,193,0.35),transparent_35%),linear-gradient(180deg,_#fff5fb_0%,_#fff_55%,_#ffe4f0_100%)] text-zinc-900">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16 sm:px-10 lg:px-16">
        <div className="rounded-[2rem] border border-pink-200/70 bg-white/90 p-10 shadow-[0_40px_120px_rgba(236,72,153,0.12)] backdrop-blur-xl sm:p-14">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="space-y-8">
              <div className="inline-flex rounded-full bg-pink-100 px-4 py-1 text-sm font-semibold uppercase tracking-[0.25em] text-pink-700 shadow-sm shadow-pink-200/80">
                Welcome to ManageX
              </div>
              <div>
                <h1 className="text-5xl font-semibold tracking-tight text-zinc-950 sm:text-6xl">
                  Beautiful product management, built for growth.
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600">
                  One place to launch work, monitor progress, and move faster with a pink-and-white experience designed for modern teams.
                </p>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-full bg-pink-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 transition hover:bg-pink-700"
                >
                  Go to dashboard
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-full border border-pink-200 bg-white px-7 py-3 text-sm font-semibold text-pink-700 transition hover:bg-pink-50"
                >
                  Login page
                </Link>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[2rem] border border-pink-100 bg-pink-50/80 p-8 shadow-[0_30px_90px_rgba(236,72,153,0.08)]">
              <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-pink-400 via-pink-300 to-pink-500 opacity-80" />
              <div className="relative flex h-full flex-col justify-between gap-6 pt-6">
                <div className="space-y-5">
                  <div className="rounded-3xl bg-white/90 p-6 shadow-sm shadow-pink-200/60">
                    <p className="text-xs uppercase tracking-[0.3em] text-pink-500">Team progress</p>
                    <h2 className="mt-4 text-3xl font-semibold text-zinc-950">Weekly sprint view</h2>
                    <p className="mt-3 text-sm leading-6 text-zinc-600">
                      Keep your entire team aligned with one central dashboard for planning, tracking, and delivering.
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl bg-white/95 p-5 shadow-sm shadow-pink-200/40">
                      <p className="text-sm font-semibold text-zinc-950">Fast setup</p>
                      <p className="mt-2 text-sm text-zinc-600">Launch in minutes with Supabase auth and modern Next.js routing.</p>
                    </div>
                    <div className="rounded-3xl bg-white/95 p-5 shadow-sm shadow-pink-200/40">
                      <p className="text-sm font-semibold text-zinc-950">Secure access</p>
                      <p className="mt-2 text-sm text-zinc-600">Protected dashboards, login flow, and auth state handling ready to go.</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-[1.75rem] bg-pink-100 p-5 text-sm text-pink-700 shadow-inner shadow-pink-200/40">
                  <p className="font-semibold">Quick start</p>
                  <p className="mt-2 leading-6 text-zinc-600">
                    Hit the dashboard button. If you&apos;re not authenticated, you&apos;ll be redirected to login first.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
