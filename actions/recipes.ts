'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function addRecipe(
  finishedProductId: string | 'new',
  batchQuantity: number,
  ingredients: { raw_material_id: string; quantity_needed: number }[],
  newProductData?: {
    name: string;
    category_id?: string;
    subcategory_id?: string;
    sell_price: number;
    unit?: string;
  }
) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    let targetProductId = finishedProductId;

    if (finishedProductId === 'new' && newProductData) {
      if (!newProductData.name || newProductData.sell_price < 0) {
        return { error: 'Invalid new product data' };
      }

      const { data: newProduct, error: createError } = await supabase
        .from('items')
        .insert({
          profile_id: user.id,
          name: newProductData.name,
          subcategory_id: newProductData.subcategory_id || null,
          item_type: 'finished',
          unit: newProductData.unit || 'unit',
          cost_price: 0,
          sell_price: newProductData.sell_price,
          stock_quantity: 0,
          is_active: true
        })
        .select('id')
        .single();

      if (createError) return { error: `Failed to create product: ${createError.message}` };
      targetProductId = newProduct.id;
    } else {
      // 1. Check if recipe already exists for this existing finished product
      const { data: existing } = await supabase
        .from('recipes')
        .select('id')
        .eq('finished_product_id', targetProductId)
        .single();

      if (existing) {
        return { error: 'Recipe already exists for this product. Delete it first to replace it.' };
      }
    }

    // 2. Insert recipe
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .insert({
        finished_product_id: targetProductId,
        profile_id: user.id,
        batch_quantity: batchQuantity
      })
      .select()
      .single();

    if (recipeError) return { error: recipeError.message };

    // 3. Insert ingredients
    const ingredientsToInsert = ingredients.map(ing => ({
      recipe_id: recipe.id,
      raw_material_id: ing.raw_material_id,
      quantity_needed: ing.quantity_needed
    }));

    const { error: ingredientsError } = await supabase
      .from('recipe_ingredients')
      .insert(ingredientsToInsert);

    if (ingredientsError) {
      // rollback manually if needed, but RLS and cascade might help if we delete
      await supabase.from('recipes').delete().eq('id', recipe.id);
      return { error: ingredientsError.message };
    }

    revalidatePath('/stock');
    return { data: recipe };
  } catch (err: any) {
    return { error: err.message || 'Something went wrong' };
  }
}

export async function deleteRecipe(recipeId: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('recipes').delete().eq('id', recipeId);
    if (error) return { error: error.message };
    
    revalidatePath('/stock');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Something went wrong' };
  }
}

export async function produceRecipe(recipeId: string, batches: number) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    if (batches <= 0) return { error: 'Batches must be greater than zero' };

    // Call the RPC we created
    const { data, error } = await supabase.rpc('produce_recipe', {
      p_recipe_id: recipeId,
      p_batches: batches
    });

    if (error) {
      return { error: error.message };
    }

    revalidatePath('/stock');
    return { success: true, total_cost: data?.total_cost };
  } catch (err: any) {
    return { error: err.message || 'Something went wrong' };
  }
}
