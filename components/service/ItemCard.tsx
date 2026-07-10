'use client';

import { Item } from '@/lib/types';
import { formatDZD } from '@/lib/utils/formatters';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface ItemCardProps {
  item: Item;
  quantity?: number;
  onQuantityChange?: (itemId: string, newQty: number) => void;
  readonly?: boolean;
  onEdit?: (item: Item) => void;
  onDelete?: (item: Item) => void;
  compact?: boolean;
  isAdmin?: boolean;
}

export default function ItemCard({ item, quantity = 0, onQuantityChange, readonly = false, onEdit, onDelete, compact = false, isAdmin = false }: ItemCardProps) {
  const { t } = useTranslation();
  const isSelected = quantity > 0;
  const isEmoji = item.image_url && !item.image_url.startsWith('http') && !item.image_url.startsWith('/');
  const isOutOfStock = item.stock_quantity <= 0;
  const remainingStock = item.stock_quantity - quantity;
  const disableAdd = remainingStock <= 0;

  const handleIncrement = () => {
    if (!disableAdd && onQuantityChange && !readonly) {
      onQuantityChange(item.id, quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 0 && onQuantityChange && !readonly) {
      onQuantityChange(item.id, quantity - 1);
    }
  };

  const isCompact = readonly || compact;

  return (
    <div className={`group relative flex flex-col justify-between overflow-hidden rounded-[1.5rem] border bg-white transition hover:shadow-md ${
      (isSelected && !readonly)
        ? 'border-pink-500 ring-2 ring-pink-100' 
        : isOutOfStock 
          ? 'border-zinc-100 opacity-60 grayscale' 
          : 'border-pink-100/70 hover:border-pink-200'
    } ${isCompact ? 'p-3' : 'p-5'}`}>
      {/* Item Image */}
      <div className={`${isCompact ? 'h-20' : 'aspect-video'} w-full rounded-2xl bg-pink-50/50 flex items-center justify-center border border-pink-100/20 overflow-hidden shrink-0 relative mb-3`}>
        {item.image_url ? (
          isEmoji ? (
            <span className={`${isCompact ? 'text-4xl' : 'text-6xl'} select-none`}>{item.image_url}</span>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.image_url}
              alt={item.name}
              className="h-full w-full object-cover"
            />
          )
        ) : (
          <span className="text-4xl select-none">🛍️</span>
        )}

        {isSelected && !readonly && (
          <div className="absolute right-2 top-2 bg-pink-600 text-white text-xs font-bold h-6 w-6 rounded-full flex items-center justify-center shadow-md animate-in zoom-in">
            {quantity}
          </div>
        )}

        {(onEdit || onDelete) && (
          <div className="absolute right-2 top-2 flex flex-col gap-1 z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                className="bg-white/90 backdrop-blur-sm text-zinc-600 hover:text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-full shadow-sm transition"
                title="Edit Product"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDelete(item); }}
                className="bg-white/90 backdrop-blur-sm text-zinc-600 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-full shadow-sm transition"
                title="Delete Product"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Item Details */}
      <div className="space-y-1.5 flex-1">
        <h3 className={`font-semibold line-clamp-1 transition ${isCompact ? 'text-sm' : ''} ${isOutOfStock ? 'text-zinc-500' : 'text-zinc-900 group-hover:text-pink-600'}`}>
          {item.name}
        </h3>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0 text-left">
            {!isCompact && <p className="text-xxs text-zinc-400 font-medium tracking-wide uppercase">{isAdmin ? t('service.buy') : t('service.sell')}</p>}
            <p className={`font-bold ${isCompact ? 'text-xs' : 'text-sm'} ${isOutOfStock ? 'text-zinc-500' : 'text-emerald-600'}`}>
              {formatDZD(isAdmin ? item.cost_price : item.sell_price)}
            </p>
          </div>
          <div className="space-y-0 text-right">
            {!isCompact && <p className="text-xxs text-zinc-400 font-medium tracking-wide uppercase">{isAdmin ? t('service.sell') : t('service.buy')}</p>}
            <p className={`${isCompact ? 'text-[10px]' : 'text-xs'} font-semibold text-zinc-400 ${isAdmin ? 'line-through' : ''}`}>
              {formatDZD(isAdmin ? item.sell_price : item.cost_price)}
            </p>
          </div>
        </div>

        <div className={`${isCompact ? 'pt-1.5 mt-1.5' : 'pt-2 mt-2'} border-t border-pink-50/70`}>
          <p className={`${isCompact ? 'text-[11px]' : 'text-xs'} font-medium flex items-center justify-between`}>
            <span className="text-zinc-500">
              {quantity > 0 ? t('service.remainingStock') : t('service.inStockLabel')}
            </span>
            <span className={`font-bold ${remainingStock > 0 ? 'text-zinc-900' : 'text-rose-500'}`}>
              {remainingStock}
            </span>
          </p>
        </div>
      </div>

      {/* Cart Controls */}
      {!readonly && (
        <div className="mt-4 flex items-center justify-between gap-2 shrink-0">
          {isOutOfStock ? (
            <button
              type="button"
              disabled
              className="w-full rounded-xl border border-zinc-200 bg-zinc-100 text-zinc-500 py-2 text-xs font-bold flex items-center justify-center gap-1 opacity-80 cursor-not-allowed"
            >
              {t('service.outOfStock')}
            </button>
          ) : quantity > 0 ? (
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
                disabled={disableAdd}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-pink-100 text-zinc-700 font-semibold transition hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-zinc-700"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleIncrement}
              disabled={disableAdd}
              className="w-full rounded-xl border border-pink-200 bg-white hover:bg-pink-50 text-pink-700 py-2 text-xs font-bold transition flex items-center justify-center gap-1 disabled:opacity-50"
            >
              {t('service.addToCart')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
