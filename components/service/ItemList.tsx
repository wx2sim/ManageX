'use client';

import { useOverlayTransition } from '@/lib/context/OverlayContext';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Item } from '@/lib/types';
import ItemCard from './ItemCard';
import { commitServiceTransaction } from '@/actions/services';
import { formatDZD } from '@/lib/utils/formatters';
import { calculateCartTotal } from '@/lib/business_logic';
import { useTranslation } from '@/lib/i18n/useTranslation';
import ServiceAddProductModal from './ServiceAddProductModal';

interface ItemListProps {
  girlId: string;
  subcategoryId: string;
  items: Item[];
  girl?: any;
}

export default function ItemList({ girlId, subcategoryId, items, girl }: ItemListProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<Record<string, { quantity: number; customPrice?: number }>>({});
  const [note, setNote] = useState('');
  const [transactionDate, setTransactionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const { t } = useTranslation();
  
  // Add new item state
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  const [isPending, startTransition] = useOverlayTransition();

  // Search filter
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const isFinished = item.item_type === 'finished' || !item.item_type;
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      const isInStock = item.stock_quantity > 0;
      return isFinished && matchesSearch && isInStock;
    });
  }, [items, search]);

  const handleQuantityChange = (itemId: string, newQty: number) => {
    setCart((prev) => {
      const next = { ...prev };
      if (newQty <= 0) {
        delete next[itemId];
      } else {
        const existing = next[itemId] || { quantity: 0 };
        next[itemId] = { ...existing, quantity: Math.round(newQty * 1000) / 1000 };
      }
      return next;
    });
  };

  const handleCustomPriceChange = (itemId: string, newPrice: number | undefined) => {
    setCart((prev) => {
      const next = { ...prev };
      if (next[itemId]) {
        next[itemId] = { ...next[itemId], customPrice: newPrice };
      }
      return next;
    });
  };

  const isAdmin = girl?.account_type === 'admin';

  // Compile cart details
  const cartDetails = useMemo(() => {
    return Object.entries(cart).map(([itemId, config]) => {
      const targetItem = items.find((i) => i.id === itemId)!;
      const baseUnitPrice = isAdmin ? targetItem.cost_price : targetItem.sell_price;

      let effectiveUnitSellPrice = targetItem.sell_price;
      let effectiveUnitCostPrice = targetItem.cost_price;

      if (config.customPrice !== undefined && config.quantity > 0) {
        const unitOverride = config.customPrice / config.quantity;
        if (isAdmin) {
          effectiveUnitCostPrice = unitOverride;
        } else {
          effectiveUnitSellPrice = unitOverride;
        }
      }

      return {
        item_id: targetItem.id,
        item_name: targetItem.name,
        quantity: config.quantity,
        unit_sell_price: effectiveUnitSellPrice,
        unit_cost_price: effectiveUnitCostPrice,
        customPrice: config.customPrice,
        baseUnitPrice,
        unit: targetItem.unit || 'Kg',
      };
    });
  }, [cart, items, isAdmin]);

  const cartTotal = useMemo(() => {
    return cartDetails.reduce((sum, item) => {
      if (item.customPrice !== undefined) {
        return sum + item.customPrice;
      }
      const price = isAdmin ? item.unit_cost_price : item.unit_sell_price;
      return sum + (item.quantity * price);
    }, 0);
  }, [cartDetails, isAdmin]);

  const handleCheckout = () => {
    if (cartDetails.length === 0) return;

    startTransition(async () => {
      const payloadItems = cartDetails.map(d => ({
        item_id: d.item_id,
        item_name: d.item_name,
        quantity: d.quantity,
        unit_sell_price: d.unit_sell_price,
        unit_cost_price: d.unit_cost_price,
      }));

      const res = await commitServiceTransaction(girlId, payloadItems, note, transactionDate);
      if (res?.error) {
        alert(res.error);
      } else {
        setCart({});
        setNote('');
        router.push(`/girls/${girlId}`);
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-3xl border border-pink-100/50 shadow-sm">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('service.searchItems')}
            className="w-full rounded-2xl border border-pink-200 bg-white px-4 py-2 pl-10 text-sm outline-none transition focus:border-pink-400"
          />
          <span className="absolute left-3.5 top-2.5 text-zinc-400 text-sm">🔍</span>
        </div>
        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="rounded-2xl bg-pink-600 hover:bg-pink-700 text-white font-semibold text-xs px-4 py-2.5 transition shrink-0 flex items-center gap-1.5"
        >
          ➕ {t('service.createNewProduct')}
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr] items-start">
        {/* Items Grid list */}
        <div className="space-y-4">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 rounded-[2rem] border border-dashed border-pink-200 bg-white/70 p-6">
              <p className="text-zinc-400 text-sm">{t('service.noItemsFound')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-6 justify-items-center">
              {filteredItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  quantity={cart[item.id]?.quantity || 0}
                  onQuantityChange={handleQuantityChange}
                  isAdmin={isAdmin}
                  viewType="service"
                />
              ))}
            </div>
          )}
        </div>

        {/* Shopping Cart Summary Sidebar */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-[0_15px_40px_rgba(236,72,153,0.03)] space-y-5 sticky top-24">
            <div>
              <h2 className="text-lg font-bold text-zinc-950">{t('service.serviceCart')}</h2>
              <p className="text-xs text-zinc-500 mt-1">{t('service.serviceCartDesc')}</p>
            </div>
            {isAdmin && (
              <div className="bg-zinc-850 text-zinc-200 text-xxs font-bold px-3.5 py-2.5 rounded-2xl flex items-center gap-2 border border-zinc-700 bg-zinc-900">
                <span>🛡️</span>
                <span>{t('service.adminPricingActive') || 'ADMIN PRICING ACTIVE (BUY PRICES APPLIED)'}</span>
              </div>
            )}

            {cartDetails.length === 0 ? (
              <p className="text-sm text-zinc-400 py-6 text-center">{t('service.cartEmpty')}</p>
            ) : (
              <>
                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                  {cartDetails.map((entry) => (
                    <div key={entry.item_id} className="bg-pink-50/40 border border-pink-100/80 rounded-2xl p-3 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-zinc-900 text-xs truncate max-w-[170px]" title={entry.item_name}>
                          {entry.item_name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(entry.item_id, 0)}
                          className="text-zinc-400 hover:text-rose-500 text-xs font-bold transition p-1"
                          title="Supprimer du panier"
                        >
                          🗑️
                        </button>
                      </div>

                      {/* Quantity & Preset buttons */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-zinc-500 font-semibold">
                          <span>Quantité ({entry.unit})</span>
                          <span className="text-zinc-400 font-normal">Base: {formatDZD(entry.baseUnitPrice)}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="any"
                            min="0.001"
                            value={entry.quantity}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              handleQuantityChange(entry.item_id, isNaN(val) ? 0 : val);
                            }}
                            className="w-24 rounded-xl border border-pink-200 bg-white px-2.5 py-1 text-xs font-bold text-zinc-900 outline-none focus:ring-2 focus:ring-pink-500"
                          />

                          {/* Quick Weight Presets */}
                          <div className="flex items-center gap-1 overflow-x-auto">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(entry.item_id, 0.1)}
                              className={`px-1.5 py-0.5 rounded-lg text-[10px] font-bold border transition ${
                                entry.quantity === 0.1 ? 'bg-pink-600 text-white border-pink-600' : 'bg-white text-zinc-600 border-zinc-200 hover:bg-pink-50'
                              }`}
                            >
                              100g
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(entry.item_id, 0.25)}
                              className={`px-1.5 py-0.5 rounded-lg text-[10px] font-bold border transition ${
                                entry.quantity === 0.25 ? 'bg-pink-600 text-white border-pink-600' : 'bg-white text-zinc-600 border-zinc-200 hover:bg-pink-50'
                              }`}
                            >
                              250g
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(entry.item_id, 0.5)}
                              className={`px-1.5 py-0.5 rounded-lg text-[10px] font-bold border transition ${
                                entry.quantity === 0.5 ? 'bg-pink-600 text-white border-pink-600' : 'bg-white text-zinc-600 border-zinc-200 hover:bg-pink-50'
                              }`}
                            >
                              500g
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(entry.item_id, 1)}
                              className={`px-1.5 py-0.5 rounded-lg text-[10px] font-bold border transition ${
                                entry.quantity === 1 ? 'bg-pink-600 text-white border-pink-600' : 'bg-white text-zinc-600 border-zinc-200 hover:bg-pink-50'
                              }`}
                            >
                              1kg
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Line Price Field */}
                      <div className="flex items-center justify-between pt-1 border-t border-pink-100/60">
                        <span className="text-[11px] font-semibold text-zinc-600">Prix Total Ligne</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={entry.customPrice !== undefined ? entry.customPrice : (entry.quantity * entry.baseUnitPrice)}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              handleCustomPriceChange(entry.item_id, isNaN(val) ? undefined : val);
                            }}
                            className="w-24 text-right rounded-xl border border-pink-200 bg-white px-2 py-1 text-xs font-bold text-pink-700 outline-none focus:ring-2 focus:ring-pink-500"
                          />
                          <span className="text-[10px] font-bold text-zinc-500">DZD</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="h-px bg-pink-100" />

                <div className="flex items-center justify-between font-bold">
                  <span className="text-sm text-zinc-700">{t('service.totalPrice')}</span>
                  <span className="text-lg text-pink-600">{formatDZD(cartTotal)}</span>
                </div>

                {/* Transaction Date */}
                <div className="space-y-1">
                  <label className="block text-xxs font-bold text-zinc-400 uppercase tracking-wider">
                    {t('common.date') || 'Date de Transaction'}
                  </label>
                  <input
                    type="date"
                    value={transactionDate}
                    onChange={(e) => setTransactionDate(e.target.value)}
                    required
                    className="w-full rounded-xl border border-pink-100 bg-zinc-50/50 px-3 py-2 text-xs outline-none transition focus:border-pink-300 font-medium text-zinc-800"
                  />
                </div>

                {/* Checkout Note */}
                <div className="space-y-1">
                  <label className="block text-xxs font-bold text-zinc-400 uppercase tracking-wider">
                    {t('service.transactionNote')}
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={t('service.notePlaceholder')}
                    className="w-full rounded-xl border border-pink-100 bg-zinc-50/50 px-3 py-2 text-xs outline-none transition focus:border-pink-300"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={isPending}
                  className="w-full rounded-xl bg-pink-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-pink-500/20 transition hover:bg-pink-700 disabled:opacity-50"
                >
                  {isPending ? t('service.processingCheckout') : t('service.confirmCheckout')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <ServiceAddProductModal 
        isOpen={isAddOpen} 
        onClose={() => setIsAddOpen(false)} 
      />
    </div>
  );
}
