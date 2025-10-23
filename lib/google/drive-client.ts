import { google, drive_v3 } from 'googleapis';

type ServiceAccountKey = {
  client_email: string;
  private_key: string;
};

let driveClientPromise: Promise<drive_v3.Drive> | null = null;

function parseServiceAccountKey(): ServiceAccountKey {
  const directJson = process.env.GOOGLE_SERVICE_KEY;
  const base64Json = process.env.GOOGLE_SERVICE_KEY_BASE64;

  if (!directJson && !base64Json) {
    throw new Error('Google service account credentials are not configured.');
  }

  let parsed: Record<string, unknown>;
  try {
    const jsonString = directJson ?? Buffer.from(base64Json as string, 'base64').toString('utf8');
    parsed = JSON.parse(jsonString);
  } catch (error) {
    throw new Error(`Failed to parse Google service account credentials: ${(error as Error).message}`);
  }

  const clientEmail = parsed.client_email;
  const privateKey = parsed.private_key;

  if (typeof clientEmail !== 'string' || typeof privateKey !== 'string') {
    throw new Error('Google service account credentials are missing client_email or private_key.');
  }

  return {
    client_email: clientEmail,
    private_key: privateKey.replace(/\\n/g, '\n')
  };
}

export function isDriveDryRun(): boolean {
  return String(process.env.DRIVE_DRY_RUN ?? '').toLowerCase() === 'true';
}

export function getDriveRootFolderId(): string {
  const rootFolderId = process.env.GOOGLE_ROOT_FOLDER_ID;
  if (!rootFolderId) {
    throw new Error('GOOGLE_ROOT_FOLDER_ID environment variable is not set.');
  }
  return rootFolderId;
}

export function getDriveSharedDriveId(): string | null {
  const sharedDriveId = process.env.GOOGLE_SHARED_DRIVE_ID;
  return sharedDriveId ? sharedDriveId : null;
}

export async function getDriveClient(): Promise<drive_v3.Drive> {
  if (!driveClientPromise) {
    driveClientPromise = (async () => {
      const credentials = parseServiceAccountKey();

      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive']
      });

      const authClient = await auth.getClient();
      return google.drive({
        version: 'v3',
        auth: authClient as any
      });
    })();
  }

  return driveClientPromise;
}
