'use client';

import { useState } from 'react';
import { ServiceCategory, ServiceSubcategory, Item, Transaction, GirlBalance, FixedPaymentTemplate } from '@/lib/types';
import ProfileHeader from './ProfileHeader';

// Import Tabs
import OverviewTab from './tabs/OverviewTab';
import ServiceTab from './tabs/ServiceTab';
import PaymentTab from './tabs/PaymentTab';
import BonusTab from './tabs/BonusTab';
import DutiesTab from './tabs/DutiesTab';
import RecurringTab from './tabs/RecurringTab';
import StatsTab from './tabs/StatsTab';
import SettingsTab from './tabs/SettingsTab';

export type TabType = 'overview' | 'service' | 'payment' | 'bonus' | 'duties' | 'recurring' | 'stats' | 'settings';

interface Props {
  girl: GirlBalance;
  recentTransactions: Transaction[];
  allTransactions: Transaction[];
  categories: ServiceCategory[];
  subcategories: ServiceSubcategory[];
  items: Item[];
  templates: FixedPaymentTemplate[];
}

export default function GirlProfileClientView({
  girl,
  recentTransactions,
  allTransactions,
  categories,
  subcategories,
  items,
  templates,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📝' },
    { id: 'service', label: 'Service', icon: '🛒' },
    { id: 'payment', label: 'Payment', icon: '💵' },
    { id: 'bonus', label: 'Bonus', icon: '🎁' },
    { id: 'duties', label: 'Duties', icon: '⚠️' },
    { id: 'recurring', label: 'Recurring', icon: '⚙️' },
    { id: 'stats', label: 'Stats', icon: '📊' },
    { id: 'settings', label: 'Settings', icon: '🔧' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <ProfileHeader girl={girl} />

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
            recentTransactions={recentTransactions}
            onChangeTab={setActiveTab}
          />
        )}
        {activeTab === 'service' && (
          <ServiceTab
            girlId={girl.girl_id}
            categories={categories}
            subcategories={subcategories}
            items={items}
          />
        )}
        {activeTab === 'payment' && <PaymentTab girlId={girl.girl_id} />}
        {activeTab === 'bonus' && <BonusTab girlId={girl.girl_id} />}
        {activeTab === 'duties' && <DutiesTab girlId={girl.girl_id} />}
        {activeTab === 'recurring' && <RecurringTab girlId={girl.girl_id} templates={templates} />}
        {activeTab === 'stats' && <StatsTab transactions={allTransactions} />}
        {activeTab === 'settings' && <SettingsTab girl={girl} />}
      </div>
    </div>
  );
}
