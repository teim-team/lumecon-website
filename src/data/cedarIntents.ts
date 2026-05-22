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
  chip: string | null;
  triggers: string[];
  answer: string;
}

export const INTENTS: CedarIntent[] = [
  {
    id: 'company_overview',
    chip: 'What is Lumecon?',
    triggers: [
      'what is lumecon', 'what does lumecon do', 'what does lumecon', 'explain lumecon', 'what is this company', 'what are you building', 'what is the platform', 'what is lumecon for', 'what problem', 'why does lumecon', 'what is the point of this site', 'this site', 'tell me about lumecon', 'about lumecon', 'overview', 'what do you do', 'lumecon do',
    ],
    answer: 'Lumecon helps organizations understand and communicate their economic impact. Our platform turns complex data into clear, credible reports that show how spending, investment, employment, and community activity ripple through local economies. In plain English: we help people explain the value they create.',
  },
  {
    id: 'cedar_identity',
    chip: 'What is Cedar?',
    triggers: [
      'what is cedar', 'who are you', 'are you the chatbot', 'are you a chatbot', 'are you a bot', 'what can cedar help', 'why are you called cedar', 'what does this assistant do', 'can you answer', 'are you ai', 'are you a real person', 'who is cedar', 'how can i use this chatbot', 'about cedar', 'what does cedar do', 'tell me about cedar',
    ],
    answer: "I'm Cedar, Lumecon's site assistant. I can help explain what Lumecon does, who the platform is for, how economic impact reporting works, and how to get in touch with the team. I'm here to point you in the right direction, not replace a conversation with the Lumecon team.",
  },
  {
    id: 'audience',
    chip: 'Who is Lumecon for?',
    triggers: [
      'who uses lumecon', 'who uses this', 'who uses it', 'who is this for', 'who is this platform for', 'who is lumecon for', 'who is the platform made for', 'what kinds of clients', 'what kind of clients', 'what types of clients', 'clients do you serve', 'who do you serve', 'who do you work with', 'is this for nonprofits', 'is this for universities', 'is this for foundations', 'is this for developers', 'is this for community', 'is this for me', 'target audience', 'who are your customers', 'who buys this',
    ],
    answer: "Lumecon is built for organizations that need to explain their economic impact clearly and credibly. That can include tribal governments, local governments, universities, foundations, developers, nonprofits, and other institutions making investments in communities. The common thread: if your work affects jobs, spending, income, tax revenue, or local development, Lumecon can help make that impact easier to understand.",
  },
  {
    id: 'tribal_platform',
    chip: 'Does this work for tribal nations?',
    triggers: [
      'tribal economic impact', 'tribal platform', 'tribal government', 'tribal nation', 'native nation', 'tribal enterprise', 'tribal gaming', 'tribes use this', 'is this made for native', 'help tribal', 'help tribes', 'help native', 'measure tribal', 'tribal grant', 'why do tribes need this', 'tribal',
    ],
    answer: "Lumecon's Tribal Economic Impact Platform helps tribal governments and tribal enterprises communicate their economic contributions with clear, data-backed reports. That can include jobs supported, wages generated, business activity, local spending, and broader regional impacts. The goal is to help Native nations tell a stronger economic story while respecting the distinct governance context of tribal economies.",
  },
  {
    id: 'local_platform',
    chip: 'Can cities and counties use this?',
    triggers: [
      'local economic impact', 'local platform', 'cities use', 'counties use', 'city use', 'county use', 'local government', 'municipal', 'state agency', 'state agencies', 'public agency', 'public agencies', 'measure a project', "project's impact", 'project impact', 'local development', 'public investment', "i'm not a tribal", 'non-tribal', 'non tribal',
    ],
    answer: 'Lumecon is not only for tribal governments. We also support local economic impact analysis for cities, counties, public agencies, nonprofits, universities, developers, and other organizations. The platform can help explain how a project, institution, investment, or program affects a local or regional economy.',
  },
  {
    id: 'reports_outputs',
    chip: 'What kind of reports does it produce?',
    triggers: [
      'what reports', 'what report', 'pdf report', 'final output', 'output look like', 'create dashboards', 'dashboard', 'export the results', 'export', 'presentations', 'public meetings', 'board materials', 'economic impact report', 'deliverables', 'what do you produce', 'what does it produce', 'report do you',
    ],
    answer: 'Lumecon is designed to help users create clear economic impact outputs, including reports, summaries, charts, tables, and presentation-ready materials. The goal is to make complex analysis easier to explain to councils, boards, funders, partners, community members, and the public.',
  },
  {
    id: 'data_inputs',
    chip: 'What data does it use?',
    triggers: [
      'what data', 'where does the data come', 'users upload data', 'upload my data', 'bring my own data', 'bring your own data', 'what inputs', 'what input', 'government data', 'public data', 'is the data credible', 'how do you calculate', 'what data sources', 'data sources', 'real economic data',
    ],
    answer: 'Lumecon pairs your administrative records with the canonical public sources every serious impact model uses (ACS, County Business Patterns, BEA regional accounts, LODES, QCEW) plus higher-frequency signals from USASpending, the regional Federal Reserve Banks, anonymized cell-phone mobility, satellite land-use, and proprietary data we collect ourselves. If your data is messy or scattered across departments, send what you have and Cedar will harmonize it for you. The exact mix depends on the project, organization, and geography.',
  },
  {
    id: 'multipliers',
    chip: 'What are multipliers?',
    triggers: [
      'what is a multiplier', 'what are multipliers', 'what are economic multipliers', 'explain multipliers', 'how do multipliers', 'indirect impact', 'induced impact', 'direct impact', 'total economic impact', 'ripple effect', 'ripple through', 'why does spending create', 'multiplier effect', 'multiplier',
    ],
    answer: 'Economic multipliers estimate how one dollar of activity can ripple through a local economy. If an organization hires workers, buys supplies, or funds construction, that activity directly supports jobs and spending. Then suppliers, workers, and local businesses spend money again, creating additional effects. Economic impact analysis measures those layers in a clear and disciplined way.',
  },
  {
    id: 'software_vs_consulting',
    chip: 'Is this software or consulting?',
    triggers: [
      'is lumecon software', 'is this consulting', 'are you a saas', 'is this saas', 'saas company', 'sell reports', 'platform or a service', 'platform or service', 'hire you to do the analysis', 'is this self-service', 'is this self service', 'need an economist', 'turbotax for impact', 'is this automated', 'software or service',
    ],
    answer: 'Lumecon is building software to make economic impact reporting more guided, scalable, and accessible. The vision is a platform that walks users through the process instead of requiring them to start from scratch. Some projects may still involve support from the Lumecon team, especially for custom analysis, complex organizations, or early pilot partners.',
  },
  {
    id: 'pricing',
    chip: 'How much does it cost?',
    triggers: [
      'how much', 'what is the price', 'pricing', 'what does it cost', 'cost of lumecon', 'subscription', 'do you have subscriptions', 'can i buy', 'how do i get access', 'become a customer', 'become a client', 'price',
    ],
    answer: "Lumecon is five figures a year for an annual subscription that covers unlimited studies across every geography (reservation, county, state, and the full country). The legacy stack runs six figures per study and ships months later. We're early enough to work with selected pilot partners; contact the team and we'll match pricing to your use case.",
  },
  {
    id: 'demo',
    chip: 'Can I see a demo?',
    triggers: [
      'schedule a demo', 'want a demo', 'see a demo', 'see the demo', 'get a demo', 'demo of', 'a demo', 'see the product', 'see the platform', 'show me the platform', 'show me the product', 'is there a demo', 'can i try', 'try the platform', 'try lumecon', 'accepting pilots', 'pilot program', 'pilot partner', 'walkthrough', 'book a call', 'set up a call',
    ],
    answer: 'The best way to see whether Lumecon fits your needs is to request a demo or contact the team directly. Share a little about your organization, what kind of impact you want to measure, and any timeline you are working with. That will help the team follow up with the right context.',
  },
  {
    id: 'contact',
    chip: 'How do I contact you?',
    triggers: [
      'how do i contact', 'contact you', 'who should i email', 'i want to talk', 'speak with the founder', 'speak to the founder', 'reach lumecon', 'reach the team', 'reach out', 'get in touch', 'send an email', 'email lumecon', 'phone number',
    ],
    answer: 'You can reach out through the contact form on this site, or email contact@lumecon.ai. Include your name, organization, and a brief note about what you are hoping to measure or understand. That will help the Lumecon team route your message and follow up with the right context.',
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
    answer: "Lumecon is a six-person team and is looking for early teammates across software engineering, machine learning, data analytics, economic impact modeling, marketing, and sales. These are unpaid early-stage roles, open to undergraduate and graduate students. We mentor people who are persistent. See the /join page for details, or email contact@lumecon.ai with a résumé and a short note.",
  },
  {
    id: 'technical',
    chip: 'Tech stack and integrations?',
    triggers: [
      'tech stack', 'technology stack', 'do you have an api', 'have an api', 'api access', 'integrate with my system', 'integration', 'upload spreadsheet', 'upload spreadsheets', 'connect to external', 'external database', 'multiple people', 'support teams', 'team account', 'sso', 'single sign on',
    ],
    answer: 'Lumecon is being designed as a modern web platform with support for structured data, guided workflows, and organization-level use. Some technical features may depend on the stage of the product and the needs of pilot users. For integrations, team access, uploads, or API questions, the best next step is to contact the Lumecon team directly.',
  },
  {
    id: 'security',
    chip: 'Is my data safe?',
    triggers: [
      'is my data safe', 'data privacy', 'data security', 'happens to uploaded data', 'do you sell data', 'is this confidential', 'confidential', 'upload sensitive', 'sensitive information', 'protect client data', 'protect data', 'secure enough for governments', 'data sovereignty', 'tribal data', 'how do you protect', 'pii', 'personally identifiable', 'handle pii', 'federal reserve experience', 'government data',
    ],
    answer: 'Lumecon takes data privacy seriously, especially when working with governments, tribal nations, and organizations handling sensitive information. The team handled PII and sensitive government data at the Federal Reserve Banks of Minneapolis and Philadelphia and the Federal Reserve Board of Governors, so we know what production-grade data handling looks like. For sensitive projects, the team can walk through data handling, confidentiality, and access controls before any information is shared. Tribal data sovereignty and responsible data use are core to the platform design.',
  },
  {
    id: 'accuracy',
    chip: 'How credible are the numbers?',
    triggers: [
      'how accurate', 'can i trust the numbers', 'trust the numbers', 'peer reviewed', 'peer review', 'defensible', 'someone challenges', 'used publicly', 'used for grants', 'use for grants', 'with policymakers', 'credibility', 'how credible', 'are the numbers', 'does cedar hallucinate', 'hallucinate', 'hallucination', 'rag', 'retrieval augmented', 'make stuff up',
    ],
    answer: 'Economic impact estimates are only as credible as the data, assumptions, and methods behind them. Cedar is RAG-based, so its answers come from the actual data and source record rather than a model guess, and every assumption (multipliers, regional bridges, base year) is surfaced before it is used. Lumecon is designed to make those pieces clearer, more organized, and easier to explain, so users understand where the numbers come from and how to communicate them responsibly.',
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
    answer: "The methodology the existing platforms use — input-output modeling, regional multipliers, base-year reweighting — is mainstream economics. The BEA accounts behind it are public. What's been missing is software that uses the tools that exist today: cloud infrastructure, modern UIs, RAG-based AI, real-time data feeds, and geographies that aren't trapped inside administrative borders. Lumecon verifies its direct, indirect, induced, and total impact figures against the existing platforms, updates the assumptions and data that should be updated, and keeps what shouldn't.",
  },
  {
    id: 'explain_simple',
    chip: 'Explain economic impact like I am five',
    triggers: [
      'explain like', 'eli5', "i'm five", 'like i am five', 'what is economic impact', 'why does economic impact matter', 'what does this actually mean', 'why should i care', "what's an example", 'whats an example', 'give me an example', 'in simple terms', 'in plain english',
    ],
    answer: 'Economic impact is a way of showing how an organization, project, or investment affects a community economy. If a new facility is built, it may create construction jobs, buy materials from suppliers, hire permanent staff, and bring more spending into nearby businesses. Economic impact analysis organizes those effects into a clear story.',
  },
  {
    id: 'geographies',
    chip: 'What geographies are covered?',
    triggers: [
      'what geographies', 'which geographies', 'what regions', 'which regions', 'coverage', 'what areas does it cover', 'rural counties', 'small region', 'small regions', 'native hawaiian', 'alaska native', 'ancsa', 'reservations', 'reservation level',
    ],
    answer: 'Lumecon covers all federally recognized tribal nations and reservations, Alaska Native Corporation regions, Native Hawaiian Home Lands, every U.S. county, every U.S. state, and the entire country. All of it is included in one annual subscription, not priced per geography.',
  },
  {
    id: 'historical_forward',
    chip: 'Historical or forward-looking?',
    triggers: [
      'historical', 'longitudinal', 'forward looking', 'forward-looking', 'project forward', 'plan a budget', 'capital project', 'grant proposal', 'budget proposal', 'over time', 'past impact', 'future impact',
    ],
    answer: 'Yes to both. Look back historically for a longitudinal analysis, or model forward to plan a budget, grant proposal, or capital project. Studies improve over time as more of your data accumulates in the system.',
  },
  {
    id: 'where_built',
    chip: 'Where was Lumecon built?',
    triggers: [
      'where was lumecon built', 'where is lumecon based', 'where is lumecon from', "lumecon's background", 'team background', 'who built lumecon', 'who founded', 'founded by', 'cornell', 'team experience', 'who is on the team', 'who is behind',
    ],
    answer: "Lumecon Inc. was built at Cornell University, with counsel from the Cornell Law Entrepreneurship Law Clinic. The team's academic background spans Cornell, Dartmouth, Oxford, MIT, and Yale. Prior professional experience includes the Federal Reserve Banks of Minneapolis and Philadelphia and the Federal Reserve Board of Governors in Washington, DC.",
  },
  {
    id: 'grant_applications',
    chip: 'Can it support grant applications?',
    triggers: [
      'grant application', 'grant applications', 'federal grant', 'eda grant', 'hud grant', 'dot grant', 'epa grant', 'usda grant', 'cdbg', 'bil', 'bipartisan infrastructure law', 'rural development grant', 'broadband grant', 'workforce grant', 'arc grant', 'narrative for a grant', 'grant narrative', 'job estimates for a grant', 'private investment estimate', 'show economic benefit',
    ],
    answer: 'Yes. A lot of federal and state grant programs (EDA, HUD CDBG, DOT BUILD, USDA Rural Development, EPA, NTIA broadband, ARC) expect applicants to estimate jobs, private investment, or regional economic benefit, and to name a credible source for those numbers. Lumecon produces the jobs, labor income, and tax-impact figures with the methodology behind them, so the same study can drop into the grant narrative, the council packet, and the board memo without rework.',
  },
  {
    id: 'time_to_study',
    chip: 'How long does a study take?',
    triggers: [
      'how long does it take', 'how long to produce', 'how long is a study', 'turnaround', 'turn around time', 'how fast can you', 'study timeline', 'project timeline', 'lead time', 'how quickly', 'in time for our board', 'before our deadline', 'before grant deadline',
    ],
    answer: 'Minutes for a standard study, once the data is in. The legacy path takes months because the analyst is harmonizing data by hand and re-running scenarios from scratch each time. Cedar does the harmonization in minutes, so the slow part becomes the judgment calls — which assumptions to surface, which scenario to model — not the spreadsheet work. Minutes, not months.',
  },
  {
    id: 'no_economist',
    chip: "We don't have an economist on staff",
    triggers: [
      "don't have an economist", 'no economist', 'not an economist', 'not a data scientist', 'not technical', 'we are not analysts', 'we are not analysts', 'small team', 'limited capacity', 'tight staffing', 'capacity constrained', 'who runs the analysis', 'do i need to know economics',
    ],
    answer: "You don't need one. Lumecon is built for organizations that need credible impact analysis without hiring a dedicated economist or paying a consultant for every study. Cedar walks the team through the data, picks defaults that match the geography and the project type, and flags every assumption in plain English before the study is finalized. Your team makes the judgment calls; the platform handles the modeling.",
  },
  {
    id: 'state_agency_use',
    chip: 'How do state agencies use it?',
    triggers: [
      'state department of', 'state dot', 'state doc', 'state commerce', 'state treasury', 'state agency use case', 'state agency uses', 'department of commerce', 'department of transportation', 'state legislature', 'state budget office', 'state workforce board', 'state health department', 'how do states use',
    ],
    answer: "State DOTs, departments of commerce, workforce boards, treasury offices, and health departments use Lumecon to justify capital programs, score grant rounds, defend budget asks at the legislature, and report annual program impact. Typical artifacts: a defensible jobs / labor income / GDP figure for a capital plan, a multi-year economic impact narrative for a workforce program, or a regional benefit comparison across counties for a competitive grant.",
  },
  {
    id: 'county_city_use',
    chip: 'How do cities and counties use it?',
    triggers: [
      'city manager', 'city use case', 'city uses', 'county use case', 'county uses', 'edo', 'economic development director', 'economic development office', 'chamber of commerce', 'mayor', 'council member', 'school district', 'school bond', 'special district', 'how do cities use', 'how do counties use',
    ],
    answer: 'Cities and counties use Lumecon for capital project justification (new fire station, library expansion, transit line), TIF and tax abatement evaluation, school-district bond communication, business attraction packages, and annual community impact reports. EDOs especially use it to compare projects on equal footing and to put concrete numbers behind a recruitment pitch or an incentive ask.',
  },
  {
    id: 'foundation_use',
    chip: 'How do foundations use it?',
    triggers: [
      'foundation use case', 'how do foundations use', 'foundation report', 'philanthropy', 'philanthropic', 'grantmaker', 'grantmaking', 'community foundation', 'private foundation', 'family foundation', 'measure our giving', 'measure grantmaking', 'sroi', 'social return on investment', 'donor report',
    ],
    answer: 'Foundations and community grantmakers use Lumecon to show donors and boards what their dollars actually moved: jobs supported, wages generated, local business activity, regional ripple effects. The platform produces a defensible economic story alongside the program-outcome narrative, so the annual report reads as evidence rather than anecdote.',
  },
  {
    id: 'bond_measure',
    chip: 'Can we use it for a bond measure?',
    triggers: [
      'bond measure', 'school bond', 'municipal bond', 'infrastructure bond', 'general obligation bond', 'go bond', 'voter bond', 'capital bond', 'bond campaign', 'bond election', 'parks bond', 'transit bond',
    ],
    answer: 'Yes. School districts, transit agencies, parks departments, and municipalities use Lumecon to translate a bond program into the local economic impact voters and oversight boards can recognize: construction jobs, multi-year labor income, supplier spend kept in-region, operating impact once the asset is in service. The output drops into voter information pamphlets, council resolutions, and rating-agency conversations.',
  },
  {
    id: 'compare_implan_workflow',
    chip: 'How is the workflow different?',
    triggers: [
      'workflow', 'day to day', 'in practice', 'what does the work look like', 'what does the workflow', 'how is the workflow', 'how does the work flow', 'replacing my consultant', 'replacing consultants', 'replace consultant',
    ],
    answer: "Legacy path: a consultant or in-house analyst opens the existing platforms — software whose workflow predates the internet — hand-cleans the data, picks multipliers, writes the report, comes back months later. Lumecon path: drop your administrative data into the workspace, let Cedar harmonize and pre-fit the model, review the assumptions Cedar surfaces (with our direct, indirect, induced, and total impact figures verified against the existing platforms), approve or adjust each one, export the report. The economist's judgment stays in the loop. The data wrangling and re-runs don't. Minutes, not months.",
  },
  {
    id: 'roi_lumecon',
    chip: 'What does Lumecon cost vs. the alternative?',
    triggers: [
      'cost vs', 'vs hiring a consultant', 'cheaper than a consultant', 'roi of', 'return on lumecon', 'is this worth it', 'why pay for this', 'why subscribe', 'cost of doing nothing', 'budget for impact', 'price compared to', 'savings vs',
    ],
    answer: "A single legacy impact study typically runs $50K to $150K and ships months later. Lumecon is five figures a year for unlimited studies across every geography. The legacy price tag is what a workflow looks like after forty years of one toolchain owning the category — not a measure of how hard the work actually is. The math is mainstream economics; the public BEA accounts behind it are free. Payback is usually one or two studies; after that the subscription is producing analyses the organization couldn't have afforded one-off.",
  },
  {
    id: 'data_residency',
    chip: 'Where is the data hosted?',
    triggers: [
      'where is the data hosted', 'data residency', 'data location', 'where do you store', 'aws', 'cloud provider', 'us cloud', 'us only', 'fedramp', 'govcloud', 'hipaa', 'compliance', 'compliant', 'soc 2', 'soc2', 'iso 27001', 'storage location', 'data center',
    ],
    answer: 'Lumecon runs on US-region cloud infrastructure with role-based access controls, encryption in transit and at rest, and a single-tenant workspace per organization. For pilots with sensitive procurement or compliance requirements (FedRAMP, HIPAA-adjacent, state PIIA, tribal data sovereignty), the team will walk through the specifics before any data leaves your environment.',
  },
  {
    id: 'onboarding',
    chip: 'How does onboarding work?',
    triggers: [
      'how do i get started', 'how do we get started', 'onboarding', 'onboard', 'getting started', 'first study', 'first project', 'kick off', 'kickoff', 'how does setup work', 'how long is setup', 'training',
    ],
    answer: 'Onboarding is a short kick-off call to scope the first study, then your team uploads the data you already have (budgets, payroll, program records). Cedar walks you through harmonization and surfaces every assumption before the first study runs. Once the data is in, the first defensible study comes back in minutes.',
  },
  {
    id: 'confused',
    chip: null,
    triggers: [
      'help', "i'm confused", 'what should i ask', "i don't know where to start", 'guide me', 'not sure what i need', 'i just want to know more', 'where do i start',
    ],
    answer: 'No problem. A few good places to start: ask what Lumecon does, who the platform is for, how economic impact analysis works, or how to contact the team. If you have a specific project or organization in mind, you can also describe what you are trying to measure.',
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
    answer: "Hi, I'm Cedar. I can help with questions about Lumecon, economic impact reporting, the Tribal and Local Economic Impact platforms, demos, partnerships, and how to contact the team. What would you like to know?",
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
