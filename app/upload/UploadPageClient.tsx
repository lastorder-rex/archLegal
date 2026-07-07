'use client';

import { formatExpiry } from '@/lib/utils/file-upload';
import { useUploadManager } from './useUploadManager';
import UploadHeader from './UploadHeader';
import FolderUploadCard from './FolderUploadCard';
import UploadGuide from './UploadGuide';
import { UploadLoadingScreen, UploadErrorScreen } from './UploadStatusScreens';

interface UploadPageClientProps {
  token: string;
}

export default function UploadPageClient({ token }: UploadPageClientProps) {
  const {
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
  } = useUploadManager(token);

  if (isLoading) {
    return <UploadLoadingScreen />;
  }

  if (pageError) {
    return <UploadErrorScreen pageError={pageError} />;
  }

  if (!uploadContext) {
    return null;
  }

  const remainingTimeText = formatExpiry(uploadContext.token.expiresInSeconds);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <UploadHeader uploadContext={uploadContext} />

        <section className="space-y-5">
          {uploadContext.folders.map((folder, index) => (
            <FolderUploadCard
              key={folder.templateName}
              folder={folder}
              index={index}
              maxFilesPerFolder={uploadContext.maxFilesPerFolder}
              status={folderStatuses[folder.templateName]}
              deletingIds={deletingUploadIds[folder.templateName] ?? new Set<string>()}
              draggingTemplateName={draggingTemplateName}
              setDraggingTemplateName={setDraggingTemplateName}
              filePreviews={filePreviews}
              failedThumbnailIds={failedThumbnailIds}
              setFailedThumbnailIds={setFailedThumbnailIds}
              onFolderUpload={handleFolderUpload}
              onDeleteUpload={handleDeleteUpload}
            />
          ))}
        </section>

        <UploadGuide remainingTimeText={remainingTimeText} />
      </div>
    </main>
  );
}
