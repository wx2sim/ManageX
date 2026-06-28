import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ProfileHeader from '@/components/girl/ProfileHeader';
import ItemList from '@/components/service/ItemList';

interface ItemsPageProps {
  params: Promise<{
    girlId: string;
    category: string;
    subCategory: string; // This is the subcategory UUID
  }>;
}

export default async function ItemsCheckoutPage({ params }: ItemsPageProps) {
  const [{ girlId, category: categoryName, subCategory: subcategoryId }, supabase] = await Promise.all([params, createClient()]);

  // Fetch all required data in parallel
  const [
    { data: girl },
    { data: subcategory },
    { data: items }
  ] = await Promise.all([
    supabase
      .from('girl_balances')
      .select('*')
      .eq('girl_id', girlId)
      .single(),
    supabase
      .from('service_subcategories')
      .select('*')
      .eq('id', subcategoryId)
      .single(),
    supabase
      .from('items')
      .select('*')
      .eq('subcategory_id', subcategoryId)
      .order('name', { ascending: true })
  ]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <ProfileHeader girl={girl} />
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-950 capitalize">
              Checkout: {categoryName.replace('_', ' ')} / {subcategory.name}
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              Select product quantities and confirm checkout to bill the resident's account.
            </p>
          </div>
          <Link
            href={`/girls/${girlId}/service`}
            className="text-xs font-semibold text-pink-600 hover:text-pink-700 transition"
          >
            ← Back to Categories
          </Link>
        </div>

        {/* Item List cart checkout manager */}
        <ItemList 
          girlId={girlId} 
          subcategoryId={subcategoryId} 
          items={items || []} 
        />
      </div>
    </div>
  );
}
