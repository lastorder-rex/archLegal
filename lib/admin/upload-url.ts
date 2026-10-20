export function buildUploadUrl(token: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:3002';
  return `${base.replace(/\/$/, '')}/upload?token=${token}`;
}
