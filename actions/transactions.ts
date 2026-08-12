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
  destination: 'service_debt' | 'recurring_debt' = 'service_debt',
  transactionDate?: string
) {
  try {
    if (amount <= 0 && currency === 'dzd') return { error: 'Amount must be greater than zero' };
    if (euroAmount <= 0 && currency === 'euro') return { error: 'Euro amount must be greater than zero' };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const dateToUse = transactionDate && transactionDate.trim() 
      ? transactionDate 
      : new Date().toISOString().split('T')[0];

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
      transaction_date: dateToUse,
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
          .select('id, stock_quantity, sell_price, cost_price')
          .in('id', itemIds);

        if (currentItems && currentItems.length > 0) {
          const updatePromises = currentItems.map(curr => {
            const consumed = items.find(i => i.item_id === curr.id)?.quantity || 0;
            const oldStock = Number(curr.stock_quantity) || 0;
            const newStock = Math.round((oldStock + consumed) * 1000) / 1000;

            let newSellPrice = Number(curr.sell_price) || 0;
            let newCostPrice = Number(curr.cost_price) || 0;

            if (oldStock > 0) {
              const ratio = newStock / oldStock;
              newSellPrice = Math.round((newSellPrice * ratio) * 100) / 100;
              newCostPrice = Math.round((newCostPrice * ratio) * 100) / 100;
            }

            return supabase
              .from('items')
              .update({
                stock_quantity: newStock,
                sell_price: newSellPrice,
                cost_price: newCostPrice,
              }) // RESTOCK
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

export async function getTransactionItems(transactionId: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('transaction_items')
      .select('*')
      .eq('transaction_id', transactionId);

    if (error) return { error: error.message, items: [] };
    return { items: data || [] };
  } catch (err: any) {
    console.error('Error fetching transaction items:', err);
    return { error: err.message, items: [] };
  }
}

export async function updateTransaction(
  transactionId: string,
  data: {
    amount?: number;
    note?: string;
    transaction_date?: string;
    type?: string;
    destination?: 'service_debt' | 'recurring_debt';
    stockItem?: {
      item_id: string;
      item_name: string;
      quantity: number;
      unit_sell_price: number;
      unit_cost_price: number;
    } | null;
  }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    // 1. Fetch existing transaction
    const { data: tx, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (fetchError || !tx) return { error: fetchError?.message || 'Transaction not found' };

    // 2. Handle restocking of existing linked items before applying changes
    const { data: existingItems } = await supabase
      .from('transaction_items')
      .select('item_id, quantity')
      .eq('transaction_id', transactionId);

    if (existingItems && existingItems.length > 0) {
      const itemIds = existingItems.map(i => i.item_id);
      const { data: currentItems } = await supabase
        .from('items')
        .select('id, stock_quantity, sell_price, cost_price')
        .in('id', itemIds);

      if (currentItems && currentItems.length > 0) {
        const restockPromises = currentItems.map(curr => {
          const consumed = existingItems.find(i => i.item_id === curr.id)?.quantity || 0;
          const oldStock = Number(curr.stock_quantity) || 0;
          const newStock = Math.round((oldStock + consumed) * 1000) / 1000;

          let newSellPrice = Number(curr.sell_price) || 0;
          let newCostPrice = Number(curr.cost_price) || 0;

          if (oldStock > 0) {
            const ratio = newStock / oldStock;
            newSellPrice = Math.round((newSellPrice * ratio) * 100) / 100;
            newCostPrice = Math.round((newCostPrice * ratio) * 100) / 100;
          }

          return supabase
            .from('items')
            .update({
              stock_quantity: newStock,
              sell_price: newSellPrice,
              cost_price: newCostPrice,
            })
            .eq('id', curr.id);
        });
        await Promise.all(restockPromises);
      }

      // Clear existing transaction_items records
      await supabase
        .from('transaction_items')
        .delete()
        .eq('transaction_id', transactionId);
    }

    // 3. If a new stockItem is specified and linked, insert item and deduct stock
    if (data.stockItem && data.stockItem.item_id && data.stockItem.quantity > 0) {
      await supabase.from('transaction_items').insert({
        transaction_id: transactionId,
        item_id: data.stockItem.item_id,
        item_name: data.stockItem.item_name,
        quantity: data.stockItem.quantity,
        unit_sell_price: data.stockItem.unit_sell_price,
        unit_cost_price: data.stockItem.unit_cost_price,
      });

      const { data: currentItem } = await supabase
        .from('items')
        .select('id, stock_quantity, sell_price, cost_price')
        .eq('id', data.stockItem.item_id)
        .single();

      if (currentItem) {
        const oldStock = Number(currentItem.stock_quantity) || 0;
        const newStock = Math.max(0, Math.round((oldStock - data.stockItem.quantity) * 1000) / 1000);

        let newSellPrice = Number(currentItem.sell_price) || 0;
        let newCostPrice = Number(currentItem.cost_price) || 0;

        if (oldStock > 0) {
          const ratio = newStock / oldStock;
          newSellPrice = Math.max(0, Math.round((newSellPrice * ratio) * 100) / 100);
          newCostPrice = Math.max(0, Math.round((newCostPrice * ratio) * 100) / 100);
        }

        await supabase
          .from('items')
          .update({
            stock_quantity: newStock,
            sell_price: newSellPrice,
            cost_price: newCostPrice,
          })
          .eq('id', currentItem.id);
      }
    }

    const updatePayload: any = {};

    if (data.amount !== undefined && !isNaN(data.amount) && data.amount > 0) {
      if (tx.type === 'market_expense') {
        updatePayload.amount = -Math.abs(data.amount);
      } else {
        updatePayload.amount = Math.abs(data.amount);
      }
    }

    if (data.note !== undefined) {
      updatePayload.note = data.note;
    }

    if (data.transaction_date && data.transaction_date.trim()) {
      updatePayload.transaction_date = data.transaction_date.trim();
    }

    if (data.type) {
      updatePayload.type = data.type;
    }

    if (data.destination) {
      updatePayload.destination = data.destination;
    }

    // 4. Update transaction record
    const { error: updateError } = await supabase
      .from('transactions')
      .update(updatePayload)
      .eq('id', transactionId);

    if (updateError) return { error: updateError.message };

    // 5. Sync bonuses table if applicable
    if (tx.type === 'bonus') {
      const bonusPayload: any = {};
      if (updatePayload.amount !== undefined) bonusPayload.amount = updatePayload.amount;
      if (updatePayload.note !== undefined) bonusPayload.note = updatePayload.note;

      if (Object.keys(bonusPayload).length > 0) {
        await supabase
          .from('bonuses')
          .update(bonusPayload)
          .eq('transaction_id', transactionId);
      }
    }

    revalidatePath('/');
    if (tx.girl_id) {
      revalidatePath(`/girls/${tx.girl_id}`);
      revalidatePath(`/girls/${tx.girl_id}/statistics`);
    }
    revalidatePath('/statistics');
    revalidatePath('/stock');

    return { success: true };
  } catch (err: any) {
    console.error('Error updating transaction:', err);
    return { error: err.message || 'Something went wrong' };
  }
}


