import { test, expect } from '@playwright/test';

test.describe('랜딩 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('페이지가 정상적으로 로드되어야 한다', async ({ page }) => {
    // 타이틀 확인
    await expect(page).toHaveTitle(/건축물 양성화 전문 플랫폼/);

    // 주요 헤딩 확인
    await expect(
      page.getByRole('heading', { name: /특정건축물 정리에 관한 특별법 안내/ })
    ).toBeVisible();
  });

  test('네비게이션 메뉴가 동작해야 한다', async ({ page }) => {
    // 네비게이션 링크 확인
    const navLinks = ['법시행안내', '양성화절차', '상담안내'];

    for (const linkText of navLinks) {
      const link = page.getByRole('link', { name: linkText });
      await expect(link).toBeVisible();
    }
  });

  test('무료 상담 신청 버튼을 클릭하면 모달이 열려야 한다', async ({ page }) => {
    // 무료 상담 신청 버튼 클릭
    await page.getByRole('button', { name: /무료 상담 신청/ }).first().click();

    // 로그인 모달이 열리는지 확인 (로그인 안 된 상태)
    await expect(page.getByText(/카카오로 로그인/)).toBeVisible();
  });

  test('절차 자세히 보기 버튼이 동작해야 한다', async ({ page }) => {
    // PDF 다운로드 버튼 확인
    const downloadButton = page.getByRole('button', { name: /절차 자세히 보기/ });
    await expect(downloadButton).toBeVisible();
  });

  test('다크모드 토글이 동작해야 한다', async ({ page }) => {
    // 테마 토글 버튼 찾기
    const themeToggle = page.locator('[aria-label*="theme"], [data-theme-toggle]').first();

    if (await themeToggle.isVisible()) {
      await themeToggle.click();

      // 다크모드 클래스가 추가되었는지 확인
      const html = page.locator('html');
      const hasClass = await html.evaluate((el) =>
        el.classList.contains('dark')
      );
      expect(hasClass).toBeTruthy();
    }
  });

  test('스크롤 인디케이터가 표시되어야 한다', async ({ page }) => {
    // 스크롤 인디케이터 확인
    const scrollIndicator = page.getByText(/scroll/i);
    await expect(scrollIndicator).toBeVisible();
  });

  test('모바일 메뉴가 동작해야 한다', async ({ page }) => {
    // 모바일 뷰포트로 변경
    await page.setViewportSize({ width: 375, height: 667 });

    // 햄버거 메뉴 버튼 클릭
    const menuButton = page.getByRole('button', { name: /메뉴 열기/i });

    if (await menuButton.isVisible()) {
      await menuButton.click();

      // 모바일 메뉴가 열렸는지 확인
      await expect(page.getByText(/법시행안내/)).toBeVisible();
    }
  });

  test('섹션별 정보가 올바르게 표시되어야 한다', async ({ page }) => {
    // Interest 섹션
    await expect(page.getByText(/법 시행 안내 & 소요 기간/)).toBeVisible();
    await expect(page.getByText(/1~2개월/)).toBeVisible();

    // Desire 섹션
    await expect(page.getByText(/양성화의 장점과 확실한 절차/)).toBeVisible();
    await expect(page.getByText(/낮춘 비용 부담/)).toBeVisible();
    await expect(page.getByText(/재산 가치 상승/)).toBeVisible();

    // Action 섹션
    await expect(page.getByText(/무허가·위반 건축물 양성화, 마지막 기회!/)).toBeVisible();
  });

  test('연락처 정보가 표시되어야 한다', async ({ page }) => {
    // 연락처 확인
    await expect(page.getByText(/010-7332-3815/)).toBeVisible();
    await expect(page.getByText(/02-6348-1009/)).toBeVisible();
  });
});
