import { Button } from '@/components/ui/button';
import type { AttachmentFile } from '@/lib/utils/file-upload';
import type { AddressSearchResult } from '@/lib/validations/consultation';

interface SubmitSectionProps {
  errors: Record<string, string>;
  isSubmitting: boolean;
  selectedAddress: AddressSearchResult | null;
  attachments: AttachmentFile[];
  onClose: () => void;
}

export function SubmitSection({
  errors,
  isSubmitting,
  selectedAddress,
  attachments,
  onClose
}: SubmitSectionProps) {
  const hasUploadingFiles = attachments.some(
    (f) => f.uploadStatus === 'uploading' || f.uploadStatus === 'pending'
  );

  const getSubmitButtonText = () => {
    if (isSubmitting) return '제출 중...';
    if (hasUploadingFiles) return '파일 업로드 중...';
    return '상담 요청 제출';
  };

  return (
    <div className="space-y-4">
      {errors.submit && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          {errors.submit}
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={isSubmitting || !selectedAddress || hasUploadingFiles}
          className="w-full"
        >
          {getSubmitButtonText()}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full !border-opacity-100 !bg-white hover:!bg-primary hover:!text-white"
          onClick={onClose}
        >
          닫기
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        제출 시 개인정보 수집 및 이용에 동의한 것으로 간주됩니다.
      </p>
    </div>
  );
}
