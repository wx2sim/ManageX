'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function addAdminExpense(girlId: string, amount: number, note: string) {
  try {
    if (amount <= 0) return { error: 'Amount must be greater than zero' };
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase
      .from('transactions')
      .insert({
        girl_id: girlId,
        profile_id: user.id,
        type: 'market_expense',
        amount: amount,
        note: note || 'Admin Expense',
        transaction_date: new Date().toISOString().split('T')[0],
      });

    if (error) return { error: error.message };

    revalidatePath(`/girls/${girlId}`);
    revalidatePath('/statistics');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Something went wrong' };
  }
}

export async function getAdminStats(girlId: string, monthStr?: string) {
  try {
    const supabase = await createClient();
    
    let itemsQuery = supabase
      .from('transaction_items')
      .select('quantity, unit_sell_price, unit_cost_price, transactions!inner(transaction_date, girls!inner(account_type))');
      
    if (monthStr) {
      const start = `${monthStr}-01`;
      const end = new Date(new Date(start).getFullYear(), new Date(start).getMonth() + 1, 0).toISOString().split('T')[0];
      itemsQuery = itemsQuery.gte('transactions.transaction_date', start).lte('transactions.transaction_date', end);
    }

    const { data: itemsData, error: itemsError } = await itemsQuery;
      
    if (itemsError) return { error: itemsError.message };
    
    let netProfit = 0;
    for (const item of (itemsData || [])) {
      const tx = (item as any).transactions;
      const girlAccountType = tx?.girls?.account_type;
      if (girlAccountType !== 'admin') {
        const itemProfit = item.quantity * (item.unit_sell_price - item.unit_cost_price);
        netProfit += itemProfit;
      }
    }

    let expensesQuery = supabase
      .from('transactions')
      .select('*')
      .eq('girl_id', girlId)
      .eq('type', 'market_expense')
      .order('transaction_date', { ascending: false });

    if (monthStr) {
      const start = `${monthStr}-01`;
      const end = new Date(new Date(start).getFullYear(), new Date(start).getMonth() + 1, 0).toISOString().split('T')[0];
      expensesQuery = expensesQuery.gte('transaction_date', start).lte('transaction_date', end);
    }

    const { data: expensesData, error: expensesError } = await expensesQuery;

    if (expensesError) return { error: expensesError.message };

    const totalExpenses = (expensesData || []).reduce((sum, tx) => sum + Number(tx.amount), 0);

    let adminTransactionsQuery = supabase
      .from('transactions')
      .select('amount, type')
      .eq('girl_id', girlId);

    if (monthStr) {
      const start = `${monthStr}-01`;
      const end = new Date(new Date(start).getFullYear(), new Date(start).getMonth() + 1, 0).toISOString().split('T')[0];
      adminTransactionsQuery = adminTransactionsQuery.gte('transaction_date', start).lte('transaction_date', end);
    }
    
    const { data: adminTxs, error: adminTxsError } = await adminTransactionsQuery;
    let adminDebt = 0;
    let adminPaid = 0;
    for (const tx of (adminTxs || [])) {
      if (tx.type === 'market_expense') continue;
      const amt = Number(tx.amount);
      if (amt < 0) adminDebt += Math.abs(amt);
      if (amt > 0) adminPaid += amt;
    }
    const adminRemainingDebt = Math.max(0, adminDebt - adminPaid);

    return {
      success: true,
      netProfitFromSales: netProfit,
      netProfit: netProfit - totalExpenses - adminRemainingDebt,
      adminRemainingDebt,
      expenses: expensesData || [],
      totalExpenses
    };
  } catch (err: any) {
    return { error: err.message || 'Something went wrong' };
  }
}

export async function deleteAdminExpense(txId: string, girlId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { data: tx, error: txError } = await supabase
      .from('transactions')
      .select('type, girl_id')
      .eq('id', txId)
      .single();

    if (txError) return { error: txError.message };
    if (!tx || tx.type !== 'market_expense' || tx.girl_id !== girlId) {
      return { error: 'Unauthorized or invalid transaction type' };
    }

    const { error: deleteError } = await supabase
      .from('transactions')
      .delete()
      .eq('id', txId);

    if (deleteError) return { error: deleteError.message };

    revalidatePath(`/girls/${girlId}`);
    revalidatePath('/statistics');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Something went wrong' };
  }
}
