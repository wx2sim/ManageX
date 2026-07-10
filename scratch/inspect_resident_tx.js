const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qhbdxikvagwgfrrfhoey.supabase.co';
const supabaseKey = 'sb_publishable_F2EPosf5_Tp0qcysy98TBw_q2y5dUxJ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Fetching girl_balances...');
  const { data: balances, error: bErr } = await supabase
    .from('girl_balances')
    .select('*');
  
  if (bErr) {
    console.error('Balances fetch error:', bErr);
  } else {
    console.log('Balances:', JSON.stringify(balances, null, 2));
  }

  console.log('Fetching recent transactions of type service or duty...');
  const { data: txs, error: txErr } = await supabase
    .from('transactions')
    .select('*')
    .in('type', ['service', 'duty'])
    .order('created_at', { ascending: false })
    .limit(5);

  if (txErr) {
    console.error('Transactions fetch error:', txErr);
  } else {
    console.log('Recent service/duty transactions:', JSON.stringify(txs, null, 2));
  }
}

run();
