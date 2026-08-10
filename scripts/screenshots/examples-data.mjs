// Example library for the homepage screenshot system.
//
// Ten fictional but internally coherent case studies. Each example is one
// organization with TWO related analyses over time (A = earlier, B = current),
// so the Comparison archetype tells a plausible story: renovation then
// expansion, phase one then phase two, pilot then statewide program, earlier
// fiscal year then later fiscal year. Never the same event with the year
// swapped.
//
// Coherence rules, enforced by assertions at module load:
//   GDP contribution (value added) = vaShare of output (~49.4%)
//   labor income = liShare of value added, tuned per project so income per
//     job is plausible for the industry (childcare ~$35k, semiconductors ~$100k)
//   effects split 60/25/15 direct/indirect/induced statewide (multiplier 1.67),
//     70/18/12 on reservation scope (local capture is mostly the direct work)
//   tax = 12% of output split 55/30/15 federal/state/(tribal_)local
//   entity and industry tables cross-foot to the headline totals exactly
//   B beats A on every headline metric (later project is the bigger one)
//   reservation scope = a conservative share of statewide, never the majority

export const USER = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'wassily.leontief@edo.example',
  createdAt: '2025-11-04T16:22:10.000Z',
  name: 'Wassily Leontief',
  organization: 'Economic Development Office',
  role: 'Economic Development Director',
  oauthProvider: null,
  emailVerified: true,
  hasPassword: true,
  workspaceTier: 'tree',
  deletedAt: null,
  needsOnboarding: false,
  workspace: {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Economic Development Office',
    slug: 'economic-development-office',
    isPersonal: false,
  },
  cedarEntitled: true,
  cedarChatConfigured: true,
  cedarDocumentImportEntitled: true,
  cedarDocumentImportAvailable: true,
};

// ---------------------------------------------------------------------------

function splitBy(total, weights) {
  const out = weights.map((w) => Math.round(total * w));
  out[out.length - 1] = total - out.slice(0, -1).reduce((a, b) => a + b, 0);
  return out;
}

const STATE_EFFECTS = [0.6, 0.25, 0.15];
const RESERVATION_EFFECTS = [0.7, 0.18, 0.12];

export const EXAMPLES = [
  {
    id: 'college',
    label: 'Community college, Connecticut',
    location: 'Connecticut',
    businessType: 'Nonprofit education',
    firstView: 'results',
    vaShare: 0.494,
    runs: {
      a: {
        name: 'Campus Renovation',
        year: 2023,
        jobs: 480,
        output: 89_500_000,
        liShare: 0.635,
        entities: [
          { name: 'Renovation construction', category: 'Construction', w: 0.62 },
          { name: 'Campus systems and equipment', category: 'Specialty trades', w: 0.24 },
          { name: 'Temporary operations support', category: 'Program services', w: 0.14 },
        ],
        industries: [
          { name: 'Construction', code: '23', w: 0.55 },
          { name: 'Educational services', code: '61', w: 0.2 },
          { name: 'Professional services', code: '54', w: 0.15 },
          { name: 'Retail trade', code: '44', w: 0.1 },
        ],
      },
      b: {
        name: 'Campus Expansion',
        year: 2025,
        jobs: 1140,
        output: 214_300_000,
        liShare: 0.635,
        entities: [
          { name: 'Academic operations', category: 'Educational services', w: 0.6 },
          { name: 'Student and campus spending', category: 'Local spending', w: 0.26 },
          { name: 'Construction and facilities', category: 'Construction', w: 0.14 },
        ],
        industries: [
          { name: 'Educational services', code: '61', w: 0.6 },
          { name: 'Food services and accommodation', code: '72', w: 0.19 },
          { name: 'Retail trade', code: '44', w: 0.12 },
          { name: 'Construction', code: '23', w: 0.09 },
        ],
      },
    },
  },
  {
    id: 'datacenter',
    label: 'Data center campus, Georgia',
    location: 'Georgia',
    businessType: 'Data center construction',
    firstView: 'map',
    vaShare: 0.494,
    runs: {
      a: {
        name: 'Data Center Campus Phase I',
        year: 2023,
        jobs: 2300,
        output: 760_000_000,
        liShare: 0.52,
        entities: [
          { name: 'Site construction', category: 'Construction', w: 0.6 },
          { name: 'Electrical and mechanical systems', category: 'Specialty trades', w: 0.27 },
          { name: 'Network equipment installation', category: 'Technology', w: 0.13 },
        ],
        industries: [
          { name: 'Construction', code: '23', w: 0.55 },
          { name: 'Electrical equipment', code: '335', w: 0.2 },
          { name: 'Professional services', code: '54', w: 0.15 },
          { name: 'Wholesale and retail trade', code: '42', w: 0.1 },
        ],
      },
      b: {
        name: 'Data Center Campus Phase II',
        year: 2025,
        jobs: 4150,
        output: 1_420_000_000,
        liShare: 0.52,
        entities: [
          { name: 'Site construction', category: 'Construction', w: 0.62 },
          { name: 'Electrical and mechanical systems', category: 'Specialty trades', w: 0.26 },
          { name: 'Network equipment installation', category: 'Technology', w: 0.12 },
        ],
        industries: [
          { name: 'Construction', code: '23', w: 0.55 },
          { name: 'Electrical equipment', code: '335', w: 0.2 },
          { name: 'Professional services', code: '54', w: 0.15 },
          { name: 'Wholesale and retail trade', code: '42', w: 0.1 },
        ],
      },
    },
  },
  {
    id: 'hospital',
    label: 'Tribal health system, Warm Springs, Oregon',
    location: 'Warm Springs, OR',
    businessType: 'Healthcare construction',
    firstView: 'results',
    vaShare: 0.494,
    reservationShare: 0.32,
    tribalTax: true,
    runs: {
      a: {
        name: 'Health Clinic Construction',
        year: 2022,
        jobs: 410,
        output: 58_200_000,
        liShare: 0.7,
        entities: [
          { name: 'Clinic construction', category: 'Construction', w: 0.68 },
          { name: 'Medical equipment fit-out', category: 'Healthcare equipment', w: 0.19 },
          { name: 'Site and utilities', category: 'Heavy civil', w: 0.13 },
        ],
        industries: [
          { name: 'Construction', code: '23', w: 0.6 },
          { name: 'Health care and social assistance', code: '62', w: 0.22 },
          { name: 'Professional services', code: '54', w: 0.18 },
        ],
      },
      b: {
        name: 'Regional Hospital Construction',
        year: 2025,
        jobs: 1240,
        output: 186_400_000,
        liShare: 0.7,
        entities: [
          { name: 'Facility construction', category: 'Construction', w: 0.66 },
          { name: 'Medical equipment fit-out', category: 'Healthcare equipment', w: 0.2 },
          { name: 'Workforce training', category: 'Education and training', w: 0.14 },
        ],
        industries: [
          { name: 'Construction', code: '23', w: 0.6 },
          { name: 'Health care and social assistance', code: '62', w: 0.22 },
          { name: 'Professional services', code: '54', w: 0.18 },
        ],
      },
    },
  },
  {
    id: 'fab',
    label: 'Semiconductor fabs, Texas',
    location: 'Texas',
    businessType: 'Advanced manufacturing',
    firstView: 'map',
    vaShare: 0.494,
    runs: {
      a: {
        name: 'Fab One Construction',
        year: 2022,
        jobs: 5100,
        output: 1_840_000_000,
        liShare: 0.55,
        entities: [
          { name: 'Fab construction', category: 'Construction', w: 0.6 },
          { name: 'Cleanroom systems', category: 'Specialty trades', w: 0.26 },
          { name: 'Site infrastructure', category: 'Heavy civil', w: 0.14 },
        ],
        industries: [
          { name: 'Construction', code: '23', w: 0.45 },
          { name: 'Computer and electronic products', code: '334', w: 0.3 },
          { name: 'Professional services', code: '54', w: 0.15 },
          { name: 'Transportation and warehousing', code: '48', w: 0.1 },
        ],
      },
      b: {
        name: 'Fab Two Expansion',
        year: 2025,
        jobs: 7800,
        output: 2_860_000_000,
        liShare: 0.55,
        entities: [
          { name: 'Fab construction', category: 'Construction', w: 0.58 },
          { name: 'Cleanroom systems', category: 'Specialty trades', w: 0.27 },
          { name: 'Supplier onboarding', category: 'Manufacturing', w: 0.15 },
        ],
        industries: [
          { name: 'Construction', code: '23', w: 0.45 },
          { name: 'Computer and electronic products', code: '334', w: 0.3 },
          { name: 'Professional services', code: '54', w: 0.15 },
          { name: 'Transportation and warehousing', code: '48', w: 0.1 },
        ],
      },
    },
  },
  {
    id: 'ports',
    label: 'Port authority, California',
    location: 'California',
    businessType: 'Public infrastructure',
    firstView: 'map',
    vaShare: 0.494,
    runs: {
      a: {
        name: 'Terminal Modernization Phase I',
        year: 2022,
        jobs: 3400,
        output: 742_000_000,
        liShare: 0.58,
        entities: [
          { name: 'Terminal upgrades', category: 'Construction', w: 0.62 },
          { name: 'Crane and equipment installation', category: 'Specialty trades', w: 0.23 },
          { name: 'Dredging', category: 'Heavy civil', w: 0.15 },
        ],
        industries: [
          { name: 'Construction', code: '23', w: 0.5 },
          { name: 'Transportation and warehousing', code: '48', w: 0.3 },
          { name: 'Professional services', code: '54', w: 0.2 },
        ],
      },
      b: {
        name: 'Rail Corridor and Terminal Phase II',
        year: 2025,
        jobs: 5200,
        output: 1_150_000_000,
        liShare: 0.58,
        entities: [
          { name: 'Terminal upgrades', category: 'Construction', w: 0.55 },
          { name: 'Dredging and rail links', category: 'Heavy civil', w: 0.3 },
          { name: 'Operations ramp', category: 'Logistics', w: 0.15 },
        ],
        industries: [
          { name: 'Construction', code: '23', w: 0.5 },
          { name: 'Transportation and warehousing', code: '48', w: 0.3 },
          { name: 'Professional services', code: '54', w: 0.2 },
        ],
      },
    },
  },
  {
    id: 'childcare',
    label: 'Early learning nonprofit, Michigan',
    location: 'Michigan',
    businessType: 'Nonprofit social services',
    firstView: 'results',
    vaShare: 0.494,
    runs: {
      a: {
        name: 'Childcare Access Pilot',
        year: 2023,
        jobs: 1900,
        output: 178_000_000,
        liShare: 0.75,
        entities: [
          { name: 'Provider subsidies', category: 'Social assistance', w: 0.64 },
          { name: 'Facility upgrades', category: 'Construction', w: 0.2 },
          { name: 'Program administration', category: 'Program services', w: 0.16 },
        ],
        industries: [
          { name: 'Health care and social assistance', code: '62', w: 0.55 },
          { name: 'Construction', code: '23', w: 0.2 },
          { name: 'Food services and accommodation', code: '72', w: 0.15 },
          { name: 'Retail trade', code: '44', w: 0.1 },
        ],
      },
      b: {
        name: 'Statewide Childcare Access Program',
        year: 2025,
        jobs: 6800,
        output: 640_000_000,
        liShare: 0.75,
        entities: [
          { name: 'Provider subsidies', category: 'Social assistance', w: 0.6 },
          { name: 'New facility capacity', category: 'Construction', w: 0.25 },
          { name: 'Workforce participation support', category: 'Program services', w: 0.15 },
        ],
        industries: [
          { name: 'Health care and social assistance', code: '62', w: 0.55 },
          { name: 'Construction', code: '23', w: 0.2 },
          { name: 'Food services and accommodation', code: '72', w: 0.15 },
          { name: 'Retail trade', code: '44', w: 0.1 },
        ],
      },
    },
  },
  {
    id: 'recovery',
    label: 'Hurricane recovery, Florida',
    location: 'Florida',
    businessType: 'Disaster recovery',
    firstView: 'map',
    vaShare: 0.494,
    runs: {
      a: {
        name: 'Emergency Repair Program',
        year: 2023,
        jobs: 2750,
        output: 441_000_000,
        liShare: 0.64,
        entities: [
          { name: 'Residential repairs', category: 'Construction', w: 0.55 },
          { name: 'Public works repair', category: 'Heavy civil', w: 0.3 },
          { name: 'Debris removal and stabilization', category: 'Program services', w: 0.15 },
        ],
        industries: [
          { name: 'Construction', code: '23', w: 0.6 },
          { name: 'Retail trade', code: '44', w: 0.2 },
          { name: 'Professional services', code: '54', w: 0.2 },
        ],
      },
      b: {
        name: 'Rebuild and Resilience Program',
        year: 2025,
        jobs: 6100,
        output: 980_000_000,
        liShare: 0.64,
        entities: [
          { name: 'Residential rebuild', category: 'Construction', w: 0.5 },
          { name: 'Public works repair', category: 'Heavy civil', w: 0.3 },
          { name: 'Business recovery grants', category: 'Program services', w: 0.2 },
        ],
        industries: [
          { name: 'Construction', code: '23', w: 0.6 },
          { name: 'Retail trade', code: '44', w: 0.2 },
          { name: 'Professional services', code: '54', w: 0.2 },
        ],
      },
    },
  },
  {
    id: 'research',
    label: 'University research campus, Ohio',
    location: 'Ohio',
    businessType: 'Higher education research',
    firstView: 'results',
    vaShare: 0.494,
    runs: {
      a: {
        name: 'Research Laboratory Construction',
        year: 2022,
        jobs: 1350,
        output: 318_000_000,
        liShare: 0.58,
        entities: [
          { name: 'Laboratory construction', category: 'Construction', w: 0.7 },
          { name: 'Scientific equipment', category: 'Technology', w: 0.2 },
          { name: 'Enabling infrastructure', category: 'Heavy civil', w: 0.1 },
        ],
        industries: [
          { name: 'Construction', code: '23', w: 0.55 },
          { name: 'Professional and scientific services', code: '54', w: 0.25 },
          { name: 'Educational services', code: '61', w: 0.2 },
        ],
      },
      b: {
        name: 'Research Campus Operations',
        year: 2025,
        jobs: 3050,
        output: 720_000_000,
        liShare: 0.72,
        entities: [
          { name: 'Research operations', category: 'Research and development', w: 0.5 },
          { name: 'Startup and spinout activity', category: 'Technology', w: 0.25 },
          { name: 'Campus build-out', category: 'Construction', w: 0.25 },
        ],
        industries: [
          { name: 'Professional and scientific services', code: '54', w: 0.45 },
          { name: 'Educational services', code: '61', w: 0.3 },
          { name: 'Construction', code: '23', w: 0.25 },
        ],
      },
    },
  },
  {
    id: 'wind',
    label: 'Wind energy developer, Iowa',
    location: 'Iowa',
    businessType: 'Clean energy',
    firstView: 'map',
    vaShare: 0.494,
    runs: {
      a: {
        name: 'Wind Farm Phase I',
        year: 2022,
        jobs: 1150,
        output: 366_000_000,
        liShare: 0.5,
        entities: [
          { name: 'Turbine installation', category: 'Construction', w: 0.62 },
          { name: 'Grid interconnection', category: 'Utilities', w: 0.24 },
          { name: 'Roads and foundations', category: 'Heavy civil', w: 0.14 },
        ],
        industries: [
          { name: 'Construction', code: '23', w: 0.5 },
          { name: 'Utilities', code: '22', w: 0.3 },
          { name: 'Machinery manufacturing', code: '333', w: 0.2 },
        ],
      },
      b: {
        name: 'Wind Farm Phase II and Storage',
        year: 2025,
        jobs: 2600,
        output: 830_000_000,
        liShare: 0.5,
        entities: [
          { name: 'Turbine and storage installation', category: 'Construction', w: 0.6 },
          { name: 'Grid interconnection', category: 'Utilities', w: 0.25 },
          { name: 'Operations and maintenance ramp', category: 'Utilities', w: 0.15 },
        ],
        industries: [
          { name: 'Construction', code: '23', w: 0.5 },
          { name: 'Utilities', code: '22', w: 0.3 },
          { name: 'Machinery manufacturing', code: '333', w: 0.2 },
        ],
      },
    },
  },
  {
    id: 'nation',
    label: 'Tribal Nation economic footprint, Tulalip, Washington',
    location: 'Tulalip, WA',
    businessType: 'Diversified enterprises',
    studyType: 'whole_nation',
    firstView: 'results',
    vaShare: 0.494,
    reservationShare: 0.4,
    tribalTax: true,
    runs: {
      a: {
        name: 'FY2023 Nation Economic Footprint',
        year: 2023,
        jobs: 3890,
        output: 925_000_000,
        liShare: 0.52,
        entities: [
          { name: 'Resort and gaming operations', category: 'Gaming and hospitality', w: 0.49 },
          { name: 'Retail village and leasing', category: 'Retail trade', w: 0.31 },
          { name: 'Government and member services', category: 'Public administration', w: 0.2 },
        ],
        industries: [
          { name: 'Amusement, gambling and recreation', code: '713', w: 0.49 },
          { name: 'Retail trade', code: '44', w: 0.31 },
          { name: 'Public administration', code: '92', w: 0.12 },
          { name: 'Construction', code: '23', w: 0.08 },
        ],
      },
      b: {
        name: 'FY2025 Nation Economic Footprint',
        year: 2025,
        jobs: 4820,
        output: 1_240_500_000,
        liShare: 0.52,
        entities: [
          { name: 'Resort and gaming operations', category: 'Gaming and hospitality', w: 0.49 },
          { name: 'Retail village and leasing', category: 'Retail trade', w: 0.31 },
          { name: 'Government and member services', category: 'Public administration', w: 0.2 },
        ],
        industries: [
          { name: 'Amusement, gambling and recreation', code: '713', w: 0.49 },
          { name: 'Retail trade', code: '44', w: 0.31 },
          { name: 'Public administration', code: '92', w: 0.12 },
          { name: 'Construction', code: '23', w: 0.08 },
        ],
      },
    },
  },
];

// ---------------------------------------------------------------------------
// Generate PROJECTS / RUNS / RESULTS payloads from the library.

export const PROJECTS = [];
export const RUNS = {};
export const RESULTS = {};

function baselineFor(year) {
  return `BEA-IO-${year - 1}-Q4`;
}

function buildRun(example, key) {
  const run = example.runs[key];
  const projectId = `p-${example.id}-${key}`;
  const runId = `r-${example.id}-${key}`;
  const { vaShare, reservationShare } = example;
  const gdp = Math.round(run.output * vaShare);
  const li = Math.round(gdp * run.liShare);

  const scopes = [['state', 1, STATE_EFFECTS]];
  if (reservationShare) scopes.push(['reservation', reservationShare, RESERVATION_EFFECTS]);

  const heads = {};
  const by_entity = [];
  const by_effect = [];
  const by_industry = [];
  const by_tax = [];
  for (const [scope, f, effects] of scopes) {
    const o = Math.round(run.output * f);
    const j = Math.round(run.jobs * f);
    const g = Math.round(gdp * f);
    const l = Math.round(li * f);
    heads[scope] = { jobs_supported: j, gdp_contribution: g, labor_income: l, output: o };

    const ew = run.entities.map((e) => e.w);
    const eo = splitBy(o, ew);
    const ej = splitBy(j, ew);
    const eg = splitBy(g, ew);
    const el = splitBy(l, ew);
    run.entities.forEach((e, i) =>
      by_entity.push({
        scope,
        entity_id: `${example.id}-${key}-e${i}`,
        entity_name: e.name,
        category: e.category,
        output_impact: eo[i],
        value_added_impact: eg[i],
        employment_impact: ej[i],
        labor_income_impact: el[i],
      }),
    );

    const fo = splitBy(o, effects);
    const fj = splitBy(j, effects);
    const fg = splitBy(g, effects);
    ['direct', 'indirect', 'induced'].forEach((t, i) =>
      by_effect.push({
        scope,
        effect_type: t,
        output_impact: fo[i],
        value_added_impact: fg[i],
        employment_impact: fj[i],
      }),
    );

    const iw = run.industries.map((x) => x.w);
    const io = splitBy(o, iw);
    const ij = splitBy(j, iw);
    const ig = splitBy(g, iw);
    run.industries.forEach((x, i) =>
      by_industry.push({
        scope,
        sector_code: x.code,
        sector_name: x.name,
        output_impact: io[i],
        value_added_impact: ig[i],
        employment_impact: ij[i],
      }),
    );

    const tax = Math.round(o * 0.12);
    const parts = splitBy(tax, [0.55, 0.3, 0.15]);
    by_tax.push(
      { scope, level_of_government: 'federal', tax_impact: parts[0] },
      { scope, level_of_government: 'state', tax_impact: parts[1] },
      {
        scope,
        level_of_government: example.tribalTax ? 'tribal_local' : 'local',
        tax_impact: parts[2],
      },
    );
  }

  const completedAt = `${run.year + 1}-02-10T15:00:00.000Z`;
  PROJECTS.push({
    id: projectId,
    name: run.name,
    ownerId: USER.id,
    organizationId: USER.workspace.id,
    analysisYear: run.year,
    archivedAt: null,
    createdAt: `${run.year + 1}-02-10T14:40:00.000Z`,
    updatedAt: completedAt,
    projectData: {
      location: example.location,
      businessType: example.businessType,
      studyType: example.studyType || 'enterprise',
    },
    latestRunId: runId,
    latestRunStatus: 'completed',
    latestRunCompletedAt: completedAt,
    latestRunOutputs: heads.state,
  });
  RUNS[runId] = {
    id: runId,
    projectId,
    status: 'completed',
    requestPayload: {},
    resultPayload: null,
    errorMessage: null,
    createdAt: `${run.year + 1}-02-10T14:59:48.000Z`,
    startedAt: `${run.year + 1}-02-10T14:59:49.000Z`,
    completedAt,
  };
  RESULTS[runId] = {
    run_id: runId,
    project_id: projectId,
    status: 'success',
    outputs: heads,
    tables: { by_entity, by_effect, by_industry, by_tax },
    metadata: {
      baseline_version: baselineFor(run.year),
      engine_mode: 'production',
      enterprise_coding_source: 'naics_2022',
      timestamp_utc: completedAt,
      project_name: run.name,
    },
    audit: { warnings: [], assumptions: [] },
  };
  return { projectId, runId, heads };
}

export const CAPTURE_TARGETS = EXAMPLES.map((example) => {
  const a = buildRun(example, 'a');
  const b = buildRun(example, 'b');
  return { id: example.id, firstView: example.firstView, label: example.label, a, b, example };
});

// ---------------------------------------------------------------------------
// Numerical plausibility audit. The module refuses to load if any example
// stops behaving like a credible analysis, so a bad edit can never reach a
// screenshot.

function fail(msg) {
  throw new Error(`examples-data audit: ${msg}`);
}

for (const t of CAPTURE_TARGETS) {
  const { example } = t;
  for (const key of ['a', 'b']) {
    const run = example.runs[key];
    const runId = `r-${example.id}-${key}`;
    const res = RESULTS[runId];
    const sumW = (list) => list.reduce((s, x) => s + x.w, 0);
    if (Math.abs(sumW(run.entities) - 1) > 1e-9)
      fail(`${runId}: entity weights sum to ${sumW(run.entities)}`);
    if (Math.abs(sumW(run.industries) - 1) > 1e-9)
      fail(`${runId}: industry weights sum to ${sumW(run.industries)}`);

    for (const [scope, head] of Object.entries(res.outputs)) {
      const rows = (table) => res.tables[table].filter((r) => r.scope === scope);
      const sum = (table, field) => rows(table).reduce((s, r) => s + r[field], 0);
      if (sum('by_entity', 'output_impact') !== head.output)
        fail(`${runId}/${scope}: entity output does not cross-foot`);
      if (sum('by_entity', 'employment_impact') !== head.jobs_supported)
        fail(`${runId}/${scope}: entity jobs do not cross-foot`);
      if (sum('by_effect', 'output_impact') !== head.output)
        fail(`${runId}/${scope}: effects output does not cross-foot`);
      if (sum('by_effect', 'employment_impact') !== head.jobs_supported)
        fail(`${runId}/${scope}: effects jobs do not cross-foot`);
      if (sum('by_industry', 'output_impact') !== head.output)
        fail(`${runId}/${scope}: industry output does not cross-foot`);
      const direct = rows('by_effect').find((r) => r.effect_type === 'direct').output_impact;
      const indirect = rows('by_effect').find((r) => r.effect_type === 'indirect').output_impact;
      const induced = rows('by_effect').find((r) => r.effect_type === 'induced').output_impact;
      if (!(direct > indirect && indirect > induced))
        fail(`${runId}/${scope}: effect ordering implausible`);
      const multiplier = head.output / direct;
      if (multiplier < 1.3 || multiplier > 2.1)
        fail(`${runId}/${scope}: multiplier ${multiplier.toFixed(2)} implausible`);
      if (head.gdp_contribution >= head.output) fail(`${runId}/${scope}: GDP >= output`);
      if (head.labor_income >= head.gdp_contribution)
        fail(`${runId}/${scope}: labor income >= GDP`);
      const tax = sum('by_tax', 'tax_impact');
      if (Math.abs(tax - Math.round(head.output * 0.12)) > 2)
        fail(`${runId}/${scope}: tax total off`);
      const incomePerJob = head.labor_income / head.jobs_supported;
      if (incomePerJob < 28_000 || incomePerJob > 130_000)
        fail(`${runId}/${scope}: income per job $${Math.round(incomePerJob)} implausible`);
      const outputPerJob = head.output / head.jobs_supported;
      if (outputPerJob < 60_000 || outputPerJob > 450_000)
        fail(`${runId}/${scope}: output per job $${Math.round(outputPerJob)} implausible`);
    }
    if (example.reservationShare) {
      if (example.reservationShare > 0.5)
        fail(`${example.id}: reservation retention over half of statewide`);
      if (!res.outputs.reservation) fail(`${runId}: reservation scope missing`);
    }
  }
  // The later analysis is the bigger one, on every headline metric.
  for (const k of ['jobs_supported', 'gdp_contribution', 'labor_income', 'output']) {
    if (!(t.b.heads.state[k] > t.a.heads.state[k]))
      fail(`${example.id}: B does not exceed A on ${k}`);
  }
  if (!(example.runs.b.year > example.runs.a.year)) fail(`${example.id}: years out of order`);
  if (example.runs.b.name === example.runs.a.name)
    fail(`${example.id}: comparison repeats the same project name`);
  if (!['results', 'map'].includes(example.firstView)) fail(`${example.id}: bad firstView`);
}

const states = new Set(EXAMPLES.map((e) => e.location));
if (states.size !== EXAMPLES.length) fail('two examples share a geography');
