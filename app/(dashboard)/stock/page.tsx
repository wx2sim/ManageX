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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-emerald-600 font-bold font-sans">Inventory & Purchases</p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-950 mt-1">Market Stock</h1>
        <p className="text-xs text-zinc-500 mt-1">
          Log wholesale grocery purchases, track inventory costs, and manage house supplies.
        </p>
      </div>

      <MarketStockClient 
        items={items || []} 
        categories={categories || []} 
        subcategories={subcategories || []} 
        marketInputs={marketInputs || []} 
        recipes={recipes || []}
        recipeIngredients={recipeIngredients || []}
      />
    </div>
  );
}
