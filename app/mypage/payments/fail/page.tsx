import Link from 'next/link';
import { Button } from '@/components/ui/button';

type PaymentFailPageProps = {
  searchParams?: {
    orderId?: string;
    code?: string;
    message?: string;
  };
};

export const revalidate = 0;

export default function PaymentFailPage({ searchParams }: PaymentFailPageProps) {
  return (
    <section className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <header className="space-y-1">
        <span className="inline-flex items-center rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
          결제 실패
        </span>
        <h2 className="text-xl font-semibold text-foreground">결제가 정상적으로 완료되지 않았습니다.</h2>
        <p className="text-sm text-muted-foreground">
          결제가 정상적으로 진행되지 않았습니다. 아래 오류 정보를 확인하거나 다시 시도해주세요.
        </p>
      </header>

      <ul className="space-y-2 rounded-xl border border-dashed border-destructive/30 bg-muted/30 p-4 text-sm text-foreground">
        {searchParams?.orderId ? (
          <li>
            <span className="font-semibold">주문번호</span> {searchParams.orderId}
          </li>
        ) : null}
        {searchParams?.code ? (
          <li>
            <span className="font-semibold">오류 코드</span> {searchParams.code}
          </li>
        ) : null}
        {searchParams?.message ? (
          <li>
            <span className="font-semibold">오류 메시지</span> {searchParams.message}
          </li>
        ) : null}
      </ul>

      <div className="flex flex-wrap gap-3">
        <Link href="/mypage/payments" className="inline-flex">
          <Button type="button" variant="outline">
            결제 다시 시도하기
          </Button>
        </Link>
      </div>
    </section>
  );
}
