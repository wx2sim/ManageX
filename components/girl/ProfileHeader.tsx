'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GirlBalance } from '@/lib/types';
import { formatDZD } from '@/lib/utils/formatters';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface ProfileHeaderProps {
  girl: any; // using any since we added new columns to girl_balances view
  salesProfit?: number;
  globalDzdRent?: number;
  globalEuroRent?: number;
  adminExpenses?: number;
}

export default function ProfileHeader({
  girl,
  salesProfit = 0,
  globalDzdRent = 0,
  globalEuroRent = 0,
  adminExpenses = 0,
}: ProfileHeaderProps) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const getInitials = (name: string) => name.slice(0, 1).toUpperCase();

  // --- ACCOUNTING LOGIC ---
  // Dette Ce Mois = remaining unpaid debt this month (services consumed - payments made, floored at 0)
  const monthlyDebtRaw = Number(girl.monthly_debt) || 0;
  const monthlyPaidRaw = Number(girl.monthly_paid) || 0;
  const monthlyRemaining = Math.max(0, monthlyDebtRaw - monthlyPaidRaw);

  // net_balance: negative = owes money (debt), positive = overpaid (credit), 0 = settled
  // Modified to show the difference between monthly paid and monthly debt this month
  const netBalance = monthlyPaidRaw - monthlyDebtRaw;
  const hasDebt = netBalance < 0;
  const hasCredit = netBalance > 0;
  const netBalanceText = hasDebt
    ? `${t('dashboard.owes')}: -${formatDZD(Math.abs(netBalance))}`
    : hasCredit
      ? `${t('dashboard.credit')}: +${formatDZD(netBalance)}`
      : t('dashboard.settled');

  const netBalanceClass = hasDebt
    ? 'text-rose-600 bg-rose-50 border-rose-200'
    : hasCredit
      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
      : 'text-zinc-500 bg-zinc-50 border-zinc-200';

  // Recurring Balance: negative = owes rent, positive/zero = even or credit
  const recurringBalance = Number(girl.recurring_balance) || 0;
  const isRecurringOwed = recurringBalance < 0;
  const recurringBalanceClass = isRecurringOwed
    ? 'text-orange-600 bg-orange-50 border-orange-200'
    : recurringBalance === 0
      ? 'text-zinc-500 bg-zinc-50 border-zinc-200'
      : 'text-purple-700 bg-purple-50 border-purple-200';
  const recurringBalanceText = isRecurringOwed
    ? `-${formatDZD(Math.abs(recurringBalance))}`
    : recurringBalance === 0
      ? t('dashboard.settled')
      : `+${formatDZD(recurringBalance)}`;

  // Admin Difference: salesProfit - adminExpenses + netBalance (netBalance is negative if there is a debt, positive if credit)
  const adminDiff = salesProfit - adminExpenses + netBalance;
  const isDiffPositive = adminDiff >= 0;
  const adminDiffClass = isDiffPositive
    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
    : 'text-rose-600 bg-rose-50 border-rose-200';
  const adminDiffText = isDiffPositive
    ? `+${formatDZD(adminDiff)}`
    : `-${formatDZD(Math.abs(adminDiff))}`;

  return (
    <div className="space-y-6">
      {/* Profile info block */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border border-pink-100 shadow-[0_20px_50px_rgba(236,72,153,0.05)]">
        <div className="flex items-center gap-5">
          <div className="h-16 w-16 rounded-full bg-pink-100 flex items-center justify-center text-3xl font-semibold text-pink-700 border border-pink-200 shrink-0 overflow-hidden">
            {getInitials(girl.name)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-zinc-950">{girl.name}</h1>
              {!girl.is_active && (
                <span className="bg-zinc-100 text-zinc-600 text-xxs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-zinc-200">
                  {t('dashboard.archived')}
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-500">{t('profile.managingSince').replace('{date}', new Date(girl.start_date).toLocaleDateString())}</p>
          </div>
        </div>

        {/* Current status stats badges */}
        <div className="flex flex-wrap gap-4 items-center w-full md:w-auto">
          {girl.account_type === 'admin' ? (
            <>
              {/* Card 1: Profit Net de Service */}
              <div className="flex-1 md:flex-none rounded-2xl bg-emerald-50/50 border border-emerald-100 p-4 text-center min-w-[140px] shadow-sm transition hover:shadow-md">
                <p className="text-xxs font-bold text-emerald-800 uppercase tracking-wider">{t('profile.netServiceProfit')}</p>
                <p className="text-lg font-extrabold text-emerald-700 mt-1">+{formatDZD(salesProfit)}</p>
              </div>

              {/* Card 2: Loyer Perçu (Global) */}
              <div className="flex-1 md:flex-none rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-4 text-center min-w-[170px] shadow-sm transition hover:shadow-md">
                <p className="text-xxs font-bold text-blue-800 uppercase tracking-wider">{t('profile.globalRentReceived')}</p>
                <div className="flex items-center justify-center gap-2 mt-1.5 font-extrabold text-xs">
                  <span className="text-blue-700">+{formatDZD(globalDzdRent)}</span>
                  <span className="text-zinc-300">|</span>
                  <span className="text-indigo-600">+€{globalEuroRent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Card 3: Dette Ce Mois-ci */}
              <div className="flex-1 md:flex-none rounded-2xl bg-zinc-50 border border-zinc-100 p-4 text-center min-w-[140px] shadow-sm transition hover:shadow-md">
                <p className="text-xxs font-bold text-zinc-400 uppercase tracking-wider">{t('dashboard.debtThisMonth')}</p>
                <p className={`text-lg font-extrabold mt-1 ${monthlyRemaining > 0 ? 'text-rose-600' : 'text-zinc-500'}`}>
                  {monthlyRemaining > 0 ? `-${formatDZD(monthlyRemaining)}` : formatDZD(0)}
                </p>
              </div>

              {/* Card 4: Profit Net Restant */}
              <div className={`flex-1 md:flex-none rounded-2xl border p-4 text-center min-w-[140px] shadow-sm transition hover:shadow-md ${adminDiffClass}`}>
                <p className="text-xxs font-bold uppercase tracking-wider opacity-85 text-center">{t('profile.netProfitRemaining')}</p>
                <p className="text-lg font-extrabold mt-1 text-center">{adminDiffText}</p>
              </div>
            </>
          ) : (
            <>
              <div className="flex-1 md:flex-none rounded-2xl bg-zinc-50 border border-zinc-100 p-3 text-center min-w-[120px]">
                <p className="text-xxs font-bold text-zinc-400 uppercase tracking-wider">{t('dashboard.paidThisMonth')}</p>
                <p className="text-base font-bold text-emerald-700 mt-1">+{formatDZD(monthlyPaidRaw)}</p>
              </div>
              <div className="flex-1 md:flex-none rounded-2xl bg-zinc-50 border border-zinc-100 p-3 text-center min-w-[120px]">
                <p className="text-xxs font-bold text-zinc-400 uppercase tracking-wider">{t('dashboard.debtThisMonth')}</p>
                <p className={`text-base font-bold mt-1 ${monthlyDebtRaw > 0 ? 'text-rose-600' : 'text-zinc-400'}`}>
                  {monthlyDebtRaw > 0 ? `-${formatDZD(monthlyDebtRaw)}` : formatDZD(0)}
                </p>
              </div>
              <div className={`flex-1 md:flex-none rounded-2xl border p-3 text-center min-w-[140px] ${netBalanceClass}`}>
                <p className="text-xxs font-bold uppercase tracking-wider opacity-85">{t('common.status')}</p>
                <p className="text-base font-bold mt-1">{netBalanceText}</p>
              </div>
              <div className={`flex-1 md:flex-none rounded-2xl border p-3 text-center min-w-[140px] ${recurringBalanceClass}`}>
                <p className="text-xxs font-bold uppercase tracking-wider opacity-85 text-center">{t('profile.recurringDebt')}</p>
                <p className="text-base font-bold mt-1 text-center">{recurringBalanceText}</p>
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
}
