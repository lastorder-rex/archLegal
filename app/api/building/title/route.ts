import { NextRequest, NextResponse } from 'next/server';

// Building registry API response types
interface BuildingTitleItem {
  mainPurpsCdNm: string;    // 주용도코드명
  totArea: string;          // 연면적
  platArea: string;         // 대지면적
  groundFloorCnt: string;   // 지상층수
  ugrndFloorCnt?: string;   // 지하층수
  hhldCnt?: string;         // 세대수
  fmlyNum?: string;         // 가구수
  mainBldCnt?: string;      // 주건축물수
  atchBldCnt?: string;      // 부속건축물수
  platPlc?: string;         // 대지위치
  sigunguCd: string;        // 시군구코드
  bjdongCd: string;         // 법정동코드
  platGbCd: string;         // 대지구분코드
  bun: string;              // 번
  ji: string;               // 지
}

interface BuildingApiResponse {
  response: {
    header: {
      resultCode: string;
      resultMsg: string;
    };
    body: {
      items: BuildingTitleItem[];
      numOfRows: number;
      pageNo: number;
      totalCount: number;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const { sigunguCd, bjdongCd, platGbCd, bun, ji } = await request.json();

    // Input validation
    if (!sigunguCd || !bjdongCd || !platGbCd || !bun || !ji) {
      return NextResponse.json(
        { error: '건축물 조회에 필요한 주소 정보가 부족합니다.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.BLD_RGST_API_KEY;
    if (!apiKey) {
      console.error('BLD_RGST_API_KEY is not configured');
      return NextResponse.json(
        { error: '건축물대장 서비스 설정이 올바르지 않습니다.' },
        { status: 500 }
      );
    }

    // Build API URL for 건축물대장 총괄표제부 조회
    const buildingUrl = new URL('http://apis.data.go.kr/1613000/BldRgstService_v2/getBrTitleInfo');
    buildingUrl.searchParams.set('serviceKey', apiKey);
    buildingUrl.searchParams.set('sigunguCd', sigunguCd);
    buildingUrl.searchParams.set('bjdongCd', bjdongCd);
    buildingUrl.searchParams.set('platGbCd', platGbCd);
    buildingUrl.searchParams.set('bun', bun);
    buildingUrl.searchParams.set('ji', ji);
    buildingUrl.searchParams.set('_type', 'json');
    buildingUrl.searchParams.set('numOfRows', '10');
    buildingUrl.searchParams.set('pageNo', '1');

    // Call Building Registry API
    const response = await fetch(buildingUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'archLegal/1.0'
      }
    });

    const responseText = await response.text();

    if (!response.ok) {
      const maintenanceMessage = responseText.includes('시스템 점검')
        ? '건축물대장 서비스가 일시적으로 중단되었습니다. 잠시 후 다시 시도해주세요.'
        : '건축물 정보 조회 중 오류가 발생했습니다.';

      return NextResponse.json(
        { error: maintenanceMessage },
        { status: response.status === 404 ? 503 : response.status }
      );
    }

    let data: BuildingApiResponse;
    try {
      data = JSON.parse(responseText) as BuildingApiResponse;
    } catch (parseError) {
      console.error('Building registry API parse error:', parseError);
      return NextResponse.json(
        { error: '건축물 정보 응답을 해석할 수 없습니다. 잠시 후 다시 시도해주세요.' },
        { status: 502 }
      );
    }

    // Handle API errors
    if (data.response.header.resultCode !== '00') {
      return NextResponse.json(
        {
          error: data.response.header.resultMsg || '건축물 정보 조회 중 오류가 발생했습니다.',
          code: data.response.header.resultCode
        },
        { status: 400 }
      );
    }

    // Check if building data exists
    if (!data.response.body.items || data.response.body.items.length === 0) {
      return NextResponse.json(
        { error: '해당 주소의 건축물 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const building = data.response.body.items[0];

    // Parse and validate numeric fields
    const parseNumeric = (value: string | undefined): number | null => {
      if (!value || value === '') return null;
      const parsed = parseFloat(value);
      return isNaN(parsed) ? null : parsed;
    };

    const parseInt32 = (value: string | undefined): number | null => {
      if (!value || value === '') return null;
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? null : parsed;
    };

    // Transform response for frontend
    const buildingInfo = {
      // Core building information
      mainPurpsCdNm: building.mainPurpsCdNm || '정보없음',
      totArea: parseNumeric(building.totArea),
      platArea: parseNumeric(building.platArea),
      groundFloorCnt: parseInt32(building.groundFloorCnt),

      // Additional information
      ugrndFloorCnt: parseInt32(building.ugrndFloorCnt),
      hhldCnt: parseInt32(building.hhldCnt),
      fmlyNum: parseInt32(building.fmlyNum),
      mainBldCnt: parseInt32(building.mainBldCnt),
      atchBldCnt: parseInt32(building.atchBldCnt),

      // Location information
      platPlc: building.platPlc || null,

      // Address codes (for reference)
      addressInfo: {
        sigunguCd: building.sigunguCd,
        bjdongCd: building.bjdongCd,
        platGbCd: building.platGbCd,
        bun: building.bun,
        ji: building.ji
      },

      // Store full API response for future reference
      rawData: building
    };

    return NextResponse.json({
      building: buildingInfo,
      summary: {
        mainPurpose: building.mainPurpsCdNm || '정보없음',
        totalArea: parseNumeric(building.totArea),
        plotArea: parseNumeric(building.platArea),
        floors: {
          ground: parseInt32(building.groundFloorCnt),
          underground: parseInt32(building.ugrndFloorCnt)
        },
        households: parseInt32(building.hhldCnt)
      }
    });

  } catch (error) {
    console.error('Building registry API error:', error);
    return NextResponse.json(
      { error: '건축물 정보 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    );
  }
}
