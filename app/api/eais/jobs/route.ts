import { NextRequest, NextResponse } from 'next/server';
import { createEaisIssueJob, listRecentEaisIssueJobs } from '@/lib/eais/jobs';
import { verifyAdminSession } from '@/lib/utils/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await verifyAdminSession();
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const jobs = await listRecentEaisIssueJobs();
    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('EAIS jobs list error:', error);
    return NextResponse.json({ error: '발급 작업 목록 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdminSession();
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const job = await createEaisIssueJob({
      address: body.address,
      docType: body.docType ?? 'auto',
      dongHo: body.dongHo ?? '',
      delivery: body.delivery ?? 'drive',
      email: body.email ?? '',
      requestedByAdminId: auth.adminId,
      source: 'manual_admin',
      metadata: { requestedVia: 'rex-admin-api' },
    });

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : '발급 작업 생성 중 오류가 발생했습니다.';
    console.error('EAIS job create error:', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
