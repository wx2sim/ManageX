const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qhbdxikvagwgfrrfhoey.supabase.co';
const supabaseKey = 'sb_publishable_F2EPosf5_Tp0qcysy98TBw_q2y5dUxJ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Fetching fixed_payment_templates...');
  const { data: templates, error: tErr } = await supabase
    .from('fixed_payment_templates')
    .select('*');
  
  if (tErr) {
    console.error('Templates fetch error:', tErr);
  } else {
    console.log('Templates:', JSON.stringify(templates, null, 2));
  }

  console.log('Fetching transactions...');
  const { data: txs, error: txErr } = await supabase
    .from('transactions')
    .select('*');

  if (txErr) {
    console.error('Transactions fetch error:', txErr);
  } else {
    const fixedTxs = txs.filter(t => t.type === 'fixed_payment');
    console.log('Fixed Payment Transactions count:', fixedTxs.length);
    console.log('Fixed Payment Transactions:', JSON.stringify(fixedTxs, null, 2));
  }
}

run();
