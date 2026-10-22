// IndexNow: sitemap.xml의 전체 URL을 Bing·Naver·Yandex 등에 즉시 통지. 배포 후 1회 실행.
//   node scripts/indexnow-ping.mjs            # sitemap 전체
//   node scripts/indexnow-ping.mjs /guide /calc  # 특정 경로만
const HOST = 'www.archlegal.co.kr';
const KEY = '6a6b12e374a9942426164ec8c041e0a2'; // public/${KEY}.txt 와 동일해야 함

const args = process.argv.slice(2);
const urlList = args.length
  ? args.map(p => `https://${HOST}${p}`)
  : [...(await (await fetch(`https://${HOST}/sitemap.xml`)).text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList }),
});
console.log(`IndexNow ${res.status} ${res.statusText} — ${urlList.length} urls`);
if (!res.ok) { console.log(await res.text()); process.exit(1); }
