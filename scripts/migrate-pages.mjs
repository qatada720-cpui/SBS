import fs from 'fs';
import path from 'path';

const ROUTES = {
  home: '/',
  marketplace: '/marketplace',
  listing: '/listing',
  'ai-match': '/ai-match',
  how: '/how',
  about: '/about',
  contact: '/contact',
  'seller-onboarding': '/seller/onboarding',
  'seller-dashboard': '/seller/dashboard',
  'buyer-dashboard': '/buyer/dashboard',
};

const FOOTER_ROUTES = { ...ROUTES };

function routeFor(page, id) {
  if (page === 'listing' && id) return `/listing/${id}`;
  return ROUTES[page] || `/${page}`;
}

function transform(content, exports) {
  let s = content
    .replace(/^\/\/.*\n/gm, '')
    .replace(/Object\.assign\(window,[\s\S]*?\);\s*$/m, '')
    .replace(/const \{ useState[^}]*\} = React;\n?/g, '')
    .replace(/React\.useState/g, 'useState')
    .replace(/React\.useEffect/g, 'useEffect')
    .replace(/React\.useRef/g, 'useRef')
    .replace(/React\.useMemo/g, 'useMemo')
    .replace(/React\.Fragment/g, 'Fragment')
    .replace(/window\.SBS_DATA/g, 'SBS_DATA')
    .replace(/const \{ ([^}]+) \} = SBS_DATA;/g, "import { $1 } from '@/lib/data';")
    .replace(/function (\w+)\(\{ onNav \}\)/g, 'export function $1()')
    .replace(/function ListingPage\(\{ listingId, onNav \}\)/g, 'export function ListingPage({ listingId }: { listingId: string })')
    .replace(/onClick=\{\(\) => onNav\('listing', ([^)]+)\)\}/g, "href={`/listing/${$1}`}")
    .replace(/onClick=\{\(\) => onNav\('([^']+)'(?:,\s*([^)]+))?\)\}/g, (_, page, id) => {
      const href = id ? `\`/listing/\${${id.trim()}}\`` : `'${routeFor(page)}'`;
      return id && page === 'listing' ? `href={\`/listing/\${${id.trim()}}\`}` : `onClick={() => router.push('${routeFor(page)}')}`;
    });

  // ListingCard: onClick with listing id
  s = s.replace(
    /<ListingCard key=\{l\.id\} listing=\{l\} onClick=\{\(\) => onNav\('listing', l\.id\)\} \/>/g,
    '<ListingCard key={l.id} listing={l} href={`/listing/${l.id}`} />',
  );
  s = s.replace(
    /<ListingCard key=\{l\.id\} listing=\{l\} onClick=\{\(\) => onNav\('listing', l\.id\)\} \/>/g,
    '<ListingCard key={l.id} listing={l} href={`/listing/${l.id}`} />',
  );

  s = s.replace(/onNav\('listing', ([^)]+)\)/g, "router.push(`/listing/${$1}`)");
  s = s.replace(/onNav\('([^']+)'\)/g, (_, page) => `router.push('${routeFor(page)}')`);

  const needsRouter = /router\.push/.test(s);
  const needsData = /from '@\/lib\/data'/.test(s) || /LISTINGS|TEAM|MATCHES|PHASES|REVIEWS|SECTORS/.test(s);

  const imports = [
    "'use client';",
    '',
    "import { useState, useEffect, useRef, useMemo } from 'react';",
    needsRouter ? "import { useRouter } from 'next/navigation';" : '',
    "import Link from 'next/link';",
    "import { Button, Icon, Logo, VerifiedBadge, PremiumBadge, ScoreBar, PhaseTracker, ListingCard, SectionEyebrow, Stat, Field } from '@/components/ui';",
    needsData && !/from '@\/lib\/data'/.test(s)
      ? "import { LISTINGS, SECTORS, REVENUE_RANGES, REVIEWS, PHASES, TEAM, MATCHES } from '@/lib/data';"
      : '',
  ]
    .filter(Boolean)
    .join('\n');

  // Inject router in functions that need it
  if (needsRouter) {
    for (const fn of exports) {
      const re = new RegExp(`export function ${fn}\\([^)]*\\)\\s*\\{`);
      if (re.test(s) && !s.includes(`function ${fn}`)) {
        s = s.replace(re, (m) => `${m}\n  const router = useRouter();`);
      }
    }
  }

  // Fix duplicate data imports
  s = s.replace(/import \{ [^}]+ \} from '@\/lib\/data';\nimport \{ [^}]+ \} from '@\/lib\/data';/g, (m) => m.split('\n')[0] + ';');

  return `${imports}\n\n${s.trim()}\n`;
}

const files = [
  ['legacy/pages-marketing.jsx', 'components/pages/marketing.tsx', ['HomePage', 'HowItWorksPage', 'AboutPage', 'ContactPage']],
  ['legacy/pages-product.jsx', 'components/pages/product.tsx', ['MarketplacePage', 'ListingPage', 'AIMatchPage']],
  ['legacy/pages-account.jsx', 'components/pages/account.tsx', ['SellerOnboardingPage', 'SellerDashboardPage', 'BuyerDashboardPage']],
];

for (const [src, dest, exports] of files) {
  const content = fs.readFileSync(path.join(process.cwd(), src), 'utf8');
  const out = transform(content, exports);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, out);
  console.log('Wrote', dest);
}
