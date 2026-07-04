import { FileText } from 'lucide-react';
import { LAW_FULL_TEXT } from '@/lib/constants/special-act';

// 법령 원문 전문 접이식(server component).
const LAW_GO_KR_URL = 'https://www.law.go.kr/법령/특정건축물정리에관한특별조치법';

export function LawFullText() {
  return (
    <details className="group rounded-2xl border border-border sa-paper-panel p-5 sm:p-6">
      <summary className="flex cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background/70"
          aria-hidden
        >
          <FileText className="h-[18px] w-[18px] text-muted-foreground" />
        </span>
        <span className="sa-serif text-base font-bold text-foreground sm:text-lg">
          법령 원문 전문 보기 (법률 제21820호)
        </span>
        <span
          className="ml-auto text-lg text-muted-foreground transition group-open:rotate-45"
          aria-hidden
        >
          +
        </span>
      </summary>
      <div className="mt-6 space-y-6">
        {LAW_FULL_TEXT.map(article => (
          <article key={article.heading}>
            <h3 className="sa-serif text-sm font-bold text-foreground">{article.heading}</h3>
            <p className="mt-1.5 whitespace-pre-line text-sm leading-7 text-muted-foreground">
              {article.body}
            </p>
          </article>
        ))}
        <p className="border-t border-border pt-4 text-xs text-muted-foreground">
          출처: 국가법령정보센터(law.go.kr) —{' '}
          <a
            href={LAW_GO_KR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            특정건축물 정리에 관한 특별조치법 원문 보기
          </a>
        </p>
      </div>
    </details>
  );
}
