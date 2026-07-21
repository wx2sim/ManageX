import { createClient } from '@/lib/supabase/server';
import MarketStockClient from '@/components/market/MarketStockClient';

export default async function MarketStockPage() {
  const supabase = await createClient();

  // Load everything needed for the Market Stock Dashboard
  const [
    { data: items },
    { data: categories },
    { data: subcategories },
    { data: marketInputs },
    { data: recipes },
    { data: recipeIngredients }
  ] = await Promise.all([
    supabase.from('items').select('*').order('name', { ascending: true }),
    supabase.from('service_categories').select('*').order('position', { ascending: true }),
    supabase.from('service_subcategories').select('*').order('position', { ascending: true }),
    supabase.from('market_inputs')
      .select('*, items(name, stock_quantity)')
      .order('shopping_date', { ascending: false }),
    supabase.from('recipes').select('*, finished_product:items(*)'),
    supabase.from('recipe_ingredients').select('*, raw_material:items(*)')
  ]);

  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <MarketStockClient 
        items={items || []} 
        categories={categories || []} 
        subcategories={subcategories || []} 
        marketInputs={marketInputs || []} 
        recipes={recipes || []}
        recipeIngredients={recipeIngredients || []}
        profileId={user?.id || ''}
      />
    </div>
  );
}
