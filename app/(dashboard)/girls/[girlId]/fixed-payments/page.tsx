import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import ProfileHeader from '@/components/girl/ProfileHeader';
import FixedPaymentForm from '@/components/forms/FixedPaymentForm';

interface SubPageProps {
  params: Promise<{
    girlId: string;
  }>;
}

export default async function FixedPaymentsPage({ params }: SubPageProps) {
  const [{ girlId }, supabase] = await Promise.all([params, createClient()]);

  // Fetch girl profile and templates in parallel
  const [
    { data: girl },
    { data: templates }
  ] = await Promise.all([
    supabase
      .from('girl_balances')
      .select('*')
      .eq('girl_id', girlId)
      .single(),
    supabase
      .from('fixed_payment_templates')
      .select('*')
      .eq('girl_id', girlId)
  ]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <ProfileHeader girl={girl} />
      
      <div className="max-w-3xl mx-auto">
        <FixedPaymentForm girlId={girlId} templates={templates || []} />
      </div>
    </div>
  );
}
