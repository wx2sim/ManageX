import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const k = parts[0].trim();
    const v = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
    envVars[k] = v;
  }
});

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const anonKey = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, anonKey);

async function check() {
  const { data, error } = await supabase.from('transaction_items').insert({
    transaction_id: '00000000-0000-0000-0000-000000000000',
    item_id: '00000000-0000-0000-0000-000000000000',
    item_name: 'test',
    quantity: 0.1,
    unit_sell_price: 10,
    unit_cost_price: 5
  });
  console.log('Error:', error);
}

check();
