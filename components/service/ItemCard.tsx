'use client';

import { Item } from '@/lib/types';
import { formatDZD } from '@/lib/utils/formatters';

interface ItemCardProps {
  item: Item;
  quantity: number;
  onQuantityChange: (itemId: string, newQty: number) => void;
}

export default function ItemCard({ item, quantity, onQuantityChange }: ItemCardProps) {
  const isSelected = quantity > 0;

  const handleIncrement = () => {
    onQuantityChange(item.id, quantity + 1);
  };

  const handleDecrement = () => {
    if (quantity > 0) {
      onQuantityChange(item.id, quantity - 1);
    }
  };

  return (
    <div className={`group relative flex flex-col justify-between overflow-hidden rounded-[2rem] border bg-white p-5 transition hover:shadow-md ${
      isSelected 
        ? 'border-pink-500 ring-2 ring-pink-100' 
        : 'border-pink-100/70 hover:border-pink-200'
    }`}>
      {/* Item Image */}
      <div className="aspect-video w-full rounded-2xl bg-pink-50/50 flex items-center justify-center border border-pink-100/20 overflow-hidden shrink-0 relative mb-4">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-4xl select-none">🛍️</span>
        )}

        {isSelected && (
          <div className="absolute right-2 top-2 bg-pink-600 text-white text-xs font-bold h-6 w-6 rounded-full flex items-center justify-center shadow-md animate-in zoom-in">
            {quantity}
          </div>
        )}
      </div>

      {/* Item Details */}
      <div className="space-y-1 flex-1">
        <h3 className="font-semibold text-zinc-900 line-clamp-1 group-hover:text-pink-600 transition">
          {item.name}
        </h3>
        <p className="text-sm font-bold text-zinc-800">
          {formatDZD(item.sell_price)}
        </p>
      </div>

      {/* Cart Controls */}
      <div className="mt-4 flex items-center justify-between gap-2 shrink-0">
        {quantity > 0 ? (
          <div className="flex items-center gap-1 w-full rounded-xl border border-pink-200 bg-pink-50/30 p-1">
            <button
              type="button"
              onClick={handleDecrement}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-pink-100 text-zinc-700 font-semibold transition hover:bg-rose-50 hover:text-rose-600"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="flex-1 text-center text-xs font-bold text-zinc-900 select-none">
              {quantity}
            </span>
            <button
              type="button"
              onClick={handleIncrement}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-pink-100 text-zinc-700 font-semibold transition hover:bg-emerald-50 hover:text-emerald-600"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleIncrement}
            className="w-full rounded-xl border border-pink-200 bg-white hover:bg-pink-50 text-pink-700 py-2 text-xs font-bold transition flex items-center justify-center gap-1"
          >
            🛒 Add to Cart
          </button>
        )}
      </div>
    </div>
  );
}
