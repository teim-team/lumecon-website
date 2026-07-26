/**
 * The two-digit NAICS sectors as Lumecon presents them, plus the platform's
 * own tribal government category. This file is the single source for the
 * /naics page, the duotone thumbnail pipeline and any study-thumbnail
 * assignment, so a sector's slug, wash color and description can never
 * drift between surfaces.
 *
 * WASH COLOR RULE (deterministic, no per-image judgment): sectors are
 * ordered by NAICS code and washed in a repeating four-color cycle of
 * brand colors: teal, ink, amber, cedar. If two sector thumbnails ever sit
 * side by side in code order, their washes differ. Gold is brand-only per
 * BRAND.md and is never used as a wash.
 */

// Duotone ramps: every wash maps grayscale into [shadow -> mid -> paper].
// Shadows carry the hue's deepest usable shade, highlights stay just off
// paper so tiles read as one family with the white site around them.
export const WASHES = {
  teal: { shadow: [6, 51, 47], mid: [15, 156, 143], paper: [235, 250, 248] },
  ink: { shadow: [7, 10, 26], mid: [58, 66, 106], paper: [237, 239, 246] },
  amber: { shadow: [61, 36, 6], mid: [186, 117, 32], paper: [250, 243, 232] },
  cedar: { shadow: [5, 43, 25], mid: [17, 128, 76], paper: [234, 247, 239] },
};

const CYCLE = ['teal', 'ink', 'amber', 'cedar'];

// Descriptions are the hover text on /naics: plain language about what an
// organization in the sector actually does, written to the site copy rules.
const RAW = [
  ['11', 'agriculture', 'Agriculture, Forestry, Fishing and Hunting', 'Farms, ranches, timber operations, fisheries and support services like crop dusting and farm labor contracting.'],
  ['21', 'mining', 'Mining, Quarrying, and Oil and Gas Extraction', 'Oil and gas wells, coal and mineral mines, quarries and the drilling and field services that keep them producing.'],
  ['22', 'utilities', 'Utilities', 'Electric power generation and delivery, natural gas distribution, water systems and sewage treatment.'],
  ['23', 'construction', 'Construction', 'General contractors, homebuilders, heavy and civil work like roads and bridges, and specialty trades from electrical to roofing.'],
  ['31-33', 'manufacturing', 'Manufacturing', 'Plants that turn materials into products: food processing, wood and metal fabrication, machinery, electronics and everything between.'],
  ['42', 'wholesale', 'Wholesale Trade', 'Distributors that sell goods to businesses rather than consumers, from building supplies to grocery wholesalers.'],
  ['44-45', 'retail', 'Retail Trade', 'Stores and dealers that sell to the public: groceries, gas stations, auto dealers, clothing and online sellers.'],
  ['48-49', 'transportation', 'Transportation and Warehousing', 'Trucking, air and rail carriers, transit systems, pipelines, couriers and the warehouses that hold freight between trips.'],
  ['51', 'information', 'Information', 'Software publishers, telecommunications, data centers and hosting, broadcasting and media production.'],
  ['52', 'finance', 'Finance and Insurance', 'Banks and credit unions, lenders, insurance carriers and agencies, and investment firms.'],
  ['53', 'realestate', 'Real Estate and Rental and Leasing', 'Property owners and managers, real estate agents, and rental businesses from apartments to equipment yards.'],
  ['54', 'professional', 'Professional, Scientific, and Technical Services', 'Engineering and architecture firms, lawyers, accountants, consultants, research labs and IT services.'],
  ['55', 'management', 'Management of Companies and Enterprises', 'Holding companies and corporate offices that oversee other establishments of the same enterprise.'],
  ['56', 'administrative', 'Administrative and Support and Waste Management', 'Staffing agencies, janitorial and landscaping crews, security services, call centers and waste collection.'],
  ['61', 'education', 'Educational Services', 'Schools, colleges and universities, tribal colleges, training centers and tutoring providers.'],
  ['62', 'healthcare', 'Health Care and Social Assistance', 'Hospitals, clinics, dental and behavioral health practices, nursing care, child care and social services.'],
  ['71', 'arts', 'Arts, Entertainment, and Recreation', 'Museums and cultural centers, performing arts, sports and recreation businesses, casinos without hotels among them.'],
  ['72', 'hospitality', 'Accommodation and Food Services', 'Hotels, casino hotels, RV parks, restaurants, caterers and bars.'],
  ['81', 'otherservices', 'Other Services (except Public Administration)', 'Repair shops, personal care, religious and civic organizations, and similar services that fit nowhere else.'],
  ['92', 'publicadmin', 'Public Administration', 'Government at every level: executive and legislative offices, courts, public safety, and program administration.'],
];

export const SECTORS = RAW.map(([code, slug, title, description], i) => ({
  code,
  slug,
  title,
  description,
  wash: CYCLE[i % CYCLE.length],
}));

// Lumecon's own category, alongside NAICS rather than inside it. Tribal
// governments blend public administration with enterprise operations and
// community services, so a single NAICS 92 label would understate them.
// Wash continues the cycle after the 20 sectors (20 % 4 = 0 -> teal).
export const TRIBAL_GOVERNMENT = {
  code: 'TG',
  slug: 'tribalgov',
  title: 'Tribal Government',
  description:
    'A Lumecon category for tribal nations as operating governments: administration, enterprises, housing, health, education and cultural programs, tracked together rather than scattered across NAICS codes.',
  wash: 'teal',
};
