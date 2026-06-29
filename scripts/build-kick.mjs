// 킥 3D 페이지(kick/qna3d.html)를 압축 → kick/qna3d.min.html
// 인라인 JS(terser)·CSS 압축 + 주석/공백 제거. importmap(JSON)·module 스크립트 보존.
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { minify } from 'html-minifier-terser';

const root = process.cwd();
const src = join(root, 'kick/qna3d.html');
const out = join(root, 'kick/qna3d.min.html');

const html = await readFile(src, 'utf8');
const min = await minify(html, {
  collapseWhitespace: true,
  removeComments: true,
  minifyCSS: true,
  minifyJS: { module: true, compress: true, mangle: true, format: { comments: false } },
  // importmap·module 스크립트 타입 보존
  ignoreCustomFragments: [/<script[^>]*type=["']importmap["'][\s\S]*?<\/script>/i],
});
await writeFile(out, min, 'utf8');
console.log(`build-kick: ${html.length} → ${min.length} bytes (${Math.round((1 - min.length / html.length) * 100)}% 감소)`);
