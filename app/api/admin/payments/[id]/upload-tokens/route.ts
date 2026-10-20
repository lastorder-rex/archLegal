import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getSupabaseAdminClient } from '@/lib/utils/supabase-admin';
import { verifyAdminSession } from '@/lib/admin/auth';
import {
  UploadAudience,
  normalizeAudience,
  resolveAllowedTemplates,
  resolveMaxFilesPerFolder
} from '@/lib/services/upload-context';
import { buildUploadUrl } from '@/lib/admin/upload-url';

const DEFAULT_EXPIRY_HOURS = 24;
const DEFAULT_EXPIRY_BY_AUDIENCE: Record<UploadAudience, number> = {
  customer: DEFAULT_EXPIRY_HOURS,
  staff: 24 * 7
};

function computeExpiresAt(hours: number, audience: UploadAudience) {
  const fallback = DEFAULT_EXPIRY_BY_AUDIENCE[audience] ?? DEFAULT_EXPIRY_HOURS;
  const safeHours = Number.isFinite(hours) && hours > 0 ? hours : fallback;
  const expires = new Date(Date.now() + safeHours * 60 * 60 * 1000);
  return expires.toISOString();
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

    const tokens = (data ?? []).map((row) => {
      const audience = normalizeAudience(row.audience);
      const allowedTemplates = resolveAllowedTemplates(row.scope, audience);
      return {
        id: row.id,
        token: row.token,
        status: row.status,
        expiresAt: row.expires_at,
        createdAt: row.created_at,
        sentTo: row.sent_to,
        sentMethod: row.sent_method,
        sentAt: row.sent_at,
        driveFolderId: row.drive_folder_id,
        uploadUrl: buildUploadUrl(row.token),
        audience,
        allowedTemplates,
        maxFilesPerFolder: resolveMaxFilesPerFolder(row.max_files_per_folder, audience)
      };
    });

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

    const { expiresInHours, sentTo, sentMethod, audience: rawAudience, allowedTemplates: rawAllowedTemplates, maxFilesPerFolder } =
      await request.json().catch(() => ({}));

    const audience = normalizeAudience(rawAudience);
    const allowedTemplates = resolveAllowedTemplates({ allowedTemplates: rawAllowedTemplates }, audience);
    const maxFiles = resolveMaxFilesPerFolder(maxFilesPerFolder, audience);

    if (paymentStage.status !== 'paid') {
      return NextResponse.json({ error: '결제 완료 상태에서만 업로드 링크를 생성할 수 있습니다.' }, { status: 400 });
    }

    await expireOverdueTokens(params.id);

    const driveFolder = await fetchDriveFolderInfo(params.id);

    let tokenValue = randomUUID();
    let insertedRow = null;
    const expiresAt = computeExpiresAt(Number(expiresInHours), audience);
    const nowIso = new Date().toISOString();
    const scopePayload = {
      allowedTemplates
    };

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
          audience,
          scope: scopePayload,
          max_files_per_folder: maxFiles,
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

    const responseAudience = normalizeAudience(insertedRow.audience);

    try {
      let previousTokensQuery = supabase
        .from('upload_tokens')
        .select('id, token')
        .eq('consultation_id', paymentStage.consultation_id)
        .neq('id', insertedRow.id)
        .eq('audience', responseAudience);

      if (insertedRow.payment_id) {
        previousTokensQuery = previousTokensQuery.eq('payment_id', insertedRow.payment_id);
      } else {
        previousTokensQuery = previousTokensQuery.is('payment_id', null);
      }

      const { data: previousTokens, error: previousTokensError } = await previousTokensQuery;

      if (previousTokensError) {
        console.error('[admin/payments/upload-tokens] previous token fetch error', previousTokensError);
      } else if (previousTokens && previousTokens.length > 0) {
        const previousTokenValues = Array.from(
          new Set(previousTokens.map((token) => token.token).filter((value): value is string => Boolean(value)))
        );

        if (previousTokenValues.length === 0) {
          console.log('[admin/payments/upload-tokens] upload log reassignment skipped (no previous token values)', {
            newTokenId: insertedRow.id,
            newToken: insertedRow.token,
            consultationId: paymentStage.consultation_id,
            paymentId: insertedRow.payment_id,
            audience: responseAudience
          });
        } else {
          let updateQuery = supabase
            .from('upload_logs')
            .update({ upload_token: insertedRow.token })
            .eq('consultation_id', paymentStage.consultation_id)
            .in('upload_token', previousTokenValues);

          if (insertedRow.payment_id) {
            updateQuery = updateQuery.eq('payment_id', insertedRow.payment_id);
          } else {
            updateQuery = updateQuery.is('payment_id', null);
          }

          const { data: updatedRows, error: logUpdateError } = await updateQuery.select('id');
          if (logUpdateError) {
            console.error('[admin/payments/upload-tokens] upload log reassignment (by token) error', logUpdateError);
          } else {
            console.log('[admin/payments/upload-tokens] upload log reassignment summary', {
              affectedCount: updatedRows?.length ?? 0,
              newToken: insertedRow.token,
              affectedTokens: previousTokenValues,
              consultationId: paymentStage.consultation_id,
              paymentId: insertedRow.payment_id,
              audience: responseAudience
            });
          }
        }
      } else {
        console.log('[admin/payments/upload-tokens] upload log reassignment skipped (no previous tokens)', {
          newTokenId: insertedRow.id,
          newToken: insertedRow.token,
          consultationId: paymentStage.consultation_id,
          paymentId: insertedRow.payment_id,
          audience: responseAudience
        });
      }
    } catch (logUpdateError) {
      console.error('[admin/payments/upload-tokens] upload log reassignment unexpected error', logUpdateError);
    }

    const responsePayload = {
      id: insertedRow.id,
      token: insertedRow.token,
      status: insertedRow.status,
      expiresAt: insertedRow.expires_at,
      createdAt: insertedRow.created_at,
      sentTo: insertedRow.sent_to,
      sentMethod: insertedRow.sent_method,
      uploadUrl: buildUploadUrl(insertedRow.token),
      audience: responseAudience,
      allowedTemplates: resolveAllowedTemplates(insertedRow.scope, responseAudience),
      maxFilesPerFolder: resolveMaxFilesPerFolder(insertedRow.max_files_per_folder, responseAudience)
    };

    return NextResponse.json({ token: responsePayload });
  } catch (error) {
    console.error('[admin/payments/upload-tokens] create error', error);
    return NextResponse.json({ error: '업로드 링크를 생성하지 못했습니다.' }, { status: 500 });
  }
}
