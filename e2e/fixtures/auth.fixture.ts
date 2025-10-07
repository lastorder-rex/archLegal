import { test as base } from '@playwright/test';

/**
 * 인증된 사용자 상태를 제공하는 Fixture
 */
export const test = base.extend({
  /**
   * 카카오 로그인이 완료된 상태의 페이지
   * 실제 환경에서는 Mock을 사용하거나 테스트용 계정 필요
   */
  authenticatedPage: async ({ page }, use) => {
    // TODO: 실제 카카오 로그인 또는 세션 Mock 구현
    // 현재는 기본 페이지로 전달
    await page.goto('/');
    await use(page);
  },

  /**
   * 관리자 로그인이 완료된 상태의 페이지
   */
  adminPage: async ({ page }, use) => {
    // TODO: 관리자 로그인 구현
    await page.goto('/supercore');
    await use(page);
  },
});

export { expect } from '@playwright/test';
