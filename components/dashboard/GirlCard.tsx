'use client';

import { useOverlayTransition } from '@/lib/context/OverlayContext';
import { useState } from 'react';
import Link from 'next/link';
import { GirlBalance } from '@/lib/types';
import { updateGirlStatus, toggleGirlActiveStatus, deleteGirl } from '@/actions/girls';
import { formatDZD, formatDate } from '@/lib/utils/formatters';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface GirlCardProps {
  profile: any; // using any since girl_balances has new columns
  compact?: boolean;
}

export default function GirlCard({ profile, compact = false }: GirlCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useOverlayTransition();
  const { t } = useTranslation();

  const handleArchiveToggle = () => {
    setIsOpen(false);
    startTransition(async () => {
      // Toggle between active and archived
      const newStatus = (profile.status || (profile.is_active ? 'active' : 'archived')) === 'active' ? 'archived' : 'active';
      await updateGirlStatus(profile.girl_id, newStatus);
    });
  };

  const handleBlockToggle = () => {
    setIsOpen(false);
    startTransition(async () => {
      // Toggle between blocked and active
      const currentStatus = profile.status || (profile.is_active ? 'active' : 'archived');
      const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
      await updateGirlStatus(profile.girl_id, newStatus);
    });
  };

  const handleNuiteeDone = () => {
    startTransition(async () => {
      await updateGirlStatus(profile.girl_id, 'archived');
    });
  };

  const handleDelete = () => {
    if (confirm(t('dashboard.deleteConfirm').replace('{name}', profile.name))) {
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
  // Negative = owes money (Debt) -> red
  // Positive = overpaid (Credit) -> green
  const netBal = Number(profile.net_balance) || 0;
  const netBalanceText = netBal < 0
    ? `${t('dashboard.owes')}: -${formatDZD(Math.abs(netBal))}`
    : netBal > 0
      ? `${t('dashboard.credit')}: +${formatDZD(netBal)}`
      : t('dashboard.settled');

  const netBalanceColor = netBal < 0
    ? 'text-rose-600 bg-rose-50 border-rose-100'
    : netBal > 0
      ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
      : 'text-zinc-500 bg-zinc-50 border-zinc-100';

  const currentStatus = profile.status || (profile.is_active ? 'active' : 'archived');
  const isNuitee = profile.account_type === 'nuitee';
  const isAdmin = profile.account_type === 'admin';
  
  // SELECT CARD STYLING ACCORDING TO ACCOUNT TYPE
  const cardBgClass = isAdmin
    ? 'bg-[#DD2D4A] border-[#b6223a] shadow-[#DD2D4A]/40 text-white'
    : isNuitee 
      ? 'bg-gradient-to-br from-fuchsia-500 to-purple-600 border-fuchsia-400 shadow-fuchsia-500/30 text-white' 
      : 'bg-white border-pink-100 shadow-pink-100/50';
    
  const avatarBgClass = (isNuitee || isAdmin)
    ? 'bg-white/20 text-white ring-white/30 backdrop-blur-sm' 
    : 'bg-pink-100 text-pink-700 ring-pink-200';
    
  const hoverTextClass = isAdmin
    ? 'group-hover:text-white'
    : isNuitee 
      ? 'group-hover:text-fuchsia-100' 
      : 'group-hover:text-pink-600';

  const subtextColor = (isNuitee || isAdmin) ? 'text-zinc-300' : 'text-zinc-400';
  const headingColor = (isNuitee || isAdmin) ? 'text-white' : 'text-zinc-950';

  if (compact) {
    return (
      <div className={`group relative rounded-2xl border p-4 shadow-sm transition hover:shadow-md ${cardBgClass} ${isPending ? 'opacity-60' : ''}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Link
              href={`/girls/${profile.girl_id}`}
              className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${avatarBgClass} text-sm font-semibold transition hover:ring-2 focus-visible:outline-none focus-visible:ring-2`}
              aria-label={`${t('dashboard.viewProfile')} ${profile.name}`}
            >
              {profile.avatar_url ? (
                <span className="text-[1.25em] leading-none block transform translate-y-[1px]">{profile.avatar_url}</span>
              ) : (
                getInitials(profile.name)
              )}
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Link href={`/girls/${profile.girl_id}`} className={`truncate text-sm font-semibold ${headingColor} transition ${hoverTextClass}`}>
                  {profile.name}
                </Link>
                {isAdmin && <span className="bg-white/20 text-[9px] font-bold tracking-wider px-1.5 py-0.2 rounded-full uppercase border border-white/30 text-white">{t('common.admin')}</span>}
              </div>
              <p className={`text-xxs ${subtextColor}`}>{t('common.joined')} {formatDate(profile.start_date)}</p>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${netBalanceColor}`}>
                {netBalanceText}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href={`/girls/${profile.girl_id}`}
              className={`inline-flex w-full items-center justify-center rounded-2xl ${isAdmin ? 'bg-white text-[#DD2D4A] hover:bg-white/90' : isNuitee ? 'bg-white text-fuchsia-700 hover:bg-fuchsia-50' : 'bg-pink-600 text-white hover:bg-pink-700'} px-4 py-3.5 text-sm font-bold shadow-lg transition hover:-translate-y-0.5`}
            >
              {t('dashboard.buyService')}
            </Link>
            <Link
              href={`/girls/${profile.girl_id}`}
              className={`inline-flex w-full items-center justify-center rounded-2xl px-4 py-3.5 text-sm font-bold shadow-sm border transition ${(isNuitee || isAdmin) ? 'bg-white/10 text-white border-white/20 hover:bg-white/20' : 'bg-white text-zinc-700 border-pink-200 hover:bg-pink-50 hover:text-pink-700'}`}
            >
              {t('dashboard.viewProfile')}
            </Link>
          </div>
        </div>

        {!isAdmin && isOpen ? (
          <div className="absolute right-2 top-14 z-10 w-36 rounded-2xl border border-pink-100 bg-white p-2 shadow-[0_10px_30px_rgba(0,0,0,0.1)]">
            <button
              type="button"
              onClick={handleBlockToggle}
              className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
            >
              {currentStatus === 'blocked' ? t('common.unblock') || 'Unblock' : t('common.block') || 'Block'}
            </button>
            <button
              type="button"
              onClick={handleArchiveToggle}
              className="w-full rounded-lg px-3 py-2 text-left text-xs text-zinc-700 transition hover:bg-pink-50"
            >
              {currentStatus === 'archived' ? t('common.unarchive') || 'Unarchive' : t('common.archive') || 'Archive'}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="mt-1 w-full rounded-lg px-3 py-2 text-left text-xs text-rose-600 transition hover:bg-rose-50"
            >
              {t('common.delete')}
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`group relative rounded-[1.75rem] border p-6 transition hover:-translate-y-1 ${cardBgClass} ${isPending ? 'opacity-60' : ''} ${isNuitee ? 'hover:shadow-[0_24px_80px_rgba(168,85,247,0.16)] shadow-[0_20px_60px_rgba(168,85,247,0.08)]' : 'hover:shadow-[0_24px_80px_rgba(236,72,153,0.16)] shadow-[0_20px_60px_rgba(236,72,153,0.08)]'}`}>
      <div className="flex items-center justify-between gap-4">
        <Link
          href={`/girls/${profile.girl_id}`}
          className="flex flex-col items-center gap-4 w-full"
          aria-label={`View ${profile.name} profile`}
        >
          <div className={`inline-flex h-20 w-20 items-center justify-center rounded-[2rem] ${avatarBgClass} text-2xl font-semibold transition group-hover:scale-105`}>
            {profile.avatar_url ? (
              <span className="text-[2em] leading-none block transform translate-y-[2px]">{profile.avatar_url}</span>
            ) : (
              getInitials(profile.name)
            )}
          </div>
          <div className="text-center">
            <h3 className={`text-xl font-bold transition flex items-center justify-center gap-2 ${headingColor} ${hoverTextClass}`}>
              {profile.name}
              {isAdmin && <span className="bg-white/20 text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full uppercase border border-white/30 text-white">{t('common.admin')}</span>}
            </h3>
            <p className={`mt-1 text-xs font-medium ${subtextColor}`}>
              {t('common.joined')} {formatDate(profile.start_date)}
            </p>
          </div>
        </Link>
        {!isAdmin && (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); setIsOpen(!isOpen); }}
            className={`absolute top-6 right-6 h-10 w-10 flex items-center justify-center rounded-2xl border transition ${isNuitee ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : 'border-zinc-200 bg-white text-zinc-600 hover:border-pink-200 hover:text-pink-700'}`}
            aria-label="Open options"
          >
            ⋯
          </button>
        )}
      </div>

      <div className="border-t border-pink-50 bg-gradient-to-b from-transparent to-pink-50/30 p-6 pt-5">
        <div className="mb-5 rounded-2xl bg-white p-4 shadow-sm border border-pink-100/50">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">
            {t('dashboard.netBalance')}
          </p>
          <div className="flex items-center justify-center">
          </div>
        </div>
      </div>

      <div className={`mt-6 grid gap-3 rounded-3xl border p-4 ${(isNuitee || isAdmin) ? 'bg-white/10 border-white/10' : 'bg-pink-50/50 border-pink-100/50'}`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-medium ${(isNuitee || isAdmin) ? 'text-zinc-300' : 'text-zinc-500'}`}>{t('dashboard.paidThisMonth')}</span>
          <span className={`text-sm font-semibold ${(isNuitee || isAdmin) ? 'text-emerald-300' : 'text-emerald-700'}`}>+{formatDZD(profile.monthly_paid)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-medium ${(isNuitee || isAdmin) ? 'text-zinc-300' : 'text-zinc-500'}`}>{t('dashboard.debtAddedThisMonth') || 'Debt Added This Month'}</span>
          <span className={`text-sm font-semibold ${(isNuitee || isAdmin) ? 'text-rose-300' : 'text-rose-600'}`}>+{formatDZD(profile.monthly_debt)}</span>
        </div>
        <div className={`h-px my-1 ${(isNuitee || isAdmin) ? 'bg-white/10' : 'bg-pink-100'}`} />
        <div className="flex items-center justify-between">
          <span className={`text-xs font-semibold ${(isNuitee || isAdmin) ? 'text-white' : 'text-zinc-700'}`}>{t('dashboard.servicesBalance') || 'Services Balance'}</span>
          <span className={`text-sm font-bold px-2 py-0.5 rounded-lg border ${netBalanceColor}`}>
            {netBalanceText}
          </span>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Link
          href={`/girls/${profile.girl_id}`}
          className={`inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold transition ${isAdmin ? 'bg-white text-[#DD2D4A] hover:bg-white/90' : isNuitee ? 'bg-white text-fuchsia-700 hover:bg-fuchsia-50' : 'bg-pink-600 text-white hover:bg-pink-700'}`}
        >
          {t('dashboard.buyService') || '+ Buy Service'}
        </Link>
        {isNuitee && currentStatus === 'active' && (
          <button
            onClick={handleNuiteeDone}
            className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"
          >
            {t('dashboard.done') || '✓ Done'}
          </button>
        )}
      </div>

      {!isAdmin && isOpen ? (
        <div className="absolute right-6 top-24 z-10 w-40 rounded-3xl border border-pink-100 bg-white p-3 shadow-[0_22px_48px_rgba(0,0,0,0.08)]">
          <button
            type="button"
            onClick={handleBlockToggle}
            className="w-full rounded-2xl px-3 py-2 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
          >
            {currentStatus === 'blocked' ? t('common.unblock') || 'Unblock' : t('common.block') || 'Block'}
          </button>
          <button
            type="button"
            onClick={handleArchiveToggle}
            className="w-full rounded-2xl px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-pink-50"
          >
            {currentStatus === 'active' ? t('common.archive') : t('common.unarchive')}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="mt-1 w-full rounded-2xl px-3 py-2 text-left text-sm text-rose-600 transition hover:bg-rose-50"
          >
            {t('common.delete')}
          </button>
        </div>
      ) : null}
    </div>
  );
}
