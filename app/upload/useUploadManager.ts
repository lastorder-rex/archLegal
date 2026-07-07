'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  generateFilePreview,
  preprocessFileForUpload
} from '@/lib/utils/file-upload';
import type {
  UploadFolder,
  UploadContextResponse,
  FolderStatus,
  FolderStatusMap
} from '@/types/upload';

export function useUploadManager(token: string) {
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

  return {
    uploadContext,
    isLoading,
    pageError,
    folderStatuses,
    deletingUploadIds,
    draggingTemplateName,
    setDraggingTemplateName,
    filePreviews,
    failedThumbnailIds,
    setFailedThumbnailIds,
    handleFolderUpload,
    handleDeleteUpload
  };
}
