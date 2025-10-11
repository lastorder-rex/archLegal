-- Seoul Building Registry Table
-- Data source: 181MB CSV from Seoul Building Hub
-- Purpose: Local fallback when National Building Registry API fails

CREATE TABLE IF NOT EXISTS public.seoul_building_registry (
    -- Primary Key
    pk                          bigint PRIMARY KEY,

    -- Registration Information
    register_type               text,

    -- Location Information
    sido                        text,
    sigungu                     text,
    beopjeong_dong              text,
    bon                         text,
    ji                          text,
    land_category               text,
    jibun_address               text,
    road_name_address           text,
    building_name               text,

    -- Building Classification
    main_use                    text,
    main_use_code               text,
    main_use_code_name          text,
    etc_use                     text,
    etc_use_code                text,

    -- Building Metrics
    plot_area                   numeric(12,2),
    building_area               numeric(12,2),
    building_coverage_ratio     numeric(5,2),
    total_floor_area            numeric(12,2),
    floor_area_ratio            numeric(5,2),

    -- Floor Information
    ground_floors               integer,
    underground_floors          integer,
    building_height             numeric(8,2),
    roof_code                   text,
    roof_code_name              text,

    -- Structure Information
    main_structure_code         text,
    main_structure_code_name    text,
    etc_structure               text,
    etc_structure_code          text,

    -- Household Information
    household_count             integer,
    family_count                integer,

    -- Building Count
    main_building_count         integer,
    attached_building_count     integer,
    total_building_count        integer,

    -- Parking Information
    total_parking_count         integer,
    indoor_mechanical_count     integer,
    indoor_self_propelled_count integer,
    outdoor_mechanical_count    integer,
    outdoor_self_propelled_count integer,
    ev_charging_count           integer,

    -- Administrative Information
    license_date                date,
    license_number              text,
    start_date                  date,
    completion_date             date,
    approval_date               date,

    -- Building Management Number
    building_management_number  text,

    -- Additional Attributes
    bylaws_info                 text,
    energy_efficiency_grade     text,
    eco_friendly_grade          text,
    intelligent_building_grade  text,
    seismic_design_flag         boolean,
    seismic_ability             text,

    -- Special Structure
    special_structure_flag      boolean,

    -- Land Use Information
    land_use_zone_info          text,
    land_use_district_info      text,
    land_use_section_info       text,

    -- Metadata
    created_at                  timestamptz DEFAULT now(),
    updated_at                  timestamptz DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_seoul_bldg_sigungu_dong
    ON public.seoul_building_registry(sigungu, beopjeong_dong);

CREATE INDEX IF NOT EXISTS idx_seoul_bldg_bon_ji
    ON public.seoul_building_registry(bon, ji);

CREATE INDEX IF NOT EXISTS idx_seoul_bldg_jibun_address
    ON public.seoul_building_registry(jibun_address);

CREATE INDEX IF NOT EXISTS idx_seoul_bldg_road_address
    ON public.seoul_building_registry(road_name_address);

CREATE INDEX IF NOT EXISTS idx_seoul_bldg_building_name
    ON public.seoul_building_registry(building_name)
    WHERE building_name IS NOT NULL;

-- Composite index for address-based lookup
CREATE INDEX IF NOT EXISTS idx_seoul_bldg_address_lookup
    ON public.seoul_building_registry(sigungu, beopjeong_dong, bon, ji);

-- Comment on table
COMMENT ON TABLE public.seoul_building_registry IS
    'Seoul building registry data imported from 181MB CSV. Used as fallback when National Building Registry API is unavailable.';

-- Enable RLS (but allow service role access)
ALTER TABLE public.seoul_building_registry ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role full access
-- Policy: Allow authenticated users read-only access
CREATE POLICY "Allow authenticated read access"
    ON public.seoul_building_registry
    FOR SELECT
    TO authenticated
    USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_seoul_building_registry_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER trigger_update_seoul_building_registry_updated_at
    BEFORE UPDATE ON public.seoul_building_registry
    FOR EACH ROW
    EXECUTE FUNCTION update_seoul_building_registry_updated_at();
