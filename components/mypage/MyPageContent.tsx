'use client';

import { FormEvent, useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';
import { HouseHeart, Expand } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { UserProfile } from '@/types/profile';
import {
  filterEmailInput,
  filterNameInput,
  filterPhoneInput,
  filterBirthDateInput,
  sanitizeLegalContactInfo,
  validatePhoneInput
} from '@/lib/validations/user';

type ConsultationSummary = {
  id: string;
  created_at: string;
  address: string;
  address_detail: string | null;
  main_purps: string | null;
  tot_area: number | null;
  plat_area: number | null;
  ground_floor_cnt: number | null;
  message: string | null;
  email?: string | null;
  phone?: string | null;
  attachments?: {
    name: string;
    storagePath: string;
  }[] | null;
};

type FormState = {
  legalName: string;
  contactPhone: string;
  email: string;
  birthDate: string;
};

type FormErrors = Partial<Record<'legalName' | 'contactPhone' | 'email' | 'birthDate', string>>;

interface MyPageContentProps {
  profile: UserProfile;
  fallbackEmail: string | null;
  consultations: ConsultationSummary[];
}

type PaymentStageStatus = 'locked' | 'requested' | 'awaiting' | 'paid';

interface PaymentStageCard {
  id: string;
  title: string;
  description: string;
  amount?: number;
  status: PaymentStageStatus;
  updatedAt?: string;
  nextActionLabel?: string;
  disabled?: boolean;
}

const tabs = [
  { id: 'info', label: '정보수정' },
  { id: 'consultations', label: '상담내역' },
  { id: 'payments', label: '결제내역' }
] as const;

type TabId = (typeof tabs)[number]['id'];

export function MyPageContent({ profile, fallbackEmail, consultations }: MyPageContentProps) {
  const initialFormState = useMemo<FormState>(
    () => ({
      legalName: profile.legal_name ?? profile.full_name ?? '',
      contactPhone: profile.contact_phone ?? profile.phone ?? '',
      email: profile.email ?? '',
      birthDate: profile.birth_date ?? ''
    }),
    [profile.contact_phone, profile.email, profile.full_name, profile.legal_name, profile.phone, profile.birth_date]
  );

  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('info');
  const [selectedConsultationId, setSelectedConsultationId] = useState<string | null>(null);
  const router = useRouter();

  const handleChange = useCallback(
    (key: keyof FormState, value: string) => {
      let nextValue = value;
      if (key === 'legalName') {
        nextValue = filterNameInput(value);
      } else if (key === 'contactPhone') {
        nextValue = filterPhoneInput(value);
      } else if (key === 'email') {
        nextValue = filterEmailInput(value);
      } else if (key === 'birthDate') {
        nextValue = filterBirthDateInput(value);
      }

      setFormState(prev => ({ ...prev, [key]: nextValue }));
      setErrors(prev => ({ ...prev, [key]: undefined }));
      setServerError(null);
      setSuccessMessage(null);
    },
    []
  );

  const handlePhoneBlur = useCallback(() => {
    if (!formState.contactPhone) return;
    const { formatted } = validatePhoneInput(formState.contactPhone);
    setFormState(prev => ({ ...prev, contactPhone: formatted }));
  }, [formState.contactPhone]);

  const handleConsultationNavigate = useCallback((id: string) => {
    router.push(`/request/history?id=${id}`);
  }, [router]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSubmitting(true);
      setServerError(null);
      setSuccessMessage(null);

      const validation = sanitizeLegalContactInfo({
        legalName: formState.legalName,
        contactPhone: formState.contactPhone,
        email: formState.email,
        birthDate: formState.birthDate
      });

      if (!validation.success) {
        const nextErrors: FormErrors = {};
        for (const issue of validation.error.issues) {
          const field = issue.path[0];
          if (typeof field === 'string') {
            nextErrors[field as keyof FormErrors] = issue.message;
          }
        }
        setErrors(nextErrors);
        setSubmitting(false);
        return;
      }

      try {
        const payload: Record<string, unknown> = {
          legalName: validation.data.legalName,
          contactPhone: validation.data.contactPhone,
          email: validation.data.email,
          consentTerms: true,
          consentPrivacy: true
        };

        if (validation.data.birthDate) {
          payload.birthDate = validation.data.birthDate;
        }

        const response = await fetch('/api/users/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || '회원정보 저장에 실패했습니다.');
        }

        setSuccessMessage('회원정보가 저장되었습니다.');
        router.refresh();
      } catch (error: any) {
        setServerError(error.message || '회원정보 저장 중 오류가 발생했습니다.');
      } finally {
        setSubmitting(false);
      }
    },
    [formState.contactPhone, formState.email, formState.legalName, formState.birthDate, router]
  );

  const goHome = useCallback(() => {
    router.push('/');
  }, [router]);

  const goHistory = useCallback(() => {
    router.push('/request/history');
  }, [router]);

  const handlePaymentNavigate = useCallback((stageId: string) => {
    // TODO: 결제 단계별 라우팅 연동 예정
    console.info('Navigate to payment stage:', stageId);
  }, []);

  const handleTabSelect = useCallback((tabId: TabId) => {
    setActiveTab(tabId);
    if (tabId !== 'consultations') {
      setSelectedConsultationId(null);
    }
  }, []);

  const selectedConsultation = useMemo(
    () => consultations.find(item => item.id === selectedConsultationId) ?? null,
    [consultations, selectedConsultationId]
  );

  const paymentStages = useMemo<PaymentStageCard[]>(() => {
    const latestConsultation = consultations[0] ?? null;

    return [
      {
        id: 'stage-site-survey',
        title: '1단계 · 현장 답사 및 상담 비용',
        description:
          '현장 답사를 위한 기본 상담 수수료를 결제해주세요. 결제가 완료되어야 일정 조율이 진행됩니다.',
        amount: 88000,
        status: 'awaiting',
        updatedAt: latestConsultation?.created_at ?? undefined,
        nextActionLabel: '결제 진행',
      },
      {
        id: 'stage-legalization',
        title: '2단계 · 양성화 대행 서비스',
        description:
          '양성화 대행 계약이 확정되면 관리자가 결제를 활성화합니다. 활성화 전까지는 준비 상태로 표시됩니다.',
        amount: undefined,
        status: 'locked',
        nextActionLabel: '관리자 승인 대기',
        disabled: true,
      },
    ];
  }, [consultations]);

  const paymentStatusLabel: Record<PaymentStageStatus, { text: string; className: string }> = {
    locked: { text: '활성화 대기', className: 'bg-slate-200 text-slate-700' },
    requested: { text: '결제 요청됨', className: 'bg-blue-50 text-blue-700 border border-blue-200' },
    awaiting: { text: '결제 대기', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
    paid: { text: '결제 완료', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-foreground">마이페이지</h2>
          <p className="text-sm text-muted-foreground">필요한 메뉴를 선택해 정보를 확인하거나 수정하세요.</p>
        </div>
        <Link href="/">
          <Button type="button" variant="outline" className="flex w-auto items-center gap-2">
            <HouseHeart className="h-4 w-4" aria-hidden />
            홈으로 돌아가기
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-6 md:flex-row">
        <nav className="flex flex-wrap gap-2 md:w-56 md:flex-col">
          {tabs.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabSelect(tab.id)}
                className={clsx(
                  'flex-1 rounded-xl border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 md:flex-none',
                  active
                    ? 'border-primary bg-primary text-primary-foreground shadow'
                    : 'border-border bg-background text-muted-foreground hover:bg-muted/70'
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="flex-1">
          {activeTab === 'info' ? (
            <section className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
              <header className="space-y-1">
                <h2 className="text-xl font-semibold">회원 정보</h2>
                <p className="text-sm text-muted-foreground">
                  연락 가능한 이름과 휴대폰 번호를 확인하고 필요하면 수정해주세요.
                </p>
              </header>
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="legalName" required>
                      이름
                    </Label>
                    <Input
                      id="legalName"
                      value={formState.legalName}
                      onChange={event => handleChange('legalName', event.target.value)}
                      placeholder="이름을 입력하세요"
                    />
                    {errors.legalName ? <p className="text-sm text-destructive">{errors.legalName}</p> : null}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone" required>
                      휴대폰 번호
                    </Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      value={formState.contactPhone}
                      onChange={event => handleChange('contactPhone', event.target.value)}
                      onBlur={handlePhoneBlur}
                      placeholder="010-1234-5678"
                    />
                    {errors.contactPhone ? <p className="text-sm text-destructive">{errors.contactPhone}</p> : null}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="birthDate">생년월일 (선택)</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={formState.birthDate}
                      onChange={event => handleChange('birthDate', event.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                    />
                    {errors.birthDate ? (
                      <p className="text-sm text-destructive">{errors.birthDate}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">YYYY-MM-DD 형식으로 입력해주세요.</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">이메일 (선택)</Label>
                    <Input
                      id="email"
                      value={formState.email}
                      onChange={event => handleChange('email', event.target.value)}
                      placeholder="이메일을 입력하세요"
                    />
                    {errors.email ? <p className="text-sm text-destructive">{errors.email}</p> : null}
                  </div>
                </div>

                {serverError ? <p className="text-sm text-destructive">{serverError}</p> : null}
                {successMessage ? <p className="text-sm text-emerald-600">{successMessage}</p> : null}

                <div className="flex flex-wrap items-center gap-3">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? '저장 중...' : '회원정보 저장'}
                  </Button>
                  <p className="text-xs text-muted-foreground">수정 내용은 상담 요청 시 바로 적용됩니다.</p>
                </div>
              </form>
            </section>
          ) : null}

          {activeTab === 'consultations' ? (
            <section className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
              <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">상담 내역</h2>
                  <p className="text-sm text-muted-foreground">
                    최근 상담 요청을 확인하고 필요한 상담을 선택해 상세 내용을 볼 수 있습니다.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {selectedConsultation ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSelectedConsultationId(null)}
                    >
                      상담 내역 목록으로
                    </Button>
                  ) : null}
                  <Button type="button" variant="outline" onClick={goHistory}>
                    상담 내역 페이지로 이동
                  </Button>
                </div>
              </header>
              {consultations.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
                  아직 등록된 상담 내역이 없습니다. 상담을 진행하려면 상단의 무료 상담 신청 버튼을 이용해주세요.
                </p>
              ) : selectedConsultation ? (
                <article className="space-y-6 rounded-xl border border-border bg-secondary p-5 shadow-sm">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      등록일 {new Date(selectedConsultation.created_at).toLocaleString('ko-KR')}
                    </p>
                    <h3 className="text-lg font-semibold text-foreground">
                      {selectedConsultation.address}
                      {selectedConsultation.address_detail ? ` ${selectedConsultation.address_detail}` : ''}
                    </h3>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 text-sm">
                    {selectedConsultation.phone ? (
                      <div>
                        <p className="text-muted-foreground">연락처</p>
                        <p className="font-medium">{selectedConsultation.phone}</p>
                      </div>
                    ) : null}
                    {selectedConsultation.email ? (
                      <div>
                        <p className="text-muted-foreground">이메일</p>
                        <p className="font-medium">{selectedConsultation.email}</p>
                      </div>
                    ) : null}
                    <div>
                      <p className="text-muted-foreground">주용도</p>
                      <p className="font-medium">
                        {selectedConsultation.main_purps ?? '정보 없음'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">연면적</p>
                      <p className="font-medium">
                        {selectedConsultation.tot_area
                          ? `${selectedConsultation.tot_area.toLocaleString()}㎡`
                          : '정보 없음'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">대지면적</p>
                      <p className="font-medium">
                        {selectedConsultation.plat_area
                          ? `${selectedConsultation.plat_area.toLocaleString()}㎡`
                          : '정보 없음'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">지상층수</p>
                      <p className="font-medium">
                        {selectedConsultation.ground_floor_cnt ?? '정보 없음'}
                      </p>
                    </div>
                  </div>

                  <section className="space-y-2">
                    <h4 className="text-sm font-semibold text-foreground">상담 요청 내용</h4>
                    <div className="rounded-lg border border-border bg-muted/10 p-4 text-sm text-foreground whitespace-pre-wrap">
                      {selectedConsultation.message ?? '상담 요청 메시지가 없습니다.'}
                    </div>
                  </section>

                  {!!selectedConsultation.attachments?.length && (
                    <section className="space-y-2">
                      <h4 className="text-sm font-semibold text-foreground">첨부파일</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        {selectedConsultation.attachments.map((attachment, index) => (
                          <li key={`${attachment.storagePath}-${index}`} className="rounded border border-border px-3 py-2">
                            {attachment.name}
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </article>
              ) : (
                <div className="space-y-4">
                  {consultations.map(item => (
                    <article
                      key={item.id}
                      className="rounded-xl border border-border bg-card p-4 shadow-md transition hover:border-primary hover:ring-2 hover:ring-primary hover:ring-opacity-40"
                    >
                      <header
                        role="button"
                        tabIndex={0}
                        onClick={() => handleConsultationNavigate(item.id)}
                        onKeyDown={event => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            handleConsultationNavigate(item.id);
                          }
                        }}
                        className="flex cursor-pointer flex-col gap-1 transition hover:text-primary sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-foreground" style={{ pointerEvents: 'none' }}>
                            {item.address}
                            {item.address_detail ? ` ${item.address_detail}` : ''}
                          </h3>
                          <Expand className="h-4 w-4 text-primary" aria-hidden />
                        </div>
                        <time className="text-xs text-muted-foreground">
                          {new Date(item.created_at).toLocaleString('ko-KR')}
                        </time>
                      </header>
                      {item.message ? (
                        <p
                          className="mt-3 cursor-pointer text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap"
                          onClick={() => handleConsultationNavigate(item.id)}
                        >
                          {item.message}
                        </p>
                      ) : (
                        <p className="mt-3 text-sm text-muted-foreground">작성된 상담 내용이 없습니다.</p>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {activeTab === 'payments' ? (
            <section className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
              <header className="space-y-2">
                <h2 className="text-xl font-semibold">결제 내역</h2>
                <p className="text-sm text-muted-foreground">
                  단계별 결제를 통해 양성화 서비스를 진행합니다. 결제 요청이 활성화되면 알림과 함께 카드가 열립니다.
                </p>
              </header>

              <div className="grid gap-4">
                {paymentStages.map(stage => {
                  const statusMeta = paymentStatusLabel[stage.status];
                  const isDisabled = stage.disabled || stage.status === 'locked';

                  return (
                    <article
                      key={stage.id}
                      className={clsx(
                        'space-y-4 rounded-xl border border-border bg-secondary/40 p-5 shadow-sm transition',
                        !isDisabled && 'hover:border-primary hover:shadow-md'
                      )}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-lg font-semibold text-foreground">{stage.title}</h3>
                            <span
                              className={clsx(
                                'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
                                statusMeta.className
                              )}
                            >
                              {statusMeta.text}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground whitespace-pre-line">{stage.description}</p>
                        </div>
                        <div className="text-right">
                          {stage.amount ? (
                            <p className="text-lg font-semibold text-foreground">
                              {stage.amount.toLocaleString()}원
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground"></p>
                          )}
                          {stage.updatedAt ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                              업데이트: {new Date(stage.updatedAt).toLocaleString('ko-KR')}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs text-muted-foreground">
                          {stage.status === 'paid'
                            ? '결제가 완료되었습니다. 추가 안내는 담당자가 별도로 연락드립니다.'
                            : stage.status === 'locked'
                              ? '관리자가 결제를 활성화하면 웹 알림과 함께 진행 가능해집니다.'
                              : '결제를 진행하면 서비스가 다음 단계로 이동합니다.'}
                        </p>
                        <Button
                          type="button"
                          variant={isDisabled ? 'outline' : 'primary'}
                          disabled={isDisabled}
                          onClick={() => handlePaymentNavigate(stage.id)}
                        >
                          {stage.nextActionLabel ?? '상세보기'}
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
