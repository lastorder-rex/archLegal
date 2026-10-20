'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { getFileIcon, formatFileSize } from '@/lib/utils/file-upload';
import FileUpload from '@/components/consultation/FileUpload';
import type { ConsultationRecord, ConsultationAttachment, EditFormState } from './types';

interface ConsultationEditFormProps {
  record: ConsultationRecord;
  formState: EditFormState;
  submitting: boolean;
  userId: string;
  editingId: string | null;
  onMessageChange: (value: string) => void;
  onRemoveAttachment: (index: number) => void;
  onNewFilesChange: (files: ConsultationAttachment[]) => void;
  onCancel: () => void;
  onSubmit: () => void;
}

export function ConsultationEditForm({
  record,
  formState,
  submitting,
  userId,
  editingId,
  onMessageChange,
  onRemoveAttachment,
  onNewFilesChange,
  onCancel,
  onSubmit,
}: ConsultationEditFormProps) {
  const currentAttachments = formState.attachments ?? [];

  return (
    <div className="border-t border-border pt-4 space-y-4">
      <h3 className="text-md font-semibold">상담 요청 수정</h3>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`edit-message-${record.id}`}>
            상담 요청사항 <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id={`edit-message-${record.id}`}
            value={formState.message}
            onChange={e => onMessageChange(e.target.value)}
            rows={4}
          />
          <p className="text-xs text-muted-foreground text-right">
            {formState.message.length}/1000
          </p>
        </div>

        {/* Attachments Edit Section */}
        <div className="space-y-2 md:col-span-2">
          <Label>첨부파일 관리</Label>
  <div className="rounded-md border border-border bg-muted/5 p-4 space-y-3">
            {/* Existing Attachments */}
            {formState.attachments.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">기존 첨부파일</p>
                <div className="space-y-2">
                  {formState.attachments.map((attachment, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 border border-border rounded-lg bg-background"
                    >
                      {/* File Icon/Preview */}
                      <div className="flex-shrink-0">
                        {(attachment.type ?? '').startsWith('image/') ? (
                          <div className="w-10 h-10 flex items-center justify-center bg-muted rounded">
                        <span className="text-lg">{getFileIcon(attachment.type ?? '')}</span>
                          </div>
                        ) : (
                          <div className="w-10 h-10 flex items-center justify-center bg-muted rounded">
                            <span className="text-lg">{getFileIcon(attachment.type ?? '')}</span>
                          </div>
                        )}
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{attachment.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(attachment.size ?? 0)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        {/* Remove Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onRemoveAttachment(index)}
                          disabled={submitting}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Files */}
            {currentAttachments.length < 3 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">새 파일 추가</p>
                <FileUpload
                  key={`file-upload-${record.id}-${editingId}`}
                  userId={userId}
                  consultationId={record.id}
                  initialFiles={[]}
                  onFilesChange={(newFiles) => {
                    // 새로 업로드한 파일만 별도 state에 저장
                    const completedFiles = newFiles
                      .filter(file => file.uploadStatus === 'completed' && file.storagePath)
                      .map(file => ({
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        storagePath: file.storagePath!
                      }));

                    onNewFilesChange(completedFiles);
                  }}
                  disabled={submitting}
                />
              </div>
            )}

            {currentAttachments.length >= 3 && (
              <p className="text-sm text-muted-foreground">
                최대 3개 파일까지 첨부 가능합니다. 새 파일을 추가하려면 기존 파일을 삭제해주세요.
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" className="md:w-auto" onClick={onCancel} disabled={submitting}>
          취소
        </Button>
        <Button className="md:w-auto" onClick={onSubmit} disabled={submitting}>
          {submitting ? '저장 중...' : '저장'}
        </Button>
      </div>
    </div>
  );
}
