'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function extractBonusBucket(girlId: string, amount: number) {
  try {
    if (amount <= 0) return { error: 'No bonus to extract' };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

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

    await supabase.from('bonuses').insert({
      girl_id: girlId,
      transaction_id: txDataBonus.id,
      amount: -amount,
      note: 'Extraction to global profit',
    });

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

export async function extractEuro(girlId: string, euroAmount: number, note: string) {
  try {
    if (euroAmount <= 0) return { error: 'Invalid amount' };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase
      .from('transactions')
      .insert({
        girl_id: girlId,
        profile_id: user.id,
        type: 'euro_extraction',
        amount: 0,
        currency: 'euro',
        euro_amount: euroAmount,
        note: note || 'Manual Euro Extraction',
      });

    if (error) return { error: error.message };

    revalidatePath('/');
    revalidatePath('/statistics');
    revalidatePath(`/girls/${girlId}`);
    revalidatePath(`/girls/${girlId}/statistics`);
    return { success: true };
  } catch (err: any) {
    console.error('Error extracting euro:', err);
    return { error: err.message || 'Something went wrong' };
  }
}

export async function extractDzdRent(girlId: string, amount: number, note: string) {
  try {
    if (amount <= 0) return { error: 'Invalid amount' };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase
      .from('transactions')
      .insert({
        girl_id: girlId,
        profile_id: user.id,
        type: 'dzd_extraction',
        amount: amount,
        note: note || 'DZD loyer et frais fix',
      });

    if (error) return { error: error.message };

    revalidatePath('/');
    revalidatePath('/statistics');
    revalidatePath(`/girls/${girlId}`);
    revalidatePath(`/girls/${girlId}/statistics`);
    return { success: true };
  } catch (err: any) {
    console.error('Error extracting DZD rent:', err);
    return { error: err.message || 'Something went wrong' };
  }
}

export async function extractAllGlobalVaults() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { data: balances, error: fetchError } = await supabase
      .from('girl_balances')
      .select('girl_id, euro_vault_balance, dzd_vault_balance');

    if (fetchError) return { error: fetchError.message };

    const transactionsToInsert: any[] = [];

    for (const bal of (balances || [])) {
      const euroAmt = Number(bal.euro_vault_balance) || 0;
      const dzdAmt = Number(bal.dzd_vault_balance) || 0;

      if (euroAmt > 0) {
        transactionsToInsert.push({
          girl_id: bal.girl_id,
          profile_id: user.id,
          type: 'euro_extraction',
          amount: 0,
          currency: 'euro',
          euro_amount: euroAmt,
          note: 'Global Euro Extraction',
        });
      }

      if (dzdAmt > 0) {
        transactionsToInsert.push({
          girl_id: bal.girl_id,
          profile_id: user.id,
          type: 'dzd_extraction',
          amount: dzdAmt,
          note: 'DZD loyer et frais fix',
        });
      }
    }

    if (transactionsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('transactions')
        .insert(transactionsToInsert);

      if (insertError) return { error: insertError.message };
    }

    revalidatePath('/');
    revalidatePath('/statistics');
    return { success: true };
  } catch (err: any) {
    console.error('Error extracting all global vaults:', err);
    return { error: err.message || 'Something went wrong' };
  }
}

export async function extractAllGlobalBonuses() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { data: bonusTx, error: fetchError } = await supabase
      .from('transactions')
      .select('girl_id, amount')
      .eq('type', 'bonus');

    if (fetchError) return { error: fetchError.message };
    if (!bonusTx || bonusTx.length === 0) return { error: 'No bonuses to extract' };

    const balances: Record<string, number> = {};
    bonusTx.forEach(tx => {
      if (tx.girl_id) {
        balances[tx.girl_id] = (balances[tx.girl_id] || 0) + Number(tx.amount);
      }
    });

    let totalExtracted = 0;
    const transactionsToInsert = [];

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
    return { success: true };
  } catch (err: any) {
    console.error('Error extracting all global bonuses:', err);
    return { error: err.message || 'Something went wrong' };
  }
}

export async function addInstantProfit(amount: number, note: string, type: 'profit' | 'loss') {
  try {
    if (amount <= 0) return { error: 'Amount must be greater than zero' };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const signedAmount = type === 'profit' ? amount : -amount;

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
