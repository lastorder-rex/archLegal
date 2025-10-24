import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/utils/supabase-admin';
import { verifyAdminSession } from '@/lib/utils/admin-auth';

type UpdateAction =
  | { action: 'markPaid'; paidAmount?: number | null; paidAt?: string | null; paymentKey?: string | null }
  | { action: 'reopen'; reason?: string };

async function fetchPaymentDetail(id: string) {
  const supabase = getSupabaseAdminClient();

  const { data: row, error } = await supabase
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
        stage_template:payment_stage_templates(id, stage_order, code, title, description, default_amount),
        consultation:consultations(id, name, phone, email, address, address_detail, created_at)
      `
    )
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[admin/payments] detail fetch error', error);
    throw new Error('결제 정보를 불러오지 못했습니다.');
  }

  if (!row) {
    return null;
  }

  const { data: driveRow, error: driveError } = await supabase
    .from('consultation_drive_folders')
    .select('id, drive_folder_id, drive_folder_name, status, updated_at, metadata')
    .eq('user_payment_stage_id', row.id)
    .maybeSingle();

  if (driveError) {
    console.error('[admin/payments] drive folder fetch error', driveError);
  }

  let requestedByAdmin: { id: string; username: string } | null = null;
  if (row.requested_by) {
    const { data: adminRow, error: adminError } = await supabase
      .from('admin_users')
      .select('id, username')
      .eq('id', row.requested_by)
      .maybeSingle();

    if (!adminError && adminRow) {
      requestedByAdmin = adminRow;
    }
  }

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
    stageTemplate: row.stage_template && !Array.isArray(row.stage_template)
      ? {
          id: (row.stage_template as any).id,
          stageOrder: (row.stage_template as any).stage_order,
          code: (row.stage_template as any).code,
          title: (row.stage_template as any).title,
          description: (row.stage_template as any).description,
          defaultAmount: (row.stage_template as any).default_amount !== null ? Number((row.stage_template as any).default_amount) : null
        }
      : null,
    consultation: row.consultation ?? null,
    requestedByAdmin,
    driveFolder: driveRow
      ? {
          id: driveRow.id,
          driveFolderId: driveRow.drive_folder_id,
          driveFolderName: driveRow.drive_folder_name,
          status: driveRow.status,
          metadata: driveRow.metadata ?? null,
          updatedAt: driveRow.updated_at
        }
      : null
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyAdminSession();
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const payment = await fetchPaymentDetail(params.id);
    if (!payment) {
      return NextResponse.json({ error: '해당 결제 정보를 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({ payment });
  } catch (error) {
    console.error('[admin/payments] detail unexpected error', error);
    return NextResponse.json({ error: '결제 내역을 불러오지 못했습니다.' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyAdminSession();
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { adminId } = authResult;

    const body: UpdateAction = await request.json();
    if (!body || !('action' in body)) {
      return NextResponse.json({ error: '요청 형식이 올바르지 않습니다.' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    const { data: current, error: fetchError } = await supabase
      .from('user_payment_stages')
      .select('id, user_id, consultation_id, status, request_amount, paid_amount, paid_at, payment_key')
      .eq('id', params.id)
      .maybeSingle();

    if (fetchError) {
      console.error('[admin/payments] status fetch error', fetchError);
      return NextResponse.json({ error: '결제 정보를 불러올 수 없습니다.' }, { status: 500 });
    }

    if (!current) {
      return NextResponse.json({ error: '해당 결제 정보를 찾을 수 없습니다.' }, { status: 404 });
    }

    const nowIso = new Date().toISOString();

    if (body.action === 'markPaid') {
      if (current.status === 'paid') {
        return NextResponse.json({ error: '이미 결제 완료 처리된 단계입니다.' }, { status: 400 });
      }

      if (current.status === 'locked') {
        return NextResponse.json({ error: '결제 요청이 진행 중인 단계에서만 완료 처리가 가능합니다.' }, { status: 400 });
      }

      const paidAmount =
        typeof body.paidAmount === 'number' && !Number.isNaN(body.paidAmount)
          ? body.paidAmount
          : current.request_amount !== null
            ? Number(current.request_amount)
            : null;

      const paidAt = body.paidAt ?? nowIso;
      const paymentKey = body.paymentKey ?? current.payment_key ?? null;

      const { error: updateError } = await supabase
        .from('user_payment_stages')
        .update({
          status: 'paid',
          paid_amount: paidAmount,
          paid_at: paidAt,
          payment_key: paymentKey,
          updated_at: nowIso
        })
        .eq('id', params.id);

      if (updateError) {
        console.error('[admin/payments] mark paid error', updateError);
        return NextResponse.json({ error: '결제 완료 처리 중 오류가 발생했습니다.' }, { status: 500 });
      }

      try {
        await supabase.from('payment_notifications').insert({
          user_payment_stage_id: params.id,
          notification_type: 'payment_marked_paid',
          payload: {
            adminId,
            paidAmount,
            paidAt,
            paymentKey,
            markedAt: nowIso
          }
        });
      } catch (notificationError) {
        console.error('[admin/payments] mark paid notification error', notificationError);
      }
    } else if (body.action === 'reopen') {
      if (current.status !== 'paid') {
        return NextResponse.json({ error: '결제 완료 상태에서만 재오픈할 수 있습니다.' }, { status: 400 });
      }

      const { error: updateError } = await supabase
        .from('user_payment_stages')
        .update({
          status: 'awaiting',
          paid_amount: null,
          paid_at: null,
          updated_at: nowIso
        })
        .eq('id', params.id);

      if (updateError) {
        console.error('[admin/payments] reopen error', updateError);
        return NextResponse.json({ error: '결제 단계 재오픈 중 오류가 발생했습니다.' }, { status: 500 });
      }

      try {
        await supabase.from('payment_notifications').insert({
          user_payment_stage_id: params.id,
          notification_type: 'payment_reopened',
          payload: {
            adminId,
            reason: body.reason ?? null,
            reopenedAt: nowIso
          }
        });
      } catch (notificationError) {
        console.error('[admin/payments] reopen notification error', notificationError);
      }
    } else {
      return NextResponse.json({ error: '지원하지 않는 작업입니다.' }, { status: 400 });
    }

    const updated = await fetchPaymentDetail(params.id);
    if (!updated) {
      return NextResponse.json({ error: '결제 정보를 다시 불러오지 못했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ payment: updated });
  } catch (error) {
    console.error('[admin/payments] status update unexpected error', error);
    return NextResponse.json({ error: '결제 단계 업데이트 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
