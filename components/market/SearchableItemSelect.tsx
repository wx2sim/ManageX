'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';

export interface Item {
  id: string;
  name: string;
  unit?: string;
  item_type?: string;
  cost_price?: number;
  sell_price?: number;
  stock_quantity?: number;
  min_stock_alert?: number | null;
  category_id?: string;
  subcategory_id?: string;
  barcode?: string;
  [key: string]: any;
}

export interface GroupedItems {
  rawMap: Record<string, Item[]>;
  finMap: Record<string, Item[]>;
}

interface SearchableItemSelectProps {
  value: string;
  onChange: (value: string) => void;
  allItems: Item[];
  groupedItems?: GroupedItems;
  placeholder?: string;
  t?: (key: string) => string;
  disabled?: boolean;
}

export function SearchableItemSelect({
  value,
  onChange,
  allItems = [],
  groupedItems,
  placeholder,
  t,
  disabled = false,
}: SearchableItemSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Selected item object lookup
  const selectedItem = useMemo(() => {
    return allItems?.find(item => item.id === value);
  }, [allItems, value]);

  // Close dropdown on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Auto focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  // Filter items based on search term
  const filteredData = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!groupedItems) {
      if (!term) return { items: allItems };
      const filtered = allItems.filter(item =>
        item.name.toLowerCase().includes(term) ||
        (item.unit && item.unit.toLowerCase().includes(term)) ||
        (item.barcode && item.barcode.toLowerCase().includes(term))
      );
      return { items: filtered };
    }

    const filterGroupMap = (map: Record<string, Item[]>) => {
      const res: Record<string, Item[]> = {};
      Object.entries(map).forEach(([groupName, items]) => {
        const matchingItems = items.filter(item => {
          if (!term) return true;
          return (
            item.name.toLowerCase().includes(term) ||
            groupName.toLowerCase().includes(term) ||
            (item.unit && item.unit.toLowerCase().includes(term)) ||
            (item.barcode && item.barcode.toLowerCase().includes(term))
          );
        });
        if (matchingItems.length > 0) {
          res[groupName] = matchingItems;
        }
      });
      return res;
    };

    const filteredRaw = filterGroupMap(groupedItems.rawMap || {});
    const filteredFin = filterGroupMap(groupedItems.finMap || {});

    const hasRaw = Object.keys(filteredRaw).length > 0;
    const hasFin = Object.keys(filteredFin).length > 0;

    return {
      rawMap: filteredRaw,
      finMap: filteredFin,
      isEmpty: !hasRaw && !hasFin,
    };
  }, [searchTerm, groupedItems, allItems]);

  const handleSelect = (itemId: string) => {
    onChange(itemId);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
  };

  const defaultPlaceholder = t ? (t('market.input.chooseItem') || '-- Choisir un article --') : '-- Choisir un article --';

  return (
    <div ref={containerRef} className="relative flex-1">
      {/* Trigger Button */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full min-h-[42px] px-3.5 py-2 rounded-xl border bg-white flex items-center justify-between text-sm transition cursor-pointer select-none ${
          disabled
            ? 'opacity-50 cursor-not-allowed border-zinc-200 bg-zinc-50'
            : isOpen
            ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
            : 'border-zinc-200 hover:border-emerald-400 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-2 truncate pr-2">
          {selectedItem ? (
            <>
              <span className="font-semibold text-zinc-900 truncate">{selectedItem.name}</span>
              {selectedItem.stock_quantity != null && (
                <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium shrink-0 border ${
                  selectedItem.stock_quantity <= 0
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200/50'
                }`}>
                  Dispo: {selectedItem.stock_quantity} {selectedItem.unit || ''}
                </span>
              )}
              {selectedItem.item_type === 'raw_material' ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold shrink-0">
                  {t ? (t('market.recipes.rawMaterialToggle') || 'Matière Première') : 'Matière Première'}
                </span>
              ) : selectedItem.item_type === 'finished' ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold shrink-0">
                  {t ? (t('market.recipes.finishedProductToggle') || 'Produit Fini') : 'Produit Fini'}
                </span>
              ) : null}
            </>
          ) : (
            <span className="text-zinc-400">{placeholder || defaultPlaceholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-zinc-400">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full hover:bg-zinc-100 hover:text-zinc-700 transition"
              title="Effacer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-600' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-80 w-full min-w-[320px]">
          {/* Search Header */}
          <div className="p-2.5 bg-zinc-50 border-b border-zinc-100 flex items-center gap-2 sticky top-0 z-10">
            <svg className="w-4 h-4 text-zinc-400 shrink-0 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={t ? (t('common.search') || 'Rechercher un article...') : 'Rechercher un article...'}
              className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-zinc-900 placeholder:text-zinc-400"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="p-1 rounded-full hover:bg-zinc-200 text-zinc-500 transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Item Options List */}
          <div className="overflow-y-auto p-2 space-y-3 flex-1 scrollbar-thin">
            {groupedItems ? (
              filteredData.isEmpty ? (
                <div className="py-8 text-center text-zinc-400 text-sm">
                  <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Aucun article trouvé
                </div>
              ) : (
                <>
                  {/* Raw Materials Group */}
                  {Object.keys(filteredData.rawMap || {}).length > 0 && (
                    <div className="space-y-1">
                      <div className="px-2 py-1 bg-amber-50/80 rounded-lg text-xs font-bold text-amber-900 tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        {t ? (t('market.recipes.rawMaterials') || 'MATIÈRES PREMIÈRES') : 'MATIÈRES PREMIÈRES'}
                      </div>
                      {Object.entries(filteredData.rawMap || {})
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([groupName, itemsInGroup]) => (
                          <div key={`raw-${groupName}`} className="space-y-0.5">
                            <div className="px-3 py-1 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                              {groupName}
                            </div>
                            {itemsInGroup
                              .sort((a, b) => a.name.localeCompare(b.name))
                              .map(item => (
                                <ItemRow
                                  key={item.id}
                                  item={item}
                                  isSelected={item.id === value}
                                  onSelect={handleSelect}
                                  t={t}
                                />
                              ))}
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Finished Products Group */}
                  {Object.keys(filteredData.finMap || {}).length > 0 && (
                    <div className="space-y-1 mt-2">
                      <div className="px-2 py-1 bg-emerald-50/80 rounded-lg text-xs font-bold text-emerald-900 tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        {t ? (t('market.recipes.finishedProduct') || 'PRODUITS FINIS') : 'PRODUITS FINIS'}
                      </div>
                      {Object.entries(filteredData.finMap || {})
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([groupName, itemsInGroup]) => (
                          <div key={`fin-${groupName}`} className="space-y-0.5">
                            <div className="px-3 py-1 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                              {groupName}
                            </div>
                            {itemsInGroup
                              .sort((a, b) => a.name.localeCompare(b.name))
                              .map(item => (
                                <ItemRow
                                  key={item.id}
                                  item={item}
                                  isSelected={item.id === value}
                                  onSelect={handleSelect}
                                  t={t}
                                />
                              ))}
                          </div>
                        ))}
                    </div>
                  )}
                </>
              )
            ) : filteredData.items?.length === 0 ? (
              <div className="py-8 text-center text-zinc-400 text-sm">
                Aucun article trouvé
              </div>
            ) : (
              filteredData.items?.map(item => (
                <ItemRow
                  key={item.id}
                  item={item}
                  isSelected={item.id === value}
                  onSelect={handleSelect}
                  t={t}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ItemRow({
  item,
  isSelected,
  onSelect,
  t,
}: {
  item: Item;
  isSelected: boolean;
  onSelect: (id: string) => void;
  t?: (key: string) => string;
}) {
  const stock = item.stock_quantity ?? 0;
  const isOutOfStock = stock <= 0;
  const price = item.cost_price != null && item.cost_price > 0 
    ? item.cost_price 
    : (item.sell_price || 0);

  return (
    <div
      onClick={() => onSelect(item.id)}
      className={`px-3 py-2 rounded-xl flex items-center justify-between text-sm cursor-pointer transition select-none ${
        isSelected
          ? 'bg-emerald-50 text-emerald-900 font-semibold border border-emerald-200'
          : 'hover:bg-zinc-100 text-zinc-800'
      }`}
    >
      <div className="flex items-center gap-2 truncate pr-2">
        <span className="truncate">{item.name}</span>
        {item.unit && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-200/60 text-zinc-600 font-normal shrink-0">
            {item.unit}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Available Quantity / Stock Badge */}
        <span
          className={`text-xs px-2 py-0.5 rounded-md font-medium border ${
            isOutOfStock
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200/60'
          }`}
          title="Quantité disponible en stock"
        >
          {t ? (t('market.input.inStock') || 'Stock') : 'Stock'}: {stock} {item.unit || ''}
        </span>

        {/* Price Badge */}
        {price > 0 && (
          <span className="text-xs font-semibold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200">
            {price.toLocaleString()} DZD
          </span>
        )}

        {isSelected && (
          <svg className="w-4 h-4 text-emerald-600 shrink-0 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
    </div>
  );
}
