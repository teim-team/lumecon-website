// Site-wide configuration — single source of truth for the site's
// brand, contact, and meta fields. The marketing-door domain data
// (localeconomicimpact.com etc.) lives in src/data/platforms.ts and
// feeds the homepage Service JSON-LD.

export const site = {
  name: 'Lumecon',
  legalName: 'Lumecon Inc.',
  tagline: 'We luminate economies',
  /* Canonical product-pitch phrase. Used by JSON-LD descriptions
     and as the default OG image alt across pages. Page-specific
     descriptions should expand from this phrase rather than inventing
     variants ("economic and policy analysis software," etc.). */
  pitch:
    'Economic impact analysis software for governments, universities, nonprofits, businesses and Tribal Nations. Turn organizational data into credible analysis, with every result traceable through the data, assumptions and model layers behind it.',
  url: 'https://lumecon.ai',
  email: 'contact@lumecon.ai',
  legalEntity: 'Lumecon Inc.',
  counsel: 'Cornell Law Entrepreneurship Law Clinic',
  builtAt: 'Cornell University',
  // Computed at build time, so every deploy stamps the current year.
  copyrightYear: new Date().getFullYear(),
  maxWidth: '1100px',
} as const;
