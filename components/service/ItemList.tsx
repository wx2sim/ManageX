'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Item } from '@/lib/types';
import ItemCard from './ItemCard';
import { commitServiceTransaction } from '@/actions/transactions';
import { addItem } from '@/actions/items';
import { formatDZD } from '@/lib/utils/formatters';
import { calculateCartTotal } from '@/lib/financials/calculations';

interface ItemListProps {
  girlId: string;
  subcategoryId: string;
  items: Item[];
}

export default function ItemList({ girlId, subcategoryId, items }: ItemListProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [note, setNote] = useState('');
  
  // Add new item state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newItemError, setNewItemError] = useState<string | null>(null);
  
  const [isPending, startTransition] = useTransition();

  // Search filter
  const filteredItems = useMemo(() => {
    return items.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()));
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

  const cartTotal = useMemo(() => {
    return calculateCartTotal(cartDetails);
  }, [cartDetails]);

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

  const handleAddItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setNewItemError(null);

    const formData = new FormData(e.currentTarget);
    formData.append('subcategory_id', subcategoryId);

    startTransition(async () => {
      const res = await addItem(formData);
      if (res?.error) {
        setNewItemError(res.error);
      } else {
        setIsAddOpen(false);
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
            placeholder="Search items in this subcategory..."
            className="w-full rounded-2xl border border-pink-200 bg-white px-4 py-2 pl-10 text-sm outline-none transition focus:border-pink-400"
          />
          <span className="absolute left-3.5 top-2.5 text-zinc-400 text-sm">🔍</span>
        </div>
        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="rounded-2xl bg-pink-600 hover:bg-pink-700 text-white font-semibold text-xs px-4 py-2.5 transition shrink-0 flex items-center gap-1.5"
        >
          ➕ Create New Product
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr] items-start">
        {/* Items Grid list */}
        <div className="space-y-4">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 rounded-[2rem] border border-dashed border-pink-200 bg-white/70 p-6">
              <p className="text-zinc-400 text-sm">No items found. Create a product using the button above.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {filteredItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  quantity={cart[item.id] || 0}
                  onQuantityChange={handleQuantityChange}
                />
              ))}
            </div>
          )}
        </div>

        {/* Shopping Cart Summary Sidebar */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-[0_15px_40px_rgba(236,72,153,0.03)] space-y-5 sticky top-24">
            <div>
              <h2 className="text-lg font-bold text-zinc-950">Service Cart</h2>
              <p className="text-xs text-zinc-500 mt-1">Review items before checkout. Prices include DZD currency.</p>
            </div>

            {cartDetails.length === 0 ? (
              <p className="text-sm text-zinc-400 py-6 text-center">Cart is empty. Select products to begin checkout.</p>
            ) : (
              <>
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {cartDetails.map((entry) => (
                    <div key={entry.item_id} className="flex items-center justify-between text-xs py-1">
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-zinc-900 line-clamp-1">{entry.item_name}</span>
                        <span className="text-zinc-400 mt-0.5 block">
                          {entry.quantity} × {formatDZD(entry.unit_sell_price)}
                        </span>
                      </div>
                      <span className="font-semibold text-zinc-800 shrink-0 ml-3">
                        {formatDZD(entry.quantity * entry.unit_sell_price)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="h-px bg-pink-100" />

                <div className="flex items-center justify-between font-bold">
                  <span className="text-sm text-zinc-700">Total Price</span>
                  <span className="text-lg text-pink-600">{formatDZD(cartTotal)}</span>
                </div>

                {/* Checkout Note */}
                <div className="space-y-1">
                  <label className="block text-xxs font-bold text-zinc-400 uppercase tracking-wider">
                    Transaction Note
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Order delivered to room, dinner tab"
                    className="w-full rounded-xl border border-pink-100 bg-zinc-50/50 px-3 py-2 text-xs outline-none transition focus:border-pink-300"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={isPending}
                  className="w-full rounded-xl bg-pink-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-pink-500/20 transition hover:bg-pink-700 disabled:opacity-50"
                >
                  {isPending ? 'Processing Checkout...' : 'Confirm Checkout'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl border border-pink-200 bg-white shadow-[0_20px_100px_rgba(236,72,153,0.25)] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-pink-100 p-5 shrink-0 bg-white">
              <h2 className="text-lg font-semibold text-zinc-950">Create New Product</h2>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="text-lg text-zinc-400 transition hover:text-zinc-600 focus:outline-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4 p-6 overflow-y-auto flex-1 bg-white">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Tomato Soup, Malboro Gold"
                  className="w-full rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm text-zinc-900 transition focus:border-pink-400 focus:outline-none"
                />
              </div>

              {/* Sell Price & Cost Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                    Sell Price *
                  </label>
                  <input
                    type="number"
                    name="sell_price"
                    required
                    min="1"
                    placeholder="DZD"
                    className="w-full rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm text-zinc-900 transition focus:border-pink-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                    Cost Price (Buy)
                  </label>
                  <input
                    type="number"
                    name="cost_price"
                    min="0"
                    placeholder="DZD"
                    className="w-full rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm text-zinc-900 transition focus:border-pink-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Product Photo */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                  Product Photo
                </label>
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  className="w-full text-xs text-zinc-500 cursor-pointer"
                />
              </div>

              {newItemError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium">
                  {newItemError}
                </div>
              )}
            </form>

            <div className="flex gap-3 p-5 border-t border-pink-100 shrink-0 bg-white">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                disabled={isPending}
                className="flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={(e) => {
                  const form = (e.currentTarget.closest('.w-full') as HTMLElement).querySelector('form');
                  form?.requestSubmit();
                }}
                disabled={isPending}
                className="flex-1 rounded-xl bg-pink-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-pink-500/20 transition hover:bg-pink-700 disabled:opacity-50"
              >
                {isPending ? 'Creating...' : 'Save Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
