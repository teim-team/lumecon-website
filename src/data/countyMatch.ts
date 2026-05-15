/**
 * Build-time helper for finding which county contains a projected point.
 * Used by counties.json.ts to know which counties to ship in the
 * filtered set, and by Hero.astro frontmatter to enrich tribalLookup
 * with a containing-county FIPS per reservation.
 *
 * Inverts the projected (cx, cy) back to lat/lon using the same albers-
 * equal-area projection us-atlas-10m bakes in, then runs d3.geoContains
 * against county features. A bbox prefilter keeps cost manageable.
 */
import { geoContains, geoAlbersUsa, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
// @ts-ignore — us-atlas ships JSON, not TS
import countiesAtlas from 'us-atlas/counties-albers-10m.json' with { type: 'json' };

const proj = geoAlbersUsa().scale(1300).translate([487.5, 305]);
const path = geoPath();
// @ts-ignore
const featureCollection: any = feature(countiesAtlas, countiesAtlas.objects.counties);

type Entry = { id: string; feature: any; bbox: [[number, number], [number, number]] };

const countyEntries: Entry[] = featureCollection.features.map((f: any) => ({
  id: String(f.id),
  feature: f,
  bbox: path.bounds(f) as any,
}));

export function findContainingCounty(cx: number, cy: number): string | undefined {
  const invert = (proj as any).invert as (p: [number, number]) => [number, number] | null;
  if (typeof invert !== 'function') return undefined;
  const lonlat = invert([cx, cy]);
  if (!lonlat) return undefined;
  for (const c of countyEntries) {
    if (cx < c.bbox[0][0] || cx > c.bbox[1][0]) continue;
    if (cy < c.bbox[0][1] || cy > c.bbox[1][1]) continue;
    if (geoContains(c.feature, lonlat)) return c.id;
  }
  return undefined;
}

/* Find all counties whose bbox intersects a bbox around the point.
   Useful for reservations that span more than one county — we'd want
   to highlight the small neighborhood around the centroid. Not used
   in the v1 single-county-per-reservation render, but kept here for
   future multi-county expansion. */
export function findCountiesNear(cx: number, cy: number, radius = 25): string[] {
  const hits: string[] = [];
  for (const c of countyEntries) {
    const [[x0, y0], [x1, y1]] = c.bbox;
    if (x1 < cx - radius || x0 > cx + radius) continue;
    if (y1 < cy - radius || y0 > cy + radius) continue;
    hits.push(c.id);
  }
  return hits;
}
