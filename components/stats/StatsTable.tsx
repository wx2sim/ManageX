'use client';

import { useState, useMemo, useTransition } from 'react';
import { Transaction, TransactionType } from '@/lib/types';
import { formatDZD, formatDate } from '@/lib/utils/formatters';
import { calculateTransactionSummary } from '@/lib/business_logic';
import { extractBonusBucket, extractAllGlobalBonuses } from '@/actions/business_logic';

interface StatsTableProps {
  transactions: Transaction[];
  showGirlColumn?: boolean;
  girlNamesMap?: Record<string, string>; // Maps girl_id to name for global stats page
  girlId?: string; // If passed, it's for a specific resident. Otherwise, it's global.
}

type PeriodFilter = 'all' | 'today' | 'week' | 'month';

export default function StatsTable({ transactions, showGirlColumn = false, girlNamesMap = {}, girlId }: StatsTableProps) {
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [specificDateFilter, setSpecificDateFilter] = useState('');
  const [residentFilter, setResidentFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Extraction Modal State
  const [isExtractModalOpen, setIsExtractModalOpen] = useState(false);
  const [extractAmountStr, setExtractAmountStr] = useState('');
  const [isExtracting, startTransition] = useTransition();
  const [extractError, setExtractError] = useState<string | null>(null);

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

      // Resident Filter
      if (residentFilter !== 'all') {
        if (residentFilter === 'admin') {
          if (tx.girl_id) return false;
        } else {
          if (tx.girl_id !== residentFilter) return false;
        }
      }

      // Specific Date Filter
      if (specificDateFilter) {
        const txDate = new Date(tx.transaction_date);
        const filterDate = new Date(specificDateFilter);
        return txDate.toDateString() === filterDate.toDateString();
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
  }, [transactions, typeFilter, periodFilter, specificDateFilter, residentFilter, searchQuery]);

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
    market_expense: '🛍️ Market Expense',
  };

  const handleOpenExtractModal = () => {
    if (summary.bonusReceived <= 0) return;
    setExtractAmountStr(summary.bonusReceived.toString());
    setExtractError(null);
    setIsExtractModalOpen(true);
  };

  const handleExtractSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setExtractError(null);
    const amount = parseFloat(extractAmountStr);

    if (isNaN(amount) || amount <= 0) {
      setExtractError('Please enter a valid amount to extract.');
      return;
    }
    
    if (girlId && amount > summary.bonusReceived) {
      setExtractError('Cannot extract more than what is in the bucket.');
      return;
    }

    startTransition(async () => {
      let res;
      if (girlId) {
        // Resident specific extraction
        res = await extractBonusBucket(girlId, amount);
      } else {
        // Global extraction (always extracts all)
        res = await extractAllGlobalBonuses();
      }

      if (res?.error) {
        setExtractError(res.error);
      } else {
        setIsExtractModalOpen(false);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Extraction Modal */}
      {isExtractModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-zinc-900 mb-2">Extract Gifts & Awards</h3>
            <p className="text-sm text-zinc-500 mb-6">
              {girlId 
                ? 'Extract money from this resident\'s bucket into the global company profit.' 
                : 'Extract all available gifts across ALL residents into the global company profit.'}
            </p>
            
            <form onSubmit={handleExtractSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                  Amount to Extract
                </label>
                <input
                  type="number"
                  value={extractAmountStr}
                  onChange={(e) => setExtractAmountStr(e.target.value)}
                  disabled={!girlId || isExtracting} // Lock input for global extraction
                  className="w-full rounded-xl border border-purple-200 bg-purple-50/50 px-4 py-3 text-lg font-bold text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-60"
                  max={girlId ? summary.bonusReceived : undefined}
                />
              </div>

              {extractError && (
                <div className="text-xs text-rose-600 font-medium bg-rose-50 p-3 rounded-xl border border-rose-100">
                  {extractError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsExtractModalOpen(false)}
                  disabled={isExtracting}
                  className="flex-1 rounded-xl bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isExtracting}
                  className="flex-1 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-500/20 transition hover:bg-purple-700 disabled:opacity-50"
                >
                  {isExtracting ? 'Extracting...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Summary Widgets Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
        <div 
          onClick={handleOpenExtractModal}
          className={`rounded-2xl border border-purple-100 bg-purple-50/50 p-4 shadow-sm relative overflow-hidden transition ${summary.bonusReceived > 0 ? 'cursor-pointer hover:bg-purple-100 hover:border-purple-300 hover:shadow-purple-500/10' : 'opacity-70 grayscale'}`}
          title={summary.bonusReceived > 0 ? "Click to extract to profit" : "No gifts available"}
        >
          <div className="absolute top-0 right-0 p-2 opacity-10 text-2xl">🎁</div>
          <p className="text-xxs font-bold text-purple-800 uppercase tracking-wider">Gifts & Awards</p>
          <p className="text-xl font-bold text-purple-700 mt-1">
            {formatDZD(summary.bonusReceived)}
          </p>
        </div>
      </div>

      {/* Filters Layout */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white/70 p-4 rounded-3xl border border-pink-100/50 shadow-sm">
        {/* Search */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by notes..."
          className="w-full xl:max-w-xs rounded-xl border border-pink-100 px-3.5 py-2 text-xs outline-none transition focus:border-pink-300 bg-white"
        />

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Specific Date Filter */}
          <div className="flex items-center gap-2 bg-white rounded-xl border border-pink-100 px-2 py-1">
            <label className="text-xxs font-bold text-zinc-400 uppercase tracking-wider pl-1">Date</label>
            <input
              type="date"
              value={specificDateFilter}
              onChange={(e) => {
                setSpecificDateFilter(e.target.value);
                if (e.target.value) setPeriodFilter('all'); // Reset period when specific date chosen
              }}
              className="px-2 py-1 text-xs outline-none cursor-pointer bg-transparent text-zinc-700 font-semibold"
            />
          </div>

          {/* Period Filter (Hidden if specific date is active to avoid confusion) */}
          {!specificDateFilter && (
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
          )}

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

          {/* Resident Filter (Only on Global Stats) */}
          {showGirlColumn && (
            <select
              value={residentFilter}
              onChange={(e) => setResidentFilter(e.target.value)}
              className="rounded-xl border border-pink-100 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 outline-none cursor-pointer"
            >
              <option value="all">All Residents</option>
              {Object.entries(girlNamesMap).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
              <option value="admin">Admin / Global</option>
            </select>
          )}
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

                  const isExtraction = tx.type === 'instant_profit' && tx.note?.toLowerCase().includes('extract');
                  const displayType = isExtraction ? 'money extracted' : tx.type.replace('_', ' ');
                  const displayResident = tx.girl_id 
                    ? (girlNamesMap[tx.girl_id] || 'Resident') 
                    : (isExtraction ? 'Admin' : 'N/A (Ad-hoc)');

                  return (
                    <tr key={tx.id} className="hover:bg-pink-50/20 transition">
                      <td className="py-4 px-6 text-zinc-500">{formatDate(tx.transaction_date)}</td>
                      {showGirlColumn && (
                        <td className="py-4 px-6 font-semibold text-zinc-800">
                          {displayResident}
                        </td>
                      )}
                      <td className="py-4 px-6 font-medium capitalize text-zinc-700">
                        {displayType}
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
