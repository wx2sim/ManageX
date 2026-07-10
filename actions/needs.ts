'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * ADD A NEED OR RESIDENT DEMAND
 */
export async function addNeed(
  type: 'stock_alert' | 'resident_demand',
  title: string,
  itemId?: string | null,
  girlId?: string | null
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase
      .from('needs')
      .insert({
        profile_id: user.id,
        type,
        title,
        item_id: itemId || null,
        girl_id: girlId || null,
        is_completed: false,
      });

    if (error) return { error: error.message };

    revalidatePath('/needs');
    if (girlId) {
      revalidatePath(`/girls/${girlId}`);
    }
    return { success: true };
  } catch (err: any) {
    console.error('Error adding need:', err);
    return { error: err.message || 'Something went wrong' };
  }
}

/**
 * COMPLETE RESIDENT DEMAND
 * Marks a resident demand as completed, inserts a 'service' transaction, and bills the resident.
 */
export async function completeResidentDemand(
  demandId: string,
  buyPrice: number,
  sellPrice: number
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    // 1. Fetch demand details
    const { data: demand, error: fetchErr } = await supabase
      .from('needs')
      .select('*')
      .eq('id', demandId)
      .single();

    if (fetchErr || !demand) return { error: 'Demand not found' };

    // 2. Mark the demand as completed
    const { error: updateErr } = await supabase
      .from('needs')
      .update({
        is_completed: true,
        completed_at: new Date().toISOString(),
        buy_price: buyPrice,
        sell_price: sellPrice,
      })
      .eq('id', demandId);

    if (updateErr) return { error: updateErr.message };

    // 3. Insert service transaction under the resident's account
    if (demand.girl_id) {
      const { data: txData, error: txErr } = await supabase
        .from('transactions')
        .insert({
          girl_id: demand.girl_id,
          profile_id: user.id,
          type: 'service',
          amount: sellPrice,
          note: `Crediée: ${demand.title} (Achat: ${buyPrice} DZD)`,
          transaction_date: new Date().toISOString().split('T')[0],
        })
        .select('id')
        .single();

      if (txErr) {
        console.error('Error adding transaction for completed demand:', txErr);
      } else if (txData) {
        // Insert transaction_items so profit (sell - buy) is tracked
        const { error: itemErr } = await supabase
          .from('transaction_items')
          .insert({
            transaction_id: txData.id,
            item_name: demand.title,
            quantity: 1,
            unit_sell_price: sellPrice,
            unit_cost_price: buyPrice,
          });

        if (itemErr) {
          console.error('Error adding transaction item for demand:', itemErr);
        }
      }
    }

    revalidatePath('/needs');
    if (demand.girl_id) {
      revalidatePath(`/girls/${demand.girl_id}`);
    }
    return { success: true };
  } catch (err: any) {
    console.error('Error completing resident demand:', err);
    return { error: err.message || 'Something went wrong' };
  }
}

/**
 * MARK STOCK NEED AS BOUGHT
 * Marks an out-of-stock item alert as resolved. It creates a completed needs record.
 */
export async function markStockNeedBought(itemId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    // Fetch the item's name
    const { data: item } = await supabase
      .from('items')
      .select('name')
      .eq('id', itemId)
      .single();

    if (!item) return { error: 'Item not found' };

    // Insert a completed stock alert record
    const { error } = await supabase
      .from('needs')
      .insert({
        profile_id: user.id,
        type: 'stock_alert',
        item_id: itemId,
        title: item.name,
        is_completed: true,
        completed_at: new Date().toISOString(),
      });

    if (error) return { error: error.message };

    revalidatePath('/needs');
    return { success: true };
  } catch (err: any) {
    console.error('Error marking stock need bought:', err);
    return { error: err.message || 'Something went wrong' };
  }
}

/**
 * DELETE A NEED
 */
export async function deleteNeed(needId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    // Fetch girl_id before delete to revalidate
    const { data: demand } = await supabase
      .from('needs')
      .select('girl_id')
      .eq('id', needId)
      .single();

    const { error } = await supabase
      .from('needs')
      .delete()
      .eq('id', needId);

    if (error) return { error: error.message };

    revalidatePath('/needs');
    if (demand?.girl_id) {
      revalidatePath(`/girls/${demand.girl_id}`);
    }
    return { success: true };
  } catch (err: any) {
    console.error('Error deleting need:', err);
    return { error: err.message || 'Something went wrong' };
  }
}
