'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface MarketInputData {
  item_id?: string; // If selecting existing item
  name?: string;    // If creating new item
  image_url?: string;
  category_id?: string;
  subcategory_id?: string;
  min_stock_alert?: number | null;
  
  quantity: number;
  unit_buy_price: number;
  unit_sell_price: number;
  shopping_date: string;
  
  item_type?: 'raw_material' | 'finished';
  unit?: string;
}

/**
 * ADD MARKET INPUT: Logs a grocery/inventory restock.
 * 
 * EFFECT: 
 * 1. Creates item if it doesn't exist.
 * 2. Updates item stock_quantity and prices.
 * 3. Logs purchase to market_inputs.
 * 4. Logs a global market_expense transaction to update Financial Overview.
 */
export async function addMarketInput(data: MarketInputData) {
  try {
    if (data.quantity <= 0) return { error: 'Quantity must be greater than zero' };
    if (data.unit_buy_price < 0) return { error: 'Buy price cannot be negative' };
    if (!data.shopping_date) return { error: 'Shopping date is required' };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    let finalItemId = data.item_id;

    // 1. Create item if not exists
    if (!finalItemId) {
      if (!data.name) return { error: 'Item name is required for new products' };
      
      const { data: newItem, error: itemError } = await supabase
        .from('items')
        .insert({
          profile_id: user.id,
          name: data.name,
          subcategory_id: data.subcategory_id || null,
          image_url: data.image_url || null,
          item_type: data.item_type || 'finished',
          unit: data.unit || 'unit',
          cost_price: data.unit_buy_price,
          sell_price: data.unit_sell_price,
          stock_quantity: 0, // Will be incremented below
          is_active: true,
          min_stock_alert: data.min_stock_alert !== undefined ? data.min_stock_alert : null
        })
        .select('id')
        .single();
        
      if (itemError) return { error: `Failed to create item: ${itemError.message}` };
      finalItemId = newItem.id;
    }

    if (!finalItemId) return { error: 'Failed to resolve item ID' };

    // 2. Fetch current item state to update stock
    const { data: currentItem, error: fetchError } = await supabase
      .from('items')
      .select('stock_quantity, min_stock_alert')
      .eq('id', finalItemId)
      .single();
      
    if (fetchError) return { error: `Failed to fetch item details: ${fetchError.message}` };

    const newStock = Number(currentItem.stock_quantity) + Number(data.quantity);
    const alertThreshold = Number(currentItem.min_stock_alert) || 0;

    // 3. Update Item prices and stock
    const { error: updateError } = await supabase
      .from('items')
      .update({
        cost_price: data.unit_buy_price,
        sell_price: data.unit_sell_price,
        stock_quantity: newStock
      })
      .eq('id', finalItemId);

    if (updateError) return { error: `Failed to update item: ${updateError.message}` };

    // Clear any Needs stock alerts if the stock is now above the threshold
    if (newStock > alertThreshold) {
      await supabase
        .from('needs')
        .delete()
        .eq('item_id', finalItemId)
        .eq('type', 'stock_alert');
    }

    const totalWorth = data.quantity * data.unit_buy_price;

    // 4. Insert into market_inputs
    const { error: marketError } = await supabase
      .from('market_inputs')
      .insert({
        profile_id: user.id,
        item_id: finalItemId,
        quantity: data.quantity,
        unit_buy_price: data.unit_buy_price,
        unit_sell_price: data.unit_sell_price,
        total_worth: totalWorth,
        shopping_date: data.shopping_date
      });

    if (marketError) return { error: `Failed to log market input: ${marketError.message}` };

    // 5. Insert global financial expense (market_expense type)
    if (totalWorth > 0) {
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          profile_id: user.id,
          type: 'market_expense',
          amount: -totalWorth,
          note: `[MARKET_STOCK] Purchase of ${data.quantity} units`,
          transaction_date: data.shopping_date
        });
        
      if (txError) {
        console.error('Failed to log transaction but market input succeeded:', txError);
      }
    }

    revalidatePath('/stock');
    revalidatePath('/statistics');
    revalidatePath('/', 'layout');
    
    return { success: true };
  } catch (err: any) {
    console.error('Error adding market input:', err);
    return { error: err.message || 'Something went wrong' };
  }
}

/**
 * Fetch all market data required for the Market Stock Dashboard/Modal
 */
export async function getMarketStockData() {
  const supabase = await createClient();

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
      .select('*, items(name)')
      .order('shopping_date', { ascending: false }),
    supabase.from('recipes').select('*, finished_product:items(*)'),
    supabase.from('recipe_ingredients').select('*, raw_material:items(*)')
  ]);

  return {
    items: items || [],
    categories: categories || [],
    subcategories: subcategories || [],
    marketInputs: marketInputs || [],
    recipes: recipes || [],
    recipeIngredients: recipeIngredients || []
  };
}

/**
 * UPDATE ITEM: Updates an existing item's core properties directly.
 */
export async function updateItem(itemId: string, data: { name: string, cost_price: number, sell_price: number, stock_quantity: number, min_stock_alert?: number | null }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase
      .from('items')
      .update({
        name: data.name,
        cost_price: data.cost_price,
        sell_price: data.sell_price,
        stock_quantity: data.stock_quantity,
        min_stock_alert: data.min_stock_alert !== undefined ? data.min_stock_alert : null
      })
      .eq('id', itemId)
      ;

    if (error) return { error: `Failed to update item: ${error.message}` };

    revalidatePath('/stock');
    revalidatePath('/statistics');
    revalidatePath('/', 'layout');
    
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Something went wrong' };
  }
}

/**
 * DELETE ITEM: Soft-deletes an item so it no longer appears in stores or stock.
 */
export async function deleteItem(itemId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase
      .from('items')
      .update({ is_active: false })
      .eq('id', itemId)
      ;

    if (error) return { error: `Failed to delete item: ${error.message}` };

    revalidatePath('/stock');
    revalidatePath('/statistics');
    revalidatePath('/', 'layout');
    
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Something went wrong' };
  }
}

/**
 * DELETE MARKET INPUT: Reverses a purchase by deleting the input, adjusting stock, and removing the global transaction.
 */
export async function deleteMarketInput(inputId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    // 1. Fetch input details
    const { data: input, error: fetchError } = await supabase
      .from('market_inputs')
      .select('*')
      .eq('id', inputId)
      
      .single();
      
    if (fetchError || !input) return { error: 'Market input not found' };

    // 2. Adjust item stock
    const { data: item } = await supabase
      .from('items')
      .select('stock_quantity')
      .eq('id', input.item_id)
      .single();
      
    if (item) {
      const newStock = Math.max(0, Number(item.stock_quantity) - Number(input.quantity));
      await supabase
        .from('items')
        .update({ stock_quantity: newStock })
        .eq('id', input.item_id);
    }

    // 3. Delete associated transaction if total worth was > 0
    if (input.total_worth > 0) {
      await supabase
        .from('transactions')
        .delete()
        
        .eq('type', 'market_expense')
        .eq('amount', -input.total_worth)
        .eq('transaction_date', input.shopping_date);
    }

    // 4. Delete the market input row
    const { error: deleteError } = await supabase
      .from('market_inputs')
      .delete()
      .eq('id', inputId);

    if (deleteError) return { error: `Failed to delete input: ${deleteError.message}` };

    revalidatePath('/stock');
    revalidatePath('/statistics');
    revalidatePath('/', 'layout');
    
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Something went wrong' };
  }
}
