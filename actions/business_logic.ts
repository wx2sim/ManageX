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
 * LOG BONUS: House gives a reward to the Resident.
 * 
 * EFFECT: Does NOT affect Resident's Debt (Increases Company Spent)
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
        note: note || `Purchase of ${items.length} service item(s)`,
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

    revalidatePath('/');
    revalidatePath(`/girls/${girlId}`);
    revalidatePath(`/girls/${girlId}/statistics`);
    return { success: true };
  } catch (err: any) {
    console.error('Error committing service transaction:', err);
    return { error: err.message || 'Something went wrong' };
  }
}
