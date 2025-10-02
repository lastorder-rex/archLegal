import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

// Disable 2FA
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Verify admin authentication
    const adminCookie = cookieStore.get('admin_session');
    if (!adminCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse admin cookie to get admin ID
    let adminId;
    try {
      const cookieData = JSON.parse(adminCookie.value);
      adminId = cookieData.adminId;
    } catch (e) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    // Get admin password
    const { data: admin, error: fetchError } = await supabase
      .from('admin_users')
      .select('password')
      .eq('id', adminId)
      .single();

    if (fetchError || !admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: '비밀번호가 올바르지 않습니다.' }, { status: 401 });
    }

    // Disable 2FA
    const { error: updateError } = await supabase
      .from('admin_users')
      .update({
        two_factor_secret: null,
        two_factor_enabled: false
      })
      .eq('id', adminId);

    if (updateError) {
      console.error('Error disabling 2FA:', updateError);
      return NextResponse.json({ error: 'Failed to disable 2FA' }, { status: 500 });
    }

    return NextResponse.json({ message: '2FA가 비활성화되었습니다.' });
  } catch (error) {
    console.error('Error in POST /api/admin/auth/2fa/disable:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
