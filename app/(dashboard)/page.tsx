import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import GirlCardList from '@/components/dashboard/GirlCardList';
import DashboardTitle from '@/components/dashboard/DashboardTitle';

export default function DashboardPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <DashboardTitle />

      <Suspense fallback={
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-52 bg-white/50 animate-pulse rounded-[1.75rem] border border-pink-100/50" />
          ))}
        </div>
      }>
        <GirlListLoader />
      </Suspense>
    </div>
  );
}

async function GirlListLoader() {
  const supabase = await createClient();

  const { data: girls, error } = await supabase
    .from('girl_balances')
    .select('*')
    .order('position', { ascending: true });

  if (error) {
    console.error('Error loading resident balances:', error);
  }

  return <GirlCardList girls={girls || []} />;
}
