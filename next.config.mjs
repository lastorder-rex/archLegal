/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        // 구 실험 랜딩 /home-v2를 메인(/)으로 승격 → 기존 URL·북마크·내부링크 정리
        source: '/home-v2',
        destination: '/',
        permanent: true,
      },
      {
        source: '/legalization-check.html',
        destination: '/check',
        permanent: true,
      },
      {
        source: '/legalization-check',
        destination: '/check',
        permanent: true,
      },
      {
        source: encodeURI('/특별조치법'),
        destination: '/special-act',
        permanent: true,
      },
    ];
  },
  async headers() {
    // 공통 보안 헤더 — X-Frame-Options만 경로별로 다르게.
    const security = (frame) => [
      { key: 'X-Frame-Options', value: frame },
      { key: 'X-Content-Type-Options', value: 'nosniff' }, // MIME 스니핑 방지
      { key: 'Referrer-Policy', value: 'origin-when-cross-origin' }, // 레퍼러 제어
      { key: 'X-DNS-Prefetch-Control', value: 'on' }, // DNS 프리페치
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' }, // 브라우저 기능 제한
    ];
    return [
      // /consult-embed는 qna3d·qna3d-photo(단독 HTML)에서 same-origin iframe 팝업으로 띄우므로 SAMEORIGIN 허용
      { source: '/consult-embed', headers: security('SAMEORIGIN') },
      { source: '/consult-embed/:path*', headers: security('SAMEORIGIN') },
      // 그 외 전 경로는 iframe 삽입 차단(DENY) — 클릭재킹 방지
      { source: '/((?!consult-embed).*)', headers: security('DENY') },
    ];
  },
};

export default nextConfig;
