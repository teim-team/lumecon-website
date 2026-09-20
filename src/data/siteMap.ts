/**
 * The site's page inventory — one record, read by everything that needs
 * to know what pages exist.
 *
 * WHY THIS FILE EXISTS
 * The same list was written down in three places and none of them knew
 * about the others. `scripts/docs/export-copy.mjs` carried a `PAGES`
 * array and an `OWNERSHIP` map; `public/llms.txt` described the site in
 * prose with no page list at all; and `@astrojs/sitemap` derived its own
 * list from the filesystem. Adding /why-lumecon proved the cost: the
 * sitemap picked it up automatically, the copy document silently skipped
 * it until the array was edited by hand, and llms.txt — the file whose
 * entire job is telling an assistant what this site contains — never
 * mentioned it at all.
 *
 * So: one array. The sitemap still comes from the filesystem, which is
 * the right source for it, and `tests/smoke.spec.ts` asserts the two
 * agree, so a page added to one and forgotten in the other fails the
 * build rather than going quietly missing from what crawlers read.
 *
 * WHAT `question` IS FOR
 * AGENTS.md's page-ownership rule says each page makes one argument.
 * This is that argument, written as the question a reader arrives with.
 * It is not marketing copy: it is what an assistant should say this page
 * is for, and what a contributor should check a new section against.
 */

export type PageIndexing = 'index' | 'noindex';

export interface SitePage {
  /** Path as served, no trailing slash (the homepage is '/'). */
  path: string;
  /** Short human label, used in the copy document's headings. */
  label: string;
  /** The one question this page answers. */
  question: string;
  /**
   * `noindex` pages are real and reachable but are steps in a flow
   * rather than destinations, so they stay out of the index and out of
   * the page list an assistant is given.
   */
  indexing: PageIndexing;
  /** Kept out of llms.txt's page list even when indexed. */
  llmsHidden?: boolean;
  /**
   * The URL to actually fetch when it differs from `path`. /checkout
   * redirects to /choose-plan unless it is handed a valid paid tier, so
   * without the query the copy export rendered choose-plan twice and
   * checkout not at all.
   */
  visit?: string;
}

export const SITE_PAGES: SitePage[] = [
  {
    path: '/',
    label: 'Homepage',
    question: 'What is Lumecon, and why does it matter?',
    indexing: 'index',
  },
  {
    path: '/why-lumecon',
    label: 'Why Lumecon',
    question: 'Why should our organization choose this?',
    indexing: 'index',
  },
  {
    path: '/pricing',
    label: 'Pricing',
    question: 'What does it cost, and why is the pricing shaped this way?',
    indexing: 'index',
  },
  {
    path: '/cedar',
    label: 'Cedar',
    question: 'What is Cedar, the AI economic analyst, and what does it do?',
    indexing: 'index',
  },
  {
    path: '/cedar-commons',
    label: 'Cedar Commons',
    question: 'How do several people finish one analysis together?',
    indexing: 'index',
  },
  {
    path: '/cedar-grove',
    label: 'Cedar Grove',
    question: "What is the evidence base for an organization's economy?",
    indexing: 'index',
  },
  {
    path: '/methodology',
    label: 'Methodology',
    question: 'How are the estimates constructed, and where do they stop?',
    indexing: 'index',
  },
  {
    path: '/start',
    label: 'Plan your first analysis',
    question: 'What does getting started involve, and what do we need to bring?',
    indexing: 'index',
  },
  {
    path: '/naics',
    label: 'Industry sectors',
    question: 'What does the industry classification cover?',
    indexing: 'index',
  },
  {
    path: '/glossary',
    label: 'Glossary',
    question: 'What do the terms mean?',
    indexing: 'index',
  },
  {
    path: '/team',
    label: 'Team',
    question: 'Who builds the models, the data and the software?',
    indexing: 'index',
  },
  {
    path: '/security',
    label: 'Security',
    question: 'How is organizational information handled, and what is assured today?',
    indexing: 'index',
  },
  {
    path: '/ai-and-data-use',
    label: 'AI and data use',
    question: 'How is AI used, and what happens to the data it touches?',
    indexing: 'index',
  },
  {
    path: '/contact',
    label: 'Contact',
    question: 'How do we reach a person, and where does each kind of message go?',
    indexing: 'index',
  },
  {
    path: '/accessibility',
    label: 'Accessibility',
    question: 'What is conformant, and what is known to be unresolved?',
    indexing: 'index',
  },
  {
    path: '/privacy',
    label: 'Privacy',
    question: 'What is collected, and what is done with it?',
    indexing: 'index',
  },
  {
    path: '/terms',
    label: 'Terms',
    question: 'What are the terms of use?',
    indexing: 'index',
  },
  /* Steps in a flow rather than destinations. Real pages, reachable and
     tested, kept out of the index and out of what an assistant is told
     the site contains. */
  {
    path: '/signup',
    label: 'Sign up',
    question: 'How do we request access?',
    indexing: 'noindex',
  },
  {
    path: '/login',
    label: 'Log in',
    question: 'How do we sign in?',
    indexing: 'noindex',
  },
  {
    path: '/choose-plan',
    label: 'Choose plan',
    question: 'Which plan are we buying?',
    indexing: 'noindex',
  },
  {
    path: '/checkout',
    label: 'Checkout',
    question: 'How do we pay?',
    indexing: 'noindex',
    visit: '/checkout?tier=sprout',
  },
  {
    path: '/welcome',
    label: 'Welcome',
    question: 'What happens now that we have access?',
    indexing: 'noindex',
  },
  {
    path: '/404',
    label: 'Not found',
    question: 'What happened to the page we asked for?',
    indexing: 'noindex',
  },
];

/** Pages a crawler or an assistant should be told about. */
export const INDEXED_PAGES = SITE_PAGES.filter((p) => p.indexing === 'index');

/** The subset llms.txt lists, in the order it lists them. */
export const LLMS_PAGES = INDEXED_PAGES.filter((p) => !p.llmsHidden);

export const PAGE_BY_PATH = new Map(SITE_PAGES.map((p) => [p.path, p]));
