import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import speakeasy from 'speakeasy';

// Verify and enable 2FA
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Verify admin authentication
    const adminCookie = cookieStore.get('admin_session');
    if (!adminCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { secret, token, targetAdminId } = await request.json();

    if (!secret || !token || !targetAdminId) {
      return NextResponse.json({ error: 'Secret, token, and target admin ID are required' }, { status: 400 });
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2
    });

    if (!verified) {
      return NextResponse.json({ error: '인증 코드가 올바르지 않습니다.' }, { status: 400 });
    }

    // Save secret and enable 2FA
    const { error: updateError } = await supabase
      .from('admin_users')
      .update({
        two_factor_secret: secret,
        two_factor_enabled: true
      })
      .eq('id', targetAdminId);

    if (updateError) {
      console.error('Error enabling 2FA:', updateError);
      return NextResponse.json({ error: 'Failed to enable 2FA' }, { status: 500 });
    }

    return NextResponse.json({ message: '2FA가 활성화되었습니다.' });
  } catch (error) {
    console.error('Error in POST /api/admin/auth/2fa/verify:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
