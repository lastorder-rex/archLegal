// 관리자(supercore) 페이지 공용 포매터
// 원칙: 각 페이지의 기존 구현을 "바디 그대로" 보존한다. 변형은 통일하지 않고 각각 별도 함수로 둔다.

// ── 상태 라벨맵 (payments/page 와 payments/[id] 가 완전 동일하여 공유) ──
export const statusLabelMap: Record<string, string> = {
  awaiting: '결제 대기',
  requested: '요청됨',
  paid: '결제 완료',
  locked: '잠금',
  canceled: '결제취소'
};

// ── 날짜/시간 포매터 ──

// 2자리 연도 · 가드 없음
// (consultations/page, users/page:formatDateTime, users/[userId]/consultations)
export function formatDateTimeShort(dateString: string) {
  const date = new Date(dateString);
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 2자리 연도 · null + NaN 가드
// (payments/page, users/[userId]/page)
export function formatDateTimeShortSafe(value: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 2자리 연도 · null 가드만 (NaN 가드 없음)
// (users/[userId]/payments)
export function formatDateTimeShortNullable(dateString: string | null) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 4자리 연도 · 가드 없음
// (admins/page)
export function formatDateTimeFull(dateString: string) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 4자리 연도 · null + NaN 가드
// (payments/[id]:formatDateTime)
export function formatDateTimeFullSafe(value: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 연도 생략 · null + NaN 가드
// (payments/[id]:formatDateTimeWithoutYear)
export function formatDateTimeNoYear(value: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}-${day} ${hours}:${minutes}`;
}

// toLocaleString('ko-KR') 형
// (consultations/[id]:formatDateTime)
export function formatDateTimeLocale(value: string | null | undefined) {
  if (!value) return '-';
  return new Date(value).toLocaleString('ko-KR');
}

// 날짜만(2자리 연도) · 가드 없음
// (users/page:formatDate)
export function formatDate(dateString: string) {
  const date = new Date(dateString);
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ── 금액 포매터 ──

// 숫자만 (Intl.NumberFormat ko-KR)
// (payments/page:formatAmount)
export function formatAmountNumber(value: number | null) {
  if (value === null || Number.isNaN(value)) return '-';
  return new Intl.NumberFormat('ko-KR').format(value);
}

// 통화 스타일 (Intl.NumberFormat currency KRW)
// (payments/[id]:formatAmount)
export function formatAmountCurrency(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return '-';
  }
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(value);
}

// "원" 붙임 · toLocaleString('ko-KR') · null|undefined 가드
// (consultations/[id]:formatCurrency)
export function formatAmountWonLocale(value: number | null | undefined) {
  if (value === null || value === undefined) return '-';
  return `${value.toLocaleString('ko-KR')}원`;
}

// "원" 붙임 · toLocaleString() (로케일 인자 없음) · null 가드
// (users/[userId]/payments:formatAmount)
export function formatAmountWon(amount: number | null) {
  if (amount === null) return '-';
  return `${amount.toLocaleString()}원`;
}
