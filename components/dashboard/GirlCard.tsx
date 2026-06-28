'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { GirlBalance } from '@/lib/types';
import { toggleGirlActiveStatus, deleteGirl } from '@/actions/girls';
import { formatDZD, formatDate } from '@/lib/utils/formatters';

interface GirlCardProps {
  profile: GirlBalance;
  compact?: boolean;
}

export default function GirlCard({ profile, compact = false }: GirlCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleArchiveToggle = () => {
    setIsOpen(false);
    startTransition(async () => {
      await toggleGirlActiveStatus(profile.girl_id, !profile.is_active);
    });
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete ${profile.name}? This will remove all their transaction history.`)) {
      setIsOpen(false);
      startTransition(async () => {
        await deleteGirl(profile.girl_id);
      });
    }
  };

  const getInitials = (name: string) => {
    return name.slice(0, 1).toUpperCase();
  };

  // Determine Net Balance visual styling
  // Positive = owes money (Debt) -> red
  // Negative = overpaid (Credit) -> green
  const netBalanceText = profile.net_balance > 0 
    ? `Owes: ${formatDZD(profile.net_balance)}` 
    : profile.net_balance < 0 
      ? `Credit: ${formatDZD(Math.abs(profile.net_balance))}` 
      : 'Settled';

  const netBalanceColor = profile.net_balance > 0
    ? 'text-rose-600 bg-rose-50 border-rose-100'
    : profile.net_balance < 0
      ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
      : 'text-zinc-500 bg-zinc-50 border-zinc-100';

  if (compact) {
    return (
      <div className={`group relative rounded-2xl border border-pink-100 bg-white p-4 shadow-sm shadow-pink-100/50 transition hover:shadow-md ${isPending ? 'opacity-60' : ''}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Link
              href={`/girls/${profile.girl_id}`}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pink-100 text-sm font-semibold text-pink-700 transition hover:ring-2 hover:ring-pink-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300"
              aria-label={`View ${profile.name} profile`}
            >
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.name}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                getInitials(profile.name)
              )}
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={`/girls/${profile.girl_id}`} className="truncate text-sm font-semibold text-zinc-950 hover:text-pink-600 block">
                {profile.name}
              </Link>
              <p className="text-xxs text-zinc-400">Joined {formatDate(profile.start_date)}</p>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${netBalanceColor}`}>
                {netBalanceText}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/girls/${profile.girl_id}/service`}
              className="inline-flex items-center gap-2 rounded-xl bg-pink-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-pink-700"
            >
              + Buy
            </Link>
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="h-9 w-9 flex items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 transition hover:border-pink-200 hover:text-pink-700"
              aria-label="Open options"
            >
              ⋯
            </button>
          </div>
        </div>

        {isOpen ? (
          <div className="absolute right-2 top-14 z-10 w-36 rounded-2xl border border-pink-100 bg-white p-2 shadow-[0_10px_30px_rgba(0,0,0,0.1)]">
            <button
              type="button"
              onClick={handleArchiveToggle}
              className="w-full rounded-lg px-3 py-2 text-left text-xs text-zinc-700 transition hover:bg-pink-50"
            >
              {profile.is_active ? 'Archive' : 'Activate'}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="mt-1 w-full rounded-lg px-3 py-2 text-left text-xs text-rose-600 transition hover:bg-rose-50"
            >
              Delete
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`group relative rounded-[1.75rem] border border-pink-100 bg-white p-6 shadow-[0_20px_60px_rgba(236,72,153,0.08)] transition hover:-translate-y-1 hover:shadow-[0_24px_80px_rgba(236,72,153,0.16)] ${isPending ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href={`/girls/${profile.girl_id}`}
            className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-pink-100 text-xl font-semibold text-pink-700 transition hover:ring-2 hover:ring-pink-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300"
            aria-label={`View ${profile.name} profile`}
          >
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              getInitials(profile.name)
            )}
          </Link>
          <div>
            <Link href={`/girls/${profile.girl_id}`} className="text-lg font-semibold text-zinc-950 hover:text-pink-600 block">
              {profile.name}
            </Link>
            <p className="text-xs text-zinc-400">Joined {formatDate(profile.start_date)}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="h-10 w-10 flex items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-600 transition hover:border-pink-200 hover:text-pink-700"
          aria-label="Open options"
        >
          ⋯
        </button>
      </div>

      <div className="mt-6 grid gap-3 rounded-3xl bg-pink-50/50 border border-pink-100/50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500 font-medium">Paid This Month</span>
          <span className="text-sm font-semibold text-emerald-700">+{formatDZD(profile.monthly_paid)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500 font-medium">Debt Added This Month</span>
          <span className="text-sm font-semibold text-rose-600">+{formatDZD(profile.monthly_debt)}</span>
        </div>
        <div className="h-px bg-pink-100 my-1" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-700">Overall Balance</span>
          <span className={`text-sm font-bold px-2 py-0.5 rounded-lg border ${netBalanceColor}`}>
            {netBalanceText}
          </span>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Link
          href={`/girls/${profile.girl_id}/service`}
          className="inline-flex items-center justify-center rounded-2xl bg-pink-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-pink-700"
        >
          + Buy Service
        </Link>
        <Link
          href={`/girls/${profile.girl_id}/payment`}
          className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-pink-200 hover:text-pink-700"
        >
          Pay Debt
        </Link>
        <Link
          href={`/girls/${profile.girl_id}/statistics`}
          className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-500 transition hover:bg-zinc-50"
          title="Statistics"
        >
          📊 Stats
        </Link>
      </div>

      {isOpen ? (
        <div className="absolute right-6 top-24 z-10 w-40 rounded-3xl border border-pink-100 bg-white p-3 shadow-[0_22px_48px_rgba(0,0,0,0.08)]">
          <button
            type="button"
            onClick={handleArchiveToggle}
            className="w-full rounded-2xl px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-pink-50"
          >
            {profile.is_active ? 'Archive Profile' : 'Activate Profile'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="mt-1 w-full rounded-2xl px-3 py-2 text-left text-sm text-rose-600 transition hover:bg-rose-50"
          >
            Delete Profile
          </button>
        </div>
      ) : null}
    </div>
  );
}
