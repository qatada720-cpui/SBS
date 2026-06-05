'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Icon, SectionEyebrow } from '@/components/ui';
import { createClient } from '@/lib/supabase-browser';

type PendingListing = {
  id: string;
  name: string;
  sector: string;
  location: string;
  revenue: string;
  ebitda: string;
  asking_price: number;
  description: string;
  score: number;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  seller_id: string;
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    pending_review: { label: 'Pending review', color: '#C8922A', bg: '#C8922A18' },
    live:           { label: 'Live',           color: '#00A86B', bg: '#00A86B18' },
    rejected:       { label: 'Rejected',       color: '#FF3B30', bg: '#FF3B3018' },
    draft:          { label: 'Draft',          color: 'var(--muted)', bg: 'var(--surface-2)' },
  };
  const s = map[status] ?? map.draft;
  return (
    <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 999, color: s.color, background: s.bg, letterSpacing: 0.2 }}>
      {s.label}
    </span>
  );
}

export function AdminListingsPage() {
  const router = useRouter();
  const [listings, setListings] = useState<PendingListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending_review' | 'live' | 'rejected' | 'all'>('pending_review');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [working, setWorking] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('listings')
      .select('id, name, sector, location, revenue, ebitda, asking_price, description, score, status, rejection_reason, created_at, seller_id')
      .order('created_at', { ascending: false });
    setListings((data ?? []) as PendingListing[]);
    setLoading(false);
  }

  async function approve(id: string) {
    setWorking(id);
    const supabase = createClient();
    await supabase.from('listings').update({ status: 'live', reviewed_at: new Date().toISOString(), rejection_reason: null }).eq('id', id);
    setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'live', rejection_reason: null } : l));
    setWorking(null);
  }

  async function reject(id: string) {
    if (!rejectReason.trim()) return;
    setWorking(id);
    const supabase = createClient();
    await supabase.from('listings').update({ status: 'rejected', reviewed_at: new Date().toISOString(), rejection_reason: rejectReason.trim() }).eq('id', id);
    setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'rejected', rejection_reason: rejectReason.trim() } : l));
    setRejectingId(null);
    setRejectReason('');
    setWorking(null);
  }

  const filtered = filter === 'all' ? listings : listings.filter(l => l.status === filter);
  const counts = {
    pending_review: listings.filter(l => l.status === 'pending_review').length,
    live: listings.filter(l => l.status === 'live').length,
    rejected: listings.filter(l => l.status === 'rejected').length,
    all: listings.length,
  };

  return (
    <div className="page-enter">
      <section style={{ padding: '40px 0 0' }}>
        <div className="container col gap-4">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div className="col gap-2">
              <SectionEyebrow>Admin</SectionEyebrow>
              <h1 style={{ fontSize: 36 }}>Listing review</h1>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>← Back to dashboard</Button>
          </div>

          <div className="row gap-3" style={{ flexWrap: 'wrap' }}>
            {[
              { id: 'pending_review' as const, label: 'Pending review' },
              { id: 'live' as const, label: 'Approved' },
              { id: 'rejected' as const, label: 'Rejected' },
              { id: 'all' as const, label: 'All' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                style={{
                  fontSize: 13, fontWeight: 500, padding: '6px 14px', borderRadius: 999,
                  background: filter === f.id ? 'var(--fg)' : 'var(--surface-2)',
                  color: filter === f.id ? 'var(--bg)' : 'var(--subtle)',
                  cursor: 'pointer',
                }}
              >
                {f.label}
                <span style={{ marginLeft: 6, opacity: 0.6 }}>{counts[f.id]}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '32px 0 96px' }}>
        <div className="container col gap-4">
          {loading ? (
            <div style={{ height: 200, background: 'var(--surface-2)', borderRadius: 10, animation: 'pulse 1.5s ease-in-out infinite' }} />
          ) : filtered.length === 0 ? (
            <div className="col" style={{ padding: '64px 0', alignItems: 'center', gap: 12, textAlign: 'center' }}>
              <p style={{ fontSize: 15, fontWeight: 500 }}>No listings here</p>
              <p className="muted" style={{ fontSize: 13 }}>Check a different filter above.</p>
            </div>
          ) : filtered.map(l => (
            <div key={l.id} className="card col gap-4" style={{ padding: 24 }}>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                <div className="col gap-2" style={{ flex: 1 }}>
                  <div className="row gap-3" style={{ alignItems: 'center' }}>
                    <span style={{ fontSize: 17, fontWeight: 500 }}>{l.name || '(no name)'}</span>
                    <StatusBadge status={l.status} />
                  </div>
                  <div className="row gap-2 muted" style={{ fontSize: 12, flexWrap: 'wrap' }}>
                    <span>{l.sector}</span>
                    {l.location && <><Icon.Dot size={3} /><span>{l.location}</span></>}
                    {l.asking_price && <><Icon.Dot size={3} /><span>€{(l.asking_price / 1_000_000).toFixed(1)}M asking</span></>}
                    {l.score != null && <><Icon.Dot size={3} /><span>Score {l.score}%</span></>}
                    <Icon.Dot size={3} />
                    <span>{new Date(l.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  {l.description && (
                    <p className="subtle" style={{ fontSize: 13, fontWeight: 300, margin: 0, lineHeight: 1.6 }}>
                      {l.description.slice(0, 240)}{l.description.length > 240 ? '…' : ''}
                    </p>
                  )}
                  {l.status === 'rejected' && l.rejection_reason && (
                    <div style={{ background: '#FF3B3011', border: '0.5px solid #FF3B3044', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#FF3B30' }}>
                      Rejection reason: {l.rejection_reason}
                    </div>
                  )}
                </div>

                {l.status === 'pending_review' && (
                  <div className="row gap-2" style={{ flexShrink: 0 }}>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={working === l.id}
                      onClick={() => approve(l.id)}
                    >
                      {working === l.id ? '…' : 'Approve'}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => { setRejectingId(l.id); setRejectReason(''); }}
                    >
                      Reject
                    </Button>
                  </div>
                )}

                {l.status === 'live' && (
                  <div className="row gap-2" style={{ flexShrink: 0 }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setRejectingId(l.id); setRejectReason(''); }}
                    >
                      Revoke & reject
                    </Button>
                  </div>
                )}
              </div>

              {rejectingId === l.id && (
                <div className="col gap-3 hair" style={{ padding: 16, borderRadius: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>Reason for rejection</span>
                  <textarea
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="Explain why this listing is rejected. The seller will see this."
                    rows={3}
                    style={{
                      width: '100%', fontSize: 13, padding: 12, borderRadius: 8,
                      border: '0.5px solid var(--border-strong)', background: 'var(--surface)',
                      color: 'var(--fg)', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5,
                      boxSizing: 'border-box',
                    }}
                  />
                  <div className="row gap-2">
                    <Button variant="primary" size="sm" disabled={!rejectReason.trim() || working === l.id} onClick={() => reject(l.id)}>
                      {working === l.id ? 'Rejecting…' : 'Confirm rejection'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setRejectingId(null); setRejectReason(''); }}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
