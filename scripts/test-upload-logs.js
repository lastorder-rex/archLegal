const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const { data, error } = await supabase
    .from('upload_logs')
    .select('id, file_name, uploaded_at')
    .eq('consultation_id', '53682554-22b7-4324-b03b-4877a1daf491')
    .eq('payment_id', 'd56a8bf7-ff2c-4bbe-a308-058e3fadea94')
    .order('uploaded_at', { ascending: false });

  console.log('Data:', JSON.stringify(data, null, 2));
  console.log('Error:', error);
  console.log('Count:', data?.length);
}

test();
