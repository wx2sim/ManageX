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
    { data: allTransactions },
    { data: categories },
    { data: subcategories },
    { data: items },
    { data: templates }
  ] = await Promise.all([
    supabase.from('girl_balances').select('*').eq('girl_id', girlId).single(),
    supabase.from('transactions').select('*').eq('girl_id', girlId).order('transaction_date', { ascending: false }).limit(5),
    supabase.from('transactions').select('*').eq('girl_id', girlId).order('transaction_date', { ascending: false }),
    supabase.from('service_categories').select('*').order('position', { ascending: true }),
    supabase.from('service_subcategories').select('*').order('position', { ascending: true }),
    supabase.from('items').select('*').order('name', { ascending: true }),
    supabase.from('fixed_payment_templates').select('*').eq('girl_id', girlId).order('name', { ascending: true })
  ]);

  if (girlError || !girl) {
    notFound();
  }

  return (
    <GirlProfileClientView 
      girl={girl} 
      recentTransactions={recentTransactions || []}
      allTransactions={allTransactions || []}
      categories={categories || []}
      subcategories={subcategories || []}
      items={items || []}
      templates={templates || []}
      initialTab={initialTab}
    />
  );
}
