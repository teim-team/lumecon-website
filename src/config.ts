// Site-wide configuration — single source of truth

export const navLinks = [
  { label: 'Products', href: '#products' },
  { label: 'Cedar', href: '#cedar' },
  { label: 'Partnerships', href: '#contact' },
] as const;

export const site = {
  name: 'Lumecon',
  legalName: 'Lumecon Inc.',
  tagline: 'We illuminate economies',
  pitch: 'Economic and policy analysis software for governments and mission-driven organizations.',
  url: 'https://lumecon.ai',
  email: 'contact@lumecon.ai',
  legalEntity: 'Lumecon Inc.',
  counsel: 'Cornell Law Entrepreneurship Law Clinic',
  builtAt: 'Cornell University',
  copyrightYear: 2026,
  maxWidth: '1100px',
  products: {
    local: {
      name: 'Local Economic Impact',
      url: 'https://localeconomicimpact.com',
      domain: 'localeconomicimpact.com',
      status: 'In active development',
    },
    tribal: {
      name: 'Tribal Economic Impact',
      url: 'https://tribaleconomicimpact.com',
      domain: 'tribaleconomicimpact.com',
      status: 'Patent pending \u00B7 In active development',
    },
    global: {
      name: 'Global Economic Impact',
      url: 'https://globaleconomicimpact.com',
      domain: 'globaleconomicimpact.com',
      status: 'Future development',
    },
  },
} as const;
