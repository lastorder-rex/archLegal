'use client';

import { useEffect, useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload, CircleX, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type UploadLog = {
  id: string;
  fileName: string;
  filePath: string | null;
  mimeType: string | null;
  uploadedAt: string;
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

type UploadStatusMap = Record<string, { uploading: boolean; error: string | null; successMessage: string | null }>;

interface UploadPageClientProps {
  token: string;
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
  const [context, setContext] = useState<UploadContextResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMap, setStatusMap] = useState<UploadStatusMap>({});
  const [deletingUploads, setDeletingUploads] = useState<Record<string, string | null>>({});
  const [draggingTemplate, setDraggingTemplate] = useState<string | null>(null);

  const fetchContext = useCallback(
    async (options: { silent?: boolean } = {}) => {
      if (!token) {
        setError('업로드 토큰이 없습니다. 발송된 링크를 다시 확인해주세요.');
        setLoading(false);
        return;
      }

      if (!options.silent) {
        setLoading(true);
      }

      try {
        const response = await fetch(`/api/upload/validate?token=${encodeURIComponent(token)}`, {
          cache: 'no-store'
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          setError(data.error || '업로드 링크를 확인할 수 없습니다.');
          setContext(null);
          return;
        }

        const data: UploadContextResponse = await response.json();
        setContext(data);
        setError(null);
      } catch (err) {
        console.error('Failed to load upload context', err);
        setError('업로드 정보를 불러오는 중 오류가 발생했습니다. 네트워크 상태를 확인해주세요.');
        setContext(null);
      } finally {
        if (!options.silent) {
          setLoading(false);
        }
      }
    },
    [token]
  );

  useEffect(() => {
    fetchContext();
  }, [fetchContext]);

  const uploadSingleFile = useCallback(
    async (file: File, templateName: string) => {
      const formData = new FormData();
      formData.append('token', token);
      formData.append('templateName', templateName);
      formData.append('file', file);

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

  const handleFilesUpload = useCallback(
    async (fileList: FileList | File[], folder: UploadFolder) => {
      const files = Array.from(fileList as ArrayLike<File>).filter((item): item is File => item instanceof File);
      if (files.length === 0) {
        return;
      }

      const slotsAvailable = Math.max(0, folder.remainingSlots);
      if (slotsAvailable <= 0) {
        setStatusMap((prev) => ({
          ...prev,
          [folder.templateName]: {
            uploading: false,
            error: `폴더당 최대 ${context?.maxFilesPerFolder ?? 0}개의 파일만 업로드할 수 있습니다.`,
            successMessage: null
          }
        }));
        return;
      }

      setStatusMap((prev) => ({
        ...prev,
        [folder.templateName]: { uploading: true, error: null, successMessage: null }
      }));

      const limitedFiles = files.slice(0, slotsAvailable);
      const skippedCount = files.length - limitedFiles.length;

      let successCount = 0;
      let failureMessages: string[] = [];
      let remainingSlots = slotsAvailable;

      for (const file of limitedFiles) {
        if (remainingSlots <= 0) break;
        try {
          await uploadSingleFile(file, folder.templateName);
          successCount += 1;
          remainingSlots -= 1;
        } catch (error) {
          const message = error instanceof Error ? error.message : '파일 업로드에 실패했습니다.';
          failureMessages.push(message);
        }
      }

      await fetchContext({ silent: true });

      setStatusMap((prev) => ({
        ...prev,
        [folder.templateName]: {
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
              : null
        }
      }));
    },
    [context?.maxFilesPerFolder, fetchContext, uploadSingleFile]
  );

  const handleDeleteUpload = async (templateName: string, uploadId: string) => {
    const confirmDelete = window.confirm('선택한 파일을 삭제하시겠습니까?');
    if (!confirmDelete) return;

    setDeletingUploads((prev) => ({
      ...prev,
      [templateName]: uploadId
    }));
    setStatusMap((prev) => ({
      ...prev,
      [templateName]: { uploading: prev[templateName]?.uploading ?? false, error: null, successMessage: null }
    }));

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

      await fetchContext({ silent: true });

      setStatusMap((prev) => ({
        ...prev,
        [templateName]: {
          uploading: false,
          error: null,
          successMessage: '파일이 삭제되었습니다.'
        }
      }));
    } catch (err) {
      console.error('Delete failed', err);
      setStatusMap((prev) => ({
        ...prev,
        [templateName]: {
          uploading: false,
          error: err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.',
          successMessage: null
        }
      }));
    } finally {
      setDeletingUploads((prev) => ({
        ...prev,
        [templateName]: prev[templateName] === uploadId ? null : prev[templateName] ?? null
      }));
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm px-6 py-8 text-center">
          <p className="text-lg font-medium text-slate-700">업로드 링크를 확인하는 중입니다...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md bg-white border border-slate-200 rounded-lg shadow-sm px-6 py-8 text-center">
          <h1 className="text-xl font-semibold text-slate-900 mb-2 flex items-center justify-center gap-2">
            <CircleX className="h-6 w-6 text-rose-500" aria-hidden="true" />
            업로드를 진행할 수 없습니다
          </h1>
          <p className="text-slate-600 whitespace-pre-line">{error}</p>
        </div>
      </main>
    );
  }

  if (!context) {
    return null;
  }

  const consultationName = context.consultation.name ?? '고객';
  const address = [context.consultation.address, context.consultation.addressDetail]
    .filter(Boolean)
    .join(' ');
  const isStaffLink = context.audience === 'staff';
  const mainTitle = isStaffLink ? '현장실사 자료 업로드' : '서류 업로드';
  const introDescription = isStaffLink
    ? `현장 실사 자료를 업로드해 주세요. 폴더당 최대 ${context.maxFilesPerFolder}개의 파일을 올릴 수 있습니다.`
    : `아래 단계에 따라 위임장과 인감증명서를 등록해 주세요. 폴더당 최대 ${context.maxFilesPerFolder}개의 파일을 올릴 수 있습니다.`;
  const remainingTimeText = formatExpiry(context.token.expiresInSeconds);

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
            {context.paymentStage?.title && (
              <div>
                <span className="font-medium text-slate-700">결제 단계</span>
                <div className="text-slate-900">{context.paymentStage.title}</div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <span className="font-medium text-slate-700">링크 만료</span>
                <div className="text-slate-900">{remainingTimeText}</div>
              </div>
              {context.dryRun && (
                <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-1">
                  테스트 모드: 실제 Google Drive에 업로드되지 않습니다.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-5">
          {context.folders.map((folder, index) => {
            const status = statusMap[folder.templateName];
            const uploading = status?.uploading ?? false;
            const errorMessage = status?.error;
            const successMessage = status?.successMessage;
            const inputId = `upload-file-${index}`;
            const isDisabled = folder.remainingSlots <= 0 || uploading;
            const deletingId = deletingUploads[folder.templateName] ?? null;

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
                      남은 업로드: {folder.remainingSlots} / {context.maxFilesPerFolder}
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
                        await handleFilesUpload(selectedFiles, folder);
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
                        setDraggingTemplate(folder.templateName);
                      }
                    }}
                    onDragLeave={() => {
                      setDraggingTemplate((current) => (current === folder.templateName ? null : current));
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      if (isDisabled) return;
                      setDraggingTemplate(null);
                      if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
                        handleFilesUpload(event.dataTransfer.files, folder);
                      }
                    }}
                    className={cn(
                      'flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-4 py-6 text-center transition',
                      'bg-slate-50 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2',
                      isDisabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer',
                      draggingTemplate === folder.templateName ? 'border-primary bg-primary/5' : 'border-slate-300'
                    )}
                  >
                    <Upload className="h-6 w-6 text-primary" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-700">
                        {uploading ? '업로드 중입니다…' : '파일을 끌어다 놓거나 클릭하여 선택하세요'}
                      </p>
                      <p className="text-xs text-slate-500">
                        jpg, png, pdf, heic 파일 | 최대 10MB | 폴더당 {context.maxFilesPerFolder}개까지 업로드
                      </p>
                    </div>
                    <Button
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
                    </Button>
                  </div>
                  {folder.remainingSlots <= 0 && (
                    <p className="text-xs text-amber-600">업로드 가능한 파일 수를 초과했습니다. 기존 파일을 교체하려면 관리자에게 문의해주세요.</p>
                  )}
                </div>

                {uploading && (
                  <div className="text-sm text-slate-600 bg-slate-100 border border-slate-200 rounded px-3 py-2">
                    파일을 업로드하는 중입니다. 잠시만 기다려주세요...
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
                        const isDeleting = deletingId === upload.id;
                        return (
                          <li
                            key={upload.id}
                            className="bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm"
                          >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
                                <span className="font-medium text-slate-800 break-all sm:max-w-xs sm:truncate">
                                  {upload.fileName}
                                </span>
                                <span className="text-xs text-slate-500 whitespace-nowrap sm:text-right">
                                  업로드 시각: {formatKoreanDateTime(upload.uploadedAt)}
                                </span>
                              </div>
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
