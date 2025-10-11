import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Update admin password
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();

    // Verify admin authentication
    const adminCookie = cookieStore.get('admin_session');
    if (!adminCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service role to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(newPassword)) {
      return NextResponse.json(
        {
          error: '비밀번호는 영문 대문자, 소문자, 숫자, 특수문자를 각각 하나 이상 포함해야 합니다.'
        },
        { status: 400 }
      );
    }

    // Get admin by ID
    const { data: admin, error: fetchError } = await supabase
      .from('admin_users')
      .select('password_hash')
      .eq('id', params.id)
      .single();

    if (fetchError || !admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json({ error: '현재 비밀번호가 일치하지 않습니다.' }, { status: 401 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    const { error: updateError } = await supabase
      .from('admin_users')
      .update({ password_hash: hashedPassword })
      .eq('id', params.id);

    if (updateError) {
      console.error('Error updating password:', updateError);
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error in PATCH /api/admin/admins/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Delete admin
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();

    // Verify admin authentication
    const adminCookie = cookieStore.get('admin_session');
    if (!adminCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service role to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Parse admin cookie to get current admin ID
    let currentAdminId;
    try {
      const cookieData = JSON.parse(adminCookie.value);
      currentAdminId = cookieData.adminId;
    } catch (e) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Prevent self-deletion
    if (currentAdminId === params.id) {
      return NextResponse.json({ error: '자기 자신은 삭제할 수 없습니다.' }, { status: 400 });
    }

    // Delete admin
    const { error } = await supabase
      .from('admin_users')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting admin:', error);
      return NextResponse.json({ error: 'Failed to delete admin' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/admin/admins/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
