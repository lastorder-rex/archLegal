#!/usr/bin/env python3
"""
Seoul Building Registry CSV Importer (No Header Version)

CSV 컬럼 순서 (53개):
0: pk, 1: 대장구분, 2: 시도, 3: 시군구, 4: 법정동, 5: 본, 6: 지, 7: 대지구분,
8-11: 빈칸, 12: 건물명, 13: 동명칭, 14: 대지면적, 15: 건축면적, 16: 연면적,
17: 건폐율, 18: 용적률, 19: 구조면적, 20: 주구조, 21: 주구조명, 22: 주용도, 23: 기타용도,
24: 지붕구조, 25: 지붕명, 26: 높이, 27: 지상층수, 28: 지하층수, 29: 승강기면적,
30: 세대수, 31: 가구수, 32: 주건축물수, 33: 허가일, 34: 착공일, 35: 사용승인일,
36-45: 주차/기타, 46: 용도지역, 47: 용도지구, 48: 용도구역
"""

import sys
import csv
import os
from typing import Optional
import psycopg2
from psycopg2.extras import execute_batch

# Configuration
BATCH_SIZE = 1000
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL', '')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY', '')

def get_db_connection_string() -> str:
    """Generate PostgreSQL connection string from Supabase URL."""
    if not SUPABASE_URL:
        raise ValueError("NEXT_PUBLIC_SUPABASE_URL not set in environment")

    host = SUPABASE_URL.replace('https://', '').replace('http://', '')
    project_ref = host.split('.')[0]

    print(f"Project: {project_ref}")
    db_password = input("Enter database password: ").strip()

    return f"postgresql://postgres:{db_password}@db.{project_ref}.supabase.co:5432/postgres"

def parse_numeric(value: str) -> Optional[float]:
    """Parse numeric value, return None if empty or invalid."""
    if not value or value.strip() == '':
        return None
    try:
        return float(value.replace(',', ''))
    except ValueError:
        return None

def parse_integer(value: str) -> Optional[int]:
    """Parse integer value, return None if empty or invalid."""
    if not value or value.strip() == '':
        return None
    try:
        return int(value.replace(',', ''))
    except ValueError:
        return None

def parse_date(value: str) -> Optional[str]:
    """Parse date value in YYYYMMDD format."""
    if not value or value.strip() == '' or len(value) != 8:
        return None
    try:
        year = int(value[0:4])
        month = int(value[4:6])
        day = int(value[6:8])
        return f"{year}-{month:02d}-{day:02d}"
    except (ValueError, IndexError):
        return None

def parse_boolean(value: str) -> bool:
    """Parse boolean value."""
    if not value:
        return False
    return value.strip() in ('1', 'Y', 'true', '예', '있음')

def transform_csv_row(row: list) -> dict:
    """
    Transform CSV row (list of values) to database format.
    CSV has 53 columns without header.
    """
    # Ensure row has enough columns (pad with empty strings if needed)
    while len(row) < 53:
        row.append('')

    return {
        'pk': parse_integer(row[0]),
        'register_type': row[1].strip() or None,
        'sido': row[2].strip() or None,
        'sigungu': row[3].strip() or None,
        'beopjeong_dong': row[4].strip() or None,
        'bon': row[5].strip() or None,
        'ji': row[6].strip() or None,
        'land_category': row[7].strip() or None,
        'jibun_address': None,  # Not in CSV
        'road_name_address': None,  # Not in CSV
        'building_name': row[12].strip() or None,
        'main_use': row[22].strip() or None,
        'main_use_code': None,  # Not in CSV
        'main_use_code_name': row[22].strip() or None,
        'etc_use': row[23].strip() or None,
        'etc_use_code': None,  # Not in CSV
        'plot_area': parse_numeric(row[14]),
        'building_area': parse_numeric(row[15]),
        'building_coverage_ratio': parse_numeric(row[17]),
        'total_floor_area': parse_numeric(row[16]),
        'floor_area_ratio': parse_numeric(row[18]),
        'ground_floors': parse_integer(row[27]),
        'underground_floors': parse_integer(row[28]),
        'building_height': parse_numeric(row[26]),
        'roof_code': row[24].strip() or None,
        'roof_code_name': row[25].strip() or None,
        'main_structure_code': row[20].strip() or None,
        'main_structure_code_name': row[21].strip() or None,
        'etc_structure': None,  # Not in CSV
        'etc_structure_code': None,  # Not in CSV
        'household_count': parse_integer(row[30]),
        'family_count': parse_integer(row[31]),
        'main_building_count': parse_integer(row[32]),
        'attached_building_count': parse_integer(row[42]) if len(row) > 42 else None,
        'total_building_count': None,  # Not in CSV
        'total_parking_count': parse_integer(row[43]) if len(row) > 43 else None,
        'indoor_mechanical_count': parse_integer(row[39]) if len(row) > 39 else None,
        'indoor_self_propelled_count': parse_integer(row[40]) if len(row) > 40 else None,
        'outdoor_mechanical_count': parse_integer(row[41]) if len(row) > 41 else None,
        'outdoor_self_propelled_count': None,  # Not in CSV
        'ev_charging_count': parse_integer(row[44]) if len(row) > 44 else None,
        'license_date': parse_date(row[33]),
        'license_number': None,  # Not in CSV
        'start_date': parse_date(row[34]),
        'completion_date': parse_date(row[35]),
        'approval_date': None,  # Not in CSV
        'building_management_number': None,  # Not in CSV
        'bylaws_info': None,  # Not in CSV
        'energy_efficiency_grade': None,  # Not in CSV
        'eco_friendly_grade': None,  # Not in CSV
        'intelligent_building_grade': None,  # Not in CSV
        'seismic_design_flag': parse_boolean(row[37]) if len(row) > 37 else False,
        'seismic_ability': None,  # Not in CSV
        'special_structure_flag': parse_boolean(row[38]) if len(row) > 38 else False,
        'land_use_zone_info': row[50].strip() if len(row) > 50 else None,
        'land_use_district_info': row[51].strip() if len(row) > 51 else None,
        'land_use_section_info': row[52].strip() if len(row) > 52 else None,
    }

def import_csv_data(csv_file_path: str, conn_string: str):
    """Import CSV data into Supabase database."""

    print(f"Starting import from: {csv_file_path}")
    print(f"Batch size: {BATCH_SIZE}")

    # Connect to database
    conn = psycopg2.connect(conn_string)
    cursor = conn.cursor()

    # Prepare INSERT statement
    insert_sql = """
        INSERT INTO public.seoul_building_registry (
            pk, register_type, sido, sigungu, beopjeong_dong, bon, ji,
            land_category, jibun_address, road_name_address, building_name,
            main_use, main_use_code, main_use_code_name, etc_use, etc_use_code,
            plot_area, building_area, building_coverage_ratio, total_floor_area, floor_area_ratio,
            ground_floors, underground_floors, building_height, roof_code, roof_code_name,
            main_structure_code, main_structure_code_name, etc_structure, etc_structure_code,
            household_count, family_count, main_building_count, attached_building_count, total_building_count,
            total_parking_count, indoor_mechanical_count, indoor_self_propelled_count,
            outdoor_mechanical_count, outdoor_self_propelled_count, ev_charging_count,
            license_date, license_number, start_date, completion_date, approval_date,
            building_management_number, bylaws_info, energy_efficiency_grade, eco_friendly_grade,
            intelligent_building_grade, seismic_design_flag, seismic_ability,
            special_structure_flag, land_use_zone_info, land_use_district_info, land_use_section_info
        ) VALUES (
            %(pk)s, %(register_type)s, %(sido)s, %(sigungu)s, %(beopjeong_dong)s, %(bon)s, %(ji)s,
            %(land_category)s, %(jibun_address)s, %(road_name_address)s, %(building_name)s,
            %(main_use)s, %(main_use_code)s, %(main_use_code_name)s, %(etc_use)s, %(etc_use_code)s,
            %(plot_area)s, %(building_area)s, %(building_coverage_ratio)s, %(total_floor_area)s, %(floor_area_ratio)s,
            %(ground_floors)s, %(underground_floors)s, %(building_height)s, %(roof_code)s, %(roof_code_name)s,
            %(main_structure_code)s, %(main_structure_code_name)s, %(etc_structure)s, %(etc_structure_code)s,
            %(household_count)s, %(family_count)s, %(main_building_count)s, %(attached_building_count)s, %(total_building_count)s,
            %(total_parking_count)s, %(indoor_mechanical_count)s, %(indoor_self_propelled_count)s,
            %(outdoor_mechanical_count)s, %(outdoor_self_propelled_count)s, %(ev_charging_count)s,
            %(license_date)s, %(license_number)s, %(start_date)s, %(completion_date)s, %(approval_date)s,
            %(building_management_number)s, %(bylaws_info)s, %(energy_efficiency_grade)s, %(eco_friendly_grade)s,
            %(intelligent_building_grade)s, %(seismic_design_flag)s, %(seismic_ability)s,
            %(special_structure_flag)s, %(land_use_zone_info)s, %(land_use_district_info)s, %(land_use_section_info)s
        )
        ON CONFLICT (pk) DO UPDATE SET
            register_type = EXCLUDED.register_type,
            updated_at = now()
    """

    # Read and process CSV (no header)
    total_rows = 0
    batch = []
    errors = []

    try:
        with open(csv_file_path, 'r', encoding='utf-8') as csvfile:
            reader = csv.reader(csvfile)  # Use csv.reader instead of DictReader

            for row_num, row in enumerate(reader, start=1):
                try:
                    transformed_row = transform_csv_row(row)

                    # Validate required fields
                    if transformed_row['pk'] is None:
                        errors.append(f"Row {row_num}: Missing pk (primary key)")
                        continue

                    batch.append(transformed_row)

                    # Insert batch when it reaches BATCH_SIZE
                    if len(batch) >= BATCH_SIZE:
                        execute_batch(cursor, insert_sql, batch)
                        conn.commit()
                        total_rows += len(batch)
                        print(f"Imported {total_rows} rows...")
                        batch = []

                except Exception as e:
                    errors.append(f"Row {row_num}: {str(e)}")
                    if len(errors) > 100:
                        print("Too many errors, stopping import.")
                        break

            # Insert remaining batch
            if batch:
                execute_batch(cursor, insert_sql, batch)
                conn.commit()
                total_rows += len(batch)

            print(f"\n✅ Import completed!")
            print(f"Total rows imported: {total_rows}")

            if errors:
                print(f"\n⚠️  Errors encountered: {len(errors)}")
                print("First 10 errors:")
                for error in errors[:10]:
                    print(f"  - {error}")

    except Exception as e:
        print(f"\n❌ Import failed: {str(e)}")
        conn.rollback()
        raise

    finally:
        cursor.close()
        conn.close()

def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print("Usage: python3 import_seoul_csv.py <csv_file_path>")
        print("\nExample:")
        print("  python3 scripts/import_seoul_csv.py /Users/kbsc/rexDev/archLegal/public/seoul_home.csv")
        sys.exit(1)

    csv_file_path = sys.argv[1]

    if not os.path.exists(csv_file_path):
        print(f"Error: File not found: {csv_file_path}")
        sys.exit(1)

    print("Seoul Building Registry Data Importer")
    print("=" * 50)

    try:
        conn_string = get_db_connection_string()
        import_csv_data(csv_file_path, conn_string)
    except KeyboardInterrupt:
        print("\n\nImport cancelled by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    main()
