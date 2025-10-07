import type { Page } from '@playwright/test';

/**
 * 테스트 헬퍼 함수 모음
 */

/**
 * 페이지 로딩 완료 대기
 */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
}

/**
 * 특정 텍스트가 화면에 나타날 때까지 대기
 */
export async function waitForText(page: Page, text: string, timeout = 5000) {
  await page.waitForSelector(`text=${text}`, { timeout });
}

/**
 * 에러 메시지 확인
 */
export async function expectErrorMessage(page: Page, message: string) {
  const errorElement = page.locator('.text-destructive', { hasText: message });
  await errorElement.waitFor({ state: 'visible' });
  return errorElement;
}

/**
 * 성공 메시지 확인
 */
export async function expectSuccessMessage(page: Page, message: string) {
  const successElement = page.locator('.text-primary', { hasText: message });
  await successElement.waitFor({ state: 'visible' });
  return successElement;
}

/**
 * 폼 입력 헬퍼
 */
export async function fillForm(
  page: Page,
  fields: Record<string, string>
) {
  for (const [name, value] of Object.entries(fields)) {
    await page.fill(`[name="${name}"], #${name}`, value);
  }
}

/**
 * 스크린샷 캡처 (디버깅용)
 */
export async function takeDebugScreenshot(page: Page, name: string) {
  await page.screenshot({
    path: `test-results/screenshots/${name}-${Date.now()}.png`,
    fullPage: true
  });
}
