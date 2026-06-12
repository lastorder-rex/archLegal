import { sanitizeRedirectPath } from '@/lib/utils/navigation';

describe('sanitizeRedirectPath', () => {
  it('allows local paths with query strings', () => {
    expect(sanitizeRedirectPath('/check?consultation=open')).toBe('/check?consultation=open');
  });

  it('rejects protocol-relative and external paths', () => {
    expect(sanitizeRedirectPath('//example.com/path', '/fallback')).toBe('/fallback');
    expect(sanitizeRedirectPath('https://example.com/path', '/fallback')).toBe('/fallback');
  });
});
