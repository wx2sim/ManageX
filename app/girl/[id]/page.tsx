import Link from "next/link";
import { getGirlProfileById } from "@/components/dashboard/girlData";
import GirlProfilePage from "@/components/dashboard/GirlProfilePage";

export default async function GirlPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const profile = getGirlProfileById(String(resolvedParams?.id ?? ""));

  if (!profile) {
    return (
      <main className="min-h-screen bg-slate-50 py-10 px-6 sm:px-8">
        <div className="mx-auto max-w-2xl rounded-4xl border border-pink-100 bg-white p-10 text-center shadow-[0_30px_90px_rgba(236,72,153,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-pink-600">Profile missing</p>
          <h1 className="mt-4 text-3xl font-semibold text-zinc-950">Girl profile not found</h1>
          <p className="mt-4 text-sm leading-6 text-zinc-600">No girl was found for the ID <span className="font-medium text-zinc-900">{resolvedParams?.id}</span>.</p>
          <Link
            href="/dashboard"
            className="mt-8 inline-flex rounded-3xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:border-pink-200 hover:text-pink-700"
          >
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  return <GirlProfilePage profile={profile} />;
}
