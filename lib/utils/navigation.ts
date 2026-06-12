export function sanitizeRedirectPath(value: string | null | undefined, fallback = '/') {
  if (!value) return fallback;
  try {
    const decoded = decodeURIComponent(value);
    return decoded.startsWith('/') && !decoded.startsWith('//') ? decoded : fallback;
  } catch (error) {
    return fallback;
  }
}
