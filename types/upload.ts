export type UploadLog = {
  id: string;
  fileName: string;
  filePath: string | null;
  mimeType: string | null;
  uploadedAt: string;
  preview?: string; // 클라이언트 미리보기 URL
  thumbnailUrl?: string | null; // 서버 썸네일 URL (Google Drive)
};

export type UploadFolder = {
  templateName: string;
  displayName: string;
  folderId: string | null;
  remainingSlots: number;
  uploads: UploadLog[];
};

export type UploadContextResponse = {
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

export type FolderStatus = {
  uploading: boolean;
  error: string | null;
  successMessage: string | null;
  uploadProgress?: {
    current: number;
    total: number;
  };
};

export type FolderStatusMap = Record<string, FolderStatus>;
