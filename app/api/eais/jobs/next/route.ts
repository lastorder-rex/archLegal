import { NextRequest, NextResponse } from 'next/server';
import { claimNextEaisIssueJob } from '@/lib/eais/jobs';
import { requireWorkerAuth } from '@/lib/eais/worker-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const auth = requireWorkerAuth(request);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const job = await claimNextEaisIssueJob(auth.workerId);
    if (!job) {
      return NextResponse.json({ job: null });
    }

    return NextResponse.json({ job });
  } catch (error) {
    console.error('EAIS next job error:', error);
    return NextResponse.json({ error: '다음 작업 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
