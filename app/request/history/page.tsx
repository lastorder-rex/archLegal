'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Download, FileText, X } from 'lucide-react';
import { getFileUrl, getFileIcon, formatFileSize, AttachmentFile } from '@/lib/utils/file-upload';
import FileUpload from '@/components/consultation/FileUpload';
import type { ConsultationRecord as ConsultationRecordType } from '@/lib/validations/consultation';
import {
  consultationRecordSchema,
  filterMessageInput
} from '@/lib/validations/consultation';
import { useConsultationList } from '@/hooks/useConsultationList';

type ConsultationRecord = ConsultationRecordType;
type ConsultationAttachment = NonNullable<ConsultationRecord['attachments']>[number];

interface EditFormState {
  name: string;
  phone: string;
  email: string;
  message: string;
  attachments: ConsultationAttachment[];
}

export default function ConsultationHistoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('id');
  const {
    data: records,
    setData: setRecords,
    loading: consultationsLoading,
    error: consultationsError,
    refresh: refreshConsultations,
    setError: setConsultationsError
  } = useConsultationList<ConsultationRecord>({
    schema: consultationRecordSchema.array(),
    queryKey: ['consultations', 'history'],
    onUnauthorized: () => {
      setConsultationsError('로그인이 필요합니다.');
      router.push('/login?redirect=/request/history');
    }
  });
  const [initializing, setInitializing] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [formState, setFormState] = useState<EditFormState>({
    name: '',
    phone: '',
    email: '',
    message: '',
    attachments: [] as ConsultationAttachment[],
  });
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [newUploadedFiles, setNewUploadedFiles] = useState<ConsultationAttachment[]>([]);

  // Download attachment file
  const downloadAttachment = async (attachment: ConsultationAttachment) => {
    try {
      const result = await getFileUrl(attachment.storagePath);
      if (result.url) {
        // Fetch file as blob to force download instead of opening in browser
        const response = await fetch(result.url);
        if (!response.ok) {
          throw new Error('파일 다운로드에 실패했습니다.');
        }

        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = attachment.name;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();

        // Cleanup
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
        }, 100);
      } else {
        alert(`다운로드 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('파일 다운로드 중 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      try {
        setPageError(null);
        setConsultationsError(null);

        const userResponse = await fetch('/api/debug/user-info', {
          credentials: 'include'
        });

        if (userResponse.status === 401) {
          if (!cancelled) {
            setPageError('로그인이 필요합니다.');
            router.push('/login?redirect=/request/history');
          }
          return;
        }

        if (userResponse.ok) {
          const userData = await userResponse.json();
          if (!cancelled) {
            setUser({ id: userData.user_id });
          }
        }

        await refreshConsultations();
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : '상담 내역을 가져오지 못했습니다.';
          setPageError(message);
        }
      } finally {
        if (!cancelled) {
          setInitializing(false);
        }
      }
    };

    initialize().catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [refreshConsultations, router, setConsultationsError]);

  useEffect(() => {
    if (consultationsError) {
      setPageError(consultationsError);
    }
  }, [consultationsError]);

  const handleStartEdit = (record: ConsultationRecord) => {
    const existingAttachments = (record.attachments ?? []) as ConsultationAttachment[];
    setEditingId(record.id);
    setFormState({
      name: record.name,
      phone: record.phone,
      email: record.email ?? '',
      message: record.message ?? '',
      attachments: existingAttachments,
    });
    setActionMessage(null);
  };

  const resetEditing = () => {
    setEditingId(null);
    setFormState({ name: '', phone: '', email: '', message: '', attachments: [] as ConsultationAttachment[] });
    setNewUploadedFiles([]);
    setSubmitting(false);
  };

  const handleInputChange = (field: keyof EditFormState, value: string) => {
    let processedValue = value;

    // Apply filtering for message field to prevent SQL injection and XSS
    if (field === 'message') {
      processedValue = filterMessageInput(value);
    }

    setFormState(prev => ({ ...prev, [field]: processedValue }));
  };

  const handleAttachmentsChange = (attachments: AttachmentFile[]) => {
    // Convert AttachmentFile[] to the expected format
    const formattedAttachments = attachments
      .filter(file => file.uploadStatus === 'completed' && file.storagePath)
      .map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        storagePath: file.storagePath!
      }));

    setFormState(prev => ({ ...prev, attachments: formattedAttachments }));
  };

  const handleUpdate = async (record: ConsultationRecord) => {
    setSubmitting(true);
    setActionMessage(null);

    // Validate message is not empty
    if (!formState.message || formState.message.trim().length === 0) {
      setActionMessage('상담 요청사항을 입력해주세요.');
      setSubmitting(false);
      return;
    }

    try {
      // 기존 첨부파일 + 새로 업로드된 파일을 합침
      const existingAttachments = formState.attachments ?? [];
      const allAttachments = [...existingAttachments, ...newUploadedFiles];

      const response = await fetch(`/api/consultations/${record.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: formState.message,
          attachments: allAttachments,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '수정에 실패했습니다.');
      }

      setRecords(prev =>
        prev.map(item =>
          item.id === record.id
            ? {
                ...item,
                message: formState.message || null,
                attachments: allAttachments,
              }
            : item
        )
      );
      setActionMessage('상담 요청이 수정되었습니다.');
      resetEditing();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('consultation-list-updated', {
            detail: { action: 'updated', id: record.id }
          })
        );
      }
      refreshConsultations().catch(() => undefined);
    } catch (err: any) {
      setActionMessage(err.message || '수정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (record: ConsultationRecord) => {
    if (!confirm('해당 상담 요청을 삭제하시겠습니까?')) {
      return;
    }

    setSubmitting(true);
    setActionMessage(null);

    try {
      const response = await fetch(`/api/consultations/${record.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '삭제에 실패했습니다.');
      }

      setRecords(prev => prev.filter(item => item.id !== record.id));
      setEditingId(prev => (prev === record.id ? null : prev));
      setActionMessage('상담 요청이 삭제되었습니다.');

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('consultation-list-updated', {
            detail: { action: 'deleted', id: record.id }
          })
        );
      }

      refreshConsultations().catch(() => undefined);

      if (selectedId) {
        router.push('/request/history');
      }
    } catch (err: any) {
      setActionMessage(err.message || '삭제에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const sortedRecords = useMemo(
    () =>
      [...records].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    [records]
  );

  const recordsToDisplay = useMemo(() => {
    if (!selectedId) return sortedRecords;
    const match = sortedRecords.find(record => record.id === selectedId);
    return match ? [match] : [];
  }, [selectedId, sortedRecords]);

  const isLoading = initializing || consultationsLoading;
  const errorMessage = pageError ?? consultationsError;

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <p className="text-center text-muted-foreground">상담 내역을 불러오는 중입니다...</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="max-w-3xl mx-auto py-12 space-y-4">
        <p className="text-center text-destructive">{errorMessage}</p>
        <div className="flex justify-center">
          <Button onClick={() => router.refresh()}>다시 시도</Button>
        </div>
      </div>
    );
  }

  const currentAttachments = formState.attachments ?? [];

  return (
    <section className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold">상담 내역 상세</h2>
        <p className="text-sm text-muted-foreground">
          제출한 상담 요청을 확인하고 수정하거나 삭제할 수 있습니다.
        </p>
      </header>

      {actionMessage && (
        <div className="text-sm text-center text-muted-foreground bg-muted/40 p-3 rounded-md">
          {actionMessage}
        </div>
      )}

      {selectedId ? (
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => router.push('/request/history')}>
            전체 목록 보기
          </Button>
        </div>
      ) : null}

      {sortedRecords.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          아직 등록된 상담 요청이 없습니다. 먼저 상담 요청을 등록해 주세요.
        </div>
      ) : recordsToDisplay.length === 0 ? (
        <div className="py-12 space-y-4 text-center text-muted-foreground">
          <p>선택한 상담 내역을 찾을 수 없습니다.</p>
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => router.push('/request/history')}>
              전체 목록 보기
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {recordsToDisplay.map(record => {
            const isEditing = editingId === record.id;
            const createdAt = new Date(record.created_at);

            return (
              <div key={record.id} className="border border-border rounded-lg p-5 space-y-4 bg-card shadow-md">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      등록일 {createdAt.toLocaleDateString()} {createdAt.toLocaleTimeString()}
                    </p>
                    <div>
                      <h2 className="text-lg font-semibold">
                        {record.address}
                      </h2>
                      {record.address_detail && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {record.address_detail}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      className="md:w-auto"
                      onClick={() => (isEditing ? resetEditing() : handleStartEdit(record))}
                    >
                      {isEditing ? '취소' : '수정'}
                    </Button>
                    <Button
                      variant="outline"
                      className="md:w-auto border-destructive text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(record)}
                      disabled={submitting}
                    >
                      삭제
                    </Button>
                  </div>
                </div>

                {!isEditing && (
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
                              onClick={() => downloadAttachment(attachment)}
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
                )}

                {isEditing && (
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
                          onChange={e => handleInputChange('message', e.target.value)}
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
                                        onClick={() => {
                                          const newAttachments = currentAttachments.filter((_, i) => i !== index);
                                          setFormState(prev => ({ ...prev, attachments: newAttachments }));
                                        }}
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
                                userId={user?.id || ''}
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

                                  setNewUploadedFiles(completedFiles);
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
                      <Button variant="outline" className="md:w-auto" onClick={resetEditing} disabled={submitting}>
                        취소
                      </Button>
                      <Button className="md:w-auto" onClick={() => handleUpdate(record)} disabled={submitting}>
                        {submitting ? '저장 중...' : '저장'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
