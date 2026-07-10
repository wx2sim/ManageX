'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function applyFixedPayment(girlId: string, amount: number, name: string, note?: string) {
  try {
    if (amount <= 0) return { error: 'Amount must be greater than zero' };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase.from('transactions').insert({
      girl_id: girlId,
      profile_id: user.id,
      type: 'fixed_payment',
      amount,
      note: note || name,
      transaction_date: new Date().toISOString().split('T')[0],
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

export async function saveFixedPaymentTemplate(
  girlId: string, 
  name: string, 
  defaultAmount: number,
  recurrenceDays: number | null = null
) {
  try {
    if (!name || defaultAmount <= 0) return { error: 'Name and valid default amount are required' };

    const supabase = await createClient();
    
    let nextExecutionDate = null;
    let lastExecutedAt = null;
    
    if (recurrenceDays && recurrenceDays > 0) {
      const now = new Date();
      lastExecutedAt = now.toISOString();
      
      const nextDate = new Date(now);
      nextDate.setDate(now.getDate() + recurrenceDays);
      nextExecutionDate = nextDate.toISOString();
    }

    const { error } = await supabase.from('fixed_payment_templates').insert({
      girl_id: girlId,
      name,
      default_amount: defaultAmount,
      recurrence_interval_days: recurrenceDays && recurrenceDays > 0 ? recurrenceDays : null,
      last_executed_at: lastExecutedAt,
      next_execution_date: nextExecutionDate
    }).select().single();

    if (error) return { error: error.message };

    if (recurrenceDays && recurrenceDays > 0) {
      await applyFixedPayment(girlId, defaultAmount, name, `${name} (Auto-recurring start)`);
    }

    revalidatePath(`/girls/${girlId}/fixed-payments`);
    return { success: true };
  } catch (err: any) {
    console.error('Error saving template:', err);
    return { error: err.message || 'Something went wrong' };
  }
}

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

export async function processRecurringCharges() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc('process_recurring_charges');
    if (error) {
      console.error('Error processing recurring charges via RPC:', error);
      return { error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    const errMsg = err?.message || '';
    const isNextPrerenderError = errMsg.includes('cookies') && (errMsg.includes('prerender') || errMsg.includes('dynamic') || errMsg.includes('Dynamic'));
    if (!isNextPrerenderError) {
      console.error('Failed to run recurring charges:', err);
    }
    return { error: err.message || 'Something went wrong' };
  }
}
