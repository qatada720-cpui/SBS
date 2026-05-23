export const ROUTES = {
  home: '/',
  marketplace: '/marketplace',
  'ai-match': '/ai-match',
  how: '/how',
  about: '/about',
  contact: '/contact',
  'sign-in': '/sign-in',
  'sign-up': '/sign-up',
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
];

export const FOOTER_LINKS: Record<string, string> = {
  marketplace: '/marketplace',
  'ai-match': '/ai-match',
  'seller-onboarding': '/seller/onboarding',
  how: '/how',
  'seller-dashboard': '/seller/dashboard',
  'buyer-dashboard': '/buyer/dashboard',
  about: '/about',
  contact: '/contact',
};
