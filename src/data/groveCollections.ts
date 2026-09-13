/**
 * The twelve Lumecon collections a Cedar Grove carries, for the registry on
 * /cedar-grove and the fold on /pricing.
 *
 * The collections are Lumecon's. Cedar Press and Cedar Grove are two channels
 * that carry them, not their origin, so nothing here names a channel as the
 * source of a record.
 *
 * Every line is read from the Lumecon collection catalog and its dataset
 * documentation (`src/features/grove/pressCatalog.js` and `docs/datasets/*`),
 * never written fresh for the website:
 *
 * - `name` and `short` are the catalog's, with the one ampersand spelled out
 *   for displayed copy.
 * - `contributes` is the catalog blurb, shortened; `resolved` is the
 *   catalog's linkage sentence, which is the thing Cedar actually sells.
 * - `coverage` is the catalog's measured floor: a series states the year the
 *   record opens, a roster states the capture date and no year, because its
 *   sources publish who is on the list now and archive nothing.
 * - `sources` names the source systems the dataset documentation names.
 * - `terms` is what the records themselves permit and what they are worth
 *   relying on: whether they are public, who did the resolution work, and the
 *   condition a listing carries where the documentation states one. It names
 *   no shelf and no channel, because a reader of this page is not buying a
 *   shelf and the shelf names are not announced.
 *
 * No update cadence is stated per collection. The documentation records a
 * cadence for prime contracting only (quarterly), and a cadence typed here
 * for the others would be a promise nobody has measured.
 *
 * The marks are the collection icons, transcribed from
 * `src/pages/grove/pressCollectionIcons.jsx`: a 28-unit box, 1.9 stroke,
 * two or three large shapes each, drawn as one family.
 */

export type GroveCollection = {
  id: string;
  short: string;
  name: string;
  contributes: string;
  resolved: string;
  coverage: string;
  sources: string;
  terms: string;
  /** Inner SVG markup for a 28×28 viewBox, stroked in currentColor. */
  mark: string;
};

export const GROVE_COLLECTIONS: GroveCollection[] = [
  {
    id: 'funding',
    short: 'Federal Funding',
    name: 'Federal Funding to Indian Country',
    contributes:
      'Every award the federal government reports sending into Indian Country: grants, loans, direct payments and insurance, award by award.',
    resolved:
      'Recipients resolved to the Native entity behind them, so an award to a subsidiary, a housing authority or a consortium is attributed to the nation or organization it belongs to.',
    coverage: 'Records from fiscal year 2007',
    sources: 'USAspending assistance award archive and API',
    terms: 'Public records. The resolution to Native entities is Lumecon’s work.',
    mark: '<circle cx="11" cy="11" r="7.5"/><path d="M11 6.6v8.8"/><path d="M13 8.3H9.9a1.35 1.35 0 0 0 0 2.7h2.2a1.35 1.35 0 0 1 0 2.7H9"/><path d="m16.4 16.4 7.1 7.1"/>',
  },
  {
    id: 'federal-register',
    short: 'Federal Register',
    name: 'Federal Register',
    contributes:
      'Every notice, rule and comment window touching tribes, lands, water or recognition, caught while there is still time to respond.',
    resolved:
      'Notices matched to the tribes, lands and organizations they name, including entities that appear under former or variant names.',
    coverage: 'Records from 1994',
    sources: 'federalregister.gov API',
    terms: 'Public records. The resolution to Native entities is Lumecon’s work.',
    mark: '<path d="M6 3.5h10l6 6v15H6z"/><path d="M16 3.5V10h6"/><path d="M9.5 14h9M9.5 18h9M9.5 22h5"/>',
  },
  {
    id: 'legislation',
    short: 'Legislation',
    name: 'Congressional Votes and Proposed Legislation',
    contributes:
      'Bills, resolutions and roll-call votes from both chambers, followed from introduction to the floor: who sponsored, who voted and how.',
    resolved:
      'Bills and votes tied to the tribes and Native organizations they affect, not only to the sponsors who filed them.',
    coverage: 'Records from 1973, thin and gapped through the 1980s',
    sources:
      'congress.gov API for bills, actions and cosponsors; House and Senate roll-call records',
    terms: 'Public records. The resolution to Native entities is Lumecon’s work.',
    mark: '<path d="M8 3.5h12v11H8z"/><path d="M11 7.5h6M11 11h4"/><path d="M3.5 17h21v7.5h-21z"/><path d="M11 17v2.5h6V17"/>',
  },
  {
    id: 'deals',
    short: 'Deals',
    name: 'Indian Country Deals',
    contributes:
      'Material transactions and capital commitments involving Native nations, organizations and enterprises: acquisitions, financing, joint ventures and major projects, with participants, announced value, status and timing.',
    resolved:
      'Buyers, sellers, borrowers and issuers resolved to tribal governments, tribally owned enterprises, ANCs and NHOs.',
    coverage: 'Records from 2000',
    sources:
      'Transaction announcements, agency records and Federal Register land and trust actions, manually reviewed',
    terms: 'Public records. The resolution to Native entities is Lumecon’s work.',
    mark: '<path d="M3.5 9h18M17 4.5 21.5 9 17 13.5"/><path d="M24.5 19h-18M11 14.5 6.5 19l4.5 4.5"/>',
  },
  {
    id: 'nagpra',
    short: 'NAGPRA',
    name: 'NAGPRA',
    contributes:
      'Notices, inventories and completed repatriations under the Native American Graves Protection and Repatriation Act, item by item.',
    resolved:
      'Notices matched to the tribes and Native Hawaiian organizations named in them, across the naming changes of three decades.',
    coverage: 'Records from 1994, the first notice published under the Act',
    sources: 'NAGPRA notices as published in the Federal Register',
    terms: 'Public records. The resolution to Native entities is Lumecon’s work.',
    mark: '<path d="M9.5 10h9l1.5 9a4 4 0 0 1-4 4.5h-4A4 4 0 0 1 8 19z"/><path d="M8.5 15h11"/><path d="M9 6.5a5.5 5.5 0 0 1 10 0M9 6.5 6.5 4M9 6.5l-2.8 1.6"/>',
  },
  {
    id: 'lobbying',
    short: 'Advocacy',
    name: 'Native Federal Advocacy and Engagement',
    contributes:
      'Registered lobbying, agency meetings, tribal consultations, regulatory comments, congressional testimony and nonprofit lobbying disclosures, one entity-linked activity per row.',
    resolved:
      'Each activity resolved to the tribe or Native organization behind it where the record supports the link; a row the record cannot place keeps its printed party name and a blank key rather than a guess.',
    coverage: 'Records from 1999',
    sources:
      'Senate Lobbying Disclosure Act filings, tribal consultation notices, congressional hearing records and Federal Register ex parte notices',
    terms: 'Public records. The resolution to Native entities is Lumecon’s work.',
    mark: '<path d="M3.5 11.5v5h4l8 5.5V6l-8 5.5z"/><path d="M20 9.5a6.5 6.5 0 0 1 0 9.5"/><path d="M24 6a12 12 0 0 1 0 16.5"/>',
  },
  {
    id: 'contractors',
    short: 'Prime Contracting',
    name: 'Federal Prime Contracting',
    contributes:
      'Every prime award to a firm, a tribal enterprise or a tribal government, with the agency, the dollars, the industry and the set-aside path it came through.',
    resolved:
      'Vendors resolved to tribally owned firms, ANC and NHO subsidiaries and 8(a) participants, then rolled up to the parent nation or corporation.',
    coverage:
      'Records from fiscal year 2000, where Native identification begins in the federal record; refreshed quarterly',
    sources: 'FPDS-NG feed, USAspending award data and SAM contract awards',
    terms: 'Public records. The resolution to Native entities is Lumecon’s work.',
    mark: '<path d="M3 11 14 4.5 25 11"/><path d="M6.5 11v10M11.5 11v10M16.5 11v10M21.5 11v10"/><path d="M3 24.5h22"/>',
  },
  {
    id: 'subcontracting',
    short: 'Subcontracting',
    name: 'Federal Subcontracting',
    contributes:
      'The dollars below the prime layer: which vendors do the work, under whom and in which sectors.',
    resolved: 'Subawards matched to the same resolved entities as the prime contracts above them.',
    coverage: 'Records from fiscal year 2010, the statutory reporting floor',
    sources: 'USAspending FSRS subaward data',
    terms: 'Filer-reported and unaudited. Totals are stated with that limit.',
    mark: '<path d="M10 3.5h8v6h-8z"/><path d="M14 9.5v4M5 22v-4.5h18V22M5 17.5h18"/><path d="M2.5 22h5M11.5 22h5M20.5 22h5"/>',
  },
  {
    id: 'natural-resources',
    short: 'Natural Resources',
    name: 'Natural Resource Revenues',
    contributes:
      'Energy and mineral activity on trust and restricted lands: production volumes, the royalties it owes and the disbursements that follow.',
    resolved: 'Production and disbursements matched to the nations and allottees they belong to.',
    coverage: 'Records from 1880, through retrospectively published headright payments',
    sources:
      'ONRR Natural Resources Revenue Data and retrospectively published disbursement records',
    terms: 'Public records. The resolution to Native entities is Lumecon’s work.',
    mark: '<path d="M3 24.5 9.5 12l4.5 6 3-4 7 10.5z"/><path d="M9.5 12 7 3.5M20 6.5a2.5 2.5 0 1 0 0-.1"/>',
  },
  {
    id: 'owned',
    short: 'Native-Owned Businesses',
    name: 'Individually Owned Native Businesses',
    contributes:
      'Individually owned Native businesses, certified by their own nations’ TERO and commerce offices: who they are, what trades they work and what preference status their nation certifies.',
    resolved:
      'Every listing carries the nation whose office certified it and is credited to the issuing TERO or commerce office.',
    coverage: 'A roster as captured on 2026-09-01; certifying offices archive no superseded lists',
    sources: 'Nations’ TERO and commerce offices, shared with the project office by office',
    terms: 'A listing appears only under its nation’s stated terms.',
    mark: '<path d="M5.5 10.5 7 4.5h14l1.5 6"/><path d="M6 13v10.5h16V13"/><path d="M5.5 10.5c0 1.6 1.3 2.8 2.8 2.8s2.7-1.2 2.7-2.8c0 1.6 1.2 2.8 2.7 2.8h.6c1.5 0 2.7-1.2 2.7-2.8 0 1.6 1.2 2.8 2.7 2.8s2.8-1.2 2.8-2.8"/><path d="M11.5 23.5v-6.5h5v6.5"/>',
  },
  {
    id: 'nonprofits',
    short: 'Native Nonprofits',
    name: 'Native Nonprofits',
    contributes:
      'Native-led and Native-serving nonprofits with their federal filings: budgets, revenue mixes and program spending.',
    resolved:
      'Filers classified as Native-led, Native-serving or Native-focused, which are three different things and are labeled separately.',
    coverage: 'A register as captured on 2026-04-29, one row per filer with its latest period',
    sources: 'IRS Business Master File monthly extracts',
    terms:
      'Public records. The classification is Lumecon’s work and stays reviewable.',
    mark: '<path d="M14 24s-8.5-5.2-8.5-11.2A4.7 4.7 0 0 1 14 9.4a4.7 4.7 0 0 1 8.5 3.4C22.5 18.8 14 24 14 24z"/><path d="M14 12.5v5M11.5 15h5"/>',
  },
  {
    id: 'need',
    // Always "Cedar NEED", never the bare acronym: the Federal Reserve
    // publishes a NEED of its own, and this page is read by people who know
    // theirs. The prefix is the whole point of the name.
    short: 'Cedar NEED',
    name: 'Cedar Native Entity Enterprise Dataset (Cedar NEED)',
    contributes:
      'Who owns whom across Indian Country’s enterprises: parent nations and corporations, their subsidiaries, holding companies and joint ventures, and how those ties change.',
    resolved:
      'The structure the rest of the record resolves against, published as a collection in its own right: every tie names the nation or corporation behind it.',
    coverage: 'Observations from 2016, the earliest year any source named an enterprise or a tie',
    sources: 'Entity records, enterprise registers and filings, reconciled edition by edition',
    terms:
      'Unresolved ties stay unresolved. A provisional match is labeled provisional.',
    mark: '<circle cx="14" cy="7" r="3.6"/><circle cx="6.5" cy="21" r="3.1"/><circle cx="21.5" cy="21" r="3.1"/><path d="M12.3 10.2 8 18.2M15.7 10.2 20 18.2M9.6 21h8.8"/>',
  },
];
