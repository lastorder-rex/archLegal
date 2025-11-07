/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // 모든 경로에 보안 헤더 적용
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY', // 클릭재킹 방지 (iframe 삽입 차단)
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff', // MIME 타입 스니핑 방지
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin', // 레퍼러 정보 제어
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on', // DNS 프리페치 활성화 (성능 향상)
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()', // 불필요한 브라우저 기능 제한
          },
        ],
      },
    ];
  },
};

export default nextConfig;
