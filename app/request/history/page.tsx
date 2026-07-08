'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AttachmentFile } from '@/lib/utils/file-upload';
import type { ConsultationRecord as ConsultationRecordType } from '@/lib/validations/consultation';
import {
  consultationRecordSchema,
  filterMessageInput
} from '@/lib/validations/consultation';
import { useConsultationList } from '@/hooks/useConsultationList';
import type { ConsultationRecord, ConsultationAttachment, EditFormState } from './types';
import { downloadAttachment } from './utils';
import { useConsultationHistoryInit } from './useConsultationHistoryInit';
import { ConsultationRecordCard } from './ConsultationRecordCard';
import { ConsultationEditForm } from './ConsultationEditForm';

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
  const { initializing, pageError, user } = useConsultationHistoryInit({
    refreshConsultations,
    consultationsError,
    setConsultationsError
  });
  const [editingId, setEditingId] = useState<string | null>(null);
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

  const handleRemoveAttachment = (index: number) => {
    setFormState(prev => ({
      ...prev,
      attachments: (prev.attachments ?? []).filter((_, i) => i !== index),
    }));
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

                  {record.payment_locked ? (
                    <span className="inline-flex items-center self-start rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      결제 완료 (수정·삭제 불가)
                    </span>
                  ) : (
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
                  )}
                </div>

                {!isEditing && (
                  <ConsultationRecordCard
                    record={record}
                    onDownloadAttachment={downloadAttachment}
                  />
                )}

                {isEditing && (
                  <ConsultationEditForm
                    record={record}
                    formState={formState}
                    submitting={submitting}
                    userId={user?.id || ''}
                    editingId={editingId}
                    onMessageChange={value => handleInputChange('message', value)}
                    onRemoveAttachment={handleRemoveAttachment}
                    onNewFilesChange={setNewUploadedFiles}
                    onCancel={resetEditing}
                    onSubmit={() => handleUpdate(record)}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
