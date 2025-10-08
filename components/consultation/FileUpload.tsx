'use client';

import React, { useCallback, useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X, Upload, File, Download, Trash2 } from 'lucide-react';
import {
  AttachmentFile,
  validateFile,
  generateFilePreview,
  uploadFile,
  deleteFile,
  getFileUrl,
  getFileIcon,
  formatFileSize,
  MAX_FILES,
  MAX_FILE_SIZE
} from '@/lib/utils/file-upload';

interface FileUploadProps {
  userId: string;
  consultationId?: string; // Optional for new consultations
  initialFiles?: AttachmentFile[];
  onFilesChange: (files: AttachmentFile[]) => void;
  disabled?: boolean;
}

export default function FileUpload({
  userId,
  consultationId,
  initialFiles = [],
  onFilesChange,
  disabled = false
}: FileUploadProps) {
  const [files, setFiles] = useState<AttachmentFile[]>(initialFiles);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync files state with parent whenever it changes
  React.useEffect(() => {
    console.log('📡 Files state changed, notifying parent:', files);
    onFilesChange(files);
  }, [files, onFilesChange]);

  // Update parent when files change (now handled by useEffect)
  const updateFiles = useCallback((newFiles: AttachmentFile[]) => {
    setFiles(newFiles);
  }, []);

  // Upload file directly (helper function for auto-upload)
  const uploadFileDirectly = useCallback(async (fileToUpload: AttachmentFile, currentFiles: AttachmentFile[]) => {
    if (disabled || fileToUpload.uploadStatus !== 'pending') return;

    console.log('🚀 Starting upload for:', fileToUpload.name);

    // Find the file index
    const fileIndex = currentFiles.findIndex(f => f.id === fileToUpload.id);
    if (fileIndex === -1) return;

    // Update status to uploading
    const updatedFiles = [...currentFiles];
    updatedFiles[fileIndex] = { ...fileToUpload, uploadStatus: 'uploading', uploadProgress: 0 };
    setFiles(updatedFiles);

    // Upload file (consultationId is optional now)
    const result = await uploadFile(
      fileToUpload.file,
      userId,
      consultationId || null,
      (progress) => {
        setFiles(prev => {
          const progressFiles = [...prev];
          const progressFileIndex = progressFiles.findIndex(f => f.id === fileToUpload.id);
          if (progressFileIndex !== -1) {
            progressFiles[progressFileIndex] = {
              ...progressFiles[progressFileIndex],
              uploadProgress: progress
            };
          }
          return progressFiles;
        });
      }
    );

    console.log('📤 Upload result for', fileToUpload.name, ':', result);

    // Update file status - use setFiles with callback to get latest state
    setFiles(prev => {
      const finalFiles = [...prev];
      const finalFileIndex = finalFiles.findIndex(f => f.id === fileToUpload.id);
      if (finalFileIndex !== -1) {
        if (result.success) {
          finalFiles[finalFileIndex] = {
            ...finalFiles[finalFileIndex],
            uploadStatus: 'completed',
            uploadProgress: 100,
            storagePath: result.path
          };
          console.log('✅ Upload completed:', fileToUpload.name, 'Path:', result.path);
        } else {
          finalFiles[finalFileIndex] = {
            ...finalFiles[finalFileIndex],
            uploadStatus: 'error',
            errorMessage: result.error
          };
          console.error('❌ Upload failed:', fileToUpload.name, 'Error:', result.error);
        }
      }
      return finalFiles;
    });

    // Parent will be notified via useEffect when files state changes
  }, [disabled, userId, consultationId]);

  // Handle file selection
  const handleFiles = useCallback(async (fileList: FileList) => {
    if (disabled) return;

    const newFiles: AttachmentFile[] = [];
    const currentFileCount = files.length;

    for (let i = 0; i < Math.min(fileList.length, MAX_FILES - currentFileCount); i++) {
      const file = fileList[i];
      const validation = validateFile(file);

      if (!validation.valid) {
        // Show error for invalid files
        alert(`${file.name}: ${validation.error}`);
        continue;
      }

      const attachmentFile: AttachmentFile = {
        id: `${Date.now()}-${i}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadStatus: 'pending'
      };

      // Generate preview for images
      if (file.type.startsWith('image/')) {
        attachmentFile.preview = await generateFilePreview(file);
      }

      newFiles.push(attachmentFile);
    }

    if (newFiles.length > 0) {
      const updatedFiles = [...files, ...newFiles];
      updateFiles(updatedFiles);

      // Auto-upload files immediately (without consultationId)
      // Use setTimeout to ensure state is updated first
      setTimeout(() => {
        for (const newFile of newFiles) {
          // Upload directly without waiting for state update
          uploadFileDirectly(newFile, updatedFiles);
        }
      }, 100);
    }

    // Show warning if file limit exceeded
    if (currentFileCount + fileList.length > MAX_FILES) {
      alert(`최대 ${MAX_FILES}개 파일까지 업로드 가능합니다.`);
    }
  }, [files, updateFiles, disabled, uploadFileDirectly]);

  // File input change handler
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setDragActive(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (!disabled && e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles, disabled]);

  // Remove file
  const removeFile = useCallback(async (fileId: string) => {
    if (disabled) return;

    const fileToRemove = files.find(f => f.id === fileId);
    if (!fileToRemove) return;

    // If file was uploaded, delete from storage
    if (fileToRemove.storagePath && consultationId) {
      const result = await deleteFile(fileToRemove.storagePath);
      if (!result.success) {
        alert(`파일 삭제 실패: ${result.error}`);
        return;
      }
    }

    updateFiles(files.filter(f => f.id !== fileId));
  }, [files, updateFiles, disabled, consultationId]);

  // Upload file
  const uploadSingleFile = useCallback(async (fileId: string, filesList?: AttachmentFile[]) => {
    if (disabled) return;

    const currentFiles = filesList || files;
    const fileIndex = currentFiles.findIndex(f => f.id === fileId);
    if (fileIndex === -1) return;

    const fileToUpload = currentFiles[fileIndex];
    if (fileToUpload.uploadStatus !== 'pending') return;

    // Update status to uploading
    const updatedFiles = [...currentFiles];
    updatedFiles[fileIndex] = { ...fileToUpload, uploadStatus: 'uploading', uploadProgress: 0 };
    updateFiles(updatedFiles);

    // Upload file (consultationId is optional now)
    const result = await uploadFile(
      fileToUpload.file,
      userId,
      consultationId || null,
      (progress) => {
        const progressFiles = [...updatedFiles];
        const progressFileIndex = progressFiles.findIndex(f => f.id === fileId);
        if (progressFileIndex !== -1) {
          progressFiles[progressFileIndex] = {
            ...progressFiles[progressFileIndex],
            uploadProgress: progress
          };
          updateFiles(progressFiles);
        }
      }
    );

    // Update file status
    const finalFiles = [...updatedFiles];
    const finalFileIndex = finalFiles.findIndex(f => f.id === fileId);
    if (finalFileIndex !== -1) {
      if (result.success) {
        finalFiles[finalFileIndex] = {
          ...finalFiles[finalFileIndex],
          uploadStatus: 'completed',
          uploadProgress: 100,
          storagePath: result.path
        };
      } else {
        finalFiles[finalFileIndex] = {
          ...finalFiles[finalFileIndex],
          uploadStatus: 'error',
          errorMessage: result.error
        };
      }
      updateFiles(finalFiles);
    }
  }, [files, updateFiles, userId, consultationId, disabled]);

  // Download file
  const downloadFile = useCallback(async (file: AttachmentFile) => {
    if (!file.storagePath) return;

    const result = await getFileUrl(file.storagePath);
    if (result.url) {
      const link = document.createElement('a');
      link.href = result.url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert(`다운로드 실패: ${result.error}`);
    }
  }, []);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>첨부파일 (선택)</Label>
        <p className="text-xs text-muted-foreground">
          최대 {MAX_FILES}개, 개별 파일 {MAX_FILE_SIZE / 1024 / 1024}MB 이하
          <br />
          허용 형식: JPG, PNG, PDF, DOC, DOCX, HWP
        </p>
      </div>

      {/* Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${dragActive ? 'border-primary bg-primary/5' : 'border-border'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}
          ${files.length >= MAX_FILES ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!disabled && files.length < MAX_FILES && fileInputRef.current) {
            fileInputRef.current.click();
          }
        }}
      >
        <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          {files.length >= MAX_FILES
            ? '파일 업로드 한도에 도달했습니다'
            : '파일을 드래그하거나 클릭하여 선택하세요'}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.hwp"
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled || files.length >= MAX_FILES}
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 p-3 border border-border rounded-lg bg-background"
            >
              {/* File Icon/Preview */}
              <div className="flex-shrink-0">
                {file.preview ? (
                  <Image
                    src={file.preview}
                    alt={file.name}
                    width={40}
                    height={40}
                    className="object-cover rounded"
                  />
                ) : (
                  <div className="w-10 h-10 flex items-center justify-center bg-muted rounded">
                    <span className="text-lg">{getFileIcon(file.type)}</span>
                  </div>
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>

                {/* Upload Progress */}
                {file.uploadStatus === 'uploading' && (
                  <div className="mt-1">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-primary h-1.5 rounded-full transition-all"
                        style={{ width: `${file.uploadProgress || 0}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {file.uploadStatus === 'error' && (
                  <p className="text-xs text-destructive mt-1">{file.errorMessage}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {/* Upload Button (for pending files) - manual upload option */}
                {file.uploadStatus === 'pending' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => uploadSingleFile(file.id)}
                    disabled={disabled}
                  >
                    <Upload className="h-3 w-3" />
                  </Button>
                )}

                {/* Download Button (for uploaded files) */}
                {/* 등록 시에는 다운로드 버튼 불필요 - 추후 필요 시 주석 해제 */}
                {/* {file.uploadStatus === 'completed' && file.storagePath && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadFile(file)}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                )} */}

                {/* Retry Button (for failed uploads) */}
                {file.uploadStatus === 'error' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => uploadSingleFile(file.id)}
                    disabled={disabled}
                  >
                    재시도
                  </Button>
                )}

                {/* Remove Button */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => removeFile(file.id)}
                  disabled={disabled || file.uploadStatus === 'uploading'}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
