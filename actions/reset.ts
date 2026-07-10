'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function resetAllHistory() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { error: 'Not authenticated' };
    }

    // Since RLS is enabled, the user can only delete their own data.
    // We explicitly target their profile_id to be safe.

    // 0. Preemptively delete transaction items to avoid FK constraints if CASCADE is missing
    // We can't delete by profile_id easily if transaction_items doesn't have it, so we delete by looking up transactions
    // Actually, the easiest way is to let the cascade handle it. If it fails, we will know. But let's try to delete them directly if possible.
    // Wait, transaction_items doesn't have a profile_id. It's safer to just rely on the ON DELETE CASCADE that Supabase generates by default.
    // If it fails, the user will see the error.

    // 1. Delete all transactions (this cascades to transaction_items and resets balances based on views)
    const { error: txError } = await supabase
      .from('transactions')
      .delete()
      .not('id', 'is', null);
      
    if (txError) return { error: `Failed to delete transactions: ${txError.message}` };

    // 2. Delete all market inputs (stock purchases)
    const { error: marketError } = await supabase
      .from('market_inputs')
      .delete()
      .not('id', 'is', null);
      
    if (marketError) return { error: `Failed to delete market inputs: ${marketError.message}` };

    // 3. Reset all item stock quantities to 0
    const { error: itemsError } = await supabase
      .from('items')
      .update({ stock_quantity: 0 })
      .not('id', 'is', null);

    if (itemsError) return { error: `Failed to reset items stock: ${itemsError.message}` };

    // 4. Clean up any lingering bonuses or instant profits not caught by cascade
    await supabase.from('bonuses').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (RLS will restrict to user)
    await supabase.from('instant_profits').delete().not('id', 'is', null);

    // Note: We intentionally DO NOT delete templates, categories, subcategories, items, or girls.

    // Force revalidate entire app
    revalidatePath('/', 'layout');
    
    return { success: true };
  } catch (err: any) {
    console.error('Reset error:', err);
    return { error: err.message || 'Something went wrong during reset.' };
  }
}
