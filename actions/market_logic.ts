'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface MarketInputData {
  item_id?: string; // If selecting existing item
  name?: string;    // If creating new item
  image_url?: string;
  category_id?: string;
  subcategory_id?: string;
  
  quantity: number;
  unit_buy_price: number;
  unit_sell_price: number;
  shopping_date: string;
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
          cost_price: data.unit_buy_price,
          sell_price: data.unit_sell_price,
          stock_quantity: 0, // Will be incremented below
          is_active: true
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
      .select('stock_quantity')
      .eq('id', finalItemId)
      .single();
      
    if (fetchError) return { error: `Failed to fetch item details: ${fetchError.message}` };

    const newStock = Number(currentItem.stock_quantity) + Number(data.quantity);

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
