/**
 * Choropleth + overlay rendering for the hero map: spillover share
 * computation, region tinting, value chips, and flow lines. These
 * functions take the stage element (or look up their own SVG layer)
 * and hold no state between calls.
 */
import { seededRandom } from './anim';
import {
  FLOW_CURVATURE,
  JITTER_MIN,
  JITTER_RANGE,
  SHARE_BOOST_POWER,
  SHARE_BOOST_THRESHOLD,
  SVG_NS,
} from './constants';

/**
 * Distribute the indirect+induced spillover across neighboring
 * regions with distance decay, normalized so shares sum to 1.
 *
 * Seeded by the source coordinates so the same study always
 * shows the same neighbor pattern. This is illustrative, not a
 * real input-output computation, but it stays deterministic so
 * running the same study twice doesn't shuffle the map.
 *
 * @param srcCx Source X in SVG coords.
 * @param srcCy Source Y in SVG coords.
 * @param regions Candidate regions to spread spillover across.
 * @param topN Keep the top-N strongest neighbors only.
 * @param decay Distance-decay exponent. Higher = tighter falloff.
 * @param seedSalt Optional salt for the deterministic jitter.
 * @returns Map of regionId → share (0..1) summing to 1.
 */
export const computeShares = (
  srcCx: number,
  srcCy: number,
  regions: Array<{ id: string; cx: number; cy: number }>,
  topN: number,
  decay: number = 1.6,
  seedSalt: number = 0,
): Map<string, number> => {
  // Deterministic jitter so neighbors don't fall in perfect rings
  const rand = seededRandom(Math.floor(srcCx * 911 + srcCy * 113 + seedSalt));
  const scored = regions
    .filter((r) => r.id !== '' && Number.isFinite(r.cx) && Number.isFinite(r.cy))
    .map((r) => {
      const dx = r.cx - srcCx;
      const dy = r.cy - srcCy;
      const d = Math.hypot(dx, dy);
      // distance decay + slight per-region jitter so it doesn't
      // look like an exact concentric ring
      const w = (1 / Math.pow(d + 40, decay)) * (JITTER_MIN + rand() * JITTER_RANGE);
      return { id: r.id, w, d };
    })
    .sort((a, b) => b.w - a.w)
    .slice(0, topN);
  const sum = scored.reduce((s, r) => s + r.w, 0) || 1;
  const out = new Map<string, number>();
  for (const r of scored) out.set(r.id, r.w / sum);
  return out;
};

/**
 * Apply a choropleth tint by writing the boosted share value into
 * `--impact-share` and `data-impact` on each matching region. CSS
 * handles the fill-opacity scaling.
 *
 * @param stage The hero stage element containing the region layers.
 * @param shares Output of computeShares() (regionId → 0..1).
 * @param selector CSS selector for the region layer (e.g. `.hero-state`).
 */
export const applyChoropleth = (
  stage: HTMLElement,
  shares: Map<string, number>,
  selector: string,
) => {
  // Clear old impact tints first
  stage.querySelectorAll<HTMLElement>(`${selector}[data-impact]`).forEach((el) => {
    el.removeAttribute('data-impact');
    el.style.removeProperty('--impact-share');
  });
  shares.forEach((share, id) => {
    const el = stage.querySelector<HTMLElement>(`${selector}[data-id="${id}"]`);
    if (el) {
      // Boost the small shares so the dimmest neighbors don't
      // disappear. share is 0..~.35 typically; boost to 0..1.
      const boosted = Math.min(1, Math.pow(share / SHARE_BOOST_THRESHOLD, SHARE_BOOST_POWER));
      el.dataset.impact = String(Math.round(boosted * 100));
      el.style.setProperty('--impact-share', String(boosted.toFixed(3)));
    }
  });
};

export const clearChoropleth = (stage: HTMLElement) => {
  stage
    .querySelectorAll<HTMLElement>('.hero-state[data-impact], .hero-county[data-impact]')
    .forEach((el) => {
      el.removeAttribute('data-impact');
      el.style.removeProperty('--impact-share');
    });
};

/**
 * Render value chips on the top-N impacted regions. Each chip is
 * a small pill placed near the region centroid with a thin leader
 * line back to the centroid. Values render in $K/M with the
 * type-of-effect label so a viewer reading the chip immediately
 * knows what it's measuring.
 *
 * Collision-aware: tries 8 candidate offsets per chip and picks
 * the first non-overlapping placement.
 *
 * @param top Top-impacted regions plus the source as kind: 'local'.
 * @param src Source point used to bias chip placement away from
 *   the source's NE callout.
 */
export const renderValueChips = (
  top: Array<{
    id: string;
    cx: number;
    cy: number;
    amount: number;
    label: string;
    name: string;
    kind?: 'local' | 'leak';
  }>,
  src: { cx: number; cy: number },
) => {
  const vlayer = document.getElementById('heroValueLayer');
  if (!vlayer) return;
  vlayer.innerHTML = '';
  const fmt = (n: number) => {
    if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1) + 'M';
    if (n >= 1_000) return '$' + Math.round(n / 1_000) + 'K';
    return '$' + Math.round(n);
  };
  const placed: Array<{ x: number; y: number; w: number; h: number }> = [];
  const collides = (x: number, y: number, w: number, h: number) =>
    placed.some(
      (p) => !(x + w < p.x - 4 || x - 4 > p.x + p.w || y + h < p.y - 4 || y - 4 > p.y + p.h),
    );
  const offsets = [
    [22, -18],
    [-22, -18],
    [22, 18],
    [-22, 18],
    [32, 0],
    [-32, 0],
    [0, -24],
    [0, 24],
  ];
  for (const r of top) {
    const isLocal = r.kind === 'local';
    // Local chip prefers the SW position so it doesn't collide
    // with the source spark / callout sitting NE of the centroid.
    const fromSrcX = isLocal ? -1 : Math.sign(r.cx - src.cx) || 1;
    const fromSrcY = isLocal ? 1 : Math.sign(r.cy - src.cy) || -1;
    const sortedOffsets = [...offsets].sort(
      (a, b) =>
        Math.abs(Math.sign(a[0]) - fromSrcX) +
        Math.abs(Math.sign(a[1]) - fromSrcY) -
        (Math.abs(Math.sign(b[0]) - fromSrcX) + Math.abs(Math.sign(b[1]) - fromSrcY)),
    );
    const labelText = isLocal ? `${r.name} ${fmt(r.amount)} local` : `${r.name} ${fmt(r.amount)}`;
    const fontPx = isLocal ? 11 : 9.5;
    const chipH = isLocal ? 14 : 12;
    const chipW = Math.max(48, labelText.length * (fontPx * 0.55) + 10);
    let cx2 = r.cx + sortedOffsets[0][0];
    let cy2 = r.cy + sortedOffsets[0][1];
    for (const o of sortedOffsets) {
      const tx = r.cx + o[0];
      const ty = r.cy + o[1];
      if (!collides(tx - chipW / 2, ty - chipH / 2, chipW, chipH)) {
        cx2 = tx;
        cy2 = ty;
        break;
      }
    }
    placed.push({ x: cx2 - chipW / 2, y: cy2 - chipH / 2, w: chipW, h: chipH });

    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('class', 'hero-value-chip');
    if (isLocal) g.setAttribute('data-kind', 'local');
    const leader = document.createElementNS(SVG_NS, 'path');
    leader.setAttribute('class', 'hero-value-chip__leader');
    leader.setAttribute('d', `M ${r.cx} ${r.cy} L ${cx2} ${cy2}`);
    g.appendChild(leader);
    const bg = document.createElementNS(SVG_NS, 'rect');
    bg.setAttribute('class', 'hero-value-chip__bg');
    bg.setAttribute('x', String(cx2 - chipW / 2));
    bg.setAttribute('y', String(cy2 - chipH / 2));
    bg.setAttribute('width', String(chipW));
    bg.setAttribute('height', String(chipH));
    bg.setAttribute('rx', '2.5');
    bg.setAttribute('ry', '2.5');
    g.appendChild(bg);
    const txt = document.createElementNS(SVG_NS, 'text');
    txt.setAttribute('class', 'hero-value-chip__txt');
    txt.setAttribute('x', String(cx2));
    txt.setAttribute('y', String(cy2 + 0.4));
    txt.textContent = labelText;
    g.appendChild(txt);
    vlayer.appendChild(g);
  }
};

/**
 * Render curved flow lines from the source to each top-impacted
 * region. Stroke width scales with magnitude; the curve uses a
 * perpendicular offset (see FLOW_CURVATURE) so multiple lines
 * fan out instead of stacking on top of each other.
 *
 * @param top Top-impacted regions with target coords + amounts.
 * @param src Source point — origin of every flow line.
 * @param maxAmount Used to normalize stroke widths.
 */
export const renderFlowLines = (
  top: Array<{ cx: number; cy: number; amount: number }>,
  src: { cx: number; cy: number },
  maxAmount: number,
) => {
  const flowLayer = document.getElementById('heroFlowLayer');
  if (!flowLayer) return;
  flowLayer.innerHTML = '';
  for (const r of top) {
    const dx = r.cx - src.cx;
    const dy = r.cy - src.cy;
    const dist = Math.hypot(dx, dy);
    // Curve control point: perpendicular offset proportional to distance
    const midX = (src.cx + r.cx) / 2;
    const midY = (src.cy + r.cy) / 2;
    const perpX = -dy / dist;
    const perpY = dx / dist;
    const curvature = dist * FLOW_CURVATURE;
    const cpX = midX + perpX * curvature;
    const cpY = midY + perpY * curvature;
    const d = `M ${src.cx} ${src.cy} Q ${cpX} ${cpY} ${r.cx} ${r.cy}`;
    // Approximate path length for the stroke-dash animation
    const approxLen = dist + curvature;
    const w = Math.max(0.6, Math.min(2.2, (r.amount / maxAmount) * 2));
    const p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('class', 'hero-flow-line');
    p.setAttribute('d', d);
    p.setAttribute('stroke-width', String(w.toFixed(2)));
    p.style.setProperty('--len', String(Math.round(approxLen)));
    flowLayer.appendChild(p);
  }
};
