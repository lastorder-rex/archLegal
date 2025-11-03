#!/usr/bin/env node

const { google } = require('googleapis');

function loadEnvFile(filePath) {
  try {
    const content = require('fs').readFileSync(filePath, 'utf8');
    content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .forEach((line) => {
        const eqIndex = line.indexOf('=');
        if (eqIndex === -1) return;
        const key = line.slice(0, eqIndex).trim();
        let value = line.slice(eqIndex + 1).trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        if (!(key in process.env)) {
          process.env[key] = value;
        }
      });
  } catch (error) {
    // Ignore missing file
  }
}

loadEnvFile(require('path').resolve(process.cwd(), '.env.local'));

function parseServiceAccountKey() {
  const directJson = process.env.GOOGLE_SERVICE_KEY;
  const base64Json = process.env.GOOGLE_SERVICE_KEY_BASE64;

  if (!directJson && !base64Json) {
    throw new Error('Google service account credentials are not configured.');
  }

  const jsonString = directJson ?? Buffer.from(base64Json, 'base64').toString('utf8');
  const parsed = JSON.parse(jsonString);

  if (typeof parsed.client_email !== 'string' || typeof parsed.private_key !== 'string') {
    throw new Error('Google service account credentials are missing client_email or private_key.');
  }

  return {
    client_email: parsed.client_email,
    private_key: parsed.private_key.replace(/\\n/g, '\n')
  };
}

async function deleteDriveFile(fileId) {
  if (!fileId) {
    throw new Error('drive_file_id is required');
  }

  const credentials = parseServiceAccountKey();

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive']
  });

  const authClient = await auth.getClient();
  const drive = google.drive({
    version: 'v3',
    auth: authClient
  });

  // 1. Diagnostic Check: Check if the file is visible to the service account
  try {
    console.log(`[Diagnostic] Checking file visibility for ID: ${fileId}`);

    // supportsAllDrives must be true for files in Shared Drives
    const fileMetadata = await drive.files.get({
        fileId: fileId,
        fields: 'id, name, owners, capabilities, parents',
        supportsAllDrives: true
    });

    const file = fileMetadata.data;
    console.log(`[Diagnostic] File Found: "${file.name}" (ID: ${file.id})`);

    // Check if the current service account is an owner or has permission to delete
    const canDelete = file.capabilities && file.capabilities.canDelete;

    if (!canDelete) {
        console.warn(`[Permission Warning] Service account may not have direct deletion capabilities for this file.`);
        console.warn(`[Permission Warning] Current file parents: ${file.parents ? file.parents.join(', ') : 'None'}`);
    }

  } catch (get_error) {
    if (get_error.code === 404) {
        throw new Error(`[Error 404] File Not Found or Access Denied. Check the service account's permissions in the Shared Drive/Folder.`);
    }
    if (get_error.code === 403) {
        throw new Error(`[Error 403] Permission Denied. Service account cannot access this file. Ensure it is a Content Manager or higher.`);
    }
    throw new Error(`[Error on GET] Could not verify file existence: ${get_error.message}`);
  }

  // 2. Attempt Deletion
  console.log(`[Action] Attempting to delete file ID: ${fileId}`);
  await drive.files.delete({
    fileId,
    supportsAllDrives: true
  });
}

async function main() {
  const fileId = process.argv[2];

  if (!fileId) {
    console.error('Usage: node scripts/delete-drive-file.js <drive_file_id>');
    process.exit(1);
  }

  try {
    console.log('Deleting Drive file:', fileId);
    await deleteDriveFile(fileId);
    console.log('Drive delete completed:', fileId);
  } catch (error) {
    console.error('Drive delete failed:', error);
    process.exit(1);
  }
}

main();
