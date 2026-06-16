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
  sggNm?: string;        // 시군구명
  emdNm?: string;        // 읍면동명
}

function parseAddressKeyword(keyword: string) {
  const normalized = keyword.replace(/[(),]/g, ' ');
  const tokens = normalized
    .split(/\s+/)
    .map(token => token.trim())
    .filter(Boolean);

  const parsedTokens = tokens.map((token, index) => {
    const match = token.match(/^([0-9A-Za-z가-힣-]+?)(동|호)?$/);
    if (!match) return null;
    return {
      index,
      value: match[1],
      suffix: match[2] || null,
      raw: token
    };
  });

  const unitTokens = parsedTokens.filter(
    (token): token is { index: number; value: string; suffix: string | null; raw: string } => Boolean(token)
  );

  let dongToken: { index: number; value: string; suffix: string | null; raw: string } | null = null;
  let hoToken = unitTokens.find(token => token.suffix === '호') || null;

  if (hoToken) {
    dongToken = [...unitTokens]
      .reverse()
      .find(token => token.index < hoToken!.index && token.suffix === '동') || null;
  } else {
    dongToken = [...unitTokens].reverse().find(token => token.suffix === '동') || null;
  }

  if (!dongToken && !hoToken && tokens.length >= 3) {
    const last = unitTokens.find(token => token.index === tokens.length - 1 && !token.suffix);
    const prev = unitTokens.find(token => token.index === tokens.length - 2 && !token.suffix);
    if (last && prev && /\d/.test(last.value)) {
      dongToken = prev;
      hoToken = last;
    }
  } else if (dongToken && !hoToken) {
    const afterDong = unitTokens.find(token => (
      token.index > dongToken!.index &&
      !token.suffix &&
      /^[A-Za-z가-힣]*\d+[A-Za-z가-힣]*$/.test(token.value)
    ));
    hoToken = afterDong || null;
  } else if (!dongToken && hoToken) {
    const beforeHo = [...unitTokens].reverse().find(token => token.index < hoToken!.index && !token.suffix);
    dongToken = beforeHo || null;
  }

  if (!hoToken && dongToken?.index === 0 && tokens.some(token => /^\d+-\d+$/.test(token))) {
    dongToken = null;
  }

  const excludedIndexes = new Set<number>();
  if (dongToken) excludedIndexes.add(dongToken.index);
  if (hoToken) excludedIndexes.add(hoToken.index);

  const searchKeyword = tokens
    .filter((_, index) => !excludedIndexes.has(index))
    .join(' ')
    .trim();

  return {
    searchKeyword: searchKeyword || keyword.trim(),
    dongName: dongToken ? `${dongToken.value}동` : null,
    hoName: hoToken ? `${hoToken.value}호` : null
  };
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

    const parsedKeyword = parseAddressKeyword(query.trim());

    // Build API URL
    const jusoUrl = new URL('https://business.juso.go.kr/addrlink/addrLinkApi.do');
    jusoUrl.searchParams.set('confmKey', apiKey);
    jusoUrl.searchParams.set('keyword', parsedKeyword.searchKeyword);
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

    // Debug: Log first item to see available fields
    if (data.results.juso && data.results.juso.length > 0) {
      console.log('Juso API 응답 샘플:', JSON.stringify(data.results.juso[0], null, 2));
    }

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
          dongName: parsedKeyword.dongName,
          hoName: parsedKeyword.hoName,
          // Data needed for building registry lookup
          addressCode: {
            sigunguCd,
            bjdongCd,
            platGbCd,
            bun,
            ji,
            sigunguName: item.sggNm || '',
            bjdongName: item.emdNm || ''
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
