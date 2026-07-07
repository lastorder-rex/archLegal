import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { verifyAdminSession } from '@/lib/admin/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Disable 2FA
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAdminSession();
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const adminId = authResult.adminId;

    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    // Get admin password
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { data: admin, error: fetchError } = await supabase
      .from('admin_users')
      .select('password_hash')
      .eq('id', adminId)
      .single();

    if (fetchError || !admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
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
