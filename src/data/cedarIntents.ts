/**
 * Cedar chat intent bank.
 *
 * The marketing-page Cedar is keyword-classified, not LLM-driven. Each
 * intent has:
 *   - id: stable identifier referenced by chip lists and the static FAQ
 *   - chip: optional starter-button label; null hides the intent from
 *           the chip rail but keeps it reachable via free-text input
 *   - triggers: lowercased phrases. A trigger matches when the user's
 *               (normalized, whitespace-padded) input contains it as a
 *               substring with word-boundary spaces around it.
 *   - answer: the scripted response Cedar will return
 *
 * Triggers should err on the side of more variations rather than fewer;
 * order within INTENTS matters as a tiebreaker (earlier wins on equal
 * trigger-match score).
 */

export interface CedarIntent {
  id: string;
  /** Chip label for the welcome rail. null hides from chips but keeps
   *  the intent reachable via free-text input. */
  chip: string | null;
  triggers: string[];
  answer: string;
  /** Optional deeper-dive answer surfaced when the user follows up
   *  with "tell me more" / "go deeper" while this intent was the last
   *  topic. Keeps Cedar feeling context-aware without an LLM. */
  expanded?: string;
  /** Optional follow-up intent IDs. After Cedar answers, these render
   *  as quick-reply chips below the bubble so the conversation keeps
   *  moving without the visitor having to think up the next question.
   *  Each ID must exist in INTENTS and have a non-null chip label
   *  (since the chip text doubles as the follow-up label). */
  followUps?: string[];
}

export const INTENTS: CedarIntent[] = [
  {
    id: 'company_overview',
    chip: 'What is Lumecon?',
    triggers: [
      'what is lumecon', 'what does lumecon do', 'what does lumecon', 'explain lumecon', 'what is this company', 'what are you building', 'what is the platform', 'what is lumecon for', 'what problem', 'why does lumecon', 'what is the point of this site', 'this site', 'tell me about lumecon', 'about lumecon', 'overview', 'what do you do', 'lumecon do',
    ],
    answer: "Short version: we help organizations show their economic impact without the months-long consulting engagement. You upload what you have, we harmonize it against the public data sources serious models rely on (ACS, BEA, LODES, QCEW), and you get a defensible study with every assumption surfaced. The same study drops into a council memo, a grant narrative, or a board deck.",
    expanded: "Going deeper: Lumecon sits between expensive software and expensive consulting. The existing platforms charge per geography, per user, per data tier; the consultants who actually run them charge by the billable hour. We collapse both into one flat annual subscription: unlimited studies, every geography, every team member. The engine itself does what serious input-output models always do (direct, indirect, induced, total impact), but it's wrapped in a workflow built for cloud, modern data, and AI from day one. Cedar handles the harmonization and surfaces every assumption so your team makes judgment calls instead of cleaning spreadsheets.",
    followUps: ['audience', 'multipliers', 'competitors', 'demo'],
  },
  {
    id: 'cedar_identity',
    chip: 'What is Cedar?',
    triggers: [
      'what is cedar', 'who are you', 'are you the chatbot', 'are you a chatbot', 'are you a bot', 'what can cedar help', 'why are you called cedar', 'what does this assistant do', 'can you answer', 'are you ai', 'are you a real person', 'who is cedar', 'how can i use this chatbot', 'about cedar', 'what does cedar do', 'tell me about cedar',
    ],
    answer: "I'm Cedar, Lumecon's assistant. Inside the platform I read your administrative files, harmonize them with public data, surface every modeling assumption, and write the source record. Here on the site I'm a lighter version: ask me what Lumecon does, who it's for, what a study costs, or how to reach the team. If I'm not the right tool for what you need, I'll say so and point you at someone who is.",
    followUps: ['company_overview', 'accuracy', 'technical', 'demo'],
  },
  {
    id: 'audience',
    chip: 'Who is Lumecon for?',
    triggers: [
      'who uses lumecon', 'who uses this', 'who uses it', 'who is this for', 'who is this platform for', 'who is lumecon for', 'who is the platform made for', 'what kinds of clients', 'what kind of clients', 'what types of clients', 'clients do you serve', 'who do you serve', 'who do you work with', 'is this for nonprofits', 'is this for universities', 'is this for foundations', 'is this for developers', 'is this for community', 'is this for me', 'target audience', 'who are your customers', 'who buys this',
    ],
    answer: "Mostly governments, enterprises, and mission-driven organizations: tribal nations, state and local agencies, universities, foundations, ports, transit agencies, large nonprofits, and community development financial institutions. The common thread is they need to defend their numbers to a council, a board, or a funder, and they need that defense to hold up to scrutiny. Where do you sit?",
    expanded: "Breaking it down: tribal nations and tribal enterprises (gaming, energy, government services, cultural institutions) use the Tribal Economic Impact platform. Cities, counties, state DOTs, departments of commerce, workforce boards, and treasury offices use the Local Economic Impact platform, typically for capital project justification, grant rounds, bond measures, and annual impact reports. Universities use it for the community ripple of operations, research, construction, and student spending. Foundations use it to show donors and boards what grantmaking actually moved. Ports, airports, and transit agencies use it for capital plans. CDFIs and community lenders use it for portfolio-level place-based impact.",
    followUps: ['tribal_platform', 'local_platform', 'foundation_use', 'state_agency_use'],
  },
  {
    id: 'tribal_platform',
    chip: 'Does this work for tribal nations?',
    triggers: [
      'tribal economic impact', 'tribal platform', 'tribal government', 'tribal nation', 'native nation', 'tribal enterprise', 'tribal gaming', 'tribes use this', 'is this made for native', 'help tribal', 'help tribes', 'help native', 'measure tribal', 'tribal grant', 'why do tribes need this', 'tribal',
    ],
    answer: "The Tribal Economic Impact platform is built specifically for tribal nations and tribal enterprises, and it handles the geographies the existing tools struggle with (reservations, off-reservation trust land, Alaska Native regional and village corporations, and Native Hawaiian Home Lands), respects tribal data sovereignty, and produces studies you can hand to a council, a federal funder, or a casino regulator. The resulting studies cover jobs, wages, supplier activity, and the regional ripple effects.",
    followUps: ['geographies', 'data_inputs', 'security', 'contact'],
  },
  {
    id: 'local_platform',
    chip: 'Can cities and counties use this?',
    triggers: [
      'local economic impact', 'local platform', 'cities use', 'counties use', 'city use', 'county use', 'local government', 'municipal', 'state agency', 'state agencies', 'public agency', 'public agencies', 'measure a project', "project's impact", 'project impact', 'local development', 'public investment', "i'm not a tribal", 'non-tribal', 'non tribal',
    ],
    answer: "Definitely. Cities, counties, state agencies, port and transit authorities, school districts, and special districts all use Lumecon for the same kinds of questions: what does this project, program, or bond actually do for the local economy, and how do we defend that number to a council, a board, or the public? Tell me what level you're at (city, county, state agency) and I can be more specific.",
    followUps: ['county_city_use', 'state_agency_use', 'bond_measure', 'demo'],
  },
  {
    id: 'reports_outputs',
    chip: 'What kind of reports does it produce?',
    triggers: [
      'what reports', 'what report', 'pdf report', 'final output', 'output look like', 'create dashboards', 'dashboard', 'export the results', 'export', 'presentations', 'public meetings', 'board materials', 'economic impact report', 'deliverables', 'what do you produce', 'what does it produce', 'report do you',
    ],
    answer: "Every study produces a full report PDF, an editable executive summary, the underlying tables and charts, and a slide-ready deck. The same study reshapes for the audience you're talking to: funders see the grant-ready jobs-and-investment narrative, councils see the local benefit framing, boards see the strategic context, public meetings see the plain-language version. The numbers are identical; only the framing changes.",
    followUps: ['grant_applications', 'time_to_study', 'historical_forward', 'demo'],
  },
  {
    id: 'data_inputs',
    chip: 'What data does it use?',
    triggers: [
      'what data', 'where does the data come', 'users upload data', 'upload my data', 'bring my own data', 'bring your own data', 'what inputs', 'what input', 'government data', 'public data', 'is the data credible', 'how do you calculate', 'what data sources', 'data sources', 'real economic data',
    ],
    answer: "Your administrative records (budgets, payroll, program data, vendor spend) plus the public sources serious models rely on: ACS, BEA regional accounts, LODES, QCEW, County Business Patterns. We layer in alternative data where it helps (USASpending, the regional Fed banks, anonymized mobility, satellite land use) and our own proprietary signals built in-house: regional multipliers refined across thousands of past studies, plus methodology adjustments tuned by our data team. Don't worry if your data is messy or scattered across departments; the whole point of Cedar is to harmonize it for you.",
    followUps: ['security', 'accuracy', 'multipliers', 'time_to_study'],
  },
  {
    id: 'multipliers',
    chip: 'What are multipliers?',
    triggers: [
      'what is a multiplier', 'what are multipliers', 'what are economic multipliers', 'explain multipliers', 'how do multipliers', 'indirect impact', 'induced impact', 'direct impact', 'total economic impact', 'ripple effect', 'ripple through', 'why does spending create', 'multiplier effect', 'multiplier',
    ],
    answer: "A multiplier estimates how each dollar of activity ripples through an economy. Three layers: direct (the spending itself, like wages, construction, supplies), indirect (the suppliers that get hired by the direct spenders), and induced (the local businesses that get hired when workers spend their paychecks). Add them up and you get total impact. Multipliers differ by industry and geography, which is why a casino in Connecticut has a different ripple than a wind farm in Nebraska.",
    expanded: "Going one layer deeper: multipliers come from input-output models built on the BEA national accounts, regionalized down to your geography. Three things drive whether the ripple is big or small. One, regional purchase coefficients (RPCs): how much of a dollar stays local versus leaks out to suppliers in another state. Two, the industry mix of the spending, since wages in healthcare ripple differently than capital in heavy construction. Three, the wage-to-non-wage split, since worker spending is what drives induced effects. We surface each of those choices in the assumption layer of the report, so a reviewer can trace any number back to where it came from.",
    followUps: ['explain_simple', 'accuracy', 'geographies', 'data_inputs'],
  },
  {
    id: 'software_vs_consulting',
    chip: 'Is this software or consulting?',
    triggers: [
      'is lumecon software', 'is this consulting', 'are you a saas', 'is this saas', 'saas company', 'sell reports', 'platform or a service', 'platform or service', 'hire you to do the analysis', 'is this self-service', 'is this self service', 'need an economist', 'turbotax for impact', 'is this automated', 'software or service',
    ],
    answer: "Lumecon is software, not consulting. The whole bet is that economic impact analysis should not be a months-long consulting engagement and should instead be something your team can run any time you need it. Cedar handles the data wrangling and the modeling while your team makes the judgment calls, and the Lumecon team will walk you through complex first-time studies or unusual data situations even though the steady state is your team using the platform without us in the loop.",
    followUps: ['roi_lumecon', 'time_to_study', 'onboarding', 'pricing'],
  },
  {
    id: 'pricing',
    chip: 'How much does it cost?',
    triggers: [
      'how much', 'what is the price', 'pricing', 'what does it cost', 'cost of lumecon', 'subscription', 'do you have subscriptions', 'can i buy', 'how do i get access', 'become a customer', 'become a client', 'price',
    ],
    answer: "Pricing is five figures a year on a flat annual subscription that covers unlimited studies across every geography (reservation, county, state, and national). For comparison, the legacy stack tends to run six figures per study and ships months later. We are early enough that pricing is matched to each use case, so the best path is to tell the team a bit about your organization and we will come back with a number.",
    expanded: "More on pricing: it's an annual subscription, not per-study or per-seat or per-geography. Your whole team gets access; you can run as many studies as you want across reservations, counties, states, and national rollups. We work with selected pilot partners while the platform is early, which means pricing flexes for size and use case: a community foundation looks different from a state DOT looks different from a tribal gaming enterprise. The math we use under the hood is mainstream economics and the BEA accounts are public, so we're not charging you for the data; we're charging for the software that makes the analysis actually usable.",
    followUps: ['roi_lumecon', 'demo', 'contact', 'compare_implan_workflow'],
  },
  {
    id: 'demo',
    chip: 'Can I see a demo?',
    triggers: [
      'schedule a demo', 'want a demo', 'see a demo', 'see the demo', 'get a demo', 'demo of', 'a demo', 'see the product', 'see the platform', 'show me the platform', 'show me the product', 'is there a demo', 'can i try', 'try the platform', 'try lumecon', 'accepting pilots', 'pilot program', 'pilot partner', 'walkthrough', 'book a call', 'set up a call',
    ],
    answer: "Happy to set one up. The easiest path is the contact form on this site or contact@lumecon.ai with three things included up front: who you are, the kind of impact you want to measure, and any timeline you are working with. The demo runs in your geography against a study scenario relevant to your work, so the two minutes spent giving us that context up front pays off quickly.",
    followUps: ['contact', 'time_to_study', 'onboarding', 'pricing'],
  },
  {
    id: 'contact',
    chip: 'How do I contact you?',
    triggers: [
      'how do i contact', 'contact you', 'who should i email', 'i want to talk', 'speak with the founder', 'speak to the founder', 'reach lumecon', 'reach the team', 'reach out', 'get in touch', 'send an email', 'email lumecon', 'phone number',
    ],
    answer: "Contact form on this site or contact@lumecon.ai works. Drop a line about your organization and what you're trying to measure; the team reads everything and routes based on context. If it's time-sensitive (grant deadline, council vote, board meeting), say so and we'll move accordingly.",
    followUps: ['demo', 'pricing', 'partnerships', 'hiring'],
  },
  {
    id: 'partnerships',
    chip: "I'm an investor or partner",
    triggers: [
      "i'm an investor", 'an investor', 'are you raising', 'raising money', 'raising capital', 'want to partner', 'partnership', 'work with consultants', 'collaborate', 'strategic partner', 'aligned partner', 'invest in lumecon',
    ],
    answer: 'Thanks for your interest. Lumecon is open to conversations with aligned partners, advisors, funders, and collaborators. The best next step is to contact the team directly with a short note about who you are, what kind of partnership you have in mind, and why you think there may be a fit.',
  },
  {
    id: 'hiring',
    chip: 'Are you hiring?',
    triggers: [
      'are you hiring', 'work for lumecon', 'have internships', 'internship', "i'm a developer", "i'm a designer", "i'm an engineer", 'join the team', 'open roles', 'open role', 'careers', 'apply for a job', 'job opening', 'join lumecon',
    ],
    answer: "We are a six-person team looking for early teammates across software engineering, machine learning, data, economist and impact modeling, marketing, and sales. These are unpaid early-stage roles open to undergraduate and graduate students, and we mentor people who are persistent. The /join page has the full breakdown, or you can email contact@lumecon.ai with a résumé and a paragraph on what draws you to the work.",
    followUps: ['where_built', 'company_overview', 'contact'],
  },
  {
    id: 'technical',
    chip: 'Tech stack and integrations?',
    triggers: [
      'tech stack', 'technology stack', 'do you have an api', 'have an api', 'api access', 'integrate with my system', 'integration', 'upload spreadsheet', 'upload spreadsheets', 'connect to external', 'external database', 'multiple people', 'support teams', 'team account', 'sso', 'single sign on',
    ],
    answer: 'Lumecon is being designed as a modern web platform with support for structured data, guided workflows, and organization-level use. Some technical features may depend on the stage of the platform and the needs of pilot users. For integrations, team access, uploads, or API questions, the best next step is to contact the Lumecon team directly.',
  },
  {
    id: 'security',
    chip: 'Is my data safe?',
    triggers: [
      'is my data safe', 'data privacy', 'data security', 'happens to uploaded data', 'do you sell data', 'is this confidential', 'confidential', 'upload sensitive', 'sensitive information', 'protect client data', 'protect data', 'secure enough for governments', 'data sovereignty', 'tribal data', 'how do you protect', 'pii', 'personally identifiable', 'handle pii', 'federal reserve experience', 'government data',
    ],
    answer: "Each organization gets a single-tenant workspace with encryption in transit and at rest, role-based access controls, and US-region cloud. The team handled PII and sensitive government data at the Federal Reserve Banks of Minneapolis and Philadelphia and at the Federal Reserve Board, so production-grade data handling is not a learning curve for us. For tribal data, the data-sovereignty framing is baked in so that your data stays your data, the audit trail is complete, and nothing is used for training. We are happy to walk through specifics before anything sensitive moves.",
    followUps: ['data_residency', 'accuracy', 'contact', 'tribal_platform'],
  },
  {
    id: 'accuracy',
    chip: 'How credible are the numbers?',
    triggers: [
      'how accurate', 'can i trust the numbers', 'trust the numbers', 'peer reviewed', 'peer review', 'defensible', 'someone challenges', 'used publicly', 'used for grants', 'use for grants', 'with policymakers', 'credibility', 'how credible', 'are the numbers', 'does cedar hallucinate', 'hallucinate', 'hallucination', 'rag', 'retrieval augmented', 'make stuff up',
    ],
    answer: "Three things keep the numbers defensible. Every direct, indirect, induced, and total impact figure is verified against the existing platforms before it ships, so the numbers match what a reviewer would expect. Cedar is RAG-based, so answers come from the actual data and source record rather than a model guess. And every assumption (multiplier choice, regional bridge, base year, scaling rules) is surfaced and citable in the report, so a reviewer can trace any number back to where it came from.",
    expanded: "More on how we keep this defensible: data provenance is per-row, so when a study cites a BEA multiplier for NAICS 23 in your county, you can click through to the source table and vintage. Assumptions are versioned with the study, so changing the regional purchase coefficient preserves the prior run in the audit trail. Cedar's reasoning steps are logged alongside the numbers, so if anyone asks why we picked a particular industry bridge or wage assumption, the answer is in the report, not in someone's email. The methodology itself is published openly; we'd rather a reviewer challenge a specific number than wave away the whole approach.",
    followUps: ['multipliers', 'data_inputs', 'competitors', 'security'],
  },
  {
    id: 'calculate_now',
    chip: null,
    triggers: [
      'calculate my', 'estimate my impact', 'what is the impact', '$10 million project', '$1 million', '$5 million', 'how many jobs would', 'how many jobs will', 'how many jobs does', 'multiplier for my county', 'multiplier for my', 'run the numbers', 'give me an estimate', 'compute my', 'compute the impact',
    ],
    answer: 'I can explain how impact analysis works, but I cannot calculate a reliable estimate directly in this chat. To estimate impact responsibly, Lumecon would need details like the project location, spending categories, employment, wages, timeline, and relevant industry or sector. The platform is designed to guide users through that process more carefully. If you want a real estimate, contact contact@lumecon.ai.',
  },
  {
    id: 'competitors',
    chip: 'How is this different from IMPLAN / RIMS / Lightcast?',
    triggers: [
      'is this like implan', 'compete with implan', 'better than implan', 'like rims', 'rims ii', 'rims 2', 'is this like lightcast', 'like emsi', 'like remi', 'replacing economists', 'why not just use implan', 'makes this different', 'how is this different', 'implan alternative', 'compared to implan',
    ],
    answer: "Same underlying economics (input-output modeling, regional multipliers, base-year reweighting). That's the mainstream stuff and the BEA accounts behind it are public. What's been missing is software built with the tools that exist today: cloud infrastructure, modern UI, RAG-based AI, real-time data feeds, and geographies that aren't trapped inside administrative borders. We verify our direct, indirect, induced, and total impact figures against the existing platforms, update the assumptions and data that should be updated, and keep what shouldn't.",
    expanded: "Concretely, what's different: pricing structure (flat annual vs. per-geography per-user per-tier), workflow (Cedar harmonizes inputs in minutes rather than analysts hand-cleaning for weeks), geographies (reservations, off-reservation trust land, Alaska Native regional corporations, Native Hawaiian Home Lands all first-class, not edge cases), data freshness (high-frequency public feeds plus our own proprietary signals layered on the same BEA accounts), and audit trail (every assumption surfaced and citable). What's the same: the math. We benchmark our direct, indirect, induced, and total impact figures against the existing platforms before any study ships, so a reviewer familiar with the legacy tools recognizes the numbers.",
    followUps: ['multipliers', 'accuracy', 'roi_lumecon', 'compare_implan_workflow'],
  },
  {
    id: 'explain_simple',
    chip: 'Explain economic impact like I am five',
    triggers: [
      'explain like', 'eli5', "i'm five", 'like i am five', 'what is economic impact', 'why does economic impact matter', 'what does this actually mean', 'why should i care', "what's an example", 'whats an example', 'give me an example', 'in simple terms', 'in plain english',
    ],
    answer: "Picture a new community college campus opening. The construction crew gets paid (direct). Those workers buy lunch nearby, and the campus orders supplies from a regional vendor (indirect). The vendor pays its staff, who spend on rent, groceries, kids' soccer, the dentist (induced). Add all that up and you have the total economic impact: the campus, plus the ripple. That's the story Lumecon tells, with the math defensible and every assumption visible.",
    followUps: ['multipliers', 'audience', 'reports_outputs', 'demo'],
  },
  {
    id: 'geographies',
    chip: 'What geographies are covered?',
    triggers: [
      'what geographies', 'which geographies', 'what regions', 'which regions', 'coverage', 'what areas does it cover', 'rural counties', 'small region', 'small regions', 'native hawaiian', 'alaska native', 'ancsa', 'reservations', 'reservation level',
    ],
    answer: "Lumecon covers every federally recognized tribal nation and reservation, every Alaska Native Regional Corporation, Native Hawaiian Home Lands, every U.S. county, every U.S. state, and the country as a whole. Multi-region and overlapping-geography studies work the same way, so a project that crosses three counties or sits on a reservation that overlaps two counties is still one study rather than three. The whole geographic footprint is included in the flat annual subscription, and we do not charge per geography.",
    followUps: ['tribal_platform', 'local_platform', 'pricing', 'demo'],
  },
  {
    id: 'historical_forward',
    chip: 'Historical or forward-looking?',
    triggers: [
      'historical', 'longitudinal', 'forward looking', 'forward-looking', 'project forward', 'plan a budget', 'capital project', 'grant proposal', 'budget proposal', 'over time', 'past impact', 'future impact',
    ],
    answer: "Lumecon supports both directions. You can look back to tell the story of what has already happened through annual impact reports and longitudinal studies, or model forward to plan a budget, grant ask, or capital project. The same data and methodology work either way and only the framing changes, and studies sharpen over time as more of your data accumulates in the workspace.",
    followUps: ['reports_outputs', 'time_to_study', 'grant_applications', 'demo'],
  },
  {
    id: 'where_built',
    chip: 'Where was Lumecon built?',
    triggers: [
      'where was lumecon built', 'where is lumecon based', 'where is lumecon from', "lumecon's background", 'team background', 'who built lumecon', 'who founded', 'founded by', 'cornell', 'team experience', 'who is on the team', 'who is behind',
    ],
    answer: "Built at Ivy League and peer schools: Cornell, Dartmouth, Oxford, MIT, and Yale across the team's academic background, with counsel from the Cornell Law Entrepreneurship Law Clinic. Prior professional experience includes the Federal Reserve Banks of Minneapolis and Philadelphia and the Federal Reserve Board of Governors in Washington, DC, which is where we learned what serious data handling and economic analysis are supposed to look like.",
    followUps: ['hiring', 'company_overview', 'partnerships'],
  },
  {
    id: 'grant_applications',
    chip: 'Can it support grant applications?',
    triggers: [
      'grant application', 'grant applications', 'federal grant', 'eda grant', 'hud grant', 'dot grant', 'epa grant', 'usda grant', 'cdbg', 'bil', 'bipartisan infrastructure law', 'rural development grant', 'broadband grant', 'workforce grant', 'arc grant', 'narrative for a grant', 'grant narrative', 'job estimates for a grant', 'private investment estimate', 'show economic benefit',
    ],
    answer: "Grant applications are one of the most common uses of Lumecon. Most federal and state grant programs (EDA, HUD CDBG, DOT BUILD, USDA Rural Development, EPA, NTIA broadband, and ARC) want applicants to estimate jobs, private investment, or regional benefit with a credible source behind the numbers. Lumecon produces the jobs, labor income, and tax-impact figures with the methodology attached, so the same study drops into the grant narrative, the council packet, and the board memo without any rework.",
    followUps: ['reports_outputs', 'time_to_study', 'accuracy', 'demo'],
  },
  {
    id: 'time_to_study',
    chip: 'How long does a study take?',
    triggers: [
      'how long does it take', 'how long to produce', 'how long is a study', 'turnaround', 'turn around time', 'how fast can you', 'study timeline', 'project timeline', 'lead time', 'how quickly', 'in time for our board', 'before our deadline', 'before grant deadline',
    ],
    answer: "A standard study takes minutes once the data is in. The legacy path takes months because the analyst is harmonizing data by hand and re-running scenarios from scratch every time, while Cedar does the harmonization in minutes so the slow part becomes the judgment calls (which assumptions to surface, which scenario to model) rather than the spreadsheet work.",
    followUps: ['onboarding', 'compare_implan_workflow', 'demo', 'roi_lumecon'],
  },
  {
    id: 'no_economist',
    chip: "We don't have an economist on staff",
    triggers: [
      "don't have an economist", 'no economist', 'not an economist', 'not a data scientist', 'not technical', 'we are not analysts', 'we are not analysts', 'small team', 'limited capacity', 'tight staffing', 'capacity constrained', 'who runs the analysis', 'do i need to know economics',
    ],
    answer: "You don't need one. Most organizations using Lumecon don't have an economist on staff, and that's exactly who the platform is built for. Cedar walks you through the data, picks defaults that match the geography and project type, and flags every assumption in plain English before the study is finalized. Your team makes the judgment calls; the platform handles the modeling. For unusual or methodology-sensitive projects, the Lumecon team is one email away.",
    followUps: ['onboarding', 'time_to_study', 'demo', 'roi_lumecon'],
  },
  {
    id: 'state_agency_use',
    chip: 'How do state agencies use it?',
    triggers: [
      'state department of', 'state dot', 'state doc', 'state commerce', 'state treasury', 'state agency use case', 'state agency uses', 'department of commerce', 'department of transportation', 'state legislature', 'state budget office', 'state workforce board', 'state health department', 'how do states use',
    ],
    answer: "State DOTs, departments of commerce, workforce boards, treasury offices, and health departments use Lumecon to justify capital programs, score grant rounds, defend budget asks at the legislature, and produce annual impact reports. Typical artifacts: a defensible jobs / labor income / GDP figure for a capital plan, a multi-year impact narrative for a workforce program, a regional benefit comparison across counties for a competitive grant. Same engine, different reports.",
    followUps: ['grant_applications', 'reports_outputs', 'historical_forward', 'demo'],
  },
  {
    id: 'county_city_use',
    chip: 'How do cities and counties use it?',
    triggers: [
      'city manager', 'city use case', 'city uses', 'county use case', 'county uses', 'edo', 'economic development director', 'economic development office', 'chamber of commerce', 'mayor', 'council member', 'school district', 'school bond', 'special district', 'how do cities use', 'how do counties use',
    ],
    answer: "Cities and counties use Lumecon for capital project justification (fire station, library, transit line, parks), TIF and tax-abatement evaluation, school-district bond communication, business-attraction packages, and annual community impact reports. EDOs especially use it to compare projects on equal footing and to put concrete numbers behind a recruitment pitch or an incentive ask, the kind of analysis that used to require an outside consultant per project.",
    followUps: ['bond_measure', 'grant_applications', 'reports_outputs', 'demo'],
  },
  {
    id: 'foundation_use',
    chip: 'How do foundations use it?',
    triggers: [
      'foundation use case', 'how do foundations use', 'foundation report', 'philanthropy', 'philanthropic', 'grantmaker', 'grantmaking', 'community foundation', 'private foundation', 'family foundation', 'measure our giving', 'measure grantmaking', 'sroi', 'social return on investment', 'donor report',
    ],
    answer: "Foundations and community grantmakers use Lumecon to show donors and boards what their dollars actually moved: jobs supported, wages generated, local business activity, regional ripple effects. The annual report stops reading as anecdote and starts reading as evidence. Community foundations especially use it for place-based portfolios: the dollars invested in a county or a neighborhood, with the economic ripple measured the same way every year.",
    followUps: ['reports_outputs', 'grant_applications', 'accuracy', 'demo'],
  },
  {
    id: 'bond_measure',
    chip: 'Can we use it for a bond measure?',
    triggers: [
      'bond measure', 'school bond', 'municipal bond', 'infrastructure bond', 'general obligation bond', 'go bond', 'voter bond', 'capital bond', 'bond campaign', 'bond election', 'parks bond', 'transit bond',
    ],
    answer: "School districts, transit agencies, parks departments, and municipalities use Lumecon to translate a bond program into the local economic impact that voters and oversight boards can recognize, including construction jobs, multi-year labor income, supplier spend kept in-region, and operating impact once the asset is in service. The output drops into voter information pamphlets, council resolutions, and rating-agency conversations, and the same study supports the rating-agency presentation and the community town hall.",
    followUps: ['reports_outputs', 'county_city_use', 'grant_applications', 'demo'],
  },
  {
    id: 'compare_implan_workflow',
    chip: 'How is the workflow different?',
    triggers: [
      'workflow', 'day to day', 'in practice', 'what does the work look like', 'what does the workflow', 'how is the workflow', 'how does the work flow', 'replacing my consultant', 'replacing consultants', 'replace consultant',
    ],
    answer: "On the legacy path, a consultant or analyst opens the existing platforms (software whose workflow predates the internet), hand-cleans the data, picks the multipliers, writes the report, and comes back months later. On the Lumecon path, you drop your administrative data into the workspace, Cedar harmonizes and pre-fits the model, you review the assumptions Cedar surfaces (with direct, indirect, induced, and total impact verified against the existing platforms), approve or adjust each one, and export the report. The economist's judgment stays in the loop, but the data wrangling and re-runs do not, so what used to take months takes minutes.",
    expanded: "Step by step in the Lumecon workflow: (1) upload the records you already have (budgets, payroll, vendor lists, program data). (2) Cedar matches them against NAICS codes, geographies, time periods, and surfaces anything ambiguous for you to confirm. (3) Cedar pre-fits the impact model with defaults tuned to your geography and project type, and lists every assumption inline. (4) Your team reviews, adjusts, and approves. (5) Run the study; numbers come back in minutes with the audit trail attached. (6) Export the deliverables (full report, executive summary, slide deck, tables), each tuned to the audience. The judgment calls that used to live in a senior analyst's head are now visible in the report.",
    followUps: ['competitors', 'time_to_study', 'roi_lumecon', 'demo'],
  },
  {
    id: 'roi_lumecon',
    chip: 'What does Lumecon cost vs. the alternative?',
    triggers: [
      'cost vs', 'vs hiring a consultant', 'cheaper than a consultant', 'roi of', 'return on lumecon', 'is this worth it', 'why pay for this', 'why subscribe', 'cost of doing nothing', 'budget for impact', 'price compared to', 'savings vs',
    ],
    answer: "A single legacy impact study typically runs $50K to $150K and ships months later. Lumecon is five figures a year for unlimited studies across every geography. The legacy price tag is what a workflow looks like after forty years of one toolchain owning the category; it's not a measure of how hard the work actually is. The math is mainstream economics; the BEA accounts behind it are public and free. Payback is usually one or two studies; after that the subscription is producing analyses the organization couldn't have afforded one-off.",
    followUps: ['pricing', 'compare_implan_workflow', 'demo', 'competitors'],
  },
  {
    id: 'data_residency',
    chip: 'Where is the data hosted?',
    triggers: [
      'where is the data hosted', 'data residency', 'data location', 'where do you store', 'aws', 'cloud provider', 'us cloud', 'us only', 'fedramp', 'govcloud', 'hipaa', 'compliance', 'compliant', 'soc 2', 'soc2', 'iso 27001', 'storage location', 'data center',
    ],
    answer: "US-region cloud, single-tenant workspace per organization, encryption in transit and at rest, role-based access controls. For pilots with sensitive procurement or compliance requirements (FedRAMP, HIPAA-adjacent, state PIIA, tribal data sovereignty), we'll walk through the specifics before any data leaves your environment. If you need a specific compliance posture or region, say so up front and we'll tell you whether it's something we already cover or something we'll need to scope.",
    followUps: ['security', 'tribal_platform', 'contact'],
  },
  {
    id: 'onboarding',
    chip: 'How does onboarding work?',
    triggers: [
      'how do i get started', 'how do we get started', 'onboarding', 'onboard', 'getting started', 'first study', 'first project', 'kick off', 'kickoff', 'how does setup work', 'how long is setup', 'training',
    ],
    answer: "Short kick-off call to scope the first study, then your team uploads the data you already have (budgets, payroll, program records, vendor lists). Cedar walks you through harmonization and surfaces every assumption before the first study runs. First defensible study comes back in minutes once the data's in. We usually do the first one alongside you so you see how the workspace handles your data, then your team takes the reins.",
    followUps: ['time_to_study', 'demo', 'data_inputs', 'pricing'],
  },
  {
    id: 'tell_me_more',
    chip: 'Tell me more',
    triggers: [
      'tell me more', 'go deeper', 'more detail', 'more details', 'expand on that', 'expand on this', 'say more', 'keep going', 'continue', 'what else',
    ],
    answer: "Happy to keep going. To give you something specific instead of repeating myself, pick what's most useful: the methodology, the workflow, the pricing, the data we use, or a demo. You can also describe the problem you're trying to solve and I'll route us there.",
    followUps: ['company_overview', 'compare_implan_workflow', 'pricing', 'demo'],
  },
  {
    id: 'thanks',
    chip: null,
    triggers: [
      'thanks', 'thank you', 'thx', 'ty', 'appreciate it', 'appreciated', 'cheers', 'much appreciated', 'thank u',
    ],
    answer: "You're welcome. Anything else I can help with, like pricing, geographies, a demo, or the workflow?",
    followUps: ['pricing', 'demo', 'geographies', 'contact'],
  },
  {
    id: 'goodbye',
    chip: null,
    triggers: [
      'bye', 'goodbye', 'see you', 'see ya', 'later', "i'm done", 'thats all', "that's all", 'have a good one',
    ],
    answer: "Take care, and if something else comes up the contact form and contact@lumecon.ai are both monitored, so feel free to drop a line anytime.",
  },
  {
    id: 'affirmative',
    chip: null,
    triggers: [
      'yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'got it', 'makes sense', 'sounds good', 'cool', 'nice', 'great',
    ],
    answer: "Glad that landed. Want me to keep going on this thread, or switch to something else like pricing, a demo, the workflow, or who else uses Lumecon?",
    followUps: ['pricing', 'demo', 'compare_implan_workflow', 'audience'],
  },
  {
    id: 'negative',
    chip: null,
    triggers: [
      'no', 'nope', 'not really', 'not yet', 'not now', 'maybe later',
    ],
    answer: "No problem. If something else is on your mind (methodology, geographies, a specific use case), say the word and we'll route there. Otherwise the contact form is here whenever you're ready.",
    followUps: ['company_overview', 'audience', 'contact'],
  },
  {
    id: 'confused',
    chip: null,
    triggers: [
      'help', "i'm confused", 'what should i ask', "i don't know where to start", 'guide me', 'not sure what i need', 'i just want to know more', 'where do i start',
    ],
    answer: "No problem. The easiest starting points are what Lumecon does, who uses it, how a study works, or what it costs. If you've got a specific project in mind like a grant, a bond, or an annual impact report, tell me about it and I'll point us at the right answer.",
    followUps: ['company_overview', 'audience', 'pricing', 'demo'],
  },
  {
    id: 'rude',
    chip: null,
    triggers: [
      'this is stupid', 'this makes no sense', 'your site is bad', 'this chatbot is useless', 'i hate this', "you're wrong", 'youre wrong', 'this is confusing', 'this sucks', 'you suck',
    ],
    answer: "Sorry this was frustrating. I may not have understood what you were looking for. Lumecon's team can give a clearer answer if you reach out through the contact form, or email contact@lumecon.ai. You can also try asking me directly about the platform, pricing, demos, economic impact reports, or who Lumecon serves.",
  },
  {
    id: 'greeting',
    chip: null,
    triggers: [
      'hi', 'hello', 'hey', 'yo', 'sup', 'howdy', 'good morning', 'good afternoon', 'good evening', 'cedar',
    ],
    answer: "Hey, I'm Cedar, Lumecon's site assistant. I can answer questions about what Lumecon does, who uses it, how the math works, what a study costs, or how to reach the team. What brings you in today?",
    followUps: ['company_overview', 'audience', 'pricing', 'demo'],
  },
];

// Catch-all responses for input that doesn't match any intent above.
export const OUT_OF_SCOPE_ANSWER =
  "I'm Cedar, Lumecon's site assistant, so I'm best at answering questions about Lumecon, economic impact reporting, and how to connect with the team. Try asking me what Lumecon does, who the platform is for, or how economic impact analysis works.";

export const FALLBACK_ANSWER =
  "I didn't catch that. Try asking what Lumecon does, who it's for, how impact analysis works, how to see a demo, or how to contact the team. You can also email contact@lumecon.ai for anything specific.";

// Triggers that flip an unmatched message into OUT_OF_SCOPE rather than
// the generic FALLBACK. Pure-spam strings still fall through.
export const OUT_OF_SCOPE_TRIGGERS = [
  'weather', 'write my essay', 'tell me a joke', 'who won', 'bitcoin', 'crypto', 'capital of france', 'dating advice', 'homework', 'who is the president', 'meaning of life', 'sports score',
];

// Intents shown as starter chips inside the welcome bubble. Picks the
// most actionable prompts; the full intent bank is still reachable via
// free-text input.
export const CHIP_IDS = [
  'company_overview',
  'audience',
  'county_city_use',
  'state_agency_use',
  'grant_applications',
  'time_to_study',
  'pricing',
  'demo',
  'competitors',
  'cedar_identity',
] as const;

// Curated subset for the static <details> fallback and the FAQPage
// JSON-LD on the homepage. The question wording differs from the chip
// label (these target search queries, the chips target conversation).
export const STATIC_FAQ_IDS = [
  'company_overview',
  'audience',
  'tribal_platform',
  'local_platform',
  'multipliers',
  'geographies',
  'cedar_identity',
  'where_built',
] as const;

export const STATIC_FAQ_QUESTIONS: Record<string, string> = {
  company_overview: 'What is Lumecon?',
  audience: 'Who uses Lumecon?',
  tribal_platform: 'How does Lumecon support tribal nations?',
  local_platform: 'Can cities, counties, and other organizations use Lumecon?',
  multipliers: 'What are economic multipliers?',
  geographies: 'What geographies does Lumecon cover?',
  cedar_identity: 'What is Cedar?',
  where_built: 'Where was Lumecon built?',
};
