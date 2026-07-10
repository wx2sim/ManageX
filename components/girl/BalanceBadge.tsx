'use client';

import { formatDZD } from '@/lib/utils/formatters';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface BalanceBadgeProps {
  balance: number;
}

export default function BalanceBadge({ balance }: BalanceBadgeProps) {
  const { t } = useTranslation();

  const isOwed = balance > 0;
  const isCredit = balance < 0;
  const absoluteValue = Math.abs(balance);

  const text = isOwed
    ? `${t('dashboard.owes')} ${formatDZD(absoluteValue)}`
    : isCredit
      ? `${t('dashboard.credit')} ${formatDZD(absoluteValue)}`
      : t('dashboard.settled');

  const colorClass = isOwed
    ? 'text-rose-600 bg-rose-50 border-rose-100'
    : isCredit
      ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
      : 'text-zinc-500 bg-zinc-50 border-zinc-100';

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${colorClass}`}>
      {text}
    </span>
  );
}
