'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GirlBalance } from '@/lib/types';
import { formatDZD } from '@/lib/utils/formatters';

interface ProfileHeaderProps {
  girl: GirlBalance;
}

export default function ProfileHeader({ girl }: ProfileHeaderProps) {
  const pathname = usePathname();

  const getInitials = (name: string) => name.slice(0, 1).toUpperCase();



  // Determine Net Balance visual styling
  const isOwed = girl.net_balance > 0;
  const isCredit = girl.net_balance < 0;
  const netBalanceText = isOwed
    ? `Owes: ${formatDZD(girl.net_balance)}`
    : isCredit
      ? `Credit: ${formatDZD(Math.abs(girl.net_balance))}`
      : 'Settled';

  const netBalanceClass = isOwed
    ? 'text-rose-600 bg-rose-50 border-rose-200'
    : isCredit
      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
      : 'text-zinc-500 bg-zinc-50 border-zinc-200';

  return (
    <div className="space-y-6">
      {/* Profile info block */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border border-pink-100 shadow-[0_20px_50px_rgba(236,72,153,0.05)]">
        <div className="flex items-center gap-5">
          <div className="h-16 w-16 rounded-full bg-pink-100 flex items-center justify-center text-3xl font-semibold text-pink-700 border border-pink-200 shrink-0 overflow-hidden">
            {girl.avatar_url ? (
              <img
                src={girl.avatar_url}
                alt={girl.name}
                className="h-full w-full object-cover"
              />
            ) : (
              getInitials(girl.name)
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-zinc-950">{girl.name}</h1>
              {!girl.is_active && (
                <span className="bg-zinc-100 text-zinc-600 text-xxs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-zinc-200">
                  Archived
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-500">Managing resident account since {new Date(girl.start_date).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Current status stats badges */}
        <div className="flex flex-wrap gap-4 items-center w-full md:w-auto">
          <div className="flex-1 md:flex-none rounded-2xl bg-zinc-50 border border-zinc-100 p-3 text-center min-w-[120px]">
            <p className="text-xxs font-bold text-zinc-400 uppercase tracking-wider">Paid This Month</p>
            <p className="text-base font-bold text-emerald-700 mt-1">+{formatDZD(girl.monthly_paid)}</p>
          </div>
          <div className="flex-1 md:flex-none rounded-2xl bg-zinc-50 border border-zinc-100 p-3 text-center min-w-[120px]">
            <p className="text-xxs font-bold text-zinc-400 uppercase tracking-wider">Debt This Month</p>
            <p className="text-base font-bold text-rose-600 mt-1">+{formatDZD(girl.monthly_debt)}</p>
          </div>
          <div className={`flex-1 md:flex-none rounded-2xl border p-3 text-center min-w-[140px] ${netBalanceClass}`}>
            <p className="text-xxs font-bold uppercase tracking-wider opacity-85">Account Balance</p>
            <p className="text-base font-bold mt-1">{netBalanceText}</p>
          </div>
        </div>
      </div>

    </div>
  );
}
