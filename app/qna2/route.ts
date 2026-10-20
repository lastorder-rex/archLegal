import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const dynamic = 'force-static';

export async function GET() {
  const htmlPath = join(process.cwd(), 'public/qna2/archilaw-expert-qna.html');
  const html = await readFile(htmlPath, 'utf8');

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8'
    }
  });
}
