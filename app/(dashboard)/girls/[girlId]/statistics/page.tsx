import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import ProfileHeader from '@/components/girl/ProfileHeader';
import StatsTable from '@/components/stats/StatsTable';

interface SubPageProps {
  params: Promise<{
    girlId: string;
  }>;
}

export default async function GirlStatisticsPage({ params }: SubPageProps) {
  const [{ girlId }, supabase] = await Promise.all([params, createClient()]);

  const [
    { data: girl },
    { data: transactions }
  ] = await Promise.all([
    supabase
      .from('girl_balances')
      .select('*')
      .eq('girl_id', girlId)
      .single(),
    supabase
      .from('transactions')
      .select('*')
      .eq('girl_id', girlId)
      .order('transaction_date', { ascending: false })
  ]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <ProfileHeader girl={girl} />
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-950">Financial Logs</h2>
          <p className="text-xs text-zinc-500 mt-1">Detailed history of service checkout bills, cash/card collections, rewards, and penalties.</p>
        </div>
        
        <StatsTable transactions={transactions || []} />
      </div>
    </div>
  );
}
