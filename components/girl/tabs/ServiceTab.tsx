'use client';

import { useState } from 'react';
import { ServiceCategory, ServiceSubcategory, Item } from '@/lib/types';
import ItemList from '@/components/service/ItemList';

interface Props {
  girlId: string;
  categories: ServiceCategory[];
  subcategories: ServiceSubcategory[];
  items: Item[];
}

export default function ServiceTab({ girlId, categories, subcategories, items }: Props) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);

  // Dynamic color palettes to give every category a unique beautiful style
  const COLOR_PALETTES = [
    'bg-orange-50 hover:bg-orange-100/80 border-orange-100 text-orange-700',
    'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-100 text-emerald-700',
    'bg-zinc-100 hover:bg-zinc-200/80 border-zinc-200 text-zinc-700',
    'bg-pink-50 hover:bg-pink-100/80 border-pink-100 text-pink-700',
    'bg-purple-50 hover:bg-purple-100/80 border-purple-100 text-purple-700',
    'bg-blue-50 hover:bg-blue-100/80 border-blue-100 text-blue-700',
    'bg-indigo-50 hover:bg-indigo-100/80 border-indigo-100 text-indigo-700',
    'bg-rose-50 hover:bg-rose-100/80 border-rose-100 text-rose-700',
  ];

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    const categorySubcategories = subcategories.filter(sub => sub.category_id === categoryId);
    
    // If only one subcategory, auto-select it
    if (categorySubcategories.length === 1) {
      setSelectedSubcategoryId(categorySubcategories[0].id);
    } else {
      setSelectedSubcategoryId(null);
    }
  };

  const handleBack = () => {
    if (selectedSubcategoryId) {
      // Check if this category only has 1 subcategory. If so, going back should go all the way to categories.
      const currentCategorySubs = subcategories.filter(sub => sub.category_id === selectedCategoryId);
      if (currentCategorySubs.length === 1) {
        setSelectedCategoryId(null);
        setSelectedSubcategoryId(null);
      } else {
        setSelectedSubcategoryId(null);
      }
    } else {
      setSelectedCategoryId(null);
    }
  };

  if (selectedSubcategoryId) {
    const subCat = subcategories.find(s => s.id === selectedSubcategoryId);
    const cat = categories.find(c => c.id === selectedCategoryId);
    const subItems = items.filter(i => i.subcategory_id === selectedSubcategoryId);

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-950 capitalize">
              Checkout: {cat?.name.replace('_', ' ')} / {subCat?.name}
            </h2>
            <p className="text-xs text-zinc-500 mt-1">Select product quantities and confirm checkout.</p>
          </div>
          <button
            onClick={handleBack}
            className="text-xs font-semibold text-pink-600 hover:text-pink-700 transition"
          >
            ← Back
          </button>
        </div>
        <ItemList 
          girlId={girlId} 
          subcategoryId={selectedSubcategoryId} 
          items={subItems} 
        />
      </div>
    );
  }

  if (selectedCategoryId) {
    const cat = categories.find(c => c.id === selectedCategoryId);
    const categorySubcategories = subcategories.filter(sub => 
      sub.category_id === selectedCategoryId && items.some(i => i.subcategory_id === sub.id && i.stock_quantity > 0)
    );

    return (
      <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-950 capitalize">{cat?.name.replace('_', ' ')} Subcategories</h2>
            <p className="text-xs text-zinc-500 mt-1">Select a subcategory to load products.</p>
          </div>
          <button
            onClick={handleBack}
            className="text-xs font-semibold text-pink-600 hover:text-pink-700 transition"
          >
            ← Back to Categories
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categorySubcategories.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubcategoryId(sub.id)}
              className="flex items-center justify-between rounded-3xl border border-pink-100 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-md hover:border-pink-200"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl select-none">{sub.icon || '📁'}</span>
                <span className="font-semibold text-zinc-800 capitalize">{sub.name}</span>
              </div>
              <span className="text-zinc-400 font-bold">➔</span>
            </button>
          ))}
          {categorySubcategories.length === 0 && (
             <div className="col-span-full p-6 text-center text-rose-600 bg-rose-50 border border-rose-200 rounded-3xl">
               No subcategories exist for this category. Please add them via Admin.
             </div>
          )}
        </div>
      </div>
    );
  }

  // Filter out subcategories that have no items with stock > 0
  const activeSubcategories = subcategories.filter(sub => 
    items.some(i => i.subcategory_id === sub.id && i.stock_quantity > 0)
  );

  // Categories Grid - Only show if they have active subcategories
  const sortedCategories = [...categories]
    .filter(cat => activeSubcategories.some(sub => sub.category_id === cat.id))
    .sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div>
        <h2 className="text-lg font-bold text-zinc-950">Service Categories</h2>
        <p className="text-xs text-zinc-500 mt-1">Select a category to view items or checkout purchases. Only categories with available stock are shown.</p>
      </div>

      {sortedCategories.length === 0 ? (
        <div className="p-8 text-center bg-zinc-50 border border-zinc-200 rounded-3xl mt-6">
          <p className="text-zinc-500 font-semibold mb-2">No Items in Stock</p>
          <p className="text-sm text-zinc-400">Add products to the Market Stock to make them available for checkout.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {sortedCategories.map((cat, index) => {
            const colorClass = COLOR_PALETTES[index % COLOR_PALETTES.length];

            return (
              <button
                key={cat.id}
                onClick={() => handleSelectCategory(cat.id)}
                className={`flex flex-col text-left justify-between rounded-[2rem] border p-6 min-h-[160px] transition hover:-translate-y-1 hover:shadow-md ${colorClass}`}
              >
                <div className="space-y-3">
                  <span className="text-4xl block select-none">{cat.icon || '📦'}</span>
                  <h3 className="font-bold text-lg capitalize text-zinc-900">{cat.name.replace('_', ' ')}</h3>
                </div>
                
                <div className="flex items-center justify-end text-sm font-bold mt-4 w-full text-right">
                  Select ➔
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
