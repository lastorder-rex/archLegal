export type ManualAdjustmentKey =
  | ''
  | 'commercial_1f'
  | 'commercial_2f'
  | 'commercial_basement_1f'
  | 'commercial_basement_2f_lower'
  | 'commercial_5f_plus'
  | 'parking_lot_2f_plus'
  | 'residential_garage'
  | 'no_wall_25_to_50_percent'
  | 'no_wall_50_to_75_percent'
  | 'no_wall_75_plus_percent'
  | 'steel_structure_wall_material'
  | 'container_temp_under_30m2';

export type ViolationCategoryKey =
  | 'extension'
  | 'use'
  | 'major_repair'
  | 'site_layout'
  | 'height_sunlight'
  | 'safety'
  | 'other';

export const CURRENT_YEAR = new Date().getFullYear();
export const EXTENSION_VIOLATION_GROUP_CODE = 'violation_1';
export const EXTENSION_VIOLATION_GROUP_FALLBACK_LABEL = '허가를 받지 않거나, 신고를 하지 않고 신축, 증축한 건축물';
export const VIOLATION_CATEGORY_OPTIONS: Array<{ key: ViolationCategoryKey; label: string }> = [
  { key: 'extension', label: EXTENSION_VIOLATION_GROUP_FALLBACK_LABEL },
  { key: 'use', label: '무단 용도·사용' },
  { key: 'major_repair', label: '무단 대수선' },
  { key: 'site_layout', label: '대지·배치 기준 위반' },
  { key: 'height_sunlight', label: '높이·일조 기준 위반' },
  { key: 'safety', label: '구조·피난·방화·안전 기준 위반' },
  { key: 'other', label: '기타 건축법령 위반' }
];
export const VIOLATION_CATEGORY_CODES: Record<ViolationCategoryKey, string[]> = {
  extension: [
    'coverage_ratio_excess',
    'floor_area_ratio_excess',
    'unauthorized_extension',
    'unreported_extension'
  ],
  use: [
    'unauthorized_use_change',
    'use_without_approval'
  ],
  major_repair: [
    'unauthorized_major_repair'
  ],
  site_layout: [
    'landscape_violation',
    'building_line_violation'
  ],
  height_sunlight: [
    'height_limit_violation',
    'sunlight_height_violation'
  ],
  safety: [
    'structural_safety_violation',
    'evacuation_fire_compartment_violation',
    'fire_resistant_wall_violation',
    'fire_district_violation',
    'finish_material_violation',
    'building_equipment_violation'
  ],
  other: [
    'building_act_order_violation'
  ]
};

export const MANUAL_ADJUSTMENT_OPTIONS: Array<{ value: ManualAdjustmentKey; label: string }> = [
  { value: '', label: '해당 없음' },
  { value: 'commercial_1f', label: '1층 상가부분' },
  { value: 'commercial_2f', label: '2층 상가부분' },
  { value: 'commercial_basement_1f', label: '지하1층 상가부분' },
  { value: 'commercial_basement_2f_lower', label: '지하2층 이하 상가부분' },
  { value: 'commercial_5f_plus', label: '5층 이상 상가부분' },
  { value: 'parking_lot_2f_plus', label: '2층 이상 주차장' },
  { value: 'residential_garage', label: '주택 차고' },
  { value: 'no_wall_25_to_50_percent', label: '무벽 1/4 이상 2/4 미만' },
  { value: 'no_wall_50_to_75_percent', label: '무벽 2/4 이상 3/4 미만' },
  { value: 'no_wall_75_plus_percent', label: '무벽 3/4 이상' },
  { value: 'steel_structure_wall_material', label: '철골조 벽면 특례' },
  { value: 'container_temp_under_30m2', label: '컨테이너 30㎡ 이하' }
];

export const MITIGATION_CONDITION_CODES = new Set([
  'acquired_after_violation',
  'tenant_correction_difficulty',
  'existing_at_use_approval'
]);

export const RESIDENTIAL_SPECIAL_CODES = new Set([
  'article80_small_residential_half',
  'article80_use_without_approval_residential_half',
  'article80_landscape_residential_half',
  'article80_height_residential_half',
  'article80_sunlight_residential_half',
  'article80_ordinance_residential_half'
]);

export const VIOLATION_EXAMPLE_TIPS = [
  {
    title: '불법 증축',
    description: '옥상방, 창고, 테라스, 점포 앞 확장, 필로티 막기처럼 면적이 늘어난 경우입니다.',
    mapsTo: '허가를 받지 않거나, 신고를 하지 않고 신축, 증축한 건축물 > 허가를 받지 아니하고 건축한 경우 / 신고를 하지 아니하고 건축한 경우 / 건폐율·용적률 초과'
  },
  {
    title: '무단 용도변경',
    description: '근린생활시설을 주거로 쓰거나, 주차장을 창고·상가로 쓰거나, 사무실을 음식점·카페로 쓰는 경우입니다.',
    mapsTo: '무단 용도·사용 > 허가·신고 없이 무단 용도변경한 건축물'
  },
  {
    title: '무단 대수선',
    description: '방쪼개기, 세대·가구 경계벽 변경, 계단 변경, 방화구획 변경, 내력벽·기둥·보 변경처럼 구조나 구획을 바꾸는 경우입니다.',
    mapsTo: '무단 대수선 > 허가·신고 없이 증설 또는 해체로 대수선을 한 건축물'
  },
  {
    title: '높이·일조·건축선 위반',
    description: '층을 올리거나 옥탑·다락·복층을 만들면서 높이 제한, 일조사선, 건축선 후퇴 기준을 넘긴 경우입니다.',
    mapsTo: '높이·일조 기준 위반 > 높이 제한을 위반한 건축물 / 일조 등의 확보를 위한 높이 제한을 위반한 건축물, 대지·배치 기준 위반 > 건축선에 적합하지 아니한 건축물'
  },
  {
    title: '조경·주차장·공용공간 훼손',
    description: '조경면적을 없애거나, 부설주차장·필로티·공용부분을 창고·방·점포로 쓰는 경우입니다.',
    mapsTo: '대지·배치 기준 위반 > 대지의 조경에 관한 사항을 위반한 건축물, 무단 용도·사용 > 허가·신고 없이 무단 용도변경한 건축물'
  },
  {
    title: '구조·피난·방화 안전 위반',
    description: '내력벽 철거, 기둥 제거, 보 변경, 피난계단 변경, 방화문·방화구획 훼손처럼 안전 기준을 건드린 경우입니다.',
    mapsTo: '구조·피난·방화·안전 기준 위반 > 구조내력기준에 적합하지 아니한 건축물 / 피난시설, 용도·구조 제한, 방화구획 등 기준에 적합하지 아니한 건축물 / 내화구조 및 방화벽 기준에 적합하지 아니한 건축물'
  }
];
