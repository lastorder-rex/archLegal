#!/usr/bin/env node

/**
 * Seoul Building Registry CSV Importer (Node.js version)
 *
 * Usage: node scripts/import-seoul-buildings.js
 */

const fs = require('fs');
const readline = require('readline');
const { createClient } = require('@supabase/supabase-js');

const CSV_FILE_PATH = '/Users/kbsc/rexDev/archLegal/public/seoul_home.csv';
const BATCH_SIZE = 100;

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Environment variables not set:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Helper functions
function parseNumeric(value) {
  if (!value || value.trim() === '') return null;
  const parsed = parseFloat(value.replace(/,/g, ''));
  return isNaN(parsed) ? null : parsed;
}

function parseInteger(value) {
  if (!value || value.trim() === '') return null;
  const parsed = parseInt(value.replace(/,/g, ''), 10);
  return isNaN(parsed) ? null : parsed;
}

function parseDate(value) {
  if (!value || value.trim() === '' || value.length !== 8) return null;
  try {
    const year = value.substring(0, 4);
    const month = value.substring(4, 6);
    const day = value.substring(6, 8);
    return `${year}-${month}-${day}`;
  } catch (e) {
    return null;
  }
}

function parseBoolean(value) {
  if (!value) return false;
  return ['1', 'Y', 'true', '예', '있음'].includes(value.trim());
}

function transformCsvRow(row) {
  /**
   * CSV 컬럼 순서 (53개, 헤더 없음):
   * 0: pk, 1: 대장구분, 2: 시도, 3: 시군구, 4: 법정동, 5: 본, 6: 지, 7: 대지구분,
   * 8-11: 빈칸, 12: 건물명, 13: 동명칭, 14: 대지면적, 15: 건축면적, 16: 연면적,
   * 17: 건폐율, 18: 용적률, 19: 구조면적, 20: 주구조, 21: 주구조명, 22: 주용도, 23: 기타용도,
   * 24: 지붕구조, 25: 지붕명, 26: 높이, 27: 지상층수, 28: 지하층수, 29: 승강기면적,
   * 30: 세대수, 31: 가구수, 32: 주건축물수, 33: 허가일, 34: 착공일, 35: 사용승인일,
   * 36-49: 기타, 50: 용도지역, 51: 용도지구, 52: 용도구역
   */

  // Pad row if needed
  while (row.length < 53) {
    row.push('');
  }

  return {
    pk: parseInteger(row[0]),
    register_type: row[1].trim() || null,
    sido: row[2].trim() || null,
    sigungu: row[3].trim() || null,
    beopjeong_dong: row[4].trim() || null,
    bon: row[5].trim() || null,
    ji: row[6].trim() || null,
    land_category: row[7].trim() || null,
    jibun_address: null,
    road_name_address: null,
    building_name: row[12].trim() || null,
    main_use: row[22].trim() || null,
    main_use_code: null,
    main_use_code_name: row[22].trim() || null,
    etc_use: row[23].trim() || null,
    etc_use_code: null,
    plot_area: parseNumeric(row[14]),
    building_area: parseNumeric(row[15]),
    building_coverage_ratio: parseNumeric(row[17]),
    total_floor_area: parseNumeric(row[16]),
    floor_area_ratio: parseNumeric(row[18]),
    ground_floors: parseInteger(row[27]),
    underground_floors: parseInteger(row[28]),
    building_height: parseNumeric(row[26]),
    roof_code: row[24].trim() || null,
    roof_code_name: row[25].trim() || null,
    main_structure_code: row[20].trim() || null,
    main_structure_code_name: row[21].trim() || null,
    etc_structure: null,
    etc_structure_code: null,
    household_count: parseInteger(row[30]),
    family_count: parseInteger(row[31]),
    main_building_count: parseInteger(row[32]),
    attached_building_count: parseInteger(row[42]),
    total_building_count: null,
    total_parking_count: parseInteger(row[43]),
    indoor_mechanical_count: parseInteger(row[39]),
    indoor_self_propelled_count: parseInteger(row[40]),
    outdoor_mechanical_count: parseInteger(row[41]),
    outdoor_self_propelled_count: null,
    ev_charging_count: parseInteger(row[44]),
    license_date: parseDate(row[33]),
    license_number: null,
    start_date: parseDate(row[34]),
    completion_date: parseDate(row[35]),
    approval_date: null,
    building_management_number: null,
    bylaws_info: null,
    energy_efficiency_grade: null,
    eco_friendly_grade: null,
    intelligent_building_grade: null,
    seismic_design_flag: parseBoolean(row[37]),
    seismic_ability: null,
    special_structure_flag: parseBoolean(row[38]),
    land_use_zone_info: row[50].trim() || null,
    land_use_district_info: row[51].trim() || null,
    land_use_section_info: row[52].trim() || null,
  };
}

async function insertBatch(batch) {
  const { data, error } = await supabase
    .from('seoul_building_registry')
    .upsert(batch, {
      onConflict: 'pk',
      ignoreDuplicates: false
    });

  if (error) {
    throw error;
  }

  return data;
}

async function importCsvData() {
  console.log('Seoul Building Registry Data Importer (Node.js)');
  console.log('='.repeat(50));
  console.log(`CSV file: ${CSV_FILE_PATH}`);
  console.log(`Batch size: ${BATCH_SIZE}`);
  console.log('');

  if (!fs.existsSync(CSV_FILE_PATH)) {
    console.error(`❌ File not found: ${CSV_FILE_PATH}`);
    process.exit(1);
  }

  const fileStream = fs.createReadStream(CSV_FILE_PATH);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let batch = [];
  let totalRows = 0;
  let errorCount = 0;
  let lineNumber = 0;

  console.log('Starting import...\n');

  for await (const line of rl) {
    lineNumber++;

    try {
      // Parse CSV line (simple split, doesn't handle quoted commas)
      const row = line.split(',');
      const transformed = transformCsvRow(row);

      // Validate required fields
      if (!transformed.pk) {
        errorCount++;
        if (errorCount <= 10) {
          console.error(`⚠️  Row ${lineNumber}: Missing pk`);
        }
        continue;
      }

      batch.push(transformed);

      // Insert batch when it reaches BATCH_SIZE
      if (batch.length >= BATCH_SIZE) {
        try {
          await insertBatch(batch);
          totalRows += batch.length;
          process.stdout.write(`\rImported ${totalRows} rows...`);
          batch = [];
        } catch (error) {
          console.error(`\n❌ Error inserting batch at row ${lineNumber}:`, error.message);
          errorCount++;
          // Continue with next batch
          batch = [];
        }
      }
    } catch (error) {
      errorCount++;
      if (errorCount <= 10) {
        console.error(`⚠️  Row ${lineNumber}: ${error.message}`);
      }
    }
  }

  // Insert remaining batch
  if (batch.length > 0) {
    try {
      await insertBatch(batch);
      totalRows += batch.length;
      process.stdout.write(`\rImported ${totalRows} rows...`);
    } catch (error) {
      console.error(`\n❌ Error inserting final batch:`, error.message);
      errorCount++;
    }
  }

  console.log('\n');
  console.log('✅ Import completed!');
  console.log(`Total rows imported: ${totalRows}`);

  if (errorCount > 0) {
    console.log(`⚠️  Errors encountered: ${errorCount}`);
  }
}

// Run import
importCsvData()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Import failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  });
