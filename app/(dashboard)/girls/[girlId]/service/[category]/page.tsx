import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import ProfileHeader from '@/components/girl/ProfileHeader';

interface CategoryPageProps {
  params: Promise<{
    girlId: string;
    category: string;
  }>;
}

export default async function CategorySelectionPage({ params }: CategoryPageProps) {
  const [{ girlId, category: categoryName }, supabase] = await Promise.all([params, createClient()]);

  // Fetch resident profile and target category in parallel
  const [
    { data: girl },
    { data: category }
  ] = await Promise.all([
    supabase
      .from('girl_balances')
      .select('*')
      .eq('girl_id', girlId)
      .single(),
    supabase
      .from('service_categories')
      .select('*')
      .eq('name', categoryName.toLowerCase())
      .single()
  ]);

  if (!category) {
    notFound();
  }

  // 3. Fetch subcategories
  let { data: subcategories } = await supabase
    .from('service_subcategories')
    .select('*')
    .eq('category_id', category.id)
    .order('position', { ascending: true });

  // Self-healing database mechanism:
  // If no subcategories exist in the DB for this category, auto-create a default one.
  if (!subcategories || subcategories.length === 0) {
    const { data: newSub, error: insertError } = await supabase
      .from('service_subcategories')
      .insert({
        category_id: category.id,
        name: category.name, // e.g. 'cigarettes'
        position: 0,
      })
      .select()
      .single();

    if (insertError || !newSub) {
      console.error('Error auto-creating subcategory:', insertError);
      return (
        <div className="p-6 text-center text-rose-600 bg-rose-50 border border-rose-200 rounded-3xl">
          Error initializing service subcategory. Check logs.
        </div>
      );
    }

    // Redirect directly to checkout for the newly created subcategory
    redirect(`/girls/${girlId}/service/${categoryName}/${newSub.id}`);
  }

  // If there is exactly 1 subcategory, skip selection and go directly to item checkout
  if (subcategories.length === 1) {
    redirect(`/girls/${girlId}/service/${categoryName}/${subcategories[0].id}`);
  }

  // Otherwise, show selection grid for multiple subcategories (e.g. buffet -> soups, plates)
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <ProfileHeader girl={girl} />
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-950 capitalize">{categoryName} Subcategories</h2>
            <p className="text-xs text-zinc-500 mt-1">Select a subcategory to load products.</p>
          </div>
          <Link
            href={`/girls/${girlId}/service`}
            className="text-xs font-semibold text-pink-600 hover:text-pink-700 transition"
          >
            ← Back to Categories
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subcategories.map((sub) => (
            <Link
              key={sub.id}
              href={`/girls/${girlId}/service/${categoryName}/${sub.id}`}
              className="flex items-center justify-between rounded-3xl border border-pink-100 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-md hover:border-pink-200"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl select-none">{sub.icon || '📁'}</span>
                <span className="font-semibold text-zinc-800 capitalize">{sub.name}</span>
              </div>
              <span className="text-zinc-400 font-bold">➔</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
