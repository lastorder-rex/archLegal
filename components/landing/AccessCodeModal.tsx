'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useCallback, useEffect, useState } from 'react';
import { CTAButton } from '../ui/cta-button';
import { X } from 'lucide-react';

// TODO(temporary-review-gate): Delete modal after review password requirement is retired.
interface AccessCodeModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  validateCode: (code: string) => boolean;
}

export function AccessCodeModal({ open, onClose, onSuccess, validateCode }: AccessCodeModalProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setCode('');
      setError(null);
    }
  }, [open]);

  const handleSubmit = useCallback(
    (event?: React.FormEvent<HTMLFormElement>) => {
      event?.preventDefault();
      if (validateCode(code)) {
        setError(null);
        onSuccess();
        setCode('');
      } else {
        setError('비밀번호가 올바르지 않습니다.');
      }
    },
    [code, onSuccess, validateCode]
  );

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
              <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-3xl border border-border bg-background p-6 shadow-xl transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <Dialog.Title className="text-xl font-semibold text-foreground">
                      내부 검토용 접속 코드
                    </Dialog.Title>
                    <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                      비밀번호를 입력하면 로그인 및 상담 기능을 사용할 수 있습니다.
                    </Dialog.Description>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full p-2 transition hover:bg-muted"
                    aria-label="닫기"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </div>
                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <label htmlFor="access-code" className="text-sm font-medium text-foreground">
                      비밀번호
                    </label>
                    <input
                      id="access-code"
                      type="password"
                      value={code}
                      onChange={(event) => setCode(event.target.value)}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-base shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="비밀번호를 입력하세요"
                      autoComplete="off"
                    />
                    {error ? <p className="text-sm text-destructive">{error}</p> : null}
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <CTAButton type="submit" className="sm:flex-1">
                      확인
                    </CTAButton>
                    <CTAButton type="button" tone="secondary" className="sm:flex-1" onClick={onClose}>
                      취소
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
