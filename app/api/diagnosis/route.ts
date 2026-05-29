import { NextRequest, NextResponse } from 'next/server';
import { evaluateLegalizationDiagnosis, type DiagnosisAnswer } from '@/lib/diagnosis/legalization';

function normalizeAnswers(value: unknown): DiagnosisAnswer[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is DiagnosisAnswer => {
      return (
        typeof item === 'object' &&
        item !== null &&
        typeof (item as DiagnosisAnswer).questionId === 'string' &&
        typeof (item as DiagnosisAnswer).optionId === 'string'
      );
    })
    .slice(0, 20);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const answers = normalizeAnswers(body.answers);
    const diagnosis = evaluateLegalizationDiagnosis(answers);

    return NextResponse.json(diagnosis);
  } catch (error) {
    console.error('[diagnosis] evaluation failed', error);

    return NextResponse.json(
      { error: '자가진단 결과를 계산하지 못했습니다.' },
      { status: 500 }
    );
  }
}
