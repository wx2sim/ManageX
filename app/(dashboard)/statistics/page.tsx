import { createClient } from '@/lib/supabase/server';
import StatsTable from '@/components/stats/StatsTable';

export default async function GlobalStatisticsPage() {
  const supabase = await createClient();

  // Fetch all transactions and girls in parallel
  const [
    { data: transactions },
    { data: girls }
  ] = await Promise.all([
    supabase
      .from('transactions')
      .select('*')
      .order('transaction_date', { ascending: false }),
    supabase
      .from('girls')
      .select('id, name')
  ]);

  // Convert array to mapping dictionary
  const girlNamesMap: Record<string, string> = {};
  if (girls) {
    girls.forEach((girl) => {
      girlNamesMap[girl.id] = girl.name;
    });
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-pink-600 font-bold font-sans">Business Analytics</p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-950 mt-1">Financial Overview</h1>
        <p className="text-xs text-zinc-500 mt-1">
          Consolidated logs and profit breakdowns for all active and archived residents.
        </p>
      </div>

      <StatsTable 
        transactions={transactions || []} 
        showGirlColumn={true} 
        girlNamesMap={girlNamesMap} 
      />
    </div>
  );
}
