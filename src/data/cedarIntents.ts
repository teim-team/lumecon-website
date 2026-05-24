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
}

export const INTENTS: CedarIntent[] = [
  {
    id: 'company_overview',
    chip: 'What is Lumecon?',
    triggers: [
      'what is lumecon', 'what does lumecon do', 'what does lumecon', 'explain lumecon', 'what is this company', 'what are you building', 'what is the platform', 'what is lumecon for', 'what problem', 'why does lumecon', 'what is the point of this site', 'this site', 'tell me about lumecon', 'about lumecon', 'overview', 'what do you do', 'lumecon do',
    ],
    answer: "Short version: we help organizations show their economic impact without the months-long consulting engagement. You upload what you have, we harmonize it against the public data sources serious models rely on (ACS, BEA, LODES, QCEW), and you get a defensible study with every assumption surfaced. The same study drops into a council memo, a grant narrative, or a board deck.",
    expanded: "Going deeper: Lumecon sits between expensive software and expensive consulting. The existing platforms charge per geography, per user, per data tier; the consultants who actually run them charge by the billable hour. We collapse both into one flat annual subscription: unlimited studies, with every geography and data tier included. The engine itself does what serious input-output models always do (direct, indirect, induced, total impact), but it's wrapped in a workflow built for cloud, modern data, and AI from day one. Cedar handles the harmonization and surfaces every assumption so your team makes judgment calls instead of cleaning spreadsheets.",
  },
  {
    id: 'cedar_identity',
    chip: 'What is Cedar?',
    triggers: [
      'what is cedar', 'who are you', 'are you the chatbot', 'are you a chatbot', 'are you a bot', 'what can cedar help', 'why are you called cedar', 'what does this assistant do', 'can you answer', 'are you ai', 'are you a real person', 'who is cedar', 'how can i use this chatbot', 'about cedar', 'what does cedar do', 'tell me about cedar',
    ],
    answer: "I'm Cedar, Lumecon's assistant. Inside the platform I read your administrative files, harmonize them with public data, surface every modeling assumption, and write the source record. Here on the site I'm a lighter version: ask me what Lumecon does, who it's for, what a study costs, or how to reach the team. If I'm not the right tool for what you need, I'll say so and point you at someone who is.",
  },
  {
    id: 'audience',
    chip: 'Who is Lumecon for?',
    triggers: [
      'who uses lumecon', 'who uses this', 'who uses it', 'who is this for', 'who is this platform for', 'who is lumecon for', 'who is the platform made for', 'what kinds of clients', 'what kind of clients', 'what types of clients', 'clients do you serve', 'who do you serve', 'who do you work with', 'is this for nonprofits', 'is this for universities', 'is this for foundations', 'is this for developers', 'is this for community', 'is this for me', 'target audience', 'who are your customers', 'who buys this',
    ],
    answer: "Mostly governments, enterprises, and mission-driven organizations: tribal nations, state and local agencies, universities, foundations, ports, transit agencies, large nonprofits, and community development financial institutions. The common thread is they need to defend their numbers to a council, a board, or a funder, and they need that defense to hold up to scrutiny. Where do you sit?",
    expanded: "Breaking it down: tribal nations and tribal enterprises (gaming, energy, government services, cultural institutions) use the Tribal Economic Impact platform. Cities, counties, state DOTs, departments of commerce, workforce boards, and treasury offices use the Local Economic Impact platform, typically for capital project justification, grant rounds, bond measures, and annual impact reports. Universities use it for the community ripple of operations, research, construction, and student spending. Foundations use it to show donors and boards what grantmaking actually moved. Ports, airports, and transit agencies use it for capital plans. CDFIs and community lenders use it for portfolio-level place-based impact.",
  },
  {
    id: 'tribal_platform',
    chip: 'Does this work for tribal nations?',
    triggers: [
      'tribal economic impact', 'tribal platform', 'tribal government', 'tribal nation', 'native nation', 'tribal enterprise', 'tribal gaming', 'tribes use this', 'is this made for native', 'help tribal', 'help tribes', 'help native', 'measure tribal', 'tribal grant', 'why do tribes need this', 'tribal',
      'tribe', 'tribes', 'native', 'native american', 'indigenous', 'casino', 'gaming', 'intertribal', 'tribal college', 'native cdfi', 'tero', 'self determination', 'reservation economy',
    ],
    answer: "The Tribal Economic Impact platform is built specifically for tribal nations and tribal enterprises, and it handles the geographies the existing tools struggle with (reservations, off-reservation trust land, Alaska Native regional and village corporations, and Native Hawaiian Home Lands), respects tribal data sovereignty, and produces studies you can hand to a council, a federal funder, or a casino regulator. The resulting studies cover jobs, wages, supplier activity, and the regional ripple effects. Are you with a tribal nation or a tribal enterprise?",
    expanded: "Going deeper for tribal nations: the platform treats reservation and off-reservation trust land, Alaska Native Regional and Village Corporations, and Native Hawaiian Home Lands as first-class geographies, not edge cases the legacy tools force into county approximations. Data sovereignty is built in — a single-tenant workspace, you control what's uploaded and shared, nothing trains a shared model, and cross-study learning runs only on anonymized aggregates. Typical outputs are gaming and enterprise impact studies for a council or a federal funder (NIGC, BIA, Treasury), grant narratives, and annual reports showing jobs, wages, and the dollars kept in the regional economy.",
  },
  {
    id: 'local_platform',
    chip: 'Can cities and counties use this?',
    triggers: [
      'local economic impact', 'local platform', 'cities use', 'counties use', 'city use', 'county use', 'local government', 'municipal', 'state agency', 'state agencies', 'public agency', 'public agencies', 'measure a project', "project's impact", 'project impact', 'local development', 'public investment', "i'm not a tribal", 'non-tribal', 'non tribal',
    ],
    answer: "Definitely. Cities, counties, state agencies, port and transit authorities, school districts, and special districts all use Lumecon for the same kinds of questions: what does this project, program, or bond actually do for the local economy, and how do we defend that number to a council, a board, or the public? Tell me what level you're at (city, county, state agency) and I can be more specific.",
    expanded: "Across local government: cities and counties use it for capital projects, bonds, TIF and abatement decisions, business attraction, and annual impact reports; state agencies (DOT, commerce, workforce, treasury, health) use it for capital programs, grant scoring, and budget defense; ports, transit, and special districts use it for capital plans and rate cases. It all runs on the same engine and the same public data, so a number you cite to a council holds up the same way in a grant application or a rating-agency meeting.",
  },
  {
    id: 'reports_outputs',
    chip: 'What kind of reports does it produce?',
    triggers: [
      'what reports', 'what report', 'pdf report', 'final output', 'output look like', 'create dashboards', 'dashboard', 'export the results', 'export', 'presentations', 'public meetings', 'board materials', 'economic impact report', 'deliverables', 'what do you produce', 'what does it produce', 'report do you',
    ],
    answer: "Every study produces a full report PDF, an editable executive summary, the underlying tables and charts, and a slide-ready deck. The same study reshapes for the audience you're talking to: funders see the grant-ready jobs-and-investment narrative, councils see the local benefit framing, boards see the strategic context, public meetings see the plain-language version. The numbers are identical; only the framing changes. Who's the audience you need to win over?",
    expanded: "On the deliverables: every study exports a full report PDF, an editable executive summary, the underlying tables and charts as CSV, and a slide-ready deck. The numbers are identical across versions — only the framing shifts: funders see the jobs-and-investment narrative, councils see local benefit, boards see strategic context, public meetings get the plain-language version. Every figure carries its assumption ledger, so when someone challenges a number you trace it to the multiplier, base year, and data vintage behind it instead of defending a black box.",
  },
  {
    id: 'data_inputs',
    chip: 'What data does it use?',
    triggers: [
      'what data', 'where does the data come', 'users upload data', 'upload my data', 'bring my own data', 'bring your own data', 'what inputs', 'what input', 'government data', 'public data', 'is the data credible', 'how do you calculate', 'what data sources', 'data sources', 'real economic data',
    ],
    answer: "Your administrative records (budgets, payroll, program data, vendor spend) plus the public sources serious models rely on: ACS, BEA regional accounts, LODES, QCEW, County Business Patterns. We layer in alternative data where it helps (USASpending, the regional Fed banks, anonymized mobility, satellite land use) and our own proprietary signals built in-house: regional multipliers refined across thousands of past studies, plus methodology adjustments tuned by our data team. Don't worry if your data is messy or scattered across departments; the whole point of Cedar is to harmonize it for you. What does your data look like right now?",
    expanded: "More on data: you bring administrative records — budgets, payroll, program rosters, vendor and contract spend — in whatever shape they arrive (spreadsheets, PDFs, exports). Cedar matches them to NAICS codes, geographies, and time periods, flags anything ambiguous for you to confirm, and joins them to the public sources serious models rely on: ACS, BEA regional accounts, LODES, QCEW, and County Business Patterns, plus higher-frequency alternative signals where they sharpen the estimate. Messy and scattered-across-departments is the normal starting point, not a blocker.",
  },
  {
    id: 'multipliers',
    chip: 'What are multipliers?',
    triggers: [
      'what is a multiplier', 'what are multipliers', 'what are economic multipliers', 'explain multipliers', 'how do multipliers', 'indirect impact', 'induced impact', 'direct impact', 'total economic impact', 'ripple effect', 'ripple through', 'why does spending create', 'multiplier effect', 'multiplier',
      'the math', 'how does the math', 'how the math works', 'how does the math work', 'methodology', 'how is it calculated', 'how is it modeled', 'how does the model work', 'how the model works', 'input output', 'input-output', 'io model', 'i-o model', 'rpc', 'regional purchase coefficient',
    ],
    answer: "A multiplier estimates how each dollar of activity ripples through an economy. Three layers: direct (the spending itself, like wages, construction, supplies), indirect (the suppliers that get hired by the direct spenders), and induced (the local businesses that get hired when workers spend their paychecks). Add them up and you get total impact. Multipliers differ by industry and geography, which is why a casino in Connecticut has a different ripple than a wind farm in Nebraska.",
    expanded: "Going one layer deeper: multipliers come from input-output models built on the BEA national accounts, regionalized down to your geography. Three things drive whether the ripple is big or small. One, regional purchase coefficients (RPCs): how much of a dollar stays local versus leaks out to suppliers in another state. Two, the industry mix of the spending, since wages in healthcare ripple differently than capital in heavy construction. Three, the wage-to-non-wage split, since worker spending is what drives induced effects. We surface each of those choices in the assumption layer of the report, so a reviewer can trace any number back to where it came from.",
  },
  {
    id: 'software_vs_consulting',
    chip: 'Is this software or consulting?',
    triggers: [
      'is lumecon software', 'is this consulting', 'are you a saas', 'is this saas', 'saas company', 'sell reports', 'platform or a service', 'platform or service', 'hire you to do the analysis', 'is this self-service', 'is this self service', 'need an economist', 'turbotax for impact', 'is this automated', 'software or service',
    ],
    answer: "Lumecon is software, not consulting. The whole bet is that economic impact analysis should not be a months-long consulting engagement and should instead be something your team can run any time you need it. Cedar handles the data wrangling and the modeling while your team makes the judgment calls, and the Lumecon team will walk you through complex first-time studies or unusual data situations even though the steady state is your team using the platform without us in the loop. Does your team have an economist on staff?",
    expanded: "On software vs. consulting: the steady state is your team running studies in the platform whenever you need one — no per-study fee, no waiting on an outside firm. You don't need an economist on staff; Cedar picks defaults matched to your geography and project type and explains each one in plain English for your sign-off. The Lumecon team is there for a first study, an unusual data situation, or a methodology-sensitive project, but the capability lives with you, not on a consultant's calendar.",
  },
  {
    id: 'pricing',
    chip: 'How much does it cost?',
    triggers: [
      'how much', 'what is the price', 'pricing', 'what does it cost', 'cost of lumecon', 'subscription', 'do you have subscriptions', 'can i buy', 'how do i get access', 'become a customer', 'become a client', 'price',
      'cost', 'costs', 'expensive', 'how expensive', 'affordable', 'afford', 'budget', 'quote', 'a quote', 'tiers', 'tier', 'plans', 'plan cost', 'per seat', 'per user', 'per study', 'annual cost', 'yearly cost', 'license', 'license cost', 'free', 'is it free', 'discount', 'discount code', 'promo code',
    ],
    answer: "Pricing is five figures a year on a flat annual subscription that covers unlimited studies across every geography (reservation, county, state, and national). For comparison, the legacy stack tends to run $50K to $150K per study and ships months later. The tiers are right on the pricing page (no call required), and we flex for size and use case, so reach out if your situation is unusual. Want me to break down what each tier includes?",
    expanded: "More on pricing: it's an annual subscription, not per-study or per-geography. Seats scale by tier (one on Sprout, up to five on Sapling, up to ten on Tree) with no per-use metering, and you can run as many studies as you want across reservations, counties, states, and national rollups. We work with selected pilot partners while the platform is early, which means pricing flexes for size and use case: a community foundation looks different from a state DOT looks different from a tribal gaming enterprise. The math we use under the hood is mainstream economics and the BEA accounts are public, so we're not charging you for the data; we're charging for the software that makes the analysis actually usable.",
  },
  {
    id: 'demo',
    chip: 'Can I see a demo?',
    triggers: [
      'schedule a demo', 'want a demo', 'see a demo', 'see the demo', 'get a demo', 'demo of', 'a demo', 'see the product', 'see the platform', 'show me the platform', 'show me the product', 'is there a demo', 'can i try', 'try the platform', 'try lumecon', 'accepting pilots', 'pilot program', 'pilot partner', 'walkthrough', 'book a call', 'set up a call',
      'demo', 'trial', 'free trial', 'try it', 'try it out', 'test it', 'test drive', 'sandbox', 'poc', 'proof of concept', 'book a demo', 'request a demo', 'talk to sales', 'sales call', 'see it in action', 'live demo',
    ],
    answer: "Happy to set one up. The easiest path is the contact form on this site or contact@lumecon.ai with three things included up front: who you are, the kind of impact you want to measure, and any timeline you are working with. The demo runs in your geography against a study scenario relevant to your work, so the two minutes spent giving us that context up front pays off quickly. What kind of impact are you hoping to measure?",
    expanded: "What a demo looks like: tell us your geography and the kind of impact you want to show, and we run a study in your region against a relevant scenario — walking through how Cedar harmonizes inputs, surfaces assumptions, and produces the report. It's concrete, not a slideshow; you see your own use case. Fastest path is the contact form or contact@lumecon.ai with who you are, what you want to measure, and any timeline. If there's a grant or council deadline, say so and we'll move to fit it.",
  },
  {
    id: 'contact',
    chip: 'How do I contact you?',
    triggers: [
      'how do i contact', 'contact you', 'who should i email', 'i want to talk', 'speak with the founder', 'speak to the founder', 'reach lumecon', 'reach the team', 'reach out', 'get in touch', 'send an email', 'email lumecon', 'phone number',
      'contact', 'email', 'email address', 'call', 'call you', 'phone', 'talk to someone', 'speak to someone', 'support', 'customer support', 'who do i talk to', 'get a hold of', 'connect with you',
    ],
    answer: "Contact form on this site or contact@lumecon.ai works. Drop a line about your organization and what you're trying to measure; the team reads everything and routes based on context. If it's time-sensitive (grant deadline, council vote, board meeting), say so and we'll move accordingly.",
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
  },
  {
    id: 'accuracy',
    chip: 'How credible are the numbers?',
    triggers: [
      'how accurate', 'can i trust the numbers', 'trust the numbers', 'peer reviewed', 'peer review', 'defensible', 'someone challenges', 'used publicly', 'used for grants', 'use for grants', 'with policymakers', 'credibility', 'how credible', 'are the numbers', 'does cedar hallucinate', 'hallucinate', 'hallucination', 'rag', 'retrieval augmented', 'make stuff up',
    ],
    answer: "Three things keep the numbers defensible. Every direct, indirect, induced, and total impact figure is verified against the existing platforms before it ships, so the numbers match what a reviewer would expect. Cedar is RAG-based, so answers come from the actual data and source record rather than a model guess. And every assumption (multiplier choice, regional bridge, base year, scaling rules) is surfaced and citable in the report, so a reviewer can trace any number back to where it came from.",
    expanded: "More on how we keep this defensible: data provenance is per-row, so when a study cites a BEA multiplier for NAICS 23 in your county, you can click through to the source table and vintage. Assumptions are versioned with the study, so changing the regional purchase coefficient preserves the prior run in the audit trail. Cedar's reasoning steps are logged alongside the numbers, so if anyone asks why we picked a particular industry bridge or wage assumption, the answer is in the report, not in someone's email. The methodology itself is published openly; we'd rather a reviewer challenge a specific number than wave away the whole approach.",
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
      'implan', 'rims', 'lightcast', 'emsi', 'remi', 'competitor', 'competitors', 'alternative to', 'vs implan', 'instead of implan', 'difference', 'how are you different', 'what sets you apart', 'why you',
    ],
    answer: "Same underlying economics (input-output modeling, regional multipliers, base-year reweighting). That's the mainstream stuff and the BEA accounts behind it are public. What's been missing is software built with the tools that exist today: cloud infrastructure, modern UI, RAG-based AI, real-time data feeds, and geographies that aren't trapped inside administrative borders. We verify our direct, indirect, induced, and total impact figures against the existing platforms, update the assumptions and data that should be updated, and keep what shouldn't. Are you comparing us against a specific tool?",
    expanded: "Concretely, what's different: pricing structure (flat annual vs. per-geography per-user per-tier), workflow (Cedar harmonizes inputs in minutes rather than analysts hand-cleaning for weeks), geographies (reservations, off-reservation trust land, Alaska Native regional corporations, Native Hawaiian Home Lands all first-class, not edge cases), data freshness (high-frequency public feeds plus our own proprietary signals layered on the same BEA accounts), and audit trail (every assumption surfaced and citable). What's the same: the math. We benchmark our direct, indirect, induced, and total impact figures against the existing platforms before any study ships, so a reviewer familiar with the legacy tools recognizes the numbers.",
  },
  {
    id: 'explain_simple',
    chip: 'Explain economic impact like I am five',
    triggers: [
      'explain like', 'eli5', "i'm five", 'like i am five', 'what is economic impact', 'why does economic impact matter', 'what does this actually mean', 'why should i care', "what's an example", 'whats an example', 'give me an example', 'in simple terms', 'in plain english',
    ],
    answer: "Picture a new community college campus opening. The construction crew gets paid (direct). Those workers buy lunch nearby, and the campus orders supplies from a regional vendor (indirect). The vendor pays its staff, who spend on rent, groceries, kids' soccer, the dentist (induced). Add all that up and you have the total economic impact: the campus, plus the ripple. That's the story Lumecon tells, with the math defensible and every assumption visible.",
  },
  {
    id: 'geographies',
    chip: 'What geographies are covered?',
    triggers: [
      'what geographies', 'which geographies', 'what regions', 'which regions', 'coverage', 'what areas does it cover', 'rural counties', 'small region', 'small regions', 'native hawaiian', 'alaska native', 'ancsa', 'reservations', 'reservation level',
    ],
    answer: "Lumecon covers every federally recognized tribal nation and reservation, every Alaska Native Regional Corporation, Native Hawaiian Home Lands, every U.S. county, every U.S. state, and the country as a whole. Multi-region and overlapping-geography studies work the same way, so a project that crosses three counties or sits on a reservation that overlaps two counties is still one study rather than three. The whole geographic footprint is included in the flat annual subscription, and we do not charge per geography.",
  },
  {
    id: 'historical_forward',
    chip: 'Historical or forward-looking?',
    triggers: [
      'historical', 'longitudinal', 'forward looking', 'forward-looking', 'project forward', 'plan a budget', 'capital project', 'grant proposal', 'budget proposal', 'over time', 'past impact', 'future impact',
    ],
    answer: "Lumecon supports both directions. You can look back to tell the story of what has already happened through annual impact reports and longitudinal studies, or model forward to plan a budget, grant ask, or capital project. The same data and methodology work either way and only the framing changes, and studies sharpen over time as more of your data accumulates in the workspace.",
  },
  {
    id: 'where_built',
    chip: 'Where was Lumecon built?',
    triggers: [
      'where was lumecon built', 'where is lumecon based', 'where is lumecon from', "lumecon's background", 'team background', 'who built lumecon', 'who founded', 'founded by', 'cornell', 'team experience', 'who is on the team', 'who is behind',
    ],
    answer: "Built at Ivy League and peer schools: Cornell, Dartmouth, Oxford, MIT, and Yale across the team's academic background, with counsel from the Cornell Law Entrepreneurship Law Clinic. Prior professional experience includes the Federal Reserve Banks of Minneapolis and Philadelphia and the Federal Reserve Board of Governors in Washington, DC, which is where we learned what serious data handling and economic analysis are supposed to look like.",
  },
  {
    id: 'grant_applications',
    chip: 'Can it support grant applications?',
    triggers: [
      'grant application', 'grant applications', 'federal grant', 'eda grant', 'hud grant', 'dot grant', 'epa grant', 'usda grant', 'cdbg', 'bil', 'bipartisan infrastructure law', 'rural development grant', 'broadband grant', 'workforce grant', 'arc grant', 'narrative for a grant', 'grant narrative', 'job estimates for a grant', 'private investment estimate', 'show economic benefit',
      'grant', 'grants', 'funding', 'federal funding', 'apply for funding', 'apply for a grant', 'grant program', 'grant deadline', 'match requirement', 'leverage ratio', 'benefit cost', 'benefit-cost', 'bca',
      'epa', 'hud', 'dot', 'eda', 'usda', 'ntia', 'arc', 'sba', 'hrsa', 'doe', 'fema', 'hhs', 'bia', 'noaa', 'nsf', 'build', 'raise', 'ira', 'inflation reduction act', 'iija', 'infrastructure law', 'arpa', 'american rescue plan',
    ],
    answer: "Grant applications are one of the most common uses of Lumecon. Most federal and state grant programs (EDA, HUD CDBG, DOT BUILD, USDA Rural Development, EPA, NTIA broadband, and ARC) want applicants to estimate jobs, private investment, or regional benefit with a credible source behind the numbers. Lumecon produces the jobs, labor income, and tax-impact figures with the methodology attached, so the same study drops into the grant narrative, the council packet, and the board memo without any rework. Which grant program are you aiming at?",
    expanded: "More on grants: most programs want a credible, sourced estimate of jobs, private investment, or regional benefit, and Lumecon produces exactly that with the methodology attached so a reviewer can trace every figure. EDA wants jobs and leveraged private investment; HUD CDBG wants low-to-moderate-income benefit; DOT BUILD/RAISE wants benefit-cost framing; USDA Rural Development and NTIA broadband want jobs and output; ARC wants distress-area impact. The same study exports to the narrative, the budget justification, and the council packet, so you build the numbers once instead of rebuilding them per reviewer.",
  },
  {
    id: 'time_to_study',
    chip: 'How long does a study take?',
    triggers: [
      'how long does it take', 'how long to produce', 'how long is a study', 'turnaround', 'turn around time', 'how fast can you', 'study timeline', 'project timeline', 'lead time', 'how quickly', 'in time for our board', 'before our deadline', 'before grant deadline',
    ],
    answer: "A standard study takes minutes once the data is in. The legacy path takes months because the analyst is harmonizing data by hand and re-running scenarios from scratch every time, while Cedar does the harmonization in minutes so the slow part becomes the judgment calls (which assumptions to surface, which scenario to model) rather than the spreadsheet work. Are you working against a deadline?",
    expanded: "Why it's minutes, not months: the legacy timeline is dominated by an analyst hand-cleaning data and re-keying it into a tool whose workflow predates the internet, then re-running from scratch for each scenario. Cedar harmonizes and pre-fits the model the moment your data lands, so the only human time left is judgment — which assumptions to surface, which scenario to model, what to override. The first defensible study comes back the same session the data's in; revisions are a re-run, not a re-engagement. Against a council vote or grant deadline, that's the difference between making it and missing it.",
  },
  {
    id: 'no_economist',
    chip: "We don't have an economist on staff",
    triggers: [
      "don't have an economist", 'no economist', 'not an economist', 'not a data scientist', 'not technical', 'we are not analysts', 'we are not analysts', 'small team', 'limited capacity', 'tight staffing', 'capacity constrained', 'who runs the analysis', 'do i need to know economics',
    ],
    answer: "You don't need one. Most organizations using Lumecon don't have an economist on staff, and that's exactly who the platform is built for. Cedar walks you through the data, picks defaults that match the geography and project type, and flags every assumption in plain English before the study is finalized. Your team makes the judgment calls; the platform handles the modeling. For unusual or methodology-sensitive projects, the Lumecon team is one email away.",
  },
  {
    id: 'state_agency_use',
    chip: 'How do state agencies use it?',
    triggers: [
      'state department of', 'state dot', 'state doc', 'state commerce', 'state treasury', 'state agency use case', 'state agency uses', 'department of commerce', 'department of transportation', 'state legislature', 'state budget office', 'state workforce board', 'state health department', 'how do states use',
    ],
    answer: "State DOTs, departments of commerce, workforce boards, treasury offices, and health departments use Lumecon to justify capital programs, score grant rounds, defend budget asks at the legislature, and produce annual impact reports. Typical artifacts: a defensible jobs / labor income / GDP figure for a capital plan, a multi-year impact narrative for a workforce program, a regional benefit comparison across counties for a competitive grant. Same engine, different reports. Which agency are you with?",
    expanded: "By agency: a state DOT models capital-program and corridor impact for the legislature and federal applications; a department of commerce scores grant rounds and incentive deals on equal footing; a workforce board shows the multi-year return on training programs; a treasury or budget office defends appropriations with jobs and GDP figures; a health department sizes the economic footprint of facilities and programs. Each gets the same direct, indirect, induced, and total figures with the assumption ledger attached, reshaped into the artifact that office actually presents.",
  },
  {
    id: 'county_city_use',
    chip: 'How do cities and counties use it?',
    triggers: [
      'city manager', 'city use case', 'city uses', 'county use case', 'county uses', 'edo', 'economic development director', 'economic development office', 'chamber of commerce', 'mayor', 'council member', 'school district', 'school bond', 'special district', 'how do cities use', 'how do counties use',
    ],
    answer: "Cities and counties use Lumecon for capital project justification (fire station, library, transit line, parks), TIF and tax-abatement evaluation, school-district bond communication, business-attraction packages, and annual community impact reports. EDOs especially use it to compare projects on equal footing and to put concrete numbers behind a recruitment pitch or an incentive ask, the kind of analysis that used to require an outside consultant per project. Are you on the city or county side?",
    expanded: "In practice for cities and counties: the common studies are capital-project justification (a fire station, library, transit line, or parks bond), TIF and tax-abatement evaluation, business-attraction and incentive analysis, and the annual community impact report. Economic development offices use it to compare projects on equal footing and to put a defensible number behind a recruitment pitch. The output reshapes for the audience — council resolution, voter pamphlet, rating-agency deck — off one run, so the analysis that used to mean a consultant per project now lives in your workspace.",
  },
  {
    id: 'foundation_use',
    chip: 'How do foundations use it?',
    triggers: [
      'foundation use case', 'how do foundations use', 'foundation report', 'philanthropy', 'philanthropic', 'grantmaker', 'grantmaking', 'community foundation', 'private foundation', 'family foundation', 'measure our giving', 'measure grantmaking', 'sroi', 'social return on investment', 'donor report',
    ],
    answer: "Foundations and community grantmakers use Lumecon to show donors and boards what their dollars actually moved: jobs supported, wages generated, local business activity, regional ripple effects. The annual report stops reading as anecdote and starts reading as evidence. Community foundations especially use it for place-based portfolios: the dollars invested in a county or a neighborhood, with the economic ripple measured the same way every year.",
  },
  {
    id: 'bond_measure',
    chip: 'Can we use it for a bond measure?',
    triggers: [
      'bond measure', 'school bond', 'municipal bond', 'infrastructure bond', 'general obligation bond', 'go bond', 'voter bond', 'capital bond', 'bond campaign', 'bond election', 'parks bond', 'transit bond',
    ],
    answer: "School districts, transit agencies, parks departments, and municipalities use Lumecon to translate a bond program into the local economic impact that voters and oversight boards can recognize, including construction jobs, multi-year labor income, supplier spend kept in-region, and operating impact once the asset is in service. The output drops into voter information pamphlets, council resolutions, and rating-agency conversations, and the same study supports the rating-agency presentation and the community town hall.",
  },
  {
    id: 'compare_implan_workflow',
    chip: 'How is the workflow different?',
    triggers: [
      'workflow', 'day to day', 'in practice', 'what does the work look like', 'what does the workflow', 'how is the workflow', 'how does the work flow', 'replacing my consultant', 'replacing consultants', 'replace consultant',
      'how does it work', 'how does lumecon work', 'how it works', 'how does this work', 'how do studies work', 'walk me through', 'how do i use it', 'how do you use it', 'what are the steps', 'the process',
    ],
    answer: "On the legacy path, a consultant or analyst opens the existing platforms (software whose workflow predates the internet), hand-cleans the data, picks the multipliers, writes the report, and comes back months later. On the Lumecon path, you drop your administrative data into the workspace, Cedar harmonizes and pre-fits the model, you review the assumptions Cedar surfaces (with direct, indirect, induced, and total impact verified against the existing platforms), approve or adjust each one, and export the report. The economist's judgment stays in the loop, but the data wrangling and re-runs do not, so what used to take months takes minutes.",
    expanded: "Step by step in the Lumecon workflow: (1) upload the records you already have (budgets, payroll, vendor lists, program data). (2) Cedar matches them against NAICS codes, geographies, time periods, and surfaces anything ambiguous for you to confirm. (3) Cedar pre-fits the impact model with defaults tuned to your geography and project type, and lists every assumption inline. (4) Your team reviews, adjusts, and approves. (5) Run the study; numbers come back in minutes with the audit trail attached. (6) Export the deliverables (full report, executive summary, slide deck, tables), each tuned to the audience. The judgment calls that used to live in a senior analyst's head are now visible in the report.",
  },
  {
    id: 'roi_lumecon',
    chip: 'What does Lumecon cost vs. the alternative?',
    triggers: [
      'cost vs', 'vs hiring a consultant', 'cheaper than a consultant', 'roi of', 'return on lumecon', 'is this worth it', 'why pay for this', 'why subscribe', 'cost of doing nothing', 'budget for impact', 'price compared to', 'savings vs',
    ],
    answer: "A single legacy impact study typically runs $50K to $150K and ships months later. Lumecon is five figures a year for unlimited studies across every geography. The legacy price tag is what a workflow looks like after forty years of one toolchain owning the category; it's not a measure of how hard the work actually is. The math is mainstream economics; the BEA accounts behind it are public and free. Payback is usually one or two studies; after that the subscription is producing analyses the organization couldn't have afforded one-off.",
  },
  {
    id: 'data_residency',
    chip: 'Where is the data hosted?',
    triggers: [
      'where is the data hosted', 'data residency', 'data location', 'where do you store', 'aws', 'cloud provider', 'us cloud', 'us only', 'fedramp', 'govcloud', 'hipaa', 'compliance', 'compliant', 'soc 2', 'soc2', 'iso 27001', 'storage location', 'data center',
    ],
    answer: "US-region cloud, single-tenant workspace per organization, encryption in transit and at rest, role-based access controls. For pilots with sensitive procurement or compliance requirements (FedRAMP, HIPAA-adjacent, state PIIA, tribal data sovereignty), we'll walk through the specifics before any data leaves your environment. If you need a specific compliance posture or region, say so up front and we'll tell you whether it's something we already cover or something we'll need to scope.",
  },
  {
    id: 'onboarding',
    chip: 'How does onboarding work?',
    triggers: [
      'how do i get started', 'how do we get started', 'onboarding', 'onboard', 'getting started', 'first study', 'first project', 'kick off', 'kickoff', 'how does setup work', 'how long is setup', 'training',
    ],
    answer: "Short kick-off call to scope the first study, then your team uploads the data you already have (budgets, payroll, program records, vendor lists). Cedar walks you through harmonization and surfaces every assumption before the first study runs. First defensible study comes back in minutes once the data's in. We usually do the first one alongside you so you see how the workspace handles your data, then your team takes the reins.",
  },
  {
    id: 'effects_explained',
    chip: 'Direct, indirect, induced?',
    triggers: [
      'direct indirect induced', 'direct indirect and induced', 'direct effect', 'indirect effect', 'induced effect', 'three effects', 'difference between direct and indirect', 'what is total impact', 'spillover effect', 'output effect', 'what do the numbers mean',
    ],
    answer: "Every study reports the same four numbers. Direct: the spending and jobs of the project itself. Indirect: the activity at the suppliers it buys from. Induced: the spending of all those workers' wages back into the local economy. Total impact is the three added together. Lumecon shows each layer separately so a reviewer can see exactly where the headline number comes from.",
    expanded: "Why the split matters: a skeptical reviewer almost always asks 'how much of this is real and local?' Reporting direct, indirect, and induced separately answers that on its face. Direct is hard to argue with (it's your actual spending and payroll). Indirect and induced are where multipliers and regional purchase coefficients do the work, deciding how much of each dollar stays in-region versus leaks out. Because Lumecon surfaces the assumption behind each layer, you can defend the total one component at a time instead of asking the room to trust a single black-box figure.",
  },
  {
    id: 'alternative_data',
    chip: 'Do you use alternative data?',
    triggers: [
      'alternative data', 'high frequency data', 'high-frequency data', 'mobility data', 'satellite data', 'non traditional data', 'non-traditional data', 'real time data', 'real-time data', 'proprietary signals', 'card spending data', 'web scraped',
    ],
    answer: "Yes. Alongside the official sources every serious model uses (ACS, BEA, LODES, QCEW, County Business Patterns), Lumecon layers in alternative data: higher-frequency public feeds, anonymized mobility, satellite land use, USASpending, and the regional Fed banks, plus proprietary signals built in-house from thousands of past studies. It keeps a study current between the slow official releases, and we only use it where it measurably improves the estimate.",
  },
  {
    id: 'cedar_grove',
    chip: 'What is Cedar Grove?',
    triggers: [
      'cedar grove', 'what is cedar grove', 'grove tier', 'curated data', 'data library', 'reusable data', 'filings library',
    ],
    answer: "Cedar Grove is the curated data layer in the top tier (Tree): pre-assembled filings, source materials, trackers, and a reusable data library so recurring submissions (grants, federal reporting, compliance) don't start from scratch each cycle. It's also available as a standalone subscription. Cedar Grove rolls out after launch; the Cedar assistant itself is available from the Sapling tier.",
  },
  {
    id: 'ai_vs_chatgpt',
    chip: 'Is Cedar just ChatGPT?',
    triggers: [
      'just chatgpt', 'is this chatgpt', 'is cedar chatgpt', 'is it gpt', 'use gpt', 'use openai', 'is it a large language model', 'does the ai make up', 'does it make up numbers', 'made up numbers', 'is the ai reliable', 'ai trustworthy', 'generative ai', 'is cedar generative',
    ],
    answer: "No. Cedar is grounded (RAG-based) in your actual files and established economic data, not free-typing answers like a general chatbot. It does the data wrangling, surfaces every assumption for your sign-off, and writes the audit trail; it does not invent the numbers. The economic math is mainstream input-output modeling verified against the legacy platforms, and a person approves each assumption before a study ships. The AI speeds the work without taking over the judgment.",
    expanded: "The distinction in practice: a general chatbot generates plausible text and can confidently state a wrong number. Cedar is constrained to retrieve from your uploaded records and the public data tables, then map them into the model, so its outputs trace back to a source row rather than a guess. Anything ambiguous (an unclear vendor, an industry code that could go two ways) is flagged for a human to confirm rather than silently resolved. And the final figures aren't Cedar's opinion; they're the input-output engine's output, benchmarked against IMPLAN/RIMS-style results. So the AI is a fast, careful research assistant, not the thing deciding your impact number.",
  },
  {
    id: 'sectors_industries',
    chip: 'What industries does it cover?',
    triggers: [
      'what industries', 'what sectors', 'naics', 'sector coverage', 'my industry', 'does it cover healthcare', 'does it cover manufacturing', 'does it cover construction', 'does it cover tourism', 'does it work for nonprofits', 'industry specific', 'which industries',
    ],
    answer: "All of them. The model is built on the full BEA / NAICS industry structure, so any sector your spending touches (construction, healthcare, manufacturing, retail, education, agriculture, gaming, tourism, energy, public administration) maps to the right multipliers. Cedar matches your records to the correct industry codes for you and flags anything ambiguous to confirm.",
  },
  {
    id: 'examples',
    chip: 'Can I see example numbers?',
    triggers: [
      'example numbers', 'examples', 'sample report', 'sample study', 'real numbers', 'show me a study', 'case study', 'case studies', 'see results', 'sample output', 'example study', 'see real',
    ],
    answer: "The interactive map on the homepage runs live example studies: click any state, county, or reservation and direct, indirect, induced, and total impact, jobs, and labor income update in seconds. Those figures are illustrative, to show the workflow; a real study uses your actual data. For a walkthrough with numbers close to your use case, the team is one email away.",
  },
  {
    id: 'team_access',
    chip: 'How many people can use it?',
    triggers: [
      'how many users', 'how many seats', 'how many people', 'team access', 'multiple users', 'whole team', 'add users', 'per seat', 'number of users', 'team members', 'collaborators', 'user limit',
    ],
    answer: "Access scales by tier: one user on Sprout, up to five on Sapling, up to ten on Tree, all on one flat annual subscription with no per-seat metering inside the plan. The workspace is built for teams: review queues route data to HR, finance, payroll, program, and council reviewers so a study doesn't stall on one analyst's desk. Need more seats than a tier lists? Tell us your size and we'll scope it.",
  },
  {
    id: 'data_sovereignty',
    chip: 'Do you respect data sovereignty?',
    triggers: [
      'data sovereignty', 'indigenous data sovereignty', 'tribal data sovereignty', 'who owns the data', 'data ownership', 'own our data', 'care principles', 'ocap', 'data governance', 'own my data', 'keep our data',
    ],
    answer: "Yes. Indigenous data sovereignty is built into the Tribal platform from the start, not bolted on. Your data stays yours: a single-tenant workspace, you control what's uploaded and shared, and we don't resell, syndicate, or train models on your raw records. Cross-study learning runs only on anonymized, aggregated signals. For specific governance frameworks (CARE, OCAP) or council requirements, we'll walk through the specifics before any data moves.",
  },
  {
    id: 'jobs_employment',
    chip: 'How does it report jobs?',
    triggers: [
      'jobs', 'job creation', 'jobs created', 'employment', 'employment impact', 'how many jobs', 'labor income', 'wages', 'payroll impact', 'fte', 'full time equivalent', 'jobs supported', 'direct jobs', 'job numbers', 'employment effect', 'how many positions',
    ],
    answer: "Jobs are usually the headline. Every study breaks employment into direct, indirect, and induced jobs plus the total, alongside labor income (wages) and output — so you can say not just how many jobs but where they land and what they pay. The figures come out in the units funders and councils expect (FTEs, annual labor income, tax impact), each with the multiplier and base year behind it citable in the report. Want the breakdown of how those job numbers are built, or which grant programs ask for them?",
    expanded: "How the job numbers are built: direct jobs are the positions the project funds outright (construction crews, operating staff); indirect jobs sit at the suppliers those dollars flow to; induced jobs come from workers spending wages locally — the grocery clerk, the dentist, the landlord. Each layer is driven by industry-specific employment multipliers and the regional purchase coefficients that decide how much stays in-region, so a labor-intensive program shows more jobs per dollar than a capital-heavy one. We report FTEs and annual labor income, not just headcount, because that's what EDA, HUD, and DOT scoring actually want.",
  },
  {
    id: 'university_use',
    chip: 'How do universities use it?',
    triggers: [
      'university', 'universities', 'college', 'colleges', 'higher ed', 'higher education', 'campus', 'student spending', 'research university', 'college town', 'institutional impact', 'university impact', 'land grant', 'town gown',
    ],
    answer: "Universities and colleges use Lumecon to size the community ripple of operations, research, construction, and student and visitor spending — the number a president cites to the legislature, a board, or the town. It separates the campus's direct footprint (payroll, procurement, capital projects) from the indirect and induced activity it drives across the region, so the figure holds up when a skeptic asks how much is really local. Are you looking at operations, a capital project, or the whole institution?",
    expanded: "For higher ed specifically: operating impact covers payroll, local procurement, and facilities; research impact covers grant-funded activity and spinoffs; construction impact covers capital projects year by year; and student and visitor spending captures off-campus housing, retail, and events. Each rolls up to a total regional impact with jobs and labor income, for one campus or a whole system. The same study reshapes for an accreditation report, a legislative ask, a bond, or a town-gown briefing — one analysis, several audiences.",
  },
  {
    id: 'nonprofit_use',
    chip: 'How do nonprofits use it?',
    triggers: [
      'nonprofit', 'non profit', 'non-profit', 'nonprofits', 'ngo', 'charity', 'mission driven', 'social enterprise', 'community organization', 'cdfi', 'community development financial', 'community lender', 'social return', 'donor report',
    ],
    answer: "Nonprofits, community development financial institutions (CDFIs), and mission-driven organizations use Lumecon to turn program and portfolio activity into economic evidence donors, boards, and funders recognize: jobs supported, wages generated, and local business activity, measured the same way each year. For CDFIs especially, it sizes the place-based impact of a lending portfolio across a county or neighborhood. It moves the annual report from anecdote to a defensible number. Is this for a program, a grant, or a donor report?",
    expanded: "For nonprofits and CDFIs: bring program budgets, grant disbursements, loan portfolios, or vendor spend, and Cedar maps them to the regional model so impact reads in jobs, labor income, and output rather than just dollars out the door. CDFIs use it to show the ripple of a lending portfolio for CDFI Fund reporting and investor decks; foundations and direct-service nonprofits use it for annual reports, major-donor asks, and grant applications. Because the methodology is attached, the number survives a skeptical board or a federal reviewer.",
  },
  {
    id: 'global_platform',
    chip: 'Does it work outside the US?',
    triggers: [
      'international', 'global', 'global economic impact', 'outside the us', 'outside the united states', 'other countries', 'overseas', 'cross border', 'cross-border', 'canada', 'mexico', 'europe', 'worldwide', 'non us', 'abroad', 'which countries', 'global platform',
    ],
    answer: "Today Lumecon covers the United States end to end — every county, state, tribal nation, and the national rollup. International coverage is the Global Economic Impact platform, which is on the roadmap rather than live: the engine and workflow are built to extend to other countries' national accounts as we add them. If you have a specific country or a cross-border project in mind, tell the team at contact@lumecon.ai and we'll say where it sits on the timeline.",
  },
  {
    id: 'tell_me_more',
    chip: 'Tell me more',
    triggers: [
      'tell me more', 'go deeper', 'more detail', 'more details', 'expand on that', 'expand on this', 'say more', 'keep going', 'continue', 'what else',
    ],
    answer: "Happy to keep going. To give you something specific instead of repeating myself, pick what's most useful: the methodology, the workflow, the pricing, the data we use, or a demo. You can also describe the problem you're trying to solve and I'll route us there.",
  },
  {
    id: 'thanks',
    chip: null,
    triggers: [
      'thanks', 'thank you', 'thx', 'ty', 'appreciate it', 'appreciated', 'cheers', 'much appreciated', 'thank u',
    ],
    answer: "You're welcome. Anything else I can help with, like pricing, geographies, a demo, or the workflow?",
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
  },
  {
    id: 'negative',
    chip: null,
    triggers: [
      'no', 'nope', 'not really', 'not yet', 'not now', 'maybe later',
    ],
    answer: "No problem. If something else is on your mind (methodology, geographies, a specific use case), say the word and we'll route there. Otherwise the contact form is here whenever you're ready.",
  },
  {
    id: 'confused',
    chip: null,
    triggers: [
      'help', "i'm confused", 'what should i ask', "i don't know where to start", 'guide me', 'not sure what i need', 'i just want to know more', 'where do i start',
    ],
    answer: "No problem. The easiest starting points are what Lumecon does, who uses it, how a study works, or what it costs. If you've got a specific project in mind like a grant, a bond, or an annual impact report, tell me about it and I'll point us at the right answer.",
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
    id: 'how_are_you',
    chip: null,
    triggers: [
      'how are you', 'how are u', 'how r u', 'how are ya', 'how is it going', "how's it going", 'hows it going', 'how are things', 'how do you do', 'how is your day', 'how have you been', 'how you doing', 'how ya doing', 'are you doing well', 'you doing ok', 'hope you are well', 'hope youre well', 'how is everything',
    ],
    answer: "Doing well, thanks for asking! I'm Cedar, and I'm happiest helping you get to know Lumecon. Want the quick version of what it does, who it's for (tribal nations, governments, foundations), or to watch a live impact study run?",
  },
  {
    id: 'greeting',
    chip: null,
    triggers: [
      'hi', 'hello', 'hey', 'yo', 'sup', 'howdy', 'good morning', 'good afternoon', 'good evening', 'cedar',
    ],
    answer: "Hey, I'm Cedar, Lumecon's site assistant. I can answer questions about what Lumecon does, who uses it, how the math works, what a study costs, or how to reach the team. What brings you in today?",
  },
];

// Catch-all responses for input that doesn't match any intent above.
export const OUT_OF_SCOPE_ANSWER =
  "I'm Cedar, Lumecon's site assistant, so I'm best at answering questions about Lumecon, economic impact reporting, and how to connect with the team. Try asking me what Lumecon does, who the platform is for, or how economic impact analysis works.";

export const FALLBACK_ANSWER =
  "I want to point you the right way — I'm a focused assistant, so I'm sharpest on Lumecon itself. I can cover what Lumecon does and who it's for (tribal nations, cities and counties, state agencies, foundations, universities, nonprofits), how a study works and how the math holds up, grants and federal funding (EDA, HUD, DOT, EPA, USDA, and more), pricing, geographies, jobs, or how to reach the team. Try a word or two — \"pricing,\" \"tribal,\" \"EPA grant,\" \"jobs,\" or \"demo\" — or email contact@lumecon.ai for anything specific.";

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
  'tribal_platform',
  'audience',
  'grant_applications',
  'pricing',
  'county_city_use',
  'state_agency_use',
  'time_to_study',
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
  'effects_explained',
  'geographies',
  'cedar_identity',
  'ai_vs_chatgpt',
  'where_built',
] as const;

export const STATIC_FAQ_QUESTIONS: Record<string, string> = {
  company_overview: 'What is Lumecon?',
  audience: 'Who uses Lumecon?',
  tribal_platform: 'How does Lumecon support tribal nations?',
  local_platform: 'Can cities, counties, and other organizations use Lumecon?',
  multipliers: 'What are economic multipliers?',
  effects_explained: 'What are direct, indirect, and induced economic effects?',
  geographies: 'What geographies does Lumecon cover?',
  cedar_identity: 'What is Cedar?',
  ai_vs_chatgpt: 'Is Cedar just ChatGPT, and can the AI be trusted?',
  where_built: 'Where was Lumecon built?',
};
