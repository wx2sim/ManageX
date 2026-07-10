'use client';

import { useState } from 'react';
import { ServiceCategory, ServiceSubcategory, Item, Transaction, GirlBalance, FixedPaymentTemplate } from '@/lib/types';
import ProfileHeader from './ProfileHeader';
import { useTranslation } from '@/lib/i18n/useTranslation';

// Import Tabs
import OverviewTab from './tabs/OverviewTab';
import ServiceTab from './tabs/ServiceTab';
import PaymentTab from './tabs/PaymentTab';
import BonusTab from './tabs/BonusTab';
import DutiesTab from './tabs/DutiesTab';
import RecurringTab from './tabs/RecurringTab';
import StatsTab from './tabs/StatsTab';
import SettingsTab from './tabs/SettingsTab';
import AdminProfitTab from './tabs/AdminProfitTab';

export type TabType = 'overview' | 'service' | 'payment' | 'bonus' | 'duties' | 'recurring' | 'stats' | 'settings';

interface Props {
  girl: GirlBalance;
  recentTransactions: Transaction[];
  allTransactions: Transaction[];
  categories: ServiceCategory[];
  subcategories: ServiceSubcategory[];
  items: Item[];
  templates: FixedPaymentTemplate[];
  initialTab?: string;
  activeDemands: any[];
  salesProfit?: number;
  globalDzdRent?: number;
  globalEuroRent?: number;
  adminExpenses?: number;
}

export default function GirlProfileClientView({
  girl,
  recentTransactions,
  allTransactions,
  categories,
  subcategories,
  items,
  templates,
  initialTab = 'overview',
  activeDemands,
  salesProfit = 0,
  globalDzdRent = 0,
  globalEuroRent = 0,
  adminExpenses = 0,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab as TabType);

  const { t } = useTranslation();

  const isAdmin = girl.account_type === 'admin';

  const tabs = isAdmin
    ? [
        { id: 'overview', label: t('tabs.overview') || 'Aperçu', icon: '📝' },
        { id: 'service', label: t('tabs.service') || 'Service', icon: '🛒' },
        { id: 'payment', label: t('tabs.bilan') || 'Bilan (Profit & Expenses)', icon: '💵' },
        { id: 'stats', label: t('tabs.stats') || 'Statistiques', icon: '📊' },
        { id: 'settings', label: t('tabs.settings') || 'Paramètres', icon: '🔧' },
      ]
    : [
        { id: 'overview', label: t('tabs.overview') || 'Aperçu', icon: '📝' },
        { id: 'service', label: t('tabs.service') || 'Service', icon: '🛒' },
        { id: 'payment', label: t('tabs.payment') || 'Paiement', icon: '💵' },
        { id: 'bonus', label: t('tabs.bonus') || 'Bonus', icon: '🎁' },
        { id: 'duties', label: t('tabs.duties') || 'Charges', icon: '⚠️' },
        { id: 'recurring', label: t('tabs.recurring') || 'Récurrent', icon: '⚙️' },
        { id: 'stats', label: t('tabs.stats') || 'Statistiques', icon: '📊' },
        { id: 'settings', label: t('tabs.settings') || 'Paramètres', icon: '🔧' },
      ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <ProfileHeader 
        girl={girl} 
        salesProfit={salesProfit}
        globalDzdRent={globalDzdRent}
        globalEuroRent={globalEuroRent}
        adminExpenses={adminExpenses}
      />

      {/* Modern Navigation Bar */}
      <div className="sticky top-[73px] z-30 -mx-4 px-4 py-2 bg-white/80 backdrop-blur-xl border-b border-pink-100 sm:mx-0 sm:px-0 sm:bg-transparent sm:backdrop-blur-none sm:border-0 sm:static">
        <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2 sm:pb-0 sm:flex-wrap">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl whitespace-nowrap text-sm font-semibold transition-all duration-200 ${isActive
                  ? 'bg-pink-600 text-white shadow-md shadow-pink-500/20 scale-105'
                  : 'bg-white text-zinc-600 hover:bg-pink-50 hover:text-pink-700 border border-pink-100'
                  }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Area */}
      <div className="min-h-[500px]">
        {activeTab === 'overview' && (
          <OverviewTab
            girlId={girl.girl_id}
            girl={girl}
            recentTransactions={recentTransactions}
            onChangeTab={setActiveTab}
            activeDemands={activeDemands}
          />
        )}
        {activeTab === 'service' && (
          <ServiceTab
            girlId={girl.girl_id}
            categories={categories}
            subcategories={subcategories}
            items={items}
            girl={girl}
          />
        )}
        {activeTab === 'payment' && (
          isAdmin 
            ? <AdminProfitTab girlId={girl.girl_id} girl={girl} /> 
            : <PaymentTab girlId={girl.girl_id} />
        )}
        {activeTab === 'bonus' && !isAdmin && <BonusTab girlId={girl.girl_id} />}
        {activeTab === 'duties' && !isAdmin && <DutiesTab girlId={girl.girl_id} />}
        {activeTab === 'recurring' && !isAdmin && <RecurringTab girlId={girl.girl_id} templates={templates} />}
        {activeTab === 'stats' && <StatsTab transactions={allTransactions} girlId={girl.girl_id} girl={girl} />}
        {activeTab === 'settings' && <SettingsTab girl={girl} />}
      </div>
    </div>
  );
}
