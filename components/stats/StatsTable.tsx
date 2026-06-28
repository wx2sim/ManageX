'use client';

import { useState, useMemo } from 'react';
import { Transaction, TransactionType } from '@/lib/types';
import { formatDZD, formatDate } from '@/lib/utils/formatters';
import { calculateTransactionSummary } from '@/lib/business_logic';

interface StatsTableProps {
  transactions: Transaction[];
  showGirlColumn?: boolean;
  girlNamesMap?: Record<string, string>; // Maps girl_id to name for global stats page
}

type PeriodFilter = 'all' | 'today' | 'week' | 'month';

export default function StatsTable({ transactions, showGirlColumn = false, girlNamesMap = {} }: StatsTableProps) {
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Filter Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Type Filter
      if (typeFilter !== 'all' && tx.type !== typeFilter) {
        return false;
      }

      // Search Query
      if (searchQuery && tx.note && !tx.note.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Period Filter
      if (periodFilter === 'all') return true;

      const txDate = new Date(tx.transaction_date);
      const now = new Date();

      if (periodFilter === 'today') {
        return txDate.toDateString() === now.toDateString();
      }

      if (periodFilter === 'week') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        return txDate >= oneWeekAgo;
      }

      if (periodFilter === 'month') {
        return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
      }

      return true;
    });
  }, [transactions, typeFilter, periodFilter, searchQuery]);

  // 2. Compute Summary Metrics
  const summary = useMemo(() => {
    return calculateTransactionSummary(filteredTransactions);
  }, [filteredTransactions]);

  const typeLabels: Record<TransactionType | 'all', string> = {
    all: 'All Types',
    service: '🛒 Service Purchase',
    payment: '💵 Debt Payment',
    bonus: '🎁 Bonus Award',
    duty: '⚠️ Duty Penalty',
    fixed_payment: '⚙️ Recurring Charge',
    instant_profit: '📈 Instant Profit/Loss',
  };

  return (
    <div className="space-y-6">
      {/* Summary Widgets Grid */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
          <p className="text-xxs font-bold text-emerald-800 uppercase tracking-wider">Total Income (Cash Collected)</p>
          <p className="text-xl font-bold text-emerald-700 mt-1">+{formatDZD(summary.income)}</p>
        </div>
        <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4">
          <p className="text-xxs font-bold text-rose-800 uppercase tracking-wider">Total Spent (Rewards & Outflows)</p>
          <p className="text-xl font-bold text-rose-600 mt-1">-{formatDZD(summary.spent)}</p>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
          <p className="text-xxs font-bold text-blue-800 uppercase tracking-wider">Net Margin (Income - Spent)</p>
          <p className="text-xl font-bold text-blue-900 mt-1">
            {summary.profit >= 0 ? '+' : ''}{formatDZD(summary.profit)}
          </p>
        </div>
        <div className="rounded-2xl border border-pink-100 bg-pink-50/50 p-4">
          <p className="text-xxs font-bold text-pink-800 uppercase tracking-wider">Total Debt Registered</p>
          <p className="text-xl font-bold text-pink-700 mt-1">+{formatDZD(summary.debtAdded)}</p>
        </div>
      </div>

      {/* Filters Layout */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 p-4 rounded-3xl border border-pink-100/50 shadow-sm">
        {/* Search */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by notes..."
          className="flex-1 max-w-xs rounded-xl border border-pink-100 px-3.5 py-2 text-xs outline-none transition focus:border-pink-300 bg-white"
        />

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Period Filter */}
          <div className="inline-flex rounded-xl border border-pink-100 bg-white p-0.5 text-xs">
            {(['all', 'today', 'week', 'month'] as PeriodFilter[]).map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => setPeriodFilter(period)}
                className={`rounded-lg px-3 py-1.5 font-semibold capitalize transition ${
                  periodFilter === period
                    ? 'bg-pink-600 text-white'
                    : 'text-zinc-500 hover:bg-pink-50'
                }`}
              >
                {period}
              </button>
            ))}
          </div>

          {/* Type Selector */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="rounded-xl border border-pink-100 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 outline-none cursor-pointer"
          >
            {Object.entries(typeLabels).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transactions Table List */}
      <div className="bg-white rounded-3xl border border-pink-100 shadow-[0_15px_40px_rgba(236,72,153,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-pink-50/50 text-xxs font-bold text-zinc-500 uppercase tracking-wider border-b border-pink-100">
                <th className="py-4 px-6">Date</th>
                {showGirlColumn && <th className="py-4 px-6">Resident</th>}
                <th className="py-4 px-6">Type</th>
                <th className="py-4 px-6">Amount</th>
                <th className="py-4 px-6">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-50 text-xs">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={showGirlColumn ? 5 : 4} className="py-12 text-center text-zinc-400 font-medium">
                    No transactions found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  // Style amount depending on sign
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
                    <tr key={tx.id} className="hover:bg-pink-50/20 transition">
                      <td className="py-4 px-6 text-zinc-500">{formatDate(tx.transaction_date)}</td>
                      {showGirlColumn && (
                        <td className="py-4 px-6 font-semibold text-zinc-800">
                          {tx.girl_id ? (girlNamesMap[tx.girl_id] || 'Resident') : 'N/A (Ad-hoc)'}
                        </td>
                      )}
                      <td className="py-4 px-6 font-medium capitalize text-zinc-700">
                        {tx.type.replace('_', ' ')}
                      </td>
                      <td className={`py-4 px-6 ${amtStyle}`}>
                        {amtSign}{displayAmount}
                      </td>
                      <td className="py-4 px-6 text-zinc-600 font-normal max-w-xs truncate" title={tx.note || ''}>
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
