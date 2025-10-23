import { Info } from 'lucide-react';
import FileUpload from '../FileUpload';
import type { AttachmentFile } from '@/lib/utils/file-upload';

interface AttachmentsSectionProps {
  userId: string;
  consultationId: string | null;
  attachments: AttachmentFile[];
  isSubmitting: boolean;
  onFilesChange: (files: AttachmentFile[]) => void;
}

export function AttachmentsSection({
  userId,
  consultationId,
  attachments,
  isSubmitting,
  onFilesChange
}: AttachmentsSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">첨부파일</h3>
      <div className="rounded-md border border-border bg-muted/10 p-4">
        <FileUpload
          userId={userId}
          consultationId={consultationId || undefined}
          onFilesChange={onFilesChange}
          disabled={isSubmitting}
        />
        <div className="mt-3 space-y-2 text-xs text-muted-foreground">
          {/* <p className="flex items-center gap-2">
            <ThumbsUp className="h-4 w-4" aria-hidden />
            <span>
              <strong>권장 첨부파일:</strong> 위임장, 인감증명서
            </span>
          </p> */}
          <p className="flex items-center gap-2">
            <Info className="h-4 w-4" aria-hidden />
            <span>
              <strong>안내:</strong> 첨부파일은 상담 완료 후에도 안전하게 보관됩니다
            </span>
          </p>
        </div>
      </div>
      {attachments.length > 0 && (
        <div className="text-xs text-muted-foreground">
          현재 첨부파일: {attachments.length}개 (
          {attachments.filter((f) => f.uploadStatus === 'completed').length}개 업로드 완료)
        </div>
      )}
    </div>
  );
}
