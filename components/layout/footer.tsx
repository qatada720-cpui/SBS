'use client';

import Link from 'next/link';
import { Icon, Logo } from '@/components/ui';
import { FOOTER_LINKS } from '@/lib/routes';

const cols = [
  {
    head: 'Marketplace',
    links: [
      { l: 'Browse listings', p: 'marketplace' },
      { l: 'AI buyer matching', p: 'ai-match' },
      { l: 'Sell a business', p: 'seller-onboarding' },
      { l: 'Pricing', p: 'how' },
    ],
  },
  {
    head: 'Platform',
    links: [
      { l: 'How it works', p: 'how' },
      { l: 'Seller dashboard', p: 'seller-dashboard' },
      { l: 'Buyer dashboard', p: 'buyer-dashboard' },
      { l: 'Verification', p: 'how' },
    ],
  },
  {
    head: 'Company',
    links: [
      { l: 'About', p: 'about' },
      { l: 'Contact', p: 'contact' },
      { l: 'Trust & safety', p: 'about' },
      { l: 'Press', p: 'contact' },
    ],
  },
  {
    head: 'Legal',
    links: [
      { l: 'Privacy', p: 'contact' },
      { l: 'Terms', p: 'contact' },
      { l: 'Escrow agreement', p: 'how' },
      { l: 'NDA template', p: 'how' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="hair-t" style={{ marginTop: 96, padding: '64px 0 48px' }}>
      <div className="container col gap-8">
        <div className="row" style={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 64, flexWrap: 'wrap' }}>
          <div className="col gap-4" style={{ maxWidth: 340 }}>
            <Logo size={0.95} />
            <p style={{ fontSize: 13, color: 'var(--subtle)', lineHeight: 1.6, fontWeight: 300 }}>
              A premium B2B marketplace where entrepreneurs safely buy and sell businesses. Verified listings, escrowed payments, phased ownership transitions.
            </p>
            <div className="row gap-2" style={{ marginTop: 4 }}>
              <span className="badge badge-verified">
                <Icon.Shield size={10} /> SOC 2 Type II
              </span>
              <span className="badge">
                <Icon.Lock size={10} /> Escrow protected
              </span>
            </div>
          </div>

          <div className="row mobile-wrap" style={{ gap: 56 }}>
            {cols.map((c) => (
              <div key={c.head} className="col gap-3" style={{ minWidth: 120 }}>
                <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)' }}>
                  {c.head}
                </div>
                <div className="col gap-2">
                  {c.links.map((x, i) => (
                    <Link
                      key={i}
                      href={FOOTER_LINKS[x.p] ?? '/'}
                      style={{ fontSize: 13, color: 'var(--subtle)', cursor: 'pointer', fontWeight: 300 }}
                    >
                      {x.l}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="hair-t row" style={{ paddingTop: 24, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>© 2026 SafeBusineSSSelling B.V. KvK 81234567. Amsterdam, NL.</span>
          <span style={{ fontSize: 12, color: 'var(--muted)' }} className="row gap-2">
            <Icon.Dot size={5} color="#00A86B" /> All systems operational
          </span>
        </div>
      </div>
    </footer>
  );
}
