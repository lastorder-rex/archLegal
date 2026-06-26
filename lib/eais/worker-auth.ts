import { NextRequest } from 'next/server';

type WorkerAuthResult =
  | { success: true; workerId: string }
  | { success: false; error: string; status: number };

function getExpectedToken() {
  return process.env.EAIS_WORKER_TOKEN || process.env.REX_WORKER_TOKEN || '';
}

export function requireWorkerAuth(request: NextRequest): WorkerAuthResult {
  const expectedToken = getExpectedToken();
  if (!expectedToken) {
    return {
      success: false,
      error: 'EAIS_WORKER_TOKEN 또는 REX_WORKER_TOKEN이 설정되어 있지 않습니다.',
      status: 500,
    };
  }

  const auth = request.headers.get('authorization') || '';
  if (auth !== `Bearer ${expectedToken}`) {
    return {
      success: false,
      error: '작업자 인증에 실패했습니다.',
      status: 401,
    };
  }

  const workerId = request.headers.get('x-worker-id') || 'eais-agent';
  return { success: true, workerId };
}
