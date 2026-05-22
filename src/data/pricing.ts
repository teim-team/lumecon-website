/**
 * Pricing data — single source of truth for the /pricing page.
 *
 * Ported from the spec written against `src/pages/Pricing.jsx` on
 * branch claude/explore-lumecon-foundation-BDWKd. Field shape and
 * tier ids match that JSX surface so a future merge stays mechanical
 * (e.g., `id: 'starter' | 'standard' | 'leader'` token stays stable
 * even though the public name swaps Sprout / Sapling / Tree).
 *
 * v1 launch note: the THIRD tier ("Tree") is NOT shipping at launch.
 * Its data is kept here so the comparison table can preview what is
 * coming, but the tier card renders with the `comingSoon` treatment
 * (no buyable CTA, no price line) and the CTA below the card routes
 * to a notify-me mailto instead of "Request access."
 *
 * Prices below are placeholders. Update PUBLIC_PRICING_TIERS once
 * finance signs off; the meta description in /pricing.astro reads
 * its values from this module, so editing the tier prices is
 * enough — nothing else needs changing.
 */

export interface PricingTier {
  id: 'starter' | 'standard' | 'leader';
  name: string;
  priceAnnual: number;
  price: string;          // formatted display price
  period: string;         // e.g. "/ year"
  tagline: string;
  ctaSubject: string;     // mailto subject
  highlights: string[];
  features: Array<string | { text: string; accent: 'gold' }>;
  featured?: boolean;
  note?: string;
  /** v1: gates Tree off the buy flow without dropping it from the
   *  comparison table or the visual narrative. */
  comingSoon?: boolean;
}

export const PUBLIC_PRICING_TIERS: PricingTier[] = [
  {
    id: 'starter',
    name: 'Sprout',
    priceAnnual: 5_000,
    price: '$5,000',
    period: '/ year',
    tagline: 'For one person who has the core numbers and needs clear results.',
    ctaSubject: 'Sprout tier',
    highlights: [
      'Reservation, state, and national analysis',
      'Past, future, and multi-year runs',
      'Assumption ledger on every export',
    ],
    features: [
      'One user',
      'Workspace included',
      'Manual data entry',
      'Full reservation, state, and national impact analysis',
      'Past, future, and multi-year analyses',
      'High-frequency mobility signals where available',
      'Council-ready PDF and structured CSV exports',
      'Full assumption ledger on every export',
      'Standard email support',
    ],
  },
  {
    id: 'standard',
    name: 'Sapling',
    priceAnnual: 15_000,
    price: '$15,000',
    period: '/ year',
    tagline: 'For teams that want Cedar — our AI assistant — to turn records into analysis-ready inputs.',
    ctaSubject: 'Sapling tier',
    highlights: [
      'Everything in Sprout',
      'Full Cedar access',
      'Cedar aligns files to analysis-ready inputs',
    ],
    features: [
      'Everything in Sprout',
      'Up to 5 users',
      { text: 'Full Cedar access', accent: 'gold' },
      'Guidance can be tailored to advocacy, investment, grants, planning, communications, or compliance',
      'Cedar aligns files to analysis-ready inputs you review and control',
      'Workspace review queues for HR, payroll, finance, council, and compliance inputs',
      'Upload PDFs, images, spreadsheets, payroll, finance, audit, and planning files',
      'Priority email support, 24h response target',
    ],
  },
  {
    id: 'leader',
    name: 'Tree',
    priceAnnual: 25_000,
    price: '$25,000',
    period: '/ year',
    tagline: 'For organizations that need Cedar Grove, reporting workflows, and implementation support.',
    ctaSubject: 'Tree tier',
    featured: true,
    comingSoon: true,
    note: 'Cedar Grove is also available as a standalone subscription. Contact contact@lumecon.ai.',
    highlights: [
      'Everything in Sapling',
      'Cedar Grove + full analytic suite',
      'Grant, SBA, Federal, and compliance trackers',
    ],
    features: [
      'Everything in Sapling',
      'Up to 10 users',
      { text: 'Cedar Grove access', accent: 'gold' },
      { text: 'Full analytic suite: feasibility, cost-benefit, ROI, causal inference', accent: 'gold' },
      'Data, trackers, and reporting materials matched to your intended uses',
      { text: 'Grant, foundation, SBA benefits, Federal reporting, and compliance trackers', accent: 'gold' },
      'Reusable data library for recurring submissions',
      'Regularly added high-frequency, administrative, and public data sources',
      'Deadline tracking and submission prep tied to the person/entity management board',
      'SSO and SCIM provisioning',
      'Dedicated implementation support',
    ],
  },
];

/* ---------- Comparison rows ---------- */

export type ComparisonCell = 'yes' | 'none' | 'soon' | string;

export interface ComparisonRow {
  capability: string;
  sprout: ComparisonCell;
  sapling: ComparisonCell;
  tree: ComparisonCell;
}

/** 21 hand-ordered rows from the source spec. "Tree" cells that
 *  describe features only Tree includes render as "Coming soon" on
 *  the launch page since the tier itself isn't buyable yet. */
export const COMPARISON_ROWS: ComparisonRow[] = [
  { capability: 'Users',                                                           sprout: '1',              sapling: 'Up to 5',       tree: 'Up to 10' },
  { capability: 'Reservation, state, and national scope',                          sprout: 'yes',            sapling: 'yes',           tree: 'yes' },
  { capability: 'Past, future, and multi-year analyses',                           sprout: 'yes',            sapling: 'yes',           tree: 'yes' },
  { capability: 'Assumption ledger on every export',                               sprout: 'yes',            sapling: 'yes',           tree: 'yes' },
  { capability: 'Council-ready PDF and CSV exports',                               sprout: 'yes',            sapling: 'yes',           tree: 'yes' },
  { capability: 'High-frequency mobility signals where available',                 sprout: 'yes',            sapling: 'yes',           tree: 'yes' },
  { capability: 'Cedar AI assistant',                                              sprout: 'none',           sapling: 'yes',           tree: 'yes' },
  { capability: 'Document import (Cedar extracts inputs from PDFs)',               sprout: 'none',           sapling: 'yes',           tree: 'yes' },
  { capability: 'Use-case tailoring (advocacy, grants, compliance, planning)',     sprout: 'none',           sapling: 'yes',           tree: 'yes' },
  { capability: 'Workspace review queues',                                         sprout: 'none',           sapling: 'yes',           tree: 'yes' },
  { capability: 'Cedar Grove: curated data, filings, source materials',            sprout: 'none',           sapling: 'none',          tree: 'soon' },
  { capability: 'Grant, SBA, federal, and compliance trackers',                    sprout: 'none',           sapling: 'none',          tree: 'soon' },
  { capability: 'Reusable data library for recurring submissions',                 sprout: 'none',           sapling: 'none',          tree: 'soon' },
  { capability: 'Data exploration — guided EDA on any workspace dataset',          sprout: 'none',           sapling: 'yes',           tree: 'yes' },
  { capability: 'Feasibility studies (NPV, break-even, sensitivity)',              sprout: 'none',           sapling: 'none',          tree: 'soon' },
  { capability: 'Cost-benefit analysis (federal-grant-aligned)',                   sprout: 'none',           sapling: 'none',          tree: 'soon' },
  { capability: 'ROI modeling (IRR, payback, scenario bands)',                     sprout: 'none',           sapling: 'none',          tree: 'soon' },
  { capability: 'Causal inference (diff-in-diff, RDD, synthetic control, IV)',     sprout: 'none',           sapling: 'none',          tree: 'soon' },
  { capability: 'SSO and SCIM provisioning',                                       sprout: 'none',           sapling: 'none',          tree: 'soon' },
  { capability: 'Dedicated implementation support',                                sprout: 'none',           sapling: 'none',          tree: 'soon' },
  { capability: 'Support response target',                                         sprout: 'Standard email', sapling: 'Priority, 24h', tree: 'Dedicated' },
];

/* ---------- Prepayment ladder ---------- */

export interface PrepaymentTier {
  years: 1 | 2 | 3;
  label: string;
  discountPct: number;
  note: string;
}

export const ANNUAL_SUBSCRIPTION_DISCOUNTS: PrepaymentTier[] = [
  { years: 1, label: 'Annual',         discountPct: 0,  note: 'Standard annual subscription.' },
  { years: 2, label: '2-year prepaid', discountPct: 10, note: 'Recommended for pilot-to-v1 continuity and budget certainty.' },
  { years: 3, label: '3-year prepaid', discountPct: 15, note: 'Best value; locks pricing through implementation and early benchmarking.' },
];

/* ---------- Promo codes ---------- */

export interface DiscountCode {
  code: string;
  label: string;
  discountPct: number;
  audience: string;
  internalOnly?: boolean;
}

/** Promo codes the marketing-site discount input recognizes.
 *  IMPORTANT: this catalog is a UI/test contract only. Real
 *  discount enforcement must live on the billing provider / server
 *  before any code is publicly distributed — these client-side
 *  values are user-visible in the bundle. */
export const PRODUCT_DISCOUNT_CODES: DiscountCode[] = [
  { code: 'CONF10',          label: 'Conference code',       discountPct: 10,  audience: 'Conference, webinar, and partner-event offers' },
  { code: 'PILOT25',         label: 'Pilot partner code',    discountPct: 25,  audience: 'Approved pilot organizations and early design partners' },
  { code: 'LUMECONTEST100',  label: 'Internal testing comp', discountPct: 100, audience: 'Internal checkout and QA testing only', internalOnly: true },
];

export const normalizeDiscountCode = (raw: string): string => raw.trim().toUpperCase();

export const getProductDiscountCode = (raw: string): DiscountCode | null => {
  const norm = normalizeDiscountCode(raw);
  if (!norm) return null;
  return PRODUCT_DISCOUNT_CODES.find((c) => c.code === norm) ?? null;
};

export interface AppliedDiscount {
  discount: DiscountCode;
  originalAnnual: number;
  finalAnnual: number;
  savingsAnnual: number;
}

export const applyDiscountToAnnualPrice = (annual: number, code: DiscountCode): AppliedDiscount => {
  const savings = Math.round(annual * (code.discountPct / 100));
  const finalAnnual = Math.max(0, annual - savings);
  return { discount: code, originalAnnual: annual, finalAnnual, savingsAnnual: savings };
};

/* ---------- Product lines (placeholder for future routing) ---------- */

export interface ProductLine {
  id: 'tribal-economic-impact' | 'local-economic-impact' | 'global-economic-impact';
  name: string;
  audience: string;
  scope: string;
}

export const PRODUCT_LINES: ProductLine[] = [
  {
    id: 'tribal-economic-impact',
    name: 'Tribal Economic Impact',
    audience: 'Tribes, state-recognized tribes, ANCs, NHOs, tribal enterprises, chapters, Indigenous CDFIs, Indigenous-led institutions',
    scope: 'Reservation, state, national economic impact analysis',
  },
  {
    id: 'local-economic-impact',
    name: 'Local Economic Impact',
    audience: 'Nonprofits, municipalities, foundations, local institutions',
    scope: 'Local & regional impact analysis outside Indigenous-economy workflows',
  },
  {
    id: 'global-economic-impact',
    name: 'Global Economic Impact',
    audience: 'Organizations needing broader market, supply-chain, or international analysis',
    scope: 'National, international, cross-border analysis',
  },
];
