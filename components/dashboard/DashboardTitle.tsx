'use client';

import { useTranslation } from '@/lib/i18n/useTranslation';

export default function DashboardTitle() {
  const { t } = useTranslation();

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.35em] text-pink-600 font-bold">{t('dashboard.lesFilles')}</p>
      <h1 className="text-3xl font-bold tracking-tight text-zinc-950 mt-1">{t('dashboard.residentsDashboard')}</h1>
    </div>
  );
}
