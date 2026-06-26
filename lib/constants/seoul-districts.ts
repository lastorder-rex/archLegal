// 서울특별시 25개 자치구 — 법정동코드 앞 5자리(sigungu_cd) 기준.
// violation_buildings.sigungu_cd 로 집계할 때 사용(이름만으로는 '중구' 등 타 시도와 충돌하므로 코드가 기준).
// 지역 SEO 페이지(/region/[region])와 sitemap이 이 목록을 공유한다.
export type SeoulDistrict = { name: string; code: string };

export const SEOUL_DISTRICTS: SeoulDistrict[] = [
  { name: '종로구', code: '11110' },
  { name: '중구', code: '11140' },
  { name: '용산구', code: '11170' },
  { name: '성동구', code: '11200' },
  { name: '광진구', code: '11215' },
  { name: '동대문구', code: '11230' },
  { name: '중랑구', code: '11260' },
  { name: '성북구', code: '11290' },
  { name: '강북구', code: '11305' },
  { name: '도봉구', code: '11320' },
  { name: '노원구', code: '11350' },
  { name: '은평구', code: '11380' },
  { name: '서대문구', code: '11410' },
  { name: '마포구', code: '11440' },
  { name: '양천구', code: '11470' },
  { name: '강서구', code: '11500' },
  { name: '구로구', code: '11530' },
  { name: '금천구', code: '11545' },
  { name: '영등포구', code: '11560' },
  { name: '동작구', code: '11590' },
  { name: '관악구', code: '11620' },
  { name: '서초구', code: '11650' },
  { name: '강남구', code: '11680' },
  { name: '송파구', code: '11710' },
  { name: '강동구', code: '11740' },
];

export function findSeoulDistrict(name: string): SeoulDistrict | undefined {
  return SEOUL_DISTRICTS.find(d => d.name === name);
}
