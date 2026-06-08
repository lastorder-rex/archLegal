export type DiagnosisAnswer = {
  questionId: string;
  optionId: string;
};

type DiagnosisState = {
  current: string;
  type: string | null;
  history: DiagnosisHistoryItem[];
  flags: string[];
  finalResult: DiagnosisResult | null;
};

export type DiagnosisHistoryItem = {
  id: string;
  question: string;
  label: string;
  law: string;
  flag: string | null;
  typeLabel: string | null;
};

type DiagnosisOption = {
  id: string;
  label: string;
  detail?: string;
  icon?: string;
  tone?: string;
  value?: string;
  next?: string | ((state: DiagnosisState) => string);
  result?: keyof typeof RESULT_TEMPLATES;
  flag?: string;
};

type DiagnosisQuestion = {
  badge: string;
  title: string;
  desc: string;
  hint: string;
  law: string;
  options: DiagnosisOption[];
};

export type PublicDiagnosisQuestion = Omit<DiagnosisQuestion, 'options'> & {
  id: string;
  options: Array<Pick<DiagnosisOption, 'id' | 'label' | 'detail' | 'icon' | 'tone'>>;
};

export type DiagnosisResult = {
  grade: 'A' | 'B' | 'C' | 'D' | 'E';
  status: 'high' | 'review' | 'info' | 'fail';
  color: string;
  chip: string;
  title: string;
  copy: string;
  actions: string[];
  documents: string[];
  cautions: string[];
};

type DiagnosisResponse =
  | {
      type: 'question';
      question: PublicDiagnosisQuestion;
      history: DiagnosisHistoryItem[];
      progress: { done: number; total: number; percent: number };
    }
  | {
      type: 'result';
      result: DiagnosisResult;
      history: DiagnosisHistoryItem[];
      flags: string[];
      summary: string[];
      copyText: string;
      progress: { done: number; total: number; percent: number };
    };

const TYPE_LABEL: Record<string, string> = {
  multi: '다세대주택',
  single: '단독주택',
  dagagu: '다가구주택',
  near: '근린생활시설 -> 주택',
  unknown: '유형 모름 / 기타'
};

const TYPE_AREA_NEXT: Record<string, string> = {
  multi: 'area_multi',
  single: 'area_single',
  dagagu: 'area_dagagu',
  near: 'near_use',
  unknown: 'area_unknown'
};

const DEFAULT_DOCS = [
  '건축물대장',
  '토지이용계획확인서',
  '건축사가 작성한 설계도서',
  '건축사가 작성한 현장조사서',
  '등기부등본 또는 대지 사용승낙서',
  '집합건물 공용부분 변경 시 집합건물법상 결의 증명 서류',
  '위반건축물 고지서 또는 이행강제금 부과 내역',
  '현장 사진 및 기존 도면'
];

const DEFAULT_CAUTIONS = [
  '자가진단 결과는 법적 효력이 없습니다.',
  '이 법은 공포 후 6개월이 경과한 날부터 시행되며, 시행일부터 18개월간 효력을 가집니다.',
  '신고 기간, 서식, 일부 예외 기준은 대통령령·지방자치단체 조례·관할청 기준에 따라 달라질 수 있습니다.',
  '유효기간 만료 전에 신고가 접수된 대상건축물은 유효기간 만료 후에도 이 법 적용을 받을 수 있습니다.'
];

const QUESTIONS: Record<string, DiagnosisQuestion> = {
  type: {
    badge: '건축물 유형',
    title: '확인하려는 건축물 유형을 선택해주세요.',
    desc: '법안상 핵심 대상은 다세대주택, 단독주택, 다가구주택, 근린생활시설 허가 후 사실상 주택으로 사용 중인 건축물입니다.',
    hint: '정확히 모르겠다면 유형 모름/기타를 선택하세요. 상담 단계에서 건축물대장 기준으로 다시 분류합니다.',
    law: '제3조제1항제1호·제2호·제3호',
    options: [
      { id: 'multi', label: '다세대주택', detail: '빌라·다세대, 세대별 구분등기', icon: '🏢', value: 'multi', tone: 'yes', next: 'violation' },
      { id: 'single', label: '단독주택', detail: '일반 단독주택, 다가구 제외', icon: '🏠', value: 'single', tone: 'yes', next: 'violation' },
      { id: 'dagagu', label: '다가구주택', detail: '원룸·다가구, 건물 전체 단일 소유', icon: '🏘', value: 'dagagu', tone: 'yes', next: 'violation' },
      { id: 'near', label: '근린 -> 주택', detail: '상가·근생 허가 후 실제 주거 사용', icon: '🏪', value: 'near', tone: 'warn', next: 'violation', flag: '근린생활시설의 실제 주택 사용 여부 확인 필요' },
      { id: 'unknown', label: '유형 모름 / 기타', detail: '건축물대장 확인 필요', icon: '?', value: 'unknown', tone: 'unknown', next: 'violation', flag: '건축물 유형 확인 필요' }
    ]
  },
  violation: {
    badge: '위반 유형',
    title: '이 건물은 허가 없이 지었거나, 사용승인을 받지 못했거나, 허가 없이 용도를 바꾼 건물인가요?',
    desc: '정상 허가와 사용승인이 모두 끝난 건물은 양성화 대상이 아니라 이미 합법 건축물입니다.',
    hint: '예: 무허가 증축, 옥탑·베란다 무단 증축, 준공필증 없음, 근생을 주택으로 사용, 방쪼개기 등',
    law: '제2조제1항제1호',
    options: [
      { id: 'yes', label: '예, 위반 내용이 있습니다', detail: '무허가·미신고·준공미필·무단 용도변경', icon: 'O', tone: 'yes', next: 'residential' },
      { id: 'no', label: '아니오, 정상 건물입니다', detail: '허가와 사용승인이 모두 완료됨', icon: 'X', tone: 'no', result: 'legal' },
      { id: 'unknown', label: '잘 모르겠습니다', detail: '건축물대장·위반 고지서 확인 필요', icon: '?', tone: 'unknown', next: 'residential', flag: '위반 유형 서류 확인 필요' }
    ]
  },
  residential: {
    badge: '주거 비율',
    title: '건물 전체 연면적의 50% 이상이 주거용으로 사용되고 있나요?',
    desc: '이 법안은 주거용 특정건축물을 중심으로 적용됩니다. 실제 사용 상태가 중요합니다.',
    hint: '주택으로 쓰는 방·세대·가구 면적이 절반 이상인지 확인하세요. 근린생활시설도 실제 주거 사용이 50% 이상인지 봅니다.',
    law: '제2조제1항제2호',
    options: [
      { id: 'yes', label: '예, 주거가 50% 이상입니다', detail: '주거용 특정건축물 가능성 있음', icon: 'O', tone: 'yes', next: 'completed' },
      { id: 'no', label: '아니오, 주거가 50% 미만입니다', detail: '원칙적으로 대상 가능성이 낮음', icon: 'X', tone: 'danger', result: 'not_residential' },
      { id: 'unknown', label: '모르겠습니다', detail: '현장·도면 기준으로 확인 필요', icon: '?', tone: 'unknown', next: 'completed', flag: '주거용 연면적 50% 이상 여부 확인 필요' }
    ]
  },
  completed: {
    badge: '완공 시점',
    title: '2023년 12월 31일 당시 사실상 완공된 건축물인가요?',
    desc: '법안 적용 기준일 이후에 지어진 건축물은 이번 특별조치법 대상에서 제외됩니다.',
    hint: '골조·지붕·외벽 등 건축물이 사실상 완성되어 사용 가능했는지가 핵심입니다. 사진, 전입, 수도·전기 사용 내역 등이 보조 자료가 될 수 있습니다.',
    law: '제3조제1항 본문',
    options: [
      { id: 'yes', label: '예, 2023년 말 이전 완공', detail: '기준일 요건 충족 가능', icon: 'O', tone: 'yes', next: 'prior_approval' },
      { id: 'no', label: '아니오, 2024년 이후 완공', detail: '이번 법안 대상 아님', icon: 'X', tone: 'danger', result: 'too_late' },
      { id: 'unknown', label: '모르겠습니다', detail: '완공 입증자료 확인 필요', icon: '?', tone: 'unknown', next: 'prior_approval', flag: '2023.12.31 이전 사실상 완공 입증 필요' }
    ]
  },
  prior_approval: {
    badge: '과거 특별조치법',
    title: '과거 특별조치법으로 이미 사용승인을 받았고, 그 이후 소유권 변동이 없나요?',
    desc: '두 조건이 모두 맞으면 이번 법 적용 대상에서 제외됩니다.',
    hint: '예전 준공미필 기존 건축물 또는 특정건축물 특별조치법으로 사용승인을 받았는지 건축물대장에서 확인하세요.',
    law: '제3조제3항',
    options: [
      { id: 'yes', label: '예, 둘 다 해당합니다', detail: '과거 승인 + 소유권 변동 없음', icon: 'X', tone: 'danger', result: 'already_approved' },
      { id: 'no', label: '아니오', detail: '처음 신청이거나 소유자가 바뀜', icon: 'O', tone: 'yes', next: state => TYPE_AREA_NEXT[state.type || 'unknown'] },
      { id: 'unknown', label: '모르겠습니다', detail: '건축물대장 이력 확인 필요', icon: '?', tone: 'unknown', next: state => TYPE_AREA_NEXT[state.type || 'unknown'], flag: '과거 특별조치법 사용승인 및 소유권 변동 이력 확인 필요' }
    ]
  },
  area_multi: {
    badge: '면적 기준',
    title: '다세대주택의 세대당 전용면적이 85㎡ 이하인가요?',
    desc: '불법 증축·대수선으로 사용승인을 받지 못한 부분도 포함해 판단해야 합니다.',
    hint: '세대당 85㎡는 약 25.7평입니다. 전용면적과 위반 증축분을 함께 봐야 합니다.',
    law: '제3조제1항제1호',
    options: [
      { id: 'yes', label: '예, 85㎡ 이하', detail: '다세대 면적 요건 충족 가능', icon: 'O', tone: 'yes', next: 'zone' },
      { id: 'no', label: '아니오, 85㎡ 초과', detail: '면적 초과로 대상 아님', icon: 'X', tone: 'danger', result: 'area_over' },
      { id: 'unknown', label: '모르겠습니다', detail: '건축물대장·도면 확인 필요', icon: '?', tone: 'unknown', next: 'zone', flag: '다세대 세대당 전용면적 85㎡ 이하 여부 확인 필요' }
    ]
  },
  area_single: {
    badge: '면적 기준',
    title: '단독주택의 전체 연면적은 어느 범위인가요?',
    desc: '다가구주택은 별도 기준을 적용합니다. 불법 증축·대수선 부분도 포함해 계산합니다.',
    hint: '165㎡는 약 50평, 330㎡는 약 100평입니다. 165㎡ 초과 330㎡ 이하는 지자체 조례 확인이 필요합니다.',
    law: '제3조제1항제2호가목 및 단서',
    options: [
      { id: 'under_165', label: '165㎡ 이하', detail: '원칙 요건 충족 가능', icon: 'O', tone: 'yes', next: 'zone' },
      { id: 'under_330', label: '165㎡ 초과 330㎡ 이하', detail: '지자체 조례 확인 필요', icon: '!', tone: 'warn', next: 'zone', flag: '단독주택 165㎡ 초과 330㎡ 이하: 관할 지자체 조례 확인 필요' },
      { id: 'over_330', label: '330㎡ 초과', detail: '면적 초과로 대상 아님', icon: 'X', tone: 'danger', result: 'area_over' },
      { id: 'unknown', label: '모르겠습니다', detail: '연면적 산정 필요', icon: '?', tone: 'unknown', next: 'zone', flag: '단독주택 연면적 산정 필요' }
    ]
  },
  area_dagagu: {
    badge: '면적 기준',
    title: '다가구주택의 전체 연면적이 660㎡ 이하인가요?',
    desc: '불법 증축·대수선 부분 중 사용승인을 받지 못한 부분도 포함해 계산합니다.',
    hint: '660㎡는 약 200평입니다. 원룸 건물·다가구 건물은 건물 전체 연면적 기준으로 봅니다.',
    law: '제3조제1항제2호나목',
    options: [
      { id: 'yes', label: '예, 660㎡ 이하', detail: '다가구 면적 요건 충족 가능', icon: 'O', tone: 'yes', next: 'zone' },
      { id: 'no', label: '아니오, 660㎡ 초과', detail: '면적 초과로 대상 아님', icon: 'X', tone: 'danger', result: 'area_over' },
      { id: 'unknown', label: '모르겠습니다', detail: '건축물대장·현황도 확인 필요', icon: '?', tone: 'unknown', next: 'zone', flag: '다가구주택 연면적 660㎡ 이하 여부 확인 필요' }
    ]
  },
  near_use: {
    badge: '근린 -> 주택',
    title: '근린생활시설로 허가받은 부분이 2023년 12월 31일 이전부터 사실상 주택으로 사용됐나요?',
    desc: '근린생활시설을 주택으로 사용한 경우에는 기준일 이전부터 주거 사용이 있었는지가 중요합니다.',
    hint: '전입세대, 임대차계약, 수도·전기 사용, 내부 구조 등이 실제 주거 사용을 판단하는 자료가 될 수 있습니다.',
    law: '제3조제1항제3호 단서',
    options: [
      { id: 'yes', label: '예, 기준일 이전부터 주거 사용', detail: '계속 확인 진행', icon: 'O', tone: 'yes', next: 'area_unknown' },
      { id: 'no', label: '아니오, 2024년 이후 주거 사용', detail: '이번 법안 대상 아님', icon: 'X', tone: 'danger', result: 'too_late_use' },
      { id: 'unknown', label: '모르겠습니다', detail: '주거 사용 입증 필요', icon: '?', tone: 'unknown', next: 'area_unknown', flag: '근린생활시설의 2023.12.31 이전 주거 사용 입증 필요' }
    ]
  },
  area_unknown: {
    badge: '면적 기준',
    title: '건물의 실제 주택 형태와 면적이 법안 기준 안에 들어올 가능성이 있나요?',
    desc: '다세대는 세대당 85㎡ 이하, 단독은 원칙 165㎡ 이하, 다가구는 660㎡ 이하가 핵심 기준입니다.',
    hint: '유형이 불확실한 경우 상담에서 건축물대장과 현황을 기준으로 다세대·단독·다가구 중 어느 기준을 적용할지 먼저 확인해야 합니다.',
    law: '제3조제1항제1호·제2호·제3호',
    options: [
      { id: 'yes', label: '예, 기준 안일 것 같습니다', detail: '계속 확인 진행', icon: 'O', tone: 'yes', next: 'zone', flag: '건축물 유형별 면적 기준 최종 확인 필요' },
      { id: 'no', label: '아니오, 기준 초과입니다', detail: '면적 초과 가능성 높음', icon: 'X', tone: 'danger', result: 'area_over' },
      { id: 'unknown', label: '모르겠습니다', detail: '도면·건축물대장 필요', icon: '?', tone: 'unknown', next: 'zone', flag: '건축물 유형 및 면적 기준 확인 필요' }
    ]
  },
  zone: {
    badge: '적용 제외 구역',
    title: '건물이 다음 구역이나 부지에 있나요?',
    desc: '도시·군계획시설 부지, 개발제한구역, 군사기지 및 군사시설 보호구역, 접도구역, 도시개발구역, 정비구역, 보전산지, 대통령령상 상습재해구역·환경정비구역은 원칙적으로 적용 제외입니다.',
    hint: '토지이용계획확인서에서 확인할 수 있습니다. 개발제한구역·군사보호구역·도시개발구역·정비구역은 예외가 있을 수 있으므로 모르면 모르겠습니다를 선택하세요.',
    law: '제3조제2항',
    options: [
      { id: 'no', label: '아니오, 해당 없습니다', detail: '구역 제외 리스크 낮음', icon: 'O', tone: 'yes', next: 'land' },
      { id: 'yes', label: '예, 해당 구역입니다', detail: '예외 가능성 확인 필요', icon: '!', tone: 'warn', next: 'zone_exception', flag: '적용 제외 구역 또는 예외 적용 여부 확인 필요' },
      { id: 'unknown', label: '모르겠습니다', detail: '토지이용계획확인서 필요', icon: '?', tone: 'unknown', next: 'land', flag: '토지이용계획확인서로 적용 제외 구역 여부 확인 필요' }
    ]
  },
  zone_exception: {
    badge: '구역 예외',
    title: '해당 구역이라면 예외 적용 가능성이 있나요?',
    desc: '개발제한구역은 지정 전 건축·대수선, 군사보호구역은 지정 전 건축·대수선 또는 관할부대장 건의에 따른 국방부장관 결정, 도시개발구역·정비구역은 사업 지장 여부가 중요합니다.',
    hint: '접도구역·보전산지·도시군계획시설 부지는 예외가 제한적입니다. 정확한 구역명, 지정일, 사업 지장 여부를 모르면 전문가 검토로 넘기는 것이 안전합니다.',
    law: '제3조제2항 각 호 단서',
    options: [
      { id: 'yes', label: '예외 가능성이 있습니다', detail: '지정 전 건축 또는 사업 지장 없음', icon: 'O', tone: 'yes', next: 'land', flag: '적용 제외 구역 예외 사유 입증 필요' },
      { id: 'no', label: '예외가 어려운 구역입니다', detail: '접도구역·보전산지·도시계획시설 등', icon: 'X', tone: 'danger', result: 'excluded_zone' },
      { id: 'unknown', label: '모르겠습니다', detail: '전문가 검토 필요', icon: '?', tone: 'unknown', next: 'land', flag: '적용 제외 구역 예외 가능성 검토 필요' }
    ]
  },
  land: {
    badge: '대지 권한',
    title: '건물이 서 있는 땅에 대한 사용 권한을 확보했나요?',
    desc: '자기 소유 대지, 사용 승낙 받은 타인 소유 대지, 집합건물 공용부분 변경 결의, 처분 제한이 없는 국유지·공유지 등이 사용승인 기준에 포함됩니다.',
    hint: '집합건물 공용부분을 변경한 경우에는 집합건물법상 결의 증명이 필요할 수 있고, 국유지·공유지는 처분 제한 여부를 확인해야 합니다.',
    law: '제6조제1항제1호',
    options: [
      { id: 'yes', label: '예, 소유 또는 사용승낙이 있습니다', detail: '대지 요건 충족 가능', icon: 'O', tone: 'yes', next: 'road_safety' },
      { id: 'collective', label: '집합건물 결의가 필요합니다', detail: '공용부분 변경 결의 증명 확인', icon: '!', tone: 'warn', next: 'road_safety', flag: '집합건물 공용부분 변경 결의 증명 확인 필요' },
      { id: 'public', label: '국유지·공유지입니다', detail: '처분 제한 여부 확인 필요', icon: '!', tone: 'warn', next: 'road_safety', flag: '국유지·공유지 처분 제한 여부 확인 필요' },
      { id: 'no', label: '아니오, 허락 없는 타인 토지입니다', detail: '양성화 어려움', icon: 'X', tone: 'danger', result: 'land_issue' },
      { id: 'unknown', label: '모르겠습니다', detail: '등기·동의서·국공유지 여부 확인 필요', icon: '?', tone: 'unknown', next: 'road_safety', flag: '대지 소유권·사용승낙 또는 국공유지 처분 제한 여부 확인 필요' }
    ]
  },
  road_safety: {
    badge: '도로·안전·일조',
    title: '도로, 구조안전, 위생, 방화, 일조권, 도시계획사업에 현저한 지장이 없나요?',
    desc: '법안은 도로 최소 너비를 3m로 보는 특례를 두지만, 구조안전·위생·방화·일조권·도시계획사업과 관계 법률 적용에 현저한 지장은 없어야 합니다.',
    hint: '도로·건축선 기준은 일부 특례가 있으나, 소방에 지장이 없다고 인정되는지와 구조안전·방화·일조권 문제는 현장조사에서 확인해야 합니다.',
    law: '제6조제1항제2호',
    options: [
      { id: 'yes', label: '예, 큰 문제 없습니다', detail: '계속 확인 진행', icon: 'O', tone: 'yes', next: 'increase' },
      { id: 'review', label: '문제가 있을 수 있습니다', detail: '전문가 검토 필요', icon: '!', tone: 'warn', next: 'increase', flag: '도로·구조안전·방화·일조권 등 현장 검토 필요' },
      { id: 'unknown', label: '모르겠습니다', detail: '현장조사 필요', icon: '?', tone: 'unknown', next: 'increase', flag: '도로·안전·일조 등 법정 검토 필요' }
    ]
  },
  increase: {
    badge: '추가 강화 조건',
    title: '위반 내용이 세대·가구·호수 증가 또는 근린생활시설을 주택으로 바꾼 경우인가요?',
    desc: '무허가·미승인 건축 중 세대·가구·호수를 증가시키는 대수선이거나 근린생활시설을 사실상 주택으로 사용한 경우에는 건축법·소방시설법·주차장 기준을 더 확인해야 합니다.',
    hint: '방쪼개기란 대수선 허가 또는 신고 없이 세대·가구수를 늘린 경우를 말합니다. 거주 단위가 늘어난 경우에는 피난·방화·소방시설과 주차장 문제가 핵심 리스크가 됩니다.',
    law: '제6조제1항제3호·제7조제1항 단서',
    options: [
      { id: 'yes', label: '예, 해당합니다', detail: '소방·주차 조건 확인', icon: 'O', tone: 'warn', next: 'fire', flag: '세대·가구·호수 증가 또는 근린->주택에 따른 강화 조건 확인 필요' },
      { id: 'no', label: '아니오', detail: '일반 조건으로 계속 진행', icon: 'X', tone: 'yes', next: 'fine_assessment' },
      { id: 'unknown', label: '모르겠습니다', detail: '위반 내용 확인 필요', icon: '?', tone: 'unknown', next: 'fire', flag: '세대·가구·호수 증가 여부 확인 필요' }
    ]
  },
  fire: {
    badge: '소방·피난',
    title: '소방·피난 시설을 갖추었거나 보완할 수 있나요?',
    desc: '세대·가구·호수 증가 대수선 또는 근린->주택은 건축법 제49조·제50조·제52조와 소방시설 설치 및 관리에 관한 법률 제12조를 준수해야 합니다.',
    hint: '피난시설, 내화구조, 방화벽, 마감재료, 경보·소화설비 등은 건물 현황별로 달라집니다.',
    law: '제6조제1항제3호',
    options: [
      { id: 'yes', label: '예, 갖추었거나 보완 가능', detail: '계속 확인 진행', icon: 'O', tone: 'yes', next: 'parking', flag: '소방·피난 시설 적합성 최종 확인 필요' },
      { id: 'no', label: '아니오, 보완이 어렵습니다', detail: '승인 리스크 큼', icon: '!', tone: 'warn', next: 'parking', flag: '소방·피난 시설 보완 가능성 선검토 필요' },
      { id: 'unknown', label: '모르겠습니다', detail: '소방·건축사 검토 필요', icon: '?', tone: 'unknown', next: 'parking', flag: '소방·피난 시설 현장 검토 필요' }
    ]
  },
  parking: {
    badge: '주차장',
    title: '세대수 증가 또는 근린->주택으로 인해 필요한 주차장 설치·비용 납부를 검토했나요?',
    desc: '일반 대상은 사용승인으로 부족해진 부설주차장을 추가 설치할 의무가 없지만, 세대·가구·호수 증가 대수선 또는 근린->주택은 설치나 비용 납부가 필요할 수 있습니다.',
    hint: '전세사기피해자 지원 및 주거안정에 관한 특별법상 전세사기피해자가 매수한 전세사기피해주택은 추가 설치 의무 예외가 있고, 지자체 조례로 완화·면제 가능성이 있습니다.',
    law: '제7조제1항·제2항·제3항',
    options: [
      { id: 'victim', label: '전세사기피해자가 매수한 피해주택입니다', detail: '추가 설치 의무 예외 가능', icon: '★', tone: 'yes', next: 'fine_assessment', flag: '전세사기피해주택 주차장·과태료 특례 확인 필요' },
      { id: 'yes', label: '예, 검토했습니다', detail: '계속 진행', icon: 'O', tone: 'yes', next: 'fine_assessment', flag: '주차장 설치 또는 비용 납부 최종 확인 필요' },
      { id: 'no', label: '아니오', detail: '비용·조례 검토 필요', icon: '!', tone: 'warn', next: 'fine_assessment', flag: '주차장 설치·비용 납부·조례 완화 여부 확인 필요' },
      { id: 'unknown', label: '모르겠습니다', detail: '관할 지자체 기준 확인 필요', icon: '?', tone: 'unknown', next: 'fine_assessment', flag: '주차장 기준 및 지자체 조례 확인 필요' }
    ]
  },
  fine_assessment: {
    badge: '과태료 산정',
    title: '이행강제금 부과 이력이나 추가 위반내용이 있나요?',
    desc: '법안은 이행강제금 부과 이력과 추가 위반내용에 따라 이행강제금 5회분 상당 과태료 또는 기납부분 차감 과태료를 산정합니다.',
    hint: '전세사기피해자가 매수한 전세사기피해주택은 과태료 부과 대상에서 제외됩니다. 단, 이행강제금 체납 여부는 별도로 확인해야 합니다.',
    law: '제9조제1항·제2항',
    options: [
      { id: 'settled', label: '5회 이상 부과·납부했고 추가 위반은 없습니다', detail: '추가 과태료 리스크 낮음', icon: 'O', tone: 'yes', next: 'fines' },
      { id: 'no_history', label: '부과 사실이 없습니다', detail: '5회분 과태료 산정 가능', icon: '!', tone: 'warn', next: 'fines', flag: '이행강제금 5회분 상당 과태료 산정 가능성 확인 필요' },
      { id: 'additional', label: '부과 사실 있고 추가 위반도 있습니다', detail: '5회분 과태료 산정 가능', icon: '!', tone: 'warn', next: 'fines', flag: '추가 위반내용에 따른 5회분 과태료 산정 가능성 확인 필요' },
      { id: 'under_5', label: '5회 미만 부과·납부 이력이 있습니다', detail: '5회분에서 기납부분 차감', icon: '!', tone: 'warn', next: 'fines', flag: '5회 미만 이행강제금 기납부분 차감 과태료 확인 필요' },
      { id: 'victim', label: '전세사기피해자가 매수한 피해주택입니다', detail: '과태료 제외 가능', icon: '★', tone: 'yes', next: 'fines', flag: '전세사기피해주택 과태료 제외 여부 확인 필요' },
      { id: 'unknown', label: '모르겠습니다', detail: '부과 이력·추가 위반 확인 필요', icon: '?', tone: 'unknown', next: 'fines', flag: '이행강제금 부과 이력 및 추가 위반내용 확인 필요' }
    ]
  },
  fines: {
    badge: '체납·과태료',
    title: '이행강제금 또는 과태료 체납이 없거나, 1년 이내 납부할 수 있나요?',
    desc: '사용승인 조건에는 과태료와 이행강제금 체납이 없어야 한다는 요건이 있습니다. 다만 1년 이내 납부 조건으로 승인 가능성이 있습니다.',
    hint: '과태료와 이행강제금을 1년 이내 모두 납부하는 조건으로 사용승인서를 받을 수 있는지 관할청 확인이 필요합니다.',
    law: '제6조제1항제4호·제9조제1항·제2항',
    options: [
      { id: 'none', label: '체납 없음', detail: '승인 조건 충족 가능', icon: 'O', tone: 'yes', result: 'pass' },
      { id: 'payable', label: '있지만 1년 이내 납부 가능', detail: '조건부 승인 가능성', icon: '!', tone: 'warn', result: 'review', flag: '이행강제금·과태료 1년 이내 납부 조건 확인 필요' },
      { id: 'hard', label: '체납 있고 납부 어렵습니다', detail: '승인 조건 충족 어려움', icon: 'X', tone: 'danger', result: 'fine_issue' },
      { id: 'unknown', label: '모르겠습니다', detail: '관할청 납부 이력 확인 필요', icon: '?', tone: 'unknown', result: 'review', flag: '이행강제금·과태료 체납 및 산정금액 확인 필요' }
    ]
  }
};

const RESULT_TEMPLATES: Record<string, Omit<DiagnosisResult, 'documents'>> = {
  pass: {
    grade: 'A',
    status: 'high',
    color: 'var(--success)',
    chip: '가능성 높음',
    title: '양성화 신청 가능성이 높습니다.',
    copy: '입력한 답변 기준으로는 핵심 결격 사유가 발견되지 않았습니다. 다만 실제 신청 전에는 건축사 현장조사, 설계도서, 토지이용계획, 건축위원회 심의와 관할청 기준을 확인해야 합니다.',
    actions: ['건축물대장·토지이용계획확인서 준비', '건축사 현장조사 및 위반 면적 산정', '설계도서·현장조사서 작성', '관할 시·군·구청 신고 및 건축위원회 심의 준비'],
    cautions: ['최종 사용승인은 신고 후 건축위원회 심의와 관할청 판단을 거쳐야 합니다.']
  },
  review: {
    grade: 'B',
    status: 'review',
    color: 'var(--warning)',
    chip: '전문가 확인 필요',
    title: '신청 가능성은 있으나, 확인 항목이 있습니다.',
    copy: '일부 답변이 모름 또는 조례·소방·주차·구역 검토 필요에 해당합니다. 이런 케이스는 바로 탈락시키기보다 서류와 현장 상태를 확인해야 합니다.',
    actions: ['확인 필요 항목을 기준으로 상담 접수', '토지이용계획확인서·건축물대장 확인', '현장 사진과 위반 고지서 준비', '조례·소방·주차 기준 검토'],
    cautions: ['확인 항목이 해결되면 신청 가능성이 높아질 수 있습니다.', '적용 제외 구역, 국공유지, 소방·주차, 과태료는 상담 전환 가치가 큰 항목입니다.']
  },
  legal: {
    grade: 'C',
    status: 'info',
    color: 'var(--primary)',
    chip: '양성화 대상 아님',
    title: '이미 정상 사용승인된 건물일 수 있습니다.',
    copy: '허가와 사용승인이 모두 완료된 건물은 불법건축물 양성화 대상이 아닙니다. 건축물대장 표시와 실제 현황이 일치하는지 확인해보세요.',
    actions: ['건축물대장과 실제 현황 비교', '추가 증축·용도변경이 있었는지 확인'],
    cautions: ['건축물대장에는 정상이나 실제 위반이 있다면 다시 진단해야 합니다.']
  },
  not_residential: {
    grade: 'D',
    status: 'fail',
    color: 'var(--destructive)',
    chip: '대상 가능성 낮음',
    title: '주거용 비율 요건을 충족하기 어렵습니다.',
    copy: '입력 기준으로는 연면적의 50% 이상이 주거용인 주거용 특정건축물 요건을 충족하기 어렵습니다.',
    actions: ['실제 주거 사용 면적 재산정', '건축물대장과 현황 확인', '다른 인허가 정리 방법 상담'],
    cautions: ['실제 사용 면적이 다르면 결과가 달라질 수 있습니다.']
  },
  too_late: {
    grade: 'E',
    status: 'fail',
    color: 'var(--destructive)',
    chip: '대상 아님',
    title: '2024년 이후 완공 건물은 대상이 아닙니다.',
    copy: '법안은 2023년 12월 31일 당시 사실상 완공된 주거용 특정건축물을 대상으로 합니다.',
    actions: ['정식 인허가·사용승인 절차 검토', '위반 내용별 시정 가능성 상담'],
    cautions: ['완공 시점을 입증할 자료가 있다면 재검토할 수 있습니다.']
  },
  already_approved: {
    grade: 'E',
    status: 'fail',
    color: 'var(--destructive)',
    chip: '적용 제외',
    title: '과거 특별조치법 적용 이력으로 제외될 수 있습니다.',
    copy: '과거 특별조치법으로 사용승인을 받았고 이후 소유권 변동이 없다면 이번 법 적용 대상에서 제외됩니다.',
    actions: ['건축물대장 사용승인 이력 확인', '소유권 변동 이력 확인', '소유권 변동이 있었다면 재상담'],
    cautions: ['두 조건이 모두 충족되는지 정확히 확인해야 합니다.']
  },
  area_over: {
    grade: 'E',
    status: 'fail',
    color: 'var(--destructive)',
    chip: '면적 초과',
    title: '법안상 면적 기준을 초과합니다.',
    copy: '선택한 유형의 면적 기준을 넘는 경우 이번 특별조치법으로 양성화하기 어렵습니다.',
    actions: ['실제 위반 면적 재산정', '전용면적·연면적 기준 구분', '다른 정리 절차 상담'],
    cautions: ['불법 증축·대수선 부분도 포함해 산정해야 합니다.']
  },
  too_late_use: {
    grade: 'E',
    status: 'fail',
    color: 'var(--destructive)',
    chip: '주거 사용 시점 미충족',
    title: '근린생활시설의 주거 사용 시점 요건을 충족하기 어렵습니다.',
    copy: '근린생활시설 허가 후 사실상 주택으로 사용한 건축물은 2023년 12월 31일 이전부터 주택으로 사용된 경우에 한정됩니다.',
    actions: ['주거 사용 개시일 입증자료 확인', '전입·임대차·전기수도 사용 내역 확인'],
    cautions: ['실제 주거 사용 입증 자료가 있으면 상담에서 재검토할 수 있습니다.']
  },
  excluded_zone: {
    grade: 'E',
    status: 'fail',
    color: 'var(--destructive)',
    chip: '적용 제외 구역',
    title: '적용 제외 구역으로 신청이 어려울 수 있습니다.',
    copy: '도시·군계획시설 부지, 접도구역, 보전산지 등은 예외가 매우 제한적입니다. 구역 종류에 따라 결과가 달라집니다.',
    actions: ['토지이용계획확인서 발급', '구역 지정일과 예외 사유 확인', '관할청 사전 상담'],
    cautions: ['그린벨트·군사보호구역·정비구역은 예외 가능성도 있어 세부 검토가 필요합니다.']
  },
  land_issue: {
    grade: 'E',
    status: 'fail',
    color: 'var(--destructive)',
    chip: '대지 권한 문제',
    title: '대지 사용 권한이 없어 양성화가 어렵습니다.',
    copy: '남의 땅에 허락 없이 지은 건축물은 사용승인 요건을 충족하기 어렵습니다.',
    actions: ['토지 소유자 사용승낙 가능성 확인', '등기부등본 및 대지권 확인', '국유지·공유지라면 처분 제한 확인'],
    cautions: ['사용승낙을 받을 수 있으면 결과가 달라질 수 있습니다.']
  },
  fine_issue: {
    grade: 'E',
    status: 'fail',
    color: 'var(--destructive)',
    chip: '체납 문제',
    title: '체납 해결 없이는 사용승인이 어렵습니다.',
    copy: '이행강제금 또는 과태료 체납이 있고 1년 이내 납부가 어렵다면 사용승인 조건을 충족하기 어렵습니다.',
    actions: ['체납 금액 확인', '분납·납부 가능성 상담', '관할청 납부 조건 확인'],
    cautions: ['1년 이내 납부 조건으로 승인 가능성이 있는지 확인하세요.']
  }
};

function toPublicQuestion(id: string): PublicDiagnosisQuestion {
  const question = QUESTIONS[id];
  if (!question) {
    throw new Error(`Unknown diagnosis question: ${id}`);
  }

  return {
    id,
    badge: question.badge,
    title: question.title,
    desc: question.desc,
    hint: question.hint,
    law: question.law,
    options: question.options.map(({ id: optionId, label, detail, icon, tone }) => ({
      id: optionId,
      label,
      detail,
      icon,
      tone
    }))
  };
}

function getProgress(historyLength: number) {
  const total = 12;
  const done = Math.min(historyLength, total);
  return {
    done,
    total,
    percent: Math.round((done / total) * 100)
  };
}

function pickResultTemplate(resultId: keyof typeof RESULT_TEMPLATES, flags: string[]): DiagnosisResult {
  const resolvedId = resultId === 'pass' && flags.length > 0 ? 'review' : resultId;
  const template = RESULT_TEMPLATES[resolvedId] || RESULT_TEMPLATES.review;

  return {
    ...template,
    documents: DEFAULT_DOCS,
    cautions: Array.from(new Set([...template.cautions, ...DEFAULT_CAUTIONS]))
  };
}

function formatFlagForDisplay(flag: string) {
  return flag
    .replace(/->/g, '→')
    .replace(/\s*선검토 필요$/g, '')
    .replace(/\s*여부 확인 필요$/g, '')
    .replace(/\s*(최종|현장|법정)?\s*검토 필요$/g, '')
    .replace(/\s*(최종|현장|서류)?\s*확인 필요$/g, '')
    .replace(/\s*입증 필요$/g, '')
    .replace(/\s*산정 필요$/g, '')
    .replace(/\s*필요$/g, '')
    .trim();
}

function formatCopyValue(value: string) {
  return value.replace(/->/g, '→');
}

function makeSummary(history: DiagnosisHistoryItem[], flags: string[]) {
  const summary: string[] = [];
  const type = history.find(item => item.id === 'type');

  if (type) {
    summary.push(`건축물 유형: ${type.typeLabel || type.label}`);
  }

  summary.push(`응답 수: ${history.length}개`);
  summary.push(flags.length ? `확인 필요: ${flags.length}개` : '확인 필요 플래그 없음');
  flags.slice(0, 5).forEach(flag => summary.push(formatFlagForDisplay(flag)));

  return summary;
}

function makeCopyText(result: DiagnosisResult | null, history: DiagnosisHistoryItem[], flags: string[]) {
  const type = history.find(item => item.id === 'type');
  const lines = ['[1분 자가진단 결과]'];

  if (result) {
    lines.push(`등급: ${result.grade}`);
  }
  lines.push(`결과: ${result ? result.title : '미완료'}`);
  if (type) {
    lines.push(`건축물 유형: ${formatCopyValue(type.typeLabel || type.label)}`);
  }
  lines.push(`응답 수: ${history.length}개`);

  lines.push('');
  lines.push('[답변 항목]');
  history.forEach((item, index) => {
    const badge = QUESTIONS[item.id]?.badge || item.id;
    lines.push(`${index + 1}. ${formatCopyValue(badge)}: ${formatCopyValue(item.typeLabel || item.label)}`);
  });

  lines.push('');
  lines.push('[확인 필요 항목]');
  if (flags.length) {
    flags.forEach((flag, index) => lines.push(`${index + 1}. ${formatFlagForDisplay(flag)}`));
  } else {
    lines.push('1. 별도 확인 항목 없음');
  }

  return lines.join('\n');
}

export function evaluateLegalizationDiagnosis(answers: DiagnosisAnswer[] = []): DiagnosisResponse {
  const state: DiagnosisState = {
    current: 'type',
    type: null,
    history: [],
    flags: [],
    finalResult: null
  };

  for (const answer of answers) {
    const question = QUESTIONS[state.current];
    if (!question || answer.questionId !== state.current) {
      break;
    }

    const option = question.options.find(item => item.id === answer.optionId);
    if (!option) {
      break;
    }

    if (state.current === 'type') {
      state.type = option.value || null;
    }

    if (option.flag && !state.flags.includes(option.flag)) {
      state.flags.push(option.flag);
    }

    state.history.push({
      id: state.current,
      question: question.title,
      label: option.label,
      law: question.law,
      flag: option.flag || null,
      typeLabel: state.current === 'type' && option.value ? TYPE_LABEL[option.value] : null
    });

    if (option.result) {
      const result = pickResultTemplate(option.result, state.flags);
      state.finalResult = result;

      return {
        type: 'result',
        result,
        history: state.history,
        flags: state.flags,
        summary: makeSummary(state.history, state.flags),
        copyText: makeCopyText(result, state.history, state.flags),
        progress: getProgress(state.history.length)
      };
    }

    const next = typeof option.next === 'function' ? option.next(state) : option.next;
    if (!next) {
      break;
    }
    state.current = next;
  }

  return {
    type: 'question',
    question: toPublicQuestion(state.current),
    history: state.history,
    progress: getProgress(state.history.length)
  };
}
