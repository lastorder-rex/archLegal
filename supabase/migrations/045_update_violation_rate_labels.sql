-- Migration: Update 2026 enforcement-fine violation labels
-- Created: 2026-06-15
-- Description: Makes user-facing violation reason labels match the detailed Jake/legal wording.

update public.enforcement_fine_violation_rates as target
set
  label = source.label,
  updated_at = now()
from (
  values
    ('coverage_ratio_excess', '건폐율을 초과하여 건축한 경우'),
    ('floor_area_ratio_excess', '용적률을 초과하여 건축한 경우'),
    ('unauthorized_extension', '허가를 받지 아니하고 건축한 경우'),
    ('unreported_extension', '신고를 하지 아니하고 건축한 경우'),
    ('unauthorized_major_repair', '허가·신고 없이 증설 또는 해체로 대수선을 한 건축물'),
    ('unauthorized_use_change', '허가·신고 없이 무단 용도변경한 건축물'),
    ('use_without_approval', '사용승인을 받지 아니하고 사용 중인 건축물'),
    ('landscape_violation', '대지의 조경에 관한 사항을 위반한 건축물'),
    ('building_line_violation', '건축선에 적합하지 아니한 건축물'),
    ('structural_safety_violation', '구조내력기준에 적합하지 아니한 건축물'),
    ('evacuation_fire_compartment_violation', '피난시설, 용도·구조 제한, 방화구획 등 기준에 적합하지 아니한 건축물'),
    ('fire_resistant_wall_violation', '내화구조 및 방화벽 기준에 적합하지 아니한 건축물'),
    ('fire_district_violation', '방화지구 안의 건축물 기준에 적합하지 아니한 건축물'),
    ('finish_material_violation', '법령 등에 적합하지 않은 마감재료를 사용한 건축물'),
    ('height_limit_violation', '높이 제한을 위반한 건축물'),
    ('sunlight_height_violation', '일조 등의 확보를 위한 높이 제한을 위반한 건축물'),
    ('building_equipment_violation', '건축설비의 설치·구조 기준과 설계 및 공사감리 기준을 위반한 건축물'),
    ('building_act_order_violation', '그 밖에 건축법 또는 건축법에 따른 명령이나 처분을 위반한 건축물'),
    ('other_violation_max_3', '그 밖에 건축법 또는 건축법에 따른 명령이나 처분을 위반한 건축물')
) as source(code, label)
where target.year = 2026
  and target.code = source.code;
