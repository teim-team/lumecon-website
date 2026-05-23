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

export type PlatformSlug = 'local' | 'tribal' | 'global';
export type PlatformId =
  | 'local-economic-impact'
  | 'tribal-economic-impact'
  | 'global-economic-impact';

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
    scope: 'Local & regional impact analysis outside Indigenous-economy workflows',
    iconId: 'local',
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
    desc: 'For tribal governments and the departments within them, federally and state-recognized tribes, intertribal organizations, tribal colleges, Native non-profits, Alaska Native Corporations, Native Hawaiian Organizations, tribal enterprises, Native CDFIs, and Native-entity federal contractors, with Indigenous data sovereignty built into the platform from the start rather than added on later.',
    audience: 'Tribal governments and departments, federally and state-recognized tribes, intertribal organizations, tribal colleges, Native non-profits, ANCs, NHOs, tribal enterprises, Native CDFIs, Native-entity federal contractors',
    fitIf: "You're a tribal government or department within one, a Native non-profit, intertribal org, tribal college, ANC, NHO, tribal enterprise, Native CDFI, state-recognized tribe, or Native-entity federal contractor making the case for reservation, state, or federal funding.",
    scope: 'Reservation, state, national economic impact analysis',
    iconId: 'tribal',
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
  },
];

/** Slug -> Platform lookup. */
export const PLATFORM_BY_SLUG: Record<PlatformSlug, Platform> =
  Object.fromEntries(PLATFORMS.map((p) => [p.slug, p])) as Record<PlatformSlug, Platform>;
