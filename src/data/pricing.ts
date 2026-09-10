/**
 * Pricing data — single source of truth for the /pricing page.
 *
 * One Lumecon platform, four public plans — Seed, the free tier,
 * then Sprout, Sapling and Tree — plus Cedar Grove, which is sold on
 * its own. Tier ids ('free' | 'sprout' | 'sapling' | 'tree') match the
 * product's tier vocabulary (server/lib/tierCapabilities.js in the Team
 * App), so the signup handoff (/signup?tier=sprout) and the product
 * agree on plan identity end to end. Seed's display name is marketing;
 * its id stays 'free' everywhere machines read it.
 *
 * Seed shows the direct-effects preview on the results page (indirect,
 * induced and total unlock on any paid plan, exports too) — the gating
 * itself lives server-side in the product; see
 * docs/seed-tier-spec.md for the contract.
 *
 * What each thing is, because the three Cedar names are easy to blur:
 *
 *   Cedar          the AI economic analyst. In every plan, including the
 *                  free account. It reads what you already have, tells
 *                  you what the data will support and where the gaps
 *                  are, learns how you work and offers interpretation,
 *                  so the analysis is not done alone.
 *   Cedar Commons  the shared project workspace. Sapling and up.
 *   Cedar Grove    the advanced data library: harmonized public data and
 *                  Lumecon's proprietary datasets. Sold on its own for
 *                  $2,500 with unlimited users, and included in Tree.
 *
 * The page is deliberately pricing and an FAQ. Everything the page used
 * to argue in prose sections (why it costs less, why complexity is
 * free, why the prices are public, how consultants license it) is an
 * FAQ answer now: one sentence to click, the reasoning behind it. The
 * rest of the site is where the product gets explained.
 */

export interface Plan {
  id: 'free' | 'sprout' | 'sapling' | 'tree';
  name: 'Seed' | 'Sprout' | 'Sapling' | 'Tree';
  priceAnnual: number;
  price: string;
  period: string;
  /** The one-sentence identity: "I / we / our organization ..." */
  audience: string;
  tagline: string;
  users: string;
  featured?: boolean;
  /**
   * Licensed for work delivered to someone else's organization. The
   * plan cards carry this as a small marker rather than the page
   * carrying a consultant band: a consultancy or a partner org reading
   * the cards can see which plans cover client work without reading a
   * paragraph about it.
   */
  clientWork?: boolean;
  ctaLabel: string;
  ctaHref: string;
}

/**
 * Seed, the free account, is a real plan with a card and a table
 * column on /pricing — but it is deliberately NOT in PLANS: choose-plan
 * and checkout iterate PLANS as the purchasable tiers, and Seed never
 * passes through checkout (signup?tier=free is its whole flow).
 */
export const SEED: Plan = {
  id: 'free',
  name: 'Seed',
  priceAnnual: 0,
  price: 'Free',
  period: '',
  audience: 'Evaluate Lumecon before paying.',
  tagline:
    'Request free Seed access during the private beta. Once admitted, bring your documents, work with Cedar, build an analysis and see direct effects. Full results unlock on a paid plan.',
  users: '1 user',
  ctaLabel: 'Request Seed access',
  ctaHref: '/signup?tier=free',
};

export const PLANS: Plan[] = [
  {
    id: 'sprout',
    name: 'Sprout',
    priceAnnual: 1000,
    price: '$1,000',
    period: '/ year',
    audience: 'For an individual analyst.',
    tagline:
      'Cedar Impact in full, with Cedar, unlimited analyses and every supported U.S. geography.',
    users: '1 user',
    ctaLabel: 'Request Sprout access',
    ctaHref: '/signup?tier=sprout',
  },
  {
    id: 'sapling',
    name: 'Sapling',
    priceAnnual: 2500,
    price: '$2,500',
    period: '/ year',
    audience: 'For teams and client work.',
    tagline:
      'Everything in Sprout, plus Cedar Commons, the shared project workspace: project notes, data collection and outside collaborators.',
    users: 'Up to 10 users',
    featured: true,
    clientWork: true,
    ctaLabel: 'Request Sapling access',
    ctaHref: '/signup?tier=sapling',
  },
  {
    id: 'tree',
    name: 'Tree',
    priceAnnual: 7500,
    price: '$7,500',
    period: '/ year',
    audience: 'For organization-wide use.',
    tagline:
      'Everything in Sapling, plus Cedar Grove, the advanced data library, organizational context and Cedar calibration across the organization.',
    users: 'Unlimited users in one organization',
    clientWork: true,
    ctaLabel: 'Request Tree access',
    ctaHref: '/signup?tier=tree',
  },
];

/** The marker the cards show, and the one line that explains it. */
export const CLIENT_WORK = {
  chip: 'Client work',
  note: 'Consultancies and partner organizations delivering analysis to someone else start at Sapling.',
};

/**
 * Cedar Grove, sold on its own. It is the data, not the model: no
 * economic engine, no Cedar Commons, unlimited people inside your
 * organization. Included at no extra cost in Tree.
 */
export const CEDAR_GROVE = {
  name: 'Cedar Grove',
  kicker: 'Standalone subscription',
  price: '$2,500',
  period: '/ year',
  users: 'Unlimited users',
  headline: 'Use the data library on its own or as part of Tree.',
  body: 'Cedar Grove is the advanced data library: public datasets cleaned, harmonized and kept analysis-ready, alongside released proprietary datasets from Lumecon. Subscribe to the library on its own, or receive it with Tree alongside Cedar Impact and Cedar Commons.',
  bullets: [
    'Harmonized public data, maintained and versioned',
    'Lumecon’s proprietary datasets, added as they are built',
    'Unlimited people in your organization',
  ],
  ctaLabel: 'Request Cedar Grove access',
  ctaHref: '/signup?product=cedar-grove',
  /**
   * The proprietary datasets are in active development. Named entries
   * go in this array as each one ships, and the section renders the
   * note alone while it is empty. Nothing here is a forward promise
   * about a specific dataset: the claim is only that what we build,
   * you get from us.
   */
  proprietaryNote:
    'The Cedar Grove catalog lists proprietary datasets as they are released. Your subscription includes the datasets available in Cedar Grove during your term.',
  proprietaryDatasets: [] as { name: string; blurb: string }[],
};

/** The readable detail table. `values` align with [SEED, ...PLANS] order. */
export interface PlanRow {
  label: string;
  values: [string, string, string, string];
}

export const PLAN_TABLE_ROWS: PlanRow[] = [
  { label: 'Annual price', values: ['Free', '$1,000', '$2,500', '$7,500'] },
  { label: 'Users', values: ['1', '1', 'Up to 10', 'Unlimited users in one organization'] },
  {
    label: 'Cedar Impact',
    values: ['Unlimited projects and analyses on the full economic model', 'Same', 'Same', 'Same'],
  },
  {
    label: 'Results',
    values: [
      'Direct effects, on the real results page. Indirect, induced and total unlock on any paid plan.',
      'Complete: direct, indirect, induced and total impact, with tax impacts',
      'Same',
      'Same',
    ],
  },
  {
    label: 'Exports',
    values: ['Not included', 'Workbook (XLSX), CSV tables and printable summary', 'Same', 'Same'],
  },
  {
    label: 'U.S. geographies',
    values: ['Every supported geography, with no add-ons', 'Same', 'Same', 'Same'],
  },
  {
    label: 'Historical analysis',
    values: ['2015 to present, where the underlying data support it', 'Same', 'Same', 'Same'],
  },
  {
    label: 'Cedar',
    values: [
      'Included',
      'Included',
      'Included for every collaborator',
      'Included, with organizational context and calibration',
    ],
  },
  {
    label: 'Cedar Commons',
    values: [
      'Not included',
      'Not included',
      'Included. Shared projects, project notes, data collection and outside collaborators.',
      'Included across the organization.',
    ],
  },
  {
    label: 'Cedar Grove',
    values: [
      'Sold separately, $2,500',
      'Sold separately, $2,500',
      'Sold separately, $2,500',
      'Included. Harmonized public data and Lumecon’s proprietary datasets.',
    ],
  },
  {
    label: 'Client work',
    values: ['Evaluation only', 'Your own organization', 'Included', 'Included'],
  },
];

/**
 * The FAQ carries the page. Each question is one sentence you can read
 * without opening it, and the answer behind it is the argument the page
 * used to make in a full-width section.
 */
export interface PricingFaq {
  q: string;
  a: string[];
}

export const PRICING_FAQ: PricingFaq[] = [
  {
    q: 'How is Lumecon priced?',
    a: [
      'Lumecon uses flat annual plans rather than charging separately for each analysis or supported geography. The surrounding work still matters: integrating data, regionalizing the model, documenting assumptions and maintaining the workflow.',
      'The same underlying model and data foundation run on every paid plan. Our public methodology explains how analyses are built.',
    ],
  },
  {
    q: 'Does every paid plan use the same economic model?',
    a: [
      'Yes. Every paid plan runs the same Lumecon economic model on the same data foundation. Higher plans add collaboration, organizational data capabilities and scale.',
    ],
  },
  {
    q: 'Why don’t complicated analyses cost more?',
    a: [
      'Lumecon prices access by plan rather than by analysis complexity. Supported geographies, years, projects and scenarios do not create separate fees.',
    ],
  },
  {
    q: 'Why are your prices public?',
    a: [
      'Because you should be able to tell whether software fits your budget without sitting through a sales process. We also spend less selling the platform and more improving it, which is why the price sits on this page instead of behind a call.',
    ],
  },
  {
    q: 'Can I actually try Lumecon before paying?',
    a: [
      'Yes. Request Seed access during the private beta. When your place is ready, you can bring your documents, work with Cedar, build an analysis end to end and see direct effects on the real results page. Indirect, induced and total impact, and exports, unlock on a paid plan.',
      'Access opens in waves. There is no credit card or obligation.',
    ],
  },
  {
    q: 'Can I use Lumecon for client work?',
    a: [
      'Yes, starting with Sapling. Cedar Commons doubles as a client intake and project workspace: invite clients and collaborators to supply what an analysis needs, keep the project data together and manage the work in one place, with ten seats you can reassign as engagements change.',
      'Tree serves larger consulting and partner organizations with unlimited organizational users, Cedar calibration and Cedar Grove.',
    ],
  },
  {
    q: 'What is Cedar Grove, and why is it sold separately?',
    a: [
      'Cedar Grove is the advanced data library: harmonized public data plus the proprietary datasets we build. It is useful without Cedar Impact, so you can buy it on its own for $2,500 a year with unlimited users, and it comes with Tree.',
    ],
  },
  {
    q: 'Couldn’t an economist just buy multipliers and do this themselves?',
    a: [
      'Yes. Experienced economists can perform many of these calculations themselves, and the arithmetic is rarely the hardest part.',
      'Lumecon handles the surrounding data engineering, regionalization, validation, documentation, maintenance and workflow, so economists spend more time exercising economic judgment.',
    ],
  },
  {
    q: 'Can an individual researcher or faculty member buy Lumecon?',
    a: [
      'Yes. Sprout is priced so an individual analyst, faculty member or researcher can subscribe without an institutional procurement process. When a department or research group needs shared projects, Sapling adds Cedar Commons.',
    ],
  },
  {
    q: 'What happens when Lumecon improves?',
    a: [
      'When we improve a feature included in your plan, that improvement remains part of the plan. New capabilities may be associated with particular plans.',
      'The pricing page will identify which capabilities are included in each plan.',
    ],
  },
  {
    q: 'Do multi-year or prepaid commitments cost less?',
    a: [
      'Contact us to discuss multi-year or prepaid terms. Any approved discount and the price that applies will be stated before purchase.',
      'Renewal, cancellation and notice terms will be stated in your order form or subscription agreement.',
    ],
  },
];
