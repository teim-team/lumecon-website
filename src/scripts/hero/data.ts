/**
 * Data contract with Hero.astro.
 *
 * Hero.astro injects four <script type="application/json"> tags
 * (heroStates, heroTribal, heroCounties, heroSearch); this module
 * parses them once at import time. Nothing here is server-side.
 *
 * The shared scene catalog is imported from src/data/scenes.ts so the
 * homepage demo and the static /demo/[slug] pages stay in sync.
 * ACTIVITIES + AMOUNTS stay local — they're the click-on-state generic
 * fallback (not used by the named scenes).
 */
import { STATE_SCENES, COUNTY_SCENES, RESERVATION_SCENES } from '../../data/scenes';
import type { SearchEntry, StateInfo, TribalLand } from './types';

export const states: Record<string, StateInfo> = JSON.parse(
  (document.getElementById('heroStates') as HTMLScriptElement).textContent || '{}',
);

export const tribalLookup: Record<string, TribalLand> = JSON.parse(
  (document.getElementById('heroTribal') as HTMLScriptElement).textContent || '{}',
);

// FIPS → centroid for every U.S. county, computed at build time from
// the same albers-USA projection the map uses. Lets a county-level
// study put the source dot on the actual county.
export const countyCentroids: Record<string, { cx: number; cy: number }> = JSON.parse(
  (document.getElementById('heroCounties') as HTMLScriptElement)?.textContent || '{}',
);

export const searchIndex: SearchEntry[] = JSON.parse(
  (document.getElementById('heroSearch') as HTMLScriptElement)?.textContent || '[]',
);

export const ACTIVITIES = [
  { id: 'build', label: 'capital construction', indirect: 0.62, induced: 0.38, jobsPerM: 8.9 },
  { id: 'payroll', label: 'operations payroll', indirect: 0.48, induced: 0.71, jobsPerM: 11.4 },
  { id: 'grant', label: 'grant pass-through', indirect: 0.35, induced: 0.55, jobsPerM: 6.2 },
  { id: 'tourism', label: 'visitor spending', indirect: 0.51, induced: 0.63, jobsPerM: 13.1 },
  { id: 'energy', label: 'energy project', indirect: 0.58, induced: 0.42, jobsPerM: 7.6 },
] as const;

export const AMOUNTS = [
  { v: 1_000_000, label: '$1M' },
  { v: 5_000_000, label: '$5M' },
  { v: 12_000_000, label: '$12M' },
  { v: 20_000_000, label: '$20M' },
  { v: 50_000_000, label: '$50M' },
] as const;

export const LEVEL_POOLS = [STATE_SCENES, COUNTY_SCENES, RESERVATION_SCENES];
