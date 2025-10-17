'use client';

import { FormEvent, useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { UserProfile } from '@/types/profile';
import {
  validatePhoneInput,
  sanitizeLegalContactInfo,
  filterNameInput,
  filterPhoneInput,
  filterEmailInput,
  filterBirthDateInput,
  isAtLeastAge,
} from '@/lib/validations/user';

interface SignupFormProps {
  profile: UserProfile;
  nextPath: string;
  fallbackEmail: string | null;
}

type FormErrors = Partial<Record<'legalName' | 'contactPhone' | 'email' | 'birthDate' | 'consent', string>>;

type FormState = {
  legalName: string;
  contactPhone: string;
  email: string;
  birthDate: string;
  consentTerms: boolean;
  consentPrivacy: boolean;
};

export function SignupForm({ profile, nextPath, fallbackEmail }: SignupFormProps) {
  const router = useRouter();
  const initialState = useMemo<FormState>(
    () => ({
      legalName: profile.legal_name ?? profile.full_name ?? '',
      contactPhone: profile.contact_phone ?? profile.phone ?? '',
      email: profile.email ?? fallbackEmail ?? '',
      birthDate: profile.birth_date ?? '',
      consentTerms: Boolean(profile.consent_terms_at),
      consentPrivacy: Boolean(profile.consent_privacy_at)
    }),
    [
      fallbackEmail,
      profile.consent_privacy_at,
      profile.consent_terms_at,
      profile.contact_phone,
      profile.email,
      profile.full_name,
      profile.legal_name,
      profile.phone,
      profile.birth_date
    ]
  );
  const [formState, setFormState] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const legalNameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    legalNameInputRef.current?.focus();
  }, []);

  const handleInputChange = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      let nextValue = value;

      if (typeof value === 'string') {
        if (key === 'legalName') {
          nextValue = filterNameInput(value) as FormState[K];
        } else if (key === 'contactPhone') {
          nextValue = filterPhoneInput(value) as FormState[K];
        } else if (key === 'email') {
          nextValue = filterEmailInput(value) as FormState[K];
        } else if (key === 'birthDate') {
          nextValue = filterBirthDateInput(value) as FormState[K];
        }
      }

      setFormState(prev => ({ ...prev, [key]: nextValue }));

      setErrors(prev => {
        if (key === 'legalName' || key === 'contactPhone' || key === 'email' || key === 'birthDate') {
          return { ...prev, [key]: undefined };
        }

        if (key === 'consentTerms' || key === 'consentPrivacy') {
          return { ...prev, consent: undefined };
        }

        return prev;
      });
    },
    []
  );

  const handlePhoneBlur = useCallback(() => {
    if (!formState.contactPhone) return;
    const { formatted } = validatePhoneInput(formState.contactPhone);
    setFormState(prev => ({ ...prev, contactPhone: formatted }));
    setErrors(prev => ({ ...prev, contactPhone: undefined }));
  }, [formState.contactPhone]);

  const validate = useCallback(() => {
    const consentErrors: FormErrors = {};

    if (!formState.consentTerms || !formState.consentPrivacy) {
      consentErrors.consent = '이용약관 및 개인정보 처리방침 동의가 필요합니다.';
    }

    const validationResult = sanitizeLegalContactInfo({
      legalName: formState.legalName,
      contactPhone: formState.contactPhone,
      email: formState.email,
      birthDate: formState.birthDate,
    });

    if (!validationResult.success) {
      for (const issue of validationResult.error.issues) {
        const field = issue.path[0];
        if (typeof field === 'string') {
          consentErrors[field as keyof FormErrors] = issue.message;
        }
      }
      return { errors: consentErrors, sanitized: null };
    }

    const sanitized = validationResult.data;

    if (!sanitized.birthDate) {
      consentErrors.birthDate = '생년월일을 입력해주세요.';
    } else if (!isAtLeastAge(sanitized.birthDate, 14)) {
      consentErrors.birthDate = '만 14세 이상만 가입할 수 있습니다.';
    }

    return { errors: consentErrors, sanitized };
  }, [formState]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setServerError(null);

      const { errors: nextErrors, sanitized } = validate();

      if (!sanitized) {
        setErrors(nextErrors);
        return;
      }

      setFormState(prev => ({ ...prev, ...sanitized }));

      if (Object.keys(nextErrors).length > 0) {
        setErrors(nextErrors);
        return;
      }

      setErrors({});
      setSubmitting(true);
      const normalizedBirthDate = sanitized.birthDate ? sanitized.birthDate : undefined;

      try {
        const payload: Record<string, unknown> = {
          legalName: sanitized.legalName,
          contactPhone: sanitized.contactPhone,
          email: sanitized.email,
          consentTerms: formState.consentTerms,
          consentPrivacy: formState.consentPrivacy,
        };

        if (normalizedBirthDate) {
          payload.birthDate = normalizedBirthDate;
        }

        const response = await fetch('/api/users/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || '회원정보 저장 중 오류가 발생했습니다.');
        }

        router.refresh();
        router.push(nextPath || '/');
      } catch (error: any) {
        setServerError(error.message || '회원정보 저장에 실패했습니다.');
      } finally {
        setSubmitting(false);
      }
    },
    [formState, nextPath, router, validate]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="legalName" required>
            이름
          </Label>
          <Input
            id="legalName"
            ref={legalNameInputRef}
            autoFocus
            value={formState.legalName}
            onChange={event => handleInputChange('legalName', event.target.value)}
            placeholder="홍길동"
            error={Boolean(errors.legalName)}
          />
          {errors.legalName ? <p className="text-sm text-destructive">{errors.legalName}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactPhone" required>
            연락처
          </Label>
          <Input
            id="contactPhone"
            type="tel"
            value={formState.contactPhone}
            onChange={event => handleInputChange('contactPhone', event.target.value)}
            onBlur={handlePhoneBlur}
            placeholder="010-1234-5678"
            error={Boolean(errors.contactPhone)}
          />
          {errors.contactPhone ? (
            <p className="text-sm text-destructive">{errors.contactPhone}</p>
          ) : (
            <p className="text-xs text-muted-foreground">숫자만 입력해도 자동으로 형식이 맞춰집니다.</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="birthDate" required>
            생년월일
          </Label>
          <Input
            id="birthDate"
            type="date"
            required
            value={formState.birthDate}
            onChange={event => handleInputChange('birthDate', event.target.value)}
            error={Boolean(errors.birthDate)}
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
            type="email"
            value={formState.email}
            onChange={event => handleInputChange('email', event.target.value)}
            placeholder="example@email.com"
            error={Boolean(errors.email)}
          />
          {errors.email ? <p className="text-sm text-destructive">{errors.email}</p> : null}
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-border p-4">
        <p className="text-sm font-medium">동의 항목</p>
        <label className="flex items-start gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={formState.consentTerms}
            onChange={event => handleInputChange('consentTerms', event.target.checked)}
            className="mt-1 h-4 w-4"
          />
          <span>
            <span className="font-medium text-foreground">이용약관</span>에 동의합니다.{' '}
            <a className="underline" href="/terms-of-service" target="_blank" rel="noopener noreferrer">
              약관 보기
            </a>
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={formState.consentPrivacy}
            onChange={event => handleInputChange('consentPrivacy', event.target.checked)}
            className="mt-1 h-4 w-4"
          />
          <span>
            <span className="font-medium text-foreground">개인정보 처리방침</span>에 동의합니다.{' '}
            <a className="underline" href="/privacy-policy" target="_blank" rel="noopener noreferrer">
              정책 보기
            </a>
          </span>
        </label>
        {errors.consent ? <p className="text-sm text-destructive">{errors.consent}</p> : null}
      </div>

      {serverError ? <p className="text-sm text-destructive">{serverError}</p> : null}

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? '저장 중...' : '회원정보 저장하기'}
      </Button>
    </form>
  );
}
