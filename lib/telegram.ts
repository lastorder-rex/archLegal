type ConsultationNotificationData = {
  name: string;
  phone: string;
  email?: string | null;
  address: string;
  address_detail?: string | null;
  main_purps?: string | null;
  message?: string | null;
};

const TELEGRAM_API_BASE = 'https://api.telegram.org';

const composeMessage = (consultationData: ConsultationNotificationData) => {
  const fullAddress = `${consultationData.address}${
    consultationData.address_detail ? ` ${consultationData.address_detail}` : ''
  }`;

  return `
🆕 *새 상담 요청이 등록되었습니다*

👤 *고객명:* ${consultationData.name}
📞 *연락처:* ${consultationData.phone}
${consultationData.email ? `📧 *이메일:* ${consultationData.email}` : ''}

📍 *주소:* ${fullAddress}
🏠 *건축물 용도:* ${consultationData.main_purps || '확인 필요'}

💬 *상담 내용:*
${consultationData.message || '별도 요청사항 없음'}

⏰ *등록시간:* ${new Date().toLocaleString('ko-KR')}

#새상담 #${consultationData.name.replace(/\s/g, '')}
  `.trim();
};

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

  try {
    const response = await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: channelId,
        text: message,
        parse_mode: 'Markdown',
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
