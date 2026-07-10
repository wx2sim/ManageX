'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function commitServiceTransaction(
  girlId: string,
  items: { item_id: string; item_name: string; quantity: number; unit_sell_price: number; unit_cost_price: number }[],
  note?: string
) {
  try {
    if (items.length === 0) return { error: 'Cart is empty' };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { data: girl } = await supabase
      .from('girls')
      .select('account_type')
      .eq('id', girlId)
      .single();

    const isAdmin = girl?.account_type === 'admin';

    const totalAmount = items.reduce((sum, item) => {
      const price = isAdmin ? item.unit_cost_price : item.unit_sell_price;
      return sum + (item.quantity * price);
    }, 0);

    const { data: txData, error: txError } = await supabase
      .from('transactions')
      .insert({
        girl_id: girlId,
        profile_id: user.id,
        type: 'service',
        amount: totalAmount,
        note: note || `Crediée: ${items.map(i => `${i.quantity}x ${i.item_name}`).join(', ')}${isAdmin ? ' (P.Achat)' : ''}`,
        transaction_date: new Date().toISOString().split('T')[0],
      })
      .select('id')
      .single();

    if (txError) return { error: txError.message };

    const lineItems = items.map((item) => ({
      transaction_id: txData.id,
      item_id: item.item_id,
      item_name: item.item_name,
      quantity: item.quantity,
      unit_sell_price: item.unit_sell_price,
      unit_cost_price: item.unit_cost_price,
    }));

    const { error: itemsError } = await supabase
      .from('transaction_items')
      .insert(lineItems);

    if (itemsError) {
      await supabase.from('transactions').delete().eq('id', txData.id);
      return { error: itemsError.message };
    }

    // Parallelize stock updates for better performance
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
          .update({ stock_quantity: curr.stock_quantity - consumed })
          .eq('id', curr.id);
      });
      await Promise.all(updatePromises);
    }

    revalidatePath('/');
    revalidatePath(`/girls/${girlId}`);
    revalidatePath(`/girls/${girlId}/statistics`);
    return { success: true };
  } catch (err: any) {
    console.error('Error committing service transaction:', err);
    return { error: err.message || 'Something went wrong' };
  }
}
