import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Fetch last 10 transactions
    const { data: txs, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
      
    // Fetch girl balances
    const { data: balances, error: bError } = await supabase
      .from('girl_balances')
      .select('*');

    return NextResponse.json({
      success: true,
      transactions: txs,
      txError: txError?.message,
      balances: balances,
      bError: bError?.message
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}
