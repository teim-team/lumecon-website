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
// @ts-ignore — generated data, no .d.ts
import { CENSUS_TRIBAL_LANDS } from '../../data/tribalLands.generated.js';
import { COUNTY_SCENES } from '../../data/scenes';
import { findContainingCounty } from '../../data/countyMatch';

export const prerender = true;

// Manual tribal anchors (mirror of MANUAL_TRIBES in Hero.astro). The
// counties containing these need to be included in the filtered set so
// reservation scenes can highlight them.
const MANUAL_ANCHORS: Array<{ cx: number; cy: number }> = [
  { cx: 766.2, cy: 363.3 }, // catawba
  { cx: 896.7, cy: 192.2 }, // mohegan
  { cx:  79.4, cy:  75.5 }, // cowlitz
  { cx: 822.6, cy: 566.9 }, // seminole hollywood
  { cx: 459,   cy: 358   }, // warhorse / lincoln NE
  { cx:  89.3, cy: 465.3 }, // ASRC barrow
  { cx:  70.1, cy: 498.1 }, // NANA kotzebue
  { cx: 102.7, cy: 571.5 }, // afognak / kodiak
  { cx: 653.3, cy: 226.7 }, // pokagon
  { cx: 669.8, cy: 205.3 }, // gun lake
  { cx: 677.9, cy: 211.9 }, // firekeepers
  { cx: 104.2, cy:  49.9 }, // snoqualmie
  { cx:  89.3, cy:  32.8 }, // jamestown
  { cx:  65.6, cy:  29.6 }, // quileute
  { cx:  83.0, cy:  29.8 }, // lower elwha
  { cx: 205.6, cy: 375.4 }, // yavapai-apache
  { cx:  71.7, cy: 306.4 }, // tachi
  { cx:  78.6, cy: 285.5 }, // chukchansi
  { cx: 122.7, cy: 380.0 }, // 29 palms
  { cx:  44.6, cy: 168.5 }, // karuk
  { cx:  25.0, cy: 186.5 }, // wiyot
  { cx: 124.4, cy: 147.7 }, // burns paiute
  { cx: 835.0, cy: 298.7 }, // pamunkey
  { cx: 176.9, cy: 556.1 }, // sealaska
  { cx: 112.3, cy: 544.3 }, // ciri
  { cx: 117.8, cy: 514.9 }, // doyon
  { cx:  86.2, cy: 570.2 }, // bristol bay
  { cx:  69.5, cy: 549.0 }, // calista
  { cx: 128.1, cy: 535.7 }, // ahtna
  { cx: 117.9, cy: 544.6 }, // chugach
  { cx: 266.9, cy: 549.1 }, // nakupuna + kamehameha (honolulu)
];

export async function GET() {
  const path = geoPath();
  // @ts-ignore — topojson type narrowing
  const featureCollection: any = feature(countiesAtlas, countiesAtlas.objects.counties);
  const wanted = new Set<string>(
    COUNTY_SCENES.map(s => s.countyFips).filter(Boolean) as string[]
  );

  // Add the county containing each Census-derived tribal centroid
  // (the AIANNH reservations). One-pass at build time; results are
  // cached in the static JSON output.
  for (const t of CENSUS_TRIBAL_LANDS as any[]) {
    if (!t.pathD || t.x == null || t.y == null || !t.fips) continue;
    const fips = findContainingCounty(t.x, t.y);
    if (fips) wanted.add(fips);
  }
  // And the counties containing each manual tribal anchor (Catawba,
  // Mohegan, Cowlitz, Seminole Hollywood, WarHorse, ANCSA corps, NHOs).
  for (const m of MANUAL_ANCHORS) {
    const fips = findContainingCounty(m.cx, m.cy);
    if (fips) wanted.add(fips);
  }

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
