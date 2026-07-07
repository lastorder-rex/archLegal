'use client';

export type KakaoShareTemplate = {
  objectType: 'feed';
  content: {
    title: string;
    description: string;
    imageUrl: string;
    imageWidth: number;
    imageHeight: number;
    link: {
      mobileWebUrl: string;
      webUrl: string;
    };
  };
  buttons: Array<{
    title: string;
    link: {
      mobileWebUrl: string;
      webUrl: string;
    };
  }>;
};

declare global {
  interface Window {
    Kakao?: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Share?: {
        sendDefault: (template: KakaoShareTemplate) => void;
      };
    };
  }
}

const KAKAO_JAVASCRIPT_KEY = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;

const KAKAO_SHARE_IMAGE_SIZE = 800;
const UNSUPPORTED_SHARE_MESSAGE = '공유를 지원하지 않는 브라우저입니다. 주소창의 링크를 복사해주세요.';

export type KakaoShareConfig = {
  /** URL used for the Kakao feed link, Web Share, and clipboard fallback. */
  shareUrl: string;
  /** Kakao feed content title (also used as the Web Share title). */
  title: string;
  /** Kakao feed description. */
  description: string;
  /** Kakao feed image URL. */
  imageUrl: string;
  /** Kakao feed action button label. */
  buttonTitle: string;
  /**
   * Optional text for the native Web Share sheet (navigator.share). When
   * omitted, no `text` field is included in the share payload.
   */
  webShareText?: string;
  /** Toast message shown after the URL is copied to the clipboard. */
  copiedToastMessage: string;
  /** Callback used to surface toast/notice messages (setter differs per client). */
  onToast: (message: string) => void;
  /** Optional override for the "unsupported browser" toast message. */
  unsupportedToastMessage?: string;
};

/**
 * Shared Kakao share hook. Encapsulates the Kakao JS SDK initialization and the
 * sendDefault(feed) → navigator.share → clipboard fallback flow. Message copy,
 * image, URL, and toast handling are supplied per call site via `config`.
 */
export function useKakaoShare() {
  const initializeKakaoSdk = () => {
    if (!KAKAO_JAVASCRIPT_KEY || !window.Kakao || window.Kakao.isInitialized()) {
      return;
    }

    window.Kakao.init(KAKAO_JAVASCRIPT_KEY);
  };

  const share = async (config: KakaoShareConfig) => {
    const {
      shareUrl,
      title,
      description,
      imageUrl,
      buttonTitle,
      webShareText,
      copiedToastMessage,
      onToast,
      unsupportedToastMessage = UNSUPPORTED_SHARE_MESSAGE
    } = config;

    const fallbackShare = async () => {
      if (navigator.share) {
        const shareData =
          webShareText !== undefined
            ? { title, text: webShareText, url: shareUrl }
            : { title, url: shareUrl };
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      onToast(copiedToastMessage);
    };

    try {
      initializeKakaoSdk();

      if (window.Kakao?.Share && window.Kakao.isInitialized()) {
        window.Kakao.Share.sendDefault({
          objectType: 'feed',
          content: {
            title,
            description,
            imageUrl,
            imageWidth: KAKAO_SHARE_IMAGE_SIZE,
            imageHeight: KAKAO_SHARE_IMAGE_SIZE,
            link: { mobileWebUrl: shareUrl, webUrl: shareUrl }
          },
          buttons: [
            {
              title: buttonTitle,
              link: { mobileWebUrl: shareUrl, webUrl: shareUrl }
            }
          ]
        });
        return;
      }

      await fallbackShare();
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      try {
        await fallbackShare();
      } catch {
        onToast(unsupportedToastMessage);
      }
    }
  };

  return {
    kakaoShareEnabled: Boolean(KAKAO_JAVASCRIPT_KEY),
    initializeKakaoSdk,
    share
  };
}
