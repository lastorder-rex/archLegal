/**
 * One-off script to create a test email/password user for staging or preview.
 * Usage: npx ts-node scripts/create_test_user.ts user@example.com password 'Full Name'
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

async function main() {
  const [email, password, fullName] = process.argv.slice(2);
  if (!url || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env');
    process.exit(1);
  }
  if (!email || !password) {
    console.error('Usage: ts-node scripts/create_test_user.ts <email> <password> [fullName]');
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey);

  // Create auth user with confirmed email
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: fullName ? { full_name: fullName } : undefined,
  });

  if (createError) {
    console.error('Create user failed:', createError);
    process.exit(1);
  }

  const user = created.user;
  console.log('Created auth user:', user?.id, user?.email);

  // Upsert public.users profile
  const { error: upsertError } = await supabase
    .from('users')
    .upsert({
      auth_id: user?.id,
      full_name: fullName || user?.email?.split('@')[0] || 'Test User',
      email: user?.email,
      phone: null,
      legal_name: null,
      contact_phone: null,
      profile_completed: false,
    }, { onConflict: 'auth_id' });

  if (upsertError) {
    console.error('Upsert profile failed:', upsertError);
    process.exit(1);
  }

  console.log('Upserted profile for', user?.id);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

