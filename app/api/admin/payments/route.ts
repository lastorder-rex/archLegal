import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/utils/supabase-admin';
import { verifyAdminSession } from '@/lib/utils/admin-auth';

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
        stage_template:payment_stage_templates(id, stage_order, code, title),
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

    if (consultationName) {
      query = query.ilike('consultations.name', `%${consultationName}%`);
    }

    if (consultationPhone) {
      query = query.ilike('consultations.phone', `%${consultationPhone}%`);
    }

    if (consultationAddress) {
      query = query.ilike('consultations.address', `%${consultationAddress}%`);
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
        stageTemplate: row.stage_template ?? null,
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
