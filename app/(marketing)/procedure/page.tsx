import Link from 'next/link';
import { SiteHeader } from '@/components/layout/SiteHeader';

const PDF_URL = 'https://rylclvdntoelktrameow.supabase.co/storage/v1/object/public/docu/interword_process.pdf';

export const metadata = {
  title: '양성화 절차 안내 | 양성화.com - 인건(仁建)',
  description: '위반 건축물 양성화의 전체 절차와 단계별 가이드를 확인하실 수 있습니다.'
};

export default function ProcedurePage() {
  return (
    <>
      <SiteHeader />

      <main className="min-h-screen bg-background">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 pt-2 pb-0">
          <header className="space-y-3">
            <p className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              절차 안내
            </p>
            <h1 className="text-3xl font-bold text-foreground">양성화 절차 안내</h1>
            <p className="text-sm text-muted-foreground">
              위반 건축물 양성화의 전체 절차와 단계별 가이드, 필요 서류 및 일정을 확인하실 수 있습니다.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={PDF_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
              >
                새 창에서 보기
              </Link>
              <Link
                href={PDF_URL}
                download
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                PDF 다운로드
              </Link>
            </div>
          </header>

          <section className="flex flex-col gap-4 pb-0">
            <object
              data={PDF_URL}
              type="application/pdf"
              className="h-[80vh] w-full rounded-xl border border-border bg-card"
              aria-label="양성화 절차 안내 PDF 뷰어"
            >
              <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">PDF 뷰어를 불러오지 못했습니다.</p>
                <p className="mt-2">
                  PDF를 다운로드하여 확인하려면{' '}
                  <Link href={PDF_URL} download className="text-primary underline underline-offset-4">
                    여기
                  </Link>
                  를 클릭하세요.
                </p>
              </div>
            </object>
          </section>
        </div>
      </main>
    </>
  );
}
