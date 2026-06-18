import { sendConsultationNotification } from '@/lib/telegram';

describe('sendConsultationNotification', () => {
  const originalEnv = process.env;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      TELEGRAM_BOT_TOKEN: 'test-token',
      TELEGRAM_CHANNEL_ID: '-1001234567890',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    if (originalFetch) {
      globalThis.fetch = originalFetch;
    } else {
      // @ts-expect-error cleanup fetch polyfill
      delete globalThis.fetch;
    }
    jest.restoreAllMocks();
  });

  it('sends an HTML-formatted Telegram message with escaped user input', async () => {
    const fetchMock = jest.fn(async () => ({
      json: async () => ({ ok: true }),
    })) as jest.Mock;
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await sendConsultationNotification({
      name: '홍길동 <대표>',
      phone: '010-1234-5678',
      email: 'test&owner@example.com',
      address: '서울시 강남구 <테헤란로>',
      address_detail: '101호 & 102호',
      main_purps: '단독주택',
      message: '문의 내용에 <태그> & 특수문자가 있습니다.',
      attachmentCount: 2,
      representativeAttachmentName: '행복빌라 집합건축물 대장.pdf',
      representativeAttachmentUrl: 'https://example.com/file?token=abc&download=1',
    });

    expect(result).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.telegram.org/bottest-token/sendMessage',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const [, requestInit] = fetchMock.mock.calls[0];
    const body = JSON.parse(requestInit.body);

    expect(body.chat_id).toBe('-1001234567890');
    expect(body.parse_mode).toBe('HTML');
    expect(body.disable_web_page_preview).toBe(true);
    expect(body.text).toContain('홍길동 &lt;대표&gt;');
    expect(body.text).toContain('test&amp;owner@example.com');
    expect(body.text).toContain('네이버 지도에서 보기');
    expect(body.text).toContain(
      'https://map.naver.com/v5/search/%EC%84%9C%EC%9A%B8%EC%8B%9C%20%EA%B0%95%EB%82%A8%EA%B5%AC%20%3C%ED%85%8C%ED%97%A4%EB%9E%80%EB%A1%9C%3E?searchCoord=0,0,15,0,0,0'
    );
    expect(body.text).toContain('📎 <b>첨부파일:</b> 2개');
    expect(body.text).toContain('대표 파일: 행복빌라 집합건축물 대장.pdf');
    expect(body.text).toContain('https://example.com/file?token=abc&amp;download=1');
    expect(body.text).toContain('문의 내용에 &lt;태그&gt; &amp; 특수문자가 있습니다.');
  });

  it('does not call Telegram when configuration is missing', async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    const fetchMock = jest.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = await sendConsultationNotification({
      name: '홍길동',
      phone: '010-1234-5678',
      address: '서울시 강남구',
      message: '상담 요청',
    });

    expect(result).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
