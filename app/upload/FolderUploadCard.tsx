'use client';

import type { Dispatch, SetStateAction } from 'react';
import { Input } from '@/components/ui/input';
import { Upload, Trash2, Image as ImageIcon, FileText as FileTextIcon, Loader } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatKoreanDateTime } from '@/lib/utils/file-upload';
import type { UploadFolder, FolderStatus } from '@/types/upload';

interface FolderUploadCardProps {
  folder: UploadFolder;
  index: number;
  maxFilesPerFolder: number;
  status: FolderStatus | undefined;
  deletingIds: Set<string>;
  draggingTemplateName: string | null;
  setDraggingTemplateName: Dispatch<SetStateAction<string | null>>;
  filePreviews: Map<string, string>;
  failedThumbnailIds: Set<string>;
  setFailedThumbnailIds: Dispatch<SetStateAction<Set<string>>>;
  onFolderUpload: (fileList: FileList | File[], folder: UploadFolder) => void | Promise<void>;
  onDeleteUpload: (templateName: string, uploadId: string) => void | Promise<void>;
}

export default function FolderUploadCard({
  folder,
  index,
  maxFilesPerFolder,
  status,
  deletingIds,
  draggingTemplateName,
  setDraggingTemplateName,
  filePreviews,
  failedThumbnailIds,
  setFailedThumbnailIds,
  onFolderUpload,
  onDeleteUpload
}: FolderUploadCardProps) {
  const uploading = status?.uploading ?? false;
  const errorMessage = status?.error;
  const successMessage = status?.successMessage;
  const inputId = `upload-file-${index}`;
  const isDisabled = folder.remainingSlots <= 0 || uploading;

  return (
    <div
      key={folder.templateName}
      className="group flex flex-col gap-4 rounded-2xl border border-border/70 bg-card/95 p-6 shadow-md backdrop-blur transition hover:border-primary hover:ring-2 hover:ring-primary hover:ring-opacity-40 dark:border-border/40 dark:bg-slate-900/60 dark:hover:border-primary dark:hover:ring-primary"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-slate-500">STEP {index + 1}</div>
          <h2 className="text-xl font-semibold text-slate-900">{folder.displayName}</h2>
          <p className="text-sm text-slate-600 mt-1">
            남은 업로드: {folder.remainingSlots} / {maxFilesPerFolder}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">파일 업로드</label>
        <Input
          id={inputId}
          type="file"
          multiple
          accept="image/*,application/pdf"
          disabled={isDisabled}
          className="hidden"
          onChange={async (event) => {
            const selectedFiles = event.target.files ? Array.from(event.target.files) : [];
            event.target.value = '';
            if (selectedFiles.length > 0) {
              await onFolderUpload(selectedFiles, folder);
            }
          }}
        />
        <div
          role="button"
          tabIndex={0}
          onClick={() => document.getElementById(inputId)?.click()}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              document.getElementById(inputId)?.click();
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            if (!isDisabled) {
              event.dataTransfer.dropEffect = 'copy';
              setDraggingTemplateName(folder.templateName);
            }
          }}
          onDragLeave={() => {
            setDraggingTemplateName((current) => (current === folder.templateName ? null : current));
          }}
          onDrop={(event) => {
            event.preventDefault();
            if (isDisabled) return;
            setDraggingTemplateName(null);
            if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
              onFolderUpload(event.dataTransfer.files, folder);
            }
          }}
          className={cn(
            'flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-4 py-6 text-center transition',
            'bg-slate-50 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2',
            isDisabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer',
            draggingTemplateName === folder.templateName ? 'border-primary bg-primary/5' : 'border-slate-300'
          )}
        >
          <Upload className="h-8 w-8 text-primary" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-700">
              {uploading ? '업로드 중입니다…' : '파일을 끌어다 놓거나 클릭하여 선택하세요'}
            </p>
            <p className="text-xs text-slate-500">
              jpg, png, pdf, heic 파일 | 최대 10MB | 폴더당 {maxFilesPerFolder}개까지 업로드
            </p>
          </div>
          {/* <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isDisabled}
            className="mt-2"
            onClick={(event) => {
              event.preventDefault();
              if (!isDisabled) {
                document.getElementById(inputId)?.click();
              }
            }}
          >
            파일 선택
          </Button> */}
        </div>
        {folder.remainingSlots <= 0 && !successMessage && (
          <p className="text-xs text-slate-600">
            폴더당 최대 {maxFilesPerFolder}개까지 업로드되었습니다. 추가 파일을 업로드하려면 기존 파일을 삭제해주세요.
          </p>
        )}
      </div>

      {uploading && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-100 border border-slate-200 rounded px-3 py-3">
            <Loader className="h-5 w-5 animate-spin text-primary flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">파일을 업로드하는 중입니다</p>
              {status?.uploadProgress && (
                <p className="text-xs text-slate-500 mt-1">
                  {status.uploadProgress.current} / {status.uploadProgress.total}개 파일
                </p>
              )}
            </div>
          </div>
          {status?.uploadProgress && (
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300 ease-out"
                style={{
                  width: `${(status.uploadProgress.current / status.uploadProgress.total) * 100}%`
                }}
              />
            </div>
          )}
        </div>
      )}

      {errorMessage && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
          {successMessage}
        </div>
      )}

      <div className="space-y-2">
        {folder.uploads.length === 0 ? (
          <p className="text-sm text-slate-500">아직 업로드된 파일이 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {folder.uploads.map((upload) => {
              const isDeleting = deletingIds.has(upload.id);
              return (
                <li
                  key={upload.id}
                  className="bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-3">
                    {/* 썸네일 또는 파일 아이콘 */}
                    <div className="flex-shrink-0">
                      {filePreviews.get(upload.fileName) ? (
                        // 방금 업로드한 파일 → 클라이언트 미리보기
                        <img
                          src={filePreviews.get(upload.fileName)!}
                          alt={upload.fileName}
                          width={40}
                          height={40}
                          className="object-cover rounded"
                          loading="lazy"
                        />
                      ) : upload.thumbnailUrl && upload.mimeType?.startsWith('image/') && !failedThumbnailIds.has(upload.id) ? (
                        // 이전에 업로드한 이미지 파일 → 서버 썸네일
                        <img
                          src={upload.thumbnailUrl}
                          alt={upload.fileName}
                          width={40}
                          height={40}
                          className="object-cover rounded"
                          loading="lazy"
                          onError={() => {
                            // 썸네일 로딩 실패 시 failedThumbnailIds에 추가
                            setFailedThumbnailIds((prev) => new Set(prev).add(upload.id));
                          }}
                        />
                      ) : (
                        // 썸네일 없음 → 파일 타입 아이콘
                        <div className="w-10 h-10 flex items-center justify-center bg-slate-200 rounded">
                          {upload.mimeType?.startsWith('image/') ? (
                            <ImageIcon className="h-6 w-6 text-slate-500" />
                          ) : (
                            <FileTextIcon className="h-6 w-6 text-slate-500" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* 파일 정보 */}
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-medium text-slate-800 truncate">
                        {upload.fileName}
                      </span>
                      <span className="text-xs text-slate-500">
                        업로드 시각: {formatKoreanDateTime(upload.uploadedAt)}
                      </span>
                    </div>

                    {/* 삭제 버튼 */}
                    <button
                      type="button"
                      onClick={() => onDeleteUpload(folder.templateName, upload.id)}
                      disabled={isDeleting}
                      className="inline-flex h-10 w-auto px-3 items-center justify-center rounded-full text-slate-500 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                      aria-label="파일 삭제"
                    >
                      {isDeleting ? (
                        <span className="text-sm font-medium text-rose-600 whitespace-nowrap">삭제 중</span>
                      ) : (
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
