/**
 * 개발 환경에서만 로그를 출력하는 유틸리티
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  /**
   * 일반 로그 (개발 환경에서만)
   */
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * 경고 로그 (모든 환경)
   */
  warn: (...args: any[]) => {
    console.warn(...args);
  },

  /**
   * 에러 로그 (모든 환경)
   */
  error: (...args: any[]) => {
    console.error(...args);
  },

  /**
   * 디버그 로그 (개발 환경에서만, 이모지 포함)
   */
  debug: (emoji: string, message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(`${emoji} ${message}`, ...args);
    }
  },
};
