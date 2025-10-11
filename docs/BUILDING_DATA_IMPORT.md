# Seoul Building Registry Data Import Guide

## Overview

This guide explains how to import the Seoul building registry CSV data (181MB) into Supabase to provide a reliable local fallback when the National Building Registry API is unavailable.

## Data Source Strategy

The building lookup system uses a **two-tier fallback strategy**:

1. **Primary**: National Building Registry API (국토교통부 건축물대장 API)
2. **Fallback**: Local Seoul building registry database

When the National API fails (network issues, maintenance, rate limits), the system automatically queries the local database.

---

## Prerequisites

1. **CSV File**: Download the Seoul building registry CSV (181MB) from the building hub
2. **Python 3.7+**: Required to run the import script
3. **psycopg2**: PostgreSQL adapter for Python
4. **Database Access**: Supabase database password

---

## Step 1: Database Schema Setup

First, apply the database migration to create the `seoul_building_registry` table:

```bash
# Navigate to project root
cd /Users/kbsc/rexDev/archLegal

# Apply migration using Supabase CLI
npx supabase db push
```

This creates the table with all necessary columns and indexes:

- **Primary columns**: pk, address components (sigungu, beopjeong_dong, bon, ji)
- **Building metrics**: areas, floors, parking counts
- **Administrative info**: dates, codes, grades
- **Indexes**: Optimized for address-based queries

---

## Step 2: Install Python Dependencies

Install the required Python package:

```bash
pip3 install psycopg2-binary
```

Or if you prefer using a virtual environment:

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install psycopg2-binary
```

---

## Step 3: Prepare Environment Variables

Ensure your `.env.local` has the required Supabase connection info:

```env
NEXT_PUBLIC_SUPABASE_URL=https://rylclvdntoelktrameow.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

Load these into your terminal session:

```bash
# On macOS/Linux
export NEXT_PUBLIC_SUPABASE_URL=https://rylclvdntoelktrameow.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# On Windows (PowerShell)
$env:NEXT_PUBLIC_SUPABASE_URL="https://rylclvdntoelktrameow.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"
```

---

## Step 4: Run the Import Script

Execute the import script with the path to your CSV file:

```bash
python3 scripts/import_seoul_building_data.py ~/Downloads/seoul_buildings.csv
```

### What the script does:

1. **Connects** to your Supabase database (will prompt for password)
2. **Reads** the CSV file in batches (1000 rows at a time)
3. **Transforms** each row to match the database schema
4. **Inserts** data with conflict handling (updates on duplicate pk)
5. **Reports** progress and any errors

### Expected output:

```
Seoul Building Registry Data Importer
==================================================
Project: rylclvdntoelktrameow
Enter database password: ********

Starting import from: /Users/kbsc/Downloads/seoul_buildings.csv
Batch size: 1000

Imported 1000 rows...
Imported 2000 rows...
...
Imported 50000 rows...

✅ Import completed!
Total rows imported: 50234
```

### Import time estimate:

- **Small dataset** (< 10K rows): 1-2 minutes
- **Medium dataset** (10K-50K rows): 5-10 minutes
- **Large dataset** (> 50K rows): 15-30 minutes

---

## Step 5: Verify Import

Check that data was imported correctly:

```sql
-- Count total records
SELECT COUNT(*) FROM seoul_building_registry;

-- Sample records
SELECT
  sigungu,
  beopjeong_dong,
  bon,
  ji,
  main_use_code_name,
  total_floor_area
FROM seoul_building_registry
LIMIT 10;

-- Check specific address
SELECT * FROM seoul_building_registry
WHERE sigungu = '강남구'
  AND beopjeong_dong = '역삼동'
  AND bon = '123'
  AND ji = '45';
```

---

## Step 6: Test the Fallback System

Test that the API fallback works correctly:

### Option 1: Test via API Route

```bash
# Test National API (should work normally)
curl -X POST http://localhost:3002/api/building/title \
  -H "Content-Type: application/json" \
  -d '{
    "sigunguCd": "11680",
    "bjdongCd": "10300",
    "platGbCd": "0",
    "bun": "0123",
    "ji": "0045",
    "sigunguName": "강남구",
    "bjdongName": "역삼동"
  }'
```

### Option 2: Test via UI

1. Navigate to consultation form
2. Enter an address
3. Check the building info display
4. Look for the data source indicator:
   - **National API**: "국토교통부 건축물대장에서 조회된 공식 데이터"
   - **Local DB**: "서울시 건축물대장 데이터베이스에서 조회되었습니다"

---

## CSV Column Mapping

The import script maps CSV columns to database fields. If your CSV has different column names, update the `transform_csv_row()` function in [import_seoul_building_data.py](../scripts/import_seoul_building_data.py):

| CSV Column | Database Field | Type | Example |
|------------|---------------|------|---------|
| pk | pk | bigint | 11680103000001230045 |
| 시군구명 | sigungu | text | 강남구 |
| 법정동명 | beopjeong_dong | text | 역삼동 |
| 본 / 번 | bon | text | 0123 |
| 지 | ji | text | 0045 |
| 주용도코드명 | main_use_code_name | text | 제2종근린생활시설 |
| 대지면적 | plot_area | numeric | 500.50 |
| 연면적 | total_floor_area | numeric | 1250.75 |
| 지상층수 | ground_floors | integer | 5 |
| 지하층수 | underground_floors | integer | 2 |

---

## Troubleshooting

### Issue: "Permission denied" error

**Solution**: Ensure you're using the service role key, not the anon key.

```bash
# Check environment variable
echo $SUPABASE_SERVICE_ROLE_KEY
```

### Issue: "Connection refused"

**Solution**:
1. Check database password is correct
2. Verify Supabase project is accessible
3. Check if your IP is whitelisted (if restrictions are enabled)

### Issue: "Duplicate key error"

**Solution**: The script uses `ON CONFLICT (pk) DO UPDATE`, so duplicates should be handled automatically. If you see this error, check that the `pk` column is truly unique in your CSV.

### Issue: "Too many errors"

**Solution**: The script stops after 100 errors. Common causes:
- Missing required fields (pk must not be null)
- Data type mismatches
- Encoding issues (ensure CSV is UTF-8)

To debug, check the error output:
```
⚠️  Errors encountered: 10
First 10 errors:
  - Row 123: Missing pk (primary key)
  - Row 456: Invalid date format for license_date
```

### Issue: Import is very slow

**Solutions**:
1. Increase batch size (change `BATCH_SIZE` in script from 1000 to 5000)
2. Use `COPY` command for very large files (requires direct database access)
3. Run import during off-peak hours

---

## Performance Optimization

### Index Performance

The following indexes are created automatically:

```sql
-- Address component lookup
CREATE INDEX idx_seoul_bldg_address_lookup
    ON seoul_building_registry(sigungu, beopjeong_dong, bon, ji);

-- Individual component searches
CREATE INDEX idx_seoul_bldg_sigungu_dong
    ON seoul_building_registry(sigungu, beopjeong_dong);

-- Text searches
CREATE INDEX idx_seoul_bldg_jibun_address
    ON seoul_building_registry(jibun_address);
```

### Query Performance Tips

1. **Always include all address components** for fastest lookup:
   ```sql
   WHERE sigungu = ? AND beopjeong_dong = ? AND bon = ? AND ji = ?
   ```

2. **Avoid full-text searches** on large fields unless necessary

3. **Use EXPLAIN ANALYZE** to check query performance:
   ```sql
   EXPLAIN ANALYZE
   SELECT * FROM seoul_building_registry
   WHERE sigungu = '강남구' AND beopjeong_dong = '역삼동';
   ```

---

## Maintenance

### Updating Data

To update with a new CSV file:

1. Run the import script again (duplicate records will be updated)
2. Or truncate the table first for a clean import:
   ```sql
   TRUNCATE TABLE seoul_building_registry;
   ```

### Monitoring Table Size

```sql
-- Check table size
SELECT
  pg_size_pretty(pg_total_relation_size('seoul_building_registry')) AS total_size,
  pg_size_pretty(pg_relation_size('seoul_building_registry')) AS table_size,
  pg_size_pretty(pg_indexes_size('seoul_building_registry')) AS indexes_size;
```

### Backup

```bash
# Backup table data
pg_dump -h db.rylclvdntoelktrameow.supabase.co \
  -U postgres \
  -t seoul_building_registry \
  -d postgres \
  --data-only \
  > seoul_building_backup.sql

# Restore from backup
psql -h db.rylclvdntoelktrameow.supabase.co \
  -U postgres \
  -d postgres \
  < seoul_building_backup.sql
```

---

## API Integration

The building lookup API (`/api/building/title/route.ts`) automatically handles the fallback:

```typescript
// 1. Try National API first
const response = await fetch(nationalApiUrl);

// 2. If fails, query local DB
if (!response.ok) {
  const localData = await queryLocalBuildingData(sigungu, bjdong, bon, ji);
  if (localData) {
    return transformLocalBuildingData(localData);
  }
}

// 3. Both failed - return error
return { error: '건축물 정보를 찾을 수 없습니다' };
```

The frontend automatically displays the data source in [BuildingInfoDisplay.tsx](../components/consultation/BuildingInfoDisplay.tsx).

---

## Security Considerations

1. **Row Level Security (RLS)** is enabled on the table
2. **Authenticated users** have read-only access
3. **Service role** required for writes (import script)
4. **No public access** - users must be logged in

---

## Future Enhancements

Potential improvements to consider:

1. **Incremental updates**: Track changed records instead of full reimport
2. **Additional data sources**: Integrate other regional building registries
3. **Caching layer**: Add Redis cache for frequently accessed buildings
4. **Search optimization**: Implement full-text search for building names
5. **Data validation**: Add automated checks for data quality

---

## Support

For issues or questions:

1. Check the [main README](../README.md)
2. Review Supabase logs in the dashboard
3. Check the import script logs for error details
4. Verify your CSV format matches the expected schema

---

## License

This data import process is part of the archLegal project. The building data belongs to the Seoul Metropolitan Government and National Land Ministry.
