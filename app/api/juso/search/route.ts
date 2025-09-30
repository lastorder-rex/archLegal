import { NextRequest, NextResponse } from 'next/server';

// Juso API response types
interface JusoResultItem {
  roadAddr: string;      // 도로명주소
  jibunAddr: string;     // 지번주소
  zipNo: string;         // 우편번호
  bdNm?: string;         // 건물명
  detBdNmList?: string;  // 상세건물명
  admCd?: string;        // 행정구역코드 (시군구+법정동)
  mtYn?: string;         // 산 여부 (0:대지, 1:산)
  lnbrMnnm?: string;     // 번(본번)
  lnbrSlno?: string;     // 지(부번)
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
    juso: JusoResultItem[] | null;
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
    const jusoItems = data.results.juso ?? [];

    const padLotNumber = (value: string | undefined) => {
      if (!value || value === '' || value === '0') {
        return '0000';
      }
      return value.padStart(4, '0');
    };

    const addresses = jusoItems
      .map(item => {
        const sigunguCd = item.admCd?.slice(0, 5) || '';
        const bjdongCd = item.admCd?.slice(5) || '';
        const platGbCd = item.mtYn ?? '';

        const bun = padLotNumber(item.lnbrMnnm);
        const ji = padLotNumber(item.lnbrSlno);

        if (!sigunguCd || !bjdongCd || platGbCd === '') {
          return null;
        }

        return {
          id: `${sigunguCd}-${bjdongCd}-${platGbCd}-${bun}-${ji}`,
          roadAddr: item.roadAddr,
          jibunAddr: item.jibunAddr,
          zipNo: item.zipNo,
          buildingName: item.bdNm || null,
          detailBuildingName: item.detBdNmList || null,
          // Data needed for building registry lookup
          addressCode: {
            sigunguCd,
            bjdongCd,
            platGbCd,
            bun,
            ji
          }
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

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
