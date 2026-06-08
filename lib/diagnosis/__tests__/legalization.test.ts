import { evaluateLegalizationDiagnosis, type DiagnosisAnswer } from '@/lib/diagnosis/legalization';

function answer(questionId: string, optionId: string): DiagnosisAnswer {
  return { questionId, optionId };
}

describe('evaluateLegalizationDiagnosis', () => {
  it('returns a high-likelihood result for a clean single-family path', () => {
    const result = evaluateLegalizationDiagnosis([
      answer('type', 'single'),
      answer('violation', 'yes'),
      answer('residential', 'yes'),
      answer('completed', 'yes'),
      answer('prior_approval', 'no'),
      answer('area_single', 'under_165'),
      answer('zone', 'no'),
      answer('land', 'yes'),
      answer('road_safety', 'yes'),
      answer('increase', 'no'),
      answer('fine_assessment', 'settled'),
      answer('fines', 'none'),
    ]);

    expect(result.type).toBe('result');
    if (result.type !== 'result') {
      return;
    }

    expect(result.result.grade).toBe('A');
    expect(result.flags).toHaveLength(0);
    expect(result.result.documents).toContain('건축사가 작성한 설계도서');
    expect(result.result.documents).toContain('건축사가 작성한 현장조사서');
    expect(result.result.cautions).toContain('이 법은 공포 후 6개월이 경과한 날부터 시행되며, 시행일부터 18개월간 효력을 가집니다.');
  });

  it('adds public land and fine assessment flags to review results', () => {
    const result = evaluateLegalizationDiagnosis([
      answer('type', 'dagagu'),
      answer('violation', 'yes'),
      answer('residential', 'yes'),
      answer('completed', 'yes'),
      answer('prior_approval', 'no'),
      answer('area_dagagu', 'yes'),
      answer('zone', 'no'),
      answer('land', 'public'),
      answer('road_safety', 'yes'),
      answer('increase', 'no'),
      answer('fine_assessment', 'under_5'),
      answer('fines', 'none'),
    ]);

    expect(result.type).toBe('result');
    if (result.type !== 'result') {
      return;
    }

    expect(result.result.grade).toBe('B');
    expect(result.flags).toContain('국유지·공유지 처분 제한 여부 확인 필요');
    expect(result.flags).toContain('5회 미만 이행강제금 기납부분 차감 과태료 확인 필요');
  });
});
