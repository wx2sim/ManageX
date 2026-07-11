'use client';

import { useOverlayTransition } from '@/lib/context/OverlayContext';
import { useState, useMemo } from 'react';
import { Transaction, TransactionType } from '@/lib/types';
import { formatDZD, formatDate } from '@/lib/utils/formatters';
import { calculateTransactionSummary } from '@/lib/business_logic';
import { extractBonusBucket, extractAllGlobalBonuses } from '@/actions/vault';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface StatsTableProps {
  transactions: Transaction[];
  showGirlColumn?: boolean;
  girlNamesMap?: Record<string, string>; // Maps girl_id to name for global stats page
  girlId?: string; // If passed, it's for a specific resident. Otherwise, it's global.
  girl?: any;
  globalEuroVault?: number;
  globalDzdVault?: number;
}

type PeriodFilter = 'all' | 'today' | 'week' | 'month';

export default function StatsTable({ 
  transactions, 
  showGirlColumn = false, 
  girlNamesMap = {}, 
  girlId, 
  girl,
  globalEuroVault = 0,
  globalDzdVault = 0
}: StatsTableProps) {
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [specificDateFilter, setSpecificDateFilter] = useState('');
  const [residentFilter, setResidentFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [undoingId, setUndoingId] = useState<string | null>(null);

  // Bonus Extraction Modal State
  const [isExtractModalOpen, setIsExtractModalOpen] = useState(false);
  const [extractAmountStr, setExtractAmountStr] = useState('');
  const [isExtracting, startTransition] = useOverlayTransition();
  const [extractError, setExtractError] = useState<string | null>(null);

  // Vault Extraction Modal State (Euro + DZD)
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [euroExtractAmount, setEuroExtractAmount] = useState('');
  const [dzdExtractAmount, setDzdExtractAmount] = useState('');
  const [vaultExtractError, setVaultExtractError] = useState<string | null>(null);

  const { t } = useTranslation();

  const isAdmin = girl?.account_type === 'admin';

  // 1. Filter Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Type Filter
      if (typeFilter !== 'all' && tx.type !== typeFilter) {
        return false;
      }

      // Search Query
      if (searchQuery && tx.note && !tx.note.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Resident Filter
      if (residentFilter !== 'all') {
        if (residentFilter === 'admin') {
          if (tx.girl_id) return false;
        } else {
          if (tx.girl_id !== residentFilter) return false;
        }
      }

      // Specific Date Filter
      if (specificDateFilter) {
        const txDate = new Date(tx.transaction_date);
        const filterDate = new Date(specificDateFilter);
        return txDate.toDateString() === filterDate.toDateString();
      }

      // Period Filter
      if (periodFilter === 'all') return true;

      const txDate = new Date(tx.transaction_date);
      const now = new Date();

      if (periodFilter === 'today') {
        return txDate.toDateString() === now.toDateString();
      }

      if (periodFilter === 'week') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        return txDate >= oneWeekAgo;
      }

      if (periodFilter === 'month') {
        return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
      }

      return true;
    });
  }, [transactions, typeFilter, periodFilter, specificDateFilter, residentFilter, searchQuery]);

  // 2. Compute Summary Metrics
  const summary = useMemo(() => {
    return calculateTransactionSummary(filteredTransactions);
  }, [filteredTransactions]);

  const typeLabels: Record<TransactionType | 'all', string> = {
    all: t('statsTable.typeLabels.all'),
    service: t('statsTable.typeLabels.service'),
    payment: t('statsTable.typeLabels.payment'),
    bonus: t('statsTable.typeLabels.bonus'),
    duty: t('statsTable.typeLabels.duty'),
    fixed_payment: t('statsTable.typeLabels.fixed_payment'),
    instant_profit: t('statsTable.typeLabels.instant_profit'),
    market_expense: isAdmin ? '🛍️ Dépense / Charge' : t('statsTable.typeLabels.market_expense'),
    euro_extraction: 'Euro Extraction',
    dzd_extraction: 'DZD Extraction',
  };

  const typeLabelsToRender = isAdmin
    ? {
        all: typeLabels.all,
        service: typeLabels.service,
        payment: typeLabels.payment,
        market_expense: typeLabels.market_expense,
      }
    : typeLabels;

  const handleOpenExtractModal = () => {
    if (summary.bonusReceived <= 0) return;
    setExtractAmountStr(summary.bonusReceived.toString());
    setExtractError(null);
    setIsExtractModalOpen(true);
  };

  const handleUndo = (txId: string) => {
    if (confirm(t('common.confirmUndo') || 'Are you sure you want to undo this operation?')) {
      setUndoingId(txId);
      startTransition(async () => {
        const { undoTransaction } = await import('@/actions/transactions');
        const res = await undoTransaction(txId);
        if (res?.error) {
          alert(res.error);
        }
        setUndoingId(null);
      });
    }
  };

  const handleExtractSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setExtractError(null);
    const amount = parseFloat(extractAmountStr);

    if (isNaN(amount) || amount <= 0) {
      setExtractError('Please enter a valid amount to extract.');
      return;
    }

    if (girlId && amount > summary.bonusReceived) {
      setExtractError('Cannot extract more than what is in the bucket.');
      return;
    }

    startTransition(async () => {
      let res;
      if (girlId) {
        // Resident specific extraction
        res = await extractBonusBucket(girlId, amount);
      } else {
        // Global extraction (always extracts all)
        res = await extractAllGlobalBonuses();
      }

      if (res?.error) {
        setExtractError(res.error);
      } else {
        setIsExtractModalOpen(false);
      }
    });
  };

  const handleOpenVaultModal = () => {
    if (girlId) {
      if (!girl) return;
      const hasEuro = Number(girl.euro_vault_balance || 0) > 0;
      const hasDzd = Number(girl.dzd_vault_balance || 0) > 0;
      if (!hasEuro && !hasDzd) return;
      setEuroExtractAmount(hasEuro ? girl.euro_vault_balance.toString() : '0');
      setDzdExtractAmount(hasDzd ? girl.dzd_vault_balance.toString() : '0');
    } else {
      const hasEuro = Number(globalEuroVault || 0) > 0;
      const hasDzd = Number(globalDzdVault || 0) > 0;
      if (!hasEuro && !hasDzd) return;
      setEuroExtractAmount(globalEuroVault.toString());
      setDzdExtractAmount(globalDzdVault.toString());
    }
    setVaultExtractError(null);
    setIsVaultModalOpen(true);
  };

  const handleVaultExtractSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setVaultExtractError(null);

    startTransition(async () => {
      if (girlId) {
        const euroAmt = parseFloat(euroExtractAmount) || 0;
        const dzdAmt = parseFloat(dzdExtractAmount) || 0;

        if (euroAmt <= 0 && dzdAmt <= 0) {
          setVaultExtractError('Enter at least one amount to extract.');
          return;
        }

        if (euroAmt > Number(girl?.euro_vault_balance || 0)) {
          setVaultExtractError('Cannot extract more Euro than available in vault.');
          return;
        }

        if (dzdAmt > Number(girl?.dzd_vault_balance || 0)) {
          setVaultExtractError('Cannot extract more DZD than available in vault.');
          return;
        }

        const { extractEuro, extractDzdRent } = await import('@/actions/vault');
        
        if (euroAmt > 0) {
          const res = await extractEuro(girlId as string, euroAmt, 'Manual Euro Extraction');
          if (res?.error) { setVaultExtractError(res.error); return; }
        }
        
        if (dzdAmt > 0) {
          const res = await extractDzdRent(girlId as string, dzdAmt, 'DZD loyer et frais fix');
          if (res?.error) { setVaultExtractError(res.error); return; }
        }
      } else {
        const { extractAllGlobalVaults } = await import('@/actions/vault');
        const res = await extractAllGlobalVaults();
        if (res?.error) {
          setVaultExtractError(res.error);
          return;
        }
      }
      
      setIsVaultModalOpen(false);
    });
  };

  return (
    <div className="space-y-6">
      {/* Extraction Modal */}
      {isExtractModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-zinc-900 mb-2">{t('statsTable.extractModalTitle')}</h3>
            <p className="text-sm text-zinc-500 mb-6">
              {girlId
                ? t('statsTable.extractModalDescResident')
                : t('statsTable.extractModalDescGlobal')}
            </p>

            <form onSubmit={handleExtractSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                  {t('statsTable.amountToExtract')}
                </label>
                <input
                  type="number"
                  value={extractAmountStr}
                  onChange={(e) => setExtractAmountStr(e.target.value)}
                  disabled={!girlId || isExtracting} // Lock input for global extraction
                  className="w-full rounded-xl border border-purple-200 bg-purple-50/50 px-4 py-3 text-lg font-bold text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-60"
                  max={girlId ? summary.bonusReceived : undefined}
                />
              </div>

              {extractError && (
                <div className="text-xs text-rose-600 font-medium bg-rose-50 p-3 rounded-xl border border-rose-100">
                  {extractError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsExtractModalOpen(false)}
                  disabled={isExtracting}
                  className="flex-1 rounded-xl bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200 disabled:opacity-50"
                >
                  {t('statsTable.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isExtracting}
                  className="flex-1 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-500/20 transition hover:bg-purple-700 disabled:opacity-50"
                >
                  {isExtracting ? t('statsTable.extracting') : t('statsTable.confirm')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vault Extraction Modal (Euro + DZD) */}
      {isVaultModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-zinc-900 mb-1">
              {girlId ? 'Extract from Vaults' : 'Extract All Vaults'}
            </h3>
            <p className="text-sm text-zinc-500 mb-6">
              {girlId ? 'Choose how much to extract from each vault.' : 'Confirm extraction of all residents\' vaults to company profit.'}
            </p>

            <form onSubmit={handleVaultExtractSubmit} className="space-y-4">
              {girlId ? (
                <>
                  {/* Euro Amount */}
                  <div>
                    <label className="block text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">
                      💶 Euro (Available: €{Number(girl?.euro_vault_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })})
                    </label>
                    <input
                      type="number"
                      value={euroExtractAmount}
                      onChange={(e) => setEuroExtractAmount(e.target.value)}
                      disabled={isExtracting}
                      className="w-full rounded-xl border border-blue-200 bg-blue-50/50 px-4 py-3 text-lg font-bold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                      min="0"
                      max={girl?.euro_vault_balance}
                      step="0.1"
                      placeholder="0"
                    />
                  </div>

                  {/* DZD Amount */}
                  <div>
                    <label className="block text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2">
                      💰 DZD (Available: {formatDZD(girl?.dzd_vault_balance || 0)})
                    </label>
                    <input
                      type="number"
                      value={dzdExtractAmount}
                      onChange={(e) => setDzdExtractAmount(e.target.value)}
                      disabled={isExtracting}
                      className="w-full rounded-xl border border-indigo-200 bg-indigo-50/50 px-4 py-3 text-lg font-bold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                      min="0"
                      max={girl?.dzd_vault_balance}
                      step="1"
                      placeholder="0"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-3 bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                  <div className="flex justify-between items-center text-sm font-semibold">
                    <span className="text-zinc-500">Total Euro:</span>
                    <span className="text-blue-700 font-bold">€{Number(globalEuroVault || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-semibold">
                    <span className="text-zinc-500">Total DZD:</span>
                    <span className="text-indigo-700 font-bold">{formatDZD(globalDzdVault || 0)}</span>
                  </div>
                </div>
              )}

              {vaultExtractError && (
                <div className="text-xs text-rose-600 font-medium bg-rose-50 p-3 rounded-xl border border-rose-100">
                  {vaultExtractError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsVaultModalOpen(false)}
                  disabled={isExtracting}
                  className="flex-1 rounded-xl bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isExtracting}
                  className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
                >
                  {isExtracting ? 'Extracting...' : 'Extract'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Summary Widgets Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
          <p className="text-xxs font-bold text-emerald-800 uppercase tracking-wider">{t('statsTable.totalIncome')}</p>
          <p className="text-lg font-bold text-emerald-700 mt-1">+{formatDZD(summary.income)}</p>
        </div>

        {!isAdmin && (
          <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
            <p className="text-xxs font-bold text-blue-800 uppercase tracking-wider">{t('statsTable.accountBalance') || 'Status de Compte'}</p>
            <p className="text-lg font-bold text-blue-900 mt-1">
              {summary.netBalance > 0 ? '+' : summary.netBalance < 0 ? '-' : ''}{formatDZD(summary.netBalance)}
            </p>
          </div>
        )}
        <div className="rounded-2xl border border-pink-100 bg-pink-50/50 p-4">
          <p className="text-xxs font-bold text-pink-800 uppercase tracking-wider">{t('statsTable.totalDebt')}</p>
          <p className="text-lg font-bold text-pink-700 mt-1">+{formatDZD(summary.debtAdded)}</p>
        </div>
        {!isAdmin && (
          <div
            onClick={handleOpenExtractModal}
            className={`rounded-2xl border border-purple-100 bg-purple-50/50 p-4 shadow-sm relative overflow-hidden transition ${summary.bonusReceived > 0 ? 'cursor-pointer hover:bg-purple-100 hover:border-purple-300 hover:shadow-purple-500/10' : 'opacity-70 grayscale'}`}
            title={summary.bonusReceived > 0 ? t('statsTable.clickToExtract') : t('statsTable.noGifts')}
          >
            <div className="absolute top-0 right-0 p-2 opacity-10 text-2xl">🎁</div>
            <p className="text-xxs font-bold text-purple-800 uppercase tracking-wider">{t('statsTable.giftsAwards')}</p>
            <p className="text-lg font-bold text-purple-700 mt-1">
              {formatDZD(summary.bonusReceived)}
            </p>
          </div>
        )}

        {/* Global Vaults Summary Badge */}
        {!girlId && (
          <div
            onClick={handleOpenVaultModal}
            className={`rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 shadow-sm relative overflow-hidden transition ${(globalEuroVault > 0 || globalDzdVault > 0) ? 'cursor-pointer hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 hover:shadow-blue-500/10' : 'opacity-70 grayscale'}`}
            title={(globalEuroVault > 0 || globalDzdVault > 0) ? 'Click to Extract All' : 'Nothing to extract'}
          >
            <div className="absolute top-0 right-0 p-2 opacity-10 text-3xl">🏦</div>
            <p className="text-xxs font-bold text-blue-800 uppercase tracking-wider mb-2">Vaults (Global)</p>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xxs font-semibold text-blue-600">{t('common.euro')}</span>
                <span className="text-sm font-bold text-blue-700">€{Number(globalEuroVault || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xxs font-semibold text-indigo-600">DZD</span>
                <span className="text-sm font-bold text-indigo-700">{formatDZD(globalDzdVault || 0)}</span>
              </div>
            </div>
            {(globalEuroVault > 0 || globalDzdVault > 0) && (
              <p className="text-xxs text-blue-500 mt-2 text-center font-medium">Tap to extract all</p>
            )}
          </div>
        )}
        
        {/* Euro & DZD Vaults (extractable) + Rent Collected from resident */}
        {girl && !isAdmin && (
          <>
            <div
              onClick={handleOpenVaultModal}
              className={`rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 shadow-sm relative overflow-hidden transition sm:col-span-2 lg:col-span-1 ${(girl.euro_vault_balance > 0 || girl.dzd_vault_balance > 0) ? 'cursor-pointer hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 hover:shadow-blue-500/10' : 'opacity-70 grayscale'}`}
              title={(girl.euro_vault_balance > 0 || girl.dzd_vault_balance > 0) ? 'Click to Extract' : 'Nothing to extract'}
            >
              <div className="absolute top-0 right-0 p-2 opacity-10 text-3xl">🏦</div>
              <p className="text-xxs font-bold text-blue-800 uppercase tracking-wider mb-2">{t('statsTable.vaults')}</p>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xxs font-semibold text-blue-600">{t('common.euro')}</span>
                  <span className="text-sm font-bold text-blue-700">€{Number(girl.euro_vault_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xxs font-semibold text-indigo-600">DZD</span>
                  <span className="text-sm font-bold text-indigo-700">{formatDZD(girl.dzd_vault_balance || 0)}</span>
                </div>
              </div>
              {(girl.euro_vault_balance > 0 || girl.dzd_vault_balance > 0) && (
                <p className="text-xxs text-blue-500 mt-2 text-center font-medium">Tap to extract</p>
              )}
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 relative overflow-hidden sm:col-span-2 lg:col-span-1">
              <div className="absolute top-0 right-0 p-2 opacity-10 text-3xl">🤖</div>
              <p className="text-xxs font-bold text-emerald-800 uppercase tracking-wider mb-2">Rent Collected</p>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xxs font-semibold text-emerald-600">DZD</span>
                  <span className="text-sm font-bold text-emerald-700">+{formatDZD(girl.total_dzd_rent || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xxs font-semibold text-teal-600">{t('common.euro')}</span>
                  <span className="text-sm font-bold text-teal-700">+€{Number(girl.total_euro_rent || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Filters Layout */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white/70 p-4 rounded-3xl border border-pink-100/50 shadow-sm">
        {/* Search */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('statsTable.searchByNotes')}
          className="w-full xl:max-w-xs rounded-xl border border-pink-100 px-3.5 py-2 text-xs outline-none transition focus:border-pink-300 bg-white"
        />

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Specific Date Filter */}
          <div className="flex items-center gap-2 bg-white rounded-xl border border-pink-100 px-2 py-1">
            <label className="text-xxs font-bold text-zinc-400 uppercase tracking-wider pl-1">{t('statsTable.dateLabel')}</label>
            <input
              type="date"
              value={specificDateFilter}
              onChange={(e) => {
                setSpecificDateFilter(e.target.value);
                if (e.target.value) setPeriodFilter('all'); // Reset period when specific date chosen
              }}
              className="px-2 py-1 text-xs outline-none cursor-pointer bg-transparent text-zinc-700 font-semibold"
            />
          </div>

          {/* Period Filter (Hidden if specific date is active to avoid confusion) */}
          {!specificDateFilter && (
            <div className="inline-flex rounded-xl border border-pink-100 bg-white p-0.5 text-xs">
              {(['all', 'today', 'week', 'month'] as PeriodFilter[]).map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => setPeriodFilter(period)}
                  className={`rounded-lg px-3 py-1.5 font-semibold capitalize transition ${periodFilter === period
                    ? 'bg-pink-600 text-white'
                    : 'text-zinc-500 hover:bg-pink-50'
                    }`}
                >
                  {t(`statsTable.periodLabels.${period}` as any)}
                </button>
              ))}
            </div>
          )}

          {/* Type Selector */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="rounded-xl border border-pink-100 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 outline-none cursor-pointer"
          >
            {Object.entries(typeLabelsToRender).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>

          {/* Resident Filter (Only on Global Stats) */}
          {showGirlColumn && (
            <select
              value={residentFilter}
              onChange={(e) => setResidentFilter(e.target.value)}
              className="rounded-xl border border-pink-100 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 outline-none cursor-pointer"
            >
              <option value="all">{t('statsTable.allResidents')}</option>
              {Object.entries(girlNamesMap).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
              <option value="admin">{t('statsTable.adminGlobal')}</option>
            </select>
          )}
        </div>
      </div>

      {/* Transactions Table List */}
      <div className="bg-white rounded-3xl border border-pink-100 shadow-[0_15px_40px_rgba(236,72,153,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-pink-50/50 text-xxs font-bold text-zinc-500 uppercase tracking-wider border-b border-pink-100">
                <th className="py-4 px-6">{t('statsTable.tableDate')}</th>
                {showGirlColumn && <th className="py-4 px-6">{t('statsTable.tableResident')}</th>}
                <th className="py-4 px-6">{t('statsTable.tableType')}</th>
                <th className="py-4 px-6">{t('statsTable.tableAmount')}</th>
                <th className="py-4 px-6">{t('statsTable.tableNote')}</th>
                <th className="py-4 px-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-50 text-xs">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={showGirlColumn ? 6 : 5} className="py-12 text-center text-zinc-400 font-medium">
                    {t('statsTable.noTransactions')}
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  // Style amount depending on sign
                  let amtStyle = 'font-semibold ';
                  let amtSign = '';

                  const isExtraction = (tx.type === 'instant_profit' && tx.note?.toLowerCase().includes('extract')) || 
                                       tx.type === 'euro_extraction' || 
                                       tx.type === 'dzd_extraction' ||
                                       (tx.type === 'bonus' && tx.note?.toLowerCase().includes('extraction'));

                  if (isExtraction) {
                    amtStyle += 'text-orange-600';
                    amtSign = '+';
                  } else if (tx.type === 'payment') {
                    amtStyle += 'text-emerald-700';
                    amtSign = '+';
                  } else if (tx.type === 'bonus') {
                    amtStyle += 'text-blue-600';
                    amtSign = '+';
                  } else if (tx.type === 'instant_profit') {
                    const val = Number(tx.amount);
                    if (val > 0) {
                      amtStyle += 'text-emerald-700';
                      amtSign = '+';
                    } else {
                      amtStyle += 'text-rose-600';
                      amtSign = '-';
                    }
                  } else {
                    amtStyle += 'text-rose-600';
                    amtSign = '+';
                  }

                  let displayAmount = formatDZD(Math.abs(Number(tx.amount)));
                  if (tx.type === 'euro_extraction') {
                    displayAmount = `€${Number(tx.euro_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
                  }

                  let displayType = typeLabels[tx.type];
                  if (tx.type === 'instant_profit' || tx.type === 'euro_extraction' || tx.type === 'dzd_extraction') {
                    if (isExtraction) {
                      displayType = t('statsTable.moneyExtracted');
                    }
                  }
                  if (tx.type === 'payment') {
                    if (tx.destination === 'recurring_debt') {
                      displayType = '💵 Paiement de Dette loyer';
                    } else {
                      displayType = '💵 Paiement de Dette service';
                    }
                  }
                  const displayResident = isExtraction
                    ? t('statsTable.adminGlobal')
                    : (tx.girl_id ? (girlNamesMap[tx.girl_id] || t('statsTable.tableResident')) : 'N/A (Ad-hoc)');

                  return (
                    <tr key={tx.id} className="hover:bg-pink-50/20 transition">
                      <td className="py-4 px-6 text-zinc-500">{formatDate(tx.transaction_date)}</td>
                      {showGirlColumn && (
                        <td className="py-4 px-6 font-semibold text-zinc-800">
                          {displayResident}
                        </td>
                      )}
                      <td className="py-4 px-6 font-medium capitalize text-zinc-700">
                        {displayType}
                      </td>
                      <td className={`py-4 px-6 ${amtStyle}`}>
                        {amtSign}{displayAmount}
                      </td>
                      <td className="py-4 px-6 text-zinc-600 font-normal max-w-xs truncate" title={tx.note ? tx.note.replace('Purchased:', `${t('common.credited')}:`).replace('Crediée:', `${t('common.credited')}:`) : ''}>
                        {tx.note ? tx.note.replace('Purchased:', `${t('common.credited')}:`).replace('Crediée:', `${t('common.credited')}:`) : '—'}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => handleUndo(tx.id)}
                          disabled={undoingId === tx.id}
                          className="text-zinc-400 hover:text-rose-500 transition disabled:opacity-50"
                          title={t('common.undo') || 'Undo'}
                        >
                          {undoingId === tx.id ? '⏳' : '↩️'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
