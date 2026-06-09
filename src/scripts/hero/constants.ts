/**
 * Tuning constants for the hero map.
 *
 * Pulled out of the runtime modules so they can be adjusted in one
 * place. Units are SVG viewBox units unless noted.
 */

/** Distance-decay exponent for the choropleth spillover map.
 *  Higher = leakage concentrates in the immediately adjacent
 *  states (more geographic embeddedness, FLQ-like). 2.2 is the
 *  current sweet spot. */
export const CHOROPLETH_DECAY = 2.2;

/** Random jitter applied per region in computeShares so neighbors
 *  don't fall into a perfect concentric ring. The weight is
 *  multiplied by (JITTER_MIN + rand() * JITTER_RANGE). */
export const JITTER_MIN = 0.7;
export const JITTER_RANGE = 0.6;

/** Choropleth opacity boost. The raw share is divided by this
 *  threshold and raised to SHARE_BOOST_POWER, so the dimmest
 *  neighbors don't fade out entirely. */
export const SHARE_BOOST_THRESHOLD = 0.3;
export const SHARE_BOOST_POWER = 0.6;

/** Curvature factor for the bezier flow lines from source to
 *  neighbors. Multiplied by the source-to-neighbor distance to
 *  set the control-point offset. */
export const FLOW_CURVATURE = 0.22;

/** Max distance (in viewBox units) between a reservation scene's
 *  tribalLookup centroid and the nearest AIANNH polygon center
 *  before we give up trying to highlight the polygon. Some small
 *  rancherias aren't in the AIANNH dataset; better to leave the
 *  highlight off than light a far-away polygon that shares a name
 *  fragment. */
export const RESERVATION_HIGHLIGHT_MAX_DIST = 35;

/** Bbox inflation when finding counties that overlap a reservation
 *  polygon. Small positive number so edge-touching counties match. */
export const COUNTY_OVERLAP_PAD = 0.5;

export const SVG_NS = 'http://www.w3.org/2000/svg';

/** Base radii for the source dot's circles (state-level study).
 *  Per-level studies scale these down so the dot, halo and rings
 *  shrink for county/reservation zooms. */
export const SOURCE_BASE_R: Record<string, number> = {
  'hero-spark': 6,
  'hero-spark__core': 2.4,
  'hero-ring': 14,
  'hero-glow': 120,
};
