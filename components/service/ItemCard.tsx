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
  onClick?: (item: Item) => void;
  compact?: boolean;
  isAdmin?: boolean;
  viewType?: 'list' | 'grid' | 'service';
}

export default function ItemCard({
  item,
  quantity = 0,
  onQuantityChange,
  readonly = false,
  onEdit,
  onDelete,
  onClick,
  compact = false,
  isAdmin = false,
  viewType = 'grid'
}: ItemCardProps) {
  const { t } = useTranslation();
  const isSelected = quantity > 0;
  
  // Media priority check:
  // 1. If image_url exists and starts with http/https or / -> image
  // 2. If no image_url but icon exists -> icon emoji
  // 3. If image_url exists but is an emoji (legacy data fallback) -> icon emoji
  // 4. Neither -> fallback placeholder
  const hasImageUrl = item.image_url && (item.image_url.startsWith('http') || item.image_url.startsWith('/'));
  const hasIcon = !!item.icon;
  const isLegacyEmoji = item.image_url && !item.image_url.startsWith('http') && !item.image_url.startsWith('/');

  let mediaType: 'image' | 'icon' | 'placeholder' = 'placeholder';
  let mediaValue: string | null = null;

  if (hasImageUrl) {
    mediaType = 'image';
    mediaValue = item.image_url;
  } else if (hasIcon) {
    mediaType = 'icon';
    mediaValue = item.icon!;
  } else if (isLegacyEmoji) {
    mediaType = 'icon';
    mediaValue = item.image_url;
  }

  // --- SERVICE FLOW VIEW LAYOUT (100x100px square card, name below) ---
  if (viewType === 'service') {
    const isOutOfStock = item.stock_quantity <= 0;
    const remainingStock = item.stock_quantity - quantity;
    const disableAdd = remainingStock <= 0;

    const handleIncrement = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!disableAdd && onQuantityChange && !readonly) {
        onQuantityChange(item.id, quantity + 1);
      }
    };

    const handleDecrement = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (quantity > 0 && onQuantityChange && !readonly) {
        onQuantityChange(item.id, quantity - 1);
      }
    };

    return (
      <div 
        onClick={handleIncrement}
        className={`flex flex-col items-center select-none group cursor-pointer ${isOutOfStock ? 'opacity-50 pointer-events-none' : ''}`}
      >
        {/* 100x100px Image Box */}
        <div className={`w-[100px] h-[100px] rounded-3xl border relative flex items-center justify-center overflow-hidden transition-all duration-300 ${
          isSelected 
            ? 'border-pink-500 ring-4 ring-pink-100/80 shadow-md scale-105' 
            : 'border-pink-100 bg-white hover:border-pink-300 hover:shadow-sm hover:-translate-y-0.5'
        }`}>
          {mediaType === 'image' && mediaValue ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaValue}
              alt={item.name}
              loading="lazy"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
            />
          ) : mediaType === 'icon' && mediaValue ? (
            <span className="text-4xl">{mediaValue}</span>
          ) : (
            <span className="text-4xl text-zinc-300 bg-zinc-100 w-full h-full flex items-center justify-center">🛍️</span>
          )}

          {/* Out of Stock overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/45 backdrop-blur-xxs flex items-center justify-center text-white text-[10px] font-bold uppercase tracking-wider text-center px-1">
              {t('service.outOfStock') || 'SOLD OUT'}
            </div>
          )}

          {/* Selection and Control Overlay */}
          {isSelected && !readonly && (
            <div className="absolute inset-0 bg-pink-600/95 flex flex-col items-center justify-center gap-1.5 animate-in fade-in duration-200">
              <span className="text-[10px] font-bold text-pink-100 uppercase tracking-widest">Qty</span>
              <span className="text-lg font-black text-white">{quantity}</span>
              <div className="flex items-center gap-1 bg-white/20 p-0.5 rounded-lg border border-white/20">
                <button
                  type="button"
                  onClick={handleDecrement}
                  className="w-5 h-5 flex items-center justify-center rounded bg-white text-pink-600 font-extrabold hover:bg-pink-50 transition text-xs"
                >
                  −
                </button>
                <button
                  type="button"
                  onClick={handleIncrement}
                  disabled={disableAdd}
                  className="w-5 h-5 flex items-center justify-center rounded bg-white text-pink-600 font-extrabold hover:bg-pink-50 transition disabled:opacity-50 text-xs"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Product Name and Price below the box */}
        <div className="mt-2 text-center w-[110px] space-y-0.5">
          <p className="text-xs font-bold text-zinc-800 line-clamp-2 leading-tight uppercase group-hover:text-pink-600 transition">
            {item.name}
          </p>
          <p className="text-[11px] font-semibold text-emerald-600">
            {formatDZD(isAdmin ? item.cost_price : item.sell_price)}
          </p>
          <p className="text-[9px] font-medium text-zinc-400">
            Stock: <span className={remainingStock > 0 ? 'text-zinc-650 font-semibold' : 'text-rose-500 font-bold'}>{remainingStock}</span>
          </p>
        </div>
      </div>
    );
  }

  // --- LIST VIEW LAYOUT (80x80px rounded image/icon container) ---
  if (viewType === 'list') {
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

    return (
      <div 
        onClick={() => onClick && onClick(item)}
        className={`flex items-center gap-4 p-3 bg-white border border-pink-100/70 rounded-2xl transition hover:shadow-sm ${
        isOutOfStock ? 'opacity-60 grayscale' : ''
      } ${onClick ? 'cursor-pointer' : ''}`}>
        {/* 80x80px Image Box */}
        <div className="w-20 h-20 rounded-2xl bg-pink-50/50 flex items-center justify-center border border-pink-100/20 overflow-hidden shrink-0 relative">
          {mediaType === 'image' && mediaValue ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaValue}
              alt={item.name}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : mediaType === 'icon' && mediaValue ? (
            <span className="text-3xl select-none">{mediaValue}</span>
          ) : (
            <span className="text-3xl select-none">🛍️</span>
          )}

          {isSelected && !readonly && (
            <div className="absolute right-1 top-1 bg-pink-600 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center shadow-md">
              {quantity}
            </div>
          )}
        </div>

        {/* Item Details */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-zinc-900 line-clamp-1">{item.name}</h3>
          <p className="font-bold text-xs text-emerald-600 mt-0.5">
            {formatDZD(isAdmin ? item.cost_price : item.sell_price)}
          </p>
          <p className="text-[10px] text-zinc-400 mt-1">
            Stock: <span className="font-bold">{remainingStock}</span>
          </p>
        </div>

        {/* Controls */}
        {!readonly && (
          <div className="shrink-0 flex items-center gap-1.5 bg-pink-50/30 p-1 rounded-xl border border-pink-100">
            {isOutOfStock ? (
              <span className="text-xxs font-bold text-rose-500 px-2 py-1">Sold Out</span>
            ) : quantity > 0 ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleDecrement}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-pink-100 text-zinc-700 font-bold hover:bg-rose-50 hover:text-rose-600 transition"
                >
                  −
                </button>
                <span className="w-5 text-center text-xs font-bold text-zinc-900">{quantity}</span>
                <button
                  type="button"
                  onClick={handleIncrement}
                  disabled={disableAdd}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-pink-100 text-zinc-700 font-bold hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50 transition"
                >
                  +
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleIncrement}
                disabled={disableAdd}
                className="rounded-lg bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs px-3 py-1.5 transition"
              >
                + Add
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // --- GRID VIEW LAYOUT (Default, 120x120px rounded image/icon container) ---
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
    <div 
      onClick={() => onClick && onClick(item)}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-[1.5rem] border bg-white transition hover:shadow-md ${
      (isSelected && !readonly)
        ? 'border-pink-500 ring-2 ring-pink-100' 
        : isOutOfStock 
          ? 'border-zinc-100 opacity-60 grayscale' 
          : 'border-pink-100/70 hover:border-pink-200'
    } ${isCompact ? 'p-3' : 'p-5'} ${onClick ? 'cursor-pointer' : ''}`}>
      
      {/* 120x120px Image/Icon Box */}
      <div className="w-[120px] h-[120px] mx-auto rounded-2xl bg-pink-50/50 flex items-center justify-center border border-pink-100/20 overflow-hidden shrink-0 relative mb-3">
        {mediaType === 'image' && mediaValue ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaValue}
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : mediaType === 'icon' && mediaValue ? (
          <span className="text-5xl select-none">{mediaValue}</span>
        ) : (
          <span className="text-5xl select-none">🛍️</span>
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
