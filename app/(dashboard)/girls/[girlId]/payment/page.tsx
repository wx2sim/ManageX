import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import ProfileHeader from '@/components/girl/ProfileHeader';
import PaymentForm from '@/components/forms/PaymentForm';

interface SubPageProps {
  params: Promise<{
    girlId: string;
  }>;
}

export default async function PaymentPage({ params }: SubPageProps) {
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
        <PaymentForm girlId={girlId} />
      </div>
    </div>
  );
}
