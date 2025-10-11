import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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

// Local database record type
interface SeoulBuildingRecord {
  register_pk: string;
  register_division_code: string | null;
  register_division_name: string | null;
  register_type_code: string | null;
  register_type_name: string | null;
  land_location: string | null;
  road_land_location: string | null;
  building_name: string | null;
  sigungu_code: string | null;
  beopjeong_dong_code: string | null;
  land_category_code: string | null;
  bun: string | null;
  ji: string | null;
  primary_use_name: string | null;
  secondary_use: string | null;
  structure_name: string | null;
  etc_structure: string | null;
  roof_name: string | null;
  etc_roof: string | null;
  land_area_m2: number | null;
  building_area_m2: number | null;
  total_floor_area_m2: number | null;
  far_calculated_area_m2: number | null;
  far_ratio: number | null;
  building_coverage_ratio: number | null;
  household_count: number | null;
  family_count: number | null;
  building_height_m: number | null;
  ground_floors: number | null;
  underground_floors: number | null;
  attached_building_count: number | null;
  total_block_area_m2: number | null;
  indoor_mech_parking_count: number | null;
  outdoor_mech_parking_count: number | null;
  indoor_self_parking_count: number | null;
  outdoor_self_parking_count: number | null;
  permit_year: string | null;
  permit_date_yyyymmdd: string | null;
  construction_start_yyyymmdd: string | null;
  use_approval_yyyymmdd: string | null;
  source_created_yyyymmdd: string | null;
  seismic_design_flag: string | null;
  seismic_capacity: string | null;
}

/**
 * Query local Seoul building registry database
 * Used as fallback when National API fails
 */
async function queryLocalBuildingData({
  sigunguCode,
  beopjeongDongCode,
  bon,
  ji
}: {
  sigunguCode: string;
  beopjeongDongCode: string;
  bon: string;
  ji: string;
}): Promise<SeoulBuildingRecord | null> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Query by address components (allow both code and name matches)
    console.log('Local fallback query payload:', {
      sigunguCode,
      beopjeongDongCode,
      bon,
      ji
    });

    const { data, error } = await supabase
      .from('seoul_building_registry')
      .select('*')
      .eq('sigungu', sigunguCode)
      .eq('beopjeong_dong', beopjeongDongCode)
      .eq('bun', bon)
      .eq('ji', ji)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Local building query error:', error);
      return null;
    }

    if (!data) {
      console.warn('Local building query returned no data');
    }

    return data;
  } catch (error) {
    console.error('Local building query exception:', error);
    return null;
  }
}

/**
 * Transform local DB record to API response format
 */
function transformLocalBuildingData(record: SeoulBuildingRecord) {
  return {
    building: {
      mainPurpsCdNm: record.primary_use_name || '정보없음',
      totArea: record.total_floor_area_m2,
      platArea: record.land_area_m2,
      groundFloorCnt: record.ground_floors,
      ugrndFloorCnt: record.underground_floors,
      hhldCnt: record.household_count,
      fmlyNum: record.family_count,
      mainBldCnt: null,
      atchBldCnt: record.attached_building_count,
      platPlc: record.land_location || record.road_land_location || null,
      addressInfo: {
        sigunguCd: record.sigungu_code || '',
        bjdongCd: record.beopjeong_dong_code || '',
        platGbCd: record.land_category_code || '',
        bun: record.bun || '',
        ji: record.ji || ''
      },
      buildingName: record.building_name || null,
      structure: record.structure_name || null,
      roof: record.roof_name || null,
      etcStructure: record.etc_structure || null,
      etcRoof: record.etc_roof || null,
      rawData: record,
      source: 'local_db' // Indicate data source
    },
    summary: {
      mainPurpose: record.primary_use_name || '정보없음',
      totalArea: record.total_floor_area_m2,
      plotArea: record.land_area_m2,
      floors: {
        ground: record.ground_floors,
        underground: record.underground_floors
      },
      households: record.household_count
    }
  };
}

export async function POST(request: NextRequest) {
  try {
    const { sigunguCd, bjdongCd, platGbCd, bun, ji, sigunguName, bjdongName } = await request.json();

    // Input validation
    if (!sigunguCd || !bjdongCd || !platGbCd || !bun || !ji) {
      return NextResponse.json(
        { error: '건축물 조회에 필요한 주소 정보가 부족합니다.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.BLD_RGST_API_KEY;
    let apiSuccess = false;
    let apiError: any = null;

    // STEP 1: Try National Building Registry API first
    if (apiKey) {
      try {
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

        // Call Building Registry API with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch(buildingUrl.toString(), {
          method: 'GET',
          headers: {
            'User-Agent': 'archLegal/1.0'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const responseText = await response.text();
          const data: BuildingApiResponse = JSON.parse(responseText);

          // Check if API returned valid data
          if (
            data.response.header.resultCode === '00' &&
            data.response.body.items &&
            data.response.body.items.length > 0
          ) {
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

            // Successfully got data from National API
            const buildingInfo = {
              mainPurpsCdNm: building.mainPurpsCdNm || '정보없음',
              totArea: parseNumeric(building.totArea),
              platArea: parseNumeric(building.platArea),
              groundFloorCnt: parseInt32(building.groundFloorCnt),
              ugrndFloorCnt: parseInt32(building.ugrndFloorCnt),
              hhldCnt: parseInt32(building.hhldCnt),
              fmlyNum: parseInt32(building.fmlyNum),
              mainBldCnt: parseInt32(building.mainBldCnt),
              atchBldCnt: parseInt32(building.atchBldCnt),
              platPlc: building.platPlc || null,
              addressInfo: {
                sigunguCd: building.sigunguCd,
                bjdongCd: building.bjdongCd,
                platGbCd: building.platGbCd,
                bun: building.bun,
                ji: building.ji
              },
              rawData: building,
              source: 'national_api' // Indicate data source
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
          } else {
            apiError = { type: 'no_data', message: data.response.header.resultMsg };
          }
        } else {
          apiError = { type: 'http_error', status: response.status };
        }
      } catch (error: any) {
        apiError = { type: 'exception', message: error.message };
        console.warn('National API failed, will try local DB:', error.message);
      }
    }

    // STEP 2: Fallback to local Seoul building registry database
    console.log('Attempting local database fallback...');

    // Extract region names from codes if not provided
    const sigunguCode = sigunguCd || '';
    const beopjeongDongCode = bjdongCd || '';

    let localData: SeoulBuildingRecord | null = null;

    if (sigunguCode && beopjeongDongCode && bun && ji) {
      localData = await queryLocalBuildingData({
        sigunguCode,
        beopjeongDongCode,
        bon: bun,
        ji
      });
    } else {
      console.warn('Insufficient data for local fallback query', {
        sigunguCd,
        bjdongCd,
        bun,
        ji
      });
    }

    if (localData) {
      console.log('Found building data in local database');
      return NextResponse.json({
        ...transformLocalBuildingData(localData),
        fallback: true,
        apiError: apiError // Include API error info for debugging
      });
    }

    // STEP 3: Both sources failed - return error
    console.error('Building not found in both National API and local DB');
    return NextResponse.json(
      {
        error: '해당 주소의 건축물 정보를 찾을 수 없습니다.',
        details: '국토부 API와 로컬 데이터베이스 모두에서 정보를 찾을 수 없습니다.',
        apiError
      },
      { status: 404 }
    );
  } catch (error) {
    console.error('Building registry API error:', error);
    return NextResponse.json(
      { error: '건축물 정보 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    );
  }
}
