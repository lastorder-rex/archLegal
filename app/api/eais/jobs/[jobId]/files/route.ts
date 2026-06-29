import { NextRequest, NextResponse } from 'next/server';
import { registerEaisIssueJobFiles } from '@/lib/eais/jobs';
import { requireWorkerAuth } from '@/lib/eais/worker-auth';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const auth = requireWorkerAuth(request);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    if (!Array.isArray(body.files)) {
      return NextResponse.json({ error: 'files 배열이 필요합니다.' }, { status: 400 });
    }

    const files = await registerEaisIssueJobFiles(params.jobId, body.files, auth.workerId);
    return NextResponse.json({ files });
  } catch (error) {
    const message = error instanceof Error ? error.message : '파일 등록 중 오류가 발생했습니다.';
    console.error('EAIS job files error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
