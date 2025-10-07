import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 via-white to-slate-50 px-6 py-16 text-center">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="mx-auto w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card shadow-lg">
          <Image
            src="/docu/archlegal-og.png"
            alt="ArchLegal"
            width={1200}
            height={630}
            className="h-auto w-full object-cover"
            priority
          />
        </div>
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.4em] text-primary">
            404
          </p>
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
            찾으시는 페이지가 보이지 않아요
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            입력한 주소가 잘못되었거나 이동된 페이지일 수 있어요.
            <br className="hidden sm:block" />
            아래 버튼을 눌러 다시 홈으로 돌아가거나 상담을 시작해 보세요.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/">홈으로 이동</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
