'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function addPayment(
  girlId: string, 
  amount: number, 
  note: string,
  currency: 'dzd' | 'euro' = 'dzd',
  euroAmount: number = 0,
  exchangeRate: number = 0,
  destination: 'service_debt' | 'recurring_debt' = 'service_debt'
) {
  try {
    if (amount <= 0 && currency === 'dzd') return { error: 'Amount must be greater than zero' };
    if (euroAmount <= 0 && currency === 'euro') return { error: 'Euro amount must be greater than zero' };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase.from('transactions').insert({
      girl_id: girlId,
      profile_id: user.id,
      type: 'payment',
      amount: currency === 'euro' ? (euroAmount * exchangeRate) : amount,
      currency,
      euro_amount: euroAmount,
      exchange_rate: exchangeRate,
      destination,
      note: note || null,
      transaction_date: new Date().toISOString().split('T')[0],
    });

    if (error) return { error: error.message };

    revalidatePath('/');
    revalidatePath(`/girls/${girlId}`);
    revalidatePath(`/girls/${girlId}/statistics`);
    return { success: true };
  } catch (err: any) {
    console.error('Error adding payment:', err);
    return { error: err.message || 'Something went wrong' };
  }
}

export async function addDuty(girlId: string, amount: number, note: string) {
  try {
    if (amount <= 0) return { error: 'Amount must be greater than zero' };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase.from('transactions').insert({
      girl_id: girlId,
      profile_id: user.id,
      type: 'duty',
      amount,
      note: note || null,
      transaction_date: new Date().toISOString().split('T')[0],
    });

    if (error) return { error: error.message };

    revalidatePath('/');
    revalidatePath(`/girls/${girlId}`);
    revalidatePath(`/girls/${girlId}/statistics`);
    return { success: true };
  } catch (err: any) {
    console.error('Error adding duty:', err);
    return { error: err.message || 'Something went wrong' };
  }
}

export async function addBonus(girlId: string, amount: number, note: string) {
  try {
    if (amount <= 0) return { error: 'Amount must be greater than zero' };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { data: txData, error: txError } = await supabase
      .from('transactions')
      .insert({
        girl_id: girlId,
        profile_id: user.id,
        type: 'bonus',
        amount,
        note: note || null,
        transaction_date: new Date().toISOString().split('T')[0],
      })
      .select('id')
      .single();

    if (txError) return { error: txError.message };

    const { error: bonusError } = await supabase.from('bonuses').insert({
      girl_id: girlId,
      transaction_id: txData.id,
      amount,
      note: note || null,
    });

    if (bonusError) return { error: bonusError.message };

    revalidatePath('/');
    revalidatePath(`/girls/${girlId}`);
    revalidatePath(`/girls/${girlId}/statistics`);
    return { success: true };
  } catch (err: any) {
    console.error('Error adding bonus:', err);
    return { error: err.message || 'Something went wrong' };
  }
}

export async function undoTransaction(transactionId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    // 1. Fetch transaction to get its type and girl_id
    const { data: tx, error: txError } = await supabase
      .from('transactions')
      .select('id, type, girl_id')
      .eq('id', transactionId)
      .single();

    if (txError || !tx) return { error: txError?.message || 'Transaction not found' };

    // 2. If it's a service, we need to restock items
    if (tx.type === 'service') {
      const { data: items } = await supabase
        .from('transaction_items')
        .select('item_id, quantity')
        .eq('transaction_id', transactionId);

      if (items && items.length > 0) {
        // Fetch current stock for these items
        const itemIds = items.map(i => i.item_id);
        const { data: currentItems } = await supabase
          .from('items')
          .select('id, stock_quantity')
          .in('id', itemIds);

        if (currentItems && currentItems.length > 0) {
          const updatePromises = currentItems.map(curr => {
            const consumed = items.find(i => i.item_id === curr.id)?.quantity || 0;
            return supabase
              .from('items')
              .update({ stock_quantity: curr.stock_quantity + consumed }) // RESTOCK
              .eq('id', curr.id);
          });
          await Promise.all(updatePromises);
        }
      }
    }

    // 3. Delete transaction (Cascade will handle transaction_items, bonuses, etc.)
    const { error: deleteError } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId);

    if (deleteError) return { error: deleteError.message };

    revalidatePath('/');
    revalidatePath(`/girls/${tx.girl_id}`);
    revalidatePath(`/girls/${tx.girl_id}/statistics`);
    
    return { success: true };
  } catch (err: any) {
    console.error('Error undoing transaction:', err);
    return { error: err.message || 'Something went wrong' };
  }
}
