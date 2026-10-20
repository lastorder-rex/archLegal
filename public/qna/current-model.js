(function(){
  "use strict";

  const canvas = document.getElementById('buildingCanvas');
  const stage = document.getElementById('modelStage');
  if (!canvas || !stage) return;

  const ctx = canvas.getContext('2d');
  const issueTitle = document.getElementById('modelIssueTitle');
  const autoBtn = document.getElementById('autoRotate');
  const redBtn = document.getElementById('toggleRed');
  const resetBtn = document.getElementById('resetView');
  const casePins = [...document.querySelectorAll('.model-pin[data-zone]')];
  const caseChips = [...document.querySelectorAll('.case-chip[data-zone]')];
  const caseRail = document.querySelector('.model-casebar__rail');

  const caseDefinitions = {
    terrace:{category:'extension',title:'<span>1층 테라스</span> · 지붕·천막 설치',anchor:{x:2.35,y:1.04,z:-2.55},panelId:'canopy'},
    balcony:{category:'extension',title:'<span>3층 발코니</span> · 샷시·지붕 확장',anchor:{x:2.28,y:2.92,z:-2.22},panelId:'balcony'},
    roof:{category:'extension',title:'<span>옥상 공용부분</span> · 창고·옥탑방',anchor:{x:.82,y:4.2,z:.46},panelId:'roof-room'},
    parking:{category:'parking',title:'<span>1층 필로티</span> · 창고화',anchor:{x:-1.62,y:.73,z:-1.82},panelId:'piloti'},
    use:{category:'use',title:'<span>1층 근린시설</span> · 원룸 사용',anchor:{x:.2,y:.72,z:-1.84},panelId:'use-change'},
    attic:{category:'extension',title:'<span>옥상 다락</span> · 주거사용',anchor:{x:-1.52,y:3.78,z:-.55},panelId:'roof-service'},
    stair:{category:'structure',title:'<span>외부 철골계단</span> · 무단 설치',anchor:{x:3.35,y:1.55,z:.55},panelId:'stair'},
    split:{category:'structure',title:'<span>2층 세대</span> · 원룸식 분할',anchor:{x:-.2,y:1.78,z:-1.93},panelId:'unit-split'},
    landscape:{category:'parking',title:'<span>대지 조경</span> · 포장·주차 전용',anchor:{x:-1.58,y:.05,z:-2.78},panelId:'site-cover'},
    container:{category:'extension',title:'<span>대지 외곽</span> · 컨테이너 창고',anchor:{x:-3.55,y:.7,z:-.85},panelId:'roof-room'}
  };

  const categoryConfigs = {
    all:'<span>10개 위반사례</span> · 3층 입체 진단맵',
    extension:'<span>증축·공간확장</span> · 5개 적용 부위',
    use:'<span>용도변경</span> · 1층 실제 사용',
    parking:'<span>주차·공용공간</span> · 필로티와 조경',
    structure:'<span>구조·세대변경</span> · 계단과 분할',
    process:'<span>추인·행정절차</span> · 전체 위반부위'
  };

  let width = 0, height = 0, dpr = 1;
  let rotX = -0.29, rotY = -0.66, zoom = 58;
  let autoRotate = false, showRed = true, activeMode = 'all';
  let dragging = false, moved = false, lastX = 0, lastY = 0;
  let hitRegions = [];

  const palettes = {
    body: { front:'#b9b2a3', side:'#8f887a', top:'#d8d0c1', stroke:'rgba(94,87,75,.28)' },
    slab: { front:'#c9c1b1', side:'#9f9788', top:'#e2d9c9', stroke:'rgba(94,87,75,.24)' },
    base: { front:'#958d7e', side:'#746d61', top:'#bbb3a4', stroke:'rgba(94,87,75,.26)' },
    permit: { front:'#9aa89d', side:'#728276', top:'#c8d2c7', stroke:'rgba(21,88,74,.42)' }
  };
  const casePalettes = {
    terrace:{front:'#ff7b62',side:'#a94235',top:'#ffb09e',stroke:'rgba(255,206,195,.88)',glow:'rgba(255,116,103,.95)'},
    balcony:{front:'#ff665d',side:'#a43834',top:'#ffaaa3',stroke:'rgba(255,210,205,.9)',glow:'rgba(255,109,96,.98)'},
    roof:{front:'#e95350',side:'#95302f',top:'#ff9691',stroke:'rgba(255,200,197,.88)',glow:'rgba(255,93,87,.98)'},
    parking:{front:'#e7a84f',side:'#946323',top:'#f6cf8b',stroke:'rgba(255,226,170,.9)',glow:'rgba(239,183,102,.98)'},
    use:{front:'#4bc9c5',side:'#237f7d',top:'#9aebe7',stroke:'rgba(188,255,251,.9)',glow:'rgba(105,222,215,.98)'},
    attic:{front:'#ff7e8f',side:'#9e4053',top:'#ffb4bf',stroke:'rgba(255,210,218,.88)',glow:'rgba(255,126,143,.98)'},
    stair:{front:'#a58ae9',side:'#6550a5',top:'#cfbfff',stroke:'rgba(225,217,255,.9)',glow:'rgba(185,160,255,.98)'},
    split:{front:'#8c7ce0',side:'#51448f',top:'#c3b8ff',stroke:'rgba(220,213,255,.88)',glow:'rgba(166,143,247,.98)'},
    landscape:{front:'#65b876',side:'#377548',top:'#a7e2b0',stroke:'rgba(204,247,210,.86)',glow:'rgba(134,217,147,.98)'},
    container:{front:'#ef7b4f',side:'#9b472b',top:'#ffb087',stroke:'rgba(255,211,191,.88)',glow:'rgba(246,139,91,.98)'}
  };

  const boxes = [];
  const windows = [];
  const buildingW = 5.1, buildingD = 3.45, floorH = .88, floorStep = 1.12;

  function addBox(cx, cy, cz, w, h, d, type='body', zone='') { boxes.push({cx,cy,cz,w,h,d,type,zone}); }
  function addWindow(plane, cx, cy, cz, w, h, type='normal') { windows.push({plane,cx,cy,cz,w,h,type}); }

  addBox(0, -.14, 0, 5.62, .28, 3.95, 'base');
  addBox(0, .5, .93, buildingW, floorH, 1.55, 'body');
  [-2.15,-.72,.72,2.15].forEach(x => addBox(x,.5,-1.04,.24,floorH,.28,'body'));
  addBox(0, .005, 0, 5.32, .11, 3.66, 'slab');
  for(let col=0; col<4; col++) addWindow('back',-1.55+col*1.03,.5,buildingD/2+.012,.68,.4,'dim');

  for (let i = 1; i < 3; i++) {
    const cy = .5 + i * floorStep;
    addBox(0, cy, 0, buildingW, floorH, buildingD, 'body', i === 2 ? 'unitFloor' : '');
    addBox(0, cy - floorH/2 - .055, 0, 5.32, .11, 3.66, 'slab');
    for (let col = 0; col < 5; col++) {
      const x = -1.84 + col * .92;
      const special = i === 2 && col >= 3 ? 'balcony' : (i === 1 && (col === 1 || col === 2) ? 'split' : 'normal');
      addWindow('front', x, cy, -buildingD/2-.012, .62, .41, special);
      addWindow('back', -x, cy, buildingD/2+.012, .62, .41, 'dim');
    }
    for (let col = 0; col < 3; col++) {
      const z = -.94 + col * .94;
      addWindow('right', buildingW/2+.012, cy, z, .62, .41, i === 2 && col === 0 ? 'balcony' : 'normal');
      addWindow('left', -buildingW/2-.012, cy, -z, .62, .41, 'dim');
    }
  }

  addBox(0, 3.29, 0, 5.42, .16, 3.72, 'slab');
  addBox(.82, 3.74, .46, 1.72, .82, 1.35, 'case', 'roof');
  addWindow('front', .82, 3.76, -.225, .62, .35, 'roof');
  addBox(-1.52, 3.5, -.52, 1.25, .42, 1.15, 'case', 'attic');
  addWindow('front', -1.52, 3.53, -1.105, .45, .2, 'attic');
  addBox(1.72, 2.75, -2.03, 1.42, .66, .72, 'case', 'balcony');
  addBox(-.2, 1.62, -1.86, .1, .72, .22, 'case', 'split');
  addBox(-1.62, .48, -1.25, 1.48, .68, 1.05, 'case', 'parking');
  addBox(.2, .48, -1.18, 1.28, .68, 1.12, 'case', 'use');
  addWindow('front', .2, .5, -1.75, .82, .42, 'use');
  addBox(1.72, .98, -2.24, 1.75, .12, 1.0, 'case', 'terrace');
  addBox(1.05, .42, -2.55, .1, .98, .1, 'case', 'terrace');
  addBox(2.39, .42, -2.55, .1, .98, .1, 'case', 'terrace');
  for(let i=0;i<9;i++) addBox(2.96, .08+i*.27, -1.42+i*.34, .72, .11, .42, 'case', 'stair');
  addBox(2.96,1.22,-.02,.86,.12,.7,'case','stair');
  addBox(2.96,2.34,1.3,.86,.12,.7,'case','stair');
  addBox(-1.55,-.22,-2.64,1.92,.1,1.12,'case','landscape');
  addBox(-1.92,.02,-2.73,.32,.36,.32,'case','landscape');
  addBox(-1.35,.02,-2.55,.42,.28,.42,'case','landscape');
  addBox(-3.55,.26,-.85,1.3,.74,1.38,'case','container');
  addWindow('front',-3.55,.31,-1.55,.58,.28,'container');

  const faceMap = {
    front:[0,1,2,3], back:[5,4,7,6], right:[1,5,6,2], left:[4,0,3,7], top:[3,2,6,7], bottom:[4,5,1,0]
  };

  function resizeCanvas() {
    const rect = stage.getBoundingClientRect();
    width = rect.width; height = rect.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    canvas.style.width = width + 'px'; canvas.style.height = height + 'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
    zoom = Math.max(42, Math.min(82, width / 9.1));
  }

  function project(p) {
    const cy = Math.cos(rotY), sy = Math.sin(rotY);
    const x1 = p.x * cy - p.z * sy;
    const z1 = p.x * sy + p.z * cy;
    const cx = Math.cos(rotX), sx = Math.sin(rotX);
    const y1 = p.y * cx - z1 * sx;
    const z2 = p.y * sx + z1 * cx;
    const perspective = 11 / (11 + z2);
    return { x: width * .5 + x1 * zoom * perspective, y: height * .77 - y1 * zoom * perspective, depth: z2, scale: perspective };
  }

  function boxVertices(box) {
    const x = box.w/2, y = box.h/2, z = box.d/2;
    return [
      {x:box.cx-x,y:box.cy-y,z:box.cz-z},{x:box.cx+x,y:box.cy-y,z:box.cz-z},
      {x:box.cx+x,y:box.cy+y,z:box.cz-z},{x:box.cx-x,y:box.cy+y,z:box.cz-z},
      {x:box.cx-x,y:box.cy-y,z:box.cz+z},{x:box.cx+x,y:box.cy-y,z:box.cz+z},
      {x:box.cx+x,y:box.cy+y,z:box.cz+z},{x:box.cx-x,y:box.cy+y,z:box.cz+z}
    ];
  }

  function paletteFor(box) {
    if (box.zone && casePalettes[box.zone]) return showRed ? casePalettes[box.zone] : palettes.body;
    if (activeMode === 'use' && box.type === 'body') return palettes.permit;
    if (box.type === 'slab') return palettes.slab;
    if (box.type === 'base') return palettes.base;
    return palettes[box.type] || palettes.body;
  }

  function faceColor(palette, name) {
    if (name === 'top') return palette.top;
    if (name === 'left' || name === 'right' || name === 'back') return palette.side;
    return palette.front;
  }

  function polygonArea(points) {
    let area = 0;
    for (let i=0,j=points.length-1;i<points.length;j=i++) area += (points[j].x+points[i].x)*(points[j].y-points[i].y);
    return area;
  }

  function makeFaces() {
    const faces = [];
    boxes.forEach((box, objectIndex) => {
      const projected = boxVertices(box).map(project);
      const palette = paletteFor(box);
      Object.entries(faceMap).forEach(([name, ids]) => {
        const pts = ids.map(id => projected[id]);
        const depth = pts.reduce((sum,p)=>sum+p.depth,0)/pts.length;
        const area = polygonArea(pts);
        if (Math.abs(area) < .5) return;
        faces.push({pts,depth,fill:faceColor(palette,name),stroke:palette.stroke,name,zone:box.zone,objectIndex,type:box.type});
      });
    });

    windows.forEach((win, index) => {
      let points;
      const hw=win.w/2, hh=win.h/2;
      if (win.plane === 'front' || win.plane === 'back') {
        points = [{x:win.cx-hw,y:win.cy-hh,z:win.cz},{x:win.cx+hw,y:win.cy-hh,z:win.cz},{x:win.cx+hw,y:win.cy+hh,z:win.cz},{x:win.cx-hw,y:win.cy+hh,z:win.cz}];
      } else {
        points = [{x:win.cx,y:win.cy-hh,z:win.cz-hw},{x:win.cx,y:win.cy-hh,z:win.cz+hw},{x:win.cx,y:win.cy+hh,z:win.cz+hw},{x:win.cx,y:win.cy+hh,z:win.cz-hw}];
      }
      const pts = points.map(project);
      const area = Math.abs(polygonArea(pts));
      if (area < 2) return;
      const depth = pts.reduce((sum,p)=>sum+p.depth,0)/pts.length - .015;
      const special = casePalettes[win.type];
      const fill = special && showRed ? special.front : win.type === 'dim' ? 'rgba(126,121,108,.24)' : 'rgba(167,185,184,.42)';
      const stroke = special ? special.stroke : 'rgba(247,243,234,.42)';
      faces.push({pts,depth,fill,stroke,name:'window',zone:special?win.type:'',objectIndex:1000+index,type:'window'});
    });
    return faces.sort((a,b)=>b.depth-a.depth);
  }

  function drawBackground() {
    ctx.clearRect(0,0,width,height);
    const glow = ctx.createRadialGradient(width*.48,height*.43,20,width*.48,height*.43,Math.max(width,height)*.53);
    glow.addColorStop(0,'rgba(21,88,74,.16)');
    glow.addColorStop(.55,'rgba(217,133,42,.05)');
    glow.addColorStop(1,'rgba(239,233,221,0)');
    ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
  }

  function drawGround() {
    ctx.save(); ctx.lineWidth=.7;
    for(let i=-7;i<=7;i++){
      const a=project({x:i,y:-.3,z:-6}), b=project({x:i,y:-.3,z:6});
      const c=project({x:-7,y:-.3,z:i}), d=project({x:7,y:-.3,z:i});
      ctx.strokeStyle=i===0?'rgba(21,88,74,.24)':'rgba(34,40,42,.075)';
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
      ctx.beginPath();ctx.moveTo(c.x,c.y);ctx.lineTo(d.x,d.y);ctx.stroke();
    }
    ctx.restore();
  }

  function zoneMatchesMode(zone) {
    if (!zone || !caseDefinitions[zone]) return false;
    if (activeMode === zone) return true;
    if (activeMode === caseDefinitions[zone].category) return true;
    return activeMode === 'process';
  }

  function drawFace(face) {
    const activeGlow = zoneMatchesMode(face.zone);
    ctx.save();
    ctx.beginPath();ctx.moveTo(face.pts[0].x,face.pts[0].y);
    for(let i=1;i<face.pts.length;i++)ctx.lineTo(face.pts[i].x,face.pts[i].y);
    ctx.closePath();
    if(activeGlow){ctx.shadowColor=(casePalettes[face.zone]||{}).glow||'rgba(21,88,74,.95)';ctx.shadowBlur=24;}
    ctx.fillStyle=face.fill;ctx.fill();
    ctx.shadowBlur=0;ctx.strokeStyle=face.stroke;ctx.lineWidth=face.type==='window'?.8:1;ctx.stroke();
    if(face.type!=='window' && face.name==='front'){
      const grad=ctx.createLinearGradient(face.pts[0].x,face.pts[0].y,face.pts[2].x,face.pts[2].y);
      grad.addColorStop(0,'rgba(255,255,255,.055)');grad.addColorStop(.45,'rgba(255,255,255,0)');grad.addColorStop(1,'rgba(0,0,0,.08)');
      ctx.fillStyle=grad;ctx.fill();
    }
    ctx.restore();
  }

  function drawVerticalCore() {
    const bottom=project({x:-.12,y:.02,z:-1.75}), top=project({x:-.12,y:3.3,z:-1.75});
    ctx.save();ctx.strokeStyle='rgba(21,88,74,.2)';ctx.lineWidth=1;ctx.setLineDash([4,5]);ctx.beginPath();ctx.moveTo(bottom.x,bottom.y);ctx.lineTo(top.x,top.y);ctx.stroke();ctx.restore();
  }

  function drawLabels() {
    ctx.save();
    ctx.font='600 10px '+getComputedStyle(document.documentElement).getPropertyValue('--mono');
    ctx.textAlign='right';
    const labels = [
      ['01F',{x:-2.72,y:.5,z:-1.82},'.44'],
      ['02F',{x:-2.72,y:1.62,z:-1.82},'.5'],
      ['03F',{x:-2.72,y:2.74,z:-1.82},'.58'],
      ['옥상',{x:-2.72,y:3.38,z:-1.82},'.72']
    ];
    labels.forEach(([text, point, alpha]) => {
      const p=project(point);
      ctx.fillStyle=text==='옥상' ? 'rgba(216,65,47,.76)' : `rgba(74,82,79,${alpha})`;
      ctx.fillText(text,p.x,p.y);
    });
    ctx.restore();
  }

  function updatePins() {
    casePins.forEach(pin => {
      const meta = caseDefinitions[pin.dataset.zone];
      if(!meta) return;
      const p = project(meta.anchor);
      const dot = pin.querySelector('.model-pin__dot');
      const dotX = dot ? dot.offsetLeft + dot.offsetWidth / 2 : 12;
      const dotY = dot ? dot.offsetTop + dot.offsetHeight / 2 : 12;
      // 정수 px로 스냅 → 회전 후에도 라벨 글자가 서브픽셀 흐림 없이 또렷하게 유지
      pin.style.transform=`translate(${Math.round(p.x-dotX)}px,${Math.round(p.y-dotY)}px)`;
      const visible = p.x>-45 && p.x<width+45 && p.y>-45 && p.y<height+45;
      pin.style.visibility = visible ? 'visible' : 'hidden';
    });
  }

  function render() {
    drawBackground(); drawGround();
    const faces=makeFaces(); hitRegions=[];
    faces.forEach(face=>{
      drawFace(face);
      if(caseDefinitions[face.zone]) hitRegions.push({points:face.pts,zone:face.zone,depth:face.depth});
    });
    drawVerticalCore();drawLabels();updatePins();
  }

  function pointInPolygon(x,y,points){
    let inside=false;
    for(let i=0,j=points.length-1;i<points.length;j=i++){
      const xi=points[i].x,yi=points[i].y,xj=points[j].x,yj=points[j].y;
      const intersect=((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi);
      if(intersect)inside=!inside;
    }
    return inside;
  }

  function setModelMode(mode) {
    activeMode = mode || 'all';
    const exact = caseDefinitions[activeMode] ? activeMode : '';
    casePins.forEach(pin => {
      const zone=pin.dataset.zone, meta=caseDefinitions[zone];
      const active = zone===activeMode || (meta && meta.category===activeMode) || activeMode==='process';
      pin.classList.toggle('is-active', active);
      pin.classList.toggle('is-selected', zone===exact);
    });
    caseChips.forEach(chip => {
      const meta=caseDefinitions[chip.dataset.zone];
      chip.classList.toggle('is-active', chip.dataset.zone===activeMode || (meta && meta.category===activeMode) || activeMode==='process');
    });
    const exactConfig = caseDefinitions[activeMode];
    const title = exactConfig ? exactConfig.title : (categoryConfigs[activeMode] || categoryConfigs.all);
    if (issueTitle) issueTitle.innerHTML = title;
  }

  function openPanelForZone(zone) {
    const panelId = caseDefinitions[zone]?.panelId;
    if (panelId && typeof window.qna2OpenViolation === 'function') {
      window.qna2OpenViolation(panelId, true);
    }
  }

  function activateZone(zone) {
    if(!caseDefinitions[zone]) return;
    setModelMode(zone);
    openPanelForZone(zone);
  }

  stage.addEventListener('pointerdown',e=>{dragging=true;moved=false;lastX=e.clientX;lastY=e.clientY;stage.setPointerCapture(e.pointerId);});
  stage.addEventListener('pointermove',e=>{
    if(!dragging)return;
    const dx=e.clientX-lastX,dy=e.clientY-lastY;
    if(Math.abs(dx)+Math.abs(dy)>2)moved=true;
    rotY+=dx*.008;rotX=Math.max(-.75,Math.min(.12,rotX+dy*.006));lastX=e.clientX;lastY=e.clientY;
  });
  stage.addEventListener('pointerup',e=>{
    dragging=false;
    if(!moved){
      const rect=canvas.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top;
      const hits=hitRegions.filter(r=>pointInPolygon(x,y,r.points)).sort((a,b)=>a.depth-b.depth);
      if(hits[0])activateZone(hits[0].zone);
    }
  });
  stage.addEventListener('pointercancel',()=>dragging=false);
  stage.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(38,Math.min(112,zoom-e.deltaY*.035));},{passive:false});

  casePins.forEach(pin=>{
    pin.addEventListener('pointerdown',e=>e.stopPropagation());
    pin.addEventListener('click',e=>{e.stopPropagation();activateZone(pin.dataset.zone);});
  });
  let railDragging = false, railMoved = false, railStartX = 0, railStartScroll = 0, suppressChipClick = false;
  function chipFromPoint(x, y) {
    return caseChips.find(chip => {
      const rect = chip.getBoundingClientRect();
      return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    });
  }
  if (caseRail) {
    caseRail.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      railDragging = true;
      railMoved = false;
      railStartX = e.clientX;
      railStartScroll = caseRail.scrollLeft;
      caseRail.classList.add('is-dragging');
      caseRail.setPointerCapture(e.pointerId);
    });
    caseRail.addEventListener('pointermove', e => {
      if (!railDragging) return;
      const dx = e.clientX - railStartX;
      if (Math.abs(dx) > 3) railMoved = true;
      caseRail.scrollLeft = railStartScroll - dx;
      if (railMoved) e.preventDefault();
    });
    const endRailDrag = e => {
      if (!railDragging) return;
      railDragging = false;
      caseRail.classList.remove('is-dragging');
      if (caseRail.hasPointerCapture(e.pointerId)) caseRail.releasePointerCapture(e.pointerId);
      if (railMoved) {
        suppressChipClick = true;
        window.setTimeout(() => { suppressChipClick = false; }, 80);
      }
    };
    caseRail.addEventListener('pointerup', endRailDrag);
    caseRail.addEventListener('pointercancel', endRailDrag);
    caseRail.addEventListener('lostpointercapture', () => {
      railDragging = false;
      caseRail.classList.remove('is-dragging');
    });
    caseRail.addEventListener('click', e => {
      if (suppressChipClick) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      const chip = e.target.closest?.('.case-chip') || chipFromPoint(e.clientX, e.clientY);
      if (!chip) return;
      e.preventDefault();
      e.stopPropagation();
      activateZone(chip.dataset.zone);
    });
  }
  caseChips.forEach(chip=>chip.addEventListener('click',e=>{
    if (suppressChipClick) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    e.stopPropagation();
    activateZone(chip.dataset.zone);
  }));

  [autoBtn,redBtn,resetBtn].filter(Boolean).forEach(btn=>{
    btn.addEventListener('pointerdown',e=>e.stopPropagation());
    btn.addEventListener('click',e=>e.stopPropagation());
  });
  autoBtn?.addEventListener('click',()=>{autoRotate=!autoRotate;autoBtn.classList.toggle('is-on',autoRotate);autoBtn.setAttribute('aria-pressed',String(autoRotate));});
  redBtn?.addEventListener('click',()=>{showRed=!showRed;redBtn.classList.toggle('is-on',showRed);redBtn.setAttribute('aria-pressed',String(showRed));});
  resetBtn?.addEventListener('click',()=>{rotX=-.29;rotY=-.66;zoom=Math.max(42,Math.min(82,width/9.1));setModelMode('all');});

  let lastTime=performance.now();
  function animate(now){
    const dt=Math.min(40,now-lastTime);lastTime=now;
    if(autoRotate&&!dragging)rotY+=dt*.00006;
    render();requestAnimationFrame(animate);
  }

  const resizeObserver = new ResizeObserver(resizeCanvas);
  resizeObserver.observe(stage);
  resizeCanvas();
  setModelMode('all');
  requestAnimationFrame(animate);
})();
