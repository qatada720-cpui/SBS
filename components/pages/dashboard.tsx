'use client';

import Link from 'next/link';
import { Button, Icon, SectionEyebrow } from '@/components/ui';
import { AccountTabs } from '@/components/layout/account-tabs';
import { MATCHES, LISTINGS } from '@/lib/data';

export function AccountDashboardPage() {
  return (
    <div className="page-enter">
      <section style={{ padding: '32px 0 0' }}>
        <div className="container col gap-6">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
            <div className="col gap-2">
              <SectionEyebrow>Your account</SectionEyebrow>
              <h1 style={{ fontSize: 36 }}>Buy and sell from one place</h1>
              <p style={{ fontSize: 15, color: 'var(--subtle)', fontWeight: 300, maxWidth: 560 }}>
                One account for everything — browse businesses, run AI matches, list your own company, and manage deals on both sides.
              </p>
            </div>
            <AccountTabs />
          </div>
        </div>
      </section>

      <section style={{ padding: '40px 0 96px' }}>
        <div className="container col gap-6">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <Link href="/buyer/dashboard" className="card col gap-4 card-hover" style={{ padding: 28, textDecoration: 'none' }}>
              <div className="row gap-3" style={{ alignItems: 'center' }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'var(--surface-2)',
                    border: '0.5px solid var(--border)',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <Icon.Search size={18} />
                </div>
                <div className="col gap-1">
                  <h3 style={{ fontSize: 20 }}>Buying</h3>
                  <span className="muted" style={{ fontSize: 13 }}>Find and acquire businesses</span>
                </div>
              </div>
              <div className="row" style={{ gap: 24, marginTop: 8 }}>
                <div className="col gap-1">
                  <span className="tabular" style={{ fontSize: 28, fontWeight: 500, letterSpacing: -1 }}>
                    {MATCHES.length}
                  </span>
                  <span className="muted" style={{ fontSize: 12 }}>AI matches</span>
                </div>
                <div className="col gap-1">
                  <span className="tabular" style={{ fontSize: 28, fontWeight: 500, letterSpacing: -1 }}>
                    3
                  </span>
                  <span className="muted" style={{ fontSize: 12 }}>Active deals</span>
                </div>
              </div>
              <span className="row gap-2" style={{ fontSize: 13, color: 'var(--blue)', marginTop: 4 }}>
                Open buyer dashboard <Icon.Arrow size={12} />
              </span>
            </Link>

            <Link href="/seller/dashboard" className="card col gap-4 card-hover" style={{ padding: 28, textDecoration: 'none' }}>
              <div className="row gap-3" style={{ alignItems: 'center' }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'var(--surface-2)',
                    border: '0.5px solid var(--border)',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <Icon.Building size={18} />
                </div>
                <div className="col gap-1">
                  <h3 style={{ fontSize: 20 }}>Selling</h3>
                  <span className="muted" style={{ fontSize: 13 }}>List and close your business</span>
                </div>
              </div>
              <div className="row" style={{ gap: 24, marginTop: 8 }}>
                <div className="col gap-1">
                  <span className="tabular" style={{ fontSize: 28, fontWeight: 500, letterSpacing: -1 }}>
                    92
                  </span>
                  <span className="muted" style={{ fontSize: 12 }}>Listing score</span>
                </div>
                <div className="col gap-1">
                  <span className="tabular" style={{ fontSize: 28, fontWeight: 500, letterSpacing: -1 }}>
                    2
                  </span>
                  <span className="muted" style={{ fontSize: 12 }}>Buyer inquiries</span>
                </div>
              </div>
              <span className="row gap-2" style={{ fontSize: 13, color: 'var(--blue)', marginTop: 4 }}>
                Open seller dashboard <Icon.Arrow size={12} />
              </span>
            </Link>
          </div>

          <div className="card row" style={{ padding: 24, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div className="col gap-2">
              <span style={{ fontSize: 14, fontWeight: 500 }}>Ready to list a business?</span>
              <span className="muted" style={{ fontSize: 13 }}>
                Start seller onboarding — same account, no extra signup.
              </span>
            </div>
            <Link href="/seller/onboarding">
              <Button variant="primary" size="sm" iconRight={<Icon.Arrow size={12} />}>
                List a business
              </Button>
            </Link>
          </div>

          <div className="col gap-3">
            <span className="muted" style={{ fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 500 }}>
              Quick actions
            </span>
            <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
              <Link href="/marketplace">
                <Button variant="secondary" size="sm">
                  Browse marketplace
                </Button>
              </Link>
              <Link href="/">
                <Button variant="secondary" size="sm">
                  Chat with Ahmed AI
                </Button>
              </Link>
              <Link href={`/listing/${LISTINGS[0].id}`}>
                <Button variant="ghost" size="sm">
                  View sample listing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
