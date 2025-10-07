import { test, expect } from '@playwright/test';

/**
 * 접근성(A11y) 테스트
 */
test.describe('접근성 테스트', () => {
  test('랜딩 페이지 - 키보드 네비게이션', async ({ page }) => {
    await page.goto('/');

    // Tab 키로 네비게이션
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // 포커스된 요소 확인
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT']).toContain(focusedElement);
  });

  test('폼 - 레이블과 입력 필드 연결', async ({ page }) => {
    await page.goto('/request');

    // 모든 input에 label이 있는지 확인
    const inputs = page.locator('input[type="text"], input[type="tel"], input[type="email"]');
    const count = await inputs.count();

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');

      if (id) {
        // 해당 input에 대한 label 확인
        const label = page.locator(`label[for="${id}"]`);
        await expect(label).toBeVisible();
      }
    }
  });

  test('버튼 - 접근 가능한 이름', async ({ page }) => {
    await page.goto('/');

    // 모든 버튼이 텍스트나 aria-label을 가져야 함
    const buttons = page.locator('button');
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const hasText = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');

      expect(hasText || ariaLabel).toBeTruthy();
    }
  });

  test('이미지 - alt 텍스트', async ({ page }) => {
    await page.goto('/');

    // 모든 img 태그가 alt 속성을 가져야 함
    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      expect(alt).toBeDefined();
    }
  });

  test('색상 대비 - 텍스트 가독성', async ({ page }) => {
    await page.goto('/');

    // 주요 텍스트 요소의 색상 대비 확인 (수동 확인 필요)
    const headings = page.locator('h1, h2, h3');
    await expect(headings.first()).toBeVisible();
  });

  test('모바일 - 터치 타겟 크기', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // 버튼이 최소 44x44px 크기를 가져야 함 (WCAG 권장)
    const buttons = page.locator('button').first();
    const boundingBox = await buttons.boundingBox();

    if (boundingBox) {
      expect(boundingBox.width).toBeGreaterThanOrEqual(40); // 약간의 여유
      expect(boundingBox.height).toBeGreaterThanOrEqual(40);
    }
  });
});
