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
 * so a Sprout under Local shows $7.5K and a Sprout under Tribal shows
 * $10K from the same tier definition here.
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
  price: string; // formatted display price
  period: string; // e.g. "/ year"
  tagline: string;
  ctaSubject: string; // mailto subject
  highlights: string[];
  features: Array<string | { text: string; accent: 'gold' }>;
  featured?: boolean;
  note?: string;
  /** v1: gates Tree off the buy flow without dropping it from the
   *  comparison table or the visual narrative. */
  comingSoon?: boolean;
  /** Whether the tier accepts a monthly or quarterly payment plan
   *  against a 12-month commitment. Sprout has this on so smaller
   *  orgs can align with their budget cycles; Sapling and Tree
   *  are annual-prepay only. */
  paymentPlans?: boolean;
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
    paymentPlans: true,
    note: 'Monthly or quarterly payment plans available, no upcharge. 12-month commitment.',
    highlights: [
      'One user, unlimited studies',
      'Past, future, and multi-year analyses',
      'Every assumption surfaced and citable',
    ],
    features: [
      'One user',
      'Unlimited studies, every geography your platform covers',
      'Manual data entry',
      'Past, future, and multi-year analyses',
      'High-frequency alternative data (mobility signals) where available',
      'Standard PDF report, structured CSV export, and slide deck',
      'Full assumption ledger on every export',
      {
        text: 'Monthly or quarterly payment plans, no upcharge (12-month commitment)',
        accent: 'gold',
      },
    ],
  },
  {
    id: 'standard',
    name: 'Sapling',
    priceAnnual: 0,
    price: '',
    period: '',
    tagline:
      'For teams that want Cedar to process their messy data, structure it for the model, and act as a thought partner on the write-up.',
    ctaSubject: 'Sapling tier',
    highlights: [
      'Everything in Sprout',
      'Cedar processes your data and acts as a thought partner',
      'Up to 5 users on one workspace',
    ],
    features: [
      'Everything in Sprout',
      'Up to 5 users',
      {
        text: 'Full Cedar access: upload PDFs, CSVs, and XLSX files, with more formats expanding over time',
        accent: 'gold',
      },
      {
        text: 'Cedar structures the inputs, surfaces every assumption, and acts as a thought partner on the write-up',
        accent: 'gold',
      },
      'Review queues for HR, payroll, finance, and compliance inputs',
    ],
  },
  {
    id: 'leader',
    name: 'Tree',
    priceAnnual: 0,
    price: '',
    period: '',
    tagline:
      'For organizations that want custom-branded outputs, data harmonized across every study, complementary administrative datasets that show how socioeconomic outcomes are actually changing on the ground, and compliance-ready reporting on top of everything in Sapling.',
    ctaSubject: 'Tree tier',
    featured: true,
    highlights: [
      'Everything in Sapling',
      'Custom branding: upload your logos and images, automatically formatted into every output',
      'Cedar Grove: harmonized data + complementary admin data on socioeconomic outcomes',
    ],
    features: [
      'Everything in Sapling',
      'Up to 10 users',
      {
        text: 'Custom branding: upload your logos, colors, and images once and every output (PDF report, deck, executive summary) picks them up automatically',
        accent: 'gold',
      },
      {
        text: 'Cedar Grove: your data stays harmonized across every study, so the second study is easier than the first and the tenth is easier than the second',
        accent: 'gold',
      },
      {
        text: 'Complementary administrative data layered alongside your own, showing how local socioeconomic outcomes are actually changing. Reinforces the economic-impact narrative with real outcome evidence.',
        accent: 'gold',
      },
      {
        text: 'Compliance-ready reporting for grants, federal submissions, and audited annual reports',
        accent: 'gold',
      },
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
  priceAnnual: 0, // pulled from PLATFORMS.consultant.tierPrices.flat at render time
  price: '',
  period: '',
  tagline:
    'If your firm runs economic impact studies for outside clients, the Arborist plan is built for that. You pay $15K for two projects together, one project per client, and when those wrap up you book the next engagement as a fresh $15K with the next two clients.',
  ctaSubject: 'Arborist plan for Consultant',
  highlights: [
    'Two projects in one engagement, one client per project',
    'Flat $15K for the pair of projects, not an auto-renewing subscription',
    'Every geography is included, from reservation up to national',
  ],
  features: [
    'Run economic impact studies on behalf of two outside clients in one engagement',
    'Single-entity projects only, so no rolling several clients into one consortium',
    'Renew with a fresh $15K when those two projects wrap, possibly with new clients',
    'Every geography is included, from reservation up to county, state, and national',
    'Past, future, and multi-year analyses, with every assumption surfaced and citable',
    'Presentation-ready PDF and structured CSV exports',
    'Cedar, Cedar Grove, and the Toolbox add-on stay with the customer subscriptions where they belong, so they are not part of this plan',
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
  priceLabel: string; // "+$15K"
  priceAnnual: number; // 15000
  period: string; // "fixed-price add-on, per study"
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
  tagline:
    'Add our team to any Lumecon subscription. We turn your platform outputs into a finished economic impact package, branded with your visual identity and your own images so the deliverable reads as yours.',
  highlights: [
    'Full written report, deck, and executive summary',
    'Three rounds of revisions',
    'Branded outputs using your logo, colors, and images',
  ],
  features: [
    'Full written economic impact report',
    'Presentation deck',
    'Executive summary',
    'Source record and assumption ledger',
    'One tailored memo or media-ready findings sheet',
    'Three rounds of revisions on every deliverable',
    'Branded deliverables aligned to your visual identity (logo, colors, typography)',
    'Drop in your own images, photography and charts so the report reads as your organization\'s own',
    'Press- and publication-ready outputs',
    'Flat fee, taxes included',
  ],
  note: 'Requires an active Lumecon subscription (Tree recommended). Note: at Tree, custom branding lets you upload your logos and images once and every output Cedar produces picks them up automatically. Toolbox is the option you add when you also want our team writing and designing the finished package. Not available on the Consultant plan.',
};

/* ---------- Comparison rows ---------- */

export type ComparisonCell = 'yes' | 'none' | 'soon' | string;

export interface ComparisonRow {
  capability: string;
  sprout: ComparisonCell;
  sapling: ComparisonCell;
  tree: ComparisonCell;
}

/** Comparison rows. Designed for PRECISION, not row count.
 *
 *  Each row is a real, current, buyable difference between the three
 *  tiers. Things that are universally included get one row each so
 *  buyers can confirm them at a glance ("am I capped on studies?
 *  is the assumption ledger really on every tier?"). Things that
 *  differ between tiers are the ones doing the actual work
 *  ("where does Cedar start? where does Cedar Grove come in?").
 *
 *  Geographies row is platform-aware: the cell label is rewritten by
 *  the picker script (data-platform-geographies) so a Local visitor
 *  sees "City, county, state, national" and a Tribal visitor sees
 *  "Reservation, state, national" — not the other way around.
 *
 *  Things deliberately NOT in the comparison table:
 *    - Support/implementation tiers (not a customer-facing
 *      differentiator on this brand)
 *    - SSO/SCIM (it's enterprise plumbing; not the headline reason
 *      to buy Tree)
 *    - Roadmap features (the analytic suite, grant trackers, etc.);
 *      they earn a row by shipping
 */
export const COMPARISON_ROWS: ComparisonRow[] = [
  { capability: 'Users', sprout: '1', sapling: 'Up to 5', tree: 'Up to 10' },
  {
    capability: 'Geographies',
    sprout: 'All included',
    sapling: 'All included',
    tree: 'All included',
  },
  {
    capability: 'Cedar: upload messy data and act as a thought partner',
    sprout: 'none',
    sapling: 'yes',
    tree: 'yes',
  },
  {
    capability:
      'Custom branding: upload your logos, colors, and images, automatically formatted into every output',
    sprout: 'none',
    sapling: 'none',
    tree: 'yes',
  },
  {
    capability:
      'Cedar Grove: harmonized data + complementary administrative datasets + compliance-ready reporting',
    sprout: 'none',
    sapling: 'none',
    tree: 'yes',
  },
  {
    capability: 'Payment cadence',
    sprout: 'Annual, monthly, or quarterly',
    sapling: 'Annual',
    tree: 'Annual',
  },
];

/* ---------- Prepayment ladder ---------- */

export interface PrepaymentTier {
  years: 1 | 2 | 3;
  label: string;
  discountPct: number;
  note: string;
}

export const ANNUAL_SUBSCRIPTION_DISCOUNTS: PrepaymentTier[] = [
  { years: 1, label: 'Annual', discountPct: 0, note: 'Standard annual subscription.' },
  {
    years: 2,
    label: '2-year prepaid',
    discountPct: 10,
    note: 'Recommended for multi-year continuity and budget certainty.',
  },
  {
    years: 3,
    label: '3-year prepaid',
    discountPct: 15,
    note: 'Best value; locks pricing for three years.',
  },
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
  {
    code: 'CONF10',
    label: 'Conference code',
    discountPct: 10,
    audience: 'Conference, webinar, and partner-event offers',
  },
  {
    code: 'PARTNER25',
    label: 'Partner code',
    discountPct: 25,
    audience: 'Approved partner and early-access organizations',
  },
  {
    code: 'LUMECONTEST100',
    label: 'Internal testing comp',
    discountPct: 100,
    audience: 'Internal checkout and QA testing only',
    internalOnly: true,
  },
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
