export interface Listing {
  id: string;
  name: string;
  sector: string;
  location: string;
  revenue: string;
  ebitda?: string;
  asking: string;
  score: number;
  verified: boolean;
  photos: number;
  employees?: number;
  founded?: number;
  description: string;
  highlights?: string[];
}

export interface Review {
  name: string;
  role: string;
  rating: number;
  date: string;
  text: string;
}

export interface Phase {
  title: string;
  desc: string;
  ownership: number;
}

export interface TeamMember {
  name: string;
  role: string;
  bio: string;
}

export interface Match {
  listing: Listing;
  fit: number;
  reasons: string[];
}

export const LISTINGS: Listing[] = [];

export const SECTORS = [
  'All sectors',
  'SaaS',
  'E-commerce / DTC',
  'Logistics',
  'Healthcare',
  'Food & Beverage',
  'Automotive',
  'Professional Services',
  'Services',
];

export const REVENUE_RANGES = ['Any revenue', '< €500K', '€500K – €1M', '€1M – €5M', '€5M+'];

export const REVIEWS: Review[] = [
  {
    name: 'Marek S.',
    role: 'Bought Halcyon Skincare',
    rating: 5,
    date: 'March 2026',
    text: 'The phased ownership model removed the single biggest risk in the deal. By Phase 3 I had operating clarity I would never get from a traditional asset sale.',
  },
  {
    name: 'Jana V.',
    role: 'Sold Atlas Logistics',
    rating: 5,
    date: 'January 2026',
    text: 'The verification process took two weeks but the listing score made a difference — I had three serious buyers within ten days of going premium.',
  },
  {
    name: 'Daan B.',
    role: 'Bought Lumen Group',
    rating: 4,
    date: 'November 2025',
    text: 'Escrow + the structured handover were the deciding factors. The AI match shortlist was surprisingly accurate.',
  },
];

export const PHASES: Phase[] = [
  { title: 'LOI & Discovery', desc: 'NDA signed, books open, escrow funded.', ownership: 0 },
  { title: 'Operating handover', desc: '6-month seller-led transition, KPIs locked.', ownership: 51 },
  { title: 'Full ownership', desc: 'Final earn-out cleared, equity transferred.', ownership: 100 },
];

export const TEAM: TeamMember[] = [
  { name: 'Sara El-Hassan', role: 'Co-founder & CEO', bio: '12 years in M&A. Previously: Rothschild, advisor on €1.2B+ in SMB transactions.' },
  { name: 'Tomas Visser', role: 'Co-founder & CTO', bio: 'Built escrow infra at a fintech unicorn. Ex-Adyen.' },
  { name: 'Imani Okonkwo', role: 'Head of Trust', bio: 'Former forensic auditor. Designs the verification framework.' },
  { name: 'Jonas Ahlberg', role: 'Head of Marketplace', bio: 'Scaled marketplaces from 0 to liquidity at two prior startups.' },
];

export const MATCHES: Match[] = [];

/** Match rating 1–100 for every verified listing (Ahmed AI results). */
export type ScoredMatch = {
  listing: Listing;
  fit: number;
  reasons: string[];
};

const DEFAULT_MATCH_REASONS = [
  ['Sector alignment', 'Revenue band fit', 'Verified seller'],
  ['Margin profile', 'Location overlap', 'Listing quality score'],
  ['Operating model fit', 'Team size match', 'Growth profile'],
];

export function getAllScoredMatches(): ScoredMatch[] {
  return LISTINGS.map((listing, i) => {
    const known = MATCHES.find((m) => m.listing.id === listing.id);
    const fit = known?.fit ?? Math.min(100, Math.max(1, listing.score - (i % 4) * 2));
    const reasons =
      known?.reasons ??
      DEFAULT_MATCH_REASONS[i % DEFAULT_MATCH_REASONS.length];
    return { listing, fit, reasons };
  }).sort((a, b) => b.fit - a.fit);
}

export const SBS_DATA = { LISTINGS, SECTORS, REVENUE_RANGES, REVIEWS, PHASES, TEAM, MATCHES };
