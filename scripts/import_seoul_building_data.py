#!/usr/bin/env python3
"""
Seoul Building Registry CSV Importer

This script imports the 181MB Seoul building registry CSV data into Supabase.
It handles large files efficiently with batch processing and error handling.

Usage:
    python3 scripts/import_seoul_building_data.py <csv_file_path>

Example:
    python3 scripts/import_seoul_building_data.py ~/Downloads/seoul_buildings.csv
"""

import sys
import csv
import os
from typing import Dict, Any, Optional
from datetime import datetime
import psycopg2
from psycopg2.extras import execute_batch

# Configuration
BATCH_SIZE = 1000  # Process 1000 rows at a time
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL', '')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY', '')

# Extract connection string from Supabase URL
def get_db_connection_string() -> str:
    """
    Generate PostgreSQL connection string from Supabase URL.
    Format: postgresql://postgres:[password]@[host]:5432/postgres
    """
    if not SUPABASE_URL:
        raise ValueError("NEXT_PUBLIC_SUPABASE_URL not set in environment")

    # Extract host from Supabase URL
    # e.g., https://rylclvdntoelktrameow.supabase.co
    host = SUPABASE_URL.replace('https://', '').replace('http://', '')
    project_ref = host.split('.')[0]

    # Ask for database password
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
    """Parse date value in YYYYMMDD format, return None if empty or invalid."""
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
    """Parse boolean value (Y/N or 1/0)."""
    if not value:
        return False
    return value.strip().upper() in ('Y', '1', 'TRUE', '예', '있음')


def transform_csv_row(row: Dict[str, str]) -> Dict[str, Any]:
    """
    Transform CSV row to database format.
    Adjust column names based on actual CSV headers.
    """
    return {
        'pk': parse_integer(row.get('pk', row.get('관리번호', ''))),
        'register_type': row.get('대장구분', '').strip() or None,
        'sido': row.get('시도명', '').strip() or None,
        'sigungu': row.get('시군구명', '').strip() or None,
        'beopjeong_dong': row.get('법정동명', '').strip() or None,
        'bon': row.get('본', row.get('번', '')).strip() or None,
        'ji': row.get('지', '').strip() or None,
        'land_category': row.get('대지구분', '').strip() or None,
        'jibun_address': row.get('지번주소', row.get('대지위치', '')).strip() or None,
        'road_name_address': row.get('도로명주소', '').strip() or None,
        'building_name': row.get('건물명', '').strip() or None,
        'main_use': row.get('주용도', '').strip() or None,
        'main_use_code': row.get('주용도코드', '').strip() or None,
        'main_use_code_name': row.get('주용도코드명', '').strip() or None,
        'etc_use': row.get('기타용도', '').strip() or None,
        'etc_use_code': row.get('기타용도코드', '').strip() or None,
        'plot_area': parse_numeric(row.get('대지면적', '')),
        'building_area': parse_numeric(row.get('건축면적', '')),
        'building_coverage_ratio': parse_numeric(row.get('건폐율', '')),
        'total_floor_area': parse_numeric(row.get('연면적', '')),
        'floor_area_ratio': parse_numeric(row.get('용적률', '')),
        'ground_floors': parse_integer(row.get('지상층수', '')),
        'underground_floors': parse_integer(row.get('지하층수', '')),
        'building_height': parse_numeric(row.get('높이', '')),
        'roof_code': row.get('지붕코드', '').strip() or None,
        'roof_code_name': row.get('지붕코드명', '').strip() or None,
        'main_structure_code': row.get('주구조코드', '').strip() or None,
        'main_structure_code_name': row.get('주구조코드명', '').strip() or None,
        'etc_structure': row.get('기타구조', '').strip() or None,
        'etc_structure_code': row.get('기타구조코드', '').strip() or None,
        'household_count': parse_integer(row.get('세대수', '')),
        'family_count': parse_integer(row.get('가구수', '')),
        'main_building_count': parse_integer(row.get('주건축물수', '')),
        'attached_building_count': parse_integer(row.get('부속건축물수', '')),
        'total_building_count': parse_integer(row.get('총건축물수', '')),
        'total_parking_count': parse_integer(row.get('총주차대수', row.get('주차대수', ''))),
        'indoor_mechanical_count': parse_integer(row.get('옥내기계식대수', '')),
        'indoor_self_propelled_count': parse_integer(row.get('옥내자주식대수', '')),
        'outdoor_mechanical_count': parse_integer(row.get('옥외기계식대수', '')),
        'outdoor_self_propelled_count': parse_integer(row.get('옥외자주식대수', '')),
        'ev_charging_count': parse_integer(row.get('전기차충전대수', '')),
        'license_date': parse_date(row.get('허가일', '')),
        'license_number': row.get('허가번호', '').strip() or None,
        'start_date': parse_date(row.get('착공일', '')),
        'completion_date': parse_date(row.get('준공일', row.get('사용승인일', ''))),
        'approval_date': parse_date(row.get('승인일', '')),
        'building_management_number': row.get('건물관리번호', '').strip() or None,
        'bylaws_info': row.get('법령정보', '').strip() or None,
        'energy_efficiency_grade': row.get('에너지효율등급', '').strip() or None,
        'eco_friendly_grade': row.get('친환경건축물등급', '').strip() or None,
        'intelligent_building_grade': row.get('지능형건축물등급', '').strip() or None,
        'seismic_design_flag': parse_boolean(row.get('내진설계여부', '')),
        'seismic_ability': row.get('내진능력', '').strip() or None,
        'special_structure_flag': parse_boolean(row.get('특수구조여부', '')),
        'land_use_zone_info': row.get('용도지역정보', '').strip() or None,
        'land_use_district_info': row.get('용도지구정보', '').strip() or None,
        'land_use_section_info': row.get('용도구역정보', '').strip() or None,
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

    # Read and process CSV
    total_rows = 0
    batch = []
    errors = []

    try:
        with open(csv_file_path, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)

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
        print("Usage: python3 import_seoul_building_data.py <csv_file_path>")
        print("\nExample:")
        print("  python3 scripts/import_seoul_building_data.py ~/Downloads/seoul_buildings.csv")
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
