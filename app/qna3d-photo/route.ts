import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// 실사 사진형 진단맵(실험) — kick/qna3d-photo.html 서빙. /3d.png 위에 12핀 오버레이.
// 회전은 없고 줌/이동/핀 클릭만. 정식 메뉴 아님 → noindex.
export const dynamic = 'force-dynamic';

export async function GET() {
  let html = await readFile(join(process.cwd(), 'kick/qna3d-photo.html'), 'utf8');
  const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY ?? '';
  html = html.replaceAll('__KAKAO_JS_KEY__', kakaoKey);
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
