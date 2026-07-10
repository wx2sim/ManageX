const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://qhbdxikvagwgfrrfhoey.supabase.co',
  'sb_publishable_F2EPosf5_Tp0qcysy98TBw_q2y5dUxJ'
);

async function check() {
  const { data, error } = await supabase.auth.signInWithOtp({
    email: 'vincplayer@gmail.com',
    options: {
      shouldCreateUser: false,
    }
  });
  console.log('Error:', error ? error.message : 'No error');
}

check();
