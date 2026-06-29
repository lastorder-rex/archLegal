import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import AuthPanel from '@/components/auth/AuthPanel';
import type { UserProfile } from '@/types/profile';
import { isUserSessionExpired } from '@/lib/auth/user-session';

export const revalidate = 0;

type LoginPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session }
  } = await supabase.auth.getSession();

  const activeSession = isUserSessionExpired(cookieStore) ? null : session;

  let profile: UserProfile | null = null;
  const authErrorParam = searchParams?.auth_error ?? searchParams?.error;
  const authError = Array.isArray(authErrorParam) ? authErrorParam[0] : authErrorParam;

  if (activeSession?.user) {
    const { data: profileRows } = await supabase
      .from('users')
      .select(
        'auth_id, full_name, email, phone, legal_name, contact_phone, profile_completed, profile_completed_at, consent_terms_at, consent_privacy_at, contact_phone_verified_at, birth_date'
      )
      .eq('auth_id', activeSession.user.id)
      .limit(1);

    const data = profileRows?.[0] as UserProfile | undefined;

    if (data) {
      profile = data;
    } else {
      profile = {
        auth_id: activeSession.user.id,
        full_name:
          (activeSession.user.user_metadata?.name ||
            activeSession.user.user_metadata?.full_name ||
            activeSession.user.email) ?? null,
        email: activeSession.user.email ?? null,
        phone: activeSession.user.phone ?? null,
        legal_name: null,
        contact_phone: null,
        profile_completed: false,
        profile_completed_at: null,
        consent_terms_at: null,
        consent_privacy_at: null,
        contact_phone_verified_at: null,
        birth_date: null
      };
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[4fr_6fr]">
      {/* 좌: 브랜드 패널 (데스크톱) */}
      <aside className="relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex xl:p-16">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#1d7a64] via-[#15584a] to-[#0a2c25]" />
        <div className="absolute -left-24 -top-24 -z-10 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-16 -z-10 h-96 w-96 rounded-full bg-emerald-300/10 blur-3xl" />

        <Link href="/" className="relative flex w-fit items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/95 shadow-lg">
            <Image src="/docu/logo.png" alt="" width={24} height={24} />
          </span>
          <span className="text-lg font-extrabold tracking-tight">
            양성화<span className="text-emerald-200">.com</span>
          </span>
        </Link>

        <div className="relative max-w-md space-y-7">
          <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur">
            2026 특정건축물 정리 특별조치법 대비
          </span>
          <h2 className="text-[2.15rem] font-extrabold leading-[1.25] tracking-tight">
            내 집 위반건축물,
            <br />
            <span className="text-emerald-200">양성화 가능성</span>부터
            <br />
            확인하세요.
          </h2>
          <p className="max-w-sm text-[0.95rem] leading-7 text-emerald-50/80">
            3D로 위반 부위를 직접 짚고, 1분 자가진단·전문가 상담·이행강제금 계산까지 — 양성화의 모든 과정을 한 곳에서.
          </p>
          <ul className="space-y-3.5 pt-1 text-[0.95rem] font-medium text-emerald-50/90">
            {[
              '3D로 보는 12개 대표 위반사례 진단',
              '1분 자가진단 + 건축사 무료 상담',
              '이행강제금 추정 계산까지 한 번에',
            ].map(t => (
              <li key={t} className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 flex-none text-emerald-300" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-emerald-50/55">
          인터월드건축사사무소 · 인건(仁建) — 위반건축물 양성화 전문
        </p>
      </aside>

      {/* 우: 로그인 */}
      <div className="flex items-center justify-center bg-background px-6 py-14">
        <div className="w-full max-w-[464px]">
          <Link href="/" className="mb-9 flex w-fit items-center gap-2 lg:hidden">
            <Image src="/docu/logo.png" alt="" width={30} height={30} />
            <span className="text-lg font-extrabold">
              양성화<span className="text-primary">.com</span>
            </span>
          </Link>
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <AuthPanel
              sessionUser={activeSession?.user ?? null}
              profile={profile}
              authError={authError}
            />
          </div>
          <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
            로그인 시{' '}
            <Link href="/terms-of-service" className="font-medium text-foreground underline-offset-2 hover:underline">
              이용약관
            </Link>{' '}
            및{' '}
            <Link href="/privacy-policy" className="font-medium text-foreground underline-offset-2 hover:underline">
              개인정보처리방침
            </Link>
            에 동의하게 됩니다.
          </p>
        </div>
      </div>
    </main>
  );
}
