import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface UpdateConsultationRequest {
  name?: string;
  phone?: string;
  email?: string;
  message?: string;
  attachments?: {
    name: string;
    size: number;
    type: string;
    storagePath: string;
  }[];
}

// PATCH method to update consultation
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const consultationId = params.id;
    const body: UpdateConsultationRequest = await request.json();

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Get authenticated user
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.email !== undefined) updateData.email = body.email?.trim() || null;
    if (body.message !== undefined) updateData.message = body.message?.trim() || null;
    if (body.attachments !== undefined) updateData.attachments = body.attachments;

    // Update consultation (only if user owns it)
    const { data: consultation, error: updateError } = await supabase
      .from('consultations')
      .update(updateData)
      .eq('id', consultationId)
      .eq('user_id', session.user.id)
      .select('id')
      .single();

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json(
        { error: '상담 요청 수정 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    if (!consultation) {
      return NextResponse.json(
        { error: '수정 권한이 없거나 존재하지 않는 상담 요청입니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '상담 요청이 수정되었습니다.',
      id: consultation.id
    });

  } catch (error) {
    console.error('Consultation update error:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: '요청 데이터 형식이 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: '상담 요청 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE method to soft delete consultation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const consultationId = params.id;

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Get authenticated user
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // Soft delete consultation (only if user owns it)
    const { data: consultation, error: deleteError } = await supabase
      .from('consultations')
      .update({
        is_del: 'Y',
        deleted_at: new Date().toISOString()
      })
      .eq('id', consultationId)
      .eq('user_id', session.user.id)
      .select('id')
      .single();

    if (deleteError) {
      console.error('Database delete error:', deleteError);
      return NextResponse.json(
        { error: '상담 요청 삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    if (!consultation) {
      return NextResponse.json(
        { error: '삭제 권한이 없거나 존재하지 않는 상담 요청입니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '상담 요청이 삭제되었습니다.',
      id: consultation.id
    });

  } catch (error) {
    console.error('Consultation delete error:', error);
    return NextResponse.json(
      { error: '상담 요청 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}