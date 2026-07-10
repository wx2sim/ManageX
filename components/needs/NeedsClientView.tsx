'use client';

import { useOverlayTransition } from '@/lib/context/OverlayContext';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addNeed, completeResidentDemand, markStockNeedBought, deleteNeed } from '@/actions/needs';
import { formatDZD, formatDate } from '@/lib/utils/formatters';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface NeedsClientViewProps {
  items: any[];
  girls: any[];
  activeStockAlerts: any[];
  completedStockAlerts: any[];
  activeDemands: any[];
  completedDemands: any[];
}

export default function NeedsClientView({
  items,
  girls,
  activeStockAlerts,
  completedStockAlerts,
  activeDemands,
  completedDemands
}: NeedsClientViewProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [isPending, startTransition] = useOverlayTransition();

  // Add Demand Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDemandTitle, setNewDemandTitle] = useState('');
  const [selectedGirlId, setSelectedGirlId] = useState('');
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
      setAddError('Please enter a description or product name.');
      return;
    }
    if (!selectedGirlId) {
      setAddError('Please select a resident.');
      return;
    }

    startTransition(async () => {
      const res = await addNeed('resident_demand', newDemandTitle, null, selectedGirlId);
      if (res?.error) {
        setAddError(res.error);
      } else {
        setNewDemandTitle('');
        setSelectedGirlId('');
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

  const handleMarkBought = (itemId: string) => {
    startTransition(async () => {
      const res = await markStockNeedBought(itemId);
      if (res?.error) {
        alert(res.error);
      } else {
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
    <div className="grid gap-8 lg:grid-cols-2 items-start">
      {/* LEFT COLUMN: Resident Demands */}
      <div className="bg-white/60 backdrop-blur-md rounded-[2.5rem] border border-pink-100/50 p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">{t('needs.demandsTitle') || 'Demandes & Promesses'}</h2>
            <p className="text-xs text-zinc-500 mt-1">{t('needs.demandsDesc')}</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="rounded-2xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs px-4 py-2.5 shadow-md shadow-pink-500/10 transition hover:-translate-y-0.5"
          >
            {t('needs.newDemand')}
          </button>
        </div>

        {/* Active Demands */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{t('needs.pendingDemands')} ({activeDemands.length})</h3>
          
          {activeDemands.length === 0 ? (
            <div className="text-center py-8 rounded-2xl border border-dashed border-pink-100 bg-pink-50/10 text-zinc-400 text-xs font-medium">
              {t('needs.noPendingDemands')}
            </div>
          ) : (
            <div className="space-y-3">
              {activeDemands.map((demand) => (
                <div
                  key={demand.id}
                  className="flex items-center justify-between bg-white border border-pink-50 hover:border-pink-200 p-4 rounded-2xl shadow-sm transition group"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={() => setResolvingDemand(demand)}
                      disabled={isPending}
                      className="mt-1 h-5 w-5 rounded-lg border-zinc-300 text-pink-600 focus:ring-pink-500 transition cursor-pointer"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-zinc-800 break-words">{demand.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-pink-50 border border-pink-100 text-pink-700 px-2 py-0.5 rounded-full font-bold uppercase">
                          {demand.girls?.name || t('needs.unknown')}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-medium">
                          {formatDate(demand.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(demand.id)}
                    disabled={isPending}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Demands */}
        {completedDemands.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-pink-50">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{t('needs.recentlyBought')}</h3>
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
              {completedDemands.map((demand) => (
                <div
                  key={demand.id}
                  className="flex items-center justify-between bg-zinc-50 border border-zinc-100/50 p-3.5 rounded-2xl opacity-70"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-zinc-600 line-through truncate">{demand.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px]">
                      <span className="text-zinc-500 font-bold uppercase">
                        {demand.girls?.name || t('needs.unknown')}
                      </span>
                      <span className="text-zinc-400">
                        {t('needs.boughtOn')} {new Date(demand.completed_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <div className="text-xs font-bold text-zinc-700">{t('needs.billed')} {formatDZD(demand.sell_price)}</div>
                    <div className="text-[10px] text-zinc-400 font-medium mt-0.5">{t('needs.cost')} {formatDZD(demand.buy_price)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Stock Alerts */}
      <div className="bg-white/60 backdrop-blur-md rounded-[2.5rem] border border-pink-100/50 p-6 md:p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">{t('needs.stockAlerts')}</h2>
          <p className="text-xs text-zinc-500 mt-1">{t('needs.stockAlertsDesc')}</p>
        </div>

        {/* Active Alerts */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{t('needs.activeAlerts')} ({activeStockAlerts.length})</h3>
          
          {activeStockAlerts.length === 0 ? (
            <div className="text-center py-8 rounded-2xl border border-dashed border-pink-100 bg-pink-50/10 text-zinc-400 text-xs font-medium">
              {t('needs.noActiveAlerts')}
            </div>
          ) : (
            <div className="space-y-3">
              {activeStockAlerts.map((item) => {
                const threshold = item.min_stock_alert !== null ? item.min_stock_alert : 0;
                const isOutOfStock = item.stock_quantity <= 0;
                
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between bg-white border border-pink-50 hover:border-pink-200 p-4 rounded-2xl shadow-sm transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={false}
                        onChange={() => handleMarkBought(item.id)}
                        disabled={isPending}
                        className="h-5 w-5 rounded-lg border-zinc-300 text-emerald-600 focus:ring-emerald-500 transition cursor-pointer"
                        title="Mark as bought"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-zinc-800 truncate">{item.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isOutOfStock ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                            {isOutOfStock ? t('needs.outOfStock') : `${t('needs.lowStock')} ${item.stock_quantity}/${threshold}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleMarkBought(item.id)}
                      disabled={isPending}
                      className="rounded-xl border border-emerald-100 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xxs font-bold px-3 py-1.5 transition"
                    >
                      {t('needs.bought')}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Completed Stock Alerts */}
        {completedStockAlerts.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-pink-50">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{t('needs.recentAlerts')}</h3>
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
              {completedStockAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between bg-zinc-50 border border-zinc-100/50 p-3.5 rounded-2xl opacity-70"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-zinc-600 line-through truncate">{alert.title}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      {t('needs.markedBoughtOn')} {new Date(alert.completed_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <span className="text-xxs font-bold bg-zinc-200 border border-zinc-300 text-zinc-600 px-2 py-0.5 rounded-full uppercase">
                    {t('needs.bought')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Add Demand */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-zinc-900 mb-1">{t('needs.addModalTitle')}</h3>
            <p className="text-sm text-zinc-500 mb-6">{t('needs.addModalDesc')}</p>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">{t('needs.descLabel')}</label>
                <input
                  type="text"
                  value={newDemandTitle}
                  onChange={(e) => setNewDemandTitle(e.target.value)}
                  disabled={isPending}
                  className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-60"
                  placeholder={t('needs.descPlaceholder') || 'Ex: T-shirt, Sèche-cheveux...'}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">{t('needs.forResident')}</label>
                <select
                  value={selectedGirlId}
                  onChange={(e) => setSelectedGirlId(e.target.value)}
                  disabled={isPending}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-60"
                  required
                >
                  <option value="">{t('needs.select')}</option>
                  {girls.map((girl) => (
                    <option key={girl.id} value={girl.id}>
                      {girl.name} {girl.account_type === 'admin' ? `(${t('common.admin') || 'Admin'})` : ''}
                    </option>
                  ))}
                </select>
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

      {/* MODAL: Resolve Demand (Check Out Price) */}
      {resolvingDemand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-zinc-900 mb-1">{t('needs.resolveModalTitle')}</h3>
            <p className="text-sm text-zinc-500 mb-6">
              {t('needs.resolveModalDesc')} <strong>{resolvingDemand.title}</strong> pour <strong>{resolvingDemand.girls?.name}</strong>.
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
    </div>
  );
}
