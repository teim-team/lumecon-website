/**
 * Pricing data — single source of truth for the /pricing page.
 *
 * One Lumecon platform, three public plans. Tier ids
 * ('starter' | 'standard' | 'leader') stay stable so the
 * signup handoff (/signup?tier=starter) keeps working even as
 * public names change. Consultant licensing is custom-priced and
 * has no public tier. The old per-platform price matrix, the
 * Arborist consultant tier and the Toolbox add-on are gone: the
 * platform no longer sells geography, and Lumecon does not sell
 * finished analyses against its own consultant customers.
 */

export interface Plan {
  id: 'starter' | 'standard' | 'leader';
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
    id: 'starter',
    name: 'Sprout',
    priceAnnual: 500,
    price: '$1,000',
    period: '/ year',
    audience: 'I do economic analysis.',
    tagline: 'Full Lumecon model, Cedar, unlimited analysis and every supported U.S. geography.',
    users: '1 user',
    ctaLabel: 'Start with Sprout',
    ctaHref: '/signup?tier=starter',
  },
  {
    id: 'standard',
    name: 'Sapling',
    priceAnnual: 2500,
    price: '$2,500',
    period: '/ year',
    audience: 'We do economic analysis.',
    tagline:
      'Everything in Sprout, plus shared projects, collaborative analysis and team review workflows.',
    users: 'Up to 10 users',
    featured: true,
    ctaLabel: 'Start with Sapling',
    ctaHref: '/signup?tier=standard',
  },
  {
    id: 'leader',
    name: 'Tree',
    priceAnnual: 7500,
    price: '$7,500',
    period: '/ year',
    audience: 'Our organization runs economic analysis through Lumecon.',
    tagline:
      'Everything in Sapling, plus Cedar Grove, organizational memory, hands-on Cedar calibration and unlimited users.',
    users: 'Unlimited users in one organization',
    ctaLabel: 'Start with Tree',
    ctaHref: '/signup?tier=leader',
  },
];

/** The readable 9-row detail table. `values` align with PLANS order. */
export interface PlanRow {
  label: string;
  values: [string, string, string];
}

export const PLAN_TABLE_ROWS: PlanRow[] = [
  { label: 'Annual price', values: ['$1,000', '$2,500', '$7,500'] },
  { label: 'Users', values: ['1', 'Up to 10', 'Unlimited within one organization'] },
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
      'Included, with team usage',
      'Included, with organizational context and calibration',
    ],
  },
  {
    label: 'Team Workspace',
    values: [
      'Not included',
      'Included. Shared projects, collaborative analysis, project management and review workflows.',
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

/** Consultant licensing: custom commercial pricing, no public number. */
export const CONSULTANT = {
  headline: 'Lumecon for consultants',
  audience: 'We do economic analysis for clients.',
  positioning: 'Spend less time building models. Spend more time advising clients.',
  body: 'Consultant licenses are for firms and professionals using Lumecon commercially to conduct analysis for outside clients. Use Lumecon across engagements while keeping your client relationships, analytical judgment and deliverables your own. We’ll also work with your firm to calibrate Cedar around how your team performs analysis and produces client reporting.',
  note: 'Consultant licensing is separate from standard organizational pricing because it covers commercial client use, multi-client workflows, support and firm-level Cedar calibration. Standard customers keep the public plans above.',
  points: [
    'The full Lumecon modeling platform and every applicable geography',
    'Commercial and client use',
    'Client and project workspaces',
    'Cedar calibrated to your firm’s analytical and reporting workflow',
  ],
  ctaLabel: 'Talk to us about consultant access',
  ctaSubject: 'Consultant access',
};
