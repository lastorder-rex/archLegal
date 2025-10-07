import { test, expect } from '@playwright/test';

test.describe('관리자 대시보드', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: 관리자 로그인 상태 구현 필요
    await page.goto('/supercore');
  });

  test('로그인 페이지가 표시되어야 한다', async ({ page }) => {
    // 로그인 페이지 확인
    await expect(
      page.getByRole('heading', { name: /관리자 로그인/ })
    ).toBeVisible();

    await expect(page.getByPlaceholder(/아이디/)).toBeVisible();
    await expect(page.getByPlaceholder(/비밀번호/)).toBeVisible();
  });

  test('잘못된 자격증명으로 로그인 시 에러가 표시되어야 한다', async ({ page }) => {
    await page.getByPlaceholder(/아이디/).fill('invalid');
    await page.getByPlaceholder(/비밀번호/).fill('wrong');

    await page.getByRole('button', { name: /로그인/ }).click();

    // 에러 메시지 확인
    await expect(page.locator('.text-destructive')).toBeVisible({
      timeout: 5000
    });
  });
});

test.describe('관리자 대시보드 - 로그인 후', () => {
  test.skip('대시보드 메인 화면이 표시되어야 한다', async ({ page }) => {
    // TODO: 관리자 로그인 구현
    await page.goto('/supercore');

    // 대시보드 타이틀 확인
    await expect(page.getByText(/관리자 대시보드/)).toBeVisible();

    // 사이드바 메뉴 확인
    await expect(page.getByText(/상담 게시판/)).toBeVisible();
    await expect(page.getByText(/회원 관리/)).toBeVisible();
    await expect(page.getByText(/관리자 계정/)).toBeVisible();
  });

  test.skip('상담 게시판 페이지로 이동해야 한다', async ({ page }) => {
    await page.goto('/supercore');

    // 상담 게시판 클릭
    await page.getByText(/상담 게시판/).click();

    // URL 확인
    await expect(page).toHaveURL(/\/supercore\/consultations/);

    // 테이블이 표시되는지 확인
    await expect(page.getByRole('table')).toBeVisible();
  });

  test.skip('회원 관리 페이지로 이동해야 한다', async ({ page }) => {
    await page.goto('/supercore');

    // 회원 관리 클릭
    await page.getByText(/회원 관리/).click();

    // URL 확인
    await expect(page).toHaveURL(/\/supercore\/users/);
  });

  test.skip('로그아웃이 동작해야 한다', async ({ page }) => {
    await page.goto('/supercore');

    // 로그아웃 버튼 클릭
    await page.getByRole('button', { name: /로그아웃/ }).click();

    // 로그인 페이지로 리다이렉트 확인
    await expect(page).toHaveURL(/\/supercore/);
    await expect(page.getByRole('heading', { name: /관리자 로그인/ })).toBeVisible();
  });

  test.skip('모바일 메뉴가 동작해야 한다', async ({ page }) => {
    // 모바일 뷰포트
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/supercore');

    // 햄버거 메뉴 클릭
    const menuButton = page.getByRole('button').first();
    await menuButton.click();

    // 모바일 메뉴가 열렸는지 확인
    await expect(page.getByText(/대시보드/)).toBeVisible();
    await expect(page.getByText(/상담 게시판/)).toBeVisible();
  });
});

test.describe('상담 게시판', () => {
  test.skip('상담 목록이 표시되어야 한다', async ({ page }) => {
    await page.goto('/supercore/consultations');

    // 테이블 헤더 확인
    await expect(page.getByText(/이름/)).toBeVisible();
    await expect(page.getByText(/연락처/)).toBeVisible();
    await expect(page.getByText(/주소/)).toBeVisible();
    await expect(page.getByText(/상태/)).toBeVisible();
  });

  test.skip('상담 상세 페이지로 이동해야 한다', async ({ page }) => {
    await page.goto('/supercore/consultations');

    // 첫 번째 상담 클릭
    const firstRow = page.getByRole('row').nth(1);
    await firstRow.click();

    // 상세 페이지 확인
    await expect(page).toHaveURL(/\/supercore\/consultations\/[^/]+/);
    await expect(page.getByText(/상담 상세 정보/)).toBeVisible();
  });

  test.skip('검색 기능이 동작해야 한다', async ({ page }) => {
    await page.goto('/supercore/consultations');

    // 검색어 입력
    const searchInput = page.getByPlaceholder(/검색/);
    await searchInput.fill('홍길동');

    // 검색 버튼 클릭
    await page.getByRole('button', { name: /검색/ }).click();

    // 결과 확인
    await page.waitForTimeout(1000);
    await expect(page.getByText(/홍길동/)).toBeVisible();
  });
});

test.describe('회원 관리', () => {
  test.skip('회원 목록이 표시되어야 한다', async ({ page }) => {
    await page.goto('/supercore/users');

    // 테이블 헤더 확인
    await expect(page.getByText(/이름/)).toBeVisible();
    await expect(page.getByText(/이메일/)).toBeVisible();
    await expect(page.getByText(/가입일/)).toBeVisible();
  });

  test.skip('회원 상세 페이지로 이동해야 한다', async ({ page }) => {
    await page.goto('/supercore/users');

    // 첫 번째 회원 클릭
    const firstRow = page.getByRole('row').nth(1);
    await firstRow.click();

    // 회원 상세 페이지로 이동 확인
    await expect(page).toHaveURL(/\/supercore\/users\/[^/]+/);
  });
});
