import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getMenuAuthLink } from '@/lib/auth/menu-auth';

// 킥 3D 페이지 — public 밖(kick/)의 소스를 라우트로 서빙.
// 개발: 원본(kick/qna3d.html) / 운영: 압축본(kick/qna3d.min.html). ?min=1 로 압축본 테스트.
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const useMin =
    process.env.NODE_ENV === 'production' ||
    new URL(request.url).searchParams.get('min') === '1';
  const file = useMin ? 'kick/qna3d.min.html' : 'kick/qna3d.html';
  let html: string;
  try {
    html = await readFile(join(process.cwd(), file), 'utf8');
  } catch {
    html = await readFile(join(process.cwd(), 'kick/qna3d.html'), 'utf8');
  }
  // 카카오 공유 SDK 키 주입(/check와 동일한 NEXT_PUBLIC 키 — 단일 소스).
  const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY ?? '';
  const auth = await getMenuAuthLink();
  html = html
    .replaceAll('__KAKAO_JS_KEY__', kakaoKey)
    .replaceAll('__AUTH_HREF__', auth.href)
    .replaceAll('__AUTH_LABEL__', auth.label);
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
