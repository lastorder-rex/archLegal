import { NextRequest, NextResponse } from 'next/server';

// Juso API response types
interface JusoResultItem {
  roadAddr: string;      // 도로명주소
  jibunAddr: string;     // 지번주소
  sigunguCd: string;     // 시군구코드
  bjdongCd: string;      // 법정동코드
  platGbCd: string;      // 대지구분코드 (0:대지, 1:산, 2:블록)
  bun: string;           // 번
  ji: string;            // 지
  zipNo: string;         // 우편번호
  bdNm?: string;         // 건물명
  detBdNmList?: string;  // 상세건물명
}

interface JusoApiResponse {
  results: {
    common: {
      errorMessage: string;
      countPerPage: string;
      totalCount: string;
      errorCode: string;
      currentPage: string;
    };
    juso: JusoResultItem[];
  };
}

export async function POST(request: NextRequest) {
  try {
    const { query, page = 1 } = await request.json();

    // Input validation
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return NextResponse.json(
        { error: '검색어는 2글자 이상 입력해주세요.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.JUSO_API_KEY;
    if (!apiKey) {
      console.error('JUSO_API_KEY is not configured');
      return NextResponse.json(
        { error: '주소 검색 서비스 설정이 올바르지 않습니다.' },
        { status: 500 }
      );
    }

    // Build API URL
    const jusoUrl = new URL('https://business.juso.go.kr/addrlink/addrLinkApi.do');
    jusoUrl.searchParams.set('confmKey', apiKey);
    jusoUrl.searchParams.set('keyword', query.trim());
    jusoUrl.searchParams.set('resultType', 'json');
    jusoUrl.searchParams.set('countPerPage', '10');
    jusoUrl.searchParams.set('currentPage', page.toString());

    // Call Juso API
    const response = await fetch(jusoUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'archLegal/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Juso API error: ${response.status}`);
    }

    const data: JusoApiResponse = await response.json();

    // Handle API errors
    if (data.results.common.errorCode !== '0') {
      return NextResponse.json(
        {
          error: data.results.common.errorMessage || '주소 검색 중 오류가 발생했습니다.',
          code: data.results.common.errorCode
        },
        { status: 400 }
      );
    }

    // Transform response for frontend
    const addresses = data.results.juso.map(item => ({
      id: `${item.sigunguCd}-${item.bjdongCd}-${item.platGbCd}-${item.bun}-${item.ji}`,
      roadAddr: item.roadAddr,
      jibunAddr: item.jibunAddr,
      zipNo: item.zipNo,
      buildingName: item.bdNm || null,
      detailBuildingName: item.detBdNmList || null,
      // Data needed for building registry lookup
      addressCode: {
        sigunguCd: item.sigunguCd,
        bjdongCd: item.bjdongCd,
        platGbCd: item.platGbCd,
        bun: item.bun,
        ji: item.ji
      }
    }));

    return NextResponse.json({
      addresses,
      pagination: {
        currentPage: parseInt(data.results.common.currentPage),
        totalCount: parseInt(data.results.common.totalCount),
        countPerPage: parseInt(data.results.common.countPerPage)
      }
    });

  } catch (error) {
    console.error('Juso API error:', error);
    return NextResponse.json(
      { error: '주소 검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    );
  }
}