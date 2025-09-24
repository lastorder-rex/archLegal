import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '../../../supabase/admin';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirectTo = requestUrl.searchParams.get('next') ?? '/';

  if (!code) {
    return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
  }

  const supabase = createRouteHandlerClient({ cookies });
  await supabase.auth.exchangeCodeForSession(code);

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    try {
      const admin = createSupabaseAdminClient();
      const fullName =
        (user.user_metadata?.name as string | undefined) ||
        (user.user_metadata?.full_name as string | undefined) ||
        user.email ||
        null;
      const phone =
        (user.user_metadata?.phone_number as string | undefined) ||
        user.phone ||
        null;

      await admin
        .from('users')
        .upsert(
          {
            auth_id: user.id,
            email: user.email,
            full_name: fullName,
            phone
          },
          { onConflict: 'auth_id' }
        );
    } catch (error) {
      console.error('Failed to sync user profile', error);
    }
  }

  return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
}
