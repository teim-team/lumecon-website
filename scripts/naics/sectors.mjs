/**
 * The two-digit NAICS sectors as Lumecon presents them, plus the platform's
 * own tribal government category. This file is the single source for the
 * /naics page, the duotone thumbnail pipeline and any study-thumbnail
 * assignment, so a sector's slug, wash color and description can never
 * drift between surfaces.
 *
 * WASH COLOR RULE: each sector's wash is assigned to suit its
 * photograph (grass and crops sit in green, brick and earth in bronze,
 * warm interiors in gold, water, steel and clinical light in teal)
 * while keeping the four colors roughly equal across the set, so the
 * grid still alternates. The wash is part of the sector's identity:
 * the /naics tile, the in-app sector guide and the study-card cover
 * all use the same color for the same sector. The four ramps are the
 * duotone schemes from the NACA proposal's imgsystem.py, sampled from
 * its cover photographs; the "gold" ramp is the amber data-accent
 * family, not the brand-only wordmark gold (BRAND.md).
 */

// Duotone ramps, shadow -> highlight, exactly as the proposal maps the
// 0-255 tone ramp. Highlights stay muted (no white point), which is what
// gives the treatment its matte, printed feel. `mid` is the ramp's
// midpoint, precomputed for UI accents like tile bars.
const ramp2 = (shadow, highlight) => ({
  shadow,
  highlight,
  mid: shadow.map((s, i) => Math.round(s + (highlight[i] - s) / 2)),
});
export const WASHES = {
  teal: ramp2([9, 68, 74], [134, 191, 186]), // #09444A -> #86BFBA
  bronze: ramp2([49, 32, 34], [170, 151, 142]), // #312022 -> #AA978E
  gold: ramp2([117, 87, 34], [241, 210, 147]), // #755722 -> #F1D293
  green: ramp2([31, 60, 54], [133, 160, 146]), // #1F3C36 -> #85A092
};

// Descriptions are the hover text on /naics: plain language about what an
// organization in the sector actually does, written to the site copy rules.
// The fifth column is the wash, chosen for the sector's photograph:
// balance is 5 teal, 5 bronze, 6 gold, 5 green across the 21 tiles.
const RAW = [
  ['11', 'agriculture', 'Agriculture, Forestry, Fishing and Hunting', 'Farms, ranches, timber operations, fisheries and support services like crop dusting and farm labor contracting.', 'green'],
  ['21', 'mining', 'Mining, Quarrying, and Oil and Gas Extraction', 'Oil and gas wells, coal and mineral mines, quarries and the drilling and field services that keep them producing.', 'bronze'],
  ['22', 'utilities', 'Utilities', 'Electric power generation and delivery, natural gas distribution, water systems and sewage treatment.', 'gold'],
  ['23', 'construction', 'Construction', 'General contractors, homebuilders, heavy and civil work like roads and bridges, and specialty trades from electrical to roofing.', 'teal'],
  ['31-33', 'manufacturing', 'Manufacturing', 'Plants that turn materials into products: food processing, wood and metal fabrication, machinery, electronics and everything between.', 'teal'],
  ['42', 'wholesale', 'Wholesale Trade', 'Distributors that sell goods to businesses rather than consumers, from building supplies to grocery wholesalers.', 'bronze'],
  ['44-45', 'retail', 'Retail Trade', 'Stores and dealers that sell to the public: groceries, gas stations, auto dealers, clothing and online sellers.', 'gold'],
  ['48-49', 'transportation', 'Transportation and Warehousing', 'Trucking, air and rail carriers, transit systems, pipelines, couriers and the warehouses that hold freight between trips.', 'teal'],
  ['51', 'information', 'Information', 'Software publishers, telecommunications, data centers and hosting, broadcasting and media production.', 'green'],
  ['52', 'finance', 'Finance and Insurance', 'Banks and credit unions, lenders, insurance carriers and agencies, and investment firms.', 'green'],
  ['53', 'realestate', 'Real Estate and Rental and Leasing', 'Property owners and managers, real estate agents, and rental businesses from apartments to equipment yards.', 'bronze'],
  ['54', 'professional', 'Professional, Scientific, and Technical Services', 'Engineering and architecture firms, lawyers, accountants, consultants, research labs and IT services.', 'gold'],
  ['55', 'management', 'Management of Companies and Enterprises', 'Holding companies and corporate offices that oversee other establishments of the same enterprise.', 'bronze'],
  ['56', 'administrative', 'Administrative and Support and Waste Management', 'Staffing agencies, janitorial and landscaping crews, security services, call centers and waste collection.', 'green'],
  ['61', 'education', 'Educational Services', 'Schools, colleges and universities, tribal colleges, training centers and tutoring providers.', 'gold'],
  ['62', 'healthcare', 'Health Care and Social Assistance', 'Hospitals, clinics, dental and behavioral health practices, nursing care, child care and social services.', 'teal'],
  ['71', 'arts', 'Arts, Entertainment, and Recreation', 'Museums and cultural centers, performing arts, sports and recreation businesses, casinos without hotels among them.', 'gold'],
  ['72', 'hospitality', 'Accommodation and Food Services', 'Hotels, casino hotels, RV parks, restaurants, caterers and bars.', 'bronze'],
  ['81', 'otherservices', 'Other Services (except Public Administration)', 'Repair shops, personal care, religious and civic organizations, and similar services that fit nowhere else.', 'gold'],
  ['92', 'publicadmin', 'Public Administration', 'Government at every level: executive and legislative offices, courts, public safety, and program administration.', 'green'],
];

export const SECTORS = RAW.map(([code, slug, title, description, wash]) => ({
  code,
  slug,
  title,
  description,
  wash,
}));

// Lumecon's own category, alongside NAICS rather than inside it. Tribal
// governments blend public administration with enterprise operations and
// community services, so a single NAICS 92 label would understate them.
// Teal: the regalia photograph carries the brand color best.
export const TRIBAL_GOVERNMENT = {
  code: 'TG',
  slug: 'tribalgov',
  title: 'Tribal Government',
  description:
    'A Lumecon category for tribal nations as operating governments: administration, enterprises, housing, health, education and cultural programs, tracked together rather than scattered across NAICS codes.',
  wash: 'teal',
};
