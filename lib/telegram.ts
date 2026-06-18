type ConsultationNotificationData = {
  name: string;
  phone: string;
  email?: string | null;
  address: string;
  address_detail?: string | null;
  main_purps?: string | null;
  message?: string | null;
  attachmentCount?: number;
  representativeAttachmentName?: string | null;
  representativeAttachmentUrl?: string | null;
};

const TELEGRAM_API_BASE = 'https://api.telegram.org';
const TELEGRAM_REQUEST_TIMEOUT_MS = 5000;

const buildNaverMapUrl = (address: string) =>
  `https://map.naver.com/v5/search/${encodeURIComponent(address)}?searchCoord=0,0,15,0,0,0`;

const composeMessage = (consultationData: ConsultationNotificationData) => {
  const fullAddress = `${consultationData.address}${
    consultationData.address_detail ? ` ${consultationData.address_detail}` : ''
  }`;
  const naverMapUrl = buildNaverMapUrl(consultationData.address);
  const attachmentSection = consultationData.attachmentCount
    ? `
📎 <b>첨부파일:</b> ${consultationData.attachmentCount}개${
        consultationData.representativeAttachmentName && consultationData.representativeAttachmentUrl
          ? `
대표 파일: ${escapeHtml(consultationData.representativeAttachmentName)}
🔗 <a href="${escapeHtml(consultationData.representativeAttachmentUrl)}">대표 파일 보기</a>`
          : ''
      }
`
    : '';

  return `
🆕 <b>새 상담 요청이 등록되었습니다</b>

👤 <b>고객명:</b> ${escapeHtml(consultationData.name)}
📞 <b>연락처:</b> ${escapeHtml(consultationData.phone)}
${consultationData.email ? `📧 <b>이메일:</b> ${escapeHtml(consultationData.email)}` : ''}

📍 <b>주소:</b> ${escapeHtml(fullAddress)}
🗺 <a href="${escapeHtml(naverMapUrl)}">네이버 지도에서 보기</a>
🏠 <b>건축물 용도:</b> ${escapeHtml(consultationData.main_purps || '확인 필요')}
${attachmentSection}

💬 <b>상담 내용:</b>
${escapeHtml(consultationData.message || '별도 요청사항 없음')}

⏰ <b>등록시간:</b> ${escapeHtml(new Date().toLocaleString('ko-KR'))}

#새상담
  `.trim();
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

export async function sendConsultationNotification(
  consultationData: ConsultationNotificationData,
): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const channelId = process.env.TELEGRAM_CHANNEL_ID;

  if (!token || !channelId) {
    console.error('❌ Telegram configuration missing');
    return false;
  }

  const message = composeMessage(consultationData);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TELEGRAM_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        chat_id: channelId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const result = (await response.json()) as { ok?: boolean };

    if (result.ok) {
      console.log('✅ Telegram notification sent successfully');
      return true;
    }

    console.error('❌ Failed to send Telegram notification:', result);
    return false;
  } catch (error) {
    console.error('💥 Telegram notification error:', error);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export async function sendTestMessage(): Promise<boolean> {
  const testData: ConsultationNotificationData = {
    name: '홍길동',
    phone: '010-1234-5678',
    email: 'test@example.com',
    address: '서울특별시 강남구 테헤란로 123',
    address_detail: '101동 1502호',
    main_purps: '단독주택',
    message: '증축 관련 상담을 받고 싶습니다.',
  };

  return sendConsultationNotification(testData);
}
