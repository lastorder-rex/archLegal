import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { setUserSessionCookie } from '@/lib/auth/user-session';
import { createSupabaseAdminClient } from '../../../supabase/admin';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirectTo = requestUrl.searchParams.get('next') ?? '/';
  const safeRedirectPath = redirectTo.startsWith('/') ? redirectTo : '/';

  if (!code) {
    return NextResponse.redirect(new URL(safeRedirectPath, requestUrl.origin));
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

      const { data: profileData } = await admin
        .from('users')
        .select(
          'auth_id, profile_completed, contact_phone, legal_name, profile_completed_at, consent_terms_at, consent_privacy_at, birth_date'
        )
        .eq('auth_id', user.id)
        .single();

      if (profileData && !profileData.contact_phone && phone) {
        await admin.from('users').update({ contact_phone: phone }).eq('auth_id', user.id);
        profileData.contact_phone = phone;
      }

      const profileCompleted = profileData?.profile_completed ?? false;

      if (!profileCompleted) {
        const signupUrl = new URL('/signup', requestUrl.origin);
        if (safeRedirectPath && safeRedirectPath !== '/signup') {
          signupUrl.searchParams.set('next', safeRedirectPath);
        }
        const signupRedirect = NextResponse.redirect(signupUrl);
        setUserSessionCookie(signupRedirect);
        return signupRedirect;
      }
    } catch (error) {
      console.error('Failed to sync user profile', error);
    }
  }

  const finalRedirect = NextResponse.redirect(new URL(safeRedirectPath, requestUrl.origin));
  if (user) {
    setUserSessionCookie(finalRedirect);
  }
  return finalRedirect;
}
