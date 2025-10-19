-- Seed default payment stage templates
INSERT INTO public.payment_stage_templates (stage_order, code, title, description, default_amount)
VALUES
  (
    1,
    'STAGE_1_SITE_SURVEY',
    '1단계 · 현장 답사 및 상담 비용',
    '현장 답사 및 기본 상담 수수료에 대한 결제 단계입니다.',
    88000
  ),
  (
    2,
    'STAGE_2_LEGALIZATION',
    '2단계 · 양성화 대행 서비스',
    '양성화 대행 계약 체결 후 진행되는 본 서비스 결제 단계입니다.',
    NULL
  ),
  (
    3,
    'STAGE_3_FINALIZATION',
    '3단계 · 결과 보고 및 마무리 비용',
    '추가 검토/보고 등에 필요한 최종 단계 비용입니다.',
    NULL
  )
ON CONFLICT (code) DO UPDATE
SET
  stage_order = EXCLUDED.stage_order,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  default_amount = EXCLUDED.default_amount,
  updated_at = timezone('utc'::text, now());
