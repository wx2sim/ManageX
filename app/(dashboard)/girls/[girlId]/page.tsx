import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import GirlProfileClientView from '@/components/girl/GirlProfileClientView';

interface GirlPageProps {
  params: Promise<{
    girlId: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function GirlDetailPage({ params, searchParams }: GirlPageProps) {
  const resolvedSearchParams = await searchParams;
  const initialTab = typeof resolvedSearchParams.tab === 'string' ? resolvedSearchParams.tab : 'overview';

  return (
    <Suspense fallback={
      <div className="space-y-8 animate-in fade-in duration-300">
        <div className="h-32 bg-white/50 animate-pulse rounded-[2rem] border border-pink-100" />
        <div className="h-16 bg-white/50 animate-pulse rounded-[1rem] border border-pink-100" />
        <div className="h-96 bg-white/50 animate-pulse rounded-[2rem] border border-pink-100" />
      </div>
    }>
      <GirlProfileDataLoader params={params} initialTab={initialTab} />
    </Suspense>
  );
}

async function GirlProfileDataLoader({ params, initialTab }: { params: GirlPageProps['params'], initialTab: string }) {
  const [{ girlId }, supabase] = await Promise.all([params, createClient()]);

  const [
    { data: girl, error: girlError },
    { data: recentTransactions },
    { data: allTransactionsRaw },
    { data: categories },
    { data: subcategories },
    { data: items },
    { data: templates },
    { data: activeDemands },
    { data: itemsData }
  ] = await Promise.all([
    supabase.from('girl_balances').select('*').eq('girl_id', girlId).single(),
    supabase.from('transactions').select('*').eq('girl_id', girlId).order('transaction_date', { ascending: false }).limit(5),
    supabase.from('transactions').select('*').eq('girl_id', girlId).order('transaction_date', { ascending: false }),
    supabase.from('service_categories').select('*').order('position', { ascending: true }),
    supabase.from('service_subcategories').select('*').order('position', { ascending: true }),
    supabase.from('items').select('*').order('name', { ascending: true }),
    supabase.from('fixed_payment_templates').select('*').eq('girl_id', girlId).order('name', { ascending: true }),
    supabase.from('needs').select('*').eq('girl_id', girlId).eq('is_completed', false).order('created_at', { ascending: false }),
    supabase.from('transaction_items').select('quantity, unit_sell_price, unit_cost_price, transactions!inner(girls!inner(account_type))')
  ]);

  if (girlError || !girl) {
    notFound();
  }

  let allTransactions = allTransactionsRaw || [];
  let salesProfit = 0;
  let globalDzdRent = 0;
  let globalEuroRent = 0;
  let adminExpenses = 0;

  if (girl.account_type === 'admin') {
    if (itemsData) {
      for (const item of (itemsData as any || [])) {
        const girlAccountType = item.transactions?.girls?.account_type;
        if (girlAccountType !== 'admin') {
          salesProfit += item.quantity * (item.unit_sell_price - item.unit_cost_price);
        }
      }
    }

    const { data: rentPayments } = await supabase
      .from('transactions')
      .select('amount, euro_amount, currency')
      .eq('type', 'payment')
      .eq('destination', 'recurring_debt');

    for (const pay of (rentPayments || [])) {
      if (pay.currency === 'euro') {
        globalEuroRent += Number(pay.euro_amount || 0);
      } else {
        globalDzdRent += Math.abs(Number(pay.amount || 0));
      }
    }

    adminExpenses = allTransactions
      .filter((tx: any) => tx.type === 'market_expense')
      .reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);

    // Fetch all vault extractions from all residents to show in admin's Journaux Financiers
    const { data: globalExtractions } = await supabase
      .from('transactions')
      .select('*')
      .in('type', ['euro_extraction', 'dzd_extraction'])
      .neq('girl_id', girlId)
      .order('transaction_date', { ascending: false });

    if (globalExtractions && globalExtractions.length > 0) {
      allTransactions = [...allTransactions, ...globalExtractions]
        .sort((a: any, b: any) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
    }
  }

  return (
    <GirlProfileClientView 
      girl={girl} 
      recentTransactions={recentTransactions || []}
      allTransactions={allTransactions}
      categories={categories || []}
      subcategories={subcategories || []}
      items={items || []}
      templates={templates || []}
      initialTab={initialTab}
      activeDemands={activeDemands || []}
      salesProfit={salesProfit}
      globalDzdRent={globalDzdRent}
      globalEuroRent={globalEuroRent}
      adminExpenses={adminExpenses}
    />
  );
}
