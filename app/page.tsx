export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-50 p-8 text-center text-zinc-900 dark:bg-black dark:text-white">
      <div className="max-w-2xl rounded-3xl border border-zinc-200/80 bg-white/90 p-10 shadow-xl shadow-zinc-200/50 backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-950/80">
        <h1 className="text-4xl font-semibold tracking-tight">ManageX</h1>
        <p className="mt-4 text-lg leading-8 text-zinc-600 dark:text-zinc-300">
          Home page cleared. The app is ready for Supabase authentication.
        </p>
        <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
          Next steps: install Supabase, add environment variables, and implement the login flow.
        </p>
      </div>
    </main>
  );
}
