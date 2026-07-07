import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/utils/supabase-admin';
import { verifyAdminSession } from '@/lib/admin/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminSession();
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const supabase = getSupabaseAdminClient();
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    const status = searchParams.get('status');
    const stageTemplateId = searchParams.get('stageTemplateId');
    const consultationName = searchParams.get('name');
    const consultationPhone = searchParams.get('phone');
    const consultationAddress = searchParams.get('address');
    const requestedFrom = searchParams.get('requestedFrom');
    const requestedTo = searchParams.get('requestedTo');

    let query = supabase
      .from('user_payment_stages')
      .select(
        `
        id,
        user_id,
        consultation_id,
        stage_template_id,
        status,
        request_amount,
        requested_at,
        requested_by,
        paid_amount,
        paid_at,
        payment_key,
        updated_at,
        consultation:consultations(id, name, phone, address, address_detail)
      `,
        { count: 'exact' }
      )
      .order('requested_at', { ascending: false, nullsFirst: true })
      .range(offset, offset + limit - 1);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (stageTemplateId) {
      query = query.eq('stage_template_id', stageTemplateId);
    }

    // 조인된 consultations 테이블 필터링을 위해 먼저 해당 consultation_id들을 가져옴
    let consultationIds: string[] | null = null;

    if (consultationName || consultationPhone || consultationAddress) {
      let consultationQuery = supabase
        .from('consultations')
        .select('id');

      if (consultationName) {
        consultationQuery = consultationQuery.ilike('name', `%${consultationName}%`);
      }

      if (consultationPhone) {
        consultationQuery = consultationQuery.ilike('phone', `%${consultationPhone}%`);
      }

      if (consultationAddress) {
        consultationQuery = consultationQuery.ilike('address', `%${consultationAddress}%`);
      }

      const { data: consultations, error: consultationError } = await consultationQuery;

      if (consultationError) {
        console.error('[admin/payments] consultation filter error', consultationError);
        return NextResponse.json({ error: '상담 정보 조회 중 오류가 발생했습니다.' }, { status: 500 });
      }

      consultationIds = (consultations ?? []).map(c => c.id);

      // 매칭되는 상담이 없으면 빈 결과 반환
      if (consultationIds.length === 0) {
        return NextResponse.json({
          payments: [],
          page,
          limit,
          total: 0
        });
      }

      // consultation_id로 필터링
      query = query.in('consultation_id', consultationIds);
    }

    if (requestedFrom) {
      query = query.gte('requested_at', `${requestedFrom}T00:00:00`);
    }

    if (requestedTo) {
      query = query.lte('requested_at', `${requestedTo}T23:59:59`);
    }

    const { data: rows, error, count } = await query;

    if (error) {
      console.error('[admin/payments] list fetch error', error);
      return NextResponse.json({ error: '결제 내역을 불러오지 못했습니다.' }, { status: 500 });
    }

    const paymentStageIds = (rows ?? []).map((row) => row.id);
    let folderMap = new Map<string, { driveFolderId: string | null; driveFolderName: string | null; status: string | null }>();

    if (paymentStageIds.length > 0) {
      const { data: folderRows, error: folderError } = await supabase
        .from('consultation_drive_folders')
        .select('user_payment_stage_id, drive_folder_id, drive_folder_name, status')
        .in('user_payment_stage_id', paymentStageIds);

      if (folderError) {
        console.error('[admin/payments] drive folder fetch error', folderError);
      } else {
        folderMap = new Map(
          (folderRows ?? []).map((folderRow) => [
            folderRow.user_payment_stage_id,
            {
              driveFolderId: folderRow.drive_folder_id ?? null,
              driveFolderName: folderRow.drive_folder_name ?? null,
              status: folderRow.status ?? null
            }
          ])
        );
      }
    }

    const payments = (rows ?? []).map((row) => {
      const folderInfo = folderMap.get(row.id) ?? null;
      return {
        id: row.id,
        userId: row.user_id,
        consultationId: row.consultation_id,
        stageTemplateId: row.stage_template_id,
        status: row.status,
        requestAmount: row.request_amount !== null ? Number(row.request_amount) : null,
        requestedAt: row.requested_at,
        requestedBy: row.requested_by,
        paidAmount: row.paid_amount !== null ? Number(row.paid_amount) : null,
        paidAt: row.paid_at,
        paymentKey: row.payment_key,
        updatedAt: row.updated_at,
        consultation: row.consultation ?? null,
        driveFolder: folderInfo
      };
    });

    return NextResponse.json({
      payments,
      page,
      limit,
      total: count ?? 0
    });
  } catch (error) {
    console.error('[admin/payments] unexpected list error', error);
    return NextResponse.json({ error: '결제 내역을 불러오지 못했습니다.' }, { status: 500 });
  }
}
