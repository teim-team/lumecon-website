/**
 * Shared types for the hero map runtime.
 *
 * Kept in their own module so leaf modules (search, data) and the
 * hero.ts orchestrator can share them without importing each other.
 */

export type StateInfo = { name: string; cx: number; cy: number; code: string };

export type TribalLand = {
  name: string;
  cx: number;
  cy: number;
  fips: string;
  countyFips?: string;
};

export type SearchEntry =
  | { type: 'state'; id: string; name: string; sub: string; cx: number; cy: number }
  | {
      type: 'county';
      id: string;
      name: string;
      sub: string;
      cx: number;
      cy: number;
      stateFips: string;
    }
  | { type: 'tribal'; id: string; name: string; sub: string; cx: number; cy: number; fips: string };

/** Options accepted by runStudy() in hero.ts. */
export type RunOpts = {
  activity?: { id: string; label: string; indirect: number; induced: number; jobsPerM: number };
  amount?: { v: number; label: string };
  framing?: string;
  chip?: string;
  sourcePoint?: { cx: number; cy: number };
  /** 'state' | 'county' | 'reservation' — drives zoom + dot scaling. */
  level?: 'state' | 'county' | 'reservation';
  /** 5-digit FIPS of the county containing the source. For
   *  reservation studies, leakage routes preferentially through
   *  this county (and its state) before any other neighbor — the
   *  geographic embeddedness MRIO/FLQ models formalize. */
  containingCountyFips?: string;
};
