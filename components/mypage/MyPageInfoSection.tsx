'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  filterBirthDateInput,
  filterEmailInput,
  filterNameInput,
  filterPhoneInput,
  sanitizeLegalContactInfo,
  validatePhoneInput
} from '@/lib/validations/user';
import { useMyPageContext } from '@/components/mypage/MyPageContext';
import type { UserProfile } from '@/types/profile';

type FormState = {
  legalName: string;
  contactPhone: string;
  email: string;
  birthDate: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

type UpdateProfileResponse = {
  profile?: UserProfile;
  error?: string;
};

export function MyPageInfoSection() {
  const { profile, setProfile } = useMyPageContext();

  const initialFormState = useMemo<FormState>(
    () => ({
      legalName: profile.legal_name ?? profile.full_name ?? '',
      contactPhone: profile.contact_phone ?? profile.phone ?? '',
      email: profile.email ?? '',
      birthDate: profile.birth_date ?? ''
    }),
    [profile.birth_date, profile.contact_phone, profile.email, profile.full_name, profile.legal_name, profile.phone]
  );

  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    setFormState(initialFormState);
    setErrors({});
    setServerError(null);
  }, [initialFormState]);

  const handleChange = useCallback((key: keyof FormState, value: string) => {
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
  }, []);

  const handlePhoneBlur = useCallback(() => {
    if (!formState.contactPhone) return;
    const { formatted } = validatePhoneInput(formState.contactPhone);
    setFormState(prev => ({ ...prev, contactPhone: formatted }));
  }, [formState.contactPhone]);

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
            nextErrors[field as keyof FormState] = issue.message;
          }
        }
        setErrors(nextErrors);
        setSubmitting(false);
        return;
      }

      if (!validation.data.birthDate) {
        setErrors(prev => ({ ...prev, birthDate: '생년월일을 입력해주세요.' }));
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

        const data = (await response.json().catch(() => null)) as UpdateProfileResponse | null;

        if (!response.ok) {
          throw new Error(data?.error || '회원정보 저장에 실패했습니다.');
        }

        if (data?.profile) {
          setProfile(data.profile);
        }

        setSuccessMessage('회원정보가 저장되었습니다.');
      } catch (_error) {
        const error = _error as Error;
        setServerError(error.message || '회원정보 저장 중 오류가 발생했습니다.');
      } finally {
        setSubmitting(false);
      }
    },
    [formState.birthDate, formState.contactPhone, formState.email, formState.legalName, setProfile]
  );

  return (
    <section className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold">회원 정보</h2>
        <p className="text-sm text-muted-foreground">연락 가능한 이름과 휴대폰 번호를 확인하고 필요하면 수정해주세요.</p>
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
            <Label htmlFor="birthDate" required>
              생년월일
            </Label>
            <Input
              id="birthDate"
              type="date"
              required
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
  );
}
