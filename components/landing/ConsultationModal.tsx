'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { CTAButton } from '../ui/cta-button';

interface ConsultationModalProps {
  open: boolean;
  onClose: () => void;
}

export function ConsultationModal({ open, onClose }: ConsultationModalProps) {
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

                <form className="mt-6 space-y-4">
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
                    />
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
                        placeholder="010-0000-0000"
                        className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground shadow-inner focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-40"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground" htmlFor="email">
                        이메일
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground shadow-inner focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-40"
                      />
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
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <CTAButton type="submit" className="w-full">
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
