'use client';

import { Transaction } from '@/lib/types';
import StatsTable from '@/components/stats/StatsTable';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function StatsTab({ transactions, girlId, girl }: { transactions: Transaction[]; girlId?: string; girl?: any }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div>
        <h2 className="text-lg font-bold text-zinc-950">{t('stats.financialLogs')}</h2>
        <p className="text-xs text-zinc-500 mt-1">{t('stats.financialLogsDesc')}</p>
      </div>
      
      <StatsTable transactions={transactions || []} girlId={girlId} girl={girl} />
    </div>
  );
}
