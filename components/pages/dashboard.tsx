'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Icon, SectionEyebrow } from '@/components/ui';
import { AccountTabs } from '@/components/layout/account-tabs';
import { createClient as _createClient } from '@/lib/supabase-browser';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createClient = () => _createClient() as any;
import type { User, Session } from '@supabase/supabase-js';

type ActiveDeal = {
  id: string;
  status: 'draft' | 'active';
  conversation_id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  conversations: any;
};

export function AccountDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{ full_name: string | null; role: string; kyc_status: string } | null>(null);
  const [listingCount, setListingCount] = useState(0);
  const [conversationCount, setConversationCount] = useState(0);
  const [activeDeals, setActiveDeals] = useState<ActiveDeal[]>([]);
  const [signingOut, setSigningOut] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    async function loadProfile(userId: string) {
      try {
        const [{ data: prof }, { count: listings }, { count: convos }, { data: deals }] = await Promise.all([
          supabase.from('profiles').select('full_name, role, kyc_status').eq('id', userId).single(),
          supabase.from('listings').select('*', { count: 'exact', head: true }).eq('seller_id', userId),
          supabase.from('conversations').select('*', { count: 'exact', head: true })
            .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`),
          supabase.from('deal_agreements')
            .select('id, status, conversation_id, conversations(id, buyer_id, seller_id, current_phase, listings(name, asking_price))')
            .in('status', ['draft', 'active']),
        ]);
        if (!mounted) return;
        if (prof) setProfile(prof);
        setListingCount(listings ?? 0);
        setConversationCount(convos ?? 0);
        setActiveDeals((deals ?? []) as ActiveDeal[]);
      } catch {
        if (mounted) setError('Failed to load dashboard. Please refresh the page.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    // onAuthStateChange fires immediately with the current session —
    // this handles both normal page load and post-signup redirect where
    // the cookie may not be written yet when getSession() first runs.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      if (!mounted) return;
      if (!session) {
        setLoading(false);
        router.push('/sign-in');
        return;
      }
      setUser(session.user);
      loadProfile(session.user.id);
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, [router]);

  async function signOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  const displayName = profile?.full_name
    ?? user?.user_metadata?.full_name
    ?? user?.email?.split('@')[0]
    ?? 'there';

  const kycStatus = profile?.kyc_status ?? 'none';
  const kycVerified = kycStatus === 'verified';

  if (loading) {
    return (
      <div className="page-enter">
        <section style={{ padding: '32px 0 0' }}>
          <div className="container col gap-6">
            <div style={{ height: 80, background: 'var(--surface-2)', borderRadius: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />
          </div>
        </section>
        <section style={{ padding: '40px 0 96px' }}>
          <div className="container col gap-6">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              <div style={{ height: 160, background: 'var(--surface-2)', borderRadius: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />
              <div style={{ height: 160, background: 'var(--surface-2)', borderRadius: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-enter">
        <section style={{ padding: '96px 0 80px' }}>
          <div className="container col gap-6" style={{ maxWidth: 440, margin: '0 auto', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: '#FF3B3011', display: 'grid', placeItems: 'center' }}>
              <span style={{ color: '#FF3B30' }}><Icon.Shield size={24} /></span>
            </div>
            <div className="col gap-2">
              <h2 style={{ fontSize: 24, fontWeight: 700 }}>Something went wrong</h2>
              <p className="muted" style={{ fontSize: 15, lineHeight: 1.6 }}>{error}</p>
            </div>
            <Button variant="primary" onClick={() => window.location.reload()}>Refresh page</Button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-enter">
      <section style={{ padding: '32px 0 0' }}>
        <div className="container col gap-6">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
            <div className="col gap-2">
              <SectionEyebrow>Your account</SectionEyebrow>
              <h1 style={{ fontSize: 36 }}>Hey, {displayName} 👋</h1>
              <p style={{ fontSize: 15, color: 'var(--subtle)', fontWeight: 300, maxWidth: 560 }}>
                One account for everything — browse businesses, run AI matches, list your own company, and manage deals on both sides.
              </p>
            </div>
            <div className="row gap-2" style={{ alignItems: 'center' }}>
              <AccountTabs />
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                disabled={signingOut}
              >
                {signingOut ? 'Signing out…' : 'Sign out'}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '40px 0 96px' }}>
        <div className="container col gap-6">
          {!kycVerified && (
            <div className="card row" style={{ padding: 20, gap: 16, alignItems: 'center', borderLeft: '3px solid #C8922A', background: '#C8922A08' }}>
              <span style={{ color: '#C8922A', flexShrink: 0, display: 'flex' }}><Icon.Shield size={18} /></span>
              <div className="col gap-1" style={{ flex: 1 }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>Identity verification required</span>
                <span className="muted" style={{ fontSize: 13 }}>
                  {kycStatus === 'pending'
                    ? 'Your verification is under review — usually within 1 business day.'
                    : kycStatus === 'rejected'
                    ? 'Your verification was rejected. Please re-submit with a valid ID.'
                    : 'Verify your identity and confirm you\'re 18+ to buy or sell.'}
                </span>
              </div>
              {kycStatus !== 'pending' && (
                <Button href="/verify-identity" variant="primary" size="sm">
                  {kycStatus === 'rejected' ? 'Re-submit' : 'Verify now'}
                </Button>
              )}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {([
              {
                href: '/buyer/dashboard',
                icon: <Icon.Search size={18} />,
                title: 'Buying',
                desc: 'Find and acquire businesses',
                stats: [
                  { v: conversationCount, l: 'Active conversations' },
                  { v: '—', l: 'AI matches' },
                ],
                cta: 'Open buyer dashboard',
              },
              {
                href: '/seller/dashboard',
                icon: <Icon.Building size={18} />,
                title: 'Selling',
                desc: 'List and close your business',
                stats: [
                  { v: listingCount, l: listingCount === 1 ? 'Listing' : 'Listings' },
                  { v: conversationCount, l: 'Inquiries' },
                ],
                cta: 'Open seller dashboard',
              },
            ] as const).map(card => (
              kycVerified ? (
                <Link key={card.href} href={card.href} className="card col gap-4 card-hover" style={{ padding: 28, textDecoration: 'none' }}>
                  <div className="row gap-3" style={{ alignItems: 'center' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--surface-2)', border: '0.5px solid var(--border)', display: 'grid', placeItems: 'center' }}>
                      {card.icon}
                    </div>
                    <div className="col gap-1">
                      <h3 style={{ fontSize: 20 }}>{card.title}</h3>
                      <span className="muted" style={{ fontSize: 13 }}>{card.desc}</span>
                    </div>
                  </div>
                  <div className="row" style={{ gap: 24, marginTop: 8 }}>
                    {card.stats.map(s => (
                      <div key={s.l} className="col gap-1">
                        <span className="tabular" style={{ fontSize: 28, fontWeight: 500, letterSpacing: -1 }}>{s.v}</span>
                        <span className="muted" style={{ fontSize: 12 }}>{s.l}</span>
                      </div>
                    ))}
                  </div>
                  <span className="row gap-2" style={{ fontSize: 13, color: 'var(--blue)', marginTop: 4 }}>
                    {card.cta} <Icon.Arrow size={12} />
                  </span>
                </Link>
              ) : (
                <div key={card.href} className="card col gap-4" style={{ padding: 28, opacity: 0.45, cursor: 'not-allowed' }}>
                  <div className="row gap-3" style={{ alignItems: 'center' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--surface-2)', border: '0.5px solid var(--border)', display: 'grid', placeItems: 'center' }}>
                      {card.icon}
                    </div>
                    <div className="col gap-1">
                      <h3 style={{ fontSize: 20 }}>{card.title}</h3>
                      <span className="muted" style={{ fontSize: 13 }}>{card.desc}</span>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: '#C8922A' }}>Requires identity verification</span>
                </div>
              )
            ))}
          </div>

          {kycVerified && (
            <div className="card row" style={{ padding: 24, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div className="col gap-2">
                <span style={{ fontSize: 14, fontWeight: 500 }}>Ready to list a business?</span>
                <span className="muted" style={{ fontSize: 13 }}>Start seller onboarding — takes about 45 minutes.</span>
              </div>
              <Button href="/seller/onboarding" variant="primary" size="sm" iconRight={<Icon.Arrow size={12} />}>List a business</Button>
            </div>
          )}

          {activeDeals.length > 0 && (
            <div className="col gap-3">
              <span className="muted" style={{ fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 500 }}>Active deals</span>
              <div className="col gap-2">
                {activeDeals.map((deal) => {
                  const conv = deal.conversations;
                  const isBuyer = conv?.buyer_id === user?.id;
                  const listing = conv?.listings;
                  return (
                    <Link
                      key={deal.id}
                      href={`/deal/${deal.conversation_id}`}
                      className="card row"
                      style={{ padding: '16px 20px', textDecoration: 'none', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}
                    >
                      <div className="col gap-1">
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{listing?.name ?? 'Deal'}</span>
                        <div className="row gap-2" style={{ alignItems: 'center' }}>
                          <span className="muted" style={{ fontSize: 12 }}>{isBuyer ? 'Buying' : 'Selling'}</span>
                          {listing?.asking_price && (
                            <>
                              <span className="muted" style={{ fontSize: 12 }}>·</span>
                              <span className="muted" style={{ fontSize: 12 }}>€{Number(listing.asking_price).toLocaleString('nl-NL')}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="row gap-2" style={{ alignItems: 'center' }}>
                        {deal.status === 'active' ? (
                          <span className="badge" style={{ fontSize: 11, color: '#0047FF', borderColor: '#0047FF33' }}>
                            Phase {conv?.current_phase ?? 1} active
                          </span>
                        ) : (
                          <span className="badge" style={{ fontSize: 11, color: '#C8922A', borderColor: '#C8922A33' }}>
                            Awaiting signatures
                          </span>
                        )}
                        <Icon.Arrow size={13} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          <div className="col gap-3">
            <span className="muted" style={{ fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 500 }}>Quick actions</span>
            <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
              <Button href="/marketplace" variant="secondary" size="sm">Browse marketplace</Button>
              <Button href="/" variant="secondary" size="sm">Chat with Ahmed AI</Button>
              <Button href="/messages" variant="ghost" size="sm">Messages</Button>
            </div>
          </div>

          <div className="card" style={{ padding: 20, background: 'var(--surface)' }}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div className="col gap-1">
                <span style={{ fontSize: 13, fontWeight: 500 }}>Signed in as</span>
                <span className="muted" style={{ fontSize: 13 }}>{user?.email}</span>
              </div>
              <div className="row gap-2">
                <span className="badge badge-verified"><Icon.Shield size={10} /> Verified account</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
