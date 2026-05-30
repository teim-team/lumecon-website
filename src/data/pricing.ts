/**
 * Pricing data — single source of truth for the /pricing page.
 * Tier ids ('starter' | 'standard' | 'leader') stay stable even as
 * the public name swaps (Sprout / Sapling / Tree) so the
 * rendered names can change without touching the data shape.
 *
 * Per-platform prices live on the Platform records in
 * src/data/platforms.ts (`tierPrices` field). This file holds the
 * tier metadata (names, taglines, highlights, features) that's the
 * same across every platform; the page merges the two at render time
 * so a Sprout under Local shows $10K and a Sprout under Tribal shows
 * $12.5K from the same tier definition here.
 *
 * v1 launch notes:
 *   - The Tree tier ships for buyable platforms now that prices are
 *     set. Tribal Tree pricing follows the Tribal price column; Local
 *     Tree pricing follows Local. The `comingSoon` flag below remains
 *     on Tree only for platforms whose Tree column isn't priced yet.
 *   - The GLOBAL platform is NOT shipping at launch. Its tile on
 *     the platform picker carries the `comingSoon` treatment.
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
    priceAnnual: 0,
    price: '',
    period: '',
    tagline: 'For one person who has the core numbers and needs clear results.',
    ctaSubject: 'Sprout tier',
    highlights: [
      'Reservation, county, state, and national analysis',
      'Past, future, and multi-year runs',
      'Assumption ledger on every export',
    ],
    features: [
      'One user',
      'Workspace included',
      'Manual data entry',
      'Full reservation, county, state, and national impact analysis',
      'Past, future, and multi-year analyses',
      'High-frequency alternative data (mobility signals) where available',
      'Council-ready PDF and structured CSV exports',
      'Full assumption ledger on every export',
      'Standard email support',
    ],
  },
  {
    id: 'standard',
    name: 'Sapling',
    priceAnnual: 0,
    price: '',
    period: '',
    tagline: 'For teams that want Cedar (our AI assistant) to turn records into analysis-ready inputs.',
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
    priceAnnual: 0,
    price: '',
    period: '',
    tagline: 'For organizations that need Cedar Grove, reporting workflows, and implementation support.',
    ctaSubject: 'Tree tier',
    featured: true,
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
      'Regularly added alternative, administrative, and public data sources',
      'Deadline tracking and submission prep tied to the person/entity management board',
      'SSO and SCIM provisioning',
      'Dedicated implementation support',
    ],
  },
];

/* ---------- Consultant: single-tier service offering ----------
 *
 * The Consultant platform is structurally different from Local /
 * Tribal / Global: one fixed tier (Arborist), one flat annual price,
 * no Cedar, no Toolbox. Modeled as its own tier definition so the
 * pricing page can render it directly when the Consultant platform
 * is picked, instead of reusing the Sprout / Sapling / Tree ladder. */
export const CONSULTANT_TIER: PricingTier = {
  id: 'starter', // schema slot; the page renders by name, not id
  name: 'Arborist',
  priceAnnual: 0,  // pulled from PLATFORMS.consultant.tierPrices.flat at render time
  price: '',
  period: '',
  tagline: 'For consultants delivering Lumecon-backed economic impact studies to two distinct client entities in a single fiscal year.',
  ctaSubject: 'Arborist tier for Consultant',
  highlights: [
    'Two distinct client entities (no consortium)',
    'One fiscal year of analyses',
    'All geographies: reservation, county, state, national',
  ],
  features: [
    'Run economic impact studies on behalf of two distinct outside entities',
    'Single fiscal year of analyses across both projects',
    'All geographies included: reservation, county, state, national',
    'Past, future, and multi-year analyses',
    'Council-ready PDF and structured CSV exports',
    'Full assumption ledger on every export',
    'Standard email support',
    'Cedar AI assistant is not included on this plan',
    'Projects cannot be consortia (a single entity per project)',
    'Toolbox add-on is not available on this plan',
  ],
};

/* ---------- Toolbox add-on ----------
 *
 * A done-for-you study package that attaches to any active Lumecon
 * subscription. Cannot be bought standalone — the add-on relies on
 * the customer's existing Lumecon platform (Cedar, data, source
 * record, modeling workflow) to keep the price flat at $15K. Hidden
 * from the Consultant platform (service offerings don't get the
 * add-on). */
export interface AddOn {
  id: 'toolbox';
  name: string;
  priceLabel: string;     // "+$15K"
  priceAnnual: number;    // 15000
  period: string;         // "fixed-price add-on, per study"
  tagline: string;
  highlights: string[];
  features: string[];
  note: string;
}

export const TOOLBOX_ADDON: AddOn = {
  id: 'toolbox',
  name: 'Toolbox',
  priceLabel: '+$15K',
  priceAnnual: 15000,
  period: 'fixed-price add-on, per study',
  tagline: 'Add our team to any Lumecon subscription. We turn your platform outputs into a finished, presentation-ready economic impact package.',
  highlights: [
    'Full written report, deck, and executive summary',
    'Three rounds of revisions',
    'Branded deliverables, press-ready',
  ],
  features: [
    'Full written economic impact report',
    'Presentation deck',
    'Executive summary',
    'Source record and assumption ledger',
    'One tailored memo or media-ready findings sheet',
    'Three rounds of revisions on every deliverable',
    'Branded deliverables aligned to your visual identity',
    'Press- and publication-ready outputs',
    'Flat fee, taxes included',
  ],
  note: 'Requires an active Lumecon subscription (Sapling or Tree recommended). Not available on the Consultant plan.',
};

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
  { capability: 'Reservation, county, state, and national scope',                  sprout: 'yes',            sapling: 'yes',           tree: 'yes' },
  { capability: 'Past, future, and multi-year analyses',                           sprout: 'yes',            sapling: 'yes',           tree: 'yes' },
  { capability: 'Assumption ledger on every export',                               sprout: 'yes',            sapling: 'yes',           tree: 'yes' },
  { capability: 'Council-ready PDF and CSV exports',                               sprout: 'yes',            sapling: 'yes',           tree: 'yes' },
  { capability: 'High-frequency alternative data (mobility signals) where available', sprout: 'yes',          sapling: 'yes',           tree: 'yes' },
  { capability: 'Cedar AI assistant',                                              sprout: 'none',           sapling: 'yes',           tree: 'yes' },
  { capability: 'Document import (Cedar extracts inputs from PDFs)',               sprout: 'none',           sapling: 'yes',           tree: 'yes' },
  { capability: 'Use-case tailoring (advocacy, grants, compliance, planning)',     sprout: 'none',           sapling: 'yes',           tree: 'yes' },
  { capability: 'Workspace review queues',                                         sprout: 'none',           sapling: 'yes',           tree: 'yes' },
  { capability: 'Cedar Grove: curated data, filings, source materials',            sprout: 'none',           sapling: 'none',          tree: 'soon' },
  { capability: 'Grant, SBA, federal, and compliance trackers',                    sprout: 'none',           sapling: 'none',          tree: 'soon' },
  { capability: 'Reusable data library for recurring submissions',                 sprout: 'none',           sapling: 'none',          tree: 'soon' },
  { capability: 'Data exploration (guided EDA on any workspace dataset)',          sprout: 'none',           sapling: 'yes',           tree: 'yes' },
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
  { years: 2, label: '2-year prepaid', discountPct: 10, note: 'Recommended for pilot-to-launch continuity and budget certainty.' },
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

/* ---------- Product lines / pricing platforms ----------
 *
 * Re-exported from src/data/platforms.ts so anything that imported
 * PRODUCT_LINES or ProductLine from this file keeps working. The
 * underlying data (name, fitIf, audience, scope, etc.) lives in
 * platforms.ts; this file is just the comparison-table / discount
 * surface for the pricing page. */
export { PLATFORMS as PRODUCT_LINES } from './platforms';
export type { Platform as ProductLine } from './platforms';
