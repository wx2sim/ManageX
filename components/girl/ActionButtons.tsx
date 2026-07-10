'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface ActionButtonsProps {
  girlId: string;
}

export default function ActionButtons({ girlId }: ActionButtonsProps) {
  const { t } = useTranslation();

  const actions = [
    {
      title: t('actions.buyService'),
      description: t('actions.buyServiceDesc'),
      icon: '🍽️',
      href: `/girls/${girlId}`,
      color: 'bg-pink-50 hover:bg-pink-100/80 border-pink-100 text-pink-700',
    },
    {
      title: t('actions.logPayment'),
      description: t('actions.logPaymentDesc'),
      icon: '💵',
      href: `/girls/${girlId}`,
      color: 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-100 text-emerald-700',
    },
    {
      title: t('actions.awardBonus'),
      description: t('actions.awardBonusDesc'),
      icon: '🎁',
      href: `/girls/${girlId}`,
      color: 'bg-blue-50 hover:bg-blue-100/80 border-blue-100 text-blue-700',
    },
    {
      title: t('actions.logDutyCharge'),
      description: t('actions.logDutyChargeDesc'),
      icon: '⚠️',
      href: `/girls/${girlId}`,
      color: 'bg-rose-50 hover:bg-rose-100/80 border-rose-100 text-rose-700',
    },
    {
      title: t('actions.recurringCharges'),
      description: t('actions.recurringChargesDesc'),
      icon: '⚙️',
      href: `/girls/${girlId}`,
      color: 'bg-purple-50 hover:bg-purple-100/80 border-purple-100 text-purple-700',
    },
    {
      title: t('actions.instantProfitLoss'),
      description: t('actions.instantProfitLossDesc'),
      icon: '📈',
      href: `/instant-profit`, // Instant profit is global
      color: 'bg-amber-50 hover:bg-amber-100/80 border-amber-100 text-amber-700',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {actions.map((act) => (
        <Link
          key={act.title}
          href={act.href}
          className={`flex items-start gap-4 rounded-3xl border p-5 transition hover:-translate-y-0.5 hover:shadow-sm ${act.color}`}
        >
          <span className="text-3xl select-none">{act.icon}</span>
          <div className="space-y-1">
            <h3 className="font-semibold text-zinc-900">{act.title}</h3>
            <p className="text-xs text-zinc-500 leading-normal">{act.description}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
