'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Megaphone } from 'lucide-react';
import { AboutContent } from '@/components/landing/AboutContent';

interface AboutModalProps {
  open: boolean;
  onClose: () => void;
  faqs: ReadonlyArray<{ question: string; answer: string }>;
}

export function AboutModal({ open, onClose, faqs }: AboutModalProps) {
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
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-3xl border border-border bg-background shadow-xl transition-all">
                <div className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
                  <div>
                    <Dialog.Title className="flex items-center gap-2 text-xl font-semibold text-foreground">
                      <Megaphone className="h-6 w-6 text-primary" aria-hidden />
                      우리는 이런 문제를 해결합니다
                    </Dialog.Title>
                    <Dialog.Description className="mt-1 text-base text-muted-foreground">
                      위반 건축물 양성화를 통해 법적 리스크와 재산 손실을 줄이고 안전한 시장 환경을 만듭니다.
                    </Dialog.Description>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full p-2 transition-colors hover:bg-muted"
                    aria-label="닫기"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="max-h-[calc(100vh-200px)] space-y-8 overflow-y-auto px-6 py-8">
                  <AboutContent faqs={faqs} />
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
