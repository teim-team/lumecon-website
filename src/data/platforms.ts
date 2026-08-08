/**
 * Entry-point data — single source of truth for the Lumecon
 * audience entry points (Local, Tribal, Global) plus the consultant
 * licensing track. The domains are front doors for different
 * audiences; all of them lead into the same Lumecon application,
 * which adapts to the organization type. There is no per-platform
 * pricing: plans live in src/data/pricing.ts.
 *
 * Consumed by:
 *   - config.ts (re-exports as site.products so legacy lookups
 *     keep working without duplicating copy)
 *   - components/ProductsSection.astro (homepage card grid)
 *   - components/Footer.astro (Platforms column links)
 *   - pages/pricing.astro (platform picker tile + tier email subject)
 *   - pages/index.astro (JSON-LD Service entries)
 *   - data/pricing.ts (re-exports as PRODUCT_LINES so anything that
 *     grew up around that name keeps importing the same array)
 *
 * Every consumer reads from this file. Adding a fourth platform
 * is one edit here, not five across the tree.
 */

export type PlatformSlug = 'local' | 'tribal' | 'global' | 'consultant';
export type PlatformId =
  | 'local-economic-impact'
  | 'tribal-economic-impact'
  | 'global-economic-impact'
  | 'consultant-economic-impact';

/** 'regional' entry points can appear on audience-facing rails;
 *  the 'service' entry (Consultant) is the custom-licensed
 *  consultant track and stays off those rails. */
export type PlatformKind = 'regional' | 'service';

export interface Platform {
  /** Short token used in CSS classes, icon mappings, and JS lookups. */
  slug: PlatformSlug;
  /** Long-form id used in JSON-LD, analytics, and the pricing picker. */
  id: PlatformId;
  /** Display name. */
  name: string;
  /** Short label for CTA email subjects ("Sprout tier for Local"). */
  shortName: string;
  /** External product URL. */
  url: string;
  /** Bare domain (without protocol) shown on the homepage card. */
  domain: string;
  /** Badge text rendered on the homepage card. */
  status: 'In active development' | 'Future development';
  /** Whether this platform is gated behind a notify-me CTA. */
  comingSoon: boolean;
  /** Badge color variant. */
  badgeKind: 'active' | 'future';
  /** One-liner above the description on the homepage card. */
  tag: string;
  /** Full audience description on the homepage card. */
  desc: string;
  /** Verbose audience description used in JSON-LD audience field. */
  audience: string;
  /** Scope of analysis the platform covers (JSON-LD + metadata). */
  scope: string;
  /** Icon component token: 'local' -> IconLocal etc. */
  iconId: PlatformSlug;
  /** Whether this is a regional entry point or a service offering.
   *  Filters out service entries from the homepage / footer. */
  kind: PlatformKind;
  /** Geographies highlighted for this audience, in display order. All
   *  plans include every supported U.S. geography (county, state,
   *  national and reservations); this string only orders the framing
   *  for the audience the entry point serves. */
  geographyScope: string;
}

const PLATFORMS: readonly Platform[] = [
  {
    slug: 'local',
    id: 'local-economic-impact',
    name: 'Local Economic Impact',
    shortName: 'Local',
    url: 'https://localeconomicimpact.com',
    domain: 'localeconomicimpact.com',
    status: 'In active development',
    comingSoon: false,
    badgeKind: 'active',
    tag: 'Turn your budget data into an economic impact analysis you can present.',
    desc: 'For cities, counties, state agencies, enterprises, foundations, universities and the nonprofits that work alongside them. Run grant, council and board-ready analyses in-house, in minutes instead of months.',
    audience:
      'Municipalities, state agencies, enterprises, foundations, universities and nonprofits',
    scope: 'Local and regional economic impact analysis',
    iconId: 'local',
    kind: 'regional',
    geographyScope: 'County, state and national',
  },
  {
    slug: 'tribal',
    id: 'tribal-economic-impact',
    name: 'Tribal Economic Impact',
    shortName: 'Tribal',
    url: 'https://tribaleconomicimpact.com',
    domain: 'tribaleconomicimpact.com',
    status: 'In active development',
    comingSoon: false,
    badgeKind: 'active',
    tag: 'Modeled on tribal terms, with reservations and trust lands as first-class geographies.',
    desc: 'For tribal governments and the departments within them, federally and state-recognized tribes, intertribal organizations, tribal colleges, Native nonprofits, Alaska Native Corporations, Native Hawaiian Organizations, tribal enterprises, Native CDFIs and Native-entity federal contractors, with Indigenous data sovereignty a design priority from the start rather than an afterthought.',
    audience:
      'Tribal governments and departments, federally and state-recognized tribes, intertribal organizations, tribal colleges, Native nonprofits, ANCs, NHOs, tribal enterprises, Native CDFIs, Native-entity federal contractors',
    scope: 'Reservation, state, national economic impact analysis',
    iconId: 'tribal',
    kind: 'regional',
    geographyScope: 'Reservation, county, state and national',
  },
  {
    slug: 'global',
    id: 'global-economic-impact',
    name: 'Global Economic Impact',
    shortName: 'Global',
    url: 'https://globaleconomicimpact.com',
    domain: 'globaleconomicimpact.com',
    status: 'Future development',
    comingSoon: true,
    badgeKind: 'future',
    tag: 'For organizations whose work crosses borders.',
    desc: 'For governments, multinationals, NGOs and foundations whose work crosses borders, with the same Lumecon application running underneath so a project in one place is directly comparable to a project in another.',
    audience: 'Organizations needing broader market, supply-chain or international analysis',
    scope: 'National, international, cross-border analysis',
    iconId: 'global',
    kind: 'regional',
    geographyScope: 'National, international and cross-border',
  },
  {
    slug: 'consultant',
    id: 'consultant-economic-impact',
    name: 'For Consultants',
    shortName: 'Consultant',
    url: 'https://lumecon.ai/pricing',
    domain: 'lumecon.ai',
    status: 'In active development',
    comingSoon: false,
    badgeKind: 'active',
    tag: 'Lumecon for consultants delivering analyses to outside clients.',
    desc: 'For consulting firms and independent professionals using Lumecon commercially for outside clients. Commercial use starts with Sapling: Cedar Commons doubles as client intake and project workspaces, with seats the firm can reassign as engagements change, and Tree serves larger practices with unlimited organizational users, Cedar Grove and Cedar calibration.',
    audience:
      'Consulting firms and independent professionals running economic impact analyses on behalf of outside clients',
    scope: 'Reservation, county, state and national economic impact analysis',
    iconId: 'consultant',
    kind: 'service',
    geographyScope: 'Reservation, county, state and national',
  },
];

/** Convenience helpers — most surfaces only want one kind of platform.
 *  Homepage product cards and the footer "Platforms" rail show only
 *  regional offerings; the pricing platform-picker shows all of them. */
export const REGIONAL_PLATFORMS: readonly Platform[] = PLATFORMS.filter(
  (p) => p.kind === 'regional',
);
