import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createExpiredSessionResponse, isUserSessionExpired } from '@/lib/auth/user-session';

const updateProfileSchema = z.object({
  legalName: z.string().trim().min(2, '이름은 2글자 이상 입력해주세요').max(50, '이름은 50글자 이하로 입력해주세요'),
  contactPhone: z
    .string()
    .trim()
    .regex(/^010-\d{4}-\d{4}$/, '연락처 형식이 올바르지 않습니다.'),
  email: z
    .string()
    .trim()
    .max(100, '이메일은 100자 이하로 입력해주세요')
    .email('올바른 이메일 주소를 입력해주세요.')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  birthDate: z
    .string()
    .regex(/^(19|20)\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, '생년월일 형식이 올바르지 않습니다.')
    .optional()
    .or(z.literal('').transform(() => undefined))
    .or(z.null().transform(() => undefined)),
  consentTerms: z.literal(true, {
    invalid_type_error: '이용약관에 동의해주세요.'
  }),
  consentPrivacy: z.literal(true, {
    invalid_type_error: '개인정보 처리방침에 동의해주세요.'
  })
});

export async function PUT(request: Request) {
  const cookieStore = cookies();

  if (isUserSessionExpired(cookieStore)) {
    return createExpiredSessionResponse();
  }

  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const payload = await request.json();
  const result = updateProfileSchema.safeParse(payload);

  if (!result.success) {
    const message = result.error.errors?.[0]?.message ?? '입력값을 확인해주세요.';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { legalName, contactPhone, email, birthDate, consentTerms, consentPrivacy } = result.data;
  const now = new Date().toISOString();

  const updatePayload = {
    legal_name: legalName,
    contact_phone: contactPhone,
    full_name: legalName,
    phone: contactPhone,
    profile_completed: true,
    profile_completed_at: now,
    consent_terms_at: consentTerms ? now : null,
    consent_privacy_at: consentPrivacy ? now : null,
    updated_at: now
  } as Record<string, unknown>;

  if (email) {
    updatePayload.email = email;
  }

  updatePayload.birth_date = birthDate ?? null;

  const { data, error } = await supabase
    .from('users')
    .update(updatePayload)
    .eq('auth_id', session.user.id)
    .select(
      'auth_id, full_name, email, phone, legal_name, contact_phone, profile_completed, profile_completed_at, consent_terms_at, consent_privacy_at, contact_phone_verified_at, birth_date'
    )
    .single();

  if (error) {
    console.error('Failed to update profile', error);
    return NextResponse.json({ error: '회원정보 저장에 실패했습니다.' }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}
