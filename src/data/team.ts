/**
 * Team data — single source of truth for the team.
 *
 * Feeds /team, the founder entries in the homepage JSON-LD, and the
 * canonical record for bios used off-site (llms.txt, reports). `group`
 * partitions Team vs. Advisors. Order within each section is the order
 * listed below, and it is the pitch deck's team-slide order: the leads
 * economics-first and the platform last, the advisors Brian, Vod,
 * Havala. Reorder here, not on the page.
 *
 * Two shapes of prose live here and they are not interchangeable. `bio`
 * is the full paragraph record and is not rendered on /team; that page
 * runs on `education` and `experience`, which are the short, checkable
 * lines a reader reads one person at a time. Where a person has one
 * point of experience on record they get one: padding an entry to match
 * its neighbour is how a credibility page stops being one.
 *
 * `education` is ordered by attainment, highest first — doctorate, then
 * master's, then bachelor's — so the strongest credential is the first
 * thing read. It is not chronological.
 *
 * public/llms.txt carries the same roster in prose, for crawlers and
 * assistants. It is GENERATED from the rendered /team page by
 * `npm run llms:roster` — do not hand-edit that block. It used to be a
 * second hand-written roster and it drifted: by the time it was caught
 * it named a person the page does not show and published a fact about
 * tribal membership that appears nowhere a visitor can read. Anything
 * that should be public about a person goes on the page first.
 */

export type PersonGroup = 'team' | 'advisor';

/**
 * A selected publication shown under "Selected work" on a person's
 * /team/<slug> page. Display rule for `year`: use one exact year —
 * the journal year for a published article, the report/working-paper
 * year only when the item is a report or still a working paper. Never
 * combine two dates. `authors` lists every author in true published
 * order (comma-separated); the person's own name is bolded at render
 * time, so it must appear verbatim.
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
  /** Display name, with no credential suffix. A degree belongs under
   *  Education, where every person's is listed the same way; appending
   *  ", PhD" to three of eight names made the roster look like it ranked
   *  itself. */
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
  /** Full bio paragraphs. The canonical prose record; /team does not
   *  render these (see the file header). */
  bio: string[];
  /** Duotone headshot under public/team/, written at 480px square by
   *  scripts/team/headshots.mjs from the deck's portrait masters. One
   *  size for everyone, so the page declares it rather than carrying a
   *  per-person number. */
  photo?: string;
  /** Shorter label used under the portrait on /team, for the one title
   *  too long to sit there. Everyone else's role is the same string in
   *  both places, which is the point: a reader should not have to
   *  reconcile two names for the same job. */
  discipline?: string;
  /** Degrees, highest attainment first. Rendered as a list under
   *  Education on /team, and the only place a credential appears. */
  education?: string[];
  /** Experience, as whole sentences. Rendered as paragraphs under
   *  Experience on /team — prose, where education is a list, because
   *  the two are different kinds of claim. */
  experience?: string[];
  /** Tribal enrollment, rendered under its own label on /team. It is
   *  neither a degree nor a post, and filing it under either would
   *  misstate what it is. It is on the page because it is a material
   *  fact about a company that works in Indian Country — and because
   *  llms.txt is generated from the page, stating it here is what makes
   *  it public rather than a claim only crawlers could read. */
  tribalAffiliation?: string;
  /** Lumecon work email (firstname.lastname@lumecon.ai). Shown on the
   *  person's /team/<slug> page; advisors don't get one. */
  email?: string;
  /** Public LinkedIn profile URL, as supplied by the person. Rendered
   *  as a link on /team and emitted as Person.sameAs. Absent means the
   *  person has no profile, not that one has yet to be found: Vod
   *  Vilfort has none (founder, 2026-09). Never fill this from a search
   *  result — a wrong profile on a credibility page is worse than no
   *  profile, and the addresses here are canonical, without the
   *  `utm_source=share_via` parameters a shared link carries. */
  linkedin?: string;
  /** Google Scholar profile URL, in the canonical `?hl=en&user=` form.
   *  Rendered as a link and emitted as Person.sameAs alongside
   *  LinkedIn. Drop any `oi=ao`, which records where a click came
   *  from and is not part of the address. */
  scholar?: string;
  /** Whether this person is emitted under Organization.founder in the
   *  homepage JSON-LD. Independent of `title`: schema.org takes more
   *  than one founder, and what each is called is the title's business.
   *  Elijah is Founder and CEO; Michael is Founding Investor and appears
   *  in that structured data only. He is deliberately absent from every
   *  surface a visitor reads — /team, llms.txt and Cedar's answers —
   *  which is the founder's decision (2026-09), not an oversight. */
  founder?: boolean;
  /** Degree-granting institutions only, used for Person.alumniOf
   *  JSON-LD and for the training shelf on /team. A program hosted at a
   *  university is not a degree from it: the AEA Summer Training Program
   *  at Michigan State is in prevAffiliations, not here. */
  alumniOf?: string[];
  /** Where the person works now besides Lumecon, used for
   *  Person.worksFor JSON-LD alongside Lumecon itself. */
  currentAffiliations?: string[];
  /** Previous employers / fellowships / affiliations, used for
   *  Person.affiliation JSON-LD. Improves entity recognition in
   *  search ("Elijah Moreno + Federal Reserve" connects). */
  prevAffiliations?: string[];
  /** Selected publications shown on the person's /team/<slug> page. */
  publications?: Publication[];
}

const TEAM: Person[] = [
  {
    slug: 'elijah-moreno',
    name: 'Elijah Moreno',
    initials: 'EM',
    group: 'team',
    title: 'Founder and CEO',
    email: 'elijah.moreno@lumecon.ai',
    linkedin: 'https://www.linkedin.com/in/elijahmoreno',
    scholar: 'https://scholar.google.com/citations?hl=en&user=mYpXeHYAAAAJ',
    founder: true,
    photo: '/team/elijah-moreno.webp',
    education: [
      'PhD candidate, Public Policy, Cornell University',
      'MPP, Cornell University',
      'BA, Economics, modified with Native American Studies, Dartmouth College',
    ],
    experience: [
      'Eight years producing tribal economic-impact studies and related public-policy research.',
      'Senior Research Assistant at the Center for Indian Country Development at the Federal Reserve Bank of Minneapolis. There he led the construction of the Native Entity Enterprise Dataset, the first comprehensive dataset of Native entity enterprises, and launched and led research on Native federal contracting.',
      'Research Fellow at the Project on Indigenous Governance and Development at the Harvard Kennedy School, and a co-author of the third edition of Social and Economic Changes in American Indian Reservations.',
      'Previously a research analyst at the Taylor Policy Group and a Wilma Mankiller Fellow at the National Congress of American Indians.',
    ],
    tribalAffiliation:
      'Enrolled member of the Coastal Band of the Chumash Nation, a non-federally recognized tribe in California.',
    summary:
      "Founder and CEO. PhD candidate in Public Policy at Cornell, with a bachelor's from Dartmouth and a master's from Cornell. Before Lumecon, he worked at the Federal Reserve Bank of Minneapolis (Center for Indian Country Development), the Project on Indigenous Governance and Development at the Harvard Kennedy School, the National Congress of American Indians and the Taylor Policy Group. Enrolled member of the Coastal Band of the Chumash Nation.",
    bio: [
      "Elijah Moreno is the founder and CEO of Lumecon. He holds a bachelor's degree in Economics (modified with Native American Studies, with a minor in Public Policy) from Dartmouth College and a master's in Public Policy from Cornell University and is a PhD candidate in Public Policy at Cornell University, where his research focuses on local economic development, public finance, tribal governments and institutions.",
      'Before Lumecon, Elijah was a Senior Research Assistant at the Center for Indian Country Development within the Federal Reserve Bank of Minneapolis, a Research Fellow at the Project on Indigenous Governance and Development at the Harvard Kennedy School, a two-time participant in the American Economic Association Summer Training Program at Michigan State University, a Wilma Mankiller Fellow at the National Congress of American Indians and a research analyst at the Taylor Policy Group. He led the construction of the Native Entity Enterprise Dataset, the first comprehensive dataset of Native entity enterprises, and launched and led research on Native-entity federal contracting.',
    ],
    alumniOf: ['Cornell University', 'Dartmouth College'],
    prevAffiliations: [
      'Federal Reserve Bank of Minneapolis (Center for Indian Country Development)',
      'Project on Indigenous Governance and Development, Harvard Kennedy School',
      'American Economic Association Summer Training Program at Michigan State University',
      'National Congress of American Indians',
      'Taylor Policy Group, Inc.',
    ],
    publications: [
      {
        title:
          'Social and Economic Changes in American Indian Reservations: A Databook of the US Census and the American Community Survey, Third Edition, 1990–2020',
        authors: 'Randall Akee, Elijah Moreno, Amy Besaw Medford',
        year: '2025',
        venue: 'Ash Center for Democratic Governance and Innovation, Harvard Kennedy School',
        type: 'book',
        summary:
          'Three decades of Census and American Community Survey data tracking how life on American Indian reservations changed across fourteen socioeconomic indicators from 1990 to 2020, documenting real gains in employment, education and housing while mapping the gaps that still persist.',
        url: 'https://ash.harvard.edu/wp-content/uploads/2025/09/Databook-Third-Edition-2025-09-07-1.pdf',
      },
      {
        title:
          'Alaska Native Students as English Learner Students: Examining Patterns in Identification, Classification, Service Provision, and Reclassification',
        authors: 'Ilana Umansky, Lorna Porter, Elijah Moreno, Ashley Pierson',
        year: '2021',
        venue: 'Regional Educational Laboratory Northwest / IES (REL 2021-088)',
        summary:
          'Examines the population of Alaska Native students classified as English learner (EL) students and how EL policies function for them across identification, classification, service provision and reclassification. Drawing on Alaska state data from 2011/12 to 2018/19, it finds that about a quarter of Alaska Native kindergartners were classified as EL students, speaking 24 different home languages, and that these students had lower measured English proficiency and higher rates of economic disadvantage than their EL peers who are not Alaska Native.',
        url: 'https://files.eric.ed.gov/fulltext/ED612515.pdf',
      },
    ],
  },
  {
    slug: 'michael-moreno',
    name: 'Michael Moreno',
    initials: 'MM',
    group: 'team',
    title: 'Founding Investor',
    tribalAffiliation:
      'Enrolled member of the Coastal Band of the Chumash Nation, a non-federally recognized tribe in California.',
    email: 'michael.moreno@lumecon.ai',
    founder: true,
    summary: 'Founding investor. His early support moved Lumecon from concept to product.',
    bio: [
      'Michael Moreno is the founding investor of Lumecon. His early support helped launch the company and move it from concept to product.',
    ],
  },
  {
    slug: 'laurel-wheeler',
    name: 'Laurel Wheeler',
    initials: 'LW',
    group: 'team',
    title: 'Principal Economist',
    email: 'laurel.wheeler@lumecon.ai',
    linkedin: 'https://www.linkedin.com/in/laurel-wheeler',
    scholar: 'https://scholar.google.com/citations?hl=en&user=oV06J_wAAAAJ',
    photo: '/team/laurel-wheeler.webp',
    education: [
      'PhD, Economics, Duke University',
      'MA, Economics, Duke University',
      'MSc, Economics for Development, University of Oxford',
      'BA, Political Science, University of Florida',
    ],
    experience: [
      'Economist at the Center for Indian Country Development at the Federal Reserve Bank of Minneapolis before joining Lumecon.',
      'Previously a tenure-track economics professor at the University of Alberta.',
    ],
    summary:
      "Leads Lumecon's economics, from economic theory to tribal adaptation. PhD in Economics from Duke. Before Lumecon, she was an economist at the Federal Reserve Bank of Minneapolis (Center for Indian Country Development).",
    bio: [
      "Laurel Wheeler leads Lumecon's economics, including its economic theory and tribal adaptation work, helping ensure the platform reflects credible economic reasoning and the institutional realities of the communities it serves. She holds a bachelor's degree in Political Science from the University of Florida, a master's in Economics for Development from the University of Oxford and a master's and PhD in Economics from Duke University.",
      'Before Lumecon, Laurel was an economist at the Center for Indian Country Development within the Federal Reserve Bank of Minneapolis.',
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
        summary:
          'One of the most detailed empirical portraits of the Native CDFI industry, using survey data from 49 certified and emerging Native CDFIs. It documents variation in age, size, geography, strategic goals, risk-assessment practices, product offerings, development services and institutional challenges and uses cluster analysis to identify four distinct Native CDFI profiles.',
        url: 'https://doi.org/10.1080/15575330.2026.2631398',
      },
      {
        title:
          'Fostering Financial Inclusion by Ensuring Cultural Fit: The Case of the NCDFI Industry',
        authors: 'Valentina Dimitrova-Grajzl, Peter Grajzl, Michou Kokodoko, Laurel Wheeler',
        year: '2025',
        venue: 'American Indian Culture and Research Journal',
        summary:
          'Uses interviews with Native CDFI leaders to examine how they design lending practices, development services, partnerships and success metrics around the communities they serve. It emphasizes person-centered lending, strategic partnerships, customized financial products, inclusive measures of success and the role of cultural fit in expanding financial inclusion.',
        url: 'https://www.minneapolisfed.org/research/cicd-working-paper-series/fostering-financial-inclusion-by-ensuring-cultural-fit-the-case-of-the-ncdfi-industry',
      },
      {
        title:
          'Harnessing Soft Information to Promote Financial Inclusion: The Case of Business Lending by a Native CDFI',
        authors: 'Valentina Dimitrova-Grajzl, Peter Grajzl, Lakota Vogel, Laurel Wheeler',
        year: '2025',
        venue: 'Journal of Financial Services Research',
        summary:
          'Analyzes business loan data from a Native CDFI to compare conventional credit scores with lender-generated soft-information measures of borrower risk. It finds that a character-based risk measure predicts loan delinquency and interest rates beyond what credit scores alone explain, showing how relationship-based underwriting can capture information missed by standard credit metrics.',
        url: 'https://doi.org/10.1007/s10693-024-00439-5',
      },
      {
        title: 'Applying Indigenous Approaches to Economics Instruction',
        authors: 'Larry Chavis, Laurel Wheeler',
        year: '2025',
        venue: 'Journal of Economics, Race, and Policy',
        summary:
          'Develops a relational approach to economics instruction informed by Indigenous pedagogies from North America. It connects inclusive teaching practices with belonging, community, reciprocity and contextual learning, arguing that economics becomes more accessible and rigorous when students understand economic questions through relationships, lived experience and place.',
        url: 'https://doi.org/10.1007/s41996-024-00158-y',
      },
      {
        title:
          'Beyond Conventional Models: Lending by Native Community Development Financial Institutions',
        authors:
          'Valentina Dimitrova-Grajzl, Peter Grajzl, A. Joseph Guse, Michou Kokodoko, Laurel Wheeler',
        year: '2024',
        venue: 'Annals of Public and Cooperative Economics',
        summary:
          'Uses loan-level data from eleven Native CDFI loan funds to study how Native CDFIs lend, whom they serve and what predicts delinquency. It shows that Native CDFIs provide small and varied loans across diverse borrower circumstances, relying on both conventional risk measures and community-informed, character-based measures of creditworthiness.',
        url: 'https://doi.org/10.1111/apce.12453',
      },
      {
        title:
          'When the Lender Extends a Helping Hand: Native CDFI Client Counseling and Loan Performance in Indian Country',
        authors:
          'Valentina Dimitrova-Grajzl, Peter Grajzl, A. Joseph Guse, Michou Kokodoko, Laurel Wheeler',
        year: '2023',
        venue: 'Journal of Economics, Race, and Policy',
        summary:
          'Uses loan-level data and survival analysis to study whether Native CDFI-provided financial counseling affects loan performance. It finds that counseling reduces the risk of loan failure, especially for borrowers with limited prior credit-market experience, with personalized coaching appearing more effective than less tailored classroom-style training.',
        url: 'https://doi.org/10.1007/s41996-023-00119-x',
      },
      {
        title: 'More than Chance: The Local Labor Market Effects of Tribal Gaming',
        authors: 'Laurel Wheeler',
        year: '2023',
        venue:
          'Federal Reserve Bank of Minneapolis, Center for Indian Country Development Working Paper Series (2023-02)',
        summary:
          'Uses confidential U.S. Census microdata and a database of tribal government-owned casinos to estimate how tribal gaming affects local labor markets across different markets, time horizons and subgroups. It finds that tribal gaming drives sustained gains in reservation employment and wages, with American Indians benefiting the most, and that while it raises average housing rents, the increase is smaller than the wage gains, implying net local benefits.',
        url: 'https://www.minneapolisfed.org/research/cicd-working-paper-series/more-than-chance-the-local-labor-market-effects-of-tribal-gaming',
      },
    ],
  },
  {
    slug: 'isabella-agnes',
    name: 'Isabella Agnes',
    initials: 'IA',
    group: 'team',
    title: 'Input-Output Modeling Lead',
    email: 'isabella.agnes@lumecon.ai',
    linkedin: 'https://www.linkedin.com/in/maria-isabella-agnes-741569b7',
    photo: '/team/isabella-agnes.webp',
    education: [
      'Doctoral research in Economics, University of Maryland, College Park',
      'BS, Mathematics, University of Wisconsin-Madison',
      'BS, Economics, University of Wisconsin-Madison',
    ],
    experience: [
      'Data scientist at the Library of Congress.',
      'Her prior work includes economic modeling and public-sector data science for the District of Columbia government, the Board of Governors of the Federal Reserve System and the Federal Reserve Bank of Philadelphia.',
    ],
    summary:
      "Leads the multiplier system and input/output models. Holds bachelor's degrees in Mathematics and Economics from Wisconsin-Madison and completed doctoral training in Economics at Maryland. Before Lumecon, she was at the Federal Reserve Bank of Philadelphia and the Federal Reserve Board of Governors.",
    bio: [
      "Isabella Agnes leads work on Lumecon's multiplier system and input/output models, including the tools that translate source data into economic impact estimates and connect the models to the website. She holds bachelor's degrees in Mathematics and Economics from the University of Wisconsin-Madison and completed doctoral training in Economics at the University of Maryland, College Park.",
      'Before Lumecon, Isabella was a research assistant at the Federal Reserve Bank of Philadelphia and a data scientist at the Board of Governors of the Federal Reserve System.',
    ],
    alumniOf: ['University of Wisconsin-Madison', 'University of Maryland, College Park'],
    prevAffiliations: [
      'Government of the District of Columbia',
      'Federal Reserve Bank of Philadelphia',
      'Board of Governors of the Federal Reserve System',
    ],
    currentAffiliations: ['Library of Congress'],
    publications: [
      {
        title: 'Place-Based Labor Market Inequality',
        authors: 'Douglas A. Webber, Isabella Agnes, Jessica Liu, Erin Troland',
        year: '2025',
        venue: 'Federal Reserve Board, Finance and Economics Discussion Series (2025-040)',
        summary:
          'Examines how labor market conditions vary across U.S. counties, showing that national averages often hide large differences in employment, wages, labor force participation and job availability. Using county-level indicators and Lightcast job postings, it connects local labor market tightness to income growth and pandemic recovery while documenting the role of racial composition and geography in shaping labor market inequality.',
        url: 'https://www.federalreserve.gov/econres/feds/place-based-labor-market-inequality.htm',
      },
    ],
  },
  {
    slug: 'francesca-agnes',
    name: 'Francesca Agnes',
    initials: 'FA',
    group: 'team',
    title: 'Cedar Systems Lead',
    email: 'francesca.agnes@lumecon.ai',
    linkedin: 'https://www.linkedin.com/in/francesca-agnes-a8106722b',
    scholar: 'https://scholar.google.com/citations?hl=en&user=o4brEBEAAAAJ',
    photo: '/team/francesca-agnes.webp',
    education: ['BS, Biology, University of Illinois Urbana-Champaign'],
    experience: [
      'Builds the intake and assumption-review systems that help Cedar turn organizational records into structured, reviewable analysis.',
      'Also contributes to Lira, an AI wearable company.',
    ],
    summary:
      "Leads Cedar, Lumecon's AI-assisted workflow for organizing source records and surfacing assumptions. Holds a bachelor's in Biology from the University of Illinois Urbana-Champaign.",
    bio: [
      "Francesca Agnes leads development of Cedar, Lumecon's AI-assisted workflow for organizing source records, surfacing assumptions and helping users move from messy data to usable analysis. She holds a bachelor's degree in Biology from the University of Illinois Urbana-Champaign.",
    ],
    alumniOf: ['University of Illinois Urbana-Champaign'],
    currentAffiliations: ['Lira'],
  },
  {
    slug: 'kaylyn-lee',
    name: 'Kaylyn Lee',
    initials: 'KL',
    group: 'team',
    title: 'Platform Lead',
    email: 'kaylyn.lee@lumecon.ai',
    linkedin: 'https://www.linkedin.com/in/kaylynlee',
    photo: '/team/kaylyn-lee.webp',
    education: ['BS, Computer Science, minor in Business, Cornell University'],
    currentAffiliations: ['Lira'],
    experience: [
      'Builds the platform organizations use to scope, run and revisit analyses.',
      'Also contributes to Lira, an AI wearable company.',
    ],
    summary:
      "Leads development of the Lumecon platform experience. Holds a bachelor's in Computer Science, with a minor in Business, from Cornell University.",
    bio: [
      "Kaylyn Lee leads development of the Lumecon platform experience, helping turn the company's economic impact tools into an organized, usable, customer-facing product. She holds a bachelor's degree in Computer Science, with a minor in Business, from Cornell University.",
    ],
    alumniOf: ['Cornell University'],
  },
  {
    slug: 'brian-kim',
    name: 'Brian Kim',
    initials: 'BK',
    group: 'advisor',
    title: 'Engineering Advisor',
    linkedin: 'https://www.linkedin.com/in/brian-kim-1a543466',
    photo: '/team/brian-kim.webp',
    education: ['BA, Economics, Dartmouth College'],
    experience: [
      'Founder and CEO of Lira, an AI wearable company.',
      'Previously a senior software engineer at Modsy and Chime.',
    ],
    summary:
      "Advises on software architecture, engineering systems and scalability and contributes on Cedar and data security. Holds a bachelor's in Economics from Dartmouth. Before Lumecon, he was a senior software engineer at Modsy and Chime.",
    bio: [
      "Brian Kim advises Lumecon on software architecture, engineering systems, scalability and technical development and also contributes on Cedar's AI workflow and on data security and research operations. He holds a bachelor's degree in Economics from Dartmouth College. Before Lumecon, he was a senior software engineer at Modsy and Chime.",
    ],
    alumniOf: ['Dartmouth College'],
    prevAffiliations: ['Modsy', 'Chime'],
  },
  {
    slug: 'vod-vilfort',
    name: 'Vod Vilfort',
    initials: 'VV',
    group: 'advisor',
    title: 'Methodology Advisor',
    scholar: 'https://scholar.google.com/citations?hl=en&user=Mp6y_pgAAAAJ',
    photo: '/team/vod-vilfort.webp',
    education: [
      'PhD candidate, Economics, Massachusetts Institute of Technology',
      'BA, Mathematics and Economics, Yale University',
    ],
    experience: [
      'NSF Graduate Research Fellow.',
      'His research has appeared in American Economic Review: Insights.',
    ],
    summary:
      "Advises on empirical methodology, econometrics, model design and research standards. Bachelor's in Mathematics and Economics from Yale and a PhD candidate in Economics at MIT, focused on econometrics.",
    bio: [
      "Vod Vilfort advises Lumecon on empirical methodology, econometrics, model design and research standards. He holds a bachelor's degree in Mathematics and Economics from Yale University and is a PhD candidate in Economics at the Massachusetts Institute of Technology, with a focus on econometrics.",
    ],
    alumniOf: ['Yale University', 'Massachusetts Institute of Technology'],
    publications: [
      {
        title: 'Interpreting TSLS Estimators in Information Provision Experiments',
        authors: 'Vod Vilfort, Whitney Zhang',
        year: '2025',
        venue: 'American Economic Review: Insights, 7(3): 376–95',
        summary:
          'Formalizes the exclusion and monotonicity conditions under which two-stage least squares recovers a positive-weighted average of causal effects in information-provision experiments, with practical guidance on which estimators researchers can trust.',
        url: 'https://doi.org/10.1257/aeri.20240353',
      },
    ],
  },
  {
    slug: 'havala-hanson',
    name: 'Havala Hanson',
    initials: 'HH',
    group: 'advisor',
    title: 'Data Governance, Security and Research Operations Advisor',
    linkedin: 'https://www.linkedin.com/in/havala-hanson',
    scholar: 'https://scholar.google.com/citations?hl=en&user=vETE-QYAAAAJ',
    photo: '/team/havala-hanson.webp',
    discipline: 'Data Governance Advisor',
    education: [
      'PhD, Statistics and Policy in Education, University of Alaska Fairbanks',
      'MA, Urban Education Policy, Brown University',
      'BS, Education, University of Wisconsin-Whitewater',
    ],
    experience: [
      'Builds data-governance and privacy practices for sensitive administrative data.',
      'Supports cross-agency data sharing and research operations.',
    ],
    summary:
      'Advises on product direction, data governance, privacy and research operations. PhD in Statistics and Policy in Education from the University of Alaska Fairbanks.',
    bio: [
      "Havala Hanson advises Lumecon on data governance, privacy, research operations, product direction and responsible systems design. She holds a bachelor's degree in Education from the University of Wisconsin-Whitewater, a master's in Urban Education Policy from Brown University and a PhD in Statistics and Policy in Education from the University of Alaska Fairbanks. She has extensive experience developing data governance and security procedures, supporting cross-agency data sharing, managing research operations and working with sensitive administrative datasets.",
    ],
    alumniOf: [
      'University of Alaska Fairbanks',
      'Brown University',
      'University of Wisconsin-Whitewater',
    ],
    publications: [
      {
        title:
          'Pathways to Teaching: Teacher Diversity, Testing, Certification, and Employment in Washington State',
        authors: 'Jason Greenberg Motamedi, Sun Young Yoon, Havala Hanson',
        year: '2021',
        venue: 'Regional Educational Laboratory Northwest / IES (REL 2021-094)',
        summary:
          'Traces Washington’s teacher preparation and employment pipeline, focusing on where candidates move through or leave the path from testing to certification, employment and retention. It shows how these pathways differ across racial and ethnic groups, identifying points where candidates of color face lower progression rates or longer timelines.',
        url: 'https://ies.ed.gov/use-work/resource-library/report/descriptive-study/pathways-teaching-teacher-diversity-testing-certification-and-employment-washington-state',
      },
      {
        title:
          'Implementation of Career- and College-Ready Requirements for High School Graduation in Washington',
        authors: 'Havala Hanson, Traci Fantz',
        year: '2020',
        venue: 'Regional Educational Laboratory Northwest / IES (REL 2020-020)',
        summary:
          'Examines Washington’s rollout of more demanding career- and college-ready graduation requirements: how districts implemented them, how students accessed the required coursework and how the policy changes translated into actual student pathways.',
        url: 'https://ies.ed.gov/use-work/resource-library/report/descriptive-study/implementation-career-and-college-ready-requirements-high-school-graduation-washington',
      },
      {
        title:
          'Preparing Alaskans for Mining Careers Through Short, Industry-Informed Training Programs',
        authors: 'Havala Hanson, David Stevens, Manuel Vazquez, Brandon Roberts',
        year: '2018',
        venue: 'University of Alaska / Education Northwest evaluation report',
        summary:
          'Evaluates Alaska mining workforce training programs developed with industry input and built around short-term, hands-on occupational training. It examines program design, employer partnerships, student supports, completion, employment and wage outcomes, finding high completion rates in the shorter programs and strong post-program employment among graduates.',
        url: 'https://www.uaf.edu/mapts/about/AK_TAACCCT_Report_093018.pdf',
      },
      {
        title:
          'Alaska Students’ Pathways from High School to Postsecondary Education and Employment',
        authors: 'Havala Hanson, Ashley Pierson',
        year: '2016',
        venue: 'Regional Educational Laboratory Northwest / IES',
        summary:
          'Follows Alaska public high school students into college, in-state employment and early-career earnings. It documents more than 3,000 distinct postsecondary pathways and shows how students’ routes after high school differ by rurality, gender, Alaska Native status, graduation status, education level, employment and wages.',
        url: 'https://ies.ed.gov/use-work/resource-library/report/descriptive-study/alaska-students-pathways-high-school-postsecondary-education-and-employment',
      },
    ],
  },
];

/** Emitted as Organization.founder in the homepage JSON-LD. */
export const FOUNDERS = TEAM.filter((p) => p.founder);

/** The two sections /team renders, in the order they appear there.
 *  Michael Moreno is in TEAM and in llms.txt but not here: the page runs
 *  on a headshot, a degree list and a line of experience, and the record
 *  holds none of the three for him. An entry with the photograph and both
 *  columns empty would read as an omission rather than as a person. */
export const TEAM_ROSTER = TEAM.filter((p) => p.group === 'team' && p.photo);
export const ADVISOR_ROSTER = TEAM.filter((p) => p.group === 'advisor' && p.photo);
