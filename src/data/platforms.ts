/**
 * Platform data — single source of truth for the three Lumecon
 * product lines (Local, Tribal, Global).
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

/** 'regional' platforms live on the homepage / footer "Platforms" rail
 *  and share the Sprout / Sapling / Tree tier ladder. 'service'
 *  platforms (Consultant) only appear on /pricing, render a single
 *  flat tier instead of the tier ladder, and don't get the Toolbox
 *  add-on (the add-on requires an active subscription, which the
 *  Consultant offering already implicitly includes). */
export type PlatformKind = 'regional' | 'service';

/** Per-tier annual prices for a platform. Regional platforms populate
 *  starter / standard / leader. Service platforms populate `flat`.
 *  Numbers are USD. A 0 means "TBD, not yet priced." */
export interface PlatformTierPrices {
  starter?: number;
  standard?: number;
  leader?: number;
  flat?: number;
}

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
  /** "Right fit if..." blurb on the pricing platform-picker tile. */
  fitIf: string;
  /** Scope of analysis the platform covers (JSON-LD + metadata). */
  scope: string;
  /** Icon component token: 'local' -> IconLocal etc. */
  iconId: PlatformSlug;
  /** Whether this is a regional product line or a service offering.
   *  Filters out service platforms from the homepage / footer. */
  kind: PlatformKind;
  /** Public per-tier prices, set per platform. Undefined = TBD. */
  tierPrices?: PlatformTierPrices;
  /** Geographies the platform covers, in display order, used in tier
   *  copy and the comparison table. Local is sub-state (city / county
   *  / state / national); Tribal is reservation-anchored (no county);
   *  Global is national + international; Consultant covers the full
   *  set because consulting firms work across client types. */
  geographyScope: string;
}

export const PLATFORMS: readonly Platform[] = [
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
    tag: 'Turn your budget data into an economic impact study you can present.',
    desc: 'For cities, counties, state agencies, enterprises, foundations, universities, and the nonprofits that work alongside them. Run grant, council, and board-ready studies in-house, in minutes instead of months.',
    audience: 'Municipalities, state agencies, enterprises, foundations, universities, and nonprofits',
    fitIf: "You're a municipality, state agency, enterprise, foundation, university, or nonprofit running local or regional impact analysis.",
    scope: 'Local & regional economic impact analysis',
    iconId: 'local',
    kind: 'regional',
    tierPrices: { starter: 7500, standard: 15000, leader: 20000 },
    geographyScope: 'County, state, and national',
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
    tag: 'Modeled on tribal terms, not adapted from a state model.',
    desc: 'For tribal governments and the departments within them, federally and state-recognized tribes, intertribal organizations, tribal colleges, Native non-profits, Alaska Native Corporations, Native Hawaiian Organizations, tribal enterprises, Native CDFIs, and Native-entity federal contractors, with Indigenous data sovereignty a design priority from the start rather than an afterthought.',
    audience: 'Tribal governments and departments, federally and state-recognized tribes, intertribal organizations, tribal colleges, Native non-profits, ANCs, NHOs, tribal enterprises, Native CDFIs, Native-entity federal contractors',
    fitIf: "You're a tribal government or department within one, a Native non-profit, intertribal org, tribal college, ANC, NHO, tribal enterprise, Native CDFI, state-recognized tribe, or Native-entity federal contractor making the case for reservation, state, or federal funding.",
    scope: 'Reservation, state, national economic impact analysis',
    iconId: 'tribal',
    kind: 'regional',
    tierPrices: { starter: 10000, standard: 17500, leader: 25000 },
    geographyScope: 'Reservation, county, state, and national',
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
    desc: 'For governments, multinationals, NGOs, and foundations whose work crosses borders, with the same modeling backbone running underneath so a project in one country is directly comparable to a project in another.',
    audience: 'Organizations needing broader market, supply-chain, or international analysis',
    fitIf: 'You need national, international, supply-chain, or cross-border analysis. Launching after Local and Tribal stabilize.',
    scope: 'National, international, cross-border analysis',
    iconId: 'global',
    kind: 'regional',
    geographyScope: 'National, international, and cross-border',
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
    tag: 'Lumecon for consultants delivering studies to outside clients.',
    desc: 'For independent consultants and consulting firms running economic impact studies on behalf of two distinct client entities in a single fiscal year. All geographies included; Cedar and the Toolbox add-on are not available on this plan.',
    audience: 'Independent consultants and consulting firms running economic impact studies on behalf of outside clients',
    fitIf: "You're a consultant running studies for outside clients. Two distinct entities, one fiscal year, all geographies (reservation, county, state, national). No consortium projects.",
    scope: 'Reservation, county, state, and national economic impact analysis',
    iconId: 'consultant',
    kind: 'service',
    tierPrices: { flat: 15000 },
    geographyScope: 'Reservation, county, state, and national',
  },
];

/** Slug -> Platform lookup. */
export const PLATFORM_BY_SLUG: Record<PlatformSlug, Platform> =
  Object.fromEntries(PLATFORMS.map((p) => [p.slug, p])) as Record<PlatformSlug, Platform>;

/** Convenience helpers — most surfaces only want one kind of platform.
 *  Homepage product cards and the footer "Platforms" rail show only
 *  regional offerings; the pricing platform-picker shows all of them. */
export const REGIONAL_PLATFORMS: readonly Platform[] = PLATFORMS.filter((p) => p.kind === 'regional');
