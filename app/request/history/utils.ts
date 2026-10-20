import { getFileUrl } from '@/lib/utils/file-upload';
import type { ConsultationAttachment } from './types';

// Download attachment file
export const downloadAttachment = async (attachment: ConsultationAttachment) => {
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
