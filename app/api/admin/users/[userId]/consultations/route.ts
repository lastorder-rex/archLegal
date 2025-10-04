import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Check admin authentication
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('admin_session');

    if (!sessionCookie) {
      return NextResponse.json({ error: '인증되지 않았습니다.' }, { status: 401 });
    }

    const { userId } = await params;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');

    const offset = (page - 1) * limit;

    // Use service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get consultations for this user
    const { data: consultations, error: consultationsError } = await supabaseAdmin
      .from('consultations')
      .select('*')
      .eq('user_id', userId)
      .eq('is_del', 'N')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (consultationsError) {
      console.error('Consultations error:', consultationsError);
      return NextResponse.json({ error: '상담 내역 조회 실패' }, { status: 500 });
    }

    // Get total count
    const { count, error: countError } = await supabaseAdmin
      .from('consultations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_del', 'N');

    if (countError) {
      console.error('Count error:', countError);
    }

    return NextResponse.json({
      consultations: consultations || [],
      total: count || 0,
      page,
      limit
    });

  } catch (error) {
    console.error('User consultations API error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
