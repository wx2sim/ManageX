'use client';

import { useState, useMemo } from 'react';
import { GirlBalance } from '@/lib/types';
import GirlCard from './GirlCard';
import AddGirlButton from './AddGirlButton';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface GirlCardListProps {
  girls: GirlBalance[];
}

export default function GirlCardList({ girls }: GirlCardListProps) {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived' | 'blocked'>('active');
  const { t } = useTranslation();

  const filteredGirls = useMemo(() => {
    const filtered = girls.filter((girl) => {
      const matchesSearch = girl.name.toLowerCase().includes(search.toLowerCase());
      let matchesStatus = false;
      
      // Fallback for pre-migration data
      const currentStatus = girl.status || (girl.is_active ? 'active' : 'archived');
      const currentAccountType = girl.account_type || 'resident';

      // Admin accounts are always shown in the active tab
      if (currentAccountType === 'admin') {
        if (statusFilter === 'active') {
          return matchesSearch;
        }
        return false;
      }

      if (statusFilter === 'active') {
        matchesStatus = currentStatus === 'active';
      } else if (statusFilter === 'blocked') {
        matchesStatus = currentStatus === 'blocked';
      } else if (statusFilter === 'archived') {
        matchesStatus = currentStatus === 'archived';
      }

      return matchesSearch && matchesStatus;
    });

    // Pin admin cards to the top (1st position)
    return filtered.sort((a, b) => {
      const aIsAdmin = (a.account_type || 'resident') === 'admin' ? 1 : 0;
      const bIsAdmin = (b.account_type || 'resident') === 'admin' ? 1 : 0;
      return bIsAdmin - aIsAdmin;
    });
  }, [girls, search, statusFilter]);

  // Count active vs archived vs blocked vs nuitee
  const activeCount = useMemo(() => girls.filter((g) => (g.status || (g.is_active ? 'active' : 'archived')) === 'active').length, [girls]);
  const blockedCount = useMemo(() => girls.filter((g) => g.status === 'blocked').length, [girls]);
  const archivedCount = useMemo(() => girls.filter((g) => (g.status || (g.is_active ? 'active' : 'archived')) === 'archived').length, [girls]);

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
            placeholder={t('dashboard.searchResidents')}
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
              {t('dashboard.active') || 'Active'} ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('blocked')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                statusFilter === 'blocked'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-zinc-500 hover:bg-rose-50'
              }`}
            >
              {t('dashboard.blocked') || 'Blocked'} ({blockedCount})
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
              {t('dashboard.archived') || 'Archived'} ({archivedCount})
            </button>
          </div>

          {/* Grid/List Toggle */}
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-3.5 py-2 text-xs font-semibold text-pink-700 transition hover:bg-pink-50"
          >
            {viewMode === 'grid' ? (
              <span className="flex items-center gap-1">☰ {t('dashboard.listView')}</span>
            ) : (
              <span className="flex items-center gap-1">⊞ {t('dashboard.gridView')}</span>
            )}
          </button>
        </div>
      </div>

      {/* Grid or List list representation */}
      {filteredGirls.length === 0 ? (
        <div className="text-center py-12 rounded-[2rem] border border-dashed border-pink-200 bg-white/70 p-8">
          <p className="text-zinc-400 text-sm">{t('dashboard.noResidents')}</p>
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
