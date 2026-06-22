"use client";

import Link from "next/link";

export interface GirlProfile {
  id: string;
  name: string;
  initials: string;
  status: string;
  balance: number;
  debt: number;
}

interface GirlProfileCardProps {
  profile: GirlProfile;
  isOpen: boolean;
  onToggleMenu: (id: string) => void;
  compact?: boolean;
}

export default function GirlProfileCard({ profile, isOpen, onToggleMenu, compact = false }: GirlProfileCardProps) {
  if (compact) {
    return (
      <div className="group relative rounded-2xl border border-pink-100 bg-white p-4 shadow-sm shadow-pink-100/50 transition hover:shadow-md">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Link
              href={`/girl/${profile.id}`}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pink-100 text-sm font-semibold text-pink-700 transition hover:ring-2 hover:ring-pink-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300"
              aria-label={`View ${profile.name} profile`}
            >
              {profile.initials}
            </Link>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-zinc-950">{profile.name}</p>
              <p className="truncate text-xs text-zinc-500">{profile.status}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-pink-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-pink-700"
            >
              + Add
            </button>
            <button
              type="button"
              onClick={() => onToggleMenu(profile.id)}
              className="h-9 w-9 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-600 transition hover:border-pink-200 hover:text-pink-700"
              aria-label="Open options"
            >
              ⋯
            </button>
          </div>
        </div>

        {isOpen ? (
          <div className="absolute right-2 top-12 z-10 w-36 rounded-2xl border border-pink-100 bg-white p-2 shadow-[0_10px_30px_rgba(0,0,0,0.1)]">
            <button
              type="button"
              onClick={() => onToggleMenu(profile.id)}
              className="w-full rounded-lg px-3 py-2 text-left text-xs text-zinc-700 transition hover:bg-pink-50"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={() => onToggleMenu(profile.id)}
              className="mt-1 w-full rounded-lg px-3 py-2 text-left text-xs text-zinc-700 transition hover:bg-pink-50"
            >
              Archive
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="group relative rounded-[1.75rem] border border-pink-100 bg-white p-6 shadow-[0_20px_60px_rgba(236,72,153,0.08)] transition hover:-translate-y-1 hover:shadow-[0_24px_80px_rgba(236,72,153,0.16)]">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href={`/girl/${profile.id}`}
            className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-pink-100 text-xl font-semibold text-pink-700 transition hover:ring-2 hover:ring-pink-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300"
            aria-label={`View ${profile.name} profile`}
          >
            {profile.initials}
          </Link>
          <div>
            <p className="text-lg font-semibold text-zinc-950">{profile.name}</p>
            <p className="text-sm text-zinc-500">{profile.status}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onToggleMenu(profile.id)}
          className="h-10 w-10 rounded-2xl border border-zinc-200 bg-white text-zinc-600 transition hover:border-pink-200 hover:text-pink-700"
          aria-label="Open options"
        >
          ⋯
        </button>
      </div>

      <div className="mt-6 grid gap-3 rounded-3xl bg-pink-50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-500">Balance</span>
          <span className="text-sm font-semibold text-emerald-700">+{profile.balance.toLocaleString()} DZD</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-500">Pending</span>
          <span className="text-sm font-semibold text-rose-600">-{profile.debt.toLocaleString()} DZD</span>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-2xl bg-pink-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-pink-700"
        >
          + Add
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-pink-200 hover:text-pink-700"
        >
          Stats
        </button>
      </div>

      {isOpen ? (
        <div className="absolute right-6 top-24 z-10 w-40 rounded-3xl border border-pink-100 bg-white p-3 shadow-[0_22px_48px_rgba(0,0,0,0.08)]">
          <button
            type="button"
            onClick={() => onToggleMenu(profile.id)}
            className="w-full rounded-2xl px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-pink-50"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={() => onToggleMenu(profile.id)}
            className="mt-1 w-full rounded-2xl px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-pink-50"
          >
            Archive
          </button>
        </div>
      ) : null}
    </div>
  );
}
