/**
 * Team data — single source of truth for the /about page.
 *
 * Each Person renders as a card on the About page: an initials
 * avatar, the name, the title, and a short summary above the
 * fold; the longer bio paragraphs reveal when the card is opened.
 *
 * `group` partitions the page into "Team" and "Advisors &
 * Contributors" sections. Order within each section is the order
 * listed below.
 */

export type PersonGroup = 'team' | 'advisor';
export type AvatarTint = 'teal' | 'gold' | 'green';

export interface Person {
  /** Short stable id (kebab-case). Used for anchor links and React-style keys. */
  slug: string;
  /** Display name. */
  name: string;
  /** Initials shown in the avatar circle. */
  initials: string;
  /** Avatar background tint. Rotates across cards for visual variety. */
  tint: AvatarTint;
  /** Page section. */
  group: PersonGroup;
  /** Role / title displayed under the name. */
  title: string;
  /** One-sentence summary shown when the card is closed. */
  summary: string;
  /** Full bio paragraphs revealed when the card is opened. */
  bio: string[];
  /** Lumecon work email (firstname.lastname@lumecon.ai). Set on
   *  team members for credibility on the closed card; advisors
   *  don't get one displayed. */
  email?: string;
  /** Public LinkedIn profile URL. Rendered as an icon link on the
   *  person card and emitted as Person.sameAs for entity linking. */
  linkedin?: string;
  /** Whether this person is a co-founder of Lumecon (used for
   *  Organization.founder JSON-LD). */
  founder?: boolean;
  /** Degree-granting institutions, used for Person.alumniOf JSON-LD. */
  alumniOf?: string[];
  /** Previous employers / fellowships / affiliations, used for
   *  Person.affiliation JSON-LD. Improves entity recognition in
   *  search ("Elijah Moreno + Federal Reserve" connects). */
  prevAffiliations?: string[];
}

export const TEAM: Person[] = [
  {
    slug: 'elijah-moreno',
    name: 'Elijah Moreno',
    initials: 'EM',
    tint: 'teal',
    group: 'team',
    title: 'Co-Founder & CEO',
    email: 'elijah.moreno@lumecon.ai',
    founder: true,
    summary: "Co-founder and CEO. PhD candidate in Public Policy at Cornell; A.B. Dartmouth; M.P.P. Cornell. Previously at the Federal Reserve Bank of Minneapolis (Center for Indian Country Development), the National Congress of American Indians, and the Taylor Policy Group.",
    bio: [
      "Elijah Moreno is the co-founder and CEO of Lumecon. He is a PhD candidate in Public Policy at Cornell University, where his research focuses on local economic development, public finance, tribal governments, and institutions. He earned his Bachelor's at Dartmouth College in Economics modified with Native American Studies and a Public Policy minor, and a Master of Public Policy from Cornell University.",
      "Before founding Lumecon, Elijah was a Senior Research Assistant at the Center for Indian Country Development within the Federal Reserve Bank of Minneapolis, where he worked on research related to Indian Country, economic development, and public policy. He was also a two-time participant in the American Economic Association Summer Training Program at Michigan State University, a Wilma Mankiller Fellow at the National Congress of American Indians, and a research analyst at the Taylor Policy Group, Inc. He has built novel datasets including the Native Entity Enterprise dataset and conducted extensive research on Native-entity federal contracting.",
    ],
    alumniOf: ['Cornell University', 'Dartmouth College', 'Michigan State University'],
    prevAffiliations: [
      'Federal Reserve Bank of Minneapolis (Center for Indian Country Development)',
      'American Economic Association Summer Training Program at Michigan State University',
      'National Congress of American Indians',
      'Taylor Policy Group, Inc.',
    ],
  },
  {
    slug: 'michael-moreno',
    name: 'Michael Moreno',
    initials: 'MM',
    tint: 'gold',
    group: 'team',
    title: 'Co-Founder & Founding Investor',
    email: 'michael.moreno@lumecon.ai',
    founder: true,
    summary: "Co-founder and founding investor. Early support that moved Lumecon from concept to product, alongside Elijah as enrolled members of the Coastal Band of the Chumash Nation.",
    bio: [
      "Michael Moreno is a co-founder and founding investor of Lumecon. His early support helped launch the company and move it from concept to early product development.",
    ],
  },
  {
    slug: 'kaylyn-lee',
    name: 'Kaylyn Lee',
    initials: 'KL',
    tint: 'green',
    group: 'team',
    title: 'Platform Lead',
    email: 'kaylyn.lee@lumecon.ai',
    linkedin: 'https://www.linkedin.com/in/kaylynlee',
    summary: "Leads development of the Lumecon platform experience. Cornell University, Computer Science with a minor in Business.",
    bio: [
      "Kaylyn Lee leads development of the Lumecon platform experience, helping turn the company's economic impact tools into an organized, usable, customer-facing product. She is a graduate of Cornell University, where she studied Computer Science with a minor in Business.",
    ],
    alumniOf: ['Cornell University'],
  },
  {
    slug: 'laurel-wheeler',
    name: 'Laurel Wheeler, PhD',
    initials: 'LW',
    tint: 'teal',
    group: 'team',
    title: 'Economics Lead',
    email: 'laurel.wheeler@lumecon.ai',
    linkedin: 'https://ca.linkedin.com/in/laurel-wheeler',
    summary: "Leads economic theory and tribal adaptation. PhD in Economics from Duke; previously an economist at the Federal Reserve Bank of Minneapolis (Center for Indian Country Development).",
    bio: [
      "Laurel Wheeler leads Lumecon's economic theory and tribal adaptation work, helping ensure the platform reflects credible economic reasoning and the institutional realities of the communities it serves. She holds a B.A. in Political Science from the University of Florida, an M.S. in Economics for Development from the University of Oxford, and an M.A. and Ph.D. in Economics from Duke University.",
      "Before joining Lumecon, Laurel worked as an economist at the Center for Indian Country Development within the Federal Reserve Bank of Minneapolis.",
    ],
    alumniOf: ['University of Florida', 'University of Oxford', 'Duke University'],
    prevAffiliations: [
      'Federal Reserve Bank of Minneapolis (Center for Indian Country Development)',
    ],
  },
  {
    slug: 'isabella-agnes',
    name: 'Isabella Agnes',
    initials: 'IA',
    tint: 'gold',
    group: 'team',
    title: 'Input/Output Engine Lead',
    email: 'isabella.agnes@lumecon.ai',
    linkedin: 'https://www.linkedin.com/in/maria-isabella-agnes-741569b7',
    summary: "Leads the multiplier system and input/output engine. Bachelor's in Mathematics and Economics from Wisconsin–Madison and doctoral training in Economics at Maryland; previously at the Federal Reserve Bank of Philadelphia and the Federal Reserve Board of Governors.",
    bio: [
      "Isabella Agnes leads work on Lumecon's multiplier system and input/output engine, including the tools that translate source data into economic impact estimates and integrate the engine into the website. She holds Bachelor's degrees in Mathematics and Economics from the University of Wisconsin–Madison and completed doctoral training in Economics at the University of Maryland, College Park.",
      "Isabella previously worked as a research assistant at the Federal Reserve Bank of Philadelphia and as a data scientist at the Board of Governors of the Federal Reserve System.",
    ],
    alumniOf: ['University of Wisconsin–Madison', 'University of Maryland, College Park'],
    prevAffiliations: [
      'Federal Reserve Bank of Philadelphia',
      'Board of Governors of the Federal Reserve System',
    ],
  },
  {
    slug: 'francesca-agnes',
    name: 'Francesca Agnes',
    initials: 'FA',
    tint: 'green',
    group: 'team',
    title: 'Cedar Lead',
    email: 'francesca.agnes@lumecon.ai',
    linkedin: 'https://www.linkedin.com/in/francesca-agnes-a8106722b',
    summary: "Leads Cedar, Lumecon's AI-assisted workflow for organizing source records and surfacing assumptions. Biology, University of Illinois Urbana-Champaign.",
    bio: [
      "Francesca Agnes leads development of Cedar, Lumecon's AI-assisted workflow for organizing source records, surfacing assumptions, and helping users move from messy data to usable analysis. She studied Biology at the University of Illinois Urbana-Champaign.",
    ],
    alumniOf: ['University of Illinois Urbana-Champaign'],
  },
  {
    slug: 'brian-kim',
    name: 'Brian Kim',
    initials: 'BK',
    tint: 'teal',
    group: 'advisor',
    title: 'Technical Advisor',
    summary: "Advises on software architecture, engineering systems, and scalability, and contributes on Cedar and data security. Dartmouth Economics; previously senior software engineer at Modsy and Chime.",
    bio: [
      "Brian Kim advises Lumecon on software architecture, engineering systems, scalability, and pilot-stage technical development, and also contributes on Cedar's AI workflow and on data security and research operations. He is a graduate of Dartmouth College with a degree in Economics. Before advising Lumecon, he worked as a senior software engineer at Modsy and Chime.",
    ],
    alumniOf: ['Dartmouth College'],
    prevAffiliations: ['Modsy', 'Chime'],
  },
  {
    slug: 'havala-hanson',
    name: 'Havala Hanson, PhD',
    initials: 'HH',
    tint: 'gold',
    group: 'advisor',
    title: 'Product, Data Security & Research Operations Advisor',
    linkedin: 'https://www.linkedin.com/in/havala-hanson',
    summary: "Advises on product direction, data governance, privacy, and research operations. PhD in Statistics and Policy in Education from the University of Alaska Fairbanks.",
    bio: [
      "Havala Hanson advises Lumecon on data governance, privacy, research operations, product direction, and responsible infrastructure. She has extensive experience developing data governance and security procedures, supporting cross-agency data sharing, managing research operations, and working with sensitive administrative datasets. She holds a Ph.D. in Statistics and Policy in Education from the University of Alaska Fairbanks, an M.A. in Urban Education Policy from Brown University, and a B.S. in Education from the University of Wisconsin–Whitewater.",
    ],
    alumniOf: ['University of Alaska Fairbanks', 'Brown University', 'University of Wisconsin–Whitewater'],
  },
  {
    slug: 'vod-vilfort',
    name: 'Vod Vilfort',
    initials: 'VV',
    tint: 'green',
    group: 'advisor',
    title: 'Methodology Advisor',
    summary: "Advises on empirical methodology, econometrics, model design, and research standards. PhD candidate in Economics at MIT, focused on econometrics.",
    bio: [
      "Vod Vilfort advises Lumecon on empirical methodology, econometrics, model design, and research standards. He is a PhD candidate in Economics at MIT with a focus on econometrics.",
    ],
    alumniOf: ['Massachusetts Institute of Technology'],
  },
];

/** Co-founders, used by the homepage Organization.founder JSON-LD. */
export const FOUNDERS = TEAM.filter((p) => p.founder);

/**
 * Working areas — the five lanes Lumecon's work splits across.
 * Each lane names a single Lead and the people who contribute or
 * advise so that visitors reading the About page see the overlap
 * as deliberate cross-functional structure rather than fuzzy
 * roles. Slugs match TEAM entries so the page can resolve names
 * and link straight to each person's bio card.
 */
export interface WorkingArea {
  slug: string;
  name: string;
  /** One paragraph describing the area's goal. */
  description: string;
  /** Person who carries primary responsibility. */
  leadSlug: string;
  /** People who contribute material work to the area. */
  contributorSlugs?: string[];
  /** Advisors who shape the area without owning day-to-day work. */
  advisorySlugs?: string[];
}

export const WORKING_AREAS: WorkingArea[] = [
  {
    slug: 'platform-product',
    name: 'Platform & Product',
    description: "This area focuses on the customer-facing platform: how users move through a study, upload data, review assumptions, understand results, and produce outputs. The goal is to make complex economic analysis feel organized, usable, and credible for real institutional users.",
    leadSlug: 'kaylyn-lee',
    advisorySlugs: ['brian-kim', 'havala-hanson'],
    contributorSlugs: ['francesca-agnes', 'isabella-agnes', 'elijah-moreno'],
  },
  {
    slug: 'economic-modeling',
    name: 'Economic Modeling & Tribal Adaptation',
    description: "This area focuses on the economic logic behind Lumecon's models, including theory, model assumptions, tribal adaptation, and empirical credibility. The goal is to make sure Lumecon's analysis reflects both rigorous economic reasoning and the institutional realities of the communities being studied.",
    leadSlug: 'laurel-wheeler',
    advisorySlugs: ['vod-vilfort'],
    contributorSlugs: ['elijah-moreno', 'isabella-agnes', 'francesca-agnes', 'havala-hanson'],
  },
  {
    slug: 'io-engine',
    name: 'Input/Output Engine',
    description: "This area focuses on the multiplier system and analytical engine that translate source data into economic impact estimates. The goal is to connect user inputs, regional data, and economic assumptions into a clear, auditable modeling workflow.",
    leadSlug: 'isabella-agnes',
    contributorSlugs: ['francesca-agnes', 'laurel-wheeler', 'elijah-moreno'],
  },
  {
    slug: 'cedar-ai',
    name: 'Cedar & AI Workflow',
    description: "This area focuses on Cedar, Lumecon's AI-assisted workflow for organizing source records, surfacing assumptions, and helping users move from messy data to usable analysis. The goal is to use AI carefully: making analysis faster and more accessible without removing human judgment, transparency, or accountability.",
    leadSlug: 'francesca-agnes',
    advisorySlugs: ['havala-hanson', 'brian-kim'],
    contributorSlugs: ['kaylyn-lee', 'isabella-agnes', 'elijah-moreno'],
  },
  {
    slug: 'data-governance',
    name: 'Data Governance, Security & Research Operations',
    description: "This area focuses on responsible data handling, privacy, documentation, and research operations. The goal is to make sure Lumecon can support organizations working with sensitive administrative, financial, institutional, and community data.",
    leadSlug: 'havala-hanson',
    contributorSlugs: ['elijah-moreno', 'kaylyn-lee', 'francesca-agnes', 'isabella-agnes', 'brian-kim'],
  },
];

/** Slug -> Person lookup used when rendering working-area people. */
export const TEAM_BY_SLUG: Record<string, Person> = Object.fromEntries(
  TEAM.map((p) => [p.slug, p]),
);

export const TEAM_BY_GROUP: Record<PersonGroup, Person[]> = {
  team: TEAM.filter((p) => p.group === 'team'),
  advisor: TEAM.filter((p) => p.group === 'advisor'),
};
