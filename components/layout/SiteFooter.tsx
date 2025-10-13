import Link from 'next/link';

const currentYear = new Date().getFullYear();

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background/80">
      <div className="mx-auto w-full max-w-6xl px-6 py-10 text-sm text-muted-foreground">
        <div className="space-y-10">
          
          
          {/*
                <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">회사 소개</p>
                <p className="text-base font-semibold text-foreground">ArchLegal</p>
                <p className="max-w-2xl leading-relaxed">
                  불법 건축물의 합법화를 돕는 상담 서비스 ArchLegal은 신뢰할 수 있는 전문가 네트워크와 함께 안전한 건축 환경을 제공합니다.
                </p>
                </div>
          */}

          <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
            <div className="space-y-3">
             
              <div className="space-y-1 leading-relaxed">
                <p> &copy; {currentYear} ArchLegal. All rights reserved.</p>
                <p>사업자등록번호: 120-81-59920 | 
                대표: 김형준 |
                호스팅서비스: (주) 인터월드엔지니어링건축사사무소 </p>
                <p>주소: 서울특별시 금천구 벚꽃로 286, 1312호(가산동, 삼성리더스타워)</p>
              </div>
            </div>

            <div className="space-y-3 sm:text-right">
             
              <div className="flex flex-wrap gap-3 sm:justify-end">
                <Link
                  href="/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-foreground transition-colors hover:text-primary hover:underline"
                >
                  개인정보 처리방침
                </Link>
                <Link
                  href="/refund-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-foreground transition-colors hover:text-primary hover:underline"
                >
                  환불 정책
                </Link>
              </div>
              <a
                href="mailto:interworldarch@nate.com"
                className="transition-colors hover:text-primary hover:underline"
              >
                interworldarch@nate.com
              </a>
            </div>
          </div>
            
          {/*
                <div className="border-t border-border pt-6 text-xs">
                &copy; {currentYear} ArchLegal. All rights reserved.
                </div>
          */}
        </div>
      </div>
    </footer>
  );
}
