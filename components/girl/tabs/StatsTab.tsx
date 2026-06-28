'use client';

import { Transaction } from '@/lib/types';
import StatsTable from '@/components/stats/StatsTable';

export default function StatsTab({ transactions }: { transactions: Transaction[] }) {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div>
        <h2 className="text-lg font-bold text-zinc-950">Financial Logs</h2>
        <p className="text-xs text-zinc-500 mt-1">Detailed history of service checkout bills, cash/card collections, rewards, and penalties.</p>
      </div>
      
      <StatsTable transactions={transactions || []} />
    </div>
  );
}
