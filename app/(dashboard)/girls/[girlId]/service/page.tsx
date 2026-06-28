import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import ProfileHeader from '@/components/girl/ProfileHeader';
import CategoryGrid from '@/components/service/CategoryGrid';

interface ServicePageProps {
  params: Promise<{
    girlId: string;
  }>;
}

export default async function ServiceSelectionPage({ params }: ServicePageProps) {
  const [{ girlId }, supabase] = await Promise.all([params, createClient()]);

  // Fetch resident profile and service categories in parallel
  const [
    { data: girl },
    { data: categories }
  ] = await Promise.all([
    supabase
      .from('girl_balances')
      .select('*')
      .eq('girl_id', girlId)
      .single(),
    supabase
      .from('service_categories')
      .select('*')
      .order('position', { ascending: true })
  ]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <ProfileHeader girl={girl} />
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-950">Service Categories</h2>
          <p className="text-xs text-zinc-500 mt-1">Select a category to view items or checkout purchases for this resident.</p>
        </div>

        <CategoryGrid girlId={girlId} categories={categories || []} />
      </div>
    </div>
  );
}
