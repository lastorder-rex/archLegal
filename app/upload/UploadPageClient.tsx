'use client';

import { useEffect, useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload, CircleX, Trash2, Image as ImageIcon, FileText as FileTextIcon, Loader, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateFilePreview } from '@/lib/utils/file-upload';

type UploadLog = {
  id: string;
  fileName: string;
  filePath: string | null;
  mimeType: string | null;
  uploadedAt: string;
  preview?: string; // 클라이언트 미리보기 URL
  thumbnailUrl?: string | null; // 서버 썸네일 URL (Google Drive)
};

type UploadFolder = {
  templateName: string;
  displayName: string;
  folderId: string | null;
  remainingSlots: number;
  uploads: UploadLog[];
};

type UploadContextResponse = {
  consultation: {
    id: string;
    name: string | null;
    phone: string | null;
    address: string | null;
    addressDetail: string | null;
  };
  paymentStage: {
    id: string;
    status: string;
    title: string | null;
    requestAmount: number | null;
    paidAmount: number | null;
  } | null;
  driveFolder: {
    id: string | null;
    name: string | null;
    status: string | null;
  } | null;
  folders: UploadFolder[];
  token: {
    id: string;
    expiresAt: string;
    expiresInSeconds: number;
  };
  dryRun: boolean;
  maxFilesPerFolder: number;
  audience: 'customer' | 'staff';
  allowedTemplates: string[];
};

type FolderStatus = {
  uploading: boolean;
  error: string | null;
  successMessage: string | null;
  uploadProgress?: {
    current: number;
    total: number;
  };
};

type FolderStatusMap = Record<string, FolderStatus>;

interface UploadPageClientProps {
  token: string;
}

const IMAGE_RESIZE_THRESHOLD_BYTES = 2 * 1024 * 1024; // 2MB

function deriveFileNameForMimeType(originalName: string, mimeType: string): string {
  if (mimeType === 'image/jpeg') {
    if (/\.(jpe?g)$/i.test(originalName)) {
      return originalName;
    }
    return `${originalName.replace(/\.[^/.]+$/, '')}.jpg`;
  }

  return originalName;
}

async function resizeImage(file: File, maxWidth = 1200, quality = 0.85): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);

      const targetMimeType = file.type === 'image/heic' || file.type === 'image/heif' ? 'image/jpeg' : file.type;

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const nextFileName = deriveFileNameForMimeType(file.name, targetMimeType);
            const resizedFile = new File([blob], nextFileName, {
              type: targetMimeType,
              lastModified: Date.now()
            });
            resolve(resizedFile);
          } else {
            resolve(file);
          }
        },
        targetMimeType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

async function preprocessFileForUpload(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) {
    return file;
  }

  if (file.size <= IMAGE_RESIZE_THRESHOLD_BYTES) {
    return file;
  }

  try {
    return await resizeImage(file);
  } catch (error) {
    console.warn('[upload] failed to resize image, using original file', error);
    return file;
  }
}

function formatKoreanDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
}

function formatExpiry(seconds: number): string {
  if (seconds <= 0) return '만료됨';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}시간 ${mins}분 남음`;
  }
  if (minutes > 0) {
    return `${minutes}분 ${remainingSeconds}초 남음`;
  }
  return `${remainingSeconds}초 남음`;
}

export default function UploadPageClient({ token }: UploadPageClientProps) {
  const [uploadContext, setUploadContext] = useState<UploadContextResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [folderStatuses, setFolderStatuses] = useState<FolderStatusMap>({});
  const [deletingUploadIds, setDeletingUploadIds] = useState<Record<string, Set<string>>>({});
  const [draggingTemplateName, setDraggingTemplateName] = useState<string | null>(null);
  const [filePreviews, setFilePreviews] = useState<Map<string, string>>(new Map());
  const [failedThumbnailIds, setFailedThumbnailIds] = useState<Set<string>>(new Set());

  const setFolderStatus = useCallback((templateName: string, status: Partial<FolderStatus>) => {
    setFolderStatuses((prev) => {
      const current = prev[templateName] ?? { uploading: false, error: null, successMessage: null };
      return {
        ...prev,
        [templateName]: { ...current, ...status }
      };
    });
  }, []);

  const loadContext = useCallback(
    async (options: { silent?: boolean } = {}) => {
      if (!token) {
        setPageError('업로드 토큰이 없습니다. 발송된 링크를 다시 확인해주세요.');
        setIsLoading(false);
        return;
      }

      if (!options.silent) {
        setIsLoading(true);
      }

      try {
        const response = await fetch(`/api/upload/validate?token=${encodeURIComponent(token)}`, {
          cache: 'no-store'
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          setPageError(data.error || '업로드 링크를 확인할 수 없습니다.');
          setUploadContext(null);
          return;
        }

        const data: UploadContextResponse = await response.json();
        setUploadContext(data);
        setPageError(null);
      } catch (err) {
        console.error('Failed to load upload context', err);
        setPageError('업로드 정보를 불러오는 중 오류가 발생했습니다. 네트워크 상태를 확인해주세요.');
        setUploadContext(null);
      } finally {
        if (!options.silent) {
          setIsLoading(false);
        }
      }
    },
    [token]
  );

  useEffect(() => {
    loadContext();
  }, [loadContext]);

  const uploadFileToTemplate = useCallback(
    async (file: File, templateName: string) => {
      const processedFile = await preprocessFileForUpload(file);
      const formData = new FormData();
      formData.append('token', token);
      formData.append('templateName', templateName);
      formData.append('file', processedFile);

      const response = await fetch('/api/upload/files', {
        method: 'POST',
        body: formData
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.error || '파일 업로드에 실패했습니다.');
      }
    },
    [token]
  );

  const handleFolderUpload = useCallback(
    async (fileList: FileList | File[], folder: UploadFolder) => {
      const files = Array.from(fileList as ArrayLike<File>).filter((item): item is File => item instanceof File);
      if (files.length === 0) {
        return;
      }

      const slotsAvailable = Math.max(0, folder.remainingSlots);
      if (slotsAvailable <= 0) {
        setFolderStatus(folder.templateName, {
          uploading: false,
          error: `폴더당 최대 ${uploadContext?.maxFilesPerFolder ?? 0}개의 파일만 업로드할 수 있습니다.`,
          successMessage: null
        });
        return;
      }

      setFolderStatus(folder.templateName, { uploading: true, error: null, successMessage: null, uploadProgress: { current: 0, total: 0 } });

      const limitedFiles = files.slice(0, slotsAvailable);
      const skippedCount = files.length - limitedFiles.length;

      // 이미지 파일 미리보기 생성
      for (const file of limitedFiles) {
        if (file.type.startsWith('image/')) {
          try {
            const preview = await generateFilePreview(file);
            if (preview) {
              setFilePreviews((prev) => {
                const newMap = new Map(prev);
                newMap.set(file.name, preview);
                return newMap;
              });
            }
          } catch (error) {
            console.warn('Failed to generate preview for', file.name, error);
          }
        }
      }

      let successCount = 0;
      let failureMessages: string[] = [];
      let remainingSlots = slotsAvailable;
      const totalFiles = limitedFiles.length;

      setFolderStatus(folder.templateName, { uploading: true, error: null, successMessage: null, uploadProgress: { current: 0, total: totalFiles } });

      for (const file of limitedFiles) {
        if (remainingSlots <= 0) break;
        try {
          await uploadFileToTemplate(file, folder.templateName);
          successCount += 1;
          remainingSlots -= 1;

          // 진행률 업데이트
          setFolderStatus(folder.templateName, {
            uploading: true,
            error: null,
            successMessage: null,
            uploadProgress: { current: successCount, total: totalFiles }
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : '파일 업로드에 실패했습니다.';
          failureMessages.push(message);

          // 실패해도 진행률 업데이트
          successCount += 1;
          setFolderStatus(folder.templateName, {
            uploading: true,
            error: null,
            successMessage: null,
            uploadProgress: { current: successCount, total: totalFiles }
          });
        }
      }

      await loadContext({ silent: true });

      setFolderStatus(folder.templateName, {
        uploading: false,
        error:
          failureMessages.length > 0
            ? failureMessages[0] + (failureMessages.length > 1 ? ` 외 ${failureMessages.length - 1}건` : '')
            : skippedCount > 0
              ? `업로드 가능한 파일 수(${slotsAvailable})를 초과한 ${skippedCount}개 파일은 제외되었습니다.`
              : null,
        successMessage:
          successCount > 0
            ? `${successCount}개 파일 업로드 완료${skippedCount > 0 ? ` (${skippedCount}개 제외)` : ''}`
            : null,
        uploadProgress: undefined
      });
    },
    [uploadContext?.maxFilesPerFolder, loadContext, setFolderStatus, uploadFileToTemplate]
  );

  const handleDeleteUpload = async (templateName: string, uploadId: string) => {
    const confirmDelete = window.confirm('선택한 파일을 삭제하시겠습니까?');
    if (!confirmDelete) return;

    setDeletingUploadIds((prev) => {
      const folderSet = prev[templateName] ? new Set(prev[templateName]) : new Set<string>();
      folderSet.add(uploadId);
      return {
        ...prev,
        [templateName]: folderSet
      };
    });
    setFolderStatus(templateName, { error: null, successMessage: null });

    try {
      const response = await fetch('/api/upload/files', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, uploadId })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.error || '파일 삭제에 실패했습니다.');
      }

      await loadContext({ silent: true });

      setFolderStatus(templateName, {
        uploading: false,
        error: null,
        successMessage: '파일이 삭제되었습니다.'
      });
    } catch (err) {
      console.error('Delete failed', err);
      setFolderStatus(templateName, {
        uploading: false,
        error: err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.',
        successMessage: null
      });
    } finally {
      setDeletingUploadIds((prev) => {
        if (!prev[templateName]) return prev;
        const folderSet = new Set(prev[templateName]);
        folderSet.delete(uploadId);
        return {
          ...prev,
          [templateName]: folderSet
        };
      });
    }
  };

  if (isLoading) {
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

  if (pageError) {
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

  if (!uploadContext) {
    return null;
  }

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
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-3xl space-y-6">
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

        <section className="space-y-5">
          {uploadContext.folders.map((folder, index) => {
            const status = folderStatuses[folder.templateName];
            const uploading = status?.uploading ?? false;
            const errorMessage = status?.error;
            const successMessage = status?.successMessage;
            const inputId = `upload-file-${index}`;
            const isDisabled = folder.remainingSlots <= 0 || uploading;
            const deletingIds = deletingUploadIds[folder.templateName] ?? new Set<string>();

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
                      남은 업로드: {folder.remainingSlots} / {uploadContext.maxFilesPerFolder}
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
                        await handleFolderUpload(selectedFiles, folder);
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
                        handleFolderUpload(event.dataTransfer.files, folder);
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
                        jpg, png, pdf, heic 파일 | 최대 10MB | 폴더당 {uploadContext.maxFilesPerFolder}개까지 업로드
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
                      폴더당 최대 {uploadContext.maxFilesPerFolder}개까지 업로드되었습니다. 추가 파일을 업로드하려면 기존 파일을 삭제해주세요.
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
                                onClick={() => handleDeleteUpload(folder.templateName, upload.id)}
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
          })}
        </section>

        <section className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-3 text-sm text-slate-600">
          <h3 className="text-base font-semibold text-slate-800">업로드 안내</h3>
          <ul className="list-disc pl-4 space-y-1">
            <li>업로드 중 브라우저를 닫지 말고 완료 메시지가 표시될 때까지 기다려주세요.</li>
            <li>동일 파일명을 다시 업로드하면 최신 파일로 교체됩니다.</li>
            <li>남은 시간: {remainingTimeText}</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
