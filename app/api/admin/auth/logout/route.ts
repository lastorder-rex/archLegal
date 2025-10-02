import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: '로그아웃되었습니다.'
    });

    // Clear admin session cookie
    response.cookies.delete('admin_session');

    return response;

  } catch (error) {
    console.error('Admin logout error:', error);
    return NextResponse.json(
      { error: '로그아웃 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
