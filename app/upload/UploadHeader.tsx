'use client';

import { formatExpiry } from '@/lib/utils/file-upload';
import type { UploadContextResponse } from '@/types/upload';

interface UploadHeaderProps {
  uploadContext: UploadContextResponse;
}

export default function UploadHeader({ uploadContext }: UploadHeaderProps) {
  const consultationName = uploadContext.consultation.name ?? '고객';
  const address = [uploadContext.consultation.address, uploadContext.consultation.addressDetail]
    .filter(Boolean)
    .join(' ');
  const isStaffLink = uploadContext.audience === 'staff';
  const mainTitle = isStaffLink ? '현장실사 자료 업로드' : '서류 업로드';
  const introDescription = isStaffLink
    ? `현장 실사 자료를 업로드해 주세요. 폴더당 최대 ${uploadContext.maxFilesPerFolder}개의 파일을 올릴 수 있습니다.`
    : `아래 단계에 따라 위임장과 인감증명서를 등록해 주세요. 폴더당 최대 ${uploadContext.maxFilesPerFolder}개의 파일을 올릴 수 있습니다.`;
  const remainingTimeText = formatExpiry(uploadContext.token.expiresInSeconds);

  return (
    <section className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">{mainTitle}</h1>
        <p className="text-sm text-slate-600">{introDescription}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 text-sm text-slate-600">
        <div>
          <span className="font-medium text-slate-700">의뢰인</span>
          <div className="text-slate-900">{consultationName}</div>
        </div>
        <div>
          <span className="font-medium text-slate-700">주소</span>
          <div className="text-slate-900">{address || '주소 정보 없음'}</div>
        </div>
        {uploadContext.paymentStage?.title && (
          <div>
            <span className="font-medium text-slate-700">결제 단계</span>
            <div className="text-slate-900">{uploadContext.paymentStage.title}</div>
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <span className="font-medium text-slate-700">링크 만료</span>
            <div className="text-slate-900">{remainingTimeText}</div>
          </div>
          {uploadContext.dryRun && (
            <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-1">
              테스트 모드: 실제 Google Drive에 업로드되지 않습니다.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
