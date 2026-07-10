'use client';

import { useOverlayTransition } from '@/lib/context/OverlayContext';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Transaction } from '@/lib/types';
import { formatDZD, formatDate } from '@/lib/utils/formatters';
import ActionButtons from '../ActionButtons';
import { TabType } from '../GirlProfileClientView';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { addNeed, completeResidentDemand, deleteNeed } from '@/actions/needs';

interface Props {
  girlId: string;
  girl: any;
  recentTransactions: Transaction[];
  onChangeTab: (tab: TabType) => void;
  activeDemands?: any[];
}

export default function OverviewTab({ girlId, girl, recentTransactions, onChangeTab, activeDemands = [] }: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const [isPending, startTransition] = useOverlayTransition();

  const isAdmin = girl?.account_type === 'admin';

  // Add Demand Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDemandTitle, setNewDemandTitle] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  // Resolve Demand Modal State
  const [resolvingDemand, setResolvingDemand] = useState<any | null>(null);
  const [buyPriceStr, setBuyPriceStr] = useState('');
  const [sellPriceStr, setSellPriceStr] = useState('');
  const [resolveError, setResolveError] = useState<string | null>(null);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    if (!newDemandTitle.trim()) {
      setAddError('Please enter a description.');
      return;
    }

    startTransition(async () => {
      const res = await addNeed('resident_demand', newDemandTitle, null, girlId);
      if (res?.error) {
        setAddError(res.error);
      } else {
        setNewDemandTitle('');
        setIsAddModalOpen(false);
        router.refresh();
      }
    });
  };

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResolveError(null);
    const buyPrice = parseFloat(buyPriceStr);
    const sellPrice = parseFloat(sellPriceStr);

    if (isNaN(buyPrice) || buyPrice < 0) {
      setResolveError('Please enter a valid buy price.');
      return;
    }
    if (isNaN(sellPrice) || sellPrice < 0) {
      setResolveError('Please enter a valid sell price.');
      return;
    }

    startTransition(async () => {
      const res = await completeResidentDemand(resolvingDemand.id, buyPrice, sellPrice);
      if (res?.error) {
        setResolveError(res.error);
      } else {
        setBuyPriceStr('');
        setSellPriceStr('');
        setResolvingDemand(null);
        router.refresh();
      }
    });
  };

  const handleDelete = (needId: string) => {
    if (confirm('Delete this demand?')) {
      startTransition(async () => {
        const res = await deleteNeed(needId);
        if (res?.error) {
          alert(res.error);
        } else {
          router.refresh();
        }
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Quick Actions Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-zinc-950">{t('overview.quickActions')}</h2>
        
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
              <span className="font-bold text-zinc-800">{t('overview.addService')}</span>
            </div>
            <span className="text-zinc-300 font-bold group-hover:text-pink-400 transition">➔</span>
          </button>

          {!isAdmin && (
            <>
              <button
                onClick={() => onChangeTab('payment')}
                className="flex items-center justify-between rounded-3xl border border-pink-100 bg-white p-6 transition hover:-translate-y-1 hover:shadow-md hover:border-pink-200 group"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl text-emerald-600 transition group-hover:scale-110 group-hover:bg-emerald-100">
                    💵
                  </div>
                  <span className="font-bold text-zinc-800">{t('overview.addPayment')}</span>
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
                  <span className="font-bold text-zinc-800">{t('overview.addBonus')}</span>
                </div>
                <span className="text-zinc-300 font-bold group-hover:text-purple-400 transition">➔</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Demands & Promises Section */}
      <div className="space-y-4 bg-white p-6 rounded-[2rem] border border-pink-100 shadow-[0_15px_45px_rgba(236,72,153,0.02)]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-950">{t('needs.demandsTitle') || 'Demandes & Promesses'}</h2>
            <p className="text-xs text-zinc-500 mt-1">{t('needs.demandsDesc')}</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs px-3.5 py-2 transition hover:-translate-y-0.5"
          >
            {t('needs.newDemand')}
          </button>
        </div>

        {activeDemands.length === 0 ? (
          <p className="text-xs text-zinc-400 py-6 text-center font-medium bg-pink-50/10 rounded-2xl border border-dashed border-pink-100">
            {t('needs.noPendingDemands')}
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {activeDemands.map((demand) => (
              <div key={demand.id} className="flex items-center justify-between bg-pink-50/10 border border-pink-50/50 p-3 rounded-2xl transition hover:border-pink-200 group">
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={false}
                    onChange={() => setResolvingDemand(demand)}
                    disabled={isPending}
                    className="mt-0.5 h-5 w-5 rounded-lg border-zinc-300 text-pink-600 focus:ring-pink-500 transition cursor-pointer"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-800 break-words">{demand.title}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{t('common.createdOn')} {formatDate(demand.created_at)}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(demand.id)}
                  disabled={isPending}
                  className="opacity-0 group-hover:opacity-100 transition p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg text-xs"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: Add Demand */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-zinc-900 mb-1">{t('needs.addModalTitle')}</h3>
            <p className="text-sm text-zinc-500 mb-6">{t('needs.addModalDesc')?.replace('pour une résidente', `pour ${girl.name}`) || `Ajouter une demande ou promesse pour ${girl.name}.`}</p>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">{t('needs.descLabel')}</label>
                <input
                  type="text"
                  value={newDemandTitle}
                  onChange={(e) => setNewDemandTitle(e.target.value)}
                  disabled={isPending}
                  className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-60"
                  placeholder={t('needs.descPlaceholder') || "Ex: T-shirt, Sèche-cheveux..."}
                  required
                />
              </div>

              {addError && (
                <div className="text-xs text-rose-600 font-medium bg-rose-50 p-3 rounded-xl border border-rose-100">
                  {addError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isPending}
                  className="flex-1 rounded-xl bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200 disabled:opacity-50"
                >
                  {t('needs.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 rounded-xl bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-pink-500/20 transition hover:bg-pink-700 disabled:opacity-50"
                >
                  {isPending ? t('needs.adding') : t('needs.add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Resolve Demand */}
      {resolvingDemand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-zinc-900 mb-1">{t('needs.resolveModalTitle')}</h3>
            <p className="text-sm text-zinc-500 mb-6">
              {t('needs.resolveModalDesc')} <strong>{resolvingDemand.title}</strong>.
            </p>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">{t('needs.buyPriceLabel')}</label>
                <input
                  type="number"
                  value={buyPriceStr}
                  onChange={(e) => setBuyPriceStr(e.target.value)}
                  disabled={isPending}
                  className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-60"
                  placeholder="0"
                  min="0"
                  step="1"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">{t('needs.sellPriceLabel')}</label>
                <input
                  type="number"
                  value={sellPriceStr}
                  onChange={(e) => setSellPriceStr(e.target.value)}
                  disabled={isPending}
                  className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-60"
                  placeholder="0"
                  min="0"
                  step="1"
                  required
                />
              </div>

              {resolveError && (
                <div className="text-xs text-rose-600 font-medium bg-rose-50 p-3 rounded-xl border border-rose-100">
                  {resolveError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResolvingDemand(null)}
                  disabled={isPending}
                  className="flex-1 rounded-xl bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200 disabled:opacity-50"
                >
                  {t('needs.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isPending ? t('needs.validating') : t('needs.validatePurchase')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="space-y-4 bg-white p-6 rounded-[2rem] border border-pink-100 shadow-[0_15px_45px_rgba(236,72,153,0.02)]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-950">{t('overview.recentActivity')}</h2>
            <p className="text-xs text-zinc-500 mt-1">{t('overview.recentActivityDesc')}</p>
          </div>
          <button
            onClick={() => onChangeTab('stats')}
            className="text-xs font-semibold text-pink-600 hover:text-pink-700 transition"
          >
            {t('overview.viewFullHistory')}
          </button>
        </div>

        <div className="overflow-hidden border border-pink-50 rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-pink-50/20 text-xxs font-bold text-zinc-500 uppercase tracking-wider border-b border-pink-50">
                <th className="py-3.5 px-5">{t('common.date')}</th>
                <th className="py-3.5 px-5">{t('common.type')}</th>
                <th className="py-3.5 px-5">{t('common.amount')}</th>
                <th className="py-3.5 px-5">{t('common.note')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-50 text-xs">
              {!recentTransactions || recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-zinc-400 font-medium">
                    {t('overview.noTransactions')}
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
                    amtStyle += 'text-blue-600';
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
                      <td className="py-3 px-5 text-zinc-500 max-w-[200px] truncate" title={tx.note ? tx.note.replace('Purchased:', `${t('common.credited')}:`).replace('Crediée:', `${t('common.credited')}:`) : ''}>
                        {tx.note ? tx.note.replace('Purchased:', `${t('common.credited')}:`).replace('Crediée:', `${t('common.credited')}:`) : '—'}
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
