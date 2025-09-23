import Link from 'next/link';

export default function AuthErrorPage({ searchParams }: { searchParams: { reason?: string } }) {
  const reason = searchParams?.reason ?? 'unknown';

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
        <h1 className="text-2xl font-bold">로그인 오류</h1>
        <p className="text-sm text-muted-foreground">
          카카오 인증 중 문제가 발생했습니다. (사유: {reason})
        </p>
        <p className="text-xs text-muted-foreground opacity-80">
          카카오 개발자 콘솔에서 `account_email`과 `phone_number` 권한이 허용되어 있는지 확인한 뒤 다시 시도해주세요.
        </p>
        <Link
          href="/"
          className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          다시 시도하기
        </Link>
      </div>
    </main>
  );
}
