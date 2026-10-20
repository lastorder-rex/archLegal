'use client';

import { CircleX, Search } from 'lucide-react';

export function UploadLoadingScreen() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm px-6 py-8 text-center">
        <p className="text-lg font-medium text-slate-700 flex items-center justify-center gap-2">
          <Search className="h-6 w-6 text-primary" aria-hidden="true" />
          업로드 링크를 확인하는 중입니다...
        </p>
      </div>
    </main>
  );
}

interface UploadErrorScreenProps {
  pageError: string;
}

export function UploadErrorScreen({ pageError }: UploadErrorScreenProps) {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md bg-white border border-slate-200 rounded-lg shadow-sm px-6 py-8 text-center">
        <h1 className="text-xl font-semibold text-slate-900 mb-2 flex items-center justify-center gap-2">
          <CircleX className="h-6 w-6 text-rose-500" aria-hidden="true" />
          업로드를 진행할 수 없습니다
        </h1>
        <p className="text-slate-600 whitespace-pre-line">{pageError}</p>
      </div>
    </main>
  );
}
