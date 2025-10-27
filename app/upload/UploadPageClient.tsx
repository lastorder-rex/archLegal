'use client';

import { useEffect, useState, useCallback, ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

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

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>, templateName: string) => {
    const file = event.target.files?.[0];
    // Clear input so same file can be re-selected later
    event.target.value = '';

    if (!file) return;

    setStatusMap((prev) => ({
      ...prev,
      [templateName]: { uploading: true, error: null, successMessage: null }
    }));

    try {
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

      await fetchContext({ silent: true });

      setStatusMap((prev) => ({
        ...prev,
        [templateName]: {
          uploading: false,
          error: null,
          successMessage: '업로드가 완료되었습니다.'
        }
      }));
    } catch (err) {
      console.error('Upload failed', err);
      setStatusMap((prev) => ({
        ...prev,
        [templateName]: {
          uploading: false,
          error: err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.',
          successMessage: null
        }
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
          <h1 className="text-xl font-semibold text-slate-900 mb-2">업로드를 진행할 수 없습니다</h1>
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

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <section className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-slate-900">서류 업로드</h1>
            <p className="text-sm text-slate-600">
              아래 단계에 따라 위임장과 인감증명서를 등록해 주세요. {context.maxFilesPerFolder}개까지 업로드할 수 있습니다.
            </p>
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
                <div className="text-slate-900">{formatExpiry(context.token.expiresInSeconds)}</div>
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
                  <label className="block text-sm font-medium text-slate-700">파일 선택</label>
                  <Input
                    id={inputId}
                    type="file"
                    accept="image/*,application/pdf"
                    disabled={isDisabled}
                    className="hidden"
                    onChange={(event) => handleFileChange(event, folder.templateName)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="default"
                    disabled={isDisabled}
                    className="w-full sm:w-auto gap-2"
                    onClick={() => document.getElementById(inputId)?.click()}
                  >
                    {uploading ? '업로드 중...' : '파일 선택'}
                    <Upload className="h-4 w-4" />
                  </Button>
                  <p className="text-xs text-slate-500">jpg, png, pdf, heic 파일만 가능하며 최대 10MB까지 업로드할 수 있습니다.</p>
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
                  <h3 className="text-sm font-semibold text-slate-700">이미 업로드한 파일</h3>
                  {folder.uploads.length === 0 ? (
                    <p className="text-sm text-slate-500">아직 업로드된 파일이 없습니다.</p>
                  ) : (
                    <ul className="space-y-2">
                      {folder.uploads.map((upload) => (
                        <li key={upload.id} className="flex flex-col bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm">
                          <span className="font-medium text-slate-800">{upload.fileName}</span>
                          <span className="text-xs text-slate-500">업로드 시각: {formatKoreanDateTime(upload.uploadedAt)}</span>
                        </li>
                      ))}
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
            <li>링크는 생성 후 24시간 동안만 유효하며 만료 시 관리자에게 재발급을 요청할 수 있습니다.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
