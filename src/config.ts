// Site-wide configuration — single source of truth for the site's
// brand, contact, and meta fields. Product/platform data lives in
// src/data/platforms.ts; site.products re-exports the lookup table
// from there so legacy `site.products.local.url`-style accesses
// keep working without copy duplicated across files.

import { PLATFORM_BY_SLUG } from './data/platforms';

export const site = {
  name: 'Lumecon',
  legalName: 'Lumecon Inc.',
  tagline: 'We luminate economies',
  /* Canonical product-pitch phrase. Used by JSON-LD descriptions
     and as the default OG image alt across pages. Page-specific
     descriptions should expand from this phrase rather than inventing
     variants ("economic and policy analysis software," etc.). */
  pitch: 'Economic impact analysis software for governments, enterprises, and mission-driven organizations.',
  url: 'https://lumecon.ai',
  email: 'contact@lumecon.ai',
  legalEntity: 'Lumecon Inc.',
  counsel: 'Cornell Law Entrepreneurship Law Clinic',
  builtAt: 'Cornell University',
  copyrightYear: 2026,
  maxWidth: '1100px',
  products: PLATFORM_BY_SLUG,
} as const;
