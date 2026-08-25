/**
 * Pricing data — single source of truth for the /pricing page.
 *
 * One Lumecon platform, four public plans — Seed, the free account,
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
  audience: 'I want to see our impact first.',
  tagline:
    'The real platform, free: bring your documents, work with Cedar, build a full analysis and see your direct effects. Full results unlock on any plan.',
  users: '1 user',
  ctaLabel: 'Start with Seed',
  ctaHref: '/signup?tier=free',
};

export const PLANS: Plan[] = [
  {
    id: 'sprout',
    name: 'Sprout',
    priceAnnual: 1000,
    price: '$1,000',
    period: '/ year',
    audience: 'I do economic analysis.',
    tagline:
      'The full Lumecon model, Cedar, unlimited analysis and every supported U.S. geography.',
    users: '1 user',
    ctaLabel: 'Start with Sprout',
    ctaHref: '/signup?tier=sprout',
  },
  {
    id: 'sapling',
    name: 'Sapling',
    priceAnnual: 2500,
    price: '$2,500',
    period: '/ year',
    audience: 'We do economic analysis.',
    tagline:
      'Everything in Sprout, plus Cedar Commons, the shared project workspace: project notes, data collection and outside collaborators.',
    users: 'Up to 10 users',
    featured: true,
    clientWork: true,
    ctaLabel: 'Start with Sapling',
    ctaHref: '/signup?tier=sapling',
  },
  {
    id: 'tree',
    name: 'Tree',
    priceAnnual: 7500,
    price: '$7,500',
    period: '/ year',
    audience: 'Our organization runs economic analysis through Lumecon.',
    tagline:
      'Everything in Sapling, plus Cedar Grove, the advanced data library, organizational context and Cedar calibration across the organization.',
    users: 'Unlimited users in one organization',
    clientWork: true,
    ctaLabel: 'Start with Tree',
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
  kicker: 'Available on its own',
  price: '$2,500',
  period: '/ year',
  users: 'Unlimited users',
  headline: 'The data library, without the model.',
  body: 'Cedar Grove is the advanced data library: public datasets cleaned, harmonized and kept analysis-ready, alongside the proprietary datasets we build ourselves. Buy it on its own for the data, or get it with Tree along with Cedar Impact and Cedar Commons.',
  bullets: [
    'Harmonized public data, maintained and versioned',
    'Lumecon’s proprietary datasets, added as they are built',
    'Unlimited people in your organization',
  ],
  ctaLabel: 'Get Cedar Grove',
  ctaHref: '/signup?product=cedar-grove',
  /**
   * The proprietary datasets are in active development. Named entries
   * go in this array as each one ships, and the section renders the
   * note alone while it is empty. Nothing here is a forward promise
   * about a specific dataset: the claim is only that what we build,
   * you get from us.
   */
  proprietaryNote:
    'We are building datasets you cannot get anywhere else, and they arrive in Cedar Grove as they are finished. A subscription includes what has shipped and what ships during your term.',
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
    label: 'Economic modeling',
    values: ['Unlimited projects and analyses on the full Lumecon model', 'Same', 'Same', 'Same'],
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
    q: 'Why does Lumecon cost less than traditional economic impact software?',
    a: [
      'Economic impact analysis is established economic science, and the arithmetic is rarely where the cost sits. The expense is in building and maintaining a reliable system around it: integrating changing datasets, cleaning and harmonizing them, regionalizing the model correctly, protecting organizational data and continuously validating results.',
      'Modern cloud computing makes that system far less expensive to operate than it once was, and we built Lumecon around that from the beginning. Lower cost does not mean lower standards, and the methods are public at lumecon.ai/methodology.',
    ],
  },
  {
    q: 'Is the model less capable because Lumecon costs less?',
    a: [
      'No. Every paid plan runs the same underlying Lumecon economic model on the same data foundation. What the higher plans add is collaboration, organizational data capabilities and scale.',
    ],
  },
  {
    q: 'Why don’t complicated analyses cost more?',
    a: [
      'Because analytical complexity is what the software is for. Multiple geographies, years, projects and scenarios should not become separate licensing events.',
      'Complexity belongs in the model, and the pricing stays simple.',
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
      'Yes. Seed, the free account, is the real platform: bring your documents, work with Cedar, build an analysis end to end and see your direct effects on the results page. Indirect, induced and total impact, and exports, unlock when you choose a paid plan.',
      'No credit card, sales call or obligation.',
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
      'Pricing it separately is also how we show what the economic model and Cedar Commons are worth on their own.',
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
      'You get the improvements to what your plan already includes. We update Lumecon’s data, modeling, workflow and product capabilities continuously. New capabilities may be associated with particular plans, but routine improvements to an existing feature do not become a new add-on.',
      'You don’t buy a model and watch it age.',
    ],
  },
  {
    q: 'Do multi-year or prepaid commitments cost less?',
    a: [
      'They can. If you qualify for more than one discount or program rate, you receive the lowest applicable price under the program rules.',
      'Subscriptions renew automatically, we email you 90 days and 30 days beforehand, and auto-renew can be turned off any time in Settings. Refer an organization and we add a month to your subscription when they become a customer, up to a full year.',
    ],
  },
  {
    q: 'What if another platform has a feature Lumecon doesn’t?',
    a: [
      'Tell us what would make the work better. We focus on capabilities that improve economic impact analysis rather than adding complexity to make a feature list longer.',
    ],
  },
];
