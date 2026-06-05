'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Icon, VerifiedBadge, ScoreBar, PhaseTracker, ListingCard, SectionEyebrow } from '@/components/ui';
import { SECTORS, PHASES, REVIEWS } from '@/lib/data';
import type { Listing } from '@/lib/data';
import { createClient as _createClient } from '@/lib/supabase-browser';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createClient = () => _createClient() as any;

const PRICE_RANGES = [
  { label: 'Any price', min: 0, max: 0 },
  { label: '< €500K', min: 0, max: 500_000 },
  { label: '€500K – €1M', min: 500_000, max: 1_000_000 },
  { label: '€1M – €5M', min: 1_000_000, max: 5_000_000 },
  { label: '€5M+', min: 5_000_000, max: 0 },
];

function formatEur(n: number): string {
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `€${Math.round(n / 1_000)}K`;
  return `€${n}`;
}

type DbListing = {
  id: string; name: string; sector: string; location: string;
  revenue: number; ebitda: number; asking_price: number;
  description: string | null; score: number; verified: boolean;
  photos: string[];
};

function toCard(r: DbListing): Listing {
  return {
    id: r.id, name: r.name, sector: r.sector, location: r.location,
    revenue: formatEur(r.revenue),
    ebitda: r.ebitda ? formatEur(r.ebitda) : undefined,
    asking: formatEur(r.asking_price),
    score: r.score, verified: r.verified,
    photos: r.photos?.length ?? 0,
    description: r.description ?? '',
  };
}

export function MarketplacePage({ searchParams = {} }: { searchParams?: Record<string, string> }) {
  const router = useRouter();

  const [q, setQ] = useState(searchParams.q ?? '');
  const [sector, setSector] = useState(searchParams.sector ?? 'All sectors');
  const [priceRange, setPriceRange] = useState(searchParams.price ?? 'Any price');
  const [verifiedOnly, setVerifiedOnly] = useState(searchParams.verified === 'true');
const [sort, setSort] = useState(searchParams.sort ?? 'score');

  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function pushUrl(overrides: Record<string, string>) {
    const p: Record<string, string> = { q, sector, price: priceRange, sort, verified: String(verifiedOnly), ...overrides };
    const sp = new URLSearchParams();
    if (p.q) sp.set('q', p.q);
    if (p.sector && p.sector !== 'All sectors') sp.set('sector', p.sector);
    if (p.price && p.price !== 'Any price') sp.set('price', p.price);
    if (p.sort && p.sort !== 'score') sp.set('sort', p.sort);
    if (p.verified === 'true') sp.set('verified', 'true');
    const qs = sp.toString();
    router.replace(qs ? `/marketplace?${qs}` : '/marketplace', { scroll: false });
  }

  const fetchListings = useCallback(async (search: string) => {
    setLoading(true);
    const supabase = createClient();
    const range = PRICE_RANGES.find(r => r.label === priceRange) ?? PRICE_RANGES[0];

    let query = supabase
      .from('listings')
      .select('id,name,sector,location,revenue,ebitda,asking_price,description,score,verified,photos', { count: 'exact' })
      .eq('status', 'live');

    if (search.trim()) query = query.or(`name.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%`);
    if (sector !== 'All sectors') query = query.eq('sector', sector);
    if (range.min > 0) query = query.gte('asking_price', range.min);
    if (range.max > 0) query = query.lte('asking_price', range.max);
    if (verifiedOnly) query = query.eq('verified', true);

    if (sort === 'score') query = query.order('score', { ascending: false });
    else if (sort === 'price_asc') query = query.order('asking_price', { ascending: true });
    else if (sort === 'price_desc') query = query.order('asking_price', { ascending: false });
    else if (sort === 'newest') query = query.order('created_at', { ascending: false });

    const { data, count } = await query;
    setListings((data ?? []).map(r => toCard(r as DbListing)));
    setTotal(count ?? 0);
    setLoading(false);
  }, [sector, priceRange, verifiedOnly, sort]);

  // Debounce search input, immediate for other filters
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchListings(q), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [q, fetchListings]);

  function resetFilters() {
    setQ(''); setSector('All sectors'); setPriceRange('Any price');
    setVerifiedOnly(false); setSort('score');
    router.replace('/marketplace', { scroll: false });
  }

  const hasActiveFilters = q || sector !== 'All sectors' || priceRange !== 'Any price' || verifiedOnly;

  return (
    <div className="page-enter">
      <section style={{ padding: '56px 0 32px' }}>
        <div className="container col gap-3">
          <SectionEyebrow>Marketplace</SectionEyebrow>
          <div className="row mobile-wrap" style={{ justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}>
            <h1 style={{ fontSize: 48 }}>
              {loading ? '…' : total} verified {total === 1 ? 'business' : 'businesses'}
            </h1>
            <div className="row gap-3 mobile-full" style={{ flex: 1, minWidth: 0 }}>
              <div className="row hair" style={{ padding: '0 12px', height: 36, borderRadius: 8, gap: 8, flex: 1, minWidth: 0 }}>
                <Icon.Search size={14} />
                <input
                  value={q}
                  onChange={e => { setQ(e.target.value); pushUrl({ q: e.target.value }); }}
                  placeholder="Search by name or description"
                  style={{ border: 'none', padding: 0, height: '100%', background: 'transparent', fontSize: 13 }}
                />
              </div>
              <select
                value={sort}
                onChange={e => { setSort(e.target.value); pushUrl({ sort: e.target.value }); }}
                style={{ height: 36, padding: '0 12px', fontSize: 13, width: 'auto', appearance: 'none', background: 'transparent' }}
              >
                <option value="score">Sort: Listing score</option>
                <option value="newest">Sort: Newest first</option>
                <option value="price_asc">Sort: Price ↑</option>
                <option value="price_desc">Sort: Price ↓</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <section className="hair-t" style={{ padding: '20px 0' }}>
        <div className="container col gap-3">
          <div className="row gap-2 scroll-x">
            {SECTORS.map(s => (
              <button key={s} className={`chip ${sector === s ? 'active' : ''}`}
                onClick={() => { setSector(s); pushUrl({ sector: s }); }}>{s}</button>
            ))}
          </div>
          <div className="row" style={{ justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div className="row gap-2">
              {PRICE_RANGES.map(r => (
                <button key={r.label} className={`chip ${priceRange === r.label ? 'active' : ''}`}
                  onClick={() => { setPriceRange(r.label); pushUrl({ price: r.label }); }}>{r.label}</button>
              ))}
            </div>
            <div className="row gap-3">
              <label className="row gap-2" style={{ fontSize: 13, cursor: 'pointer', color: verifiedOnly ? 'var(--fg)' : 'var(--subtle)' }}>
                <input type="checkbox" checked={verifiedOnly}
                  onChange={e => { setVerifiedOnly(e.target.checked); pushUrl({ verified: String(e.target.checked) }); }}
                  style={{ width: 14, height: 14, accentColor: 'var(--blue)' }} />
                Verified only
              </label>
              {hasActiveFilters && (
                <button onClick={resetFilters} style={{ fontSize: 13, color: 'var(--subtle)', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}>
                  Reset filters
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '40px 0 64px' }}>
        <div className="container">
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} style={{ height: 280, background: 'var(--surface-2)', borderRadius: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />
              ))}
            </div>
          ) : listings.length === 0 && !hasActiveFilters ? (
            <div className="col" style={{ padding: '80px 0', alignItems: 'center', gap: 16, textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--surface)', border: '0.5px solid var(--hair)', display: 'grid', placeItems: 'center' }}>
                <Icon.Building size={22} />
              </div>
              <div className="col gap-2">
                <p style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>No listings yet</p>
                <p className="muted" style={{ fontSize: 14, maxWidth: 380, margin: 0 }}>
                  We're currently onboarding our first verified businesses. Are you a seller? List your business now and be first on the platform.
                </p>
              </div>
              <Link href="/seller/onboarding" className="btn btn-primary">List your business</Link>
            </div>
          ) : listings.length === 0 ? (
            <div className="col" style={{ padding: 80, alignItems: 'center', gap: 12 }}>
              <Icon.Search size={24} />
              <p className="muted">No listings match these filters.</p>
              <Button variant="secondary" size="sm" onClick={resetFilters}>Reset filters</Button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {listings.map(l => (
                <ListingCard key={l.id} listing={l} href={`/listing/${l.id}`} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export function ListingPage({ listingId }: { listingId: string }) {
  const [listing, setListing] = useState<Listing | null | undefined>(undefined);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from('listings')
        .select('*')
        .eq('id', listingId)
        .single();
      if (!data) { setListing(null); return; }
      setListing({
        id: String(data.id),
        name: data.name ?? '',
        sector: data.sector ?? '',
        location: data.location ?? '',
        revenue: data.revenue ? `€${(Number(data.revenue) / 1_000_000).toFixed(1)}M` : '',
        ebitda: data.ebitda ? `€${(Number(data.ebitda) / 1_000_000).toFixed(1)}M` : '',
        asking: data.asking_price ? `€${(Number(data.asking_price) / 1_000_000).toFixed(1)}M` : '',
        score: data.score ?? 0,
        verified: !!data.verified,
        founded: data.founded ? String(data.founded) : '',
        employees: data.employees ? String(data.employees) : '',
        photos: data.photos ?? 4,
        description: data.description ?? '',
      } as Listing);
    }
    load();
  }, [listingId]);

  if (listing === undefined) return (
    <div className="page-enter">
      <section style={{ padding: '80px 0', textAlign: 'center' }}>
        <div className="container"><div style={{ height: 200, background: 'var(--surface-2)', borderRadius: 10, animation: 'pulse 1.5s ease-in-out infinite' }} /></div>
      </section>
    </div>
  );

  if (listing === null) return (
    <div className="page-enter">
      <section style={{ padding: '80px 0', textAlign: 'center' }}>
        <div className="container col gap-4" style={{ alignItems: 'center' }}>
          <p style={{ fontSize: 18, fontWeight: 600 }}>Listing not found</p>
          <p className="muted">This listing may have been removed or is no longer available.</p>
          <Link href="/marketplace" className="btn btn-primary">Back to marketplace</Link>
        </div>
      </section>
    </div>
  );

  const breakdown = [
    { label: 'Identity & ownership verified', weight: 15, done: true },
    { label: '3 years of financials', weight: 20, done: true },
    { label: 'Tax filings cross-checked', weight: 15, done: true },
    { label: 'Trade references (min. 3)', weight: 10, done: true },
    { label: 'AI-narrative approved', weight: 10, done: true },
    { label: 'Data room populated', weight: 15, done: listing.score >= 80 },
    { label: 'Phased ownership template signed', weight: 10, done: listing.score >= 85 },
  ];

  return (
    <div className="page-enter">
      {/* breadcrumb */}
      <section style={{ padding: '32px 0 0' }}>
        <div className="container row gap-2" style={{ fontSize: 12, color: 'var(--muted)' }}>
          <Link href="/marketplace" style={{ cursor: 'pointer' }}>Marketplace</Link>
          <span>/</span>
          <span>{listing.sector}</span>
          <span>/</span>
          <span style={{ color: 'var(--fg)' }}>{listing.name}</span>
        </div>
      </section>

      {/* Header */}
      <section style={{ padding: '24px 0' }}>
        <div className="container row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 32 }}>
          <div className="col gap-4" style={{ maxWidth: 720 }}>
            <div className="row gap-2">
              {listing.verified && <VerifiedBadge />}
              <span className="badge badge-neutral">Listed 12 days ago</span>
            </div>
            <h1 style={{ fontSize: 48 }}>{listing.name}</h1>
            <div className="row gap-3 muted" style={{ fontSize: 14 }}>
              <span>{listing.sector}</span>
              <Icon.Dot size={4} />
              <span>{listing.location}</span>
              <Icon.Dot size={4} />
              <span>Founded {listing.founded || 'N/A'}</span>
              <Icon.Dot size={4} />
              <span>{listing.employees} employees</span>
            </div>
          </div>
          <div className="row gap-2">
            <Button variant="secondary" size="sm" icon={<Icon.Bookmark size={12} />}>Save</Button>
            <Button variant="primary" size="sm" iconRight={<Icon.Arrow size={12} />}>Express interest</Button>
          </div>
        </div>
      </section>

      {/* Photo gallery */}
      <section style={{ padding: '0 0 32px' }}>
        <div className="container">
          <div className="row" style={{ gap: 8, height: 480 }}>
            <div className="img-ph" style={{ flex: 2, height: '100%', borderRadius: 10 }} />
            <div className="col gap-2" style={{ flex: 1 }}>
              <div className="img-ph" style={{ flex: 1, borderRadius: 10 }} />
              <div className="row gap-2" style={{ flex: 1 }}>
                <div className="img-ph" style={{ flex: 1, borderRadius: 10 }} />
                <div className="img-ph" style={{ flex: 1, borderRadius: 10, position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.4)', color: '#FFF', fontSize: 14, fontWeight: 500, borderRadius: 10, zIndex: 3 }}>
                    +{listing.photos - 4} more
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main grid: content + sidebar */}
      <section style={{ padding: '32px 0 96px' }}>
        <div className="container row" style={{ gap: 56, alignItems: 'flex-start' }}>
          {/* Left: content */}
          <div className="col gap-8" style={{ flex: 1 }}>
            {/* Tabs */}
            <div className="row gap-6 hair-b" style={{ paddingBottom: 0 }}>
              {[
                { id: 'overview', l: 'Overview' },
                { id: 'phases', l: 'Phased ownership' },
                { id: 'financials', l: 'Financials' },
                { id: 'reviews', l: 'Buyer reviews' },
              ].map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  style={{
                    padding: '12px 0', fontSize: 14, fontWeight: 500,
                    color: tab === t.id ? 'var(--fg)' : 'var(--subtle)',
                    borderBottom: tab === t.id ? '1.5px solid var(--fg)' : '1.5px solid transparent',
                    marginBottom: -1,
                  }}>{t.l}</button>
              ))}
            </div>

            {/* Tab content */}
            {tab === 'overview' && (
              <div className="col gap-8">
                {/* AI description */}
                <div className="col gap-3">
                  <div className="row gap-2" style={{ alignItems: 'center' }}>
                    <Icon.Sparkle size={14} />
                    <span style={{ fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 1.2, color: 'var(--muted)' }}>AI-generated · approved by seller</span>
                  </div>
                  <p style={{ fontSize: 17, lineHeight: 1.6, fontWeight: 300 }}>{listing.description}</p>
                </div>

                {/* Highlights */}
                {listing.highlights && (
                  <div className="col gap-4">
                    <h3 style={{ fontSize: 20 }}>Business highlights</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0, border: '0.5px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                      {listing.highlights.map((h, i) => (
                        <div key={i} className="row gap-3" style={{ padding: 20, borderRight: i % 2 === 0 ? '0.5px solid var(--border)' : 'none', borderTop: i >= 2 ? '0.5px solid var(--border)' : 'none', alignItems: 'flex-start' }}>
                          <Icon.Check size={14} color="#00A86B" />
                          <span style={{ fontSize: 14 }}>{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key metrics */}
                <div className="col gap-4">
                  <h3 style={{ fontSize: 20 }}>Key metrics</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, border: '0.5px solid var(--border)', borderRadius: 10 }}>
                    {[
                      { k: 'Annual revenue', v: listing.revenue },
                      { k: 'EBITDA', v: listing.ebitda || '—' },
                      { k: 'Asking price', v: listing.asking },
                      { k: 'Employees', v: listing.employees },
                    ].map((m, i) => (
                      <div key={i} className="col gap-2" style={{ padding: 20, borderRight: i < 3 ? '0.5px solid var(--border)' : 'none' }}>
                        <div className="muted" style={{ fontSize: 11 }}>{m.k}</div>
                        <div className="tabular" style={{ fontSize: 20, fontWeight: 500, letterSpacing: -0.4 }}>{m.v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === 'phases' && (
              <div className="col gap-6">
                <div className="col gap-3">
                  <h3>Phased ownership transfer</h3>
                  <p className="subtle" style={{ fontSize: 14, fontWeight: 300, maxWidth: 560 }}>
                    This listing uses our default 3-phase contract. Equity transfers as milestones clear; funds are held by an AFM-registered escrow trustee between phases.
                  </p>
                </div>
                <div className="card" style={{ padding: 32 }}>
                  <PhaseTracker phases={PHASES} currentPhase={1} />
                </div>

                <div className="col gap-3">
                  {PHASES.map((p, i) => (
                    <div key={i} className="card row gap-6" style={{ padding: 24, alignItems: 'flex-start' }}>
                      <div style={{ minWidth: 80 }}>
                        <div className="muted" style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>Phase {i + 1}</div>
                        <div className="tabular" style={{ fontSize: 28, fontWeight: 500, letterSpacing: -1, marginTop: 4 }}>{p.ownership}%</div>
                        <div className="muted" style={{ fontSize: 11 }}>ownership</div>
                      </div>
                      <div className="col gap-2" style={{ flex: 1 }}>
                        <h4>{p.title}</h4>
                        <p className="subtle" style={{ fontSize: 13, fontWeight: 300 }}>{p.desc}</p>
                        <div className="row gap-4 muted" style={{ fontSize: 12, marginTop: 8 }}>
                          <span className="row gap-2"><Icon.Lock size={11} /> Escrow trigger: {['NDA + deposit', 'KPI gate cleared', 'Final earn-out'][i]}</span>
                          <span className="row gap-2"><Icon.Doc size={11} /> Duration: {['2–4 weeks', '4–8 months', '6–12 months'][i]}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'financials' && (
              <div className="col gap-6">
                <div className="col gap-3">
                  <h3>Verified financials</h3>
                  <p className="subtle" style={{ fontSize: 14, fontWeight: 300, maxWidth: 560 }}>
                    Full P&L, balance sheet, and cap table available in the data room after NDA + escrow deposit.
                  </p>
                </div>
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                        <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 500, color: 'var(--muted)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>Metric</th>
                        <th style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 500, color: 'var(--muted)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>2023</th>
                        <th style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 500, color: 'var(--muted)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>2024</th>
                        <th style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 500, color: 'var(--muted)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>2025</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['Revenue', '€2.1M', '€2.3M', '€2.4M'],
                        ['Gross profit', '€840K', '€920K', '€984K'],
                        ['EBITDA', '€420K', '€450K', '€480K'],
                        ['EBITDA margin', '20.0%', '19.6%', '20.0%'],
                        ['Headcount', '12', '13', '14'],
                      ].map((r, i) => (
                        <tr key={i} style={{ borderTop: '0.5px solid var(--border)' }}>
                          <td style={{ padding: '14px 20px' }}>{r[0]}</td>
                          <td className="tabular" style={{ padding: '14px 20px', textAlign: 'right' }}>{r[1]}</td>
                          <td className="tabular" style={{ padding: '14px 20px', textAlign: 'right' }}>{r[2]}</td>
                          <td className="tabular" style={{ padding: '14px 20px', textAlign: 'right', fontWeight: 500 }}>{r[3]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="row gap-3 hair" style={{ padding: 20, borderRadius: 10, alignItems: 'center' }}>
                  <Icon.Lock size={14} />
                  <span style={{ fontSize: 13, flex: 1 }}>Full financials available after NDA + €5K refundable escrow deposit.</span>
                  <Button variant="secondary" size="sm">Request data room</Button>
                </div>
              </div>
            )}

            {tab === 'reviews' && (
              <div className="col gap-6">
                <div className="col gap-3">
                  <h3>Reviews from past buyers & sellers</h3>
                  <div className="row gap-3" style={{ alignItems: 'center' }}>
                    <div className="row gap-1">
                      {[1, 2, 3, 4, 5].map(s => <Icon.Star key={s} size={14} color="#C8922A" filled />)}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>4.9</span>
                    <span className="muted" style={{ fontSize: 13 }}>no reviews yet</span>
                  </div>
                </div>
                <div className="col gap-4">
                  {REVIEWS.map((r, i) => (
                    <div key={i} className="card col gap-3" style={{ padding: 24 }}>
                      <div className="row" style={{ justifyContent: 'space-between' }}>
                        <div className="row gap-3">
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface-2)', border: '0.5px solid var(--border)' }} />
                          <div className="col" style={{ gap: 2 }}>
                            <span style={{ fontSize: 14, fontWeight: 500 }}>{r.name}</span>
                            <span className="muted" style={{ fontSize: 12 }}>{r.role}</span>
                          </div>
                        </div>
                        <div className="col" style={{ alignItems: 'flex-end', gap: 4 }}>
                          <div className="row gap-1">
                            {[1, 2, 3, 4, 5].map(s => <Icon.Star key={s} size={11} color="#C8922A" filled={s <= r.rating} />)}
                          </div>
                          <span className="muted" style={{ fontSize: 11 }}>{r.date}</span>
                        </div>
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 300, lineHeight: 1.55 }}>{r.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: sidebar */}
          <aside className="col gap-4" style={{ position: 'sticky', top: 88, width: 340 }}>
            <div className="card col gap-4" style={{ padding: 24 }}>
              <div className="col gap-2">
                <span className="muted" style={{ fontSize: 12 }}>Asking price</span>
                <div className="tabular" style={{ fontSize: 32, fontWeight: 500, letterSpacing: -1 }}>{listing.asking}</div>
                <div className="row gap-2 muted" style={{ fontSize: 12 }}>
                  <span>{listing.revenue}</span>
                  <Icon.Dot size={3} />
                  <span>~{listing.ebitda ? '4×' : '—'} EBITDA</span>
                </div>
              </div>
              <div className="col gap-2">
                <Button variant="primary" size="md" iconRight={<Icon.Arrow size={12} />}>Express interest</Button>
                <Button variant="secondary" size="md" icon={<Icon.Message size={12} />}>Message seller</Button>
                <Button variant="ghost" size="sm" icon={<Icon.Doc size={12} />}>Download teaser PDF</Button>
              </div>
              <p className="muted" style={{ fontSize: 11, lineHeight: 1.5 }}>
                Expressing interest does not commit you to anything. A coordinator reviews your buyer profile before connecting you with the seller.
              </p>
            </div>

            <div className="card col gap-4" style={{ padding: 24 }}>
              <div className="col gap-2">
                <span style={{ fontSize: 12, fontWeight: 500 }}>Listing score</span>
                <div className="tabular" style={{ fontSize: 32, fontWeight: 500, letterSpacing: -1 }}>{listing.score}%</div>
              </div>
              <ScoreBar score={listing.score} breakdown={breakdown.slice(0, 5)} />
              <button style={{ fontSize: 12, color: 'var(--subtle)', textDecoration: 'underline', textUnderlineOffset: 3 }}>How is this calculated?</button>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

export function AIMatchPage() {
  const router = useRouter();
  const [scored, setScored] = useState<{ id: string; fit: number; reasons: string[]; listing: Record<string, unknown> }[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('sbs_matches');
      if (raw) setScored(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);

  return (
    <div className="page-enter">
      <section style={{ padding: '64px 0 32px' }}>
        <div className="container col gap-3">
          <div className="row gap-2">
            <Icon.Sparkle size={14} />
            <span style={{ fontSize: 12, color: 'var(--muted)', letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 500 }}>
              Ahmed AI · {scored.length} matches
            </span>
          </div>
          <h1 style={{ fontSize: 48 }}>Businesses that fit your profile.</h1>
          <p className="subtle" style={{ fontSize: 16, fontWeight: 300, maxWidth: 620 }}>
            Every listing is scored from <strong>1 to 100</strong> based on what you told Ahmed AI. Higher is a stronger fit.
          </p>
        </div>
      </section>

      <section style={{ padding: '16px 0 80px' }}>
        <div className="container col gap-4">
          {loaded && scored.length === 0 && (
            <div className="col" style={{ padding: '60px 0', alignItems: 'center', gap: 16, textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--surface)', border: '0.5px solid var(--hair)', display: 'grid', placeItems: 'center' }}>
                <Icon.Sparkle size={22} />
              </div>
              <div className="col gap-2">
                <p style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>No matches yet</p>
                <p className="muted" style={{ fontSize: 14, maxWidth: 400, margin: 0 }}>
                  We're onboarding our first verified listings. The more sellers list, the more specific your AI matches become.
                </p>
              </div>
              <Link href="/" className="btn btn-primary">Back to Ahmed AI</Link>
            </div>
          )}
          {scored.map((m) => {
            const l = m.listing as Record<string, unknown>;
            return (
            <div key={m.id} className="card row" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="img-ph" style={{ width: 220, minHeight: 180, borderRadius: 0, borderRight: '0.5px solid var(--border)' }} />
              <div className="col gap-4" style={{ flex: 1, padding: 28 }}>
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                  <div className="col gap-2">
                    <div className="row gap-2">
                      {Boolean(l.verified) && <VerifiedBadge />}
                    </div>
                    <h3>{String(l.name ?? '')}</h3>
                    <div className="row gap-2 muted" style={{ fontSize: 12, flexWrap: 'wrap' }}>
                      <span>{String(l.sector ?? '')}</span>
                      <Icon.Dot size={3} />
                      <span>{String(l.location ?? '')}</span>
                      <Icon.Dot size={3} />
                      <span>€{Number(l.revenue ?? 0).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="col" style={{ alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                    <div
                      className="tabular"
                      style={{
                        fontSize: 40,
                        fontWeight: 500,
                        letterSpacing: -1.5,
                        color: m.fit >= 80 ? 'var(--green)' : m.fit >= 50 ? 'var(--blue)' : 'var(--fg)',
                      }}
                    >
                      {m.fit}
                    </div>
                    <span className="muted" style={{ fontSize: 12 }}>match score / 100</span>
                    <span className="muted" style={{ fontSize: 11 }}>Asking €{Number(l.asking_price ?? 0).toLocaleString()}</span>
                  </div>
                </div>

                <div style={{ width: '100%' }}>
                  <ScoreBar score={m.fit} label="Ahmed AI match" compact />
                </div>

                <div className="col gap-2" style={{ paddingTop: 12, borderTop: '0.5px solid var(--border)' }}>
                  <span className="muted" style={{ fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 500 }}>
                    Why this matches
                  </span>
                  <div className="row gap-2" style={{ flexWrap: 'wrap', marginTop: 4 }}>
                    {m.reasons.map((r) => (
                      <span
                        key={r}
                        className="row gap-2"
                        style={{ fontSize: 12, padding: '4px 10px', borderRadius: 999, background: 'var(--surface-2)' }}
                      >
                        <Icon.Check size={10} color="#00A86B" /> {r}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="row gap-2" style={{ marginTop: 4 }}>
                  <Button href={`/listing/${String(l.id ?? '')}`} variant="primary" size="sm" iconRight={<Icon.Arrow size={12} />}>
                    View listing
                  </Button>
                  <Button variant="secondary" size="sm">Save</Button>
                </div>
              </div>
            </div>
            );
          })}

          <div className="row hair" style={{ padding: 20, borderRadius: 10, justifyContent: 'space-between', alignItems: 'center', marginTop: 16, flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontSize: 13, color: 'var(--subtle)' }}>Want to refine your answers?</span>
            <div className="row gap-2">
              <Button href="/" variant="ghost" size="sm">Chat with Ahmed AI again</Button>
              <Button variant="secondary" size="sm" onClick={() => router.push('/marketplace')}>
                Browse marketplace
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
