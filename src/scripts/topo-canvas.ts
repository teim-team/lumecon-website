// Topographic map canvas animation for Hero section

// --- Map generation constants ---
const MOBILE_BREAKPOINT = 768;
const EDGE_OFFSET = -20;

const ROAD_COUNTS = { desktop: 14, mobile: 8 };
const BRANCH_COUNTS = { desktop: 38, mobile: 18 };
const TWIG1_COUNTS = { desktop: 75, mobile: 25 };
const TWIG2_COUNTS = { desktop: 140, mobile: 40 };
const TWIG3_COUNTS = { desktop: 230, mobile: 60 };
const FREE_DUST_COUNTS = { desktop: 25, mobile: 12 };
const GRID = { desktop: { x: 6, y: 5 }, mobile: { x: 4, y: 3 } };

// --- Animation timing ---
const FPS_INTERVAL = { desktop: 16, mobile: 33 }; // 60fps desktop, 30fps mobile
const TIME_STEP = 0.016;

// --- Road geometry ---
const MAIN_ROAD_SWAY = 70;
const MAIN_ROAD_SWAY_RANGE = 110;
const MAIN_ROAD_WIDTH_BASE = 1.8;
const MAIN_ROAD_WIDTH_RANGE = 1.6;
const MAIN_ROAD_OPACITY_BASE = 0.13;
const MAIN_ROAD_OPACITY_RANGE = 0.06;

const BRANCH_LENGTH_BASE = 50;
const BRANCH_LENGTH_RANGE = 150;
const BRANCH_ANGLE_BASE = 0.3;
const BRANCH_ANGLE_RANGE = 1.1;
const BRANCH_SNAP_DIST = 60;

// --- Building generation ---
const BUILDINGS_PER_CELL_BASE = 1;
const BUILDINGS_PER_CELL_RANGE = 2.5;
const BUILDING_SNAP_DIST = 80;
const BUILDING_CLUSTER_BASE = 4;
const BUILDING_CLUSTER_RANGE = 12;

// --- Dust / glow particles ---
const RIPPLE_RADIUS_BASE = 10;
const RIPPLE_RADIUS_RANGE = 22;
const RIPPLE_SPEED_BASE = 14;
const RIPPLE_SPEED_RANGE = 22;
const RIPPLE_OPACITY_BASE = 0.2;
const RIPPLE_OPACITY_RANGE = 0.2;
const GLOW_RADIUS_MULTIPLIER = 5;

// --- Colors ---
const BUILDING_FILL = 'rgba(255,252,247,0.022)';
const BUILDING_STROKE = 'rgba(255,252,247,0.042)';
const ROAD_COLOR_BASE = 'rgba(255,252,247,';
const DUST_COLOR = '196,154,60';
const DUST_CORE_COLOR = '255,245,220';

interface Point { x: number; y: number; }
interface Road { pts: Point[]; w: number; o: number; la: number; }
interface Building { pts: Point[]; cx: number; cy: number; }
interface Dust { x: number; y: number; sz: number; ph: number; bs: number; sh: number; it: number; lp: number; ls: number; cr: boolean; }
interface Ripple { x: number; y: number; r: number; mr: number; sp: number; op: number; }

export function initTopoCanvas() {
  const canvas = document.getElementById('topoCanvas') as HTMLCanvasElement;
  if (!canvas) return;
  const ctx = canvas.getContext('2d')!;
  const dpr = window.devicePixelRatio || 1;
  let W: number, H: number, t = 0;
  let roads: Road[] = [], buildings: Building[] = [], dust: Dust[] = [], ripples: Ripple[] = [];
  let isMobile = window.innerWidth < MOBILE_BREAKPOINT;
  let animId: number;
  let isVisible = true;

  document.addEventListener('visibilitychange', () => {
    isVisible = !document.hidden;
    if (isVisible && animId) draw();
  });

  function resize() {
    const rect = canvas.parentElement!.getBoundingClientRect();
    W = rect.width; H = rect.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildMap();
  }

  function pointOnSide(side: number): Point {
    switch (side) {
      case 0: return { x: Math.random() * W, y: EDGE_OFFSET };
      case 1: return { x: W - EDGE_OFFSET, y: Math.random() * H };
      case 2: return { x: Math.random() * W, y: H - EDGE_OFFSET };
      case 3: return { x: EDGE_OFFSET, y: Math.random() * H };
    }
    return { x: 0, y: 0 };
  }

  function createRoad(ax: number, ay: number, bx: number, by: number, sway: number, segments?: number): Point[] {
    const pts: Point[] = [];
    segments = segments || (6 + ~~(Math.random() * 4));
    const dx = bx - ax, dy = by - ay;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / len, ny = dx / len;
    let drift = 0;
    for (let i = 0; i <= segments; i++) {
      const frac = i / segments;
      let px = ax + dx * frac, py = ay + dy * frac;
      if (i > 0 && i < segments) {
        drift += (Math.random() - 0.5) * sway * 0.35;
        drift *= 0.8;
        const offset = drift + Math.sin(frac * Math.PI * 0.8) * sway * 0.25;
        px += nx * offset;
        py += ny * offset;
      }
      pts.push({ x: px, y: py });
    }
    return pts;
  }

  function drawSpline(pts: Point[]) {
    if (pts.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    if (pts.length === 2) { ctx.lineTo(pts[1].x, pts[1].y); ctx.stroke(); return; }
    for (let i = 1; i < pts.length - 1; i++) {
      const xc = (pts[i].x + pts[i + 1].x) / 2;
      const yc = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
    }
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.stroke();
  }

  function samplePoint(pts: Point[], frac: number): Point {
    if (pts.length < 2) return pts[0];
    let totalLen = 0;
    const segLens: number[] = [];
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i].x - pts[i - 1].x, dy = pts[i].y - pts[i - 1].y;
      segLens.push(Math.sqrt(dx * dx + dy * dy));
      totalLen += segLens[segLens.length - 1];
    }
    const target = frac * totalLen;
    let accum = 0;
    for (let i = 0; i < segLens.length; i++) {
      if (accum + segLens[i] >= target) {
        const local = (target - accum) / segLens[i];
        return { x: pts[i].x + (pts[i + 1].x - pts[i].x) * local, y: pts[i].y + (pts[i + 1].y - pts[i].y) * local };
      }
      accum += segLens[i];
    }
    return pts[pts.length - 1];
  }

  function sampleAngle(pts: Point[], frac: number): number {
    const a = samplePoint(pts, Math.max(0, frac - 0.02));
    const b = samplePoint(pts, Math.min(1, frac + 0.02));
    return Math.atan2(b.y - a.y, b.x - a.x);
  }

  function nearestRoad(px: number, py: number, maxDist: number): Point | null {
    let best: Point | null = null, bestDist = maxDist * maxDist;
    for (let i = 0; i < roads.length; i++) {
      const pts = roads[i].pts;
      for (let j = 0; j < pts.length; j++) {
        const dx = pts[j].x - px, dy = pts[j].y - py, d = dx * dx + dy * dy;
        if (d < bestDist) { bestDist = d; best = pts[j]; }
      }
    }
    return best;
  }

  const roadCount = isMobile ? ROAD_COUNTS.mobile : ROAD_COUNTS.desktop;
  const branchCount = isMobile ? BRANCH_COUNTS.mobile : BRANCH_COUNTS.desktop;
  const twig1Count = isMobile ? TWIG1_COUNTS.mobile : TWIG1_COUNTS.desktop;
  const twig2Count = isMobile ? TWIG2_COUNTS.mobile : TWIG2_COUNTS.desktop;
  const twig3Count = isMobile ? TWIG3_COUNTS.mobile : TWIG3_COUNTS.desktop;
  const gridX = isMobile ? GRID.mobile.x : GRID.desktop.x;
  const gridY = isMobile ? GRID.mobile.y : GRID.desktop.y;

  function buildMap() {
    roads = []; buildings = []; dust = []; ripples = [];

    // Main roads
    for (let i = 0; i < roadCount; i++) {
      const s1 = ~~(Math.random() * 4), s2 = (s1 + 1 + ~~(Math.random() * 2)) % 4;
      const a = pointOnSide(s1), b = pointOnSide(s2);
      roads.push({ pts: createRoad(a.x, a.y, b.x, b.y, MAIN_ROAD_SWAY + Math.random() * MAIN_ROAD_SWAY_RANGE), w: MAIN_ROAD_WIDTH_BASE + Math.random() * MAIN_ROAD_WIDTH_RANGE, o: MAIN_ROAD_OPACITY_BASE + Math.random() * MAIN_ROAD_OPACITY_RANGE, la: 1 });
    }

    // Branches
    const mainCount = roads.length;
    for (let i = 0; i < branchCount; i++) {
      const mr = roads[~~(Math.random() * mainCount)];
      const frac = 0.05 + Math.random() * 0.9;
      const p = samplePoint(mr.pts, frac);
      const angle = sampleAngle(mr.pts, frac) + (BRANCH_ANGLE_BASE + Math.random() * BRANCH_ANGLE_RANGE) * (Math.random() < 0.5 ? 1 : -1);
      const len = BRANCH_LENGTH_BASE + Math.random() * BRANCH_LENGTH_RANGE;
      let ex = p.x + Math.cos(angle) * len, ey = p.y + Math.sin(angle) * len;
      const snap = nearestRoad(ex, ey, BRANCH_SNAP_DIST);
      if (snap) { ex = snap.x; ey = snap.y; }
      roads.push({ pts: createRoad(p.x, p.y, ex, ey, 20 + Math.random() * 45, 4 + ~~(Math.random() * 3)), w: 0.7 + Math.random() * 0.8, o: 0.055 + Math.random() * 0.04, la: 2 });
    }

    // Twigs layer 1
    const layer2Count = roads.length;
    for (let i = 0; i < twig1Count; i++) {
      const sr = roads[~~(Math.random() * layer2Count)];
      const frac = Math.random();
      const p = samplePoint(sr.pts, frac);
      const angle = sampleAngle(sr.pts, frac) + (0.3 + Math.random() * 1.2) * (Math.random() < 0.5 ? 1 : -1);
      const len = 18 + Math.random() * 70;
      let ex = p.x + Math.cos(angle) * len, ey = p.y + Math.sin(angle) * len;
      const snap = nearestRoad(ex, ey, 35);
      if (snap) { ex = snap.x; ey = snap.y; }
      roads.push({ pts: createRoad(p.x, p.y, ex, ey, 8 + Math.random() * 20, 3 + ~~(Math.random() * 2)), w: 0.3 + Math.random() * 0.4, o: 0.03 + Math.random() * 0.03, la: 3 });
    }

    // Twigs layer 2
    const layer3Count = roads.length;
    for (let i = 0; i < twig2Count; i++) {
      const sr = roads[~~(Math.random() * layer3Count)];
      const frac = Math.random();
      const p = samplePoint(sr.pts, frac);
      const angle = Math.random() * Math.PI * 2;
      const len = 5 + Math.random() * 25;
      let ex = p.x + Math.cos(angle) * len, ey = p.y + Math.sin(angle) * len;
      const snap = nearestRoad(ex, ey, 20);
      if (snap) { ex = snap.x; ey = snap.y; }
      const mid = { x: (p.x + ex) / 2 + (Math.random() - 0.5) * 4, y: (p.y + ey) / 2 + (Math.random() - 0.5) * 4 };
      roads.push({ pts: [{ x: p.x, y: p.y }, mid, { x: ex, y: ey }], w: 0.2 + Math.random() * 0.2, o: 0.02 + Math.random() * 0.018, la: 4 });
    }

    // Twigs layer 3
    for (let i = 0; i < twig3Count; i++) {
      const sr = roads[~~(Math.random() * roads.length)];
      const frac = Math.random();
      const p = samplePoint(sr.pts, frac);
      const angle = Math.random() * Math.PI * 2;
      const len = 3 + Math.random() * 14;
      let ex = p.x + Math.cos(angle) * len, ey = p.y + Math.sin(angle) * len;
      const snap = nearestRoad(ex, ey, 12);
      if (snap) { ex = snap.x; ey = snap.y; }
      roads.push({ pts: [{ x: p.x, y: p.y }, { x: ex, y: ey }], w: 0.1 + Math.random() * 0.12, o: 0.012 + Math.random() * 0.012, la: 5 });
    }

    // Buildings
    const cellW = W / gridX, cellH = H / gridY;
    for (let gy = 0; gy < gridY; gy++) for (let gx = 0; gx < gridX; gx++) {
      const numClusters = BUILDINGS_PER_CELL_BASE + ~~(Math.random() * BUILDINGS_PER_CELL_RANGE);
      for (let cc = 0; cc < numClusters; cc++) {
        let cx = gx * cellW + Math.random() * cellW, cy = gy * cellH + Math.random() * cellH;
        const snap = nearestRoad(cx, cy, BUILDING_SNAP_DIST);
        if (snap) { cx = snap.x + (Math.random() - 0.5) * 25; cy = snap.y + (Math.random() - 0.5) * 25; }
        const clusterAngle = Math.random() * Math.PI;
        const numBuildings = BUILDING_CLUSTER_BASE + ~~(Math.random() * BUILDING_CLUSTER_RANGE);
        let ux = cx, uy = cy;
        for (let bb = 0; bb < numBuildings; bb++) {
          const bw = 3 + Math.random() * 16, bh = 2 + Math.random() * 11;
          const ba = clusterAngle + (Math.random() - 0.5) * 0.4;
          const cosA = Math.cos(ba), sinA = Math.sin(ba);
          const jitter = () => (Math.random() - 0.5) * 1.2;
          const pts = [
            { x: ux + jitter(), y: uy + jitter() },
            { x: ux + cosA * bw + jitter(), y: uy + sinA * bw + jitter() },
            { x: ux + cosA * bw - sinA * bh + jitter(), y: uy + sinA * bw + cosA * bh + jitter() },
            { x: ux - sinA * bh + jitter(), y: uy + cosA * bh + jitter() },
          ];
          const bcx = ux + cosA * bw * 0.5 - sinA * bh * 0.5;
          const bcy = uy + sinA * bw * 0.5 + cosA * bh * 0.5;
          buildings.push({ pts, cx: bcx, cy: bcy });
          const r2 = Math.random();
          if (r2 < 0.4) { ux += cosA * (bw + 1) + (Math.random() - 0.5) * 2; uy += sinA * (bw + 1) + (Math.random() - 0.5) * 2; }
          else if (r2 < 0.7) { ux += -sinA * (bh + 1) + (Math.random() - 0.5) * 2; uy += cosA * (bh + 1) + (Math.random() - 0.5) * 2; }
          else { ux += cosA * bw * 0.5 - sinA * (bh + 1) + (Math.random() - 0.5) * 3; uy += sinA * bw * 0.5 + cosA * (bh + 1) + (Math.random() - 0.5) * 3; }
        }
      }
    }

    // Dust particles
    for (let i = 0; i < buildings.length; i++) {
      const bld = buildings[i];
      const density = Math.random();
      let numDust: number;
      if (density > 0.87) numDust = 12 + ~~(Math.random() * 20);
      else if (density > 0.5) numDust = 3 + ~~(Math.random() * 7);
      else if (density > 0.2) numDust = 1 + ~~(Math.random() * 2);
      else numDust = 0;
      for (let d = 0; d < numDust; d++) {
        const spread = density > 0.87 ? 1.5 + Math.random() * 3 : 1 + Math.random() * 5;
        dust.push({ x: bld.cx + (Math.random() - 0.5) * spread * 2, y: bld.cy + (Math.random() - 0.5) * spread * 2, sz: 0.3 + Math.random() * 1.1, ph: Math.random() * Math.PI * 2, bs: 0.3 + Math.random() * 2.5, sh: 0.8 + Math.random() * 2, it: 0.4 + Math.random() * 0.6, lp: Math.random() * Math.PI * 2, ls: 0.03 + Math.random() * 0.12, cr: density > 0.87 && Math.random() < 0.1 });
      }
    }
    const freeDust = isMobile ? FREE_DUST_COUNTS.mobile : FREE_DUST_COUNTS.desktop;
    for (let i = 0; i < freeDust; i++) {
      dust.push({ x: Math.random() * W, y: Math.random() * H, sz: 0.2 + Math.random() * 0.5, ph: Math.random() * Math.PI * 2, bs: 0.2 + Math.random(), sh: 1, it: 0.1 + Math.random() * 0.2, lp: Math.random() * Math.PI * 2, ls: 0.02 + Math.random() * 0.06, cr: false });
    }
  }

  function spawnRipple(rx: number, ry: number) {
    ripples.push({ x: rx, y: ry, r: 0, mr: RIPPLE_RADIUS_BASE + Math.random() * RIPPLE_RADIUS_RANGE, sp: RIPPLE_SPEED_BASE + Math.random() * RIPPLE_SPEED_RANGE, op: RIPPLE_OPACITY_BASE + Math.random() * RIPPLE_OPACITY_RANGE });
  }

  let lastFrame = 0;
  let targetInterval = isMobile ? FPS_INTERVAL.mobile : FPS_INTERVAL.desktop;

  function draw(timestamp?: number) {
    if (!isVisible) return;
    animId = requestAnimationFrame(draw);
    if (timestamp && timestamp - lastFrame < targetInterval) return;
    lastFrame = timestamp || 0;

    t += TIME_STEP;
    ctx.clearRect(0, 0, W, H);

    // Buildings
    for (let i = 0; i < buildings.length; i++) {
      const bl = buildings[i].pts;
      ctx.beginPath(); ctx.moveTo(bl[0].x, bl[0].y);
      for (let j = 1; j < bl.length; j++) ctx.lineTo(bl[j].x, bl[j].y);
      ctx.closePath();
      ctx.fillStyle = BUILDING_FILL; ctx.fill();
      ctx.strokeStyle = BUILDING_STROKE; ctx.lineWidth = 0.3; ctx.stroke();
    }

    // Roads (back to front by layer)
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let la = 5; la >= 1; la--) for (let i = 0; i < roads.length; i++) {
      const r = roads[i]; if (r.la !== la) continue;
      ctx.lineWidth = r.w; ctx.strokeStyle = ROAD_COLOR_BASE + r.o + ')';
      drawSpline(r.pts);
    }

    // Ripples
    for (let i = ripples.length - 1; i >= 0; i--) {
      const rp = ripples[i]; rp.r += rp.sp * TIME_STEP;
      const life = rp.r / rp.mr;
      if (life > 1) { ripples.splice(i, 1); continue; }
      ctx.beginPath(); ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(' + DUST_COLOR + ',' + (rp.op * (1 - life) * (1 - life)) + ')';
      ctx.lineWidth = 0.8 * (1 - life * 0.5); ctx.stroke();
    }

    // Dust / glow
    for (let i = 0; i < dust.length; i++) {
      const d = dust[i];
      const lifeCycle = Math.sin(t * d.ls + d.lp);
      if (lifeCycle < 0) continue;
      const raw = (Math.sin(t * d.bs + d.ph) + 1) * 0.5;
      const blink = Math.pow(raw, d.sh);
      const brightness = d.it * blink * lifeCycle;
      if (brightness < 0.01) continue;
      const sz = d.sz * (0.7 + blink * 0.3);
      if (d.cr && blink > 0.9 && Math.random() < 0.003) spawnRipple(d.x, d.y);
      if (brightness > 0.3 && sz > 0.6) {
        const glowR = sz * GLOW_RADIUS_MULTIPLIER;
        const gd = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, glowR);
        gd.addColorStop(0, 'rgba(' + DUST_COLOR + ',' + (brightness * 0.12) + ')');
        gd.addColorStop(1, 'rgba(' + DUST_COLOR + ',0)');
        ctx.beginPath(); ctx.arc(d.x, d.y, glowR, 0, Math.PI * 2);
        ctx.fillStyle = gd; ctx.fill();
      }
      ctx.beginPath(); ctx.arc(d.x, d.y, sz, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + DUST_COLOR + ',' + brightness + ')'; ctx.fill();
      if (brightness > 0.5) {
        ctx.beginPath(); ctx.arc(d.x, d.y, sz * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + DUST_CORE_COLOR + ',' + (brightness * 0.5) + ')'; ctx.fill();
      }
    }
  }

  window.addEventListener('resize', () => {
    isMobile = window.innerWidth < MOBILE_BREAKPOINT;
    targetInterval = isMobile ? FPS_INTERVAL.mobile : FPS_INTERVAL.desktop;
    resize();
  });
  resize();
  draw();
  document.getElementById('heroPanel')!.addEventListener('click', () => { buildMap(); });
}
