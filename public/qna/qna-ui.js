/* =====================================================================
   양성화.com — 3D 위반건축물 진단 · Q&A
   Architecture:
   - DATA: VIOLATIONS (building hotspots) + QNA (answers) + TYPES (4 groups)
   - BUILD: a CSS 3D (preserve-3d) layered building. Hotspots are real DOM
     buttons living ON the building faces, so they track rotation for free
     and stay keyboard-accessible (no per-frame projection).
   - INTERACT: rotate/explode/marker toggles, select->docked panel (desktop)
     / bottom-sheet (mobile) with connected Q&A, zone filtering, full Q&A
     archive, 3-step self-diagnosis, consult form.
   ===================================================================== */
(function(){
  "use strict";
  const $ = (s,c)=> (c||document).querySelector(s);
  const $$ = (s,c)=> [...(c||document).querySelectorAll(s)];
  const mm = (q)=> (window.matchMedia ? window.matchMedia(q) : {matches:false});
  const reduced = mm('(prefers-reduced-motion: reduce)').matches;

  /* ----------------------------- DATA ----------------------------- */
  // zone: roof | facade | ground | site   (matches chips)
  // floor: highlight wrapper key (SITE/1F/2F/3F/RF)
  const VIOLATIONS = [
    {id:'roof-room', no:'01', zone:'roof',   floor:'RF', cat:'red',   title:'옥탑방·옥상 구조물', tags:['증축','허가','옥상'],
      short:'옥상에 지붕·벽이 있는 방·창고를 올린 경우.', floorLabel:'옥상',
      example:'3층 옥상에 컨테이너·조립식으로 방 하나를 만들어 주거·창고로 사용 — 바닥면적·층수·높이가 늘어 무단 증축으로 보기 쉬움.', qa:[1,13,14]},
    {id:'roof-pergola', no:'02', zone:'roof', floor:'RF', cat:'amber', title:'파고라·고정 차양', tags:['증축','옥상'],
      short:'옥상에 지붕 역할을 하는 고정 구조물을 설치.', floorLabel:'옥상',
      example:'옥상에 기둥+지붕의 파고라를 고정 설치해 사실상 실내처럼 사용 — 분리 가능한 일시 시설인지, 고정 구조인지가 갈림길.', qa:[2,13]},
    {id:'roof-service', no:'03', zone:'roof', floor:'RF', cat:'red', title:'계단탑·물탱크실 전용', tags:['용도변경','옥상'],
      short:'설비·피난용 부속실을 주거로 사용.', floorLabel:'옥상',
      example:'옥상 계단탑·물탱크실에 싱크대·침대를 놓고 방으로 사용 — 용도·면적·높이 문제와 무단 증축이 함께 발생.', qa:[3,13]},

    {id:'balcony', no:'04', zone:'facade', floor:'3F', cat:'red', title:'발코니·베란다 확장', tags:['증축','구조','피난'],
      short:'대피공간·방화 기준 없이 발코니를 확장.', floorLabel:'3F',
      example:'3층 발코니를 새시로 막아 거실로 확장 — 면적뿐 아니라 대피공간·방화문 훼손이면 안전 문제로 본다.', qa:[4,15]},
    {id:'panel', no:'05', zone:'facade', floor:'2F', cat:'red', title:'샷시·패널 외부 확장', tags:['증축','허가'],
      short:'벽·기둥·지붕 역할 구조로 외부를 둘러 면적 증가.', floorLabel:'2F',
      example:'뒷벽·측면을 경량철골+패널로 둘러 방·주방을 넓힘 — 바닥면적이 늘면 증축, 캐노피·처마와는 구분 필요.', qa:[5,13]},
    {id:'canopy', no:'06', zone:'facade', floor:'1F', cat:'amber', title:'처마·캐노피 1m 이상', tags:['증축','건폐율'],
      short:'1m를 넘는 차양·처마는 건축면적에 산입.', floorLabel:'1F',
      example:'점포·현관 앞에 1m 넘는 캐노피를 설치 — 건축면적에 들어가 건폐율 초과로 이어질 수 있다.', qa:[6]},
    {id:'stair', no:'07', zone:'facade', floor:'3F', cat:'amber', title:'외부 철골계단 증설', tags:['구조','증축'],
      short:'세대·피난용 외부계단을 새로 증설.', floorLabel:'3F',
      example:'옥상·세대 출입을 위해 측면에 철골계단을 증설 — 증축·대수선 또는 세대수 증가와 연결될 수 있다.', qa:[7,13]},

    {id:'piloti', no:'08', zone:'ground', floor:'1F', cat:'red', title:'필로티 실내화', tags:['주차','증축'],
      short:'주차·피난용 필로티를 벽으로 막아 실내화.', floorLabel:'1F',
      example:'1층 필로티를 새시·벽으로 막아 방·점포로 사용 — 주차대수 부족과 무단 증축이 동시에 문제된다.', qa:[8,15]},
    {id:'parking-use', no:'09', zone:'ground', floor:'1F', cat:'red', title:'주차장 창고·점포 전용', tags:['주차','용도변경'],
      short:'주차구획을 창고·가게·적치로 점유.', floorLabel:'1F',
      example:'법정 주차구획에 컨테이너·집기를 두고 창고로 사용 — 주차장법·용도 위반, 적치·고정 여부가 쟁점.', qa:[9,14]},
    {id:'use-change', no:'10', zone:'ground', floor:'1F', cat:'red', title:'근생→주거 용도변경', tags:['용도변경'],
      short:'근린생활시설을 원룸 주거로 사용.', floorLabel:'1F',
      example:'1층 소매점(근생)을 칸막이해 원룸으로 임대 — 대장 용도와 실제가 달라 무단 용도변경, 주차·소방 기준도 함께 본다.', qa:[10,13]},

    {id:'unit-split', no:'11', zone:'site', floor:'2F', cat:'red', title:'세대 쪼개기', tags:['구조','용도변경'],
      short:'칸막이로 세대수를 무단 증가.', floorLabel:'2F',
      example:'한 세대를 칸막이·계량기 분리로 두세 세대로 나눠 임대 — 무단 대수선·세대수 증가, 다세대 전환 문제와 얽힌다.', qa:[11,16]},
    {id:'site-cover', no:'12', zone:'site', floor:'SITE', cat:'amber', title:'마당·조경 잠식', tags:['조경','건폐율'],
      short:'대지 조경·공지를 구조물로 잠식.', floorLabel:'대지',
      example:'조경 면적·공개공지에 창고·평상·주차를 들여 일반 이용을 막음 — 조경 훼손은 강제금 사유가 된다.', qa:[12,15]},
  ];

  const QNA = [
    {id:1, cat:'extension', q:'옥상에 옥탑방·창고를 지어 쓰면 위반인가요?',
      a:'지붕과 벽이 있는 구조물을 올리면 바닥면적·층수·건물 높이가 늘어 무단 증축으로 보는 경우가 많습니다. 옥상은 공용부분인 경우가 많아 권리관계도 함께 확인합니다.', refs:['건축법 제11조','제14조','제79조','제80조']},
    {id:2, cat:'extension', q:'옥상 파고라·차양은 괜찮은 거 아닌가요?',
      a:'고정식으로 지붕 역할을 하면 면적·높이 산정 대상이 될 수 있습니다. 분리 가능한 일시 시설인지, 고정 구조인지가 판단의 갈림길입니다.', refs:['건축법 제2조','제14조']},
    {id:3, cat:'use', q:'계단탑·물탱크실을 방으로 쓰면 문제가 되나요?',
      a:'설비·피난을 위한 부속공간을 주거로 쓰면 용도·면적·높이 문제와 무단 증축이 함께 생길 수 있습니다. 도면상 명칭과 실제 사용을 비교합니다.', refs:['건축법 제19조','제79조']},
    {id:4, cat:'extension', q:'발코니 확장은 무조건 불법인가요?',
      a:'무조건은 아닙니다. 적법 절차와 대피공간·방화 기준을 지키지 않은 확장이 문제입니다. 면적뿐 아니라 피난·안전 훼손 여부가 핵심입니다.', refs:['건축법 시행령 피난·방화 기준','제79조']},
    {id:5, cat:'extension', q:'샷시·패널로 외부를 둘러 공간을 넓혔어요.',
      a:'벽·기둥·지붕 역할을 하는 구조로 외부를 둘러 바닥면적이 늘면 증축으로 봅니다. 단순 차양·처마와는 구분이 필요합니다.', refs:['건축법 제11조','제14조']},
    {id:6, cat:'extension', q:'입구에 처마·캐노피를 달았는데 괜찮나요?',
      a:'1m를 넘는 차양·처마는 건축면적에 산입돼 건폐율에 영향을 줄 수 있습니다. 길이와 고정 방식이 쟁점입니다.', refs:['건축법 시행령 건축면적 산정','제55조']},
    {id:7, cat:'structure', q:'외부 철골계단을 새로 달았어요.',
      a:'피난·세대 사용을 위한 외부계단 증설은 증축·대수선 또는 구조 변경으로 판단될 수 있고, 세대수 증가와 연결되기도 합니다.', refs:['건축법 제11조','제79조']},
    {id:8, cat:'parking', q:'필로티 주차장을 벽으로 막아 실내로 썼어요.',
      a:'주차·피난을 위한 필로티를 실내화하면 주차대수 부족과 무단 증축이 동시에 문제됩니다. 특별조치법상 사용승인 검토 때도 주차 기준은 따로 보며, 세대·가구·호수 증가나 근린생활시설 주택 사용이면 주차장 설치 또는 비용 납부가 요구될 수 있습니다.', refs:['주차장법','건축법 제79조','특정건축물 정리에 관한 특별조치법 제7조']},
    {id:9, cat:'parking', q:'주차장을 창고·가게로 쓰면 위반인가요?',
      a:'주차구획을 다른 용도로 점유하면 주차장법·용도 위반이 됩니다. 적치인지 고정 구조인지에 따라 조치가 달라지고, 특별조치법 검토에서도 세대수 증가형이거나 근린생활시설을 주택으로 쓴 경우에는 주차장 설치 또는 비용 납부 여부를 함께 확인합니다.', refs:['주차장법 제19조의4','건축법 제79조','특정건축물 정리에 관한 특별조치법 제7조']},
    {id:10, cat:'use', q:'근린생활시설을 원룸으로 바꿔 임대해요.',
      a:'대장상 용도와 실제 사용이 다르면 무단 용도변경입니다. 특별조치법상 근린생활시설 주택 사용은 2023년 12월 31일 이전부터 사실상 주택으로 사용된 경우에 한해 대상 가능성을 봅니다. 주거용 비율, 면적 기준, 주차·피난·소방 기준도 함께 확인합니다.', refs:['건축법 제19조','제79조','특정건축물 정리에 관한 특별조치법 제3조','제6조']},
    {id:11, cat:'structure', q:'다가구를 칸막이로 나눠 세대를 늘렸어요(세대 쪼개기).',
      a:'경계벽·계량기·출입구를 늘려 세대수를 증가시키면 무단 대수선·용도 위반이 될 수 있고, 다세대 전환 문제와 얽힙니다. 특별조치법에서도 세대·가구·호수 증가형은 피난·방화·소방 기준과 주차 부담을 별도로 확인해야 합니다.', refs:['건축법 제19조','제79조','특정건축물 정리에 관한 특별조치법 제6조','제7조']},
    {id:12, cat:'parking', q:'마당·조경 자리에 구조물을 놨어요.',
      a:'대지 조경·공개공지를 잠식하거나 일반 이용을 막으면 위반입니다. 조경 면적 훼손은 강제금 사유가 됩니다.', refs:['건축법 제42조','제80조']},
    {id:13, cat:'process', q:'양성화는 무엇이고, 다 가능한가요?',
      a:'양성화는 위반 상태를 추인·신고·허가, 특별조치법상 신고·사용승인, 또는 일부 철거로 적법화할 수 있는지 보는 검토입니다. 특별조치법은 2026년 12월 17일부터 시행되고 18개월간 한시 적용되며, 2023년 12월 31일 당시 사실상 완공된 주거용 특정건축물인지, 면적 기준과 제외구역에 걸리지 않는지를 먼저 봅니다. 모든 사례가 가능한 것은 아닙니다.', refs:['건축법 제11조','제14조','제19조','특정건축물 정리에 관한 특별조치법 제3조','부칙']},
    {id:14, cat:'process', q:'강제금만 내면 그냥 둬도 되나요?',
      a:'아닙니다. 이행강제금은 시정 전까지 반복 부과될 수 있고, 위반 표기와 매매·대출 불이익도 그대로 남습니다. 특별조치법상 사용승인 검토에서도 과태료와 이행강제금 체납이 없어야 하며, 경우에 따라 1년 이내 납부 조건으로 승인될 수 있습니다.', refs:['건축법 제80조','특정건축물 정리에 관한 특별조치법 제6조']},
    {id:15, cat:'process', q:'이행강제금은 얼마나, 몇 번 나오나요?',
      a:'일반 이행강제금은 시가표준액·위반면적·요율로 산정되고, 시정 전까지 반복 부과될 수 있습니다. 특별조치법 적용 대상이 사용승인을 받는 경우에는 이행강제금 5회분 기준의 과태료가 문제되며, 이미 5회 미만 납부한 이력이 있으면 그 납부액을 차감하는 방식으로 계산됩니다.', refs:['건축법 제80조','특정건축물 정리에 관한 특별조치법 제9조']},
    {id:16, cat:'process', q:'위반인지 어떻게 적발되나요?',
      a:'항공·드론 판독, 민원, 정기 점검, 매매·인허가 과정에서 드러납니다. 표기 후 시정명령 → 이행강제금 순으로 진행됩니다.', refs:['건축법 제79조','제80조']},
  ];
  const QNA_MAP = Object.fromEntries(QNA.map(x=>[x.id,x]));

  const TYPES = [
    {zone:'roof',   title:'옥상부 위반', n:3, desc:'옥탑방, 파고라, 계단탑·물탱크실 전용 — 옥상에 올린 구조물.',
      icon:'<path d="M3 21V9l9-6 9 6v12"/><path d="M8 21v-5h8v5"/>'},
    {zone:'facade', title:'외벽·발코니·증축', n:4, desc:'발코니 확장, 샷시·패널, 처마·캐노피, 외부계단.',
      icon:'<rect x="3" y="3" width="8" height="18" rx="1"/><path d="M14 8h7M14 13h7M14 18h4"/>'},
    {zone:'ground', title:'1층·주차·용도', n:3, desc:'필로티 실내화, 주차장 전용, 근생→주거 용도변경.',
      icon:'<rect x="3" y="11" width="18" height="8" rx="1"/><path d="M6 11V8a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v3"/>'},
    {zone:'site',   title:'구조·세대·대지', n:2, desc:'세대 쪼개기, 마당·조경 잠식.',
      icon:'<path d="M3 21h18M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/>'},
  ];

  /* ----------------------------- BUILD 3D ----------------------------- */
  const stack = $('#stack'), world = $('#world');
  const W=210, D=140, H=66;          // footprint + floor height
  const lvlY = {'1F':H,'2F':0,'3F':-H};   // 2F centered at 0
  const groundH=12, deckH=10;

  function el(cls,parent){const d=document.createElement('div');if(cls)d.className=cls;if(parent)parent.appendChild(d);return d;}

  // a slab (front + right side + top) centered at the wrapper's origin
  function slab(wrap, w,h,d, colors){
    const front = el('face front', wrap), side = el('face side', wrap), top = el('face top', wrap);
    front.style.cssText += `width:${w}px;height:${h}px;transform:translate(-50%,-50%) translateZ(${d/2}px);--_front:${colors.front}`;
    side.style.cssText  += `width:${d}px;height:${h}px;transform:translate(-50%,-50%) rotateY(90deg) translateZ(${w/2}px);--_side:${colors.side}`;
    top.style.cssText   += `width:${w}px;height:${d}px;transform:translate(-50%,-50%) rotateX(90deg) translateZ(${h/2}px);--_top:${colors.top}`;
    return {front, side, top};
  }
  function windowsOn(face, list){ // list of [leftPx, topPx, w, h] relative to face top-left
    list.forEach(([x,y,w,h])=>{const v=el('win',face);v.style.cssText+=`left:${x}px;top:${y}px;width:${w}px;height:${h}px;transform:translateZ(1px)`;});
  }
  function floorWrap(key, y){
    const f = el('floor', stack); f.dataset.floor=key;
    f.style.cssText += `position:absolute;left:0;top:0;transform-style:preserve-3d;transform:translateY(${y}px)`;
    f.dataset.baseY=y;
    return f;
  }

  const M = { brick:'#c5895f', brickD:'#a06b46', stucco:'#ddd4c2', stuccoD:'#c4b9a2',
              concrete:'#b7b0a1', concreteD:'#938c7d', roofdeck:'#7b9477', roofdeckD:'#5f7a5d',
              tank:'#5d83a6', tankD:'#456585', dark:'#6c655a' };

  // ----- SITE / 대지 (ground plate) -----
  const fSite = floorWrap('SITE', lvlY['1F']+H/2+groundH/2);
  const gp = el('', fSite); gp.style.cssText='position:absolute;left:0;top:0;transform-style:preserve-3d';
  slab(gp, W+90, groundH, D+90, {front:'#cdbf9f',side:'#b6a781',top:'#9fae84'});
  // a little yard marking on the ground top handled by color

  // ----- 1F (필로티 / 주차 / 점포) -----
  const f1 = floorWrap('1F', lvlY['1F']);
  const b1 = el('', f1); b1.style.cssText='position:absolute;left:0;top:0;transform-style:preserve-3d';
  const s1 = slab(b1, W, H, D, {front:M.concrete,side:M.concreteD,top:M.stucco});
  // dark "필로티/주차" recess on front-left + 점포 글라스 on right
  windowsOn(s1.front, [[-W/2+14,-H/2+12,58,H-22],[-W/2+80,-H/2+12,46,H-22]]); // open bays (glass-ish)
  const sign = el('', s1.front); sign.style.cssText=`position:absolute;left:${W/2-58}px;top:${-H/2+6}px;width:46px;height:14px;background:#c9605a;border-radius:2px;transform:translateZ(2px);box-shadow:0 1px 0 rgba(0,0,0,.2)`;

  // ----- 2F -----
  const f2 = floorWrap('2F', lvlY['2F']);
  const b2 = el('', f2); b2.style.cssText='position:absolute;left:0;top:0;transform-style:preserve-3d';
  const s2 = slab(b2, W, H, D, {front:M.brick,side:M.brickD,top:M.stuccoD});
  windowsOn(s2.front, [[-W/2+22,-H/2+14,40,34],[-22,-H/2+14,40,34],[W/2-62,-H/2+14,40,34]]);
  // panel-ext patch on 2F (visual)
  const patch2 = el('', s2.front); patch2.style.cssText=`position:absolute;left:${-W/2+6}px;top:${-H/2+6}px;width:34px;height:${H-12}px;background:repeating-linear-gradient(90deg,#d8d2c4,#d8d2c4 5px,#c4bca8 5px,#c4bca8 10px);transform:translateZ(3px);border:1px solid rgba(0,0,0,.12)`;

  // ----- 3F -----
  const f3 = floorWrap('3F', lvlY['3F']);
  const b3 = el('', f3); b3.style.cssText='position:absolute;left:0;top:0;transform-style:preserve-3d';
  const s3 = slab(b3, W, H, D, {front:M.brick,side:M.brickD,top:M.roofdeck});
  windowsOn(s3.front, [[-W/2+22,-H/2+14,40,34],[-22,-H/2+14,40,34],[W/2-62,-H/2+14,40,34]]);
  // balcony box on 3F front
  const balc = el('', s3.front); balc.style.cssText=`position:absolute;left:${-22}px;top:${H/2-16}px;width:64px;height:12px;background:#cfc6b2;border:1px solid rgba(0,0,0,.15);transform:translateZ(8px)`;
  // external stair on 3F right side
  const stairEl = el('', f3); stairEl.style.cssText=`position:absolute;left:0;top:0;transform-style:preserve-3d;transform:translate3d(${W/2+8}px,0,${-D/4}px)`;
  for(let i=0;i<5;i++){const stp=el('',stairEl);stp.style.cssText=`position:absolute;left:0;top:0;width:30px;height:5px;background:#8a8276;transform:translate(-50%,-50%) translateY(${-22+i*9}px) translateZ(${10-i*4}px);box-shadow:0 1px 0 rgba(0,0,0,.25)`;}

  // ----- ROOF (RF): deck + props -----
  const fRF = floorWrap('RF', lvlY['3F']-H/2-deckH/2);
  const deck = el('', fRF); deck.style.cssText='position:absolute;left:0;top:0;transform-style:preserve-3d';
  slab(deck, W, deckH, D, {front:M.roofdeckD,side:'#516a4f',top:M.roofdeck});
  // parapet line
  const para = el('', deck); para.style.cssText=`position:absolute;left:0;top:0;width:${W}px;height:6px;background:#4d6149;transform:translate(-50%,-50%) translateY(${-deckH/2-3}px) translateZ(${D/2}px)`;
  // 옥탑방 (room) prop — left/back
  const roomBox = el('', fRF); roomBox.style.cssText=`position:absolute;left:0;top:0;transform-style:preserve-3d;transform:translate3d(${-W/3}px,${-deckH/2-28}px,${-10}px)`;
  slab(roomBox, 74, 56, 56, {front:'#d9c9a6',side:'#bfae89',top:'#9c8f74'});
  // 파고라 (pergola) prop — center, light
  const pergola = el('', fRF); pergola.style.cssText=`position:absolute;left:0;top:0;transform-style:preserve-3d;transform:translate3d(${22}px,${-deckH/2-20}px,${28}px)`;
  slab(pergola, 60, 6, 44, {front:'#a98f6b',side:'#8c744f',top:'#caa676'});
  for(let i=0;i<4;i++){const pl=el('',pergola);pl.style.cssText=`position:absolute;left:0;top:0;width:6px;height:34px;background:#9a805c;transform:translate(-50%,-50%) translateX(${-24+i*16}px) translateY(17px) translateZ(20px)`;}
  // 물탱크실/계단탑 (service) prop — right
  const tank = el('', fRF); tank.style.cssText=`position:absolute;left:0;top:0;transform-style:preserve-3d;transform:translate3d(${W/3+4}px,${-deckH/2-30}px,${-18}px)`;
  slab(tank, 50, 60, 50, {front:M.tank,side:M.tankD,top:'#7fa3c4'});

  // floor labels (mono) on left edge of each floor front
  [['1F',f1],['2F',f2],['3F',f3]].forEach(([lab,f])=>{
    const t=el('floortag',f); t.textContent=lab;
    t.style.cssText+=`position:absolute;left:0;top:0;transform:translate(-50%,-50%) translate(${-W/2-22}px,0) translateZ(${D/2}px)`;
  });

  /* ---- attach markers ---- */
  // position helper: place a marker on a face at left%/top%
  function addMarker(v, face, leftPct, topPct){
    const b=document.createElement('button');
    b.className='mk'; b.type='button'; b.dataset.id=v.id; b.dataset.zone=v.zone;
    if(v.cat==='amber') b.dataset.cat='amber';
    b.textContent=v.no;
    b.setAttribute('aria-label', v.title+' 사례 보기');
    b.style.left=leftPct+'%'; b.style.top=topPct+'%';
    b.style.marginLeft='-15px'; b.style.marginTop='-15px';
    face.appendChild(b);
    b.addEventListener('pointerdown',e=>e.stopPropagation());
    b.addEventListener('click',e=>{e.stopPropagation();select(v.id,true);});
    return b;
  }
  // explicit marker placements (face, left%, top%)
  const PLACE = {
    'roof-room':   [roomBox.querySelector('.front'),50,42],
    'roof-pergola':[pergola.querySelector('.front'),50,55],
    'roof-service':[tank.querySelector('.front'),50,42],
    'balcony':     [s3.front,42,82],
    'panel':       [s2.front,9,50],
    'canopy':      [s1.front,62,18],
    'stair':       [s3.front,90,40],
    'piloti':      [s1.front,16,55],
    'parking-use': [s1.front,40,60],
    'use-change':  [s1.front,82,30],
    'unit-split':  [s2.front,72,46],
    'site-cover':  [fSite.querySelector('.front'),64,55],
  };
  const markerEls={};
  VIOLATIONS.forEach(v=>{const p=PLACE[v.id]; if(p) markerEls[v.id]=addMarker(v,p[0],p[1],p[2]);});

  /* ----------------------------- ROTATE ----------------------------- */
  let rotY=-24, auto=!reduced, dragging=false, moved=false, lastX=0;
  const scene=$('#scene');
  function apply(){ world.style.setProperty('--rotY', rotY+'deg'); }
  apply();
  scene.addEventListener('pointerdown',e=>{dragging=true;moved=false;lastX=e.clientX;scene.setPointerCapture(e.pointerId);});
  scene.addEventListener('pointermove',e=>{
    if(!dragging)return; const dx=e.clientX-lastX; if(Math.abs(dx)>2)moved=true;
    rotY=Math.max(-70,Math.min(18, rotY+dx*0.32)); lastX=e.clientX; apply();
  });
  function endDrag(){dragging=false;}
  scene.addEventListener('pointerup',endDrag); scene.addEventListener('pointercancel',endDrag);
  if(!reduced){
    let last=performance.now(), dir=1;
    (function spin(now){const dt=Math.min(40,now-last);last=now; if(auto&&!dragging){rotY+=dt*0.0026*dir; if(rotY>6){rotY=6;dir=-1;} if(rotY<-58){rotY=-58;dir=1;} apply();} requestAnimationFrame(spin);})(last);
  }

  /* ----------------------------- TOOLS ----------------------------- */
  const tRotate=$('#tRotate'), tExplode=$('#tExplode'), tMarkers=$('#tMarkers');
  tRotate.addEventListener('click',()=>{auto=!auto;tRotate.setAttribute('aria-pressed',String(auto));});
  let exploded=false;
  tExplode.addEventListener('click',()=>{
    exploded=!exploded; tExplode.setAttribute('aria-pressed',String(exploded));
    $$('.floor',stack).forEach(f=>{
      const base=+f.dataset.baseY; const key=f.dataset.floor;
      const order={'SITE':0,'1F':1,'2F':2,'3F':3,'RF':4}[key]||0;
      const extra = exploded ? (order-1)*52 - 20 : 0; // fan upward
      f.style.transform=`translateY(${base - extra}px)`;
    });
  });
  tMarkers.addEventListener('click',()=>{
    const on=tMarkers.getAttribute('aria-pressed')!=='true';
    tMarkers.setAttribute('aria-pressed',String(on));
    $('#viewer').classList.toggle('markers-off',!on);
  });

  /* ----------------------------- SELECT / PANEL ----------------------------- */
  const panel=$('#panel'), sheetBack=$('#sheetBack');
  let current=null;
  function select(id, fromBuilding){
    const v=VIOLATIONS.find(x=>x.id===id); if(!v)return; current=id;
    // marker active state
    Object.values(markerEls).forEach(m=>m.classList.remove('is-active'));
    if(markerEls[id]) markerEls[id].classList.add('is-active');
    // floor highlight
    world.classList.add('has-sel');
    $$('.floor',stack).forEach(f=>f.classList.toggle('sel', f.dataset.floor===v.floor));
    // fill panel
    $('#pNo').textContent='위반 '+v.no;
    $('#pFloor').textContent=v.floorLabel;
    $('#pTitle').textContent=v.title;
    $('#pShort').textContent=v.short;
    $('#pExample').textContent=v.example;
    const tagrow=$('#pTags'); tagrow.innerHTML='';
    v.tags.forEach(t=>{const s=document.createElement('span');s.className='tag'+(/검토|건폐율|피난/.test(t)?' is-warn':'');s.textContent=t;tagrow.appendChild(s);});
    // connected Q&A
    const host=$('#pQna'); host.innerHTML='';
    v.qa.forEach((qid,i)=>{const item=QNA_MAP[qid]; if(item) host.appendChild(accordion(item, i===0));});
    $('#pQCount').textContent=v.qa.length+'건';
    $('#pConsult').onclick=()=>{ const sel=$('#cZone'); if(sel){ const map={roof:'옥상 (옥탑방·파고라·물탱크실)',facade:'외벽·발코니 (확장·패널·캐노피)',ground:'1층·주차장 (실내화·창고·점포)',site:'구조·대지 (마당 잠식 등)'}; const want=map[v.zone]; [...sel.options].forEach(o=>{if(o.text===want)sel.value=o.value;}); } };
    panel.classList.add('is-open');
    if(mm('(max-width:960px)').matches){ sheetBack.classList.add('show'); document.body.style.overflow='hidden'; }
  }
  window.qna2OpenViolation = select;
  function closePanel(){
    panel.classList.remove('is-open'); sheetBack.classList.remove('show'); document.body.style.overflow='';
    world.classList.remove('has-sel'); $$('.floor',stack).forEach(f=>f.classList.remove('sel'));
    Object.values(markerEls).forEach(m=>m.classList.remove('is-active')); current=null;
  }
  $('#panelClose').addEventListener('click',closePanel);
  sheetBack.addEventListener('click',closePanel);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel.classList.contains('is-open'))closePanel();});

  /* reusable accordion */
  function accordion(item, open){
    const wrap=document.createElement('div'); wrap.className='acc'+(open?' is-open':'');
    wrap.innerHTML =
      `<button class="acc__q" type="button" aria-expanded="${open?'true':'false'}">
         <span class="qmark">Q</span><span class="qtext">${item.q}</span>
         <span class="chev" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg></span>
       </button>
       <div class="acc__a"><div>
         <p>${item.a}</p>
         <div class="acc__refs">${item.refs.map(r=>`<span>${r}</span>`).join('')}</div>
       </div></div>`;
    const btn=wrap.querySelector('.acc__q');
    btn.addEventListener('click',()=>{const o=wrap.classList.toggle('is-open');btn.setAttribute('aria-expanded',String(o));});
    return wrap;
  }

  /* ----------------------------- ZONE CHIPS ----------------------------- */
  let zone='all';
  function setZone(z, scroll){
    zone=z;
    $$('#zones .zone').forEach(c=>c.classList.toggle('is-active',c.dataset.zone===z));
    Object.entries(markerEls).forEach(([id,m])=>{
      const v=VIOLATIONS.find(x=>x.id===id);
      const show = z==='all'||v.zone===z;
      m.style.display=show?'':'none';
    });
    if(scroll){const vw=$('#explore'); vw.scrollIntoView({behavior:'smooth',block:'start'});}
  }
  $$('#zones .zone').forEach(c=>c.addEventListener('click',()=>setZone(c.dataset.zone)));

  /* ----------------------------- TYPE GRID ----------------------------- */
  const tg=$('#typeGrid');
  TYPES.forEach(t=>{
    const card=document.createElement('button'); card.className='type'; card.type='button';
    card.innerHTML=`<div class="type__ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round">${t.icon}</svg></div>
      <h3>${t.title}</h3><p>${t.desc}</p>
      <div class="type__foot"><b>건물에서 보기</b><span class="arrow">→</span></div>`;
    card.addEventListener('click',()=>{ setZone(t.zone,true); const first=VIOLATIONS.find(v=>v.zone===t.zone); if(first) setTimeout(()=>select(first.id,true),420); });
    tg.appendChild(card);
  });

  /* ----------------------------- FULL Q&A ARCHIVE ----------------------------- */
  const FILTERS=[['all','전체',16],['extension','증축·공간확장',5],['use','용도변경',2],['parking','주차·공용',3],['structure','구조·세대',2],['process','추인·절차',4]];
  const qaFilter=$('#qaFilter'); let qaCat='all', qaQuery='';
  FILTERS.forEach((f,i)=>{
    const b=document.createElement('button'); b.type='button'; b.dataset.cat=f[0]; if(i===0)b.classList.add('is-active');
    b.innerHTML=`<span>${f[1]}</span><span class="c">${f[2]}</span>`;
    b.addEventListener('click',()=>{qaCat=f[0];$$('#qaFilter button').forEach(x=>x.classList.toggle('is-active',x===b));renderQA();});
    qaFilter.appendChild(b);
  });
  const qaList=$('#qaList'), qaEmpty=$('#qaEmpty'), qaCount=$('#qaCount');
  function renderQA(){
    const q=qaQuery.trim().toLowerCase();
    const items=QNA.filter(it=>(qaCat==='all'||it.cat===qaCat) && (!q || (it.q+it.a+it.refs.join('')).toLowerCase().includes(q)));
    qaList.innerHTML=''; items.forEach((it,i)=>qaList.appendChild(accordion(it,false)));
    qaCount.textContent=items.length; qaEmpty.style.display=items.length?'none':'block';
  }
  $('#qaSearch').addEventListener('input',e=>{qaQuery=e.target.value;renderQA();});
  renderQA();

  /* ----------------------------- SELF DIAGNOSIS ----------------------------- */
  const DQ=[
    {q:'질문 1 / 3', t:'옥상에 지붕·벽이 있는 구조물을 쓰고 계신가요?', sub:'옥탑방·창고·파고라·물탱크실 사용 포함',
     opts:[['네, 있어요','roof'],['아니요','-'],['잘 모르겠어요','?']]},
    {q:'질문 2 / 3', t:'주차장·필로티·마당을 원래 용도와 다르게 쓰나요?', sub:'창고·점포·방·적치 등',
     opts:[['네, 그래요','ground'],['아니요','-'],['잘 모르겠어요','?']]},
    {q:'질문 3 / 3', t:'발코니·외벽을 확장하거나 세대를 나눴나요?', sub:'발코니 확장, 패널 증축, 세대 쪼개기 등',
     opts:[['네, 했어요','facade'],['아니요','-'],['잘 모르겠어요','?']]},
  ];
  const diagIn=$('#diagIn'), diagBar=$('#diagBar'); let dStep=0, dAns=[];
  function renderDiag(){
    diagBar.style.width=((dStep)/(DQ.length)*100)+'%';
    if(dStep<DQ.length){
      const s=DQ[dStep];
      diagIn.innerHTML=`<div class="diag__step is-on">
        <div class="diag__q">${s.q}</div><h3>${s.t}</h3>
        <p style="color:var(--ink-3);font-size:.88rem;margin-top:4px">${s.sub}</p>
        <div class="diag__opts">${s.opts.map((o,i)=>`<button class="opt" data-v="${o[1]}"><span class="dot"></span>${o[0]}</button>`).join('')}</div>
        <div class="diag__nav"><button class="diag__back" ${dStep===0?'style="visibility:hidden"':''}>← 이전</button><span style="font-family:var(--mono);font-size:.7rem;color:var(--ink-3)">${dStep+1} / ${DQ.length}</span></div>
      </div>`;
      $$('.opt',diagIn).forEach(b=>b.addEventListener('click',()=>{dAns[dStep]=b.dataset.v;dStep++;renderDiag();}));
      const back=$('.diag__back',diagIn); if(back)back.addEventListener('click',()=>{dStep=Math.max(0,dStep-1);renderDiag();});
    } else { renderResult(); }
  }
  function renderResult(){
    diagBar.style.width='100%';
    const zones=[...new Set(dAns.filter(a=>a&&a!=='-'&&a!=='?'))];
    const unsure=dAns.includes('?');
    let matched=[];
    zones.forEach(z=> VIOLATIONS.filter(v=>v.zone===z).forEach(v=>matched.push(v)));
    matched=matched.slice(0,4);
    const zoneNames={roof:'옥상부',facade:'외벽·발코니·증축',ground:'1층·주차·용도',site:'구조·대지'};
    let headline, body;
    if(matched.length){
      headline=zones.map(z=>zoneNames[z]).join(' · ')+' 위반 가능성';
      body=`<ul>${matched.map(v=>`<li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4M12 17h.01M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg><span><b>${v.title}</b> — ${v.short}</span></li>`).join('')}</ul>`;
    } else {
      headline='뚜렷한 위반 신호는 적습니다';
      body=`<p style="color:var(--ink-2);font-size:.94rem;margin-top:6px">선택만으로는 큰 위반 신호가 보이지 않습니다. 다만 사용승인 도면과 현재 상태를 비교하면 더 확실합니다.${unsure?' 잘 모르겠다고 답한 항목이 있어, 사진으로 확인해 보시길 권합니다.':''}</p>`;
    }
    const firstZone=zones[0];
    diagIn.innerHTML=`<div class="diag__step is-on diag__result">
      <div class="diag__q">사례 매칭 결과</div><h3>${matched.length?'닮은 위반 유형을 찾았어요':'점검을 권합니다'}</h3>
      <div class="result-card"><div class="big">${headline}</div>${body}</div>
      <div class="result-card-acts" style="margin-top:16px;display:flex;flex-wrap:wrap;gap:10px">
        ${firstZone?`<button class="btn btn--ghost" id="dSeeBuilding">건물에서 해당 위반 보기</button>`:''}
        <a class="btn btn--pine" href="/check">양성화 가능성 진단하기</a>
        <a class="btn btn--ghost" href="#consult">무료 상담 신청</a>
        <button class="btn btn--ghost" id="dRestart">다시 찾기</button>
      </div></div>`;
    const see=$('#dSeeBuilding'); if(see)see.addEventListener('click',()=>{setZone(firstZone,true);const v=matched[0];if(v)setTimeout(()=>select(v.id,true),420);});
    $('#dRestart').addEventListener('click',()=>{dStep=0;dAns=[];renderDiag();});
  }
  renderDiag();

  /* ----------------------------- CONSULT FORM ----------------------------- */
  const toast=$('#toast');
  function showToast(msg){toast.textContent=msg;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2600);}
  $('#consultForm').addEventListener('submit',e=>{
    e.preventDefault();
    const name=$('#cName').value.trim(), phone=$('#cPhone').value.trim();
    if(!name||!phone){showToast('이름과 연락처를 입력해 주세요.');return;}
    // TODO: 실제 전송 연동 (예: fetch POST to your endpoint)
    showToast('상담 신청이 접수되었습니다. 곧 연락드릴게요.');
    e.target.reset();
  });
  $('#kakaoWay').addEventListener('click',e=>{e.preventDefault();showToast('카카오톡 채널 링크를 연결해 주세요.');});

  /* ----------------------------- SCROLL REVEAL ----------------------------- */
  if(!reduced && 'IntersectionObserver' in window){
    const io=new IntersectionObserver((es)=>es.forEach(en=>{if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target);}}),{threshold:.12});
    $$('.reveal').forEach(n=>io.observe(n));
  } else { $$('.reveal').forEach(n=>n.classList.add('in')); }

})();

