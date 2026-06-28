'use client';

import Link from 'next/link';
import { ServiceCategory } from '@/lib/types';

interface CategoryGridProps {
  girlId: string;
  categories: ServiceCategory[];
}

export default function CategoryGrid({ girlId, categories }: CategoryGridProps) {
  // Styling maps for the 8 primary categories
  const categoryStyles: Record<string, { color: string; desc: string }> = {
    buffet: { 
      color: 'bg-orange-50 hover:bg-orange-100/80 border-orange-100 text-orange-700',
      desc: 'Cooked meals, plates, drinks & cakes.' 
    },
    alimentation: { 
      color: 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-100 text-emerald-700',
      desc: 'Groceries, kitchen items & essentials.' 
    },
    cigarettes: { 
      color: 'bg-zinc-100 hover:bg-zinc-200/80 border-zinc-200 text-zinc-700',
      desc: 'Smokes, packs & loose units.' 
    },
    cosmetics: { 
      color: 'bg-pink-50 hover:bg-pink-100/80 border-pink-100 text-pink-700',
      desc: 'Cosmetic items & beauty accessories.' 
    },
    hair: { 
      color: 'bg-purple-50 hover:bg-purple-100/80 border-purple-100 text-purple-700',
      desc: 'Styling, haircuts & blowdrys.' 
    },
    clothes: { 
      color: 'bg-blue-50 hover:bg-blue-100/80 border-blue-100 text-blue-700',
      desc: 'Dresses, apparel & fabrics.' 
    },
    online_shopping: { 
      color: 'bg-indigo-50 hover:bg-indigo-100/80 border-indigo-100 text-indigo-700',
      desc: 'Shipments & courier parcel logs.' 
    },
    meds: { 
      color: 'bg-rose-50 hover:bg-rose-100/80 border-rose-100 text-rose-700',
      desc: 'Prescriptions & pharmacy logs.' 
    },
  };

  // Sort by position
  const sortedCategories = [...categories].sort((a, b) => a.position - b.position);

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {sortedCategories.map((cat) => {
        const style = categoryStyles[cat.name.toLowerCase()] || {
          color: 'bg-pink-50 hover:bg-pink-100 border-pink-100 text-pink-700',
          desc: 'Custom resident services log.'
        };

        return (
          <Link
            key={cat.id}
            href={`/girls/${girlId}/service/${cat.name.toLowerCase()}`}
            className={`flex flex-col justify-between rounded-[2rem] border p-6 min-h-[160px] transition hover:-translate-y-1 hover:shadow-md ${style.color}`}
          >
            <div className="space-y-3">
              <span className="text-4xl block select-none">{cat.icon || '📦'}</span>
              <h3 className="font-bold text-lg capitalize text-zinc-900">{cat.name.replace('_', ' ')}</h3>
              <p className="text-xs text-zinc-500 leading-normal">{style.desc}</p>
            </div>
            
            <div className="flex items-center justify-end text-sm font-bold mt-4">
              Select ➔
            </div>
          </Link>
        );
      })}
    </div>
  );
}
