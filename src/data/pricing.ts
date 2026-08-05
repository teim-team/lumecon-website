/**
 * Pricing data — single source of truth for the /pricing page.
 *
 * One Lumecon platform, three public plans. Tier ids
 * ('sprout' | 'sapling' | 'tree') match the product's tier
 * vocabulary (server/lib/tierCapabilities.js in the Team App), so
 * the signup handoff (/signup?tier=sprout) and the product agree on
 * plan identity end to end. Consultant licensing is custom-priced and
 * has no public tier. The old per-platform price matrix, the
 * Arborist consultant tier and the Toolbox add-on are gone: the
 * platform no longer sells geography, and Lumecon does not sell
 * finished analyses against its own consultant customers.
 */

export interface Plan {
  id: 'sprout' | 'sapling' | 'tree';
  name: 'Sprout' | 'Sapling' | 'Tree';
  priceAnnual: number;
  price: string;
  period: string;
  /** The one-sentence identity: "I / we / our organization ..." */
  audience: string;
  tagline: string;
  users: string;
  featured?: boolean;
  ctaLabel: string;
  ctaHref: string;
}

export const PLANS: Plan[] = [
  {
    id: 'sprout',
    name: 'Sprout',
    priceAnnual: 1000,
    price: '$1,000',
    period: '/ year',
    audience: 'I do economic analysis.',
    tagline: 'Full Lumecon model, Cedar, unlimited analysis and every supported U.S. geography.',
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
      'Everything in Sprout, plus Cedar Commons, a collaborative environment for shared projects, project notes, data collection and external collaborators.',
    users: 'Up to 10 users',
    featured: true,
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
      'Everything in Sapling, plus Cedar Grove, organizational context and calibration, and capabilities designed for analysis at organizational scale.',
    users: 'Unlimited users in one organization',
    ctaLabel: 'Start with Tree',
    ctaHref: '/signup?tier=tree',
  },
];

/** The readable 9-row detail table. `values` align with PLANS order. */
export interface PlanRow {
  label: string;
  values: [string, string, string];
}

export const PLAN_TABLE_ROWS: PlanRow[] = [
  { label: 'Annual price', values: ['$1,000', '$2,500', '$7,500'] },
  { label: 'Users', values: ['1', 'Up to 10', 'Unlimited users in one organization'] },
  {
    label: 'Economic modeling',
    values: ['Unlimited projects and analyses on the full Lumecon model', 'Same', 'Same'],
  },
  {
    label: 'U.S. geographies',
    values: ['Counties, states, the nation, reservations and trust lands', 'Same', 'Same'],
  },
  {
    label: 'Historical analysis',
    values: ['2015 to present, where the underlying data support it', 'Same', 'Same'],
  },
  {
    label: 'Analysis types',
    values: [
      'Industry, organization, tribal government, tribal enterprise and Whole Nation analysis',
      'Same',
      'Same',
    ],
  },
  {
    label: 'Cedar',
    values: [
      'Included',
      'Included for every collaborator',
      'Included, with organizational context and calibration',
    ],
  },
  {
    label: 'Cedar Commons',
    values: [
      'Not included',
      'Included. A collaborative environment for shared projects, project notes, data collection and external collaborators.',
      'Included across the organization.',
    ],
  },
  {
    label: 'Cedar Grove',
    values: [
      'Not included',
      'Not included',
      'Included. Organizational data library combining Lumecon’s analysis-ready datasets with approved internal data and reusable organizational context.',
    ],
  },
];

/**
 * Consultants use the same public plans, no separate edition: a band
 * under the plan cards instead of a custom-priced product.
 */
export const CONSULTANT_BAND = {
  kicker: 'Using Lumecon for client work?',
  headline: 'Commercial use starts with Sapling.',
  body: 'Sapling’s Cedar Commons doubles as a secure client intake and project workspace. Invite clients and collaborators to provide the materials an analysis needs, keep project data together and manage the analysis in one place, with 10 seats you can reassign as engagements change. Tree serves larger consulting organizations with unlimited organizational users, Cedar calibration and Cedar Grove.',
  value: 'Spend less time assembling the analysis and more time on the work only you can do.',
  ctaLabel: 'Talk to us about client work',
  ctaSubject: 'Using Lumecon for client work',
};

/** The pricing FAQ: the skepticism the plans and table cannot answer. */
export interface PricingFaq {
  q: string;
  a: string[];
}

export const PRICING_FAQ: PricingFaq[] = [
  {
    q: 'Why does Lumecon cost less than traditional economic impact software?',
    a: [
      'Because the economics of delivering analytical software changed. Modern cloud computing lets us operate efficiently at scale while continuing to invest in economists, engineers, data scientists, data and model development.',
    ],
  },
  {
    q: 'Is the model less capable because Lumecon costs less?',
    a: [
      'No. Every paid plan runs the same underlying Lumecon economic model. Higher tiers add collaboration, organizational data capabilities and scale.',
      'The price reflects users and organizational scale, and every plan runs the same model.',
    ],
  },
  {
    q: 'Couldn’t an economist just buy multipliers and do this themselves?',
    a: [
      'Yes. Experienced economists can perform many economic impact calculations themselves; the arithmetic is rarely the hardest part.',
      'Lumecon handles much of the surrounding data engineering, regionalization, validation, documentation, maintenance and workflow, so economists can spend more time exercising economic judgment.',
    ],
  },
  {
    q: 'Why don’t complicated analyses cost more?',
    a: [
      'Because analytical complexity is exactly what the software is supposed to handle. Multiple geographies, years, projects and scenarios shouldn’t become separate licensing events.',
      'Complexity belongs in the model, and the pricing stays simple.',
    ],
  },
  {
    q: 'Why are your prices public?',
    a: [
      'Because customers should be able to determine whether software fits their budget without sitting through a sales process. Our standard plans have standard prices.',
      'We tailor the modeling, and pricing stays standard.',
    ],
  },
  {
    q: 'Can I actually try Lumecon before paying?',
    a: [
      'Yes. Create a free account without entering a credit card. Bring your documents, use Cedar and work through an analysis yourself. Complete results unlock when you choose a paid plan.',
      'No credit card, sales call or obligation.',
    ],
  },
  {
    q: 'Can a faculty member buy Lumecon?',
    a: [
      'Yes. The public plans are open to anyone, and Sprout is priced so an individual analyst, faculty member or researcher can subscribe without an institutional procurement process. When a department or research group needs shared projects, Sapling adds Cedar Commons.',
    ],
  },
  {
    q: 'What happens when Lumecon improves?',
    a: [
      'You benefit from improvements to what your plan already includes. We continually update Lumecon’s data, modeling, workflow and product capabilities. We may introduce new capabilities associated with particular plans, but we don’t intend to turn routine improvements to an existing feature into a new add-on every time the platform gets better.',
      'You don’t buy a model and watch it age.',
    ],
  },
  {
    q: 'What if another platform has a feature Lumecon doesn’t?',
    a: [
      'Tell us what would make the work better. We deliberately focus on capabilities that improve economic impact analysis rather than adding complexity to make a feature list longer. Useful workflows, visualizations, data and analytical capabilities will continue to evolve with the platform.',
    ],
  },
];
