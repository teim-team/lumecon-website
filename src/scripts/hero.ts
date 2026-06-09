/**
 * Hero map runtime — orchestrator.
 *
 * Lives in its own module (rather than inline inside Hero.astro) so the
 * map logic is grep-able, navigable in IDEs with type-aware tooling,
 * and easier to refactor without scrolling past the static markup.
 *
 * Loaded from Hero.astro via a one-line bridge:
 *     <script>import '../scripts/hero.ts';</script>
 * Astro/Vite picks the import up, bundles it, and emits a single
 * content-hashed JS file the browser can cache across page loads.
 *
 * The supporting modules live in ./hero/:
 *   - data.ts               JSON data contract with Hero.astro
 *   - constants.ts          tuning constants
 *   - anim.ts               easing / number-ticker / RNG primitives
 *   - map-render.ts         choropleth, value chips, flow lines
 *   - zoom.ts               viewBox zoom tween
 *   - scheduler.ts          auto-cycle pause/timer state
 *   - figure-explainers.ts  per-figure metric info panels
 *   - search.ts             workspace geography search
 *
 * This module owns the study lifecycle (runStudy / runScene), the
 * reservation + county highlight logic, the lazy polygon loaders, and
 * all map event wiring.
 */
import { fmt, tickInt, tickTo, wait } from './hero/anim';
import {
  CHOROPLETH_DECAY,
  COUNTY_OVERLAP_PAD,
  RESERVATION_HIGHLIGHT_MAX_DIST,
  SOURCE_BASE_R,
  SVG_NS,
} from './hero/constants';
import {
  ACTIVITIES,
  AMOUNTS,
  LEVEL_POOLS,
  countyCentroids,
  states,
  tribalLookup,
} from './hero/data';
import { initFigureExplainers } from './hero/figure-explainers';
import {
  applyChoropleth,
  clearChoropleth,
  computeShares,
  renderFlowLines,
  renderValueChips,
} from './hero/map-render';
import { createLevelRotation, createStudyCycle } from './hero/scheduler';
import { initSearch } from './hero/search';
import type { RunOpts } from './hero/types';
import { createZoom } from './hero/zoom';
import { SCENES } from '../data/scenes';
import { trackEvent } from '../lib/observability';

const stage = document.getElementById('heroStage') as HTMLElement | null;
const tooltip = document.getElementById('heroTooltip') as HTMLElement | null;
const ttName = document.getElementById('ttName');
const ttHint = document.getElementById('ttHint');
const source = document.getElementById('heroSource');
const figD = document.getElementById('figDirect');
const figI = document.getElementById('figIndirect');
const figU = document.getElementById('figInduced');
const figT = document.getElementById('figTotal');
const figJ = document.getElementById('figJobs');
const figTotalCell = document.getElementById('figTotalCell');
const figJobsCell = document.getElementById('figJobsCell');

if (stage && source && figD && figI && figU && figT && figJ && tooltip && ttName) {
  /* Light only the source state. Indirect (supply chain) and induced
     (household) effects don't have a clean geographic story at this
     resolution: indirect spreads to wherever suppliers are, induced
     is mostly local where workers live. The expanding ripple circles
     below are an abstract metaphor; the table beneath the map is
     where the actual breakdown lives. */
  const lightSource = (id: string) => {
    stage.querySelectorAll<HTMLElement>('.hero-state').forEach((el) => {
      if (el.dataset.id === id) el.dataset.ring = '0';
      else el.removeAttribute('data-ring');
    });
  };

  const svgEl = document.getElementById('heroMap') as unknown as SVGSVGElement | null;
  const { zoomTo, zoomOut } = createZoom(svgEl);

  const clearDetail = () => {
    ['heroFlowLayer', 'heroValueLayer'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '';
    });
    clearChoropleth(stage);
  };

  /**
   * Position the source dot + halo + ring + glow at (cx, cy). All
   * four circles share the same center so they're moved together.
   */
  const moveSource = (cx: number, cy: number) => {
    source.querySelectorAll<SVGCircleElement>('circle').forEach((c) => {
      c.setAttribute('cx', String(cx));
      c.setAttribute('cy', String(cy));
    });
  };

  /**
   * Scale the source dot + halo + ring + glow uniformly. Used to
   * shrink the source for tighter geographies (county / reservation)
   * so the dot doesn't swamp the polygon being studied.
   *
   * @param scale Multiplier applied to each circle's base radius.
   */
  const scaleSource = (scale: number) => {
    source.querySelectorAll<SVGCircleElement>('circle').forEach((c) => {
      for (const cls of Array.from(c.classList)) {
        const base = SOURCE_BASE_R[cls];
        if (base != null) {
          c.setAttribute('r', String(+(base * scale).toFixed(2)));
          break;
        }
      }
    });
  };

  /* ---------- run a study ---------- */
  let runId = 0;

  const runStudy = async (stateId: string, opts?: RunOpts) => {
    runId += 1;
    const me = runId;
    const s = states[stateId];
    if (!s) return;

    const studyIdEl = document.getElementById('workspaceStudyId');
    if (studyIdEl) studyIdEl.textContent = `STUDY ${String(runId).padStart(3, '0')}`;

    const level: 'state' | 'county' | 'reservation' =
      opts?.level ?? (opts?.sourcePoint ? 'reservation' : 'state');

    // Expose this run's multipliers on the stage so the per-figure
    // explanations can read them without re-deriving anything.
    if (opts?.activity) {
      stage.dataset.actIndirect = String(opts.activity.indirect);
      stage.dataset.actInduced = String(opts.activity.induced);
      stage.dataset.actJobspm = String(opts.activity.jobsPerM);
      stage.dataset.actLabel = opts.activity.label;
    }
    stage.dataset.studyLevel = level;

    const activity = opts?.activity ?? ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)];
    const amount = opts?.amount ?? AMOUNTS[1 + Math.floor(Math.random() * (AMOUNTS.length - 1))];
    const src = opts?.sourcePoint ?? { cx: s.cx, cy: s.cy };

    stage.dataset.run = '';
    stage.dataset.ring = '';
    figTotalCell?.classList.remove('is-filled');
    figJobsCell?.classList.remove('is-filled');
    [figD, figI, figU, figT, figJ].forEach((el) => {
      if (el) el.textContent = '-';
    });

    // Clear any prior value labels + callout
    const vlayer = document.getElementById('heroValueLayer');
    if (vlayer) vlayer.innerHTML = '';
    const callout = document.getElementById('heroSourceCallout');
    if (callout) callout.classList.remove('is-on');

    lightSource(stateId);
    moveSource(src.cx, src.cy);
    clearDetail();
    stage.dataset.run = '1';
    stage.dataset.zoom = '1';

    /* Two-tier retention. Most of an EI study's multiplier stays
       inside the source REGION (high Regional Purchase Coefficient).
       Of what does leave the source region, the bulk stays in the
       source STATE (containing-county and containing-state suppliers
       / workers); only a smaller residual crosses state lines.

       This nests the way real interregional IO models work: an FLQ-
       adjusted county multiplier is lower than its state multiplier,
       which is in turn lower than the national multiplier. The
       delta at each level is "leakage upward".

       The smaller the source region, the more leakage at the first
       tier (source-region → containing state). Reservations leak
       the most off-reservation because few have a deep local supply
       chain or workforce living on-reservation, and the indirect
       portion (specialized suppliers) often crosses state lines. */
    // What fraction of the spillover stays inside the source REGION
    // (state for state studies, county for county studies, reservation
    // for reservation studies).
    const REGION_RETENTION = { state: 0.82, county: 0.58, reservation: 0.32 } as const;
    // Of what leaves the source region, what fraction stays inside
    // the source STATE (i.e., other counties / off-reservation in the
    // same state). For state studies this is 0 by definition.
    const ESCAPE_TO_STATE = { state: 0, county: 0.72, reservation: 0.62 } as const;

    const spilloverTotal = amount.v * (activity.indirect + activity.induced);
    const localToRegion = spilloverTotal * REGION_RETENTION[level];
    const beyondRegion = spilloverTotal - localToRegion;
    const inStateOffRegion = beyondRegion * ESCAPE_TO_STATE[level];
    const externalSpillover = beyondRegion - inStateOffRegion;
    const totalLocal = amount.v + localToRegion + inStateOffRegion;

    // Distance-decay distribution across non-source states. Sharp
    // decay (2.2) so leakage concentrates in the adjacent states
    // instead of dispersing nationally — geographic embeddedness,
    // the same logic FLQ + interregional IO formalise.
    const statePool = Object.entries(states)
      .filter(([id]) => id !== stateId)
      .map(([id, st]) => ({ id, cx: st.cx, cy: st.cy, name: (st.code || st.name).slice(0, 12) }));
    const tintN = level === 'state' ? 6 : level === 'county' ? 8 : 10;
    const chipN = level === 'state' ? 3 : level === 'county' ? 3 : 4;
    const tintShares = computeShares(src.cx, src.cy, statePool, tintN, CHOROPLETH_DECAY, runId);
    applyChoropleth(stage, tintShares, '.hero-state');
    const topShares = Array.from(tintShares.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, chipN);
    const chipData = topShares.map(([id, share]) => {
      const region = statePool.find((r) => r.id === id)!;
      return {
        id,
        cx: region.cx,
        cy: region.cy,
        amount: share * externalSpillover,
        label: 'spillover',
        name: region.name,
      };
    });
    const maxChipAmount = chipData[0]?.amount ?? 1;
    // Inject a "local retention" chip on the source state showing
    // the bulk-stays-local story. This is the chip a reader sees
    // first; the smaller neighbor chips represent the leakage.
    const sourceChip = {
      id: stateId,
      cx: s.cx,
      cy: s.cy,
      amount: totalLocal,
      label: 'local',
      name: (s.code || s.name).slice(0, 12),
      kind: 'local' as const,
    };
    renderValueChips([sourceChip, ...chipData], src);
    renderFlowLines(chipData, src, maxChipAmount);

    // Zoom strategy per level. Each tier crops to the geography
    // that's actually being studied, with enough surrounding context
    // to keep the choropleth + adjacent-state chips visible.
    // State studies: regional crop showing the source state and a
    // handful of nearest neighbors. County: smaller crop showing the
    // source state + edges of adjacent ones. Reservation: tightest
    // crop on the polygon itself.
    const zoomSpan = level === 'state' ? 700 : level === 'county' ? 320 : 160;
    const srcScale = level === 'state' ? 0.75 : level === 'county' ? 0.45 : 0.26;
    scaleSource(srcScale);
    zoomTo(src.cx, src.cy, zoomSpan);

    const wsStatus = document.getElementById('workspaceStatus');
    const wsLabel = document.getElementById('workspaceStatusLabel');
    const wsRegion = document.getElementById('workspaceRegion');
    const wsActivity = document.getElementById('workspaceActivity');
    if (wsStatus) wsStatus.dataset.state = 'running';
    if (wsLabel) wsLabel.textContent = 'Running';
    const chipText = opts?.chip ?? `${amount.label} ${activity.label} in ${s.name}`;
    // The header region shows the full chip (LEVEL · Project · Location ·
    // year); #workspaceActivity is a visually-hidden duplicate that keeps
    // screen readers announcing each new study.
    if (wsRegion) wsRegion.textContent = chipText;
    if (wsActivity) {
      wsActivity.textContent = chipText;
    }

    // Source callout: pin the region name next to the source dot
    const calloutEl = document.getElementById('heroSourceCallout');
    if (calloutEl) {
      const leader = calloutEl.querySelector<SVGLineElement>('.hero-callout__leader');
      const bg = calloutEl.querySelector<SVGRectElement>('.hero-callout__bg');
      const txt = calloutEl.querySelector<SVGTextElement>('.hero-callout__txt');
      if (leader && bg && txt) {
        txt.textContent = s.name;
        const tx = src.cx + 18;
        const ty = src.cy - 18;
        const w = s.name.length * 6.6 + 16;
        bg.setAttribute('x', String(tx));
        bg.setAttribute('y', String(ty - 11));
        bg.setAttribute('width', String(w));
        txt.setAttribute('x', String(tx + 8));
        txt.setAttribute('y', String(ty));
        leader.setAttribute('x1', String(src.cx));
        leader.setAttribute('y1', String(src.cy));
        leader.setAttribute('x2', String(tx));
        leader.setAttribute('y2', String(ty));
        calloutEl.classList.add('is-on');
      }
    }

    if (runId !== me) return;

    stage.dataset.ring = '1';
    await wait(550);
    tickTo(figD as HTMLElement, amount.v, '', 950);
    await wait(1900);
    if (runId !== me) return;
    stage.dataset.ring = '2';
    const indirect = amount.v * activity.indirect;
    tickTo(figI as HTMLElement, indirect, '+ ', 950);

    await wait(2000);
    if (runId !== me) return;
    stage.dataset.ring = '3';
    const induced = amount.v * activity.induced;
    tickTo(figU as HTMLElement, induced, '+ ', 950);

    await wait(2000);
    if (runId !== me) return;
    stage.dataset.ring = '4';
    const total = amount.v + indirect + induced;
    const jobs = Math.round((total / 1_000_000) * activity.jobsPerM);
    figTotalCell?.classList.add('is-filled');
    figJobsCell?.classList.add('is-filled');
    tickTo(figT as HTMLElement, total, '', 1150);
    tickInt(figJ as HTMLElement, jobs, '≈ ', 950);

    const wsStatusDone = document.getElementById('workspaceStatus');
    const wsLabelDone = document.getElementById('workspaceStatusLabel');
    if (wsStatusDone) wsStatusDone.dataset.state = 'complete';
    if (wsLabelDone) wsLabelDone.textContent = 'Complete';

    // After a beat in the detail view, return to overview so the
    // visitor sees the full map again before the next study fires.
    await wait(2400);
    if (runId !== me) return;
    stage.dataset.zoom = '';
    clearDetail();
    await zoomOut();
  };

  /* Run a single scene. State and county scenes use the state centroid;
     reservation scenes resolve to a tribal-land centroid pulled from
     the AIANNH lookup so the source point lands on the actual polygon.
     Multi-region highlight: the state always lights up (via runStudy's
     lightSource), the county lights up when scene.countyFips is set,
     and the reservation polygon lights up by tribal name match.

     Scene state is deliberately NOT encoded in the homepage URL hash;
     shareable scenes live at /demo/<slug>, which are real, prerendered,
     SEO-indexed URLs. */
  let pendingReservationTribalKey: string | undefined;
  const clearReservationHighlight = () => {
    stage.querySelectorAll<HTMLElement>('.hero-aiannh[data-active="1"]').forEach((el) => {
      el.removeAttribute('data-active');
    });
  };
  /**
   * Pick the AIANNH polygon that best represents the currently
   * pending reservation scene and highlight it (plus any counties
   * whose bbox overlaps).
   *
   * Selection order:
   *   1. Loose name match (multiple polygons can share fragments
   *      like "Choctaw"), broken by distance to the tribalLookup
   *      centroid (closest to the source dot wins).
   *   2. Fallback: nearest polygon within RESERVATION_HIGHLIGHT_MAX_DIST.
   *
   * @returns true if a polygon was highlighted, false otherwise.
   */
  const applyReservationHighlight = () => {
    if (!pendingReservationTribalKey) return false;
    const t = tribalLookup[pendingReservationTribalKey];
    if (!t) return false;
    const short = t.name.toLowerCase();
    const candidates = Array.from(stage.querySelectorAll<SVGGraphicsElement>('.hero-aiannh'));
    if (!candidates.length) return false;

    const dist = (el: SVGGraphicsElement) => {
      try {
        const bb = el.getBBox();
        const cx = bb.x + bb.width / 2;
        const cy = bb.y + bb.height / 2;
        return Math.hypot(cx - t.cx, cy - t.cy);
      } catch {
        // getBBox() throws if the polygon isn't rendered; rank it last.
        return Infinity;
      }
    };

    const nameMatches: SVGGraphicsElement[] = [];
    for (const el of candidates) {
      const dname = (el.dataset.name || '').toLowerCase();
      const dshort = (el.dataset.short || '').toLowerCase();
      if (!dshort && !dname) continue;
      if (dshort.includes(short) || dname.includes(short) || short.includes(dshort || '___')) {
        nameMatches.push(el);
      }
    }

    // Highlight is only meaningful if the chosen polygon is close
    // to where the source dot lives — see RESERVATION_HIGHLIGHT_MAX_DIST.
    let best: SVGGraphicsElement | null = null;
    let bestDist = Infinity;
    if (nameMatches.length) {
      // Among name matches, pick the one closest to the source.
      for (const el of nameMatches) {
        const d = dist(el);
        if (d < bestDist) {
          bestDist = d;
          best = el;
        }
      }
    } else {
      // No name match — accept the nearest polygon if it's close.
      for (const el of candidates) {
        const d = dist(el);
        if (d < bestDist) {
          bestDist = d;
          best = el;
        }
      }
    }
    if (best && bestDist <= RESERVATION_HIGHLIGHT_MAX_DIST) {
      best.setAttribute('data-active', '1');
      // Recenter the source dot on the polygon's actual bbox center.
      // The tribalLookup centroid is from Census TIGER/Line interior
      // points and can drift a few units off the visual center of
      // the us-atlas polygon; this snaps the dot onto the polygon
      // the viewer is actually looking at.
      try {
        const bb = best.getBBox();
        const px = bb.x + bb.width / 2;
        const py = bb.y + bb.height / 2;
        moveSource(px, py);
      } catch {
        // getBBox() throws if the polygon isn't rendered; keep the
        // lookup centroid in that case.
      }
      highlightCountiesOverlappingAiannh(best);
      return true;
    }
    return false;
  };
  /**
   * Mark every county polygon whose bbox overlaps the given AIANNH
   * polygon. Bbox overlap is an over-estimate (some matches will
   * be edge-adjacent rather than truly intersecting) but at this
   * scale the visual reads cleanly — visitors see all the counties
   * a reservation crosses, not just the one containing the
   * centroid.
   *
   * Async: county polygons are lazy-loaded; if they haven't been
   * fetched yet this function kicks off the load and applies the
   * highlight when polygons arrive.
   */
  const highlightCountiesOverlappingAiannh = (aiannhEl: SVGGraphicsElement) => {
    const apply = () => {
      let rb: DOMRect | null = null;
      try {
        rb = aiannhEl.getBBox();
      } catch {
        // Unrendered polygon — nothing to highlight against.
        return;
      }
      if (!rb) return;
      countyByFips.forEach((countyEl) => {
        try {
          const cb = countyEl.getBBox();
          const overlaps =
            cb.x < rb.x + rb.width + COUNTY_OVERLAP_PAD &&
            cb.x + cb.width > rb.x - COUNTY_OVERLAP_PAD &&
            cb.y < rb.y + rb.height + COUNTY_OVERLAP_PAD &&
            cb.y + cb.height > rb.y - COUNTY_OVERLAP_PAD;
          if (overlaps) countyEl.setAttribute('data-active', '1');
        } catch {
          // Skip counties that aren't rendered yet.
        }
      });
    };
    if (countyLayer && countyLayer.dataset.loaded === '1') apply();
    else void loadCounties().then(apply);
  };
  const highlightReservationByTribalKey = (tribalKey: string) => {
    clearReservationHighlight();
    pendingReservationTribalKey = tribalKey;
    // Kick off lazy-load if not already in flight.
    loadAiannh();
    applyReservationHighlight();
  };
  const runScene = async (scene: (typeof SCENES)[number]) => {
    // Apply layered highlights for this scene before runStudy fires.
    // For county scenes, scene.countyFips. For reservation scenes,
    // pull the precomputed containing-county FIPS from tribalLookup
    // so we get state + county + reservation as a nested hierarchy.
    clearReservationHighlight();
    if (scene.level === 'reservation' && scene.tribalKey) {
      const t = tribalLookup[scene.tribalKey];
      if (t) {
        highlightCounty(t.countyFips);
        highlightReservationByTribalKey(scene.tribalKey);
        await runStudy(t.fips, {
          activity: scene.activity,
          amount: scene.amount,
          framing: scene.sentence,
          chip: scene.chip,
          sourcePoint: { cx: t.cx, cy: t.cy },
          level: 'reservation',
          containingCountyFips: t.countyFips,
        });
        return;
      }
    }
    highlightCounty(scene.countyFips);
    if (scene.state) {
      // For a county scene, place the source on the actual county
      // centroid (falling back to the state centroid if we don't
      // have the FIPS). 'level' drives zoom + dot scaling.
      const isCounty = scene.level === 'county';
      const countyCenter =
        isCounty && scene.countyFips ? countyCentroids[scene.countyFips] : undefined;
      await runStudy(scene.state, {
        activity: scene.activity,
        amount: scene.amount,
        framing: scene.sentence,
        chip: scene.chip,
        level: isCounty ? 'county' : 'state',
        ...(countyCenter ? { sourcePoint: countyCenter } : {}),
        ...(isCounty && scene.countyFips ? { containingCountyFips: scene.countyFips } : {}),
      });
    }
  };

  const studyCycle = createStudyCycle({ pools: LEVEL_POOLS, runScene });

  /* ---------- Hover tooltip ---------- */
  const placeTooltip = (e: MouseEvent | FocusEvent) => {
    const rect = stage.getBoundingClientRect();
    let x: number, y: number;
    if ('clientX' in e) {
      x = (e as MouseEvent).clientX - rect.left;
      y = (e as MouseEvent).clientY - rect.top;
    } else {
      const t = (e.target as Element).getBoundingClientRect();
      x = t.left + t.width / 2 - rect.left;
      y = t.top + t.height / 2 - rect.top;
    }
    tooltip.style.transform = `translate(${x}px, ${y}px)`;
  };

  const setTooltip = (name: string, hint: string) => {
    ttName.textContent = name;
    if (ttHint) ttHint.textContent = hint;
  };

  /* ---------- Layer filters (States / Counties / Tribal) ---------- */
  document.querySelectorAll<HTMLButtonElement>('.wfilter').forEach((btn) => {
    btn.addEventListener('click', () => {
      const layer = btn.dataset.layer || 'states';
      // Map interaction analytics (#83) — which layers visitors explore.
      trackEvent('map.layer', { layer });
      document.querySelectorAll<HTMLButtonElement>('.wfilter').forEach((b) => {
        const on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      if (stage) stage.dataset.layer = layer;
    });
  });

  /* ---------- "Overview" zoom-out button ---------- */
  const zoomOutBtn = document.getElementById('heroZoomOut');
  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', async () => {
      stage.dataset.zoom = '';
      clearDetail();
      await zoomOut();
    });
  }

  /* ---------- "New study" button: rotates through levels ----------
     Uses its own rotation so a click deliberately advances state →
     county → reservation → ... regardless of where the auto-cycle is. */
  const buttonRotation = createLevelRotation(LEVEL_POOLS);
  const wsAgain = document.getElementById('workspaceAgain');
  if (wsAgain) {
    wsAgain.addEventListener('click', async () => {
      studyCycle.cancel();
      await runScene(buttonRotation.next());
      studyCycle.scheduleNext();
    });
  }

  /* ---------- Pause auto-cycle while the workspace is hovered ----------
     Respects the visitor's attention. The current study is allowed to
     finish; the next one waits until hover ends. */
  const workspaceEl = document.getElementById('workspace');
  if (workspaceEl) {
    const enter = () => studyCycle.setHoverPaused(true);
    const leave = () => studyCycle.setHoverPaused(false);
    workspaceEl.addEventListener('mouseenter', enter);
    workspaceEl.addEventListener('mouseleave', leave);
    // Pause on focus-within too so keyboard users get the same behavior.
    workspaceEl.addEventListener('focusin', enter);
    workspaceEl.addEventListener('focusout', (e) => {
      // Only resume when focus leaves the workspace entirely.
      const next = (e as FocusEvent).relatedTarget as Node | null;
      if (!next || !workspaceEl.contains(next)) leave();
    });
  }

  /* ---------- Keyboard shortcuts: S = new study, ? = help ----------
     Skipped while focus is inside an input/textarea so we don't hijack
     typing in the contact form. */
  const isTypingTarget = (t: EventTarget | null) => {
    if (!t || !(t instanceof HTMLElement)) return false;
    const tag = t.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || t.isContentEditable;
  };
  let kbHintEl: HTMLDivElement | null = null;
  const toggleKbHint = (force?: boolean) => {
    if (!kbHintEl) {
      kbHintEl = document.createElement('div');
      kbHintEl.className = 'kb-hint';
      kbHintEl.setAttribute('role', 'dialog');
      kbHintEl.setAttribute('aria-label', 'Keyboard shortcuts');
      kbHintEl.innerHTML = `
        <div class="kb-hint__head">Keyboard</div>
        <dl class="kb-hint__list">
          <dt><kbd>S</kbd></dt><dd>Run a new study</dd>
          <dt><kbd>?</kbd></dt><dd>Toggle this help</dd>
          <dt><kbd>Esc</kbd></dt><dd>Close</dd>
        </dl>
      `;
      document.body.appendChild(kbHintEl);
    }
    const next = typeof force === 'boolean' ? force : !kbHintEl.classList.contains('is-on');
    kbHintEl.classList.toggle('is-on', next);
  };
  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (isTypingTarget(e.target)) return;
    const k = e.key;
    if (k === 's' || k === 'S') {
      e.preventDefault();
      wsAgain?.click();
    } else if (k === '?' || (e.shiftKey && k === '/')) {
      e.preventDefault();
      toggleKbHint();
    } else if (k === 'Escape' && kbHintEl?.classList.contains('is-on')) {
      e.preventDefault();
      toggleKbHint(false);
    }
  });

  /* ---------- state click + hover ---------- */
  stage.querySelectorAll<HTMLElement>('.hero-state').forEach((el) => {
    el.addEventListener('mouseenter', (e) => {
      const id = el.dataset.id;
      if (!id) return;
      setTooltip(states[id]?.name || '', 'click to run a study here');
      tooltip.classList.add('is-on');
      placeTooltip(e);
      const wsRegion = document.getElementById('workspaceRegion');
      if (wsRegion && stage.dataset.run !== '1') wsRegion.textContent = states[id]?.name || '';
    });
    el.addEventListener('mousemove', (e) => placeTooltip(e));
    el.addEventListener('mouseleave', () => tooltip.classList.remove('is-on'));
    el.addEventListener('focus', (e) => {
      const id = el.dataset.id;
      if (!id) return;
      setTooltip(states[id]?.name || '', 'press Enter to run a study here');
      tooltip.classList.add('is-on');
      placeTooltip(e);
    });
    el.addEventListener('blur', () => tooltip.classList.remove('is-on'));

    const start = async () => {
      const id = el.dataset.id;
      if (!id) return;
      studyCycle.cancel();
      await runStudy(id);
      // Resume the auto-cycle a little sooner than the idle 10s default:
      // the visitor has just read this result, so the usual breathing
      // room can be shorter. forceSchedule, not scheduleNext, because
      // the pointer is likely still over the map (hover pause would
      // skip scheduling entirely).
      studyCycle.forceSchedule(6800);
    };
    el.addEventListener('click', start);
    el.addEventListener('keydown', (e) => {
      const k = (e as KeyboardEvent).key;
      if (k === 'Enter' || k === ' ') {
        e.preventDefault();
        start();
      }
    });
  });

  /* ---------- County polygon lazy-load + per-scene highlight ----------
     Fetches only the counties referenced by named scenes (filtered
     /data/counties.json endpoint). Injected once on idle. When a
     scene fires with scene.countyFips set, we add data-active="1"
     on the matching county polygon for the tiered highlight. */
  /* Map-data loading is network-aware (#36/#37/#40):
       - mapFetchAbort cancels in-flight county/AIANNH fetches when the
         visitor navigates away (Astro view transition or full unload),
         so we don't burn bandwidth on a page they've already left.
       - liteMode (Save-Data header or a 2g-class connection) suppresses
         the *automatic* prefetch of the ~1MB overlays. They still load
         on an explicit interaction, so the states map stays fully usable
         without pulling the heavy layers uninvited. */
  let mapFetchAbort = new AbortController();
  const abortMapFetches = () => {
    try {
      mapFetchAbort.abort();
    } catch {
      /* noop */
    }
  };
  // Registered (not { once: true }) so a bfcache restore — which makes a
  // fresh controller below — is still covered on the *next* navigation
  // away. abort() is idempotent, so firing on both pagehide and a view
  // swap is harmless.
  window.addEventListener('pagehide', abortMapFetches);
  document.addEventListener('astro:before-swap', abortMapFetches);
  const netConn = (
    navigator as unknown as { connection?: { saveData?: boolean; effectiveType?: string } }
  ).connection;
  const liteMode =
    !!netConn && (netConn.saveData === true || /(^|-)2g$/.test(netConn.effectiveType || ''));
  const isAbortError = (err: unknown): boolean =>
    err instanceof DOMException && err.name === 'AbortError';

  const countyLayer = document.getElementById('heroCountyLayer');
  let countyLoading: Promise<void> | null = null;
  const countyByFips = new Map<string, SVGPathElement>();
  let pendingCountyFips: string | undefined;
  const loadCounties = (): Promise<void> => {
    if (!countyLayer || countyLayer.dataset.loaded === '1') return Promise.resolve();
    if (countyLoading) return countyLoading;
    countyLoading = fetch('/data/counties.json', {
      credentials: 'same-origin',
      signal: mapFetchAbort.signal,
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((polys: any[]) => {
        if (!countyLayer || countyLayer.dataset.loaded === '1') return;
        const frag = document.createDocumentFragment();
        for (const p of polys) {
          const el = document.createElementNS(SVG_NS, 'path');
          el.setAttribute('class', 'hero-county');
          el.setAttribute('d', p.pathD);
          el.setAttribute('data-fips', p.id);
          el.setAttribute('data-name', p.name);
          frag.appendChild(el);
          countyByFips.set(p.id, el);
        }
        countyLayer.appendChild(frag);
        countyLayer.dataset.loaded = '1';
        // Re-apply any pending county highlight that was requested
        // before the polygons finished loading.
        if (pendingCountyFips) {
          const target = countyByFips.get(pendingCountyFips);
          if (target) target.setAttribute('data-active', '1');
        }
      })
      .catch((err: unknown) => {
        // A deliberate abort (navigation) should stay memoized so we
        // don't refetch a page we're leaving. A transient failure
        // (network blip, 5xx) must NOT poison the loader — clear the
        // memo so the next interaction can retry instead of replaying a
        // resolved-but-empty promise.
        if (!isAbortError(err)) countyLoading = null;
      });
    return countyLoading;
  };
  const clearCountyHighlight = () => {
    countyByFips.forEach((el) => el.removeAttribute('data-active'));
  };
  const highlightCounty = (fips: string | undefined) => {
    clearCountyHighlight();
    pendingCountyFips = fips;
    if (!fips) return;
    // Kick off the lazy-load if it hasn't started yet — we need the
    // polygons to be in the DOM to highlight them.
    loadCounties();
    const el = countyByFips.get(fips);
    if (el) el.setAttribute('data-active', '1');
  };

  /* ---------- AIANNH lazy-load + event delegation ----------
     The 485 tribal-land polygons are too heavy to inline into the SSR
     HTML (~1MB), so they're fetched from /data/aiannh.json on the first
     useful map interaction OR after an idle window, whichever comes
     first. Hover/click/keydown are delegated on the parent group so
     handlers don't need to be rewired after injection. */
  const aiannhLayer = document.getElementById('heroAiannhLayer');
  let aiannhLoading: Promise<void> | null = null;
  const loadAiannh = (): Promise<void> => {
    if (!aiannhLayer || aiannhLayer.dataset.loaded === '1') return Promise.resolve();
    if (aiannhLoading) return aiannhLoading;
    aiannhLoading = fetch('/data/aiannh.json', {
      credentials: 'same-origin',
      signal: mapFetchAbort.signal,
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((polys: any[]) => {
        if (!aiannhLayer || aiannhLayer.dataset.loaded === '1') return;
        const frag = document.createDocumentFragment();
        for (const p of polys) {
          const el = document.createElementNS(SVG_NS, 'path');
          el.setAttribute('class', `hero-aiannh hero-aiannh--${p.category || 'reservation'}`);
          el.setAttribute('d', p.pathD);
          el.setAttribute('data-name', p.name);
          el.setAttribute('data-short', p.shortName);
          el.setAttribute('data-fips', p.fips);
          el.setAttribute('data-cx', String(p.x));
          el.setAttribute('data-cy', String(p.y));
          el.setAttribute('data-category', p.category || '');
          el.setAttribute('tabindex', '0');
          el.setAttribute('role', 'button');
          el.setAttribute('aria-label', `Tribal land: ${p.name}`);
          frag.appendChild(el);
        }
        aiannhLayer.appendChild(frag);
        aiannhLayer.dataset.loaded = '1';
        // Re-apply any pending reservation highlight requested before
        // the polygons finished loading.
        applyReservationHighlight();
      })
      .catch((err: unknown) => {
        // Keep a navigation abort memoized; clear a transient failure so
        // a later interaction can retry instead of being stuck.
        if (!isAbortError(err)) aiannhLoading = null;
      });
    return aiannhLoading;
  };

  // bfcache restore (#40): leaving the page aborts mapFetchAbort, which
  // permanently poisons its signal. If the visitor comes back via the
  // back/forward cache, replace the controller and drop any memoized
  // load promise that never resolved, so the overlays can fetch again
  // instead of rejecting instantly for the rest of the session. Layers
  // already injected before navigating away survive in the restored DOM.
  window.addEventListener('pageshow', (e) => {
    if (!(e as PageTransitionEvent).persisted) return;
    mapFetchAbort = new AbortController();
    if (aiannhLayer?.dataset.loaded !== '1') aiannhLoading = null;
    if (countyLayer?.dataset.loaded !== '1') countyLoading = null;
  });

  // Trigger lazy-load on first stage interaction (always — an explicit
  // hover/focus means the visitor wants the overlays, lite mode or not).
  const triggerLoadOnce = () => {
    loadAiannh();
    loadCounties();
  };
  stage.addEventListener('pointerenter', triggerLoadOnce, { once: true });
  stage.addEventListener('focusin', triggerLoadOnce, { once: true });

  // Automatic prefetch so even visitors who never touch the map get the
  // layers ready — but only once the map is actually on screen (#36) and
  // only when the connection isn't asking us to conserve data (#37).
  const w = window as unknown as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void;
  };
  const idlePrefetch = () => {
    if (typeof w.requestIdleCallback === 'function') {
      w.requestIdleCallback(
        () => {
          loadAiannh();
          loadCounties();
        },
        { timeout: 4000 },
      );
    } else {
      w.setTimeout(() => {
        loadAiannh();
        loadCounties();
      }, 2500);
    }
  };
  if (!liteMode) {
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(
        (entries, obs) => {
          if (entries.some((e) => e.isIntersecting)) {
            obs.disconnect();
            idlePrefetch();
          }
        },
        { rootMargin: '200px' },
      );
      io.observe(stage);
    } else {
      idlePrefetch();
    }
  }

  /* First-visit coachmark (#39). Shown once per browser; dismissed on
     the first real map interaction, an explicit "Got it", or a timeout,
     and the choice is remembered so it never nags a returning visitor. */
  const coachmark = document.getElementById('heroCoachmark');
  if (coachmark) {
    let seen = false;
    try {
      seen = localStorage.getItem('lumecon:map:coachmark') === '1';
    } catch {
      seen = false;
    }
    if (!seen) {
      coachmark.hidden = false;
      const dismissCoach = () => {
        if (coachmark.hidden) return;
        coachmark.hidden = true;
        try {
          localStorage.setItem('lumecon:map:coachmark', '1');
        } catch {
          /* storage disabled — fine */
        }
      };
      document.getElementById('heroCoachmarkClose')?.addEventListener('click', (e) => {
        e.stopPropagation();
        dismissCoach();
      });
      stage.addEventListener('pointerdown', dismissCoach, { once: true });
      stage.addEventListener('focusin', dismissCoach, { once: true });
      window.setTimeout(dismissCoach, 7000);
    }
  }

  // Delegated handlers — work whether the polygons are injected or not.
  const aiannhFromEvent = (e: Event): HTMLElement | null => {
    const t = e.target as Element | null;
    if (!t) return null;
    const el = (t as Element).closest('.hero-aiannh') as HTMLElement | null;
    return el;
  };
  aiannhLayer?.addEventListener('pointerover', (e) => {
    const el = aiannhFromEvent(e);
    if (!el) return;
    setTooltip(el.dataset.name || 'Tribal land', 'click to run a tribal-economy study');
    tooltip.classList.add('is-on');
    placeTooltip(e as MouseEvent);
  });
  aiannhLayer?.addEventListener('pointermove', (e) => {
    if (aiannhFromEvent(e)) placeTooltip(e as MouseEvent);
  });
  aiannhLayer?.addEventListener('pointerout', () => tooltip.classList.remove('is-on'));
  aiannhLayer?.addEventListener('focusin', (e) => {
    const el = aiannhFromEvent(e);
    if (!el) return;
    setTooltip(el.dataset.name || 'Tribal land', 'press Enter to run a tribal-economy study');
    tooltip.classList.add('is-on');
    placeTooltip(e as FocusEvent);
  });
  aiannhLayer?.addEventListener('focusout', () => tooltip.classList.remove('is-on'));
  const startTribal = async (el: HTMLElement) => {
    const fips = el.dataset.fips;
    if (!fips) return;
    const cx = parseFloat(el.dataset.cx || '0');
    const cy = parseFloat(el.dataset.cy || '0');
    const tribalName = el.dataset.short || el.dataset.name || 'a tribal land';
    studyCycle.cancel();
    const activity = ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)];
    const amount = AMOUNTS[1 + Math.floor(Math.random() * (AMOUNTS.length - 1))];
    const framing = `A ${amount.label} tribal project on the ${tribalName}.`;
    const chip = `${tribalName} · ${amount.label} ${activity.label}`;
    // Light the polygon + overlapping counties for the click path too.
    clearReservationHighlight();
    el.setAttribute('data-active', '1');
    highlightCountiesOverlappingAiannh(el as unknown as SVGGraphicsElement);
    await runStudy(fips, { activity, amount, framing, chip, sourcePoint: { cx, cy } });
    studyCycle.scheduleNext();
  };
  aiannhLayer?.addEventListener('click', (e) => {
    const el = aiannhFromEvent(e);
    if (el) startTribal(el);
  });
  aiannhLayer?.addEventListener('keydown', (e) => {
    const el = aiannhFromEvent(e);
    if (!el) return;
    const k = (e as KeyboardEvent).key;
    if (k === 'Enter' || k === ' ') {
      e.preventDefault();
      startTribal(el);
    }
  });
  // Also load eagerly when the Tribal lands filter chip activates.
  document
    .querySelector('.wfilter[data-layer="tribal"]')
    ?.addEventListener('click', () => loadAiannh(), { once: true });

  initFigureExplainers(stage);

  initSearch({
    stage,
    runStudy,
    // Back the auto-cycle off so the user-fired study isn't
    // overwritten by the next scheduled one. Timestamped so it
    // survives the focusin/focusout that fires when the click moves
    // focus out of the search input.
    suspendAutoCycle: () => studyCycle.suspendFor(25_000),
    loadAiannh,
    clearReservationHighlight,
    highlightCountiesOverlappingAiannh,
  });

  /* First study kickoff.

     Previously this called a third-party IP-geolocation endpoint
     (ipapi.co) to pick a study near the visitor's state on first
     load. That was dropped because:
       - It was the only third-party network call from the homepage,
         which made the request graph noisier than it needs to be
         (some network-level security filters scrutinize outbound
         XHRs to unfamiliar origins).
       - It sent the visitor's IP to a third party for cosmetic
         personalization.
       - The catalog's auto-cycle deck already delivers a varied
         first impression in <1s.

     If we want to surface a geo-targeted scene later, do it
     server-side (Cloudflare/AWS edge headers) so no third-party
     lookup is needed. */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const s = states['53'];
    if (s) {
      moveSource(s.cx, s.cy);
      lightSource('53');
    }
    figD!.textContent = fmt(5_000_000);
  } else {
    studyCycle.scheduleNext(900);
  }
}
