export const ROUTES = {
  home: '/',
  marketplace: '/marketplace',
  'ai-match': '/ai-match',
  how: '/how',
  'how-calculated': '/how-calculated',
  messages: '/messages',
  about: '/about',
  contact: '/contact',
  privacy: '/privacy',
  terms: '/terms',
  settings: '/settings',
  'sign-in': '/sign-in',
  'sign-up': '/sign-up',
  'forgot-password': '/forgot-password',
  dashboard: '/dashboard',
  'seller-onboarding': '/seller/onboarding',
  'seller-dashboard': '/seller/dashboard',
  'buyer-dashboard': '/buyer/dashboard',
} as const;

export type PageId = keyof typeof ROUTES;

export function pagePath(page: string, id?: string): string {
  if (page === 'listing' && id) return `/listing/${id}`;
  return ROUTES[page as PageId] ?? `/${page}`;
}

export const NAV_LINKS: { id: PageId; label: string; href: string }[] = [
  { id: 'about', label: 'About', href: '/about' },
  { id: 'how', label: 'How it works', href: '/how' },
  { id: 'marketplace', label: 'Marketplace', href: '/marketplace' },
  { id: 'ai-match', label: 'AI Match', href: '/ai-match' },
];

export const FOOTER_LINKS: Record<string, string> = {
  marketplace: '/marketplace',
  'ai-match': '/ai-match',
  'seller-onboarding': '/seller/onboarding',
  pricing: '/pricing',
  how: '/how',
  'how-calculated': '/how-calculated',
  messages: '/messages',
  'seller-dashboard': '/seller/dashboard',
  'buyer-dashboard': '/buyer/dashboard',
  about: '/about',
  contact: '/contact',
  privacy: '/privacy',
  terms: '/terms',
};
