import { MyPagePaymentSuccess } from '@/components/mypage/MyPagePaymentSuccess';

type PaymentSuccessPageProps = {
  searchParams?: {
    orderId?: string;
    paymentKey?: string;
    amount?: string;
  };
};

export const revalidate = 0;

export default function PaymentSuccessPage({ searchParams }: PaymentSuccessPageProps) {
  return (
    <MyPagePaymentSuccess
      orderId={searchParams?.orderId}
      paymentKey={searchParams?.paymentKey}
      amount={searchParams?.amount}
    />
  );
}
