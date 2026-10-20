'use client';

import { Download } from 'lucide-react';
import { getFileIcon } from '@/lib/utils/file-upload';
import type { ConsultationRecord, ConsultationAttachment } from './types';

interface ConsultationRecordCardProps {
  record: ConsultationRecord;
  onDownloadAttachment: (attachment: ConsultationAttachment) => void;
}

export function ConsultationRecordCard({ record, onDownloadAttachment }: ConsultationRecordCardProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="space-y-1">
          <p className="text-muted-foreground">이름</p>
          <p className="font-medium">{record.name}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground">연락처</p>
          <p className="font-medium">{record.phone}</p>
        </div>
        {record.email && (
          <div className="space-y-1">
            <p className="text-muted-foreground">이메일</p>
            <p className="font-medium">{record.email}</p>
          </div>
        )}

      </div>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">상담 요청 내용</p>
        <div className="rounded-md border border-border bg-muted/10 p-3 text-sm whitespace-pre-wrap">
          {record.message ? record.message : '추가 요청사항이 없습니다.'}
        </div>
      </div>

      {/* Attachments Section */}
      {((record.attachments ?? []) as ConsultationAttachment[]).length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">첨부파일</p>
          <div className="flex flex-wrap gap-2">
            {((record.attachments ?? []) as ConsultationAttachment[]).map((attachment, index) => (
              <button
                key={index}
                onClick={() => onDownloadAttachment(attachment)}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded-md transition-colors"
              >
                <span>{getFileIcon(attachment.type ?? '')}</span>
                <span className="truncate max-w-[120px]">{attachment.name}</span>
                <Download className="h-3 w-3 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
