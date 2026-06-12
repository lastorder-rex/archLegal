-- Temporary migration: Insert sample consultations for testing
-- This file can be deleted after testing

-- Insert 5 sample consultations with realistic data
INSERT INTO consultations (
  user_id,
  nickname,
  name,
  phone,
  email,
  address,
  address_code,
  building_info,
  main_purps,
  tot_area,
  plat_area,
  ground_floor_cnt,
  message,
  is_del,
  created_at
) VALUES
-- Sample 1: 서울 강남 오피스텔
(
  'test_user_001',
  '김철수',
  '김철수',
  '010-1234-5678',
  'chulsoo@example.com',
  '서울특별시 강남구 테헤란로 152',
  '{"roadAddr": "서울특별시 강남구 테헤란로 152", "sigunguCd": "11680", "bdNm": "강남파이낸스센터"}'::jsonb,
  '{"mainPurpsCdNm": "업무시설", "totArea": "1250.50", "platArea": "800.00", "grndFlrCnt": "25"}'::jsonb,
  '업무시설',
  1250.50,
  800.00,
  25,
  '오피스텔 리모델링 관련 건축 법규 상담이 필요합니다. 용도변경 가능 여부와 절차에 대해 알고 싶습니다.',
  'N',
  NOW() - INTERVAL '5 days'
),
-- Sample 2: 경기 성남 아파트
(
  'test_user_002',
  '이영희',
  '이영희',
  '010-2345-6789',
  'younghee@example.com',
  '경기도 성남시 분당구 판교역로 235',
  '{"roadAddr": "경기도 성남시 분당구 판교역로 235", "sigunguCd": "41135", "bdNm": "판교푸르지오월드마크"}'::jsonb,
  '{"mainPurpsCdNm": "공동주택", "totArea": "85.00", "platArea": "45000.00", "grndFlrCnt": "35"}'::jsonb,
  '공동주택',
  85.00,
  45000.00,
  35,
  '베란다 확장 및 내부 구조 변경 관련 상담 요청드립니다. 관리사무소 승인 절차와 필요 서류에 대해 문의드립니다.',
  'N',
  NOW() - INTERVAL '3 days'
),
-- Sample 3: 서울 마포 근린상가
(
  'test_user_003',
  '박민수',
  '박민수',
  '010-3456-7890',
  'minsu.park@example.com',
  '서울특별시 마포구 양화로 160',
  '{"roadAddr": "서울특별시 마포구 양화로 160", "sigunguCd": "11440", "bdNm": "홍대앞상가"}'::jsonb,
  '{"mainPurpsCdNm": "판매시설", "totArea": "450.00", "platArea": "300.00", "grndFlrCnt": "5"}'::jsonb,
  '판매시설',
  450.00,
  300.00,
  5,
  '카페 오픈 예정입니다. 간판 설치 및 외부 테라스 공사에 대한 건축 허가 절차가 궁금합니다.',
  'N',
  NOW() - INTERVAL '2 days'
),
-- Sample 4: 인천 연수구 단독주택
(
  'test_user_004',
  '정수진',
  '정수진',
  '010-4567-8901',
  'sujin.jung@example.com',
  '인천광역시 연수구 송도과학로 32',
  '{"roadAddr": "인천광역시 연수구 송도과학로 32", "sigunguCd": "28185", "bdNm": ""}'::jsonb,
  '{"mainPurpsCdNm": "단독주택", "totArea": "180.00", "platArea": "250.00", "grndFlrCnt": "2"}'::jsonb,
  '단독주택',
  180.00,
  250.00,
  2,
  '단독주택 증축을 계획 중입니다. 현재 건폐율과 용적률 확인이 필요하며, 증축 가능 면적에 대해 상담받고 싶습니다.',
  'N',
  NOW() - INTERVAL '1 day'
),
-- Sample 5: 부산 해운대 상업시설
(
  'test_user_005',
  '최동욱',
  '최동욱',
  '010-5678-9012',
  'dongwook@example.com',
  '부산광역시 해운대구 해운대해변로 264',
  '{"roadAddr": "부산광역시 해운대구 해운대해변로 264", "sigunguCd": "26350", "bdNm": "해운대센텀호텔"}'::jsonb,
  '{"mainPurpsCdNm": "숙박시설", "totArea": "3500.00", "platArea": "2000.00", "grndFlrCnt": "15"}'::jsonb,
  '숙박시설',
  3500.00,
  2000.00,
  15,
  '호텔 리뉴얼 공사 관련 건축 인허가 일정 및 비용 견적 상담을 요청드립니다. 영업을 병행하면서 공사 진행이 가능한지 궁금합니다.',
  'N',
  NOW() - INTERVAL '12 hours'
);

-- Show inserted data
SELECT
  id,
  name,
  phone,
  address,
  main_purps,
  LEFT(message, 50) || '...' as message_preview,
  created_at
FROM consultations
WHERE user_id LIKE 'test_user_%'
ORDER BY created_at DESC;
