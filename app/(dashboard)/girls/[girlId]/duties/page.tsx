import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import ProfileHeader from '@/components/girl/ProfileHeader';
import DutyForm from '@/components/forms/DutyForm';

interface SubPageProps {
  params: Promise<{
    girlId: string;
  }>;
}

export default async function DutiesPage({ params }: SubPageProps) {
  const [{ girlId }, supabase] = await Promise.all([params, createClient()]);

  const { data: girl } = await supabase
    .from('girl_balances')
    .select('*')
    .eq('girl_id', girlId)
    .single();

  if (!girl) {
    notFound();
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <ProfileHeader girl={girl} />
      
      <div className="max-w-xl mx-auto">
        <DutyForm girlId={girlId} />
      </div>
    </div>
  );
}
