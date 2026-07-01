'use client';

import { useState, useTransition, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Item, ServiceCategory, ServiceSubcategory, MarketInput } from '@/lib/types';
import { addMarketInput } from '@/actions/market_logic';
import { formatDZD, formatDate } from '@/lib/utils/formatters';

interface MarketStockClientProps {
  items: Item[];
  categories: ServiceCategory[];
  subcategories: ServiceSubcategory[];
  marketInputs: (MarketInput & { items: { name: string } | null })[];
}

const PREDEFINED_ICONS = [
  '💧', '🥤', '🍷', '🍺', '🍼',
  '🍔', '🍟', '🍕', '🌭', '🥪',
  '🚬', '💨', '💊', '🩹', '🧴',
  '💄', '💋', '💅', '💇‍♀️', '👗',
  '🧻', '🧼', '🧽', '🧹', '🗑️',
  '🛍️', '📦', '📱', '🔋', '🔌'
];

export default function MarketStockClient({ items, categories, subcategories, marketInputs }: MarketStockClientProps) {
  const [activeTab, setActiveTab] = useState<'input' | 'ledger' | 'categories'>('input');

  // Input Form State
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [isNewItem, setIsNewItem] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState('');

  const [newItemName, setNewItemName] = useState('');
  const [newItemCategoryId, setNewItemCategoryId] = useState('');
  const [newItemSubcategoryId, setNewItemSubcategoryId] = useState('');
  const [newItemImage, setNewItemImage] = useState('🛍️'); // Default icon

  const [quantity, setQuantity] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [shoppingDate, setShoppingDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Ledger State
  const [monthFilter, setMonthFilter] = useState('');

  const [lastBoughtPrice, setLastBoughtPrice] = useState<number | null>(null);
  const [lastSellPrice, setLastSellPrice] = useState<number | null>(null);

  // Local State for Immediate Updates
  const [localCategories, setLocalCategories] = useState(categories);
  const [localSubcats, setLocalSubcats] = useState(subcategories);

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  useEffect(() => {
    setLocalSubcats(subcategories);
  }, [subcategories]);

  const filteredSubcategories = useMemo(() => {
    return localSubcats.filter(s => s.category_id === newItemCategoryId);
  }, [localSubcats, newItemCategoryId]);

  const handleItemSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedItemId(val);

    if (val) {
      const target = items.find(i => i.id === val);
      if (target) {
        setBuyPrice(target.cost_price.toString());
        setSellPrice(target.sell_price.toString());
        setLastBoughtPrice(target.cost_price);
        setLastSellPrice(target.sell_price);
      }
    } else {
      setBuyPrice('');
      setSellPrice('');
      setLastBoughtPrice(null);
      setLastSellPrice(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const data = {
        item_id: isNewItem ? undefined : selectedItemId,
        name: isNewItem ? newItemName : undefined,
        subcategory_id: isNewItem ? newItemSubcategoryId : undefined,
        image_url: isNewItem ? newItemImage : undefined, // Store emoji as image_url
        quantity: Number(quantity),
        unit_buy_price: Number(buyPrice),
        unit_sell_price: Number(sellPrice),
        shopping_date: new Date(shoppingDate).toISOString(),
      };

      const res = await addMarketInput(data);
      if (res?.error) {
        setError(res.error);
      } else {
        // Reset form
        setSelectedItemId('');
        setNewItemName('');
        setQuantity('');
        setBuyPrice('');
        setSellPrice('');
        setIsNewItem(false);
        setActiveTab('ledger'); // Switch to ledger to see it

      }
    });
  };

  const filteredLedger = useMemo(() => {
    if (!monthFilter) return marketInputs;
    return marketInputs.filter(m => m.shopping_date.startsWith(monthFilter));
  }, [marketInputs, monthFilter]);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-px">
        <button
          onClick={() => setActiveTab('input')}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition ${activeTab === 'input' ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-zinc-400 hover:text-zinc-600'}`}
        >
          New Stock Entry
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition ${activeTab === 'ledger' ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-zinc-400 hover:text-zinc-600'}`}
        >
          Purchase Ledger
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition ${activeTab === 'categories' ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-zinc-400 hover:text-zinc-600'}`}
        >
          Manage Categories
        </button>
      </div>

      {activeTab === 'input' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-emerald-100 shadow-[0_15px_40px_rgba(16,185,129,0.04)] max-w-2xl">
          <h2 className="text-xl font-bold text-zinc-900 mb-6">Log Groceries & Market Purchases</h2>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Toggle Existing vs New Item */}
            <div className="flex items-center gap-4 bg-zinc-50 p-1.5 rounded-xl border border-zinc-200/60 inline-flex">
              <button
                type="button"
                onClick={() => setIsNewItem(false)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition ${!isNewItem ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
              >
                Existing Product
              </button>
              <button
                type="button"
                onClick={() => setIsNewItem(true)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition ${isNewItem ? 'bg-white shadow-sm text-emerald-700' : 'text-zinc-500 hover:text-zinc-700'}`}
              >
                + Add New Product
              </button>
            </div>

            {/* Product Selection / Creation */}
            <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-4">
              {!isNewItem ? (
                <div>
                  <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">
                    Select Product *
                  </label>
                  <select
                    value={selectedItemId}
                    onChange={handleItemSelect}
                    required={!isNewItem}
                    className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Choose an item --</option>
                    {localCategories.map(cat => (
                      <optgroup key={cat.id} label={cat.name.replace('_', ' ').toUpperCase()}>
                        {items
                          .filter(i => {
                            const sub = subcategories.find(s => s.id === i.subcategory_id);
                            return sub?.category_id === cat.id;
                          })
                          .map(i => (
                            <option key={i.id} value={i.id}>{i.name} (In Stock: {i.stock_quantity})</option>
                          ))}
                      </optgroup>
                    ))}
                  </select>
                  {selectedItemId && lastBoughtPrice !== null && (
                    <p className="mt-2 text-xs text-emerald-700 font-medium bg-emerald-100/50 p-2 rounded-lg border border-emerald-100">
                      ℹ️ Last bought for <span className="font-bold">{formatDZD(lastBoughtPrice)}</span>, currently selling for <span className="font-bold">{formatDZD(lastSellPrice || 0)}</span>. You can update these prices below.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div>
                    <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">
                      New Product Name *
                    </label>
                    <input
                      type="text"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      required={isNewItem}
                      placeholder="e.g. Toilet Paper 24-Pack"
                      className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">
                        Category
                      </label>
                      <select
                        value={newItemCategoryId}
                        onChange={(e) => setNewItemCategoryId(e.target.value)}
                        required={isNewItem}
                        className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="">-- Choose --</option>
                        {localCategories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">
                        Subcategory
                      </label>
                      <select
                        value={newItemSubcategoryId}
                        onChange={(e) => setNewItemSubcategoryId(e.target.value)}
                        required={isNewItem}
                        className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:border-emerald-500"
                        disabled={!newItemCategoryId}
                      >
                        <option value="">-- Choose --</option>
                        {filteredSubcategories.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">
                      Select Icon / Avatar *
                    </label>
                    <div className="grid grid-cols-8 gap-2 bg-white p-3 rounded-xl border border-emerald-200 max-h-32 overflow-y-auto">
                      {PREDEFINED_ICONS.map(icon => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setNewItemImage(icon)}
                          className={`text-2xl p-1 rounded-lg transition hover:bg-emerald-50 hover:scale-110 ${newItemImage === icon ? 'bg-emerald-100 ring-2 ring-emerald-500 scale-110' : ''}`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Price & Quantity Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                  Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  placeholder="e.g. 5"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                  Buy Price *
                </label>
                <input
                  type="number"
                  min="0"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value)}
                  required
                  placeholder="DZD"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                  Sell Price *
                </label>
                <input
                  type="number"
                  min="0"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                  required
                  placeholder="DZD"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={shoppingDate}
                  onChange={(e) => setShoppingDate(e.target.value)}
                  required
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 text-rose-600 p-4 rounded-xl border border-rose-200 text-sm font-semibold">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-xl bg-emerald-600 px-4 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {isPending ? 'Logging Purchase...' : 'Log Market Purchase'}
            </button>

          </form>
        </div>
      )}

      {activeTab === 'ledger' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-zinc-900">Purchase Ledger & Valuation</h2>
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 focus:outline-none focus:border-emerald-500 shadow-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
              <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Filtered Purchases Total</p>
              <p className="text-2xl font-bold text-emerald-950 mt-1">
                {formatDZD(filteredLedger.reduce((sum, row) => sum + row.total_worth, 0))}
              </p>
              <p className="text-xs text-emerald-700 mt-1 opacity-80">Total spent on selected month's entries</p>
            </div>
            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4">
              <p className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Current Inventory Cost</p>
              <p className="text-2xl font-bold text-zinc-900 mt-1">
                {formatDZD(items.reduce((sum, item) => sum + (item.stock_quantity * item.cost_price), 0))}
              </p>
              <p className="text-xs text-zinc-500 mt-1 opacity-80">Total cost of items currently in stock</p>
            </div>
            <div className="bg-pink-50 border border-pink-100 rounded-2xl p-4">
              <p className="text-xs font-bold text-pink-700 uppercase tracking-wider">Current Inventory Value</p>
              <p className="text-2xl font-bold text-pink-950 mt-1">
                {formatDZD(items.reduce((sum, item) => sum + (item.stock_quantity * item.sell_price), 0))}
              </p>
              <p className="text-xs text-pink-600 mt-1 opacity-80">Potential revenue from current stock</p>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-600">
                <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="px-6 py-4 font-bold tracking-wider">Date</th>
                    <th className="px-6 py-4 font-bold tracking-wider">Item</th>
                    <th className="px-6 py-4 font-bold tracking-wider text-right">Quantity</th>
                    <th className="px-6 py-4 font-bold tracking-wider text-right">Buy Price</th>
                    <th className="px-6 py-4 font-bold tracking-wider text-right">Sell Price</th>
                    <th className="px-6 py-4 font-bold tracking-wider text-right">Total Worth</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredLedger.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                        No purchases found for this period.
                      </td>
                    </tr>
                  ) : (
                    filteredLedger.map((row) => (
                      <tr key={row.id} className="transition hover:bg-zinc-50/50">
                        <td className="whitespace-nowrap px-6 py-4 font-medium text-zinc-900">
                          {formatDate(row.shopping_date)}
                        </td>
                        <td className="px-6 py-4 font-bold text-zinc-900">
                          {row.items?.name || 'Unknown Item'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="inline-flex items-center justify-center rounded-lg bg-emerald-100 px-2.5 py-1 font-bold text-emerald-800">
                            {row.quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-zinc-500 font-semibold">
                          {formatDZD(row.unit_buy_price)}
                        </td>
                        <td className="px-6 py-4 text-right text-emerald-600 font-semibold">
                          {formatDZD(row.unit_sell_price)}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-zinc-900">
                          {formatDZD(row.total_worth)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <CategoryManagementTab 
          categories={localCategories} 
          onCategoryAdded={(cat) => setLocalCategories(prev => [...prev, cat].sort((a, b) => a.position - b.position))}
          onSubcategoryAdded={(sub) => setLocalSubcats(prev => [...prev, sub].sort((a, b) => a.position - b.position))}
          onCategoryDeleted={(id) => setLocalCategories(prev => prev.filter(c => c.id !== id))}
        />
      )}

    </div>
  );
}

function CategoryManagementTab({ 
  categories,
  onCategoryAdded,
  onSubcategoryAdded,
  onCategoryDeleted
}: { 
  categories: ServiceCategory[],
  onCategoryAdded: (cat: ServiceCategory) => void,
  onSubcategoryAdded: (sub: ServiceSubcategory) => void,
  onCategoryDeleted: (id: string) => void
}) {
  const [isPending, startTransition] = useTransition();
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('📦');
  const [catPos, setCatPos] = useState('');

  const [subCatName, setSubCatName] = useState('');
  const [subCatIcon, setSubCatIcon] = useState('📦');
  const [subCatPos, setSubCatPos] = useState('');
  const [parentCatId, setParentCatId] = useState('');

  const router = useRouter();

  const [error, setError] = useState<string | null>(null);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const { addCategory } = await import('@/actions/categories');
      const res = await addCategory(catName, catIcon, Number(catPos) || 1);
      if (res?.error) {
        setError(res.error);
      } else if (res?.data) {
        onCategoryAdded(res.data);
        setCatName('');
        setCatPos('');
        router.refresh();
      }
    });
  };

  const handleAddSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const { addSubcategory } = await import('@/actions/categories');
      const res = await addSubcategory(parentCatId, subCatName, subCatIcon, Number(subCatPos) || 1);
      if (res?.error) {
        setError(res.error);
      } else if (res?.data) {
        onSubcategoryAdded(res.data);
        setSubCatName('');
        setSubCatPos('');
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm font-semibold">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-zinc-200 shadow-sm">
        <h3 className="text-lg font-bold text-zinc-900 mb-6">Create Top-Level Category</h3>
        <form onSubmit={handleAddCategory} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">Category Name</label>
            <input type="text" value={catName} onChange={e => setCatName(e.target.value)} required className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none" placeholder="e.g. Buffet" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">Icon (Emoji)</label>
              <input type="text" value={catIcon} onChange={e => setCatIcon(e.target.value)} required className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">Position</label>
              <input type="number" value={catPos} onChange={e => setCatPos(e.target.value)} required className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none" placeholder="e.g. 1" />
            </div>
          </div>
          <button type="submit" disabled={isPending} className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-zinc-800">
            {isPending ? 'Adding...' : 'Add Category'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-3xl p-6 md:p-8 border border-zinc-200 shadow-sm">
        <h3 className="text-lg font-bold text-zinc-900 mb-6">Create Subcategory</h3>
        <form onSubmit={handleAddSubcategory} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">Parent Category</label>
            <select value={parentCatId} onChange={e => setParentCatId(e.target.value)} required className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none">
              <option value="">-- Select Parent Category --</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">Subcategory Name</label>
            <input type="text" value={subCatName} onChange={e => setSubCatName(e.target.value)} required className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none" placeholder="e.g. Soups" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">Icon (Emoji)</label>
              <input type="text" value={subCatIcon} onChange={e => setSubCatIcon(e.target.value)} required className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">Position</label>
              <input type="number" value={subCatPos} onChange={e => setSubCatPos(e.target.value)} required className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none" placeholder="e.g. 1" />
            </div>
          </div>
          <button type="submit" disabled={isPending} className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-zinc-800">
            {isPending ? 'Adding...' : 'Add Subcategory'}
          </button>
        </form>
      </div>
      </div>

      <div className="bg-white rounded-3xl p-6 md:p-8 border border-zinc-200 shadow-sm mt-6">
        <h3 className="text-lg font-bold text-zinc-900 mb-6">Existing Categories</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between p-4 border border-zinc-100 rounded-2xl bg-zinc-50 hover:bg-zinc-100 transition">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{cat.icon}</span>
                <span className="font-semibold text-zinc-800 capitalize">{cat.name.replace('_', ' ')}</span>
              </div>
              <button
                onClick={async () => {
                  if (confirm(`Are you sure you want to delete ${cat.name}? This might fail if products depend on it.`)) {
                    const { deleteCategory } = await import('@/actions/categories');
                    await deleteCategory(cat.id);
                    onCategoryDeleted(cat.id);
                    router.refresh();
                  }
                }}
                className="text-rose-500 hover:text-rose-700 text-sm font-bold"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
