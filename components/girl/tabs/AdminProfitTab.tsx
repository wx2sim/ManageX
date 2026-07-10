'use client';

import { useOverlayTransition } from '@/lib/context/OverlayContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAdminStats, addAdminExpense, deleteAdminExpense } from '@/actions/admin';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { formatDZD, formatDate } from '@/lib/utils/formatters';

interface AdminProfitTabProps {
  girlId: string;
  girl: any;
}

export default function AdminProfitTab({ girlId, girl }: AdminProfitTabProps) {
  const router = useRouter();
  const [isPending, startTransition] = useOverlayTransition();
  
  // Loading & State
  const [stats, setStats] = useState<any>(null);
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  // Form State
  const [amountStr, setAmountStr] = useState('');
  const [noteStr, setNoteStr] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const monthlyDebtRaw = Number(girl?.monthly_debt) || 0;
  const monthlyPaidRaw = Number(girl?.monthly_paid) || 0;
  const monthlyRemaining = Math.max(0, monthlyDebtRaw - monthlyPaidRaw);

  const handleDeleteExpense = (txId: string) => {
    if (!confirm(t('admin.confirmDeleteExpense') || 'Voulez-vous vraiment supprimer cette dépense ?')) return;
    startTransition(async () => {
      const res = await deleteAdminExpense(txId, girlId);
      if (res?.error) {
        alert(res.error);
      } else {
        fetchStats();
        router.refresh();
      }
    });
  };

  const fetchStats = async () => {
    setLoading(true);
    const res = await getAdminStats(girlId, selectedMonth);
    if (res?.error) {
      setError(res.error);
    } else {
      setStats(res);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, [girlId, selectedMonth]);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const amount = parseFloat(amountStr);

    if (isNaN(amount) || amount <= 0) {
      setFormError('Please enter a valid amount.');
      return;
    }

    startTransition(async () => {
      const res = await addAdminExpense(girlId, amount, noteStr);
      if (res?.error) {
        setFormError(res.error);
      } else {
        setAmountStr('');
        setNoteStr('');
        fetchStats();
        router.refresh();
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 font-medium">
        Failed to load stats: {error}
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2 items-start animate-in fade-in duration-300">
      {/* LEFT COLUMN: Net Profit Summary */}
      <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-100/50 rounded-[2.5rem] p-6 md:p-8 space-y-6 shadow-sm">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] bg-emerald-100 border border-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              {t('admin.financeBilan')}
            </span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs font-bold text-zinc-700 bg-white border border-emerald-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
            />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 mt-2">{t('admin.netProfitFromSales')}</h2>
          <p className="text-xs text-zinc-500 mt-1">
            {t('admin.netProfitDesc')}
          </p>
        </div>

        <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 border border-emerald-100/50 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-emerald-100/30">
            <span className="text-xs font-semibold text-zinc-500">{t('admin.grossProfit')}</span>
            <span className="text-sm font-bold text-zinc-800">+{formatDZD(stats?.netProfitFromSales || 0)}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-emerald-100/30">
            <span className="text-xs font-semibold text-zinc-500">{t('admin.totalCharges')}</span>
            <span className="text-sm font-bold text-rose-600">-{formatDZD(stats?.totalExpenses || 0)}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-emerald-100/30">
            <span className="text-xs font-semibold text-zinc-500">{t('dashboard.debtThisMonth')} (Admin)</span>
            <span className="text-sm font-bold text-rose-600">-{formatDZD(monthlyRemaining)}</span>
          </div>
          <div className="text-center pt-2">
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-widest">{t('admin.totalNetProfit')}</p>
            <p className={`text-3xl font-extrabold mt-2 ${
              ((stats?.netProfitFromSales || 0) - (stats?.totalExpenses || 0) - monthlyRemaining) < 0 
                ? 'text-rose-600' 
                : 'text-emerald-600'
            }`}>
              {((stats?.netProfitFromSales || 0) - (stats?.totalExpenses || 0) - monthlyRemaining) < 0 
                ? `-${formatDZD(Math.abs((stats?.netProfitFromSales || 0) - (stats?.totalExpenses || 0) - monthlyRemaining))}`
                : `+${formatDZD((stats?.netProfitFromSales || 0) - (stats?.totalExpenses || 0) - monthlyRemaining)}`}
            </p>
          </div>
        </div>

        <div className="text-xs text-emerald-850/80 leading-relaxed bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/30">
          {t('admin.adminNote')}
        </div>
      </div>

      {/* RIGHT COLUMN: Expenses Logging */}
      <div className="bg-white/60 backdrop-blur-md rounded-[2.5rem] border border-pink-100/50 p-6 md:p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">{t('admin.expenses')}</h2>
          <p className="text-xs text-zinc-500 mt-1">{t('admin.logExpensesDesc')}</p>
        </div>

        <div className="bg-pink-50/30 border border-pink-100/40 rounded-3xl p-5 flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('admin.totalExpensesLogged')}</span>
          <span className="text-xl font-bold text-rose-600">
            {formatDZD(stats?.totalExpenses || 0)}
          </span>
        </div>

        {/* Add Expense Form */}
        <form onSubmit={handleAddExpense} className="space-y-4 pt-2">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{t('admin.addExpenseForm')}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xxs font-bold text-zinc-700 uppercase tracking-wider mb-1">{t('admin.amount')}</label>
              <input
                type="number"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                disabled={isPending}
                className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-60 bg-white"
                placeholder="0"
                min="1"
                step="any"
                required
              />
            </div>
            <div>
              <label className="block text-xxs font-bold text-zinc-700 uppercase tracking-wider mb-1">{t('admin.noteDesc')}</label>
              <input
                type="text"
                value={noteStr}
                onChange={(e) => setNoteStr(e.target.value)}
                disabled={isPending}
                className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-60 bg-white"
                placeholder={t('admin.notePlaceholder') || "Ex: Bill, Repair..."}
                required
              />
            </div>
          </div>

          {formError && (
            <div className="text-xs text-rose-600 font-medium bg-rose-50 p-3 rounded-xl border border-rose-100">
              {formError}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-semibold text-xs py-3.5 shadow-md shadow-pink-500/10 transition hover:-translate-y-0.5"
          >
            {isPending ? t('admin.loggingExpense') : t('admin.logExpense')}
          </button>
        </form>

        {/* Expenses List */}
        {stats?.expenses && stats.expenses.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-pink-50">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{t('admin.recentExpenses')} ({stats.expenses.length})</h3>
            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
              {stats.expenses.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 border border-zinc-100">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-zinc-800 truncate">{tx.note}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{formatDate(tx.transaction_date)}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <span className="text-xs font-bold text-rose-600">
                      +{formatDZD(tx.amount)}
                    </span>
                    <button
                      onClick={() => handleDeleteExpense(tx.id)}
                      disabled={isPending}
                      className="p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                      title={t('admin.deleteExpense') || 'Delete Expense'}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
