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
    founder: true,
    summary: "PhD candidate in Public Policy at Cornell. Research on local economic development, public finance, tribal governments, and institutions.",
    bio: [
      "Elijah Moreno is the co-founder and CEO of Lumecon. He is a PhD candidate in Public Policy at Cornell University, where his research focuses on local economic development, public finance, tribal governments, and institutions. He earned his undergraduate degree from Dartmouth College and a Master of Public Policy from Cornell University.",
      "Before founding Lumecon, Elijah was a Senior Research Assistant at the Center for Indian Country Development within the Federal Reserve Bank of Minneapolis, where he worked on research related to Indian Country, economic development, and public policy. He was also a Wilma Mankiller Fellow at the National Congress of American Indians and a research analyst at the Taylor Policy Group, Inc. His work brings together applied economics, institutional research, and data systems to help communities better understand and communicate their economic impact.",
    ],
    alumniOf: ['Cornell University', 'Dartmouth College'],
    prevAffiliations: [
      'Federal Reserve Bank of Minneapolis (Center for Indian Country Development)',
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
    founder: true,
    summary: "Co-founder and founding investor. Early support that moved Lumecon from concept to product.",
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
    summary: "Leads development of the Lumecon platform experience. Cornell, Computer Science and Business.",
    bio: [
      "Kaylyn Lee leads development of the Lumecon platform experience, helping turn the company's economic impact tools into an organized, usable, customer-facing product. She is a graduate of Cornell University, where she studied Computer Science with a minor in Business.",
    ],
    alumniOf: ['Cornell University'],
  },
  {
    slug: 'laurel-wheeler',
    name: 'Laurel Wheeler',
    initials: 'LW',
    tint: 'teal',
    group: 'team',
    title: 'Economics Lead',
    summary: "Leads economic theory and tribal adaptation work. PhD Economics, Duke.",
    bio: [
      "Laurel Wheeler leads Lumecon's economic theory and tribal adaptation work, helping ensure the platform reflects credible economic reasoning and the institutional realities of the communities it serves. She holds a B.A. in Political Science from the University of Florida, an M.S. in Economics for Development from the University of Oxford, and an M.A. and Ph.D. in Economics from Duke University.",
      "Laurel previously worked as an economist at the Center for Indian Country Development within the Federal Reserve Bank of Minneapolis.",
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
    summary: "Leads the multiplier system and input/output engine. Wisconsin–Madison, Maryland.",
    bio: [
      "Isabella Agnes leads work on Lumecon's multiplier system and input/output engine, including the tools that translate source data into economic impact estimates and integrate the engine into the website. She holds degrees in Mathematics and Computer Science from the University of Wisconsin–Madison and completed doctoral training in Economics at the University of Maryland, College Park.",
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
    summary: "Leads Cedar, Lumecon's AI-assisted workflow for source records.",
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
    summary: "Software architecture, engineering systems, scalability. Previously senior engineer at Modsy and Chime.",
    bio: [
      "Brian Kim advises Lumecon on software architecture, engineering systems, scalability, and pilot-stage technical development. He previously worked as a senior software engineer at Modsy and Chime.",
    ],
    prevAffiliations: ['Modsy', 'Chime'],
  },
  {
    slug: 'havala-hanson',
    name: 'Havala Hanson',
    initials: 'HH',
    tint: 'gold',
    group: 'advisor',
    title: 'Data Security Advisor',
    summary: "Data security, privacy, research operations, responsible data infrastructure.",
    bio: [
      "Havala Hanson advises Lumecon on data security, privacy, research operations, and responsible data infrastructure. She has extensive experience developing data governance and security procedures, supporting cross-agency data sharing, managing research operations, and working with sensitive administrative datasets. She holds a Ph.D. in Statistics and Policy in Education from the University of Alaska Fairbanks, an M.A. in Urban Education Policy from Brown University, and a B.S. in Education from the University of Wisconsin–Whitewater.",
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
    summary: "Empirical methodology, econometrics, model design. PhD candidate at MIT.",
    bio: [
      "Vod Vilfort advises Lumecon on empirical methodology, econometrics, model design, and research standards. He is a PhD candidate in Economics at MIT with a focus on econometrics.",
    ],
    alumniOf: ['Massachusetts Institute of Technology'],
  },
];

/** Co-founders, used by the homepage Organization.founder JSON-LD. */
export const FOUNDERS = TEAM.filter((p) => p.founder);

export const TEAM_BY_GROUP: Record<PersonGroup, Person[]> = {
  team: TEAM.filter((p) => p.group === 'team'),
  advisor: TEAM.filter((p) => p.group === 'advisor'),
};
