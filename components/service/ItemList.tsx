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
  const [cart, setCart] = useState<Record<string, number>>({});
  const [note, setNote] = useState('');
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
        next[itemId] = newQty;
      }
      return next;
    });
  };

  // Compile cart details
  const cartDetails = useMemo(() => {
    return Object.entries(cart).map(([itemId, qty]) => {
      const targetItem = items.find((i) => i.id === itemId)!;
      return {
        item_id: targetItem.id,
        item_name: targetItem.name,
        quantity: qty,
        unit_sell_price: targetItem.sell_price,
        unit_cost_price: targetItem.cost_price,
      };
    });
  }, [cart, items]);

  const isAdmin = girl?.account_type === 'admin';

  const cartTotal = useMemo(() => {
    return cartDetails.reduce((sum, item) => {
      const price = isAdmin ? item.unit_cost_price : item.unit_sell_price;
      return sum + (item.quantity * price);
    }, 0);
  }, [cartDetails, isAdmin]);

  const handleCheckout = () => {
    if (cartDetails.length === 0) return;

    startTransition(async () => {
      const res = await commitServiceTransaction(girlId, cartDetails, note);
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

  // Note: addItem has been replaced by the MarketStockClient embedded in ServiceAddProductModal

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
                  quantity={cart[item.id] || 0}
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
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {cartDetails.map((entry) => (
                    <div key={entry.item_id} className="flex items-center justify-between text-xs py-1">
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-zinc-900 line-clamp-1">{entry.item_name}</span>
                        <span className="text-zinc-400 mt-0.5 block">
                          {entry.quantity} × {formatDZD(isAdmin ? entry.unit_cost_price : entry.unit_sell_price)}
                        </span>
                      </div>
                      <span className="font-semibold text-zinc-800 shrink-0 ml-3">
                        {formatDZD(entry.quantity * (isAdmin ? entry.unit_cost_price : entry.unit_sell_price))}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="h-px bg-pink-100" />

                <div className="flex items-center justify-between font-bold">
                  <span className="text-sm text-zinc-700">{t('service.totalPrice')}</span>
                  <span className="text-lg text-pink-600">{formatDZD(cartTotal)}</span>
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
