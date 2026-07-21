import { createClient } from '@/lib/supabase/server';
import ScannerPage from '@/components/scanner/ScannerPage';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Scanner | ManageX',
  description: 'Scan barcodes to manage stock',
};

export default async function ScannerRoute() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [
    { data: items },
    { data: categories },
    { data: subcategories },
  ] = await Promise.all([
    supabase.from('items').select('*').order('name', { ascending: true }),
    supabase.from('service_categories').select('*').order('position', { ascending: true }),
    supabase.from('service_subcategories').select('*').order('position', { ascending: true }),
  ]);

  return (
    <ScannerPage
      items={items || []}
      categories={categories || []}
      subcategories={subcategories || []}
    />
  );
}
