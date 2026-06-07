/**
 * Team data — single source of truth for the team.
 *
 * The /about page names everyone in the "How we work" grid (linking
 * to each person's page); the full bio, links, and selected work
 * render on /team/<slug>. `group` partitions Team vs. Advisors &
 * Contributors. Order within each section is the order listed below.
 */

export type PersonGroup = 'team' | 'advisor';

/**
 * A selected publication shown under "Selected work" on a person's
 * /team/<slug> page. Display rule for `year`: use one exact year —
 * the journal year for a published article, the report/working-paper
 * year only when the item is a report or still a working paper. Never
 * combine two dates. `authors` lists every author in true published
 * order (comma-separated); the person's own name is bolded at render
 * time, so it must appear verbatim (minus any ", PhD" suffix).
 */
export interface Publication {
  title: string;
  authors: string;
  year: string;
  venue: string;
  summary: string;
  /** Optional link to the full text; the title links out when present. */
  url?: string;
  /** Drives JSON-LD @type; defaults to a scholarly article. */
  type?: 'book' | 'article';
}

export interface Person {
  /** Short stable id (kebab-case). Used for anchor links and React-style keys. */
  slug: string;
  /** Display name. */
  name: string;
  /** Initials shown in the avatar circle. */
  initials: string;
  /** Page section. */
  group: PersonGroup;
  /** Role / title displayed under the name. */
  title: string;
  /** Short summary used for the page meta description and Person
   *  JSON-LD (not rendered as visible copy). */
  summary: string;
  /** Full bio paragraphs shown on the person's /team/<slug> page. */
  bio: string[];
  /** Lumecon work email (firstname.lastname@lumecon.ai). Shown on the
   *  person's /team/<slug> page; advisors don't get one. */
  email?: string;
  /** Public LinkedIn profile URL. Rendered as an icon link on the
   *  person's /team/<slug> page and emitted as Person.sameAs. */
  linkedin?: string;
  /** Google Scholar profile URL. Rendered as an icon link and
   *  emitted as Person.sameAs alongside LinkedIn. */
  scholar?: string;
  /** Whether this person is a co-founder of Lumecon (used for
   *  Organization.founder JSON-LD). */
  founder?: boolean;
  /** Degree-granting institutions, used for Person.alumniOf JSON-LD. */
  alumniOf?: string[];
  /** Previous employers / fellowships / affiliations, used for
   *  Person.affiliation JSON-LD. Improves entity recognition in
   *  search ("Elijah Moreno + Federal Reserve" connects). */
  prevAffiliations?: string[];
  /** Selected publications shown on the person's /team/<slug> page. */
  publications?: Publication[];
}

export const TEAM: Person[] = [
  {
    slug: 'elijah-moreno',
    name: 'Elijah Moreno, MPP',
    initials: 'EM',
    group: 'team',
    title: 'Co-Founder & CEO',
    email: 'elijah.moreno@lumecon.ai',
    scholar: 'https://scholar.google.com/citations?hl=en&user=mYpXeHYAAAAJ',
    founder: true,
    summary: "Co-founder and CEO. PhD candidate in Public Policy at Cornell, with a bachelor's from Dartmouth and a master's from Cornell. Before Lumecon, he worked at the Federal Reserve Bank of Minneapolis (Center for Indian Country Development), the National Congress of American Indians, and the Taylor Policy Group.",
    bio: [
      "Elijah Moreno is the co-founder and CEO of Lumecon. He holds a bachelor's degree in Economics (modified with Native American Studies, with a minor in Public Policy) from Dartmouth College and a master's in Public Policy from Cornell University, and is a PhD candidate in Public Policy at Cornell University, where his research focuses on local economic development, public finance, tribal governments, and institutions.",
      "Before Lumecon, Elijah was a Senior Research Assistant at the Center for Indian Country Development within the Federal Reserve Bank of Minneapolis, a two-time participant in the American Economic Association Summer Training Program at Michigan State University, a Wilma Mankiller Fellow at the National Congress of American Indians, and a research analyst at the Taylor Policy Group. He has built novel datasets, including the Native Entity Enterprise dataset, and conducted extensive research on Native-entity federal contracting.",
    ],
    alumniOf: ['Cornell University', 'Dartmouth College', 'Michigan State University'],
    prevAffiliations: [
      'Federal Reserve Bank of Minneapolis (Center for Indian Country Development)',
      'American Economic Association Summer Training Program at Michigan State University',
      'National Congress of American Indians',
      'Taylor Policy Group, Inc.',
    ],
    publications: [
      {
        title: 'Social and Economic Changes in American Indian Reservations: A Databook of the US Census and the American Community Survey, Third Edition, 1990–2020',
        authors: 'Randall Akee, Elijah Moreno, Amy Besaw Medford',
        year: '2025',
        venue: 'Ash Center for Democratic Governance and Innovation, Harvard Kennedy School',
        type: 'book',
        summary: 'Three decades of Census and American Community Survey data tracking how life on American Indian reservations changed across fourteen socioeconomic indicators from 1990 to 2020, documenting real gains in employment, education, and housing while mapping the gaps that still persist.',
        url: 'https://ash.harvard.edu/wp-content/uploads/2025/09/Databook-Third-Edition-2025-09-07-1.pdf',
      },
      {
        title: 'Alaska Native Students as English Learner Students: Examining Patterns in Identification, Classification, Service Provision, and Reclassification',
        authors: 'Ilana Umansky, Lorna Porter, Elijah Moreno, Ashley Pierson',
        year: '2021',
        venue: 'Regional Educational Laboratory Northwest / IES (REL 2021-088)',
        summary: 'Examines the population of Alaska Native students classified as English learner (EL) students and how EL policies function for them across identification, classification, service provision, and reclassification. Drawing on Alaska state data from 2011/12 to 2018/19, it finds that about a quarter of Alaska Native kindergartners were classified as EL students, speaking 24 different home languages, and that these students had lower measured English proficiency and higher rates of economic disadvantage than their non–Alaska Native EL peers.',
        url: 'https://files.eric.ed.gov/fulltext/ED612515.pdf',
      },
    ],
  },
  {
    slug: 'michael-moreno',
    name: 'Michael Moreno',
    initials: 'MM',
    group: 'team',
    title: 'Co-Founder & Founding Investor',
    email: 'michael.moreno@lumecon.ai',
    founder: true,
    summary: "Co-founder and founding investor. His early support moved Lumecon from concept to product, alongside Elijah as enrolled members of the Coastal Band of the Chumash Nation.",
    bio: [
      "Michael Moreno is a co-founder and the founding investor of Lumecon. His early support helped launch the company and move it from concept to early product development.",
    ],
  },
  {
    slug: 'kaylyn-lee',
    name: 'Kaylyn Lee',
    initials: 'KL',
    group: 'team',
    title: 'Platform Lead',
    email: 'kaylyn.lee@lumecon.ai',
    linkedin: 'https://www.linkedin.com/in/kaylynlee',
    summary: "Leads development of the Lumecon platform experience. Holds a bachelor's in Computer Science, with a minor in Business, from Cornell University.",
    bio: [
      "Kaylyn Lee leads development of the Lumecon platform experience, helping turn the company's economic impact tools into an organized, usable, customer-facing product. She holds a bachelor's degree in Computer Science, with a minor in Business, from Cornell University.",
    ],
    alumniOf: ['Cornell University'],
  },
  {
    slug: 'laurel-wheeler',
    name: 'Laurel Wheeler, PhD',
    initials: 'LW',
    group: 'team',
    title: 'Economics Lead',
    email: 'laurel.wheeler@lumecon.ai',
    linkedin: 'https://ca.linkedin.com/in/laurel-wheeler',
    scholar: 'https://scholar.google.com/citations?user=oV06J_wAAAAJ&hl=en&oi=ao',
    summary: "Leads economic theory and tribal adaptation. PhD in Economics from Duke. Before Lumecon, she was an economist at the Federal Reserve Bank of Minneapolis (Center for Indian Country Development).",
    bio: [
      "Laurel Wheeler leads Lumecon's economic theory and tribal adaptation work, helping ensure the platform reflects credible economic reasoning and the institutional realities of the communities it serves. She holds a bachelor's degree in Political Science from the University of Florida, a master's in Economics for Development from the University of Oxford, and a master's and PhD in Economics from Duke University.",
      "Before Lumecon, Laurel was an economist at the Center for Indian Country Development within the Federal Reserve Bank of Minneapolis.",
    ],
    alumniOf: ['University of Florida', 'University of Oxford', 'Duke University'],
    prevAffiliations: [
      'Federal Reserve Bank of Minneapolis (Center for Indian Country Development)',
    ],
    publications: [
      {
        title: 'Mapping the Native CDFI Industry: Insights from a New Survey',
        authors: 'Valentina Dimitrova-Grajzl, Peter Grajzl, Michou Kokodoko, Laurel Wheeler',
        year: '2026',
        venue: 'Community Development',
        summary: 'One of the most detailed empirical portraits of the Native CDFI industry, using survey data from 49 certified and emerging Native CDFIs. It documents variation in age, size, geography, strategic goals, risk-assessment practices, product offerings, development services, and institutional challenges, and uses cluster analysis to identify four distinct Native CDFI profiles.',
        url: 'https://doi.org/10.1080/15575330.2026.2631398',
      },
      {
        title: 'Fostering Financial Inclusion by Ensuring Cultural Fit: The Case of the NCDFI Industry',
        authors: 'Valentina Dimitrova-Grajzl, Peter Grajzl, Michou Kokodoko, Laurel Wheeler',
        year: '2025',
        venue: 'American Indian Culture and Research Journal',
        summary: 'Uses interviews with Native CDFI leaders to examine how they design lending practices, development services, partnerships, and success metrics around the communities they serve. It emphasizes person-centered lending, strategic partnerships, customized financial products, inclusive measures of success, and the role of cultural fit in expanding financial inclusion.',
        url: 'https://www.minneapolisfed.org/research/cicd-working-paper-series/fostering-financial-inclusion-by-ensuring-cultural-fit-the-case-of-the-ncdfi-industry',
      },
      {
        title: 'Harnessing Soft Information to Promote Financial Inclusion: The Case of Business Lending by a Native CDFI',
        authors: 'Valentina Dimitrova-Grajzl, Peter Grajzl, Lakota Vogel, Laurel Wheeler',
        year: '2025',
        venue: 'Journal of Financial Services Research',
        summary: 'Analyzes business loan data from a Native CDFI to compare conventional credit scores with lender-generated soft-information measures of borrower risk. It finds that a character-based risk measure predicts loan delinquency and interest rates beyond what credit scores alone explain, showing how relationship-based underwriting can capture information missed by standard credit metrics.',
        url: 'https://doi.org/10.1007/s10693-024-00439-5',
      },
      {
        title: 'Applying Indigenous Approaches to Economics Instruction',
        authors: 'Larry Chavis, Laurel Wheeler',
        year: '2025',
        venue: 'Journal of Economics, Race, and Policy',
        summary: 'Develops a relational approach to economics instruction informed by Indigenous pedagogies from North America. It connects inclusive teaching practices with belonging, community, reciprocity, and contextual learning, arguing that economics becomes more accessible and rigorous when students understand economic questions through relationships, lived experience, and place.',
        url: 'https://doi.org/10.1007/s41996-024-00158-y',
      },
      {
        title: 'Beyond Conventional Models: Lending by Native Community Development Financial Institutions',
        authors: 'Valentina Dimitrova-Grajzl, Peter Grajzl, A. Joseph Guse, Michou Kokodoko, Laurel Wheeler',
        year: '2024',
        venue: 'Annals of Public and Cooperative Economics',
        summary: 'Uses loan-level data from eleven Native CDFI loan funds to study how Native CDFIs lend, whom they serve, and what predicts delinquency. It shows that Native CDFIs provide small and varied loans across diverse borrower circumstances, relying on both conventional risk measures and community-informed, character-based measures of creditworthiness.',
        url: 'https://doi.org/10.1111/apce.12453',
      },
      {
        title: 'When the Lender Extends a Helping Hand: Native CDFI Client Counseling and Loan Performance in Indian Country',
        authors: 'Valentina Dimitrova-Grajzl, Peter Grajzl, A. Joseph Guse, Michou Kokodoko, Laurel Wheeler',
        year: '2023',
        venue: 'Journal of Economics, Race, and Policy',
        summary: 'Uses loan-level data and survival analysis to study whether Native CDFI-provided financial counseling affects loan performance. It finds that counseling reduces the risk of loan failure, especially for borrowers with limited prior credit-market experience, with personalized coaching appearing more effective than less tailored classroom-style training.',
        url: 'https://doi.org/10.1007/s41996-023-00119-x',
      },
      {
        title: 'More than Chance: The Local Labor Market Effects of Tribal Gaming',
        authors: 'Laurel Wheeler',
        year: '2023',
        venue: 'Federal Reserve Bank of Minneapolis, Center for Indian Country Development Working Paper Series (2023-02)',
        summary: 'Uses confidential U.S. Census microdata and a database of tribal government–owned casinos to estimate how tribal gaming affects local labor markets across different markets, time horizons, and subgroups. It finds that tribal gaming drives sustained gains in reservation employment and wages — with American Indians benefiting the most — and that while it raises average housing rents, the increase is smaller than the wage gains, implying net local benefits.',
        url: 'https://www.minneapolisfed.org/research/cicd-working-paper-series/more-than-chance-the-local-labor-market-effects-of-tribal-gaming',
      },
    ],
  },
  {
    slug: 'isabella-agnes',
    name: 'Isabella Agnes',
    initials: 'IA',
    group: 'team',
    title: 'Input/Output Engine Lead',
    email: 'isabella.agnes@lumecon.ai',
    linkedin: 'https://www.linkedin.com/in/maria-isabella-agnes-741569b7',
    summary: "Leads the multiplier system and input/output engine. Holds bachelor's degrees in Mathematics and Economics from Wisconsin–Madison and completed doctoral training in Economics at Maryland. Before Lumecon, she was at the Federal Reserve Bank of Philadelphia and the Federal Reserve Board of Governors.",
    bio: [
      "Isabella Agnes leads work on Lumecon's multiplier system and input/output engine, including the tools that translate source data into economic impact estimates and integrate the engine into the website. She holds bachelor's degrees in Mathematics and Economics from the University of Wisconsin–Madison and completed doctoral training in Economics at the University of Maryland, College Park.",
      "Before Lumecon, Isabella was a research assistant at the Federal Reserve Bank of Philadelphia and a data scientist at the Board of Governors of the Federal Reserve System.",
    ],
    alumniOf: ['University of Wisconsin–Madison', 'University of Maryland, College Park'],
    prevAffiliations: [
      'Federal Reserve Bank of Philadelphia',
      'Board of Governors of the Federal Reserve System',
    ],
    publications: [
      {
        title: 'Place-Based Labor Market Inequality',
        authors: 'Douglas A. Webber, Isabella Agnes, Jessica Liu, Erin Troland',
        year: '2025',
        venue: 'Federal Reserve Board, Finance and Economics Discussion Series (2025-040)',
        summary: 'Examines how labor market conditions vary across U.S. counties, showing that national averages often hide large differences in employment, wages, labor force participation, and job availability. Using county-level indicators and Lightcast job postings, it connects local labor market tightness to income growth and pandemic recovery while documenting the role of racial composition and geography in shaping labor market inequality.',
        url: 'https://www.federalreserve.gov/econres/feds/place-based-labor-market-inequality.htm',
      },
    ],
  },
  {
    slug: 'francesca-agnes',
    name: 'Francesca Agnes',
    initials: 'FA',
    group: 'team',
    title: 'Cedar Lead',
    email: 'francesca.agnes@lumecon.ai',
    linkedin: 'https://www.linkedin.com/in/francesca-agnes-a8106722b',
    scholar: 'https://scholar.google.com/citations?hl=en&user=o4brEBEAAAAJ',
    summary: "Leads Cedar, Lumecon's AI-assisted workflow for organizing source records and surfacing assumptions. Holds a bachelor's in Biology from the University of Illinois Urbana-Champaign.",
    bio: [
      "Francesca Agnes leads development of Cedar, Lumecon's AI-assisted workflow for organizing source records, surfacing assumptions, and helping users move from messy data to usable analysis. She holds a bachelor's degree in Biology from the University of Illinois Urbana-Champaign.",
    ],
    alumniOf: ['University of Illinois Urbana-Champaign'],
  },
  {
    slug: 'brian-kim',
    name: 'Brian Kim',
    initials: 'BK',
    group: 'advisor',
    title: 'Technical Advisor',
    summary: "Advises on software architecture, engineering systems, and scalability, and contributes on Cedar and data security. Holds a bachelor's in Economics from Dartmouth. Before Lumecon, he was a senior software engineer at Modsy and Chime.",
    bio: [
      "Brian Kim advises Lumecon on software architecture, engineering systems, scalability, and technical development, and also contributes on Cedar's AI workflow and on data security and research operations. He holds a bachelor's degree in Economics from Dartmouth College. Before Lumecon, he was a senior software engineer at Modsy and Chime.",
    ],
    alumniOf: ['Dartmouth College'],
    prevAffiliations: ['Modsy', 'Chime'],
  },
  {
    slug: 'havala-hanson',
    name: 'Havala Hanson, PhD',
    initials: 'HH',
    group: 'advisor',
    title: 'Product, Data Security & Research Operations Advisor',
    linkedin: 'https://www.linkedin.com/in/havala-hanson',
    scholar: 'https://scholar.google.com/citations?user=vETE-QYAAAAJ&hl=en&oi=ao',
    summary: "Advises on product direction, data governance, privacy, and research operations. PhD in Statistics and Policy in Education from the University of Alaska Fairbanks.",
    bio: [
      "Havala Hanson advises Lumecon on data governance, privacy, research operations, product direction, and responsible infrastructure. She holds a bachelor's degree in Education from the University of Wisconsin–Whitewater, a master's in Urban Education Policy from Brown University, and a PhD in Statistics and Policy in Education from the University of Alaska Fairbanks. She has extensive experience developing data governance and security procedures, supporting cross-agency data sharing, managing research operations, and working with sensitive administrative datasets.",
    ],
    alumniOf: ['University of Alaska Fairbanks', 'Brown University', 'University of Wisconsin–Whitewater'],
    publications: [
      {
        title: 'Pathways to Teaching: Teacher Diversity, Testing, Certification, and Employment in Washington State',
        authors: 'Jason Greenberg Motamedi, Sun Young Yoon, Havala Hanson',
        year: '2021',
        venue: 'Regional Educational Laboratory Northwest / IES (REL 2021-094)',
        summary: 'Traces Washington’s teacher preparation and employment pipeline, focusing on where candidates move through or leave the path from testing to certification, employment, and retention. It shows how these pathways differ across racial and ethnic groups, identifying points where candidates of color face lower progression rates or longer timelines.',
        url: 'https://ies.ed.gov/use-work/resource-library/report/descriptive-study/pathways-teaching-teacher-diversity-testing-certification-and-employment-washington-state',
      },
      {
        title: 'Implementation of Career- and College-Ready Requirements for High School Graduation in Washington',
        authors: 'Havala Hanson, Traci Fantz',
        year: '2020',
        venue: 'Regional Educational Laboratory Northwest / IES (REL 2020-020)',
        summary: 'Examines Washington’s rollout of more demanding career- and college-ready graduation requirements: how districts implemented them, how students accessed the required coursework, and how the policy changes translated into actual student pathways.',
        url: 'https://ies.ed.gov/use-work/resource-library/report/descriptive-study/implementation-career-and-college-ready-requirements-high-school-graduation-washington',
      },
      {
        title: 'Preparing Alaskans for Mining Careers Through Short, Industry-Informed Training Programs',
        authors: 'Havala Hanson, David Stevens, Manuel Vazquez, Brandon Roberts',
        year: '2018',
        venue: 'University of Alaska / Education Northwest evaluation report',
        summary: 'Evaluates Alaska mining workforce training programs developed with industry input and built around short-term, hands-on occupational training. It examines program design, employer partnerships, student supports, completion, employment, and wage outcomes, finding high completion rates in the shorter programs and strong post-program employment among graduates.',
        url: 'https://www.uaf.edu/mapts/about/AK_TAACCCT_Report_093018.pdf',
      },
      {
        title: 'Alaska Students’ Pathways from High School to Postsecondary Education and Employment',
        authors: 'Havala Hanson, Ashley Pierson',
        year: '2016',
        venue: 'Regional Educational Laboratory Northwest / IES',
        summary: 'Follows Alaska public high school students into college, in-state employment, and early-career earnings. It documents more than 3,000 distinct postsecondary pathways and shows how students’ routes after high school differ by rurality, gender, Alaska Native status, graduation status, education level, employment, and wages.',
        url: 'https://ies.ed.gov/use-work/resource-library/report/descriptive-study/alaska-students-pathways-high-school-postsecondary-education-and-employment',
      },
    ],
  },
  {
    slug: 'vod-vilfort',
    name: 'Vod Vilfort',
    initials: 'VV',
    group: 'advisor',
    title: 'Methodology Advisor',
    scholar: 'https://scholar.google.com/citations?hl=en&user=Mp6y_pgAAAAJ',
    summary: "Advises on empirical methodology, econometrics, model design, and research standards. Bachelor's in Mathematics and Economics from Yale and a PhD candidate in Economics at MIT, focused on econometrics.",
    bio: [
      "Vod Vilfort advises Lumecon on empirical methodology, econometrics, model design, and research standards. He holds a bachelor's degree in Mathematics and Economics from Yale University and is a PhD candidate in Economics at the Massachusetts Institute of Technology, with a focus on econometrics.",
    ],
    alumniOf: ['Yale University', 'Massachusetts Institute of Technology'],
    publications: [
      {
        title: 'Interpreting TSLS Estimators in Information Provision Experiments',
        authors: 'Vod Vilfort, Whitney Zhang',
        year: '2025',
        venue: 'American Economic Review: Insights, 7(3): 376–95',
        summary: 'Formalizes the exclusion and monotonicity conditions under which two-stage least squares recovers a positive-weighted average of causal effects in information-provision experiments, with practical guidance on which estimators researchers can trust.',
        url: 'https://doi.org/10.1257/aeri.20240353',
      },
    ],
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
    advisorySlugs: ['vod-vilfort'],
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
  {
    slug: 'business-development',
    name: 'Business Development & Sales',
    description: "This area focuses on bringing Lumecon to the governments, tribal nations, foundations, and institutions it serves: partnerships, outreach, and the relationships that turn interest into adoption. The goal is to grow the customer base deliberately, matching the platform to the organizations that need it most.",
    leadSlug: 'elijah-moreno',
    advisorySlugs: ['havala-hanson'],
    contributorSlugs: ['laurel-wheeler'],
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

/** Canonical URL path for a person's profile page. */
export const personPath = (slug: string): string => `/team/${slug}`;
