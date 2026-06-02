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
    expect(body.text).toContain('홍길동 &lt;대표&gt;');
    expect(body.text).toContain('test&amp;owner@example.com');
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
