'use server';

/**
 * BUSINESS LOGIC: Database I/O & Server Actions
 * 
 * This file handles writing money transactions into the database.
 * Every function here dictates whether an amount will be added to or subtracted
 * from the Resident's overall Net Balance by assigning a specific Transaction Type.
 */

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { calculateCartTotal } from '@/lib/business_logic';

/**
 * LOG PAYMENT: Resident pays money to the House.
 * 
 * EFFECT: Decreases Resident's Debt (Increases Company Income)
 * CALLED BY: PaymentForm.tsx (PaymentTab.tsx)
 */
export async function addPayment(girlId: string, amount: number, note: string) {
  try {
    if (amount <= 0) return { error: 'Amount must be greater than zero' };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    // type 'payment' SUBTRACTS from net_balance
    const { error } = await supabase.from('transactions').insert({
      girl_id: girlId,
      profile_id: user.id,
      type: 'payment',
      amount,
      note: note || null,
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

/**
 * LOG DUTY / PENALTY: Resident is charged a penalty or fine.
 * 
 * EFFECT: Increases Resident's Debt
 * CALLED BY: DutyForm.tsx (DutiesTab.tsx)
 */
export async function addDuty(girlId: string, amount: number, note: string) {
  try {
    if (amount <= 0) return { error: 'Amount must be greater than zero' };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    // type 'duty' ADDS to net_balance
    const { error } = await supabase.from('transactions').insert({
      girl_id: girlId,
      profile_id: user.id,
      type: 'duty',
      amount,
      note: note || null,
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

/**
 * LOG BONUS: House receives a bonus from the Resident.
 * 
 * EFFECT: Isolated into Bonus Bucket (Does NOT affect Resident's Debt, increases Bonus Bucket)
 * CALLED BY: BonusForm.tsx (BonusTab.tsx)
 */
export async function addBonus(girlId: string, amount: number, note: string) {
  try {
    if (amount <= 0) return { error: 'Amount must be greater than zero' };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    // Insert transaction
    const { data: txData, error: txError } = await supabase
      .from('transactions')
      .insert({
        girl_id: girlId,
        profile_id: user.id,
        type: 'bonus',
        amount,
        note: note || null,
      })
      .select('id')
      .single();

    if (txError) return { error: txError.message };

    // Insert bonus record
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

/**
 * EXTRACT BONUS BUCKET: Takes the resident's isolated bonus money and moves it to global company profit.
 * 
 * EFFECT: Resets Bonus Bucket to 0. Adds to global Instant Profit.
 * CALLED BY: BonusTab.tsx
 */
export async function extractBonusBucket(girlId: string, amount: number) {
  try {
    if (amount <= 0) return { error: 'No bonus to extract' };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    // 1. Insert negative bonus to reset bucket
    const { data: txDataBonus, error: txErrorBonus } = await supabase
      .from('transactions')
      .insert({
        girl_id: girlId,
        profile_id: user.id,
        type: 'bonus',
        amount: -amount,
        note: 'Extraction to global profit',
      })
      .select('id')
      .single();

    if (txErrorBonus) return { error: txErrorBonus.message };

    // Also record the negative bonus to bonuses table
    await supabase.from('bonuses').insert({
      girl_id: girlId,
      transaction_id: txDataBonus.id,
      amount: -amount,
      note: 'Extraction to global profit',
    });

    // 2. Insert positive instant profit
    const { data: txDataProfit, error: txErrorProfit } = await supabase
      .from('transactions')
      .insert({
        profile_id: user.id,
        type: 'instant_profit',
        amount: amount,
        note: 'Extracted from bonus bucket',
      })
      .select('id')
      .single();

    if (txErrorProfit) return { error: txErrorProfit.message };

    await supabase.from('instant_profits').insert({
      profile_id: user.id,
      transaction_id: txDataProfit.id,
      amount: amount,
      note: 'Extracted from bonus bucket',
    });

    revalidatePath('/');
    revalidatePath('/statistics');
    revalidatePath(`/girls/${girlId}`);
    revalidatePath(`/girls/${girlId}/bonus`);
    revalidatePath(`/girls/${girlId}/statistics`);
    return { success: true };
  } catch (err: any) {
    console.error('Error extracting bonus bucket:', err);
    return { error: err.message || 'Something went wrong' };
  }
}

/**
 * EXTRACT GLOBAL BONUS BUCKETS: Empties ALL residents' unextracted bonus buckets globally.
 * 
 * EFFECT: Resets all positive Bonus Buckets to 0. Adds the total to global Instant Profit.
 * CALLED BY: StatsTable.tsx (Global Overview)
 */
export async function extractAllGlobalBonuses() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    // 1. Fetch all bonus transactions
    const { data: bonusTx, error: fetchError } = await supabase
      .from('transactions')
      .select('girl_id, amount')
      .eq('type', 'bonus');

    if (fetchError) return { error: fetchError.message };
    if (!bonusTx || bonusTx.length === 0) return { error: 'No bonuses to extract' };

    // 2. Calculate balance per girl
    const balances: Record<string, number> = {};
    bonusTx.forEach(tx => {
      if (tx.girl_id) {
        balances[tx.girl_id] = (balances[tx.girl_id] || 0) + Number(tx.amount);
      }
    });

    let totalExtracted = 0;
    const transactionsToInsert = [];
    const bonusesToInsert = [];

    // 3. Prepare negative transactions for girls with positive balances
    for (const [girlId, balance] of Object.entries(balances)) {
      if (balance > 0) {
        totalExtracted += balance;
        transactionsToInsert.push({
          girl_id: girlId,
          profile_id: user.id,
          type: 'bonus',
          amount: -balance,
          note: 'Global extraction to profit',
        });
      }
    }

    if (totalExtracted === 0) return { error: 'No positive bonus buckets to extract' };

    // 4. Insert negative transactions
    // To get their IDs for the bonuses table, we need to insert them one by one or insert and select.
    // Given Supabase limitations on bulk insert+select, we do it in a loop for safety, or bulk without returning id if we don't strictly need bonuses table (wait, bonuses table needs transaction_id).
    for (const tx of transactionsToInsert) {
      const { data: txData, error: txErr } = await supabase
        .from('transactions')
        .insert(tx)
        .select('id')
        .single();
        
      if (!txErr && txData) {
        await supabase.from('bonuses').insert({
          girl_id: tx.girl_id,
          transaction_id: txData.id,
          amount: tx.amount,
          note: tx.note,
        });
      }
    }

    // 5. Insert positive instant profit
    const { data: txDataProfit, error: txErrorProfit } = await supabase
      .from('transactions')
      .insert({
        profile_id: user.id,
        type: 'instant_profit',
        amount: totalExtracted,
        note: 'Global extraction from all bonus buckets',
      })
      .select('id')
      .single();

    if (txErrorProfit) return { error: txErrorProfit.message };

    await supabase.from('instant_profits').insert({
      profile_id: user.id,
      transaction_id: txDataProfit.id,
      amount: totalExtracted,
      note: 'Global extraction from all bonus buckets',
    });

    revalidatePath('/');
    revalidatePath('/statistics');
    // We ideally should revalidate all girls' paths but revalidatePath('/', 'layout') might be better
    return { success: true };
  } catch (err: any) {
    console.error('Error extracting all global bonuses:', err);
    return { error: err.message || 'Something went wrong' };
  }
}

/**
 * LOG INSTANT PROFIT / LOSS: Global company gain or loss.
 * 
 * EFFECT: Does NOT affect any Resident's balance (Global metrics only)
 * CALLED BY: InstantProfitForm.tsx
 */
export async function addInstantProfit(amount: number, note: string, type: 'profit' | 'loss') {
  try {
    if (amount <= 0) return { error: 'Amount must be greater than zero' };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const signedAmount = type === 'profit' ? amount : -amount;

    // Insert transaction (no girl_id)
    const { data: txData, error: txError } = await supabase
      .from('transactions')
      .insert({
        profile_id: user.id,
        type: 'instant_profit',
        amount: signedAmount,
        note: note || null,
      })
      .select('id')
      .single();

    if (txError) return { error: txError.message };

    // Insert instant profit details
    const { error: ipError } = await supabase.from('instant_profits').insert({
      profile_id: user.id,
      transaction_id: txData.id,
      amount: signedAmount,
      note: note || null,
    });

    if (ipError) return { error: ipError.message };

    revalidatePath('/');
    revalidatePath('/statistics');
    return { success: true };
  } catch (err: any) {
    console.error('Error adding instant profit:', err);
    return { error: err.message || 'Something went wrong' };
  }
}

/**
 * LOG FIXED PAYMENT / RECURRING CHARGE: Apply a template charge (e.g., Rent).
 * 
 * EFFECT: Increases Resident's Debt
 * CALLED BY: FixedPaymentForm.tsx (RecurringTab.tsx)
 */
export async function applyFixedPayment(girlId: string, amount: number, name: string, note?: string) {
  try {
    if (amount <= 0) return { error: 'Amount must be greater than zero' };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    // type 'fixed_payment' ADDS to net_balance
    const { error } = await supabase.from('transactions').insert({
      girl_id: girlId,
      profile_id: user.id,
      type: 'fixed_payment',
      amount,
      note: note || name,
    });

    if (error) return { error: error.message };

    revalidatePath('/');
    revalidatePath(`/girls/${girlId}`);
    revalidatePath(`/girls/${girlId}/statistics`);
    return { success: true };
  } catch (err: any) {
    console.error('Error applying fixed payment:', err);
    return { error: err.message || 'Something went wrong' };
  }
}

/**
 * SAVE RECURRING TEMPLATE: Store a default charge for future use.
 * 
 * EFFECT: No immediate balance change.
 * CALLED BY: FixedPaymentForm.tsx (RecurringTab.tsx)
 */
export async function saveFixedPaymentTemplate(girlId: string, name: string, defaultAmount: number) {
  try {
    if (!name || defaultAmount <= 0) return { error: 'Name and valid default amount are required' };

    const supabase = await createClient();
    const { error } = await supabase.from('fixed_payment_templates').insert({
      girl_id: girlId,
      name,
      default_amount: defaultAmount,
    });

    if (error) return { error: error.message };

    revalidatePath(`/girls/${girlId}/fixed-payments`);
    return { success: true };
  } catch (err: any) {
    console.error('Error saving template:', err);
    return { error: err.message || 'Something went wrong' };
  }
}

/**
 * DELETE RECURRING TEMPLATE
 * 
 * EFFECT: No balance change.
 * CALLED BY: RecurringTab.tsx
 */
export async function deleteFixedPaymentTemplate(templateId: string, girlId: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('fixed_payment_templates')
      .delete()
      .eq('id', templateId);

    if (error) return { error: error.message };

    revalidatePath(`/girls/${girlId}/fixed-payments`);
    return { success: true };
  } catch (err: any) {
    console.error('Error deleting template:', err);
    return { error: err.message || 'Something went wrong' };
  }
}

/**
 * LOG SERVICE TRANSACTION: Resident purchases items from the cart.
 * 
 * EFFECT: Increases Resident's Debt by total cart amount.
 * CALLED BY: ItemList.tsx (Service Cart)
 */
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

    // Calculate total transaction value from business logic
    const totalAmount = calculateCartTotal(items);

    // type 'service' ADDS to net_balance
    const { data: txData, error: txError } = await supabase
      .from('transactions')
      .insert({
        girl_id: girlId,
        profile_id: user.id,
        type: 'service',
        amount: totalAmount,
        note: note || `Purchased: ${items.map(i => `${i.quantity}x ${i.item_name}`).join(', ')}`,
      })
      .select('id')
      .single();

    if (txError) return { error: txError.message };

    // Insert line items
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

    // Decrement stock quantity for each item
    for (const item of items) {
      // First get current stock
      const { data: currentItem } = await supabase
        .from('items')
        .select('stock_quantity')
        .eq('id', item.item_id)
        .single();
        
      if (currentItem) {
        await supabase
          .from('items')
          .update({ stock_quantity: currentItem.stock_quantity - item.quantity })
          .eq('id', item.item_id);
      }
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
