import { NextResponse } from 'next/server';
import { getEaisIssueJobResult } from '@/lib/eais/jobs';
import { verifyAdminSession } from '@/lib/utils/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { jobId: string } }
) {
  const auth = await verifyAdminSession();
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const result = await getEaisIssueJobResult(params.jobId);
    if (!result) {
      return NextResponse.json({ error: '작업을 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('EAIS job get error:', error);
    return NextResponse.json({ error: '작업 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
