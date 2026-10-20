# /qna3d 실사 미니어처(디오라마) 위반건축물 — 이미지 생성 프롬프트 패키지

> 현재 `/qna3d` 3D 진단맵의 12개 위반유형을 코드 ground truth로 추출해, **실사에 가까운 미니어처/건축 모형(디오라마)** 이미지를 만들기 위한 프롬프트 모음.
> **주의**: 이 문서는 *별도 정적 이미지(히어로/OG/공유용)* 생성용이며, 현재 `/qna3d` 페이지를 교체·적용하는 것이 아니다. 미니어처 사람(인물)은 포함하지 않는다.

---

## 추천
이미지를 직접 렌더할 수 없으므로 **검증된 프롬프트를 외부 이미지 모델(Nano Banana / gpt-image-1 등)에 넣는 방식**이 최선이다. 나중에 별도로 쓸 때는 **실사 미니어처 이미지 위에 기존 01~12 핀(CSS2D)을 절대좌표로 오버레이**하면 "클릭 → 적발사유/양성화/조치" 인터랙션을 그대로 살릴 수 있다.

---

## ① 메인 장면 프롬프트 (영문)

```text
Ultra-realistic tilt-shift MINIATURE ARCHITECTURAL SCALE MODEL (1:50 detailed maquette / diorama) of ONE single Korean 3-story multi-family "dagagu" house (다가구주택), built and photographed as a meticulously crafted tabletop scale model (laser-cut acrylic, resin, 3D-printed parts, photo-etched metal) — a real building made to read as a precise tiny model, NOT a real street photo.

CAMERA & COMPOSITION: a clean 3/4 three-quarter HERO view from the FRONT-RIGHT and slightly above, camera looking down at roughly 30-35 degrees toward the front-northeast corner, ~42mm full-frame-equivalent lens with slight natural perspective convergence (NOT orthographic, NOT flat game-art, NOT isometric pixel look). Both the FRONT (north) facade and the RIGHT (east) side are clearly visible and the flat roof is fully readable from above. The whole building plus its lot sits centered on a small rectangular plinth, with generous empty negative space above the roof and around the base for later numbered map-pins.

TILT-SHIFT FOCUS: keep the ENTIRE building and ALL 12 violation elements tack-sharp and fully in focus; apply soft gradient blur ONLY to the seamless background sweep and the extreme front/back edges of the plinth base — strong miniature-scale illusion, shallow toy-world depth at the base only.

BUILDING (ground truth): rectangular footprint ~16m wide x 11m deep, three equal living floors at ~3.6m each (~14.4m total) plus a black concrete rooftop parapet (0.7m high). The GROUND FLOOR is a recessed PILOTI (inset overhang on 4 square columns for parking/pass-through) with a dark entrance DOOR on the LEFT (1.5m wide) and a transparent GLASS SHOPFRONT spanning ~4.6m at CENTER-RIGHT (blank empty signboard, no text). Floors 2-3 are standard residential with white aluminium sliding sash windows: FRONT facade 4 columns x 3 windows, RIGHT side 3 columns x 3 windows. Walls in mixed warm grey and brown ceramic tile + stone-paint stucco. Korean vernacular details: rooftop stainless water tank, a few wall-mounted outdoor AC condenser units with copper lines, yellow gas riser piping up the wall, light cable clutter, faint weathering streaks — lived-in realism.

PLACE ALL TWELVE common Korean illegal-modification (위반건축물) types on this ONE building, each at its exact floor/side, each visually DISTINCT with clear spacing so adjacent ones never merge. DO NOT bake any numbers, labels, tags or text into the image:
01 ROOFTOP ROOM — roof, right-of-center (east): a 2.6m-tall steel-clad container/prefab room box, ribbed metal cladding, small ladder and window, obvious added bulk from above.
02 ROOFTOP PERGOLA / FIXED AWNING — roof, left-of-center (west): a fixed welded pergola, 4 square posts carrying 6 parallel roof slats in a repeating louvered lattice.
03 STAIR-TOWER / WATER-TANK ROOM CONVERTED — roof, rear-LEFT (southwest corner), placed slightly inward and raised so it is NOT hidden behind the parapet or pergola: a square service turret (~2.6 x 3m, ~3m tall) with a door, small window and vent, lived in as a room.
04 ENCLOSED BALCONY — 3rd floor FRONT, right side (northeast): a 1.5m cantilevered concrete slab balcony fully sealed with full glazing + crisp white aluminium frame line (transparent glass look).
05 PANEL SIDE EXTENSION — 2nd floor RIGHT side (east): a 1.5m-deep cantilevered bolt-on box (~4.2m tall x 1.5m), BLACK light-steel frame + dark sandwich-panel cladding with under-side support brackets and a hard horizontal break line (opaque dark, contrasting with 04).
06 OVERSIZED CANOPY (over 1m) — 1st floor FRONT, left, above the entrance door: a flat horizontal canopy/overhang projecting ~1.4m on visible brackets, casting a clear shadow over the entry.
07 ADDED EXTERNAL STEEL STAIR — RIGHT (east) side, spanning ground-to-roof: an exposed black-steel zig-zag staircase, ~10 treads, two steel posts and a railing frame, ~7.5m tall, 1.6m wide (this is the ONLY external stair — do not duplicate).
08 ENCLOSED PILOTI — 1st floor FRONT, left bay: one piloti bay between two columns walled shut with OPAQUE concrete/panel infill + a small window (distinct from the glazed 04/05), killing the open parking/passage.
09 PARKING-SPACE STORAGE — front yard, LEFT of the building, OUTSIDE, on a painted parking stall: a container-style storage unit (~2.6 x 3m) with stacked crates occupying the legal parking space.
10 SHOP-TO-HOUSING CONVERSION — 1st floor FRONT, right (former glass shopfront, ~3m wide): converted to a studio dwelling read from OUTSIDE — an added small private residential door, a window-type AC unit, curtains/blinds behind the glass.
11 UNIT SUBDIVISION — 2nd floor FRONT, left: one unit split into three, shown via external proxies — a horizontal row of 3 utility-meter boxes (~0.4m apart) plus 3 separate small entry doors / mailboxes on the facade.
12 YARD / LANDSCAPING ENCROACHMENT — front yard, RIGHT of the building, OUTSIDE, on the ground: a roofed deck/shed (~2.8 x 2.2m) with a sheet-metal roof on posts, taking over the open landscaped/green public space.

SETTING: tiny diorama context — front (north) a small paved entry yard with parking-line markings and 1-2 stylised model trees on the left; a close neighbor wall on the LEFT (west); a narrow back alley with a low boundary wall at the REAR (south). Static props ONLY: 1-2 toy-scale compact cars on the parking lines, model trees, planters, AC condensers, the external steel stair.

LIGHTING: warm directional key "sun" from the upper right casting soft crisp miniature shadows; a soft cool blue fill/rim from back-left; gentle ambient occlusion in recesses; warm ACES-filmic tone; realistic HDRI reflections in glass and metal; soft contact shadow grounding the plinth. Clean, uncluttered, seamless warm-grey / off-white studio backdrop with a soft radial gradient and a soft vignette.

ABSOLUTELY NO PEOPLE — no human figures, no characters, no mannequins, no dolls, no silhouettes, no miniature people anywhere; building, structures and inanimate static props only.

STYLE: scale architectural model, miniature diorama, detailed maquette, tilt-shift photography, hyper-detailed PBR (matte concrete, brushed aluminium, glossy reflective glass, painted-steel sheen, satin model paint, tile grout, panel seams), ray-traced soft shadows, studio product-shot lighting, 8k, photoreal but unmistakably a tabletop model, clean balanced composition.
```

---

## ② 메인 장면 프롬프트 (한글)

```text
한국의 3층 다가구주택(다가구) 한 채를 1:50 정밀 건축 스케일 모형(디오라마/마케트)으로 제작해 탁상 위에서 촬영한 듯한 초실사 틸트시프트 미니어처. 레이저컷 아크릴·레진·3D프린트·포토에칭 금속의 실제 모형 제작 질감. 실제 건물을 '정밀한 작은 모형'으로 읽히게(거리 실사진 아님).

카메라·구도: 정면-우측에서 살짝 위로, 건물 북동쪽 모서리를 향해 약 30~35도 내려다보는 3/4 히어로 시점. 약 42mm 환산 렌즈로 자연스러운 원근 수렴(직교/평면 게임아트/아이소 픽셀룩 아님). 정면(북)과 우측면(동)이 함께 보이고 평지붕이 위에서 또렷이 읽힘. 건물+대지를 작은 직사각형 받침(플린스) 위 중앙에 배치하고, 옥상 위 하늘과 받침 주변에 번호 핀(01~12)을 얹을 넉넉한 여백 확보.

틸트시프트 초점: 건물 전체와 12개 위반 요소는 전부 선명하게 인포커스 유지. 블러는 '심리스 배경'과 '받침 앞뒤 가장자리'에만 적용 — 강한 미니어처 스케일 착시, 받침 바닥에만 얕은 심도.

건물(그라운드 트루스): 가로 약 16m x 깊이 11m, 층고 3.6m x 3층(약 14.4m), 옥상 검정 콘크리트 파라펫 0.7m. 1층은 인셋 필로티(사각 기둥 4본, 주차/통로 오버행), 좌측 출입문(폭 1.5m), 중앙~우측 투명 유리 점포(약 4.6m 스팬, 간판은 빈칸·글자 없음). 2·3층 표준 거주층, 흰색 알루미늄 미서기 새시 — 정면 4열x3개, 측면 3열x3개. 외벽은 회색·갈색 세라믹 타일 + 석재계 스타코 페인트 혼합. 한국 토속 디테일: 옥상 스테인리스 물탱크, 벽부 실외기 몇 대와 동관, 노란 가스배관 입상, 약간의 케이블·빗물 얼룩으로 생활감.

이 한 건물에 대표 위반 12종을 각자의 정확한 층/면에 배치, 서로 뚜렷한 간격으로 병합 없이 시각적으로 구분. 이미지에 숫자·라벨·태그·텍스트는 절대 굽지 말 것:
01 옥탑방 — 옥상 우측 중앙(동): 높이 2.6m 컨테이너/조립식 철판 박스, 골판 외장, 작은 사다리·창, 부감에서 부피감 뚜렷.
02 파고라·고정차양 — 옥상 좌측 중앙(서): 기둥 4본 + 슬랫 6줄의 용접 고정 격자 파고라.
03 계단탑·물탱크실 전용 — 옥상 후면 좌측(서남), 파라펫·파고라에 가리지 않게 살짝 안쪽·상향 배치: 정사각 우탑(약 2.6x3m, 높이 3m), 문·작은 창·통풍구, 방으로 사용.
04 발코니 확장 — 3층 정면 우측(북동): 1.5m 돌출 콘크리트 슬래브를 '투명 유리 + 또렷한 흰 알루미늄 프레임'으로 완전 폐쇄.
05 패널 측면확장 — 2층 우측면(동): 측벽에서 1.5m 돌출한 볼트온 박스(약 4.2m x 1.5m), '검정 경량철골 + 어두운 샌드위치 패널' 불투명, 하부 브래킷·수평 파단선(04와 대비).
06 캐노피 1m 초과 — 1층 정면 좌측 출입문 위: 1.4m 수평 오버행, 노출 브래킷, 진입부 그림자.
07 외부 철골계단 증설 — 우측면(동) 지상~옥상: 검정 철골 지그재그 계단, 약 10단, 기둥 2본·난간, 높이 7.5m·폭 1.6m(계단은 이것 하나만, 중복 금지).
08 필로티 실내화 — 1층 정면 좌측 베이: 기둥 사이를 '불투명 콘크리트/판넬 인필 + 작은 창'으로 폐쇄(04·05의 유리와 구분), 주차/통로 개방성 상실.
09 주차장 창고 전용 — 건물 정면 좌측 마당(외부, 주차선 위): 컨테이너형 창고(약 2.6x3m)와 적재박스가 법정 주차구획 점유.
10 근생→주거 용도변경 — 1층 정면 우측(기존 유리점포, 폭 약 3m): 외부에서 읽히는 주거전환 — 별도 소형 주거현관, 창문형 에어컨, 유리 너머 커튼/블라인드.
11 세대 쪼개기 — 2층 정면 좌측: 외부 프록시로 표현 — 계량기 박스 3개 수평 배열(약 0.4m 간격) + 독립 현관/우편함 3개.
12 마당·조경 잠식 — 건물 정면 우측 마당(외부, 지면): 판금 지붕+기둥의 지붕 있는 평상/창고(약 2.8x2.2m)가 조경·공개공지 점유.

배경: 작은 디오라마 맥락 — 정면(북) 포장 마당에 주차선과 좌측 모형 나무 1~2그루, 좌측(서) 인접 건물 벽 근접, 후면(남) 좁은 골목·낮은 담장. 정적 소품만: 토이 스케일 소형차 1~2대, 나무, 화분, 실외기, 외부계단.

조명: 우측 상단 따뜻한 키('태양')가 선명·부드러운 미니어처 그림자, 후면 좌측 차가운 푸른 보조/림, 오목부 AO, 따뜻한 ACES 필름 톤, 유리·금속 사실적 HDRI 반사, 받침의 부드러운 접지 그림자. 깔끔한 웜그레이/오프화이트 심리스 스튜디오 배경에 옅은 방사형 그라데이션·소프트 비네팅.

사람 절대 금지 — 인물·캐릭터·마네킹·인형·실루엣·미니어처 사람 일절 없음. 건물·구조물·무생물 소품만.

스타일: 건축 스케일 모형, 미니어처 디오라마, 마케트, 틸트시프트 사진, 초정밀 PBR(무광 콘크리트·브러시드 알루미늄·광택 반사 유리·도장 철판 광택·새틴 모형도료·타일 줄눈·패널 이음새), 레이트레이스 소프트섀도, 스튜디오 제품 조명, 8k, 사진 같지만 분명한 탁상 모형, 균형 잡힌 깔끔한 구도.
```

---

## ③ 네거티브 프롬프트

```text
people, human, person, persons, man, woman, child, kid, pedestrian, crowd, figure, figures, figurine, mannequin, doll, character, cartoon character, silhouette, hands, face, body, miniature people,
low-poly, lowpoly, voxel, Lego, blocky geometry, untextured, flat shading, clay render, plasticine, cel-shaded, toon, anime, manga, comic, illustration, painting, drawing, sketch, line art, 2D, vector, flat icon, cheap toy plastic sheen, video-game render,
blurry building, out-of-focus subject, soft focus everywhere, excessive miniature blur covering the building, motion blur, smeared, heavy noise, grain, jpeg artifacts, low resolution, oversharpen,
oversaturated, neon, HDR halos, lens flare overload, blown highlights, overexposed, underexposed, muddy crushed shadows,
warped geometry, distorted perspective, melting walls, bent columns, crooked or wavy windows, skewed verticals, asymmetric structural collapse, floating disconnected objects, duplicated building, extra buildings, extra floors, missing floors, missing parapet, merged or overlapping violations, duplicated AC units, duplicated staircase,
isometric flat game art, orthographic, fisheye, extreme wide angle, lens distortion, tilted horizon,
text, lettering, numbers, baked-on numbers, placard text, signboard text, gibberish text, garbled labels, misspelled signage, watermark, signature, logo, brand logo, UI overlay, frame, border, caption bar,
full-scale real street photograph, real city street, aerial drone real photo, real people, real sky, clouds, weather,
japanese architecture, chinese architecture, western suburban house, shingle gable roof, scaffolding, construction crane, for-sale banner
```

---

## ④ 위반별 디테일 클로즈업 프롬프트 12개 (개별 컷 필요 시)

각 컷은 메인과 동일한 미니어처 모형 룩·조명·"NO people"을 전제로, 해당 위반만 클로즈업.

```text
01 ROOFTOP ROOM — Tilt-shift macro close-up of a 1:50 scale-model flat rooftop with a black concrete parapet; on the right-of-center sits a 2.6m steel-clad container/prefab room box with ribbed metal cladding, a tiny roof ladder and a small window, obvious added bulk; photoreal PBR, studio light, no people.

02 ROOFTOP PERGOLA — Miniature-model macro of a rooftop fixed welded pergola, four square posts carrying six parallel roof slats forming a clean repeating louvered lattice casting striped shadows; resin/photo-etched metal model detail, photoreal, no people.

03 STAIR-TOWER ROOM — Scale-model close-up of a square rooftop service turret (~2.6 x 3m, ~3m tall) at the rear-left corner, with a small door, window and vent, clearly lived in as a room; placed inward so the parapet does not hide it; PBR miniature, no people.

04 ENCLOSED BALCONY — Tilt-shift detail of a 3rd-floor front balcony: a 1.5m cantilevered concrete slab fully sealed with transparent glazing inside crisp white aluminium sash frames, exposed slab edge line, no refuge gap; photoreal model, no people.

05 PANEL SIDE EXTENSION — Miniature-model macro of a 2nd-floor side wall with a 1.5m-deep cantilevered bolt-on box (~4.2m tall) in black light-steel frame + dark opaque sandwich panel cladding, visible under-side support brackets and a hard horizontal break line; PBR, no people.

06 OVERSIZED CANOPY — Scale-model close-up of a 1st-floor entrance door topped by a flat 1.4m horizontal canopy on visible steel brackets, casting a clear shadow over the doorway, clearly past 1m; photoreal miniature, no people.

07 EXTERNAL STEEL STAIR — Tilt-shift macro of an added black-steel zig-zag external staircase on the building's right side, ~10 treads, two steel posts, railing frame, ~7.5m tall x 1.6m wide, surface-mounted; weathered painted-steel PBR, no people.

08 ENCLOSED PILOTI — Miniature-model detail of a ground-floor piloti bay walled shut between two round columns with opaque concrete/panel infill and one small window, the open parking/passage lost; photoreal scale model, no people.

09 PARKING-SPACE STORAGE — Scale-model close-up of a painted parking stall in the front yard occupied by a container-style storage unit (~2.6 x 3m) with stacked crates and clutter; tilt-shift miniature, PBR, no people.

10 SHOP-TO-HOUSING — Tilt-shift macro of a former glass shopfront (~3m) converted into a studio dwelling, read from outside: an added small private residential door, a window-type AC unit, curtains behind the glass; photoreal model, no people.

11 UNIT SUBDIVISION — Miniature-model detail of a 2nd-floor front facade showing a horizontal row of three utility-meter boxes (~0.4m apart) and three separate small entry doors/mailboxes indicating one unit split into three; PBR, no people.

12 YARD ENCROACHMENT — Scale-model close-up of a front-yard roofed deck/shed (~2.8 x 2.2m) with a sheet-metal roof on posts standing on landscaped/open public green space; tilt-shift miniature, photoreal, no people.
```

---

## ⑤ 추천 모델·비율·세팅

- **1순위 — Google Nano Banana (Gemini Flash/Pro Image)**: 12개 항목의 긴 배치 지시 준수가 강하고, 누락된 위반만 "add 03 on rear-left roof" 식 **반복 편집**으로 보강 가능. 실사 PBR도 우수.
- **대안**
  - **gpt-image-1 (OpenAI)**: 긴 위치 지시·구조 일관성 최상급. 오배치 시 사용.
  - **Flux 1.1 Pro (Ultra)**: 레진/유리/철골 PBR 질감·반사가 제품렌더에 근접. 배치 확정 후 **텍스처/업스케일 뷰티 패스**.
  - **Midjourney v7 (`--style raw --ar 4:3`)**: 틸트시프트 미감 최고, 단 다요소 배치·텍스트는 약함 → 최종 미감 패스 전용.
- **비율**: **4:3 (1536×1152)** 권장 — 옥상(01~03)+마당(09·12)+3개층+동측면(05·07)을 한 프레임에. 대안 3:2(1536×1024).
- **세팅·팁**
  - **숫자/라벨은 절대 굽지 말 것** — 텍스트 렌더가 가장 잘 깨지고 오버레이 핀과 충돌. 번호는 후처리(SVG/CSS2D).
  - **시드 고정** 후 같은 시드로 "번호 없는 클린 플레이트"와 "참고용" 2종.
  - **과밀부 분할 생성**: 정면-좌측(06·08·09·11), 우측면(04·05·07·10·12) 밀집부는 누락·병합 잦으니 zone별(roof / front-facade / east-side / yard) 분할 생성 후 인페인트 합성.
  - **유사 박스 강제 구분**: 04=투명유리, 05=검정 불투명 패널, 08=불투명 콘크리트 인필 — 재질 대비를 프롬프트로 못박아 병합 방지.
  - **생성 후 QA**: 아래 ⑦ 체크표로 01~12 전수 검수. 빠진 항목은 재프롬프트로 추가.

---

## ⑥ (별도 활용 시) 인터랙티브 유지 통합 가이드

> 전제: 지금 `/qna3d` 페이지에는 적용하지 않음. 아래는 이 별도 이미지를 나중에 쓸 때의 선택지.

### (a) 실사 이미지 + 절대좌표 핀 오버레이
정적 실사 미니어처 이미지를 깔고, 그 위에 기존 `.pin`(CSS2D) 12개를 화면 좌표로 절대배치.
- **장점**: 실사 미감 그대로 히어로/OG 활용. 기존 클릭→패널 로직 재사용. 가벼움.
- **단점**: 회전·줌·핀별 flyTo 사라짐(정적). 생성 이미지마다 12핀 위치가 달라 **좌표 수동 캘리브레이션** 필요.
- **권장 구현**: 출력 종횡비(4:3) 고정 + `object-fit: contain` 락. 핀 좌표는 **이미지 기준 정규화(%)**로 저장. orbit 잠금. 가이드 CTA는 DOM 버튼/배지로 재부착.

### (b) 실사 텍스처/베이크를 three.js 모형에 입히는 절충안
AI 실사 렌더를 **재질/매트캡/디테일 참고**로 쓰고, 기존 절차적 모형 머티리얼을 업그레이드.
- **장점**: OrbitControls 회전·줌·flyTo·존 필터 등 라이브 인터랙션 100% 보존. 핀이 3D 앵커에 묶여 좌표 드리프트 없음.
- **단점**: AI 한 장을 그대로 못 씀(텍스처 추출·UV 작업 필요). 틸트시프트·조명감은 부분 재현.
- **권장 분담**: 본문 인터랙션 영역은 (b)로 품질만↑, **히어로/OG/SNS 공유 컷은 (a) 정적 실사 이미지**.

> 좌표 정합 팁(공통): 렌더 카메라를 실제 HOME 파라미터(**FOV 42, pos 20.5/15.5/25.5, tgt 0/5.6/0**)와 동일 종횡비로 맞추면 정적 이미지와 라이브 핀의 픽셀 정합이 쉬움.

---

## ⑦ 12개 위반 커버리지 체크표

| No | 위반 | 구역 | 층/위치 | 면(방위) | 메인 반영 |
|----|------|------|---------|----------|:--:|
| 01 | 옥탑방·옥상 구조물 | roof | 옥상(14.4m) | 우측 중앙(동) | ✓ |
| 02 | 파고라·고정 차양 | roof | 옥상(13.4m) | 좌측 중앙(서) | ✓ |
| 03 | 계단탑·물탱크실 전용 | roof | 옥상(14.4m) | 좌측 후면(서남) | ✓ |
| 04 | 발코니·베란다 확장 | facade | 3층 정면(9m) | 정면 우측(북동) | ✓ |
| 05 | 샷시·패널 외부 확장 | facade | 2층 우측면(5.4m) | 우측 측면(동) | ✓ |
| 06 | 처마·캐노피 1m 이상 | facade | 1층 정면(3.8m) | 정면 좌측(북서) | ✓ |
| 07 | 외부 철골계단 증설 | facade | 1~2층 우측면 | 우측 측면(동) | ✓ |
| 08 | 필로티 실내화 | ground | 1층 정면(1.8m) | 정면 좌측(북서) | ✓ |
| 09 | 주차장 창고·점포 전용 | ground | 대지 정면(1.6m) | 정면 좌측(북서, 외부) | ✓ |
| 10 | 근생→주거 용도변경 | ground | 1층 정면(2.2m) | 정면 우측(북동) | ✓ |
| 11 | 세대 쪼개기 | site | 2층 정면(5.4m) | 정면 좌측(북서) | ✓ |
| 12 | 마당·조경 잠식 | site | 대지 정면(1.9m) | 정면 우측(북동, 외부) | ✓ |

**12/12 전부 메인 프롬프트(①②)에 명시 반영됨.**
생성 결과에서 **03(후면 가림)·10·11(미세/내부형)**은 누락·판독불가 위험이 가장 크니 우선 검수하고, 필요 시 zone 분할 생성+인페인트 또는 핀 라벨로 보강할 것.

---

## ⑧ ChatGPT(gpt-image-1) 전용 — 한 번에 붙여넣기용 (네거티브 합본 + 가로 출력)

> **비율 주의**: gpt-image-1은 4:3을 native로 못 만든다. 지원: **정사각 1024×1024 / 가로 1536×1024(3:2) / 세로 1024×1536(2:3)**. 비율 미지정 시 1:1로 떨어지므로, 아래 프롬프트에 출력 비율 지시를 박아뒀고, 채팅에 **"가로 와이드(3:2)로 만들어줘"**도 같이 적으면 확실하다.
> 네거티브 입력칸이 없으므로 금지 항목을 본문 끝 `STRICTLY DO NOT INCLUDE`에 합쳤다. 아래 블록 전체를 그대로 복붙.

```text
OUTPUT FORMAT: render as a WIDE LANDSCAPE image, 3:2 aspect ratio (1536 x 1024). Do NOT make it square 1:1.

Ultra-realistic tilt-shift MINIATURE ARCHITECTURAL SCALE MODEL (1:50 detailed maquette / diorama) of ONE single Korean 3-story multi-family "dagagu" house (다가구주택), built and photographed as a meticulously crafted tabletop scale model (laser-cut acrylic, resin, 3D-printed parts, photo-etched metal) — a real building made to read as a precise tiny model, NOT a real street photo.

CAMERA & COMPOSITION: a clean 3/4 three-quarter HERO view from the FRONT-RIGHT and slightly above, camera looking down at roughly 30-35 degrees toward the front-northeast corner, ~42mm full-frame-equivalent lens with slight natural perspective convergence (NOT orthographic, NOT flat game-art, NOT isometric pixel look). Both the FRONT (north) facade and the RIGHT (east) side are clearly visible and the flat roof is fully readable from above. The whole building plus its lot sits centered on a small rectangular plinth, with generous empty negative space above the roof and around the base for later numbered map-pins.

TILT-SHIFT FOCUS: keep the ENTIRE building and ALL 12 violation elements tack-sharp and fully in focus; apply soft gradient blur ONLY to the seamless background sweep and the extreme front/back edges of the plinth base — strong miniature-scale illusion, shallow toy-world depth at the base only.

BUILDING: rectangular footprint ~16m wide x 11m deep, three equal living floors at ~3.6m each (~14.4m total) plus a black concrete rooftop parapet (0.7m high). The GROUND FLOOR is a recessed PILOTI (inset overhang on 4 square columns for parking/pass-through) with a dark entrance DOOR on the LEFT (1.5m wide) and a transparent GLASS SHOPFRONT spanning ~4.6m at CENTER-RIGHT (blank empty signboard, no text). Floors 2-3 are standard residential with white aluminium sliding sash windows: FRONT facade 4 columns x 3 windows, RIGHT side 3 columns x 3 windows. Walls in mixed warm grey and brown ceramic tile + stone-paint stucco. Korean vernacular details: rooftop stainless water tank, a few wall-mounted outdoor AC condenser units with copper lines, yellow gas riser piping up the wall, light cable clutter, faint weathering streaks — lived-in realism.

PLACE ALL TWELVE common Korean illegal-modification types on this ONE building, each at its exact floor/side, each visually DISTINCT with clear spacing so adjacent ones never merge:
01 ROOFTOP ROOM — roof, right-of-center (east): a 2.6m-tall steel-clad container/prefab room box, ribbed metal cladding, small ladder and window, obvious added bulk from above.
02 ROOFTOP PERGOLA / FIXED AWNING — roof, left-of-center (west): a fixed welded pergola, 4 square posts carrying 6 parallel roof slats in a repeating louvered lattice.
03 STAIR-TOWER / WATER-TANK ROOM CONVERTED — roof, rear-LEFT (southwest corner), placed slightly inward and raised so it is NOT hidden behind the parapet or pergola: a square service turret (~2.6 x 3m, ~3m tall) with a door, small window and vent, lived in as a room.
04 ENCLOSED BALCONY — 3rd floor FRONT, right side (northeast): a 1.5m cantilevered concrete slab balcony fully sealed with full glazing + crisp white aluminium frame line (transparent glass look).
05 PANEL SIDE EXTENSION — 2nd floor RIGHT side (east): a 1.5m-deep cantilevered bolt-on box (~4.2m tall x 1.5m), BLACK light-steel frame + dark sandwich-panel cladding with under-side support brackets and a hard horizontal break line (opaque dark, contrasting with 04).
06 OVERSIZED CANOPY (over 1m) — 1st floor FRONT, left, above the entrance door: a flat horizontal canopy/overhang projecting ~1.4m on visible brackets, casting a clear shadow over the entry.
07 ADDED EXTERNAL STEEL STAIR — RIGHT (east) side, spanning ground-to-roof: an exposed black-steel zig-zag staircase, ~10 treads, two steel posts and a railing frame, ~7.5m tall, 1.6m wide (this is the ONLY external stair — do not duplicate).
08 ENCLOSED PILOTI — 1st floor FRONT, left bay: one piloti bay between two columns walled shut with OPAQUE concrete/panel infill + a small window (distinct from the glazed 04/05), killing the open parking/passage.
09 PARKING-SPACE STORAGE — front yard, LEFT of the building, OUTSIDE, on a painted parking stall: a container-style storage unit (~2.6 x 3m) with stacked crates occupying the legal parking space.
10 SHOP-TO-HOUSING CONVERSION — 1st floor FRONT, right (former glass shopfront, ~3m wide): converted to a studio dwelling read from OUTSIDE — an added small private residential door, a window-type AC unit, curtains/blinds behind the glass.
11 UNIT SUBDIVISION — 2nd floor FRONT, left: one unit split into three, shown via external proxies — a horizontal row of 3 utility-meter boxes (~0.4m apart) plus 3 separate small entry doors / mailboxes on the facade.
12 YARD / LANDSCAPING ENCROACHMENT — front yard, RIGHT of the building, OUTSIDE, on the ground: a roofed deck/shed (~2.8 x 2.2m) with a sheet-metal roof on posts, taking over the open landscaped/green public space.

SETTING: tiny diorama context — front (north) a small paved entry yard with parking-line markings and 1-2 stylised model trees on the left; a close neighbor wall on the LEFT (west); a narrow back alley with a low boundary wall at the REAR (south). Static props ONLY: 1-2 toy-scale compact cars on the parking lines, model trees, planters, AC condensers, the external steel stair.

LIGHTING: warm directional key "sun" from the upper right casting soft crisp miniature shadows; a soft cool blue fill/rim from back-left; gentle ambient occlusion in recesses; warm ACES-filmic tone; realistic HDRI reflections in glass and metal; soft contact shadow grounding the plinth. Clean, uncluttered, seamless warm-grey / off-white studio backdrop with a soft radial gradient and a soft vignette.

STYLE: scale architectural model, miniature diorama, detailed maquette, tilt-shift photography, hyper-detailed PBR (matte concrete, brushed aluminium, glossy reflective glass, painted-steel sheen, satin model paint, tile grout, panel seams), ray-traced soft shadows, studio product-shot lighting, 8k, photoreal but unmistakably a tabletop model, clean balanced composition.

STRICTLY DO NOT INCLUDE (negatives): any people / humans / persons / children / pedestrians / crowds / figures / figurines / mannequins / dolls / silhouettes / miniature people; any text, lettering, numbers, baked-on numbers, signboard text, labels, captions, watermark, logo, UI overlay, frame, border; low-poly / voxel / Lego / blocky / untextured / clay / cartoon / anime / illustration / 2D / flat icon / cheap-plastic-toy / video-game look; blurry or out-of-focus building, heavy noise, oversaturation, blown highlights; warped or distorted geometry, melting walls, bent columns, crooked windows, duplicated building, extra/missing floors, missing parapet, merged or overlapping violations, duplicated staircase; isometric flat game art, orthographic, fisheye, lens distortion, tilted horizon; full-scale real street photograph, real city street, drone photo, real sky/clouds; japanese or chinese or western suburban architecture, gable shingle roof, scaffolding, construction crane, for-sale banner.
```

**사용 팁 (GPT Pro · 무제한이니 적극 반복)**
1. 위 블록 붙여넣고, 채팅에 한 줄 더: **"가로 와이드(3:2, 1536×1024)로 만들어줘. 글자·숫자·사람은 절대 넣지 마."**
2. 나온 이미지에서 빠진 것만 후속 채팅으로 편집:
   - `"옥상 좌측 뒤쪽(남서)에 03 계단탑/물탱크실 방을 추가해줘 (파라펫에 가리지 않게)."`
   - `"1층 정면 우측 유리점포를 원룸 주거로 바꿔줘 — 작은 주거 현관 + 창문형 에어컨 + 커튼 (10번)."`
   - `"2층 정면 좌측에 계량기 박스 3개와 작은 현관문 3개를 나란히 넣어줘 (11번 세대 쪼개기)."`
3. 한 컷에 12개가 다 안 잡히면, **존별로 나눠서** 생성하고(예: "옥상만", "우측면만") 마음에 드는 컷을 골라 합성/참고.
4. 번호 핀(01~12)은 이미지에 굽지 말고, 마음에 드는 클린 이미지가 나오면 나중에 핀 오버레이로 얹는다.

---

## ⑨ 구도 수정 — "건물 아래쪽이 잘림" 보정 (같은 채팅에 이어서 붙여넣기)

> 증상: 각도/구도는 `/qna3d` 시점초기화와 동일하게 잘 나왔지만, 그 구도라 **건물 하단(1층 필로티·현관·마당·받침)이 프레임에서 잘림**. (= /qna3d에서 휠로 확대했을 때 아래가 잘리는 것과 같은 현상)
> 해결: **각도는 유지하고 카메라만 뒤로 빼서(줌아웃)** 건물 전체가 사방 여백을 두고 들어오게.

```text
Same building, same miniature scale-model look, same 3/4 front-right slightly-elevated hero angle — DO NOT change the camera angle or the style.

FIX THE FRAMING ONLY: the bottom of the building is currently cropped. ZOOM OUT and pull the camera further back so the ENTIRE building fits fully inside the frame, from the rooftop structures (01 rooftop room, 02 pergola, 03 stair-tower) all the way DOWN to the ground floor (piloti, entrance door, shopfront) and the front-yard ground items (09 parking-space storage, 12 yard shed). Make the building smaller within the frame.

Leave clear empty padding/margin on ALL sides: generous space above the roof AND below the building base / plinth, plus space left and right. Nothing must touch or be cut off by the image edges — the whole model sits comfortably centered with breathing room, on its rectangular plinth, against the seamless studio backdrop.

Keep wide LANDSCAPE 3:2 aspect ratio (1536 x 1024). No people, no text, no numbers.
```

**짧은 한국어 버전(이걸로 더 간단히 시켜도 됨):**
> "각도·스타일은 그대로 두고, 카메라만 더 뒤로 빼서(줌아웃) 건물 전체가 위아래·좌우 여백을 두고 프레임 안에 다 들어오게 다시 만들어줘. 지금은 건물 1층·마당 쪽 아래가 잘렸어. 가로 3:2 유지, 글자·사람 없이."

**처음부터 다시 만들 때**는 ⑧ 메인 프롬프트의 `CAMERA & COMPOSITION` 끝에 이 한 줄을 추가하면 예방됨:
> `Frame the FULL building with comfortable margins on all sides — the entire structure from rooftop down to the ground floor and front yard must be fully visible, never cropped at the bottom or edges; leave empty padding below the plinth and above the roof.`

---

## ⑨ 적법 모습(위반 12개 제거) 편집 프롬프트 — /qna3d-photo 적법 토글용

> **사용법**: 이미지 편집 모델(Nano Banana/Gemini 이미지 편집, gpt-image edit 등)에 **기존 원본 `public/3d.png`(1536×1024)를 첨부**하고 아래 프롬프트로 편집시킨다. 텍스트→이미지로 새로 생성하면 건물이 달라져 크로스페이드가 깨지므로 반드시 편집 모드.
> 결과물은 `/Users/kbsc/rex/public/3d-legal.png`로 저장 → 에이전트가 업스케일·WebP 변환·토글 연결을 처리한다.

```text
Use the ATTACHED image as the exact base. It is a photoreal tilt-shift miniature diorama of a Korean 3-story multi-family house that currently shows 12 illegal building modifications. TASK: produce the LEGAL "original" version of this exact same model — remove every illegal addition and restore what was originally there. Everything else must stay IDENTICAL to the attached image: same camera angle and crop, same lens, same lighting and shadows, same materials and weathering, same plinth/base, same seamless studio background, same trees, same parked car, same parking-line markings. Preserve the photoreal miniature scale-model look. No people, no text, no labels, no numbers.

REMOVE / RESTORE all 12:
1. Rooftop right: remove the corrugated steel container/prefab room — restore clean flat roof surface with matching texture.
2. Rooftop left: remove the slatted pergola completely.
3. Rooftop rear-left: turn the converted stair/water-tank room into a plain windowless service bulkhead (keep the stainless water tank).
4. 3rd floor front-right: remove the fully-glazed enclosed balcony — restore an open facade with normal windows matching the others.
5. Side wall: remove the dark bolt-on sandwich-panel extension box — restore the flat wall behind it.
6. Entrance: remove the oversized canopy/awning above the door.
7. Side: remove the external black steel zig-zag staircase entirely — restore the wall it covers.
8. Ground-floor piloti: remove the infill wall closing the piloti bay — restore the open dark parking/passage void between the columns.
9. Front yard left: remove the storage container and stacked crates — restore an empty painted parking stall.
10. Ground-floor shopfront: remove all signs of residential conversion (curtains/blinds behind the glass, window AC unit, added private door) — restore a clean transparent glass storefront.
11. Facade: reduce the row of 3 utility meter boxes to a single meter box; remove any extra mailboxes/doors from unit-splitting.
12. Front yard right: remove the roofed deck/shed — restore open landscaped green space (low shrubs/planting).

Output: same landscape 3:2 aspect ratio and framing as the attached image, maximum resolution. The result must look like the same physical model photographed in the same session, just before the illegal additions were built.
```

**짧은 한국어 버전:**
> "첨부한 미니어처 디오라마 사진에서, 카메라·조명·건물·배경은 전부 그대로 두고 위반 구조물 12개만 걷어낸 '원래 적법한 모습'으로 편집해줘: 옥탑 컨테이너 제거, 파고라 제거, 계단탑은 창문 없는 설비실로, 3층 유리 발코니는 일반 창으로, 측면 판넬 박스 제거, 현관 캐노피 제거, 외부 철제계단 제거, 필로티 막은 벽 제거(주차 공간 개방), 마당 컨테이너 제거(빈 주차구획), 1층 점포는 커튼·에어컨 없는 깨끗한 유리 상가로, 계량기 3개→1개, 마당 데크 제거(조경 복원). 3:2 비율·구도 유지, 사람·글자 없이."

---

## ⑩ 내부 실사 컷 2장 (10 근생→주거 · 11 세대쪼개기) — /qna3d-photo 내부 보기용

> **사용법**: 메인 디오라마와 룩을 맞추기 위해 원본 `public/3d.png`를 **스타일 참고로 첨부**하고 아래 프롬프트로 생성(신규 장면 생성이라 편집 모드 불필요, 첨부는 룩 일치용).
> 저장: 10번 → `/Users/kbsc/rex/public/interior-10.png`, 11번 → `/Users/kbsc/rex/public/interior-11.png` → 에이전트가 업스케일·WebP·연결 처리.

**10번 — 근생(점포)→주거 전용 내부:**
```text
Photoreal 1:50 miniature architectural model diorama, DOLLHOUSE CUTAWAY interior view: a small Korean ground-floor SHOP unit (근린생활시설) secretly used as a home. Front glass wall removed, viewed straight-on and slightly from above. Inside the single shop space: a single bed with rumpled bedding against the wall, a small wardrobe, a curtain half-covering the shop window, a compact kitchenette (tiny sink, single burner, mini fridge), a cramped enclosed toilet cubicle in the back corner, a window-type AC unit; leftover SHOP remnants still present — an abandoned sales counter and an empty display shelf — clearly telling the story "a store being lived in". Same miniature model aesthetic as the attached reference: matte model materials, tilt-shift, warm studio lighting, soft shadows, hyper-detailed. NO people, NO text or labels, landscape 3:2, high resolution.
```

**11번 — 세대쪼개기 내부:**
```text
Photoreal 1:50 miniature architectural model diorama, DOLLHOUSE CUTAWAY interior view: one floor of a Korean multi-family house where a single spacious unit has been ILLEGALLY SUBDIVIDED into three tiny rooms for rent. Front wall removed, viewed straight-on and slightly from above. Two thin, cheap newly-built partition walls (visibly different material from the original structure) split the unit into three narrow slivers; EACH sliver crammed with: a single bed, a mini kitchenette block, and its own flimsy door; a row of three separate electricity meters on the corridor wall. Cramped, repetitive, clearly telling the story "one home split into three". Same miniature model aesthetic as the attached reference: matte model materials, tilt-shift, warm studio lighting, soft shadows, hyper-detailed. NO people, NO text or labels, landscape 3:2, high resolution.
```

**짧은 한국어 버전:**
> (10번) "첨부 사진과 같은 미니어처 모형 스타일로: 한국 1층 상가(근생) 한 칸을 몰래 집으로 쓰는 내부를 돌하우스 단면으로 — 침대·옷장·유리창의 커튼·미니 주방·구석 간이 화장실·창문형 에어컨, 그리고 버려진 계산대와 빈 진열대가 남아 '가게에 사람이 산다'는 게 읽히게. 사람·글자 없이, 가로 3:2."
> (11번) "첨부 사진과 같은 미니어처 모형 스타일로: 한 세대를 싸구려 경계벽 2장으로 세 칸으로 쪼갠 내부를 돌하우스 단면으로 — 칸마다 침대·미니주방·문 하나씩, 복도 벽에 계량기 3개, 비좁고 반복적인 느낌. 사람·글자 없이, 가로 3:2."
