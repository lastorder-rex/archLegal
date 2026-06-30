import { NextRequest, NextResponse } from 'next/server';

// 모바일 앱(이행강제금 계산기) 및 Expo 웹에서 직접 호출할 수 있도록 CORS를 허용한다.
// 이 라우트들은 공공 API 프록시(키 보호)일 뿐이라 공개 호출을 전제로 한다.
export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/** NextResponse.json 과 동일 시그니처 + CORS 헤더. */
export function corsJson(body: unknown, init?: ResponseInit): NextResponse {
  return NextResponse.json(body, {
    ...init,
    headers: { ...corsHeaders, ...(init?.headers as Record<string, string> | undefined) },
  });
}

/** 프리플라이트(OPTIONS) 응답. */
export function corsPreflight(): NextResponse {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// GET 라우트 공통 스캐폴딩: 핸들러가 throw 한 예외만 잡아 로그 + 500(JSON+CORS)으로 변환한다.
// 핸들러 내부에서 직접 return 하는 응답(성공/도메인 에러 early-return)은 그대로 통과시킨다.
export function withApiHandler(
  handler: (request: NextRequest) => Promise<NextResponse>,
  opts: { logLabel: string; errorMessage: string },
): (request: NextRequest) => Promise<NextResponse> {
  return async (request) => {
    try {
      return await handler(request);
    } catch (error) {
      console.error(opts.logLabel, error);
      return corsJson({ ok: false, error: opts.errorMessage }, { status: 500 });
    }
  };
}
