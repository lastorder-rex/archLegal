import Link from 'next/link';

const currentYear = new Date().getFullYear();

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background/80">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-base font-semibold text-foreground">ArchLegal</p>
          <p className="max-w-md leading-relaxed">
            불법 건축물의 합법화를 돕는 상담 서비스 ArchLegal은 신뢰할 수 있는 전문가 네트워크와 함께 안전한 건축 환경을 제공합니다.
          </p>
          <p className="text-xs">
            &copy; {currentYear} ArchLegal. All rights reserved.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end sm:text-right">
          <Link
            href="/privacy-policy"
            className="text-sm font-medium text-foreground transition-colors hover:text-primary hover:underline"
          >
            개인정보 처리방침
          </Link>
          <a
            href="mailto:interworldarch@nate.com"
            className="transition-colors hover:text-primary hover:underline"
          >
            interworldarch@nate.com
          </a>
          <a href="tel:01063531058" className="transition-colors hover:text-primary hover:underline">
            010-6353-1058
          </a>
        </div>
      </div>
    </footer>
  );
}