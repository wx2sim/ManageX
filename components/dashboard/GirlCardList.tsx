'use client';

import { useState, useMemo } from 'react';
import { GirlBalance } from '@/lib/types';
import GirlCard from './GirlCard';
import AddGirlButton from './AddGirlButton';

interface GirlCardListProps {
  girls: GirlBalance[];
}

export default function GirlCardList({ girls }: GirlCardListProps) {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived'>('active');

  const filteredGirls = useMemo(() => {
    return girls.filter((girl) => {
      const matchesSearch = girl.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'active' ? girl.is_active : !girl.is_active;
      return matchesSearch && matchesStatus;
    });
  }, [girls, search, statusFilter]);

  // Count active vs archived
  const activeCount = useMemo(() => girls.filter((g) => g.is_active).length, [girls]);
  const archivedCount = useMemo(() => girls.filter((g) => !g.is_active).length, [girls]);

  return (
    <div className="space-y-8">
      {/* Search and Filters bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 backdrop-blur-md border border-pink-100/50 p-4 rounded-3xl shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search residents by name..."
            className="w-full rounded-2xl border border-pink-200 bg-white px-4 py-2.5 pl-10 text-sm text-zinc-950 placeholder-zinc-400 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
          />
          <span className="absolute left-3.5 top-3 text-zinc-400 text-sm">🔍</span>
        </div>

        {/* View and Status Toggles */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="inline-flex rounded-xl border border-pink-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                statusFilter === 'active'
                  ? 'bg-pink-600 text-white shadow-sm'
                  : 'text-zinc-500 hover:bg-pink-50'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('archived')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                statusFilter === 'archived'
                  ? 'bg-pink-600 text-white shadow-sm'
                  : 'text-zinc-500 hover:bg-pink-50'
              }`}
            >
              Archived ({archivedCount})
            </button>
          </div>

          {/* Grid/List Toggle */}
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-3.5 py-2 text-xs font-semibold text-pink-700 transition hover:bg-pink-50"
            title={`Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`}
          >
            {viewMode === 'grid' ? (
              <span className="flex items-center gap-1">☰ List view</span>
            ) : (
              <span className="flex items-center gap-1">⊞ Grid view</span>
            )}
          </button>
        </div>
      </div>

      {/* Grid or List list representation */}
      {filteredGirls.length === 0 ? (
        <div className="text-center py-12 rounded-[2rem] border border-dashed border-pink-200 bg-white/70 p-8">
          <p className="text-zinc-400 text-sm">No residents found matching the filters.</p>
          <div className="mt-4 inline-block">
            <AddGirlButton compact={false} />
          </div>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3' 
          : 'flex flex-col gap-3'
        }>
          {filteredGirls.map((girl) => (
            <GirlCard
              key={girl.girl_id}
              profile={girl}
              compact={viewMode === 'list'}
            />
          ))}

          {/* Render the plus add button at the end */}
          <AddGirlButton compact={viewMode === 'list'} />
        </div>
      )}
    </div>
  );
}
