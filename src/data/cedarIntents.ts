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
  /** Curated related-question chips shown after this answer (intent ids,
   *  in priority order). They deepen the CURRENT topic instead of falling
   *  back to the generic demo/pricing/contact rail on every reply. Targets
   *  must be chip-bearing intents (their chip label becomes the button). */
  followUps?: string[];
}

export const INTENTS: CedarIntent[] = [
  {
    id: 'company_overview',
    followUps: ['compare_implan_workflow', 'pricing', 'examples'],
    chip: 'What is Lumecon?',
    triggers: [
      'what is lumecon', 'what does lumecon do', 'what does lumecon', 'explain lumecon', 'what is this company', 'what is this', 'what does this do', 'wat does this do', 'wat is this', 'what are you building', 'what is the platform', 'what is lumecon for', 'what problem', 'why does lumecon', 'what is the point of this site', 'this site', 'what are you selling', 'what do you sell', 'what are u sellin', 'sellin', 'tell me about lumecon', 'about lumecon', 'overview', 'what do you do', 'lumecon do', 'what yall do', 'what you guys do', 'what u guys do', 'wut is this', 'wut do you do', 'what this do', 'what u do', 'what do u do', 'what is all this', 'what this is',
    ],
    answer: "Short version: we help organizations show their economic impact without the months-long consulting engagement. You upload what you have, we harmonize it against the public data sources serious models rely on (ACS, BEA, LODES, QCEW), and you get a defensible study with every assumption surfaced. The same study drops into a council memo, a grant narrative, or a board deck.",
    expanded: "Going deeper: Lumecon sits between expensive software and expensive consulting. The existing platforms charge per geography, per user, per data tier; the consultants who actually run them charge by the billable hour. We collapse both into one flat annual subscription: unlimited studies, with every geography and data tier included. The engine itself does what serious input-output models always do (direct, indirect, induced, total impact), but it's wrapped in a workflow built for cloud, modern data, and AI from day one. Cedar handles the harmonization and surfaces every assumption so your team makes judgment calls instead of cleaning spreadsheets.",
  },
  {
    id: 'cedar_identity',
    followUps: ['company_overview', 'cedar_tiers', 'demo'],
    chip: 'What is Cedar?',
    triggers: [
      'what is cedar', 'who are you', 'are you the chatbot', 'are you a chatbot', 'are you a bot', 'what can cedar help', 'why are you called cedar', 'what does this assistant do', 'can you answer', 'are you ai', 'are you a real person', 'who is cedar', 'how can i use this chatbot', 'about cedar', 'what does cedar do', 'tell me about cedar', 'r u a bot', 'u a bot', 'are u a bot', 'r u real', 'u real', 'are u ai', 'r u ai', 'u a robot', 'are you a robot', 'is this a robot', 'is this automated', 'who r u', 'who are u', 'who u',
    ],
    answer: "I'm Cedar, Lumecon's assistant. Inside the platform I read your administrative files, harmonize them with public data, surface every modeling assumption, and write the source record. Here on the site I'm a lighter version: ask me what Lumecon does, who it's for, what a study costs, or how to reach the team. If I'm not the right tool for what you need, I'll say so and point you at someone who is.",
  },
  {
    id: 'audience',
    followUps: ['pricing', 'examples', 'demo'],
    chip: 'Who is Lumecon for?',
    triggers: [
      'who uses lumecon', 'who uses this', 'who uses it', 'who is this for', 'who is this platform for', 'who is lumecon for', 'who is the platform made for', 'what kinds of clients', 'what kind of clients', 'what types of clients', 'clients do you serve', 'who do you serve', 'who do you work with', 'is this for nonprofits', 'is this for universities', 'is this for foundations', 'is this for developers', 'is this for community', 'is this for me', 'target audience', 'who are your customers', 'who buys this', 'this for who', 'who this for', 'who this is for', 'who its for', 'who it for', 'this is for who', 'who can use this', 'who use this', 'who use it',
    ],
    answer: "Mostly governments, enterprises, and mission-driven organizations: tribal nations, state and local agencies, universities, foundations, ports, transit agencies, large nonprofits, and community development financial institutions. The common thread is they need to defend their numbers to a council, a board, or a funder, and they need that defense to hold up to scrutiny. We build Lumecon with these organizations, not just for them. Where do you sit?",
    expanded: "Breaking it down: tribal nations and tribal enterprises (gaming, energy, government services, cultural institutions) use the Tribal Economic Impact platform. Cities, counties, state DOTs, departments of commerce, workforce boards, and treasury offices use the Local Economic Impact platform, typically for capital project justification, grant rounds, bond measures, and annual impact reports. Universities use it for the community ripple of operations, research, construction, and student spending. Foundations use it to show donors and boards what grantmaking actually moved. Ports, airports, and transit agencies use it for capital plans. CDFIs and community lenders use it for portfolio-level place-based impact.",
  },
  {
    id: 'tribal_platform',
    followUps: ['data_sovereignty', 'grant_applications', 'pricing'],
    chip: 'Does this work for tribal nations?',
    triggers: [
      'tribal economic impact', 'tribal platform', 'tribal government', 'tribal nation', 'native nation', 'tribal enterprise', 'tribal gaming', 'tribes use this', 'is this made for native', 'help tribal', 'help tribes', 'help native', 'measure tribal', 'tribal grant', 'why do tribes need this', 'tribal',
      'tribe', 'tribes', 'native', 'native american', 'indigenous', 'casino', 'gaming', 'intertribal', 'tribal college', 'native cdfi', 'tero', 'self determination', 'reservation economy', 'indian country', 'off-reservation', 'off reservation', 'off-rez', 'county model', 'force us into a county', 'combine our enterprises', 'multiple enterprises', 'tribal-wide', 'enrolled members', 'work for tribe', 'works for tribe', 'for my tribe', 'help my tribe', 'good for tribes', 'tribe use this', 'this for tribes', 'we are a tribe', 'we a tribe',
    ],
    answer: "The Tribal Economic Impact platform is built specifically for tribal nations and tribal enterprises, and it handles the geographies the existing tools struggle with (reservations, off-reservation trust land, Alaska Native regional and village corporations, and Native Hawaiian Home Lands), is designed to respect tribal data sovereignty, and produces studies you can hand to a council, a federal funder, or a casino regulator. The resulting studies cover jobs, wages, supplier activity, and the regional ripple effects. Are you with a tribal nation or a tribal enterprise?",
    expanded: "Going deeper for tribal nations: the platform treats reservation and off-reservation trust land, Alaska Native Regional and Village Corporations, and Native Hawaiian Home Lands as first-class geographies, not edge cases the legacy tools force into county approximations. Data sovereignty is a design priority: a single-tenant workspace, you control what's uploaded and shared, your records are not used to train a shared model, and cross-study learning runs only on anonymized aggregates. Typical outputs are gaming and enterprise impact studies for a council or a federal funder (NIGC, BIA, Treasury), grant narratives, and annual reports showing jobs, wages, and the dollars kept in the regional economy.",
  },
  {
    id: 'local_platform',
    followUps: ['county_city_use', 'bond_measure', 'pricing'],
    chip: 'Can cities and counties use this?',
    triggers: [
      'local economic impact', 'local platform', 'cities use', 'counties use', 'city use', 'county use', 'local government', 'municipal', 'state agency', 'state agencies', 'public agency', 'public agencies', 'measure a project', "project's impact", 'project impact', 'local development', 'public investment', "i'm not a tribal", 'non-tribal', 'non tribal',
    ],
    answer: "Definitely. Cities, counties, state agencies, port and transit authorities, school districts, and special districts all use Lumecon for the same kinds of questions: what does this project, program, or bond actually do for the local economy, and how do we defend that number to a council, a board, or the public? Tell me what level you're at (city, county, state agency) and I can be more specific.",
    expanded: "Across local government: cities and counties use it for capital projects, bonds, TIF and abatement decisions, business attraction, and annual impact reports; state agencies (DOT, commerce, workforce, treasury, health) use it for capital programs, grant scoring, and budget defense; ports, transit, and special districts use it for capital plans and rate cases. It all runs on the same engine and the same public data, so a number you cite to a council holds up the same way in a grant application or a rating-agency meeting.",
  },
  {
    id: 'reports_outputs',
    followUps: ['examples', 'accuracy', 'demo'],
    chip: 'What kind of reports does it produce?',
    triggers: [
      'what reports', 'what report', 'pdf report', 'final output', 'output look like', 'create dashboards', 'dashboard', 'export the results', 'export', 'presentations', 'public meetings', 'board materials', 'board deck', 'slide deck', 'economic impact report', 'impact report', 'annual report', 'annual impact report', 'community impact report', 'donor report', 'one pager', 'one-pager', 'executive summary', 'what format', 'deliverables', 'what do you produce', 'what does it produce', 'report do you',
    ],
    answer: "Every study produces a full report PDF, an editable executive summary, the underlying tables and charts, and a slide-ready deck. The same study reshapes for the audience you're talking to: funders see the grant-ready jobs-and-investment narrative, councils see the local benefit framing, boards see the strategic context, public meetings see the plain-language version. The numbers are identical; only the framing changes. Who's the audience you need to win over?",
    expanded: "On the deliverables: every study exports a full report PDF, an editable executive summary, the underlying tables and charts as CSV, and a slide-ready deck. The numbers are identical across versions; only the framing shifts: funders see the jobs-and-investment narrative, councils see local benefit, boards see strategic context, public meetings get the plain-language version. Every figure carries its assumption ledger, so when someone challenges a number you trace it to the multiplier, base year, and data vintage behind it instead of defending a black box.",
  },
  {
    id: 'data_inputs',
    followUps: ['security', 'multipliers', 'onboarding'],
    chip: 'What data does it use?',
    triggers: [
      'what data', 'where does the data come', 'users upload data', 'upload my data', 'bring my own data', 'bring your own data', 'what inputs', 'what input', 'government data', 'public data', 'is the data credible', 'how do you calculate', 'what data sources', 'data sources', 'real economic data', 'income statement', 'profit and loss', 'p&l', 'balance sheet', 'cash flow', 'general ledger', 'chart of accounts', 'trial balance', 'ebitda', 'audited financials', 'financial statements', 'quickbooks',
    ],
    answer: "Your administrative records (budgets, payroll, program data, vendor spend) plus the public sources serious models rely on: ACS, BEA regional accounts, LODES, QCEW, County Business Patterns. We layer in alternative data where it helps (USASpending, the regional Fed banks, anonymized mobility, satellite land use) and our own proprietary signals built in-house: regional multipliers refined across thousands of past studies, plus methodology adjustments tuned by our data team. Don't worry if your data is messy or scattered across departments; the whole point of Cedar is to harmonize it for you. What does your data look like right now?",
    expanded: "More on data: you bring administrative records (budgets, payroll, program rosters, vendor and contract spend) in whatever shape they arrive (spreadsheets, PDFs, exports). Cedar matches them to NAICS codes, geographies, and time periods, flags anything ambiguous for you to confirm, and joins them to the public sources serious models rely on: ACS, BEA regional accounts, LODES, QCEW, and County Business Patterns, plus higher-frequency alternative signals where they sharpen the estimate. Messy and scattered-across-departments is the normal starting point, not a blocker.",
  },
  {
    id: 'multipliers',
    followUps: ['effects_explained', 'accuracy', 'data_inputs'],
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
    followUps: ['no_economist', 'onboarding', 'pricing'],
    chip: 'Is this software or consulting?',
    triggers: [
      'is lumecon software', 'is this consulting', 'are you a saas', 'is this saas', 'saas company', 'sell reports', 'platform or a service', 'platform or service', 'hire you to do the analysis', 'is this self-service', 'is this self service', 'need an economist', 'turbotax for impact', 'is this automated', 'software or service', 'better than a consultant', 'why not hire a consultant', 'instead of a consultant', 'vs a consultant', 'replace a consultant', 'do i still need a consultant',
    ],
    answer: "Lumecon is software, not consulting. The whole bet is that economic impact analysis should not be a months-long consulting engagement and should instead be something your team can run any time you need it. Cedar handles the data wrangling and the modeling while your team makes the judgment calls, and the Lumecon team will walk you through complex first-time studies or unusual data situations even though the steady state is your team using the platform without us in the loop. Does your team have an economist on staff?",
    expanded: "On software vs. consulting: the steady state is your team running studies in the platform whenever you need one, with no per-study fee and no waiting on an outside firm. You don't need an economist on staff; Cedar picks defaults matched to your geography and project type and explains each one in plain English for your sign-off. The Lumecon team is there for a first study, an unusual data situation, or a methodology-sensitive project, but the capability lives with you, not on a consultant's calendar.",
  },
  {
    id: 'pricing',
    followUps: ['roi_lumecon', 'team_access', 'demo'],
    chip: 'How much does it cost?',
    triggers: [
      'how much', 'what is the price', 'whats the price', 'pricing', 'what does it cost', 'what does this cost', 'whats the cost', 'how much is it', 'how much does it cost', 'cost of lumecon', 'subscription', 'do you have subscriptions', 'can i buy', 'how do i get access', 'become a customer', 'become a client', 'price tag', 'pricing page', 'how much cost', 'how much it cost', 'how much it costs', 'how much for', 'how much money', 'how much u charge', 'how much you charge', 'what you charge', 'what it cost', 'what it costs', 'cost money', 'wuts the price', 'how much $$$', 'how much $',
      // NOTE: bare 'price' removed (like 'cost') — it hijacked "purchaser
      // price", "price effects", and fuzzy "prices"->price into pricing.
      // NOTE: bare 'cost'/'costs'/'free'/'budget'/'afford' were removed on
      // purpose. As single-word triggers they hijacked "opportunity cost",
      // "benefit-cost", "indirect cost recovery", "cost to the city", and
      // "free trial" into pricing. Multi-word cost phrasings (above) and the
      // dedicated bca / fiscal_impact / roi intents catch those correctly.
      'expensive', 'how expensive', 'affordable', 'how affordable', 'is it affordable', 'quote', 'a quote', 'get a quote', 'tiers', 'what tiers', 'tier', 'plans', 'pricing plans', 'plan cost', 'per seat', 'per user', 'per study', 'annual cost', 'yearly cost', 'cost per year', 'license', 'license cost', 'is it free', 'is there a free tier', 'discount', 'discount code', 'promo code',
      // Price-objection phrasings (price-sensitive nonprofits / small orgs).
      'cheaper plan', 'cheapest plan', 'cheaper option', 'is there a cheaper', 'lowest tier', 'entry tier', 'tight budget', 'priced for governments', 'can we afford', 'too expensive for us', 'nonprofit discount',
    ],
    answer: "Pricing is five figures a year on a flat annual subscription that covers unlimited studies across every geography (reservation, county, state, and national). For comparison, the legacy stack is commonly cited at $50K to $150K per study and ships months later. The tiers are right on the pricing page (no call required), and we flex for size and use case, so reach out if your situation is unusual. Want me to break down what each tier includes?",
    expanded: "More on pricing: it's an annual subscription, not per-study or per-geography. Seats scale by tier (one on Sprout, up to five on Sapling, up to ten on Tree) with no per-use metering, and you can run as many studies as you want across reservations, counties, states, and national rollups. We work with selected pilot partners while the platform is early, which means pricing flexes for size and use case: a community foundation looks different from a state DOT looks different from a tribal gaming enterprise. The math we use under the hood is mainstream economics and the BEA accounts are public, so we're not charging you for the data; we're charging for the software that makes the analysis actually usable.",
  },
  {
    id: 'demo',
    followUps: ['examples', 'pricing', 'contact'],
    chip: 'Can I see a demo?',
    triggers: [
      'schedule a demo', 'want a demo', 'see a demo', 'see the demo', 'get a demo', 'demo of', 'a demo', 'see the product', 'see the platform', 'show me the platform', 'show me the product', 'is there a demo', 'can i try', 'try the platform', 'try lumecon', 'accepting pilots', 'pilot program', 'pilot partner', 'walkthrough', 'book a call', 'set up a call',
      'demo', 'trial', 'free trial', 'try it', 'try it out', 'test it', 'test drive', 'sandbox', 'poc', 'proof of concept', 'book a demo', 'request a demo', 'talk to sales', 'sales call', 'see it in action', 'live demo', 'you have demo', 'you got a demo', 'wanna demo', 'wanna see it', 'lemme see it', 'can i get a demo', 'gimme a demo', 'show me it', 'show me how it works', 'want demo', 'can i see it',
    ],
    answer: "Happy to set one up. The easiest path is the contact form on this site or contact@lumecon.ai with three things included up front: who you are, the kind of impact you want to measure, and any timeline you are working with. The demo runs in your geography against a study scenario relevant to your work, so the two minutes spent giving us that context up front pays off quickly. What kind of impact are you hoping to measure?",
    expanded: "What a demo looks like: tell us your geography and the kind of impact you want to show, and we run a study in your region against a relevant scenario, walking through how Cedar harmonizes inputs, surfaces assumptions, and produces the report. It's concrete, not a slideshow; you see your own use case. Fastest path is the contact form or contact@lumecon.ai with who you are, what you want to measure, and any timeline. If there's a grant or council deadline, say so and we'll move to fit it.",
  },
  {
    id: 'contact',
    chip: 'How do I contact you?',
    triggers: [
      'how do i contact', 'contact you', 'who should i email', 'i want to talk', 'speak with the founder', 'speak to the founder', 'reach lumecon', 'reach the team', 'reach out', 'get in touch', 'send an email', 'email lumecon', 'phone number',
      'contact', 'email', 'email address', 'call', 'call you', 'phone', 'talk to someone', 'speak to someone', 'talk to a human', 'speak to a human', 'talk to a person', 'speak to a person', 'real person', 'real human', 'live person', 'live agent', 'support', 'customer support', 'who do i talk to', 'get a hold of', 'connect with you', 'how to reach', 'how reach you', 'how i contact', 'how contact you', 'how to contact', 'hmu', 'holler at', 'holla at', 'reach a person',
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
    answer: "We are a six-person team bringing on early teammates and interns across software engineering, machine learning, data, economic impact modeling, marketing, and sales. These are early-stage, learning-focused roles, and we mentor people who are persistent. The /join page has the full breakdown and the current details on each role, or you can email contact@lumecon.ai with a résumé and a paragraph on what draws you to the work.",
  },
  {
    id: 'technical',
    chip: 'Tech stack and integrations?',
    triggers: [
      'tech stack', 'technology stack', 'do you have an api', 'have an api', 'api', 'rest api', 'api access', 'integrate with my system', 'integrate with our', 'integration', 'integrations', 'erp', 'gis', 'data warehouse', 'snowflake', 'webhook', 'upload spreadsheet', 'upload spreadsheets', 'connect to external', 'external database', 'multiple people', 'support teams', 'team account', 'export api',
    ],
    answer: 'Lumecon is being designed as a modern web platform with support for structured data, guided workflows, and organization-level use. Some technical features may depend on the stage of the platform and the needs of pilot users. For integrations, team access, uploads, or API questions, the best next step is to contact the Lumecon team directly.',
  },
  {
    id: 'security',
    followUps: ['data_sovereignty', 'data_residency', 'contact'],
    chip: 'Is my data safe?',
    triggers: [
      'is my data safe', 'is my info safe', 'my info safe', 'info safe', 'my information safe', 'data privacy', 'data security', 'happens to uploaded data', 'do you sell data', 'is this confidential', 'confidential', 'upload sensitive', 'sensitive information', 'protect client data', 'protect data', 'secure enough for governments', 'tribal data', 'how do you protect', 'pii', 'personally identifiable', 'handle pii', 'federal reserve experience', 'government data',
    ],
    answer: "Lumecon is built so each organization gets a single-tenant workspace with encryption in transit and at rest, role-based access controls, and US-region cloud. The team handled PII and sensitive government data at the Federal Reserve Banks of Minneapolis and Philadelphia and at the Federal Reserve Board, so production-grade data handling is not a learning curve for us. For tribal data, the approach is designed so your data stays your data, the audit trail is complete, and your records are not used to train a shared model. We are happy to confirm the specifics before anything sensitive moves.",
  },
  {
    id: 'accuracy',
    followUps: ['ai_vs_chatgpt', 'competitors', 'examples'],
    chip: 'How credible are the numbers?',
    triggers: [
      'how accurate', 'can i trust the numbers', 'trust the numbers', 'peer reviewed', 'peer review', 'defensible', 'defensible methodology', 'someone challenges', 'used publicly', 'used for grants', 'use for grants', 'with policymakers', 'credibility', 'how credible', 'credible enough', 'are the numbers', 'does cedar hallucinate', 'hallucinate', 'hallucination', 'rag', 'retrieval augmented', 'make stuff up', 'black box', 'is it a black box', 'can the council see', 'show the assumptions', 'see the assumptions', 'defend to council', 'defend to the board', 'defend it to council', 'hold up to scrutiny', 'stand up to scrutiny', 'county commission', 'federal reviewer', 'will reviewers accept', 'documentation for funder', 'audit trail', 'stand up to our board',
    ],
    answer: "Three things are designed to keep the numbers defensible. Direct, indirect, induced, and total impact figures are benchmarked against established RIMS II and IMPLAN-style results, so they line up with what a reviewer would expect. Cedar is RAG-based, so answers come from the actual data and source record rather than a model guess. And every assumption (multiplier choice, regional bridge, base year, scaling rules) is surfaced and citable in the report, so a reviewer can trace any number back to where it came from.",
    expanded: "More on how this stays defensible: data provenance is per-row, so when a study cites a BEA multiplier for NAICS 23 in your county, you can click through to the source table and vintage. Assumptions are versioned with the study, so changing the regional purchase coefficient preserves the prior run in the audit trail. Cedar's reasoning steps are logged alongside the numbers, so if anyone asks why we picked a particular industry bridge or wage assumption, the answer is in the report, not in someone's email. We would rather a reviewer challenge a specific number than wave away the whole approach, so the methodology behind any figure is available for review.",
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
    followUps: ['compare_implan_workflow', 'accuracy', 'pricing'],
    chip: 'How is this different from IMPLAN / RIMS / Lightcast?',
    triggers: [
      'is this like implan', 'compete with implan', 'better than implan', 'like rims', 'rims ii', 'rims 2', 'is this like lightcast', 'like emsi', 'like remi', 'replacing economists', 'why not just use implan', 'makes this different', 'how is this different', 'implan alternative', 'compared to implan',
      'implan', 'rims', 'lightcast', 'emsi', 'remi', 'competitor', 'competitors', 'alternative to', 'vs implan', 'instead of implan', 'difference', 'how are you different', 'what sets you apart', 'why you',
    ],
    answer: "Same underlying economics (input-output modeling, regional multipliers, base-year reweighting). That's the mainstream stuff and the BEA accounts behind it are public. Our multipliers come from the BEA make-and-use tables, regionalized to your geography and benchmarked against RIMS II and IMPLAN-style results, not numbers we invent. What's been missing is software built with the tools that exist today: cloud infrastructure, modern UI, RAG-based AI, real-time data feeds, and geographies that aren't trapped inside administrative borders. We benchmark our direct, indirect, induced, and total impact figures against established results, update the assumptions and data that should be updated, and keep what shouldn't. Are you comparing us against a specific tool?",
    expanded: "Concretely, what's different: pricing structure (flat annual vs. per-geography per-user per-tier), workflow (Cedar harmonizes inputs in minutes rather than analysts hand-cleaning for weeks), geographies (reservations, off-reservation trust land, Alaska Native regional corporations, Native Hawaiian Home Lands all first-class, not edge cases), data freshness (high-frequency public feeds plus our own proprietary signals layered on the same BEA accounts), and audit trail (every assumption surfaced and citable). What's the same: the math. We benchmark our direct, indirect, induced, and total impact figures against the existing platforms before any study ships, so a reviewer familiar with the legacy tools recognizes the numbers.",
  },
  {
    id: 'explain_simple',
    chip: 'Explain economic impact like I am five',
    triggers: [
      'explain like', 'eli5', "i'm five", 'like i am five', 'im five', 'like im five', 'explain it like im five', 'what is economic impact', 'whats economic impact', 'what is economic impact mean', 'economic impact means', 'what economic impact means', 'why does economic impact matter', 'what does this actually mean', 'why should i care', "what's an example", 'whats an example', 'give me an example', 'in simple terms', 'in plain english', 'in plain words', 'plain language', 'dumb it down', 'keep it simple', 'make it simple', 'explain it simple', 'explain simply', 'simple explanation', 'normal words',
    ],
    answer: "Picture a new community college campus opening. The construction crew gets paid (direct). Those workers buy lunch nearby, and the campus orders supplies from a regional vendor (indirect). The vendor pays its staff, who spend on rent, groceries, kids' soccer, the dentist (induced). Add all that up and you have the total economic impact: the campus, plus the ripple. That's the story Lumecon tells, with the math defensible and every assumption visible.",
  },
  {
    id: 'geographies',
    followUps: ['tribal_platform', 'examples', 'pricing'],
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
      'historical', 'longitudinal', 'forward looking', 'forward-looking', 'project forward', 'model forward', 'multi year', 'multi-year', 'multi-year projection', 'multiyear', 'forecast', 'out year', 'out-year', 'biennium', 'biennial', 'plan a budget', 'capital project', 'grant proposal', 'budget proposal', 'over time', 'years out', 'long term impact', 'past impact', 'future impact', 'project into the future', 'scenario analysis', 'sensitivity analysis', 'what if', 'what-if', 'run scenarios', 'baseline scenario', 'pro forma projection',
    ],
    answer: "Lumecon supports both directions. You can look back to tell the story of what has already happened through annual impact reports and longitudinal studies, or model forward to plan a budget, grant ask, or capital project. The same data and methodology work either way and only the framing changes, and studies sharpen over time as more of your data accumulates in the workspace.",
  },
  {
    id: 'where_built',
    followUps: ['company_overview', 'accuracy', 'contact'],
    chip: 'Where was Lumecon built?',
    triggers: [
      'where was lumecon built', 'where is lumecon based', 'where is lumecon from', "lumecon's background", 'team background', 'who built lumecon', 'who founded', 'founded by', 'cornell', 'team experience', 'who is on the team', 'who is behind',
    ],
    answer: "Built at Ivy League and peer schools: Cornell, Dartmouth, Oxford, MIT, and Yale across the team's academic background, with counsel from the Cornell Law Entrepreneurship Law Clinic. Prior professional experience includes the Federal Reserve Banks of Minneapolis and Philadelphia and the Federal Reserve Board of Governors in Washington, DC, which is where we learned what serious data handling and economic analysis are supposed to look like.",
  },
  {
    id: 'grant_applications',
    followUps: ['time_to_study', 'reports_outputs', 'demo'],
    chip: 'Can it support grant applications?',
    triggers: [
      'grant application', 'grant applications', 'federal grant', 'eda grant', 'hud grant', 'dot grant', 'epa grant', 'usda grant', 'cdbg', 'bil', 'bipartisan infrastructure law', 'rural development grant', 'broadband grant', 'workforce grant', 'arc grant', 'narrative for a grant', 'grant narrative', 'job estimates for a grant', 'private investment estimate', 'show economic benefit',
      'grant', 'grants', 'funding', 'federal funding', 'apply for funding', 'apply for a grant', 'grant program', 'grant deadline', 'match requirement', 'leverage ratio', 'benefit cost', 'benefit-cost', 'bca',
      'epa', 'hud', 'dot', 'eda', 'usda', 'ntia', 'arc', 'sba', 'hrsa', 'doe', 'fema', 'hhs', 'bia', 'noaa', 'nsf', 'build', 'raise', 'ira', 'inflation reduction act', 'iija', 'infrastructure law', 'arpa', 'american rescue plan',
      'bead', 'broadband equity', 'cdbg-dr', 'cdbg dr', 'fta', '5311', 'section 5311', '5307', 'section 5307', 'transit funding', 'raise grant', 'build grant', 'public works', 'eda public works', 'lmi', 'low to moderate income', 'low-to-moderate income', 'leveraged private investment', 'leveraged investment',
      'ss4a', 'safe streets', 'safe streets and roads', 'bric', 'building resilient', 'nofo', 'notice of funding', 'community facilities', 'reconnect', 'nmtc', 'new markets tax credit', 'letter of support', 'write the narrative', 'draft the narrative', 'narrative for me', 'national objective',
    ],
    answer: "Grant applications are one of the most common uses of Lumecon. Most federal and state grant programs (EDA, HUD CDBG, DOT BUILD, USDA Rural Development, EPA, NTIA broadband, and ARC) want applicants to estimate jobs, private investment, or regional benefit with a credible source behind the numbers. Lumecon produces the jobs, labor income, and tax-impact figures with the methodology attached, so the same study drops into the grant narrative, the council packet, and the board memo without any rework. Which grant program are you aiming at?",
    expanded: "More on grants: most programs want a credible, sourced estimate of jobs, private investment, or regional benefit, and Lumecon produces exactly that with the methodology attached so a reviewer can trace every figure. EDA wants jobs and leveraged private investment; HUD CDBG wants low-to-moderate-income benefit; DOT BUILD/RAISE wants benefit-cost framing; USDA Rural Development and NTIA broadband want jobs and output; ARC wants distress-area impact. The same study exports to the narrative, the budget justification, and the council packet, so you build the numbers once instead of rebuilding them per reviewer.",
  },
  {
    id: 'time_to_study',
    followUps: ['onboarding', 'demo', 'pricing'],
    chip: 'How long does a study take?',
    triggers: [
      'how long does it take', 'how long does a study take', 'how long does a study', 'how long does the study', 'how long to produce', 'how long is a study', 'study take', 'turnaround', 'turn around time', 'turnaround time', 'turn a study around', 'how fast can you', 'study timeline', 'project timeline', 'lead time', 'how quickly', 'in time for our board', 'before our deadline', 'before grant deadline', 'council vote', 'before our council vote', 'before the vote', 'board meeting', 'by next meeting', 'by our next meeting', 'rush', 'quick turnaround', 'how soon', 'fast turnaround', 'how fast', 'how quick', 'take long', 'how long it take', 'how long take', 'how long will it take', 'is it quick',
    ],
    answer: "A standard study takes minutes once the data is in. The legacy path takes months because the analyst is harmonizing data by hand and re-running scenarios from scratch every time, while Cedar does the harmonization in minutes so the slow part becomes the judgment calls (which assumptions to surface, which scenario to model) rather than the spreadsheet work. Are you working against a deadline?",
    expanded: "Why it's minutes, not months: the legacy timeline is dominated by an analyst hand-cleaning data and re-keying it into a tool whose workflow predates the internet, then re-running from scratch for each scenario. Cedar harmonizes and pre-fits the model the moment your data lands, so the only human time left is judgment: which assumptions to surface, which scenario to model, what to override. The first defensible study comes back the same session the data's in; revisions are a re-run, not a re-engagement. Against a council vote or grant deadline, that's the difference between making it and missing it.",
  },
  {
    id: 'no_economist',
    followUps: ['onboarding', 'demo', 'software_vs_consulting'],
    chip: "We don't have an economist on staff",
    triggers: [
      "don't have an economist", 'no economist', 'not an economist', 'not a data scientist', 'not technical', 'we are not analysts', 'small team', 'limited capacity', 'tight staffing', 'capacity constrained', 'who runs the analysis', 'do i need to know economics', 'normal person', 'can a normal person', 'someone like me', 'for someone like me', 'do i need to be smart', 'not an expert', 'no expertise',
    ],
    answer: "You don't need one. Most organizations using Lumecon don't have an economist on staff, and that's exactly who the platform is built for. Cedar walks you through the data, picks defaults that match the geography and project type, and flags every assumption in plain English before the study is finalized. Your team makes the judgment calls; the platform handles the modeling. For unusual or methodology-sensitive projects, the Lumecon team is one email away.",
  },
  {
    id: 'state_agency_use',
    followUps: ['grant_applications', 'reports_outputs', 'pricing'],
    chip: 'How do state agencies use it?',
    triggers: [
      'state department of', 'state dot', 'state doc', 'state commerce', 'state treasury', 'state agency use case', 'state agency uses', 'department of commerce', 'department of transportation', 'state legislature', 'state budget office', 'state workforce board', 'state health department', 'how do states use', 'defend an appropriation', 'appropriations defense', 'appropriations request', 'legislative scrutiny', 'fiscal note', 'budget hearing', 'testify to the legislature', 'testify', 'legislative session', 'legislative ask', 'budget defense',
    ],
    answer: "State DOTs, departments of commerce, workforce boards, treasury offices, and health departments use Lumecon to justify capital programs, score grant rounds, defend budget asks at the legislature, and produce annual impact reports. Typical artifacts: a defensible jobs / labor income / GDP figure for a capital plan, a multi-year impact narrative for a workforce program, a regional benefit comparison across counties for a competitive grant. Same engine, different reports. Which agency are you with?",
    expanded: "By agency: a state DOT models capital-program and corridor impact for the legislature and federal applications; a department of commerce scores grant rounds and incentive deals on equal footing; a workforce board shows the multi-year return on training programs; a treasury or budget office defends appropriations with jobs and GDP figures; a health department sizes the economic footprint of facilities and programs. Each gets the same direct, indirect, induced, and total figures with the assumption ledger attached, reshaped into the artifact that office actually presents.",
  },
  {
    id: 'county_city_use',
    followUps: ['bond_measure', 'grant_applications', 'pricing'],
    chip: 'How do cities and counties use it?',
    triggers: [
      'city manager', 'city use case', 'city uses', 'county use case', 'county uses', 'edo', 'economic development director', 'economic development office', 'chamber of commerce', 'mayor', 'council member', 'school district', 'school districts', 'work with school', 'school bond', 'special district', 'special districts', 'how do cities use', 'how do counties use', 'annual community impact',
    ],
    answer: "Cities and counties use Lumecon for capital project justification (fire station, library, transit line, parks), TIF and tax-abatement evaluation, school-district bond communication, business-attraction packages, and annual community impact reports. EDOs especially use it to compare projects on equal footing and to put concrete numbers behind a recruitment pitch or an incentive ask, the kind of analysis that used to require an outside consultant per project. Are you on the city or county side?",
    expanded: "In practice for cities and counties: the common studies are capital-project justification (a fire station, library, transit line, or parks bond), TIF and tax-abatement evaluation, business-attraction and incentive analysis, and the annual community impact report. Economic development offices use it to compare projects on equal footing and to put a defensible number behind a recruitment pitch. The output reshapes for the audience (council resolution, voter pamphlet, rating-agency deck) off one run, so the analysis that used to mean a consultant per project now lives in your workspace.",
  },
  {
    id: 'foundation_use',
    followUps: ['reports_outputs', 'accuracy', 'pricing'],
    chip: 'How do foundations use it?',
    triggers: [
      'foundation use case', 'how do foundations use', 'foundation report', 'philanthropy', 'philanthropic', 'grantmaker', 'grantmaking', 'community foundation', 'private foundation', 'family foundation', 'measure our giving', 'measure giving', 'our giving', 'measure grantmaking', 'donor report', 'place-based', 'place based', 'portfolio impact', 'portfolio-level', 'grantee outcomes', 'grantee', 'same way every year', 'year over year', 'show donors', 'show our board',
    ],
    answer: "Foundations and community grantmakers use Lumecon to show donors and boards what their dollars actually moved: jobs supported, wages generated, local business activity, regional ripple effects. The annual report stops reading as anecdote and starts reading as evidence. Community foundations especially use it for place-based portfolios: the dollars invested in a county or a neighborhood, with the economic ripple measured the same way every year.",
  },
  {
    id: 'bond_measure',
    followUps: ['county_city_use', 'examples', 'time_to_study'],
    chip: 'Can we use it for a bond measure?',
    triggers: [
      'bond measure', 'school bond', 'municipal bond', 'infrastructure bond', 'general obligation bond', 'go bond', 'voter bond', 'capital bond', 'bond campaign', 'bond election', 'parks bond', 'transit bond',
    ],
    answer: "School districts, transit agencies, parks departments, and municipalities use Lumecon to translate a bond program into the local economic impact that voters and oversight boards can recognize, including construction jobs, multi-year labor income, supplier spend kept in-region, and operating impact once the asset is in service. The output drops into voter information pamphlets, council resolutions, and rating-agency conversations, and the same study supports the rating-agency presentation and the community town hall.",
  },
  {
    id: 'compare_implan_workflow',
    followUps: ['time_to_study', 'onboarding', 'demo'],
    chip: 'How is the workflow different?',
    triggers: [
      'workflow', 'day to day', 'in practice', 'what does the work look like', 'what does the workflow', 'how is the workflow', 'how does the work flow', 'replacing my consultant', 'replacing consultants', 'replace consultant',
      'how does it work', 'how does lumecon work', 'how it works', 'how does this work', 'how do studies work', 'walk me through', 'how do i use it', 'how do i use this', 'how do you use it', 'how do you use this', 'how to use this', 'how to use it', 'what are the steps', 'the process', 'how this work', 'how it work', 'how do this work', 'how this works', 'how u do it', 'how you do it', 'how does it all work', 'how all this work',
    ],
    answer: "On the legacy path, a consultant or analyst opens the existing platforms (software whose workflow predates the internet), hand-cleans the data, picks the multipliers, writes the report, and comes back months later. On the Lumecon path, you drop your administrative data into the workspace, Cedar harmonizes and pre-fits the model, you review the assumptions Cedar surfaces (with direct, indirect, induced, and total impact benchmarked against established results), approve or adjust each one, and export the report. The economist's judgment stays in the loop, but the data wrangling and re-runs do not, so what used to take months takes minutes.",
    expanded: "Step by step in the Lumecon workflow: (1) upload the records you already have (budgets, payroll, vendor lists, program data). (2) Cedar matches them against NAICS codes, geographies, time periods, and surfaces anything ambiguous for you to confirm. (3) Cedar pre-fits the impact model with defaults tuned to your geography and project type, and lists every assumption inline. (4) Your team reviews, adjusts, and approves. (5) Run the study; numbers come back in minutes with the audit trail attached. (6) Export the deliverables (full report, executive summary, slide deck, tables), each tuned to the audience. The judgment calls that used to live in a senior analyst's head are now visible in the report.",
  },
  {
    id: 'roi_lumecon',
    followUps: ['pricing', 'software_vs_consulting', 'demo'],
    chip: 'What does Lumecon cost vs. the alternative?',
    triggers: [
      'cost vs', 'vs hiring a consultant', 'cheaper than a consultant', 'roi', 'roi of', 'return on investment', 'return on lumecon', 'is this worth it', 'is it worth it', 'worth the money', 'why pay for this', 'why subscribe', 'cost of doing nothing', 'budget for impact', 'price compared to', 'savings vs', 'payback', 'payback period', 'cost savings', 'total cost of ownership', 'tco', 'switching cost', 'build vs buy', 'build versus buy', 'sunk cost', 'breakeven', 'break even', 'opex', 'capex', 'operating expense', 'capital expense', 'vendor consolidation',
    ],
    answer: "A single legacy impact study is commonly cited in the $50K to $150K range and ships months later. Lumecon is five figures a year for unlimited studies across every geography. The legacy price tag is what a workflow looks like after forty years of one toolchain owning the category; it's not a measure of how hard the work actually is. The math is mainstream economics; the BEA accounts behind it are public and free. In practice it tends to pay for itself within a study or two, after which the subscription is producing analyses the organization could not have afforded one-off.",
  },
  {
    id: 'data_residency',
    chip: 'Where is the data hosted?',
    triggers: [
      'where is the data hosted', 'where is it hosted', 'data residency', 'data location', 'where do you store', 'where is my data', 'hosting', 'aws', 'cloud provider', 'us cloud', 'us only', 'us region', 'govcloud', 'storage location', 'data center', 'what region',
    ],
    answer: "Lumecon runs on US-region cloud, with a single-tenant workspace per organization, encryption in transit and at rest, and role-based access controls. For pilots with sensitive procurement or compliance requirements (FedRAMP, HIPAA-adjacent, state PIIA, tribal data sovereignty), we'll walk through the specifics before any data leaves your environment. If you need a specific compliance posture or region, say so up front and we'll tell you whether it's something we already cover or something we'll need to scope.",
  },
  {
    id: 'onboarding',
    followUps: ['time_to_study', 'data_inputs', 'demo'],
    chip: 'How does onboarding work?',
    triggers: [
      'how do i get started', 'how do we get started', 'onboarding', 'onboard', 'getting started', 'first study', 'first project', 'kick off', 'kickoff', 'how does setup work', 'how long is setup', 'training',
    ],
    answer: "Short kick-off call to scope the first study, then your team uploads the data you already have (budgets, payroll, program records, vendor lists). Cedar walks you through harmonization and surfaces every assumption before the first study runs. First defensible study comes back in minutes once the data's in. We usually do the first one alongside you so you see how the workspace handles your data, then your team takes the reins.",
  },
  {
    id: 'effects_explained',
    followUps: ['multipliers', 'accuracy', 'examples'],
    chip: 'Direct, indirect, induced?',
    triggers: [
      'direct indirect induced', 'direct indirect and induced', 'direct effect', 'indirect effect', 'induced effect', 'three effects', 'difference between direct and indirect', 'what is total impact', 'spillover effect', 'output effect', 'what do the numbers mean', 'double counting', 'double-counting', 'count twice', 'counted twice',
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
    followUps: ['accuracy', 'security', 'cedar_tiers'],
    chip: 'Is Cedar just ChatGPT?',
    triggers: [
      'just chatgpt', 'is this chatgpt', 'is cedar chatgpt', 'is it gpt', 'use gpt', 'use openai', 'is it a large language model', 'does the ai make up', 'does it make up numbers', 'made up numbers', 'is the ai reliable', 'ai trustworthy', 'generative ai', 'is cedar generative',
    ],
    answer: "No. Cedar is grounded (RAG-based) in your actual files and established economic data, not free-typing answers like a general chatbot. It does the data wrangling, surfaces every assumption for your sign-off, and writes the audit trail; it does not invent the numbers. The economic math is mainstream input-output modeling benchmarked against the legacy platforms, and a person approves each assumption before a study ships. The AI speeds the work without taking over the judgment.",
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
    followUps: ['accuracy', 'pricing', 'demo'],
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
    followUps: ['security', 'tribal_platform', 'contact'],
    chip: 'Do you respect data sovereignty?',
    triggers: [
      'data sovereignty', 'indigenous data sovereignty', 'tribal data sovereignty', 'who owns the data', 'data ownership', 'own our data', 'care principles', 'ocap', 'data governance', 'own my data', 'keep our data', 'enrolled members data', 'train on our data', 'train on my data', 'train your models', 'use our data to train', 'sell our data', 'do you sell our data', 'syndicate', 'who can see our data', 'data stays ours', 'will you sell our data',
    ],
    answer: "Yes. Indigenous data sovereignty is a design priority for the Tribal platform from the start, not an afterthought. Your data stays yours: a single-tenant workspace, you control what's uploaded and shared, and we do not sell, syndicate, or use your raw records to train models. Cross-study learning runs only on anonymized, aggregated signals. For specific governance frameworks (CARE, OCAP) or council requirements, we'll walk through the specifics before any data moves.",
  },
  {
    id: 'jobs_employment',
    followUps: ['effects_explained', 'grant_applications', 'examples'],
    chip: 'How does it report jobs?',
    triggers: [
      'jobs', 'job creation', 'jobs created', 'employment', 'employment impact', 'how many jobs', 'labor income', 'wages', 'payroll impact', 'fte', 'full time equivalent', 'jobs supported', 'direct jobs', 'job numbers', 'employment effect', 'how many positions',
    ],
    answer: "Jobs are usually the headline. Every study breaks employment into direct, indirect, and induced jobs plus the total, alongside labor income (wages) and output, so you can say not just how many jobs but where they land and what they pay. The figures come out in the units funders and councils expect (FTEs, annual labor income, tax impact), each with the multiplier and base year behind it citable in the report. Want the breakdown of how those job numbers are built, or which grant programs ask for them?",
    expanded: "How the job numbers are built: direct jobs are the positions the project funds outright (construction crews, operating staff); indirect jobs sit at the suppliers those dollars flow to; induced jobs come from workers spending wages locally: the grocery clerk, the dentist, the landlord. Each layer is driven by industry-specific employment multipliers and the regional purchase coefficients that decide how much stays in-region, so a labor-intensive program shows more jobs per dollar than a capital-heavy one. We report FTEs and annual labor income, not just headcount, because that's what EDA, HUD, and DOT scoring actually want.",
  },
  {
    id: 'university_use',
    followUps: ['reports_outputs', 'pricing', 'demo'],
    chip: 'How do universities use it?',
    triggers: [
      'university', 'universities', 'college', 'colleges', 'higher ed', 'higher education', 'campus', 'student spending', 'visitor spending', 'research university', 'college town', 'institutional impact', 'university impact', 'land grant', 'town gown', 'town-gown', 'dorm', 'dormitory', 'new building', 'campus construction', 'campus capital project', 'teaching hospital', 'medical center', 'student spend',
    ],
    answer: "Universities and colleges use Lumecon to size the community ripple of operations, research, construction, and student and visitor spending, the number a president cites to the legislature, a board, or the town. It separates the campus's direct footprint (payroll, procurement, capital projects) from the indirect and induced activity it drives across the region, so the figure holds up when a skeptic asks how much is really local. Are you looking at operations, a capital project, or the whole institution?",
    expanded: "For higher ed specifically: operating impact covers payroll, local procurement, and facilities; research impact covers grant-funded activity and spinoffs; construction impact covers capital projects year by year; and student and visitor spending captures off-campus housing, retail, and events. Each rolls up to a total regional impact with jobs and labor income, for one campus or a whole system. The same study reshapes for an accreditation report, a legislative ask, a bond, or a town-gown briefing: one analysis serving several audiences.",
  },
  {
    id: 'nonprofit_use',
    followUps: ['reports_outputs', 'grant_applications', 'pricing'],
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
      'international', 'global economic impact', 'global platform', 'outside the us', 'outside the united states', 'other countries', 'another country', 'overseas', 'cross border', 'cross-border', 'worldwide', 'non us', 'work abroad', 'which countries do you', 'do you cover canada', 'do you cover mexico', 'do you cover europe', 'do you support international',
    ],
    answer: "Today Lumecon covers the United States end to end: every county, state, tribal nation, and the national rollup. International coverage is the Global Economic Impact platform, which is on the roadmap rather than live: the engine and workflow are built to extend to other countries' national accounts as we add them. If you have a specific country or a cross-border project in mind, tell the team at contact@lumecon.ai and we'll say where it sits on the timeline.",
  },
  /* ===== Depth pack: niche, vocabulary-specific intents surfaced by a
     panel of buyer-persona tests. All chip:null (reachable via free-text,
     kept off the curated starter rail) except the free-vs-paid upsell.
     They use multi-word triggers so they outscore generic single-word
     matches without needing to win on declaration order. ===== */

  /* --- Tribal --- */
  {
    id: 'trust_land',
    chip: null,
    triggers: [
      'trust land', 'off-reservation trust land', 'off reservation trust land', 'fee land', 'restricted fee', 'allotment', 'allotted land', 'checkerboard', 'checkerboarded', 'does it force us into a county', 'indian country geography', 'indian country',
    ],
    answer: "Trust land is a first-class geography in the Tribal platform, not an afterthought. Reservation land, off-reservation trust parcels, restricted-fee and allotted land, Alaska Native Regional and Village Corporation lands, and Native Hawaiian Home Lands are all modeled directly, so a study reflects where activity actually happens instead of being flattened into a surrounding county. If your lands are checkerboarded across county lines, the study still treats them as one geography. Want to walk through your specific land base with the team?",
  },
  {
    id: 'per_cap',
    chip: null,
    triggers: [
      'per-cap', 'per cap', 'per capita', 'per capita distribution', 'per capita payment', 'gaming revenue allocation', 'revenue sharing', 'rstf', 'member distributions', 'revenue allocation',
    ],
    answer: "Per-capita distributions and gaming-revenue allocations can be reflected in a study as part of how revenue flows into the local economy, since member spending is itself an economic channel. Cedar keeps those flows separate and labeled so a council or a regulator can see exactly how they were treated. How distributions are handled depends on your data, so this is a good one to scope with the team before a study runs.",
  },
  {
    id: 'tribal_federal_reporting',
    chip: null,
    triggers: [
      '638 contract', '638', 'self governance', 'self-governance', 'bia reporting', 'nigc report', 'nigc reporting', 'treasury report', 'compact reporting', 'federal trust reporting', 'self determination contract',
    ],
    answer: "Lumecon produces the jobs, wages, supplier-activity, and regional-impact figures that federal and trust reporting tends to ask for, with the methodology attached so the numbers hold up with BIA, Treasury, NIGC, or a compact partner. The same study reshapes into a council packet, a federal report, and an annual report without rebuilding the math. Which program or report are you preparing for?",
  },

  /* --- Local government / EDO --- */
  {
    id: 'tif_abatement',
    chip: null,
    triggers: [
      'tif', 'tax increment', 'tax increment financing', 'abatement', 'tax abatement', 'but-for', 'but for analysis', 'worth the incentive', 'is the incentive worth it', 'incentive justification',
    ],
    answer: "Cities and counties use Lumecon to evaluate TIF districts and tax-abatement requests: model the jobs, wages, and supplier activity a project would generate, then weigh that against the incentive on the table so a but-for case rests on defensible numbers rather than a developer's projection. Every assumption is surfaced, so when the request reaches council you can show your work. Want to see it run on a project you are weighing?",
  },
  {
    id: 'fiscal_impact',
    chip: null,
    triggers: [
      'fiscal impact', 'tax revenue', 'net fiscal', 'cost to the city', 'cost to the county', 'revenue vs cost', 'will it pay for itself', 'net new revenue', 'revenue impact', 'fiscal analysis', 'tax base', 'assessed value', 'millage', 'mill levy', 'debt service', 'bonding capacity', 'revenue bond', 'property tax', 'sales tax revenue', 'general fund',
    ],
    answer: "Economic impact (jobs, wages, and output across a region) and fiscal impact (the revenue and cost to one specific government) are related but distinct, and Lumecon is built around the economic-impact side with the supporting detail a fiscal analysis draws on. For a straight tax-revenue or net-fiscal question tied to your budget, tell the team your jurisdiction and project and they will walk through what the platform covers and where it stops.",
  },
  {
    id: 'business_attraction',
    chip: null,
    triggers: [
      'business attraction', 'incentive package', 'recruit a company', 'site selection', 'relocation incentive', 'what to offer', 'attract a business', 'recruitment pitch', 'competing for a project', 'lure a company',
    ],
    answer: "Economic development offices use Lumecon to put defensible numbers behind a recruitment pitch or an incentive package: the jobs, payroll, and supplier spend a prospect would bring, modeled the same way for every deal so you can compare offers on equal footing instead of negotiating off a company's own projections. The output drops into a council resolution, an incentive memo, or a site-selection one-pager. Working an active deal? The team can show it on your numbers.",
  },
  {
    id: 'compare_projects',
    chip: null,
    triggers: [
      'compare projects', 'equal footing', 'council packet', 'prioritize projects', 'which project', 'apples to apples', 'rank projects', 'project comparison', 'compare two projects',
    ],
    answer: "Because every study runs on the same engine and the same public data, projects come out measured the same way, so you can line them up on equal footing for a council packet or a capital plan instead of trusting numbers each consultant built differently. That apples-to-apples comparison is one of the most common reasons offices bring this in-house. Want to see two of your projects compared?",
  },

  /* --- State agency / procurement --- */
  {
    id: 'procurement',
    chip: null,
    triggers: [
      'sole source', 'sole-source', 'rfp', 'request for proposal', 'procurement', 'contract vehicle', 'gsa schedule', 'cooperative purchasing', 'cooperative contract', 'sam registration', 'uei', 'duns', 'how do we buy this', 'how do we purchase', 'purchasing process', 'off a state contract', 'piggyback contract',
    ],
    answer: "For procurement, the cleanest path is to tell the team your buying requirements (a sole-source justification, an RFP, or a cooperative or state contract vehicle) and they will work with your purchasing office on the right mechanism, including SAM and UEI registration where needed. Pricing is a flat annual subscription, which usually maps to a single line in a budget cycle. Email contact@lumecon.ai and we will get your procurement team what they need.",
  },
  {
    id: 'comparability',
    chip: null,
    triggers: [
      'comparability', 'across grantees', 'consistent year over year', 'same method every grantee', 'standard rubric', 'score applicants', 'score grantees', 'consistent methodology', 'standardized methodology', 'compare grantees',
    ],
    answer: "Running every study on the same engine and the same public data is exactly what makes results comparable: across grantees in a competitive round, across projects in a capital plan, and across years in a recurring report. A reviewer can score applicants on the same basis instead of refereeing methodologies that differ from one consultant to the next. That consistency is a core reason agencies bring this in-house. Want the team to show it on a grant round you run?",
  },
  {
    id: 'transportation',
    chip: null,
    triggers: [
      'corridor study', 'corridor', 'highway project', 'transit corridor', 'bridge project', 'transportation impact', 'dot capital', 'road project', 'transit project', 'rail project',
    ],
    answer: "Transportation agencies use Lumecon for the economic-impact side of corridor, transit, highway, and bridge projects: construction-phase jobs and supplier spend, multi-year labor income, and the operating impact once the asset is in service, with the methodology attached for a legislative or federal application. For a formal benefit-cost analysis with discount rates, ask me about benefit-cost, since that is a related but distinct exercise. What corridor or project are you sizing?",
  },
  {
    id: 'data_freshness',
    chip: null,
    triggers: [
      'how current is the data', 'how often is the data updated', 'how often updated', 'data refresh', 'refresh cadence', 'data vintage', 'base year', 'benchmark year', 'benchmarked', 'benchmark vintage', 'use table', 'use tables', 'make table', 'most recent data', 'release lag', 'how recent is the data', 'data freshness', 'what year is the data',
    ],
    answer: "The official accounts every serious model uses (BEA, ACS, LODES, QCEW, County Business Patterns) update on their own public release cycles, and Lumecon tracks the latest available vintage and tells you the base year behind any study. Between those slower official releases, we layer in higher-frequency public and alternative signals so a study reflects current conditions rather than a benchmark year that is several years stale. The base year and data vintage are surfaced in the study, so a reviewer can see exactly what underpins it.",
  },

  /* --- University --- */
  {
    id: 'research_impact',
    chip: null,
    triggers: [
      'sponsored research', 'research grants', 'research expenditures', 'indirect cost recovery', 'f&a recovery', 'grant-funded activity', 'grant funded activity', 'spinoffs', 'tech transfer', 'research impact',
    ],
    answer: "University research activity models cleanly: sponsored-research and grant-funded expenditures, the jobs and supplier spend they support, and downstream effects like spinoffs and tech transfer, separated from the campus's operating and construction footprint so the research story stands on its own. The same study reshapes for a legislative ask, a board update, or a sponsored-programs annual report. Are you sizing research alone or the whole institution?",
  },
  {
    id: 'system_vs_campus',
    chip: null,
    triggers: [
      'system vs campus', 'multi-campus', 'multi campus', 'whole university system', 'system office', 'consolidate campuses', 'per-campus', 'system level', 'multiple campuses', 'campus by campus',
    ],
    answer: "You can run a single campus, several campuses, or a whole system, and roll the results up or break them out by campus, because the geography and the institution are both inputs you control. A system office gets one consolidated figure plus per-campus detail off the same analysis. For a multi-campus system the team can scope seats and setup with you. Want to see a system rollup?",
  },
  {
    id: 'accreditation',
    chip: null,
    triggers: [
      'accreditation', 'accreditation report', 'sacscoc', 'hlc', 'annual institutional', 'carnegie', 'common data set', 'fact book', 'institutional research report',
    ],
    answer: "The economic-impact figures Lumecon produces drop into institutional reports and the narratives that support accreditation and board reporting: operations, research, construction, and student and visitor spending, measured the same way each year so the trend is comparable. The numbers are identical across audiences; only the framing changes for an accreditor, the legislature, or a town-gown briefing. What report are you preparing?",
  },

  /* --- Foundation / philanthropy --- */
  {
    id: 'attribution',
    chip: null,
    triggers: [
      'over-claiming', 'over claiming', 'attribute impact', 'attribution', 'additionality', 'our grant vs other funders', 'give us credit', 'credit for impact', 'take credit',
    ],
    answer: "Attribution is a real and fair question, and the honest answer is that an economic-impact study sizes the activity associated with the dollars in scope; it does not by itself prove that none of it would have happened otherwise. Lumecon helps you stay credible by scoping the study to the activity you actually funded and surfacing every assumption, so you can describe your contribution without over-claiming credit for the whole. For additionality or counterfactual framing, the team can talk through how to present it responsibly.",
  },
  {
    id: 'theory_of_change',
    chip: null,
    triggers: [
      'theory of change', 'logic model', 'outcomes framework', 'inputs outputs outcomes', 'results framework',
    ],
    answer: "A theory of change or logic model is the qualitative frame for why a program works; Lumecon supplies the economic evidence that sits inside it, like the jobs, wages, and local business activity your dollars supported. We do not build the logic model itself, but the impact figures plug into the outcomes section of one and make it concrete for a board or a donor. Want to see what those figures look like for a portfolio like yours?",
  },
  {
    id: 'anchor_institution',
    chip: null,
    triggers: [
      'anchor institution', 'anchor mission', 'eds and meds', 'anchor strategy', 'local procurement anchor', 'anchor based',
    ],
    answer: "Anchor institutions (hospitals, universities, large nonprofits) are a natural fit: Lumecon sizes the regional ripple of their hiring, local procurement, and capital spending, which is exactly the evidence an anchor strategy needs to show local economic benefit. A foundation backing an anchor grantee can measure that footprint the same way every year. Is this for your own institution or a grantee?",
  },
  {
    id: 'sroi_concept',
    chip: null,
    triggers: [
      'what is sroi', 'social return on investment', 'is this sroi', 'does this replace sroi', 'sroi', 'social roi',
    ],
    answer: "SROI (social return on investment) puts a single ratio on a broad mix of social outcomes; economic impact analysis is narrower and more standardized, measuring jobs, wages, and business activity through input-output modeling. Lumecon does the latter, which is the piece funders and councils most often want sourced and defensible. It can be one credible, comparable input into an SROI story rather than a replacement for the whole framework.",
  },

  /* --- CDFI / community lending --- */
  {
    id: 'cdfi_metrics',
    chip: null,
    triggers: [
      'deployment ratio', 'loan portfolio', 'capital deployed', 'dollars lent', 'lending impact', 'borrower outcomes', 'portfolio impact', 'lending portfolio', 'loans deployed',
    ],
    answer: "CDFIs use Lumecon to turn lending into economic evidence: the jobs, wages, and local business activity a loan portfolio supports across the communities you serve, measured the same way each year for funders and your board. You bring the portfolio or deployment data; Cedar maps it to the regional model so impact reads in jobs and income, not just dollars out the door. Want to see it on a portfolio like yours?",
  },
  {
    id: 'compliance_frameworks',
    chip: null,
    triggers: [
      'cra', 'community reinvestment act', 'amis', 'amis reporting', 'cdfi fund report', 'cdfi fund', 'tlr', 'transaction level report', 'annual certification', 'cdfi compliance',
    ],
    answer: "The economic-impact figures Lumecon produces support the impact narrative in CDFI Fund, CRA, and investor reporting: jobs and local business activity tied to your lending and programs, with the methodology attached. Lumecon is not a compliance-filing system and does not submit AMIS or TLR data for you, but it gives you the defensible impact numbers those audiences want alongside the raw reporting. Tell the team your reporting cycle and they will show how it fits.",
  },
  {
    id: 'technical_assistance',
    chip: null,
    triggers: [
      'technical assistance', 'ta program', 'small business support', 'borrower ta', 'wraparound services', 'business coaching', 'advisory services impact',
    ],
    answer: "Technical-assistance and small-business support programs can be included in a study as part of the activity your organization drives in the local economy, alongside lending or grantmaking. Cedar maps program spend and the activity it enables to the regional model so the ripple shows up in jobs and income. How your TA work is structured shapes the approach, so it is worth scoping with the team.",
  },
  {
    id: 'underserved_geo',
    chip: null,
    triggers: [
      'census tract', 'underserved', 'investment area', 'persistent poverty', 'distressed community', 'rural lending', 'underserved market', 'low income community', 'target market',
    ],
    answer: "Lumecon models down to small and rural geographies, including the census-tract-level and investment-area framing CDFIs and place-based funders work in, so impact in an underserved or distressed community is measured directly rather than washed out in a larger county average. Multi-tract or overlapping target markets still come out as one study. Want to see it on your target market?",
  },

  /* --- Grants / consultants --- */
  {
    id: 'reseller',
    chip: null,
    triggers: [
      'resell', 'reseller', 'resell studies', 'resell this', 'use across multiple clients', 'multiple clients', 'im a consultant', 'i am a consultant', 'grant consultant', 'agency license', 'white label', 'white-label', 'per-client', 'partner program', 'for my clients', 'across clients',
    ],
    answer: "Consultants and agencies use Lumecon across multiple clients on one subscription, which is a big part of the appeal: instead of a per-study fee from a legacy tool, you run unlimited studies for the organizations you serve. How that is licensed depends on your volume and whether you need white-labeling, so the best next step is to tell the team how many clients you support and they will scope a partner arrangement. Email contact@lumecon.ai with your setup.",
  },
  {
    id: 'bca',
    chip: null,
    triggers: [
      'benefit cost', 'benefit-cost', 'bca', 'cost benefit', 'cost-benefit', 'benefit cost ratio', 'cost benefit analysis', 'b/c ratio', 'omb a-94', 'a-94', 'discount rate', 'net present value', 'npv', 'benefit cost analysis', 'benifit', 'benifit cost', 'benifit-cost', 'irr', 'internal rate of return', 'wacc', 'hurdle rate', 'present value', 'time value of money', 'discounted cash flow', 'dcf', 'monte carlo',
    ],
    answer: "A formal benefit-cost analysis (net present value, a discount rate, a benefit-cost ratio) is related to but distinct from an economic impact study, which sizes jobs, wages, and regional activity. Lumecon produces the impact figures that feed the benefits side of a BCA, and the team can talk through how that supports a DOT RAISE or similar application that asks for OMB A-94 style framing. Which program are you preparing for?",
  },

  /* --- Methodology (for the skeptical economist) --- */
  {
    id: 'net_vs_gross',
    chip: null,
    triggers: [
      'net vs gross', 'net versus gross', 'gross vs net', 'displacement', 'displacement effects', 'substitution effects', 'crowding out', 'opportunity cost', 'counterfactual', 'but for', 'additionality', 'net new jobs vs',
    ],
    answer: "Fair challenge, and an important one. A standard input-output study reports gross activity associated with the spending in scope; it does not automatically net out displacement, substitution, or the opportunity cost of public funds. Lumecon handles this by letting you scope the study to net-new activity and by surfacing the assumptions, so you can present a gross figure and a more conservative net framing rather than hiding the distinction. For a project where displacement is central, the team can walk through how to bound it.",
  },
  {
    id: 'significance_vs_impact',
    chip: null,
    triggers: [
      'economic significance', 'significance vs impact', 'significance versus impact', 'contribution analysis', 'contribution vs impact', 'gross output overstatement', 'impact or significance',
    ],
    answer: "Good distinction to insist on. Economic contribution or significance describes activity already present in a region; economic impact describes the change caused by a specific project or program relative to a counterfactual. Conflating them is a common way impact gets overstated. Lumecon lets you frame a study either way and labels which one it is reporting, so the headline number means what it says to a careful reader.",
  },
  {
    id: 'multiplier_type',
    chip: null,
    triggers: [
      'type i multiplier', 'type ii multiplier', 'type i', 'type ii', 'type 1', 'type 2', 'type i or type ii', 'type 1 multiplier', 'type 2 multiplier', 'sam multiplier', 'household endogenous', 'closed model', 'open model', 'which multiplier type', 'type sam', 'consumption function', 'household row', 'keynesian', 'where do your multipliers come from', 'where do the multipliers come from', 'multiplier source', 'rims ii or', 'derive your multipliers', 'build your own multipliers', 'make and use tables',
    ],
    answer: "Lumecon works in the standard input-output framework, so the Type I versus Type II (and SAM, household-endogenous) distinction applies the way you would expect: Type I captures direct and indirect effects, while Type II and SAM close the model on households to add induced effects. The multipliers are derived from the BEA national make-and-use tables, regionalized to your geography, and benchmarked against RIMS II and IMPLAN-style results rather than being free parameters we invent. The study states which multipliers it used, so the induced layer is never a black box. If you need a specific multiplier convention for comparability with prior work, that is a setting the team can confirm.",
  },
  {
    id: 'rpc_method',
    chip: null,
    triggers: [
      'regional purchase coefficient', 'regional purchase coefficients', 'estimate rpc', 'rpc', 'location quotient', 'supply-demand pooling', 'regionalize', 'regionalize national accounts', 'trade leakage', 'inter-regional feedback', 'cross-hauling', 'shift-share', 'shift share', 'economic base', 'export base', 'economic base analysis',
    ],
    answer: "Regional purchase coefficients are central, since they decide how much of each dollar stays in-region versus leaks out, and Lumecon regionalizes the national accounts using established methods (location-quotient and supply-demand-pooling style approaches) rather than anything proprietary and opaque. The RPC and regionalization assumptions are surfaced per study, so you can see, and adjust, how local capture was estimated. For multi-region studies, inter-regional feedback is handled explicitly. Happy to go deeper with the team on a specific geography.",
  },
  {
    id: 'io_assumptions',
    chip: null,
    triggers: [
      'fixed coefficients', 'leontief', 'elastic supply', 'linearity', 'linearity assumption', 'no capacity constraints', 'capacity constraints', 'full employment', 'static model', 'io limitations', 'input-output limitations', 'producer to purchaser', 'producer prices', 'purchaser prices', 'producer price', 'purchaser price', 'margining', 'assumptions of input-output', 'general equilibrium', 'cge', 'gross output multiplier', 'value added multiplier', 'output multiplier', 'gross vs value added', 'elasticity', 'exogenous', 'endogenous', 'partial equilibrium', 'comparative statics', 'deadweight loss', 'externalities', 'tax incidence', 'consumer surplus', 'welfare analysis',
    ],
    answer: "We do not pretend input-output models are something they are not. They assume fixed production coefficients, effectively elastic supply, and linearity, and they are best read as short-run, static estimates rather than general-equilibrium forecasts. Lumecon's contribution is not new theory; it is current data, transparent assumptions, a complete audit trail, and geographies the legacy tools handle poorly, all on the same mainstream economics. Where those assumptions matter for your case, the study surfaces them so a reviewer can weigh them honestly.",
  },

  /* --- Procurement / IT / security --- */
  {
    id: 'compliance_certs',
    chip: null,
    triggers: [
      'soc 2', 'soc2', 'iso 27001', 'iso27001', 'fedramp', 'hipaa', 'are you certified', 'are you compliant', 'compliance attestation', 'audit report', 'security questionnaire', 'vendor security', 'trust center', 'hitrust', 'stateramp', 'certifications', 'subprocessor', 'subprocessors', 'sub-processors', 'third-party processors', 'who are your subprocessors',
    ],
    answer: "Lumecon runs on US-region cloud with encryption in transit and at rest, single-tenant workspaces, and role-based access, and the team carries hands-on experience handling PII and sensitive government data across the Federal Reserve system. As an early-stage platform we are glad to complete a vendor security questionnaire, share which controls are in place today, and talk through our certification roadmap (SOC 2 and similar) before anything sensitive moves. For a procurement review, email contact@lumecon.ai and we will get your security team a packet.",
  },
  {
    id: 'sso_auth',
    chip: null,
    triggers: [
      'sso', 'saml', 'oidc', 'single sign on', 'single sign-on', 'scim', 'mfa', 'okta', 'azure ad', 'entra', 'role based access', 'rbac', 'identity provider', 'provisioning',
    ],
    answer: "Access is governed by role-based controls within a single-tenant workspace per organization. For enterprise identity (SSO via SAML or OIDC, MFA, SCIM provisioning with Okta or Entra), tell the team your identity provider and requirements and they will confirm what is available today versus on the near-term roadmap. This is a common procurement question, and we are glad to walk through it before you commit.",
  },
  {
    id: 'sla_support',
    chip: null,
    triggers: [
      'sla', 'uptime', 'service level', 'service level agreement', 'availability guarantee', 'support response', 'support response time', 'support hours', 'incident response', 'status page',
    ],
    answer: "Support and service levels are set in the subscription agreement, and while the platform is early the team is directly reachable, so questions and issues reach a person fast rather than a ticket queue. For a formal uptime or response-time SLA tied to a contract, tell the team your requirements and they will put specifics in writing. Email contact@lumecon.ai to scope it.",
  },
  {
    id: 'contracts_legal',
    chip: null,
    triggers: [
      'msa', 'dpa', 'baa', 'master service agreement', 'data processing agreement', 'business associate agreement', 'contract terms', 'contract', 'redlines', 'terms of service', 'terms and conditions', 'sign a contract', 'legal terms',
    ],
    answer: "The team can provide a master service agreement and a data processing agreement, and will work through redlines with your legal and procurement offices. For specialized terms (a BAA or sector-specific clauses), say so up front and they will tell you what is in place and what needs scoping. Start at contact@lumecon.ai and we will get the paperwork moving.",
  },
  {
    id: 'billing_cancellation',
    chip: null,
    triggers: [
      'billing', 'invoice', 'payment terms', 'purchase order', 'net 30', 'net thirty', 'how do i cancel', 'cancel', 'cancellation', 'auto-renewal', 'auto renewal', 'renewal', 'refund', 'how does billing work', 'payment',
    ],
    answer: "Billing is a flat annual subscription, and the team can work with purchase orders and standard payment terms for government and institutional buyers. Renewal, cancellation, and any refund terms are set in your agreement rather than buried in fine print, so you will know them before you sign. For specifics on your situation, email contact@lumecon.ai.",
  },
  {
    id: 'data_retention',
    chip: null,
    triggers: [
      'data retention', 'how long do you keep', 'delete my data', 'data deletion', 'right to erasure', 'data export', 'export my data', 'offboarding', 'get my data out', 'retention policy', 'data portability',
    ],
    answer: "Your data stays in your single-tenant workspace, you control what is uploaded, and you can export your data and request deletion. Specific retention and deletion terms are set in the data processing agreement, so they are contractual rather than discretionary. If you have a particular retention or offboarding requirement, tell the team and they will confirm it in writing before anything sensitive moves.",
  },
  {
    id: 'accessibility',
    chip: null,
    triggers: [
      'accessibility', 'wcag', 'section 508', '508', 'vpat', 'ada compliant', 'ada compliance', 'screen reader', 'accessible', 'a11y', 'keyboard navigation',
    ],
    answer: "Accessibility is a real requirement for public-sector buyers, and we treat it that way: the platform is being built with WCAG 2.1 AA and Section 508 in mind, including keyboard navigation and screen-reader support. For a formal VPAT or a specific conformance requirement, tell the team where you are in procurement and they will share current status and timeline. Email contact@lumecon.ai for the details your accessibility review needs.",
  },

  {
    id: 'security_operations',
    chip: null,
    triggers: [
      'pen test', 'pentest', 'penetration test', 'penetration testing', 'vulnerability disclosure', 'vuln disclosure', 'responsible disclosure', 'breach notification', 'data breach', 'breach', 'backups', 'backup', 'disaster recovery', 'dr plan', 'rto', 'rpo', 'audit logs', 'activity logs', 'access logs', 'encryption keys', 'key management', 'kms', 'customer managed keys', 'customer-managed keys', 'api key', 'your api key', 'admin key', 'secret key',
    ],
    answer: "Those are the right questions for a security review. Lumecon runs on US-region cloud with encryption in transit and at rest and single-tenant workspaces; on the operational specifics (penetration testing, vulnerability disclosure, breach-notification timelines, backups and disaster recovery, audit logging, and key management), we are glad to share what is in place today and what is on the roadmap as part of a security questionnaire. As an early-stage platform some of these are still being formalized, and we would rather tell you exactly where each one stands than overstate it. Email contact@lumecon.ai and we will route your security team to the specifics.",
  },
  {
    id: 'local_capture',
    chip: null,
    triggers: [
      'dollars stay local', 'dollars kept local', 'kept local', 'kept in the local', 'stay local', 'stays local', 'local economy', 'in the local economy', 'local capture', 'leakage', 'leaks out', 'dollars leaving', 'money leaving', 'stays in the region', 'keep dollars local', 'retain spending', 'dollars stay in',
    ],
    answer: "How much of each dollar stays in the local economy versus leaks out to suppliers elsewhere is exactly what the regional purchase coefficients in the model capture, and it is often the most important number for a community. Lumecon estimates local capture for your specific geography and surfaces the assumption, so you can show how much spending actually stayed in the region rather than asserting it. For a reservation or a rural county where leakage runs high, that local-versus-leaked split is front and center in the study.",
  },

  /* --- Trust / people / press --- */
  {
    id: 'legitimacy',
    chip: null,
    triggers: [
      'is this legit', 'is this real', 'is this a scam', 'are you a scam', 'whats the catch', 'what is the catch', 'can i trust this', 'is this for real', 'too good to be true', 'sounds too good',
    ],
    answer: "Fair to ask. Lumecon is a real company building economic impact analysis software, founded by brothers Elijah and Michael Moreno, with a team that has worked across the Federal Reserve system and trained at schools like Cornell, Dartmouth, Oxford, and MIT. The math is mainstream economics and the core data is public, so there is no black box and no catch: the product is the software that makes the analysis fast, usable, and auditable. You can read about the team on the About page, or email contact@lumecon.ai with any question.",
  },
  {
    id: 'leadership',
    chip: null,
    triggers: [
      'who owns this', 'who runs this', 'who runs the company', 'who are the founders', 'who is the founder', 'is there a ceo', 'who started this', 'whos behind this', 'who is behind this', 'who owns the company', 'leadership team', 'who is the ceo',
    ],
    answer: "Lumecon was founded by brothers Elijah Moreno and Michael Moreno, enrolled members of the Coastal Band of the Chumash Nation. Elijah is the CEO; the broader team leads economics, the platform, the input-output engine, Cedar, and data governance, with backgrounds spanning the Federal Reserve system and Cornell, Dartmouth, Duke, Oxford, and MIT. The About page has each person and their work. Want the link, or an introduction to the team?",
  },
  {
    id: 'press_media',
    chip: null,
    triggers: [
      'im a reporter', 'i am a reporter', 'im a journalist', 'i am a journalist', 'press inquiry', 'media inquiry', 'media question', 'writing a story', 'can i quote', 'press contact', 'for a story',
    ],
    answer: "Happy to help with a story. The fastest route is the contact form or contact@lumecon.ai with your outlet, your deadline, and what you are working on, and a person will get back to you. For background, the About page covers the team and the company, and the homepage map shows a live example study you are welcome to reference.",
  },

  /* --- Upsell: free vs paid Cedar (the one new chip) --- */
  {
    id: 'cedar_tiers',
    followUps: ['pricing', 'cedar_grove', 'demo'],
    chip: 'Free vs paid Cedar?',
    triggers: [
      'free vs paid', 'free version', 'paid cedar', 'real cedar', 'full cedar', 'is the ai cedar included', 'is ai cedar included', 'is cedar free', 'cedar free', 'is the ai cedar free', 'is lumecon free', 'lumecon free', 'free or paid', 'what do i get if i pay', 'what do i unlock', 'unlock cedar', 'upgrade', 'upgrade cedar', 'this cedar vs', 'smarter cedar', 'cedar in the product', 'cedar in the platform', 'what does cedar do in the product', 'difference between this and the paid',
    ],
    answer: "The Cedar you are talking to here is the free, lightweight site assistant: I answer questions about Lumecon, who it is for, the methodology, pricing, and how to reach the team. The full Cedar that comes with a subscription is a different animal: inside the platform it reads your administrative files, harmonizes them against public data, surfaces every modeling assumption, runs the study, and drafts the report for each audience. If you want the version that does the work on your own data, that starts at the Sapling tier. Want me to point you to pricing or set up a demo?",
    expanded: "More on the split: this site Cedar is a free, keyword-based assistant that never touches your data and exists to help you learn what Lumecon does. The product Cedar is the real engine of the platform. It ingests budgets, payroll, vendor lists, and program data, matches them to the right industries and geographies, fits the input-output model, flags every assumption for your sign-off, and turns the finished study into a council memo, a grant narrative, or a board deck on demand. The Cedar assistant comes with the Sapling tier and up, and the curated Cedar Grove data layer comes with the top Tree tier. The pricing page lays out exactly what each tier unlocks.",
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
      'help', "i'm confused", 'im confused', 'confused', 'what should i ask', "i don't know where to start", 'guide me', 'not sure what i need', 'not sure what to ask', 'i just want to know more', 'where do i start', 'i dont get it', 'i dont understand', 'dont understand', 'im so confused', 'this is too complicated', 'too complicated', 'this is over my head', 'over my head', 'im lost', 'idk what this is', 'idk what this even is', 'what even is this', 'whats going on here', 'whats this all about', 'doesnt make sense', 'this doesnt make sense', 'makes no sense to me', 'me no understand', 'no understand', 'i no get it', 'help me understand', 'this confusing', 'explain please', 'i dont follow',
    ],
    answer: "No problem. The easiest starting points are what Lumecon does, who uses it, how a study works, or what it costs. If you've got a specific project in mind like a grant, a bond, or an annual impact report, tell me about it and I'll point us at the right answer.",
  },
  {
    id: 'econ_measures',
    chip: null,
    triggers: [
      'gdp', 'gdp contribution', 'contribution to gdp', 'grp', 'gross regional product', 'gross domestic product', 'gva', 'gross value added', 'value added', 'value-added', 'gross output', 'final demand', 'intermediate inputs', 'factor income', 'backward linkages', 'forward linkages', 'agglomeration', 'value chain', 'economic output', 'gross product',
    ],
    answer: "Every study reports the standard measures economists and funders expect: output (the gross value of activity), value added (the contribution to GDP, or to gross regional product at the local level), labor income (wages and benefits), and employment, each split into direct, indirect, and induced effects. Value added is the cleanest read on net contribution because it nets out intermediate inputs, so it is the figure most comparable to a published GDP number. If a particular audience wants one specific measure, the study already carries all of them.",
  },
  {
    id: 'guarantees',
    chip: null,
    triggers: [
      'guarantee', 'guaranteed', 'do you guarantee', 'can you guarantee', 'will you guarantee', 'guarantee me', 'guarantee the', 'guarantee that', 'guarantee grant', 'guarantee approval', 'guarantee funding', 'guarantee jobs', 'guarantee results', 'guarantee a', 'roi guaranteed', 'is it guaranteed', 'guaranteed results', 'guaranteed payback', 'promise me', 'you promise', 'guarantee my',
    ],
    answer: "I can't promise an outcome, and I'd be wary of anyone who does. Lumecon gives you credible, defensible economic impact analysis with every assumption shown; it does not guarantee that a grant gets funded, a vote passes, or a specific number of jobs appears, since those depend on factors well outside any study. What a study does is put sound, sourced numbers behind your case so the people deciding have something solid to weigh. Want to see how the analysis is built, or talk to the team about your situation?",
  },
  {
    id: 'hostile',
    chip: null,
    triggers: [
      'fuck you', 'fuck off', 'f you', 'screw you', 'go to hell', 'kill you', 'kill yourself', 'kill myself', 'i will kill', 'shut up', 'youre an idiot', 'you are an idiot', 'stupid bot', 'dumb bot', 'useless bot', 'hate you', 'i hate this bot', 'piece of shit', 'asshole', 'you are worthless', 'youre worthless', 'screw this',
    ],
    answer: "I'm Cedar, Lumecon's site assistant, and I want to keep this respectful and helpful. If you're going through something serious, please reach out to someone who can help directly. For anything about Lumecon, I'm here, or the team reads everything sent to contact@lumecon.ai.",
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
      'hi', 'hello', 'hey', 'yo', 'sup', 'howdy', 'good morning', 'good afternoon', 'good evening', 'cedar', 'u there', 'you there', 'anyone there', 'anybody there',
    ],
    answer: "Hey, I'm Cedar, Lumecon's site assistant. I can answer questions about what Lumecon does, who uses it, how the math works, what a study costs, or how to reach the team. What brings you in today?",
  },
];

// Catch-all responses for input that doesn't match any intent above.
export const OUT_OF_SCOPE_ANSWER =
  "I'm Cedar, Lumecon's site assistant, so I'm best at answering questions about Lumecon, economic impact reporting, and how to connect with the team. Try asking me what Lumecon does, who the platform is for, or how economic impact analysis works.";

export const FALLBACK_ANSWER =
  "Let me point you the right way. I'm a focused assistant, so I'm sharpest on Lumecon itself. I can cover what Lumecon does and who it's for (tribal nations, cities and counties, state agencies, foundations, universities, nonprofits), how a study works and how the math holds up, grants and federal funding (EDA, HUD, DOT, EPA, USDA, and more), pricing, geographies, jobs, or how to reach the team. Try a word or two like \"pricing,\" \"tribal,\" \"EPA grant,\" \"jobs,\" or \"demo,\" or email contact@lumecon.ai for anything specific.";

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
  'cedar_tiers',
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
