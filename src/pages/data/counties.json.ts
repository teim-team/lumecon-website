/**
 * Filtered county polygon JSON for the hero's tiered highlighting.
 * Only includes the counties referenced by our county-level scenes,
 * so the payload stays small (~30KB instead of ~1MB for all 3000+).
 *
 * The client lazy-loads this on idle and injects each county polygon
 * into the hero map. When a scene runs with a matching countyFips,
 * we set data-active="1" on that polygon for the brighter highlight.
 */
import { geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
// @ts-ignore — us-atlas ships JSON, not TS
import countiesAtlas from 'us-atlas/counties-albers-10m.json' with { type: 'json' };
import { COUNTY_SCENES } from '../../data/scenes';

export const prerender = true;

export async function GET() {
  const path = geoPath();
  // @ts-ignore — topojson type narrowing
  const featureCollection: any = feature(countiesAtlas, countiesAtlas.objects.counties);
  const wanted = new Set<string>(
    COUNTY_SCENES.map(s => s.countyFips).filter(Boolean) as string[]
  );
  const polygons = featureCollection.features
    .filter((f: any) => wanted.has(String(f.id)))
    .map((f: any) => {
      const [cx, cy] = path.centroid(f);
      return {
        id: String(f.id),
        name: f.properties?.name || '',
        pathD: path(f),
        cx: +cx.toFixed(1),
        cy: +cy.toFixed(1),
      };
    });
  return new Response(JSON.stringify(polygons), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
