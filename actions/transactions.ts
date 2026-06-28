'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { TransactionType } from '@/lib/types';
import { calculateCartTotal } from '@/lib/financials/calculations';

/**
 * Logs a payment from a resident.
 */
export async function addPayment(girlId: string, amount: number, note: string) {
  try {
    if (amount <= 0) {
      return { error: 'Amount must be greater than zero' };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

    const { error } = await supabase.from('transactions').insert({
      girl_id: girlId,
      profile_id: user.id,
      type: 'payment',
      amount,
      note: note || null,
    });

    if (error) {
      return { error: error.message };
    }

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
 * Logs a penalty / duty charge.
 */
export async function addDuty(girlId: string, amount: number, note: string) {
  try {
    if (amount <= 0) {
      return { error: 'Amount must be greater than zero' };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

    const { error } = await supabase.from('transactions').insert({
      girl_id: girlId,
      profile_id: user.id,
      type: 'duty',
      amount,
      note: note || null,
    });

    if (error) {
      return { error: error.message };
    }

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
 * Logs a bonus transaction.
 */
export async function addBonus(girlId: string, amount: number, note: string) {
  try {
    if (amount <= 0) {
      return { error: 'Amount must be greater than zero' };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

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

    if (txError) {
      return { error: txError.message };
    }

    // Insert bonus record
    const { error: bonusError } = await supabase.from('bonuses').insert({
      girl_id: girlId,
      transaction_id: txData.id,
      amount,
      note: note || null,
    });

    if (bonusError) {
      return { error: bonusError.message };
    }

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
 * Logs an ad-hoc instant profit or loss.
 */
export async function addInstantProfit(amount: number, note: string, type: 'profit' | 'loss') {
  try {
    if (amount <= 0) {
      return { error: 'Amount must be greater than zero' };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

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

    if (txError) {
      return { error: txError.message };
    }

    // Insert instant profit details
    const { error: ipError } = await supabase.from('instant_profits').insert({
      profile_id: user.id,
      transaction_id: txData.id,
      amount: signedAmount,
      note: note || null,
    });

    if (ipError) {
      return { error: ipError.message };
    }

    revalidatePath('/');
    revalidatePath('/statistics');
    return { success: true };
  } catch (err: any) {
    console.error('Error adding instant profit:', err);
    return { error: err.message || 'Something went wrong' };
  }
}

/**
 * Logs a fixed payment template application.
 */
export async function applyFixedPayment(girlId: string, amount: number, name: string, note?: string) {
  try {
    if (amount <= 0) {
      return { error: 'Amount must be greater than zero' };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

    const { error } = await supabase.from('transactions').insert({
      girl_id: girlId,
      profile_id: user.id,
      type: 'fixed_payment',
      amount,
      note: note || name,
    });

    if (error) {
      return { error: error.message };
    }

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
 * Saves a recurring payment template (e.g. Rent, WiFi) for a resident.
 */
export async function saveFixedPaymentTemplate(girlId: string, name: string, defaultAmount: number) {
  try {
    if (!name || defaultAmount <= 0) {
      return { error: 'Name and valid default amount are required' };
    }

    const supabase = await createClient();
    const { error } = await supabase.from('fixed_payment_templates').insert({
      girl_id: girlId,
      name,
      default_amount: defaultAmount,
    });

    if (error) {
      return { error: error.message };
    }

    revalidatePath(`/girls/${girlId}/fixed-payments`);
    return { success: true };
  } catch (err: any) {
    console.error('Error saving template:', err);
    return { error: err.message || 'Something went wrong' };
  }
}

/**
 * Deletes a fixed payment template.
 */
export async function deleteFixedPaymentTemplate(templateId: string, girlId: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('fixed_payment_templates')
      .delete()
      .eq('id', templateId);

    if (error) {
      return { error: error.message };
    }

    revalidatePath(`/girls/${girlId}/fixed-payments`);
    return { success: true };
  } catch (err: any) {
    console.error('Error deleting template:', err);
    return { error: err.message || 'Something went wrong' };
  }
}

/**
 * Commits a service cart purchase (multiple items) as a service transaction.
 */
export async function commitServiceTransaction(
  girlId: string,
  items: { item_id: string; item_name: string; quantity: number; unit_sell_price: number; unit_cost_price: number }[],
  note?: string
) {
  try {
    if (items.length === 0) {
      return { error: 'Cart is empty' };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

    // Calculate total transaction value
    const totalAmount = calculateCartTotal(items);

    // Create the master transaction
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

    if (txError) {
      return { error: txError.message };
    }

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
      // Clean up transaction
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
