import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getSupabaseAdminClient } from '@/lib/utils/supabase-admin';
import { verifyAdminSession } from '@/lib/utils/admin-auth';

const DEFAULT_EXPIRY_HOURS = 24;

function computeExpiresAt(hours: number) {
  const safeHours = Number.isFinite(hours) && hours > 0 ? hours : DEFAULT_EXPIRY_HOURS;
  const expires = new Date(Date.now() + safeHours * 60 * 60 * 1000);
  return expires.toISOString();
}

function buildUploadUrl(token: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:3002';
  return `${base.replace(/\/$/, '')}/upload?token=${token}`;
}

async function expireOverdueTokens(paymentStageId: string) {
  const supabase = getSupabaseAdminClient();
  await supabase
    .from('upload_tokens')
    .update({ status: 'expired', updated_at: new Date().toISOString() })
    .eq('payment_id', paymentStageId)
    .eq('status', 'active')
    .lt('expires_at', new Date().toISOString());
}

async function fetchPaymentStage(paymentStageId: string) {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from('user_payment_stages')
    .select('id, consultation_id, status')
    .eq('id', paymentStageId)
    .maybeSingle();

  if (error) {
    throw new Error('결제 정보를 조회하지 못했습니다.');
  }

  return data;
}

async function fetchDriveFolderInfo(paymentStageId: string) {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from('consultation_drive_folders')
    .select('drive_folder_id, drive_folder_name, status')
    .eq('user_payment_stage_id', paymentStageId)
    .maybeSingle();

  if (error) {
    throw new Error('문서 폴더 정보를 조회하지 못했습니다.');
  }

  return data;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAdminSession();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const paymentStage = await fetchPaymentStage(params.id);
    if (!paymentStage) {
      return NextResponse.json({ error: '해당 결제 단계를 찾을 수 없습니다.' }, { status: 404 });
    }

    await expireOverdueTokens(params.id);

    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from('upload_tokens')
      .select('*')
      .eq('payment_id', params.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[admin/payments/upload-tokens] list fetch error', error);
      return NextResponse.json({ error: '업로드 링크를 불러오지 못했습니다.' }, { status: 500 });
    }

    const tokens = (data ?? []).map((row) => ({
      id: row.id,
      token: row.token,
      status: row.status,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      sentTo: row.sent_to,
      sentMethod: row.sent_method,
      sentAt: row.sent_at,
      driveFolderId: row.drive_folder_id,
      uploadUrl: buildUploadUrl(row.token)
    }));

    return NextResponse.json({
      tokens,
      paymentStageStatus: paymentStage.status
    });
  } catch (error) {
    console.error('[admin/payments/upload-tokens] list error', error);
    return NextResponse.json({ error: '업로드 링크를 불러오지 못했습니다.' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAdminSession();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const supabase = getSupabaseAdminClient();

    const paymentStage = await fetchPaymentStage(params.id);
    if (!paymentStage) {
      return NextResponse.json({ error: '해당 결제 단계를 찾을 수 없습니다.' }, { status: 404 });
    }

    if (!paymentStage.consultation_id) {
      return NextResponse.json({ error: '연결된 상담 정보가 없어 업로드 링크를 만들 수 없습니다.' }, { status: 400 });
    }

    const { expiresInHours, sentTo, sentMethod } = await request.json().catch(() => ({}));

    if (paymentStage.status !== 'paid') {
      return NextResponse.json({ error: '결제 완료 상태에서만 업로드 링크를 생성할 수 있습니다.' }, { status: 400 });
    }

    await expireOverdueTokens(params.id);

    const driveFolder = await fetchDriveFolderInfo(params.id);

    let tokenValue = randomUUID();
    let insertedRow = null;
    const expiresAt = computeExpiresAt(Number(expiresInHours));
    const nowIso = new Date().toISOString();

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const { data, error: insertError } = await supabase
        .from('upload_tokens')
        .insert({
          token: tokenValue,
          consultation_id: paymentStage.consultation_id,
          payment_id: params.id,
          drive_folder_id: driveFolder?.drive_folder_id ?? null,
          expires_at: expiresAt,
          status: 'active',
          sent_to: sentTo ?? null,
          sent_method: sentMethod ?? null,
          created_by: auth.adminId,
          created_at: nowIso,
          updated_at: nowIso
        })
        .select()
        .maybeSingle();

      if (!insertError && data) {
        insertedRow = data;
        break;
      }

      if ((insertError as { code?: string } | null)?.code === '23505') {
        tokenValue = randomUUID();
        continue;
      }

      console.error('[admin/payments/upload-tokens] insert error', insertError);
      return NextResponse.json({ error: '업로드 링크를 생성하지 못했습니다.' }, { status: 500 });
    }

    if (!insertedRow) {
      return NextResponse.json({ error: '업로드 링크를 생성하지 못했습니다.' }, { status: 500 });
    }

    const responsePayload = {
      id: insertedRow.id,
      token: insertedRow.token,
      status: insertedRow.status,
      expiresAt: insertedRow.expires_at,
      createdAt: insertedRow.created_at,
      sentTo: insertedRow.sent_to,
      sentMethod: insertedRow.sent_method,
      uploadUrl: buildUploadUrl(insertedRow.token)
    };

    return NextResponse.json({ token: responsePayload });
  } catch (error) {
    console.error('[admin/payments/upload-tokens] create error', error);
    return NextResponse.json({ error: '업로드 링크를 생성하지 못했습니다.' }, { status: 500 });
  }
}
