'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useCallback, useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { CTAButton } from '../ui/cta-button';

interface ConsultationModalProps {
  open: boolean;
  onClose: () => void;
}

type FormFields = {
  name: string;
  phone: string;
  email: string;
  message: string;
};

const emptyForm: FormFields = {
  name: '',
  phone: '',
  email: '',
  message: ''
};

const emptyErrors: FormFields = {
  name: '',
  phone: '',
  email: '',
  message: ''
};

export function ConsultationModal({ open, onClose }: ConsultationModalProps) {
  const [formValues, setFormValues] = useState<FormFields>(emptyForm);
  const [errors, setErrors] = useState<FormFields>(emptyErrors);
  const [formStatus, setFormStatus] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleFieldChange = useCallback(
    (field: keyof FormFields) =>
      (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        let { value } = event.target;

        if (field === 'phone') {
          value = value.replace(/[^0-9-]/g, '');
        } else if (field === 'email') {
          value = value.replace(/[^A-Za-z0-9@._-]/g, '');
        }

        setFormValues((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: '' }));
        setFormStatus(null);
      },
    []
  );

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const nextErrors: Partial<FormFields> = {};

      if (!formValues.name.trim()) {
        nextErrors.name = '성함을 입력해주세요.';
      }

      if (!formValues.phone.trim()) {
        nextErrors.phone = '연락처를 입력해주세요.';
      }

      if (!formValues.email.trim()) {
        nextErrors.email = '이메일 주소를 입력해주세요.';
      }

      if (!formValues.message.trim()) {
        nextErrors.message = '상담 요청 사항을 입력해주세요.';
      }

      if (Object.keys(nextErrors).length > 0) {
        setErrors({
          name: nextErrors.name ?? '',
          phone: nextErrors.phone ?? '',
          email: nextErrors.email ?? '',
          message: nextErrors.message ?? ''
        });
        setFormStatus('필수 항목을 모두 입력한 뒤 상담 요청을 보내주세요.');
        return;
      }

      setErrors({ ...emptyErrors });
      setFormStatus('요청이 접수되었습니다. 곧 연락드리겠습니다!');
      setFormValues({ ...emptyForm });
      setHasSubmitted(true);
    },
    [formValues]
  );

  const hasErrors = Boolean(errors.name || errors.phone || errors.email || errors.message);

  useEffect(() => {
    if (open) {
      setFormValues({ ...emptyForm });
      setErrors({ ...emptyErrors });
      setFormStatus(null);
      setHasSubmitted(false);
    }
  }, [open]);

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-3xl border border-border bg-background p-8 shadow-xl transition-all bg-opacity-95">
                <Dialog.Title className="text-2xl font-semibold text-foreground">무료 상담 신청</Dialog.Title>
                <Dialog.Description className="mt-2 text-sm text-muted-foreground">
                  연락처와 상황을 남겨주시면 30년 경력의 전문가가 빠르게 도와드립니다.
                </Dialog.Description>

                <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
                  <div>
                    <label className="text-sm font-medium text-foreground" htmlFor="name">
                      성함
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="홍길동"
                      className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground shadow-inner focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-40"
                      value={formValues.name}
                      onChange={handleFieldChange('name')}
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={errors.name ? 'consult-name-error' : undefined}
                      required
                    />
                    {errors.name ? (
                      <p id="consult-name-error" className="mt-2 text-xs text-red-400">
                        {errors.name}
                      </p>
                    ) : null}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-foreground" htmlFor="phone">
                        연락처
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        inputMode="tel"
                        placeholder="010-0000-0000"
                        className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground shadow-inner focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-40"
                        value={formValues.phone}
                        onChange={handleFieldChange('phone')}
                        aria-invalid={Boolean(errors.phone)}
                        aria-describedby={errors.phone ? 'consult-phone-error' : undefined}
                        required
                      />
                      {errors.phone ? (
                        <p id="consult-phone-error" className="mt-2 text-xs text-red-400">
                          {errors.phone}
                        </p>
                      ) : null}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground" htmlFor="email">
                        이메일
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        inputMode="email"
                        placeholder="you@example.com"
                        className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground shadow-inner focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-40"
                        value={formValues.email}
                        onChange={handleFieldChange('email')}
                        aria-invalid={Boolean(errors.email)}
                        aria-describedby={errors.email ? 'consult-email-error' : undefined}
                        required
                      />
                      {errors.email ? (
                        <p id="consult-email-error" className="mt-2 text-xs text-red-400">
                          {errors.email}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground" htmlFor="message">
                      상담 요청 사항
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      placeholder="현재 건축물 상황과 상담을 원하는 내용을 입력해주세요."
                      className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground shadow-inner focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-40"
                      value={formValues.message}
                      onChange={handleFieldChange('message')}
                      aria-invalid={Boolean(errors.message)}
                      aria-describedby={errors.message ? 'consult-message-error' : undefined}
                      required
                    />
                    {errors.message ? (
                      <p id="consult-message-error" className="mt-2 text-xs text-red-400">
                        {errors.message}
                      </p>
                    ) : null}
                  </div>
                  {formStatus ? (
                    <p className={`text-sm ${hasErrors ? 'text-red-400' : 'text-emerald-400'}`}>
                      {formStatus}
                    </p>
                  ) : null}
                  <div className="flex gap-3 pt-4">
                    <CTAButton type="submit" className="w-full" disabled={hasSubmitted}>
                      상담 요청 보내기
                    </CTAButton>
                    <CTAButton type="button" tone="secondary" className="w-full" onClick={onClose}>
                      닫기
                    </CTAButton>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
