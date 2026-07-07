import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { verifyAdminSession } from '@/lib/admin/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminSession();
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // Use service role to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get all admin users
    const { data: admins, error } = await supabase
      .from('admin_users')
      .select('id, username, created_at, two_factor_enabled')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admins:', error);
      return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 });
    }

    return NextResponse.json({ admins });
  } catch (error) {
    console.error('Error in GET /api/admin/admins:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create new admin
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAdminSession();
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // Use service role to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const { data, error } = await supabase
      .from('admin_users')
      .insert([
        {
          username,
          password_hash: hashedPassword
        }
      ])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: '이미 존재하는 아이디입니다.' }, { status: 409 });
      }
      console.error('Error creating admin:', error);
      return NextResponse.json({ error: 'Failed to create admin' }, { status: 500 });
    }

    return NextResponse.json({
      admin: {
        id: data.id,
        username: data.username,
        created_at: data.created_at
      }
    });
  } catch (error) {
    console.error('Error in POST /api/admin/admins:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
