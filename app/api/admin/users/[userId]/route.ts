import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('admin_session');

    if (!sessionCookie) {
      return NextResponse.json({ error: '인증되지 않았습니다.' }, { status: 401 });
    }

    const { userId } = await params;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get user from public.users (primary source)
    const { data: publicUser, error: publicUserError } = await supabaseAdmin
      .from('users')
      .select('auth_id, legal_name, full_name, email, contact_phone, phone, birth_date, profile_completed, profile_completed_at, consent_terms_at, consent_privacy_at, created_at, updated_at')
      .eq('auth_id', userId)
      .maybeSingle();

    if (publicUserError) {
      console.error('Public user error:', publicUserError);
      return NextResponse.json({ error: '회원 정보 조회 실패' }, { status: 500 });
    }

    if (!publicUser) {
      return NextResponse.json({ error: '회원 정보를 찾을 수 없습니다.' }, { status: 404 });
    }

    // Get auth.users for login info
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (authError || !authData?.user) {
      console.error('Auth user error:', authError);
    }

    const authUser = authData?.user;

    const { count: consultationCount, error: consultationCountError } = await supabaseAdmin
      .from('consultations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_del', 'N');

    if (consultationCountError) {
      console.error('Consultation count error:', consultationCountError);
    }

    const { data: lastConsultation, error: lastConsultationError } = await supabaseAdmin
      .from('consultations')
      .select('created_at')
      .eq('user_id', userId)
      .eq('is_del', 'N')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastConsultationError) {
      console.error('Last consultation error:', lastConsultationError);
    }

    // Get payment count (paid only)
    const { count: paymentCount, error: paymentCountError } = await supabaseAdmin
      .from('user_payment_stages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('paid_at', 'is', null);

    if (paymentCountError) {
      console.error('Payment count error:', paymentCountError);
    }

    // Get last payment date (paid only)
    const { data: lastPayment, error: lastPaymentError } = await supabaseAdmin
      .from('user_payment_stages')
      .select('paid_at')
      .eq('user_id', userId)
      .not('paid_at', 'is', null)
      .order('paid_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastPaymentError) {
      console.error('Last payment error:', lastPaymentError);
    }

    return NextResponse.json({
      user: {
        id: publicUser.auth_id,
        legal_name: publicUser.legal_name || publicUser.full_name || '',
        email: publicUser.email ?? '',
        phone: publicUser.contact_phone || publicUser.phone || '',
        birth_date: publicUser.birth_date ?? null,
        profile_completed: publicUser.profile_completed,
        profile_completed_at: publicUser.profile_completed_at,
        consent_terms_at: publicUser.consent_terms_at,
        consent_privacy_at: publicUser.consent_privacy_at,
        created_at: publicUser.created_at,
        updated_at: publicUser.updated_at,
        last_sign_in_at: authUser?.last_sign_in_at ?? null,
        email_confirmed_at: authUser?.email_confirmed_at ?? null,
        user_metadata: authUser?.user_metadata ?? {},
        app_metadata: authUser?.app_metadata ?? {}
      },
      stats: {
        consultation_count: consultationCount ?? 0,
        payment_count: paymentCount ?? 0,
        last_consultation_at: lastConsultation?.created_at ?? null,
        last_payment_at: lastPayment?.paid_at ?? null
      }
    });
  } catch (error) {
    console.error('User detail API error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

