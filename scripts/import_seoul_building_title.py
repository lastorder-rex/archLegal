#!/usr/bin/env python3
"""
Bulk import script for seoul_building_title_registry.

Reads the mart_seoul.csv file (without header) and streams the rows to Supabase
REST API in manageable batches. Designed for large CSVs that cannot be uploaded
through the web UI.
"""

from decimal import Decimal, InvalidOperation
import csv
import os
import sys
from pathlib import Path
from typing import Iterable, List, Optional

import requests


# Column order in mart_seoul.csv (77 columns)
CSV_TO_DB_COLUMNS: List[str] = [
    "register_pk",
    "register_division_code",
    "register_division_name",
    "register_type_code",
    "register_type_name",
    "land_location",
    "road_land_location",
    "building_name",
    "sigungu_code",
    "beopjeong_dong_code",
    "land_category_code",
    "bun",
    "ji",
    "special_land_name",
    "block",
    "lot",
    "extra_parcel_count",
    "road_name_code",
    "road_beopjeong_dong_code",
    "road_ground_type_code",
    "road_main_no",
    "road_sub_no",
    "dong_name",
    "main_auxiliary_code",
    "main_auxiliary_name",
    "land_area_m2",
    "building_area_m2",
    "building_coverage_ratio",
    "total_floor_area_m2",
    "far_calculated_area_m2",
    "far_ratio",
    "structure_code",
    "structure_name",
    "etc_structure",
    "primary_use_code",
    "primary_use_name",
    "secondary_use",
    "roof_code",
    "roof_name",
    "etc_roof",
    "household_count",
    "family_count",
    "building_height_m",
    "ground_floors",
    "underground_floors",
    "passenger_elevator_count",
    "emergency_elevator_count",
    "attached_building_count",
    "attached_building_area_m2",
    "total_block_area_m2",
    "indoor_mech_parking_count",
    "indoor_mech_parking_area_m2",
    "outdoor_mech_parking_count",
    "outdoor_mech_parking_area_m2",
    "indoor_self_parking_count",
    "indoor_self_parking_area_m2",
    "outdoor_self_parking_count",
    "outdoor_self_parking_area_m2",
    "permit_date_yyyymmdd",
    "construction_start_yyyymmdd",
    "use_approval_yyyymmdd",
    "permit_year",
    "permit_agency_code",
    "permit_agency_name",
    "permit_category_code",
    "permit_category_name",
    "unit_count",
    "energy_efficiency_grade",
    "energy_saving_rate",
    "energy_epi_score",
    "eco_friendly_grade",
    "eco_friendly_score",
    "intelligent_building_grade",
    "intelligent_building_score",
    "source_created_yyyymmdd",
    "seismic_design_flag",
    "seismic_capacity",
]

# Fields that should be treated as integers (None if blank)
INTEGER_FIELDS = {
    "extra_parcel_count",
    "road_main_no",
    "road_sub_no",
    "household_count",
    "family_count",
    "ground_floors",
    "underground_floors",
    "passenger_elevator_count",
    "emergency_elevator_count",
    "attached_building_count",
    "indoor_mech_parking_count",
    "outdoor_mech_parking_count",
    "indoor_self_parking_count",
    "outdoor_self_parking_count",
    "unit_count",
    "energy_epi_score",
    "eco_friendly_score",
    "intelligent_building_score",
}

# Fields that should be treated as decimals/floats (None if blank)
DECIMAL_FIELDS = {
    "land_area_m2",
    "building_area_m2",
    "building_coverage_ratio",
    "total_floor_area_m2",
    "far_calculated_area_m2",
    "far_ratio",
    "building_height_m",
    "attached_building_area_m2",
    "total_block_area_m2",
    "indoor_mech_parking_area_m2",
    "outdoor_mech_parking_area_m2",
    "indoor_self_parking_area_m2",
    "outdoor_self_parking_area_m2",
    "energy_saving_rate",
}
def load_config(args):
    if len(args) < 2:
        print("Usage: python scripts/import_seoul_building_title.py <path_to_csv>", file=sys.stderr)
        sys.exit(1)

    file_path = Path(args[1]).expanduser().resolve()
    if not file_path.exists():
        print(f"CSV file not found: {file_path}", file=sys.stderr)
        sys.exit(1)

    supabase_url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    service_role_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not service_role_key:
        print("Environment variables SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) "
              "and SUPABASE_SERVICE_ROLE_KEY are required.", file=sys.stderr)
        sys.exit(1)

    return {
        "file_path": file_path,
        "supabase_url": supabase_url.rstrip("/"),
        "service_role_key": service_role_key,
        "table_name": "seoul_building_title_registry",
        "chunk_size": 500,
    }


def parse_decimal(value):
    try:
        return float(Decimal(value))
    except (InvalidOperation, ValueError):
        print(f"Warning: Failed to parse decimal value '{value}', storing NULL instead.")
        return None


def transform_row(row):
    if len(row) != len(CSV_TO_DB_COLUMNS):
        raise ValueError(f"Unexpected column count ({len(row)}) in row: {row[:5]}...")

    record = {}
    for column_name, raw_value in zip(CSV_TO_DB_COLUMNS, row):
        value = raw_value.strip()
        if value == "":
            record[column_name] = None
            continue

        if column_name in INTEGER_FIELDS:
            try:
                record[column_name] = int(Decimal(value))
            except (InvalidOperation, ValueError):
                print(f"Warning: Failed to parse integer value '{value}' for column '{column_name}'. Setting NULL.")
                record[column_name] = None
            continue

        if column_name in DECIMAL_FIELDS:
            record[column_name] = parse_decimal(value)
            continue

        # Keep original string value
        record[column_name] = value

    return record


def iter_batches(reader, batch_size):
    batch = []
    for row in reader:
        batch.append(transform_row(row))
        if len(batch) >= batch_size:
            yield batch
            batch = []
    if batch:
        yield batch


def post_batch(config, session, batch, batch_no):
    endpoint = "{}/rest/v1/{}?on_conflict=register_pk".format(
        config["supabase_url"], config["table_name"]
    )
    headers = {
        "apikey": config["service_role_key"],
        "Authorization": "Bearer {}".format(config["service_role_key"]),
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    }
    response = session.post(endpoint, json=batch, headers=headers, timeout=60)
    if not response.ok:
        print(f"Batch {batch_no}: Failed with status {response.status_code} -> {response.text}")
        response.raise_for_status()


def main() -> None:
    config = load_config(sys.argv)
    total_rows = 0
    batch_number = 0

    print("Starting import from {}".format(config["file_path"]))
    with config["file_path"].open("r", encoding="utf-8-sig", newline="") as csvfile:
        reader = csv.reader(csvfile)

        with requests.Session() as session:
            for batch in iter_batches(reader, config["chunk_size"]):
                batch_number += 1
                post_batch(config, session, batch, batch_number)
                total_rows += len(batch)
                if batch_number % 20 == 0:
                    print("Imported {} rows so far...".format(total_rows))

    print("Import completed. Total rows processed: {}".format(total_rows))


if __name__ == "__main__":
    main()
