const AUTH_ERROR_MESSAGES: Record<string, string> = {
  over_request_rate_limit: '로그인 요청이 일시적으로 많아 잠시 제한되었습니다. 몇 분 뒤 다시 시도해주세요.',
  oauth_exchange_failed: '카카오 로그인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
};

export function getAuthErrorMessage(error: string | null | undefined) {
  if (!error) {
    return null;
  }

  return AUTH_ERROR_MESSAGES[error] ?? '로그인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
}

