/**
 * Static JSON endpoint that serves the AIANNH polygon dataset for the
 * hero map's lazy-load path. Hero.astro inlines an empty group, then
 * fetches this once the visitor first interacts with the map (or after
 * an idle moment), keeping the initial HTML around 50KB instead of 1MB.
 */
// @ts-ignore — generated data, no .d.ts
import { CENSUS_TRIBAL_LANDS } from '../../data/tribalLands.generated.js';

export const prerender = true;

export async function GET() {
  const polygons = (CENSUS_TRIBAL_LANDS as any[])
    .filter((l: any) => l.pathD && l.x != null && l.y != null && l.fips)
    .map((l: any) => ({
      id: l.id,
      name: l.name,
      shortName: l.shortName || l.name,
      fips: l.fips,
      category: l.category,
      pathD: l.pathD,
      x: l.x,
      y: l.y,
    }));
  return new Response(JSON.stringify(polygons), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
