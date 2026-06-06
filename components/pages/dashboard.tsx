'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Icon, SectionEyebrow } from '@/components/ui';
import { AccountTabs } from '@/components/layout/account-tabs';
import { createClient as _createClient } from '@/lib/supabase-browser';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createClient = () => _createClient() as any;
import type { User } from '@supabase/supabase-js';

export function AccountDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{ full_name: string | null; role: string } | null>(null);
  const [listingCount, setListingCount] = useState(0);
  const [conversationCount, setConversationCount] = useState(0);
  const [signingOut, setSigningOut] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.push('/sign-in'); return; }
        setUser(session.user);

        const [{ data: prof }, { count: listings }, { count: convos }] = await Promise.all([
          supabase.from('profiles').select('full_name, role').eq('id', session.user.id).single(),
          supabase.from('listings').select('*', { count: 'exact', head: true }).eq('seller_id', session.user.id),
          supabase.from('conversations').select('*', { count: 'exact', head: true })
            .or(`buyer_id.eq.${session.user.id},seller_id.eq.${session.user.id}`),
        ]);

        if (prof) setProfile(prof);
        setListingCount(listings ?? 0);
        setConversationCount(convos ?? 0);
      } catch {
        setError('Failed to load dashboard. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    }

    load();
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <Link href="/buyer/dashboard" className="card col gap-4 card-hover" style={{ padding: 28, textDecoration: 'none' }}>
              <div className="row gap-3" style={{ alignItems: 'center' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--surface-2)', border: '0.5px solid var(--border)', display: 'grid', placeItems: 'center' }}>
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
                    {conversationCount}
                  </span>
                  <span className="muted" style={{ fontSize: 12 }}>Active conversations</span>
                </div>
                <div className="col gap-1">
                  <span className="tabular" style={{ fontSize: 28, fontWeight: 500, letterSpacing: -1 }}>—</span>
                  <span className="muted" style={{ fontSize: 12 }}>AI matches</span>
                </div>
              </div>
              <span className="row gap-2" style={{ fontSize: 13, color: 'var(--blue)', marginTop: 4 }}>
                Open buyer dashboard <Icon.Arrow size={12} />
              </span>
            </Link>

            <Link href="/seller/dashboard" className="card col gap-4 card-hover" style={{ padding: 28, textDecoration: 'none' }}>
              <div className="row gap-3" style={{ alignItems: 'center' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--surface-2)', border: '0.5px solid var(--border)', display: 'grid', placeItems: 'center' }}>
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
                    {listingCount}
                  </span>
                  <span className="muted" style={{ fontSize: 12 }}>
                    {listingCount === 1 ? 'Listing' : 'Listings'}
                  </span>
                </div>
                <div className="col gap-1">
                  <span className="tabular" style={{ fontSize: 28, fontWeight: 500, letterSpacing: -1 }}>{conversationCount}</span>
                  <span className="muted" style={{ fontSize: 12 }}>Inquiries</span>
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
              <span className="muted" style={{ fontSize: 13 }}>Start seller onboarding — same account, no extra signup.</span>
            </div>
            <Button href="/seller/onboarding" variant="primary" size="sm" iconRight={<Icon.Arrow size={12} />}>List a business</Button>
          </div>

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
