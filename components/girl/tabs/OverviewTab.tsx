'use client';

import Link from 'next/link';
import { Transaction } from '@/lib/types';
import { formatDZD, formatDate } from '@/lib/utils/formatters';
import ActionButtons from '../ActionButtons';
import { TabType } from '../GirlProfileClientView';

interface Props {
  girlId: string;
  recentTransactions: Transaction[];
  onChangeTab: (tab: TabType) => void;
}

export default function OverviewTab({ girlId, recentTransactions, onChangeTab }: Props) {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Quick Actions Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-zinc-950">Quick Actions</h2>
        
        {/* We recreate the ActionButtons locally so they switch tabs instead of routing */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <button
            onClick={() => onChangeTab('service')}
            className="flex items-center justify-between rounded-3xl border border-pink-100 bg-white p-6 transition hover:-translate-y-1 hover:shadow-md hover:border-pink-200 group"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-50 text-2xl text-pink-600 transition group-hover:scale-110 group-hover:bg-pink-100">
                🛒
              </div>
              <span className="font-bold text-zinc-800">Add Service</span>
            </div>
            <span className="text-zinc-300 font-bold group-hover:text-pink-400 transition">➔</span>
          </button>

          <button
            onClick={() => onChangeTab('payment')}
            className="flex items-center justify-between rounded-3xl border border-pink-100 bg-white p-6 transition hover:-translate-y-1 hover:shadow-md hover:border-pink-200 group"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl text-emerald-600 transition group-hover:scale-110 group-hover:bg-emerald-100">
                💵
              </div>
              <span className="font-bold text-zinc-800">Add Payment</span>
            </div>
            <span className="text-zinc-300 font-bold group-hover:text-emerald-400 transition">➔</span>
          </button>

          <button
            onClick={() => onChangeTab('bonus')}
            className="flex items-center justify-between rounded-3xl border border-pink-100 bg-white p-6 transition hover:-translate-y-1 hover:shadow-md hover:border-pink-200 group"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-2xl text-purple-600 transition group-hover:scale-110 group-hover:bg-purple-100">
                🎁
              </div>
              <span className="font-bold text-zinc-800">Add Bonus</span>
            </div>
            <span className="text-zinc-300 font-bold group-hover:text-purple-400 transition">➔</span>
          </button>
        </div>
      </div>

      <div className="space-y-4 bg-white p-6 rounded-[2rem] border border-pink-100 shadow-[0_15px_45px_rgba(236,72,153,0.02)]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-950">Recent Activity</h2>
            <p className="text-xs text-zinc-500 mt-1">Showing the latest transactions for this resident.</p>
          </div>
          <button
            onClick={() => onChangeTab('stats')}
            className="text-xs font-semibold text-pink-600 hover:text-pink-700 transition"
          >
            View Full History ➔
          </button>
        </div>

        <div className="overflow-hidden border border-pink-50 rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-pink-50/20 text-xxs font-bold text-zinc-500 uppercase tracking-wider border-b border-pink-50">
                <th className="py-3.5 px-5">Date</th>
                <th className="py-3.5 px-5">Type</th>
                <th className="py-3.5 px-5">Amount</th>
                <th className="py-3.5 px-5">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-50 text-xs">
              {!recentTransactions || recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-zinc-400 font-medium">
                    No transactions registered yet.
                  </td>
                </tr>
              ) : (
                recentTransactions.map((tx) => {
                  let amtStyle = 'font-semibold ';
                  let amtSign = '';

                  if (tx.type === 'payment') {
                    amtStyle += 'text-emerald-700';
                    amtSign = '-';
                  } else if (tx.type === 'bonus') {
                    amtStyle += 'text-rose-600';
                    amtSign = '+';
                  } else if (tx.type === 'instant_profit') {
                    const val = Number(tx.amount);
                    if (val > 0) {
                      amtStyle += 'text-emerald-700';
                      amtSign = '+';
                    } else {
                      amtStyle += 'text-rose-600';
                      amtSign = '-';
                    }
                  } else {
                    amtStyle += 'text-rose-600';
                    amtSign = '+';
                  }

                  const displayAmount = tx.type === 'instant_profit'
                    ? formatDZD(Math.abs(Number(tx.amount)))
                    : formatDZD(Number(tx.amount));

                  return (
                    <tr key={tx.id} className="hover:bg-pink-50/10 transition">
                      <td className="py-3 px-5 text-zinc-500">{formatDate(tx.transaction_date)}</td>
                      <td className="py-3 px-5 capitalize font-medium text-zinc-700">{tx.type.replace('_', ' ')}</td>
                      <td className={`py-3 px-5 ${amtStyle}`}>{amtSign}{displayAmount}</td>
                      <td className="py-3 px-5 text-zinc-500 max-w-[200px] truncate" title={tx.note || ''}>
                        {tx.note || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
