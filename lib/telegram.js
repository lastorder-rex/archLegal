// 텔레그램 채널 알림 유틸리티

/**
 * 상담 요청 등록 시 텔레그램 채널에 알림 전송
 */
export async function sendConsultationNotification(consultationData) {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHANNEL_ID) {
    console.error('❌ Telegram configuration missing');
    return false;
  }

  // 주소 정보 구성 (기본 주소 + 상세 주소)
  const fullAddress = consultationData.address +
    (consultationData.address_detail ? ` ${consultationData.address_detail}` : '');

  const message = `
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

  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHANNEL_ID,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    const result = await response.json();

    if (result.ok) {
      console.log('✅ Telegram notification sent successfully');
      return true;
    } else {
      console.error('❌ Failed to send Telegram notification:', result);
      return false;
    }
  } catch (error) {
    console.error('💥 Telegram notification error:', error);
    return false;
  }
}

/**
 * 테스트 메시지 전송
 */
export async function sendTestMessage() {
  const testData = {
    name: '홍길동',
    phone: '010-1234-5678',
    email: 'test@example.com',
    address: '서울특별시 강남구 테헤란로 123',
    address_detail: '101동 1502호',
    main_purps: '단독주택',
    message: '증축 관련 상담을 받고 싶습니다.'
  };

  return await sendConsultationNotification(testData);
}