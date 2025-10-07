import { test, expect } from '@playwright/test';
import { fillForm, expectErrorMessage } from './utils/test-helpers';

test.describe('상담 신청 폼', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: 로그인 상태로 변경 필요
    await page.goto('/request');
  });

  test('폼이 정상적으로 렌더링되어야 한다', async ({ page }) => {
    // 주요 섹션 확인
    await expect(page.getByText(/사용자 정보/)).toBeVisible();
    await expect(page.getByText(/주소 정보/)).toBeVisible();
    await expect(page.getByText(/상담 내용/)).toBeVisible();
    await expect(page.getByText(/첨부파일/)).toBeVisible();
  });

  test('필수 필드 검증이 동작해야 한다', async ({ page }) => {
    // 제출 버튼 클릭 (필수값 없이)
    await page.getByRole('button', { name: /상담 요청 제출/ }).click();

    // 에러 메시지 확인
    await expectErrorMessage(page, /이름은 2글자 이상 입력해주세요/);
  });

  test('전화번호 포맷팅이 동작해야 한다', async ({ page }) => {
    const phoneInput = page.locator('#phone');

    // 숫자만 입력
    await phoneInput.fill('01012345678');

    // 자동 포맷팅 확인
    await expect(phoneInput).toHaveValue('010-1234-5678');
  });

  test('주소 검색 모달이 열려야 한다', async ({ page }) => {
    // 주소 검색 버튼 클릭
    await page.getByRole('button', { name: /주소 검색/ }).click();

    // 모달이 열렸는지 확인 (주소 검색 API 키가 필요)
    await expect(page.getByPlaceholder(/주소를 입력/)).toBeVisible({
      timeout: 10000
    });
  });

  test('이메일 검증이 동작해야 한다', async ({ page }) => {
    const emailInput = page.locator('#email');

    // 잘못된 이메일 입력
    await emailInput.fill('invalid-email');
    await emailInput.blur();

    // 폼 제출 시 검증
    const nameInput = page.locator('#name');
    await nameInput.fill('홍길동');

    const phoneInput = page.locator('#phone');
    await phoneInput.fill('01012345678');

    // 제출 버튼 클릭
    await page.getByRole('button', { name: /상담 요청 제출/ }).click();

    // 에러 확인
    await expect(page.locator('.text-destructive')).toBeVisible();
  });

  test('상담 내용 글자수 제한이 표시되어야 한다', async ({ page }) => {
    const messageTextarea = page.locator('#message');

    // 텍스트 입력
    const testMessage = '테스트 메시지입니다.';
    await messageTextarea.fill(testMessage);

    // 글자수 표시 확인
    await expect(page.getByText(`${testMessage.length}/1000`)).toBeVisible();
  });

  test('상세 주소는 선택사항이어야 한다', async ({ page }) => {
    const addressDetailInput = page.locator('#addressDetail');

    // 라벨 확인
    await expect(page.getByText(/상세 주소 \(선택\)/)).toBeVisible();

    // 입력 가능 확인
    await addressDetailInput.fill('101동 1001호');
    await expect(addressDetailInput).toHaveValue('101동 1001호');
  });

  test('첨부파일 섹션이 표시되어야 한다', async ({ page }) => {
    await expect(page.getByText(/권장 첨부파일: 위임장, 인감증명서/)).toBeVisible();
  });

  test('닫기 버튼이 동작해야 한다', async ({ page }) => {
    const closeButton = page.getByRole('button', { name: /닫기/ });
    await expect(closeButton).toBeVisible();

    // 클릭 시 뒤로가기 동작 (실제로는 history.back())
    await closeButton.click();
  });
});

test.describe('상담 신청 폼 - 성공 시나리오', () => {
  test.skip('전체 폼 제출이 성공해야 한다', async ({ page }) => {
    // TODO: 실제 로그인 상태 및 주소 선택 구현 필요
    await page.goto('/request');

    // 폼 입력
    await fillForm(page, {
      name: '홍길동',
      phone: '01012345678',
      email: 'test@example.com',
      addressDetail: '101동 1001호',
      message: '상담 요청 테스트입니다.'
    });

    // 제출
    await page.getByRole('button', { name: /상담 요청 제출/ }).click();

    // 성공 메시지 확인
    await expect(page.getByText(/상담 요청이 저장되었습니다/)).toBeVisible({
      timeout: 10000
    });
  });
});
