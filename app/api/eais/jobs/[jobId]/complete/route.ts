import { NextRequest, NextResponse } from 'next/server';
import { completeEaisIssueJob } from '@/lib/eais/jobs';
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
    const body = await request.json().catch(() => ({}));
    const job = await completeEaisIssueJob(params.jobId, {
      workerId: auth.workerId,
      resultSummary: body.resultSummary,
    });

    if (!job) {
      return NextResponse.json({ error: '작업을 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({ job });
  } catch (error) {
    console.error('EAIS job complete error:', error);
    return NextResponse.json({ error: '작업 완료 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
