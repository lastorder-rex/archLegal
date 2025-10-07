import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 테스트 설정
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',

  // 테스트 타임아웃
  timeout: 30 * 1000,
  expect: {
    timeout: 5000
  },

  // 병렬 실행 설정
  fullyParallel: true,

  // CI 환경에서 재시도 설정
  retries: process.env.CI ? 2 : 0,

  // 워커 수 (CI에서는 1개, 로컬에서는 병렬)
  workers: process.env.CI ? 1 : undefined,

  // 리포터 설정
  reporter: [
    ['html'],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],

  // 모든 테스트에 공통으로 사용할 설정
  use: {
    // 기본 URL (환경변수로 오버라이드 가능)
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3002',

    // 스크린샷 설정
    screenshot: 'only-on-failure',

    // 비디오 설정
    video: 'retain-on-failure',

    // 트레이스 설정
    trace: 'on-first-retry',

    // 액션 타임아웃
    actionTimeout: 10000,

    // 네비게이션 타임아웃
    navigationTimeout: 15000,
  },

  // 테스트 프로젝트 설정 (다양한 브라우저)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // 모바일 테스트
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // 개발 서버 설정 (테스트 시 자동으로 시작)
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3002',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
