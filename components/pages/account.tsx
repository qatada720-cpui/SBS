'use client';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Icon, VerifiedBadge, ScoreBar, PhaseTracker, ListingCard, SectionEyebrow, Field } from '@/components/ui';
import { SECTORS, PHASES } from '@/lib/data';
import type { Listing } from '@/lib/data';
import { AccountTabs } from '@/components/layout/account-tabs';
import { createClient as _createClient } from '@/lib/supabase-browser';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createClient = () => _createClient() as any;
import type { User } from '@supabase/supabase-js';

function formatEur(n: number): string {
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `€${Math.round(n / 1_000)}K`;
  return `€${n}`;
}

type DbListing = {
  id: string; name: string; sector: string; location: string;
  revenue: number; ebitda: number; asking_price: number;
  description: string | null; score: number; verified: boolean;
  premium: boolean; photos: string[];
};

type SavedRow = {
  id: string; buyer_id: string; listing_id: string; saved_at: string;
  listings: DbListing;
};

type NdaRow = {
  id: string; listing_id: string; status: string;
};

type AiMatch = {
  id: string; fit: number; reasons: string[];
  listing: Record<string, unknown>;
};

function dbToCard(r: DbListing): Listing {
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

const SECTOR_OPTIONS = ['SaaS', 'E-commerce / DTC', 'Logistics', 'Healthcare', 'Food & Beverage', 'Automotive', 'Professional Services', 'Services', 'Other'];

const LOCATION_OPTIONS = [
  { label: 'Amsterdam, NL', flag: '🇳🇱' },
  { label: 'Rotterdam, NL', flag: '🇳🇱' },
  { label: 'The Hague, NL', flag: '🇳🇱' },
  { label: 'Utrecht, NL', flag: '🇳🇱' },
  { label: 'Eindhoven, NL', flag: '🇳🇱' },
  { label: 'Antwerp, BE', flag: '🇧🇪' },
  { label: 'Brussels, BE', flag: '🇧🇪' },
  { label: 'Ghent, BE', flag: '🇧🇪' },
  { label: 'Berlin, DE', flag: '🇩🇪' },
  { label: 'Hamburg, DE', flag: '🇩🇪' },
  { label: 'Munich, DE', flag: '🇩🇪' },
  { label: 'Frankfurt, DE', flag: '🇩🇪' },
  { label: 'Düsseldorf, DE', flag: '🇩🇪' },
  { label: 'Cologne, DE', flag: '🇩🇪' },
  { label: 'Zurich, CH', flag: '🇨🇭' },
  { label: 'Geneva, CH', flag: '🇨🇭' },
  { label: 'Vienna, AT', flag: '🇦🇹' },
  { label: 'Warsaw, PL', flag: '🇵🇱' },
  { label: 'Paris, FR', flag: '🇫🇷' },
  { label: 'London, UK', flag: '🇬🇧' },
  { label: 'Madrid, ES', flag: '🇪🇸' },
  { label: 'Remote / Online', flag: '🌐' },
];

function LocationPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [custom, setCustom] = useState(false);

  const known = LOCATION_OPTIONS.find(l => l.label === value);
  const filtered = query
    ? LOCATION_OPTIONS.filter(l => l.label.toLowerCase().includes(query.toLowerCase()))
    : LOCATION_OPTIONS;

  function selectOption(label: string) {
    onChange(label);
    setQuery('');
    setOpen(false);
    setCustom(false);
  }

  return (
    <div style={{ position: 'relative', flex: 1 }}>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          height: 42, borderRadius: 8, border: '0.5px solid var(--border-strong)',
          background: 'var(--surface)', padding: '0 12px', cursor: 'text',
        }}
        onClick={() => { setOpen(true); }}
      >
        {known && !open && <span style={{ fontSize: 16 }}>{known.flag}</span>}
        <input
          value={open ? query : (value || '')}
          onChange={e => { setQuery(e.target.value); onChange(e.target.value); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="City, Country"
          style={{
            flex: 1, fontSize: 14, background: 'transparent', border: 'none',
            outline: 'none', color: 'var(--fg)',
          }}
        />
        {value && !open && (
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); onChange(''); setQuery(''); }}
            style={{ fontSize: 16, color: 'var(--muted)', cursor: 'pointer', lineHeight: 1, padding: '0 2px' }}
          >×</button>
        )}
      </div>

      {open && (filtered.length > 0 || query) && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 50,
          background: 'var(--surface)', border: '0.5px solid var(--border-strong)',
          borderRadius: 10, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          maxHeight: 240, overflowY: 'auto',
        }}>
          {filtered.map(l => (
            <button
              key={l.label}
              type="button"
              onMouseDown={() => selectOption(l.label)}
              style={{
                width: '100%', textAlign: 'left', padding: '9px 14px',
                fontSize: 14, background: 'transparent', cursor: 'pointer',
                color: value === l.label ? 'var(--blue)' : 'var(--fg)',
                fontWeight: value === l.label ? 500 : 300,
                display: 'flex', alignItems: 'center', gap: 10,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>{l.flag}</span>
              <span>{l.label}</span>
            </button>
          ))}
          {filtered.length === 0 && query && (
            <div style={{ padding: '9px 14px', fontSize: 13, color: 'var(--muted)' }}>
              No results — press Enter to use "<strong style={{ color: 'var(--fg)' }}>{query}</strong>"
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SectorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const isOther = value !== '' && !SECTOR_OPTIONS.slice(0, -1).includes(value);
  const displayOther = isOther;

  return (
    <div style={{ position: 'relative', flex: 1 }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', textAlign: 'left', padding: '0 12px',
          height: 42, borderRadius: 8, border: '0.5px solid var(--border-strong)',
          background: 'var(--surface)', color: value ? 'var(--fg)' : 'var(--muted)',
          fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer',
        }}
      >
        <span>{displayOther ? 'Other' : (value || 'Select sector')}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 50,
          background: 'var(--surface)', border: '0.5px solid var(--border-strong)',
          borderRadius: 10, overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          {SECTOR_OPTIONS.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => {
                if (s !== 'Other') onChange(s);
                else onChange('');
                setOpen(false);
              }}
              style={{
                width: '100%', textAlign: 'left', padding: '10px 14px',
                fontSize: 14, background: 'transparent', cursor: 'pointer',
                color: (s === 'Other' ? displayOther : value === s) ? 'var(--blue)' : 'var(--fg)',
                borderBottom: s === SECTOR_OPTIONS[SECTOR_OPTIONS.length - 2] ? '0.5px solid var(--border)' : 'none',
                fontWeight: (s === 'Other' ? displayOther : value === s) ? 500 : 300,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {displayOther && (
        <input
          autoFocus
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Type your sector…"
          style={{ marginTop: 8, width: '100%', fontSize: 14, padding: '0 12px', height: 42, borderRadius: 8, border: '0.5px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--fg)', boxSizing: 'border-box' }}
        />
      )}
    </div>
  );
}

function ReferenceForm({ onAdd, sellerName }: { onAdd: (r: { name: string; company: string; email: string; status: string }) => void; sellerName: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="row hair gap-3"
        style={{ padding: '10px 14px', borderRadius: 8, color: 'var(--muted)', cursor: 'pointer', textAlign: 'left' }}>
        <span style={{ width: 20, height: 20, borderRadius: '50%', border: '0.5px solid var(--border-strong)', display: 'grid', placeItems: 'center' }}>
          <Icon.Plus size={10} />
        </span>
        <span style={{ fontSize: 13 }}>Add reference</span>
      </button>
    );
  }

  async function handleAdd() {
    if (!name || !email) return;
    setSending(true);
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setSending(false); return; }

    const { data: ref } = await supabase
      .from('trade_references')
      .insert({ seller_id: session.user.id, name, company, email })
      .select('token')
      .single();

    if (ref?.token) {
      await fetch('/api/send-reference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, company, email, sellerName, token: ref.token }),
      });
    }

    onAdd({ name, company, email, status: 'pending' });
    setName(''); setCompany(''); setEmail('');
    setOpen(false); setSending(false);
  }

  return (
    <div className="col hair gap-3" style={{ padding: 14, borderRadius: 8 }}>
      <div className="row gap-2">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Name *" style={{ flex: 1, fontSize: 13, padding: '8px 10px', borderRadius: 6, border: '0.5px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--fg)' }} />
        <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Company" style={{ flex: 1, fontSize: 13, padding: '8px 10px', borderRadius: 6, border: '0.5px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--fg)' }} />
      </div>
      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email *" type="email" style={{ fontSize: 13, padding: '8px 10px', borderRadius: 6, border: '0.5px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--fg)' }} />
      <div className="row gap-2">
        <Button variant="primary" size="sm" disabled={!name || !email || sending}
          onClick={handleAdd}>
          {sending ? 'Sending…' : 'Add & send invite'}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  );
}

export function SellerOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showMissing, setShowMissing] = useState(false);
  const [form, setForm] = useState({
    name: 'Northwind Logistics',
    sector: 'Logistics',
    location: 'Rotterdam, NL',
    founded: '2014',
    employees: '14',
    revenue: '2400000',
    ebitda: '480000',
    asking: '1900000',
    description: '',
    financialsUploaded: '' as string,
    taxFilingsUploaded: '' as string,
    photoUrls: [] as string[],
    references: [] as { name: string; company: string; email: string; status: string }[],
    phasedAccepted: false,
    customPhases: [
      { title: 'LOI & Discovery', ownership: 0 },
      { title: 'Operating handover', ownership: 51 },
      { title: 'Full ownership', ownership: 100 },
    ] as { title: string; ownership: number }[],
  });

  const steps = [
    { id: 'basics', t: 'Business basics', n: '01', weight: 15 },
    { id: 'financials', t: 'Financials', n: '02', weight: 20 },
    { id: 'verification', t: 'Verification docs', n: '03', weight: 25 },
    { id: 'narrative', t: 'AI narrative', n: '04', weight: 10 },
    { id: 'media', t: 'Photos & references', n: '05', weight: 15 },
    { id: 'phased', t: 'Phased ownership', n: '06', weight: 10 },
    { id: 'review', t: 'Review & publish', n: '07', weight: 5 },
  ];

  // Score logic — completeness driven
  const score = useMemo(() => {
    let s = 0;
    if (form.name && form.sector && form.location) s += 15;
    if (form.revenue && form.ebitda && form.asking) s += 20;
    if (form.financialsUploaded) s += 15;
    if (form.taxFilingsUploaded) s += 10;
    if (form.description && form.description.length > 40) s += 10;
    if (form.photoUrls.length >= 3) s += 10;
    if (form.references.length >= 3) s += 5;
    if (form.phasedAccepted) s += 10;
    if (step >= steps.length - 1 && form.financialsUploaded) s += 5;
    return Math.min(100, s);
  }, [form, step, steps.length]);

  const breakdown = [
    { label: 'Business basics complete', weight: 15, done: !!(form.name && form.sector && form.location) },
    { label: 'Financial summary entered', weight: 20, done: !!(form.revenue && form.ebitda && form.asking) },
    { label: '3 years of financials uploaded', weight: 15, done: !!form.financialsUploaded },
    { label: 'Tax filings uploaded', weight: 10, done: !!form.taxFilingsUploaded },
    { label: 'AI narrative approved', weight: 10, done: form.description.length > 40 },
    { label: '3+ photos uploaded', weight: 10, done: form.photoUrls.length >= 3 },
    { label: '3+ trade references', weight: 5, done: form.references.length >= 3 },
    { label: 'Phased ownership signed', weight: 10, done: form.phasedAccepted },
    { label: 'Submitted for verification', weight: 5, done: step >= steps.length - 1 && !!form.financialsUploaded },
  ];

  const stepComplete = useMemo(() => ({
    basics: !!(form.name && form.sector && form.location && form.founded && form.employees),
    financials: !!(form.revenue && form.ebitda && form.asking),
    verification: form.financialsUploaded && form.taxFilingsUploaded,
    narrative: form.description.length > 40,
    media: form.photoUrls.length >= 3 && form.references.length >= 1,
    phased: form.phasedAccepted && form.customPhases[form.customPhases.length - 1]?.ownership === 100,
    review: false,
  }), [form]);

  async function handleSubmit() {
    const allRequired = stepComplete.basics && stepComplete.financials && stepComplete.verification && stepComplete.phased;
    if (!allRequired) return;
    setSubmitting(true);
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setSubmitting(false); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('listings') as any).insert({
      seller_id: session.user.id,
      name: form.name,
      sector: form.sector,
      location: form.location,
      founded: Number(form.founded),
      employees: Number(form.employees),
      revenue: form.revenue,
      ebitda: form.ebitda,
      asking_price: Number(form.asking),
      description: form.description,
      status: 'pending_review',
      score: score,
      phases: form.customPhases,
      photos: form.photoUrls,
      documents: {
        ...(form.financialsUploaded ? { financials_path: form.financialsUploaded } : {}),
        ...(form.taxFilingsUploaded ? { tax_filings_path: form.taxFilingsUploaded } : {}),
      },
    });
    setSubmitting(false);
    router.push('/seller/dashboard');
  }

  const cur = steps[step];

  return (
    <div className="page-enter">
      <section style={{ padding: '40px 0 0' }}>
        <div className="container row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 48 }}>
          <div className="col gap-3" style={{ flex: 1 }}>
            <SectionEyebrow>Seller onboarding</SectionEyebrow>
            <h1 style={{ fontSize: 40 }}>List your business.</h1>
            <p className="subtle" style={{ fontSize: 15, fontWeight: 300, maxWidth: 520 }}>
              A complete listing typically takes 45 minutes. You can save and resume any time. Verification takes 5–10 business days after submission.
            </p>
          </div>
          <div className="card col gap-3" style={{ padding: 20, minWidth: 280 }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, fontWeight: 500 }}>Your listing score</span>
              <span className="tabular" style={{ fontSize: 18, fontWeight: 500, letterSpacing: -0.4 }}>{score}%</span>
            </div>
            <ScoreBar score={score} />
            <span className="muted" style={{ fontSize: 11 }}>A higher score means a more complete listing.</span>
          </div>
        </div>
      </section>

      <section style={{ padding: '40px 0 96px' }}>
        <div className="container row" style={{ gap: 48, alignItems: 'flex-start' }}>
          {/* Steps rail */}
          <div className="col gap-1" style={{ width: 240, position: 'sticky', top: 88 }}>
            {steps.map((s, i) => {
              const done = stepComplete[s.id as keyof typeof stepComplete];
              const active = i === step;
              return (
                <button key={s.id} onClick={() => setStep(i)}
                  className="row gap-3" style={{
                    padding: '12px 14px', borderRadius: 8, textAlign: 'left',
                    background: active ? 'var(--surface-2)' : 'transparent',
                    color: active || done ? 'var(--fg)' : 'var(--muted)',
                    transition: 'all 0.15s ease',
                  }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: '50%',
                    display: 'grid', placeItems: 'center',
                    border: '0.5px solid ' + (done ? 'var(--green)' : active ? 'var(--fg)' : 'var(--border-strong)'),
                    background: done ? 'var(--green)' : 'transparent',
                    color: done ? '#FFF' : active ? 'var(--fg)' : 'var(--muted)',
                    fontSize: 11, fontWeight: 500,
                  }}>
                    {done ? <Icon.Check size={10} color="#FFF" /> : s.n}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: active ? 500 : 400 }}>{s.t}</span>
                </button>
              );
            })}
          </div>

          {/* Step content */}
          <div className="col gap-6" style={{ flex: 1, maxWidth: 720 }}>
            <div className="col gap-2">
              <span className="muted tabular" style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 500 }}>Step {step + 1} of {steps.length}</span>
              <h2 style={{ fontSize: 32 }}>{cur.t}</h2>
            </div>

            {cur.id === 'basics' && (
              <div className="col gap-4">
                <Field label="Business name">
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </Field>
                <div className="row gap-3" style={{ alignItems: 'flex-start' }}>
                  <div className="col gap-2" style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--subtle)', letterSpacing: 0.3 }}>Sector</label>
                    <SectorPicker value={form.sector} onChange={v => setForm({ ...form, sector: v })} />
                  </div>
                  <div className="col gap-2" style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--subtle)', letterSpacing: 0.3 }}>Location</label>
                    <LocationPicker value={form.location} onChange={v => setForm({ ...form, location: v })} />
                  </div>
                </div>
                <div className="row gap-3">
                  <Field label="Year founded">
                    <input value={form.founded} onChange={e => setForm({ ...form, founded: e.target.value })} />
                  </Field>
                  <Field label="Employees">
                    <input value={form.employees} onChange={e => setForm({ ...form, employees: e.target.value })} />
                  </Field>
                </div>
              </div>
            )}

            {cur.id === 'financials' && (
              <div className="col gap-4">
                <div className="row gap-3">
                  <Field label="Annual revenue (€)" hint="Most recent fiscal year">
                    <input value={form.revenue} onChange={e => setForm({ ...form, revenue: e.target.value })} />
                  </Field>
                  <Field label="EBITDA (€)" hint="Last 12 months">
                    <input value={form.ebitda} onChange={e => setForm({ ...form, ebitda: e.target.value })} />
                  </Field>
                </div>
                <Field label="Asking price (€)" hint="You can adjust this any time before going live">
                  <input value={form.asking} onChange={e => setForm({ ...form, asking: e.target.value })} />
                </Field>
                <div className="hair col gap-2" style={{ padding: 16, borderRadius: 10, marginTop: 8 }}>
                  <div className="row gap-2" style={{ alignItems: 'center' }}>
                    <Icon.Sparkle size={12} /><span style={{ fontSize: 12, fontWeight: 500 }}>Suggested asking range</span>
                  </div>
                  <p className="subtle" style={{ fontSize: 13, fontWeight: 300 }}>
                    Based on €480K EBITDA in Logistics, comparable sales suggest €1.7M – €2.2M (3.5–4.5× EBITDA). Your asking is in the lower-middle of this range.
                  </p>
                </div>
              </div>
            )}

            {cur.id === 'verification' && (
              <div className="col gap-3">
                {([
                  { k: 'financialsUploaded' as const, label: 'Last 3 years of financials', desc: 'P&L, balance sheet, cash flow. PDF or XLSX.', accept: '.pdf,.xlsx,.xls' },
                  { k: 'taxFilingsUploaded' as const, label: 'Tax filings', desc: 'Last 3 fiscal-year corporate tax filings. PDF or image.', accept: '.pdf,.jpg,.jpeg,.png' },
                ]).map(u => (
                  <div key={u.k} className="card col gap-3" style={{ padding: 20 }}>
                    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div className="col" style={{ gap: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 500 }}>{u.label}</span>
                        <span className="muted" style={{ fontSize: 12 }}>{u.desc}</span>
                      </div>
                      {form[u.k]
                        ? <span className="badge badge-verified"><Icon.Check size={10} /> Uploaded</span>
                        : <label style={{ cursor: 'pointer' }}>
                            <input
                              type="file"
                              accept={u.accept}
                              style={{ display: 'none' }}
                              onChange={async e => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const supabase = createClient();
                                const { data: { session } } = await supabase.auth.getSession();
                                if (!session) return;
                                const path = `${session.user.id}/${u.k}/${Date.now()}_${file.name}`;
                                const { error } = await supabase.storage.from('listing-documents').upload(path, file, { upsert: true });
                                setForm(f => ({ ...f, [u.k]: error ? file.name : path }));
                              }}
                            />
                            <span className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, pointerEvents: 'none' }}>
                              <Icon.Upload size={12} /> Upload
                            </span>
                          </label>}
                    </div>
                    {form[u.k] && (
                      <div className="row gap-3 hair" style={{ padding: '10px 14px', borderRadius: 6, fontSize: 12, color: 'var(--subtle)' }}>
                        <Icon.Doc size={12} />
                        <span style={{ flex: 1 }}>{form[u.k]}</span>
                        <button onClick={() => setForm({ ...form, [u.k]: '' })} style={{ color: 'var(--muted)' }}><Icon.X size={11} /></button>
                      </div>
                    )}
                  </div>
                ))}
                <div className="row gap-3 hair" style={{ padding: 16, borderRadius: 10, alignItems: 'flex-start', marginTop: 8 }}>
                  <Icon.Shield size={14} />
                  <p className="subtle" style={{ fontSize: 12, fontWeight: 300, flex: 1 }}>
                    Documents are encrypted at rest and only released to buyers after they sign an NDA and fund the refundable escrow deposit.
                  </p>
                </div>
              </div>
            )}

            {cur.id === 'narrative' && (
              <div className="col gap-4">
                <div className="hair col gap-3" style={{ padding: 20, borderRadius: 10 }}>
                  <div className="row gap-2" style={{ alignItems: 'center' }}>
                    <Icon.Sparkle size={14} />
                    <span style={{ fontSize: 12, fontWeight: 500, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)' }}>AI-drafted from your financials</span>
                  </div>
                  <p className="subtle" style={{ fontSize: 13, fontWeight: 300 }}>
                    We've drafted a listing narrative based on your uploaded documents. Edit it as you like — buyers see exactly what you approve.
                  </p>
                  <Button variant="secondary" size="sm" icon={<Icon.Sparkle size={12} />}
                    onClick={() => setForm({ ...form, description: 'Boutique freight forwarder with a 9-year operating history, recurring B2B contracts (78% of revenue), and a tenured ops team. Strong margins from a niche route concentration between BeNeLux and DACH. Owner is seeking a structured handover to focus on a parallel venture.' })}>
                    Generate draft
                  </Button>
                </div>
                <Field label="Listing narrative" hint="Buyers see this first. Keep it factual.">
                  <textarea rows={8} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe the business — what it does, why it's a good acquisition, what's working." style={{ resize: 'vertical', minHeight: 180 }} />
                </Field>
              </div>
            )}

            {cur.id === 'media' && (
              <div className="col gap-4">
                <Field label="Photos" hint="Office, premises, team, product. Minimum 3 recommended.">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {form.photoUrls.map((url, i) => (
                      <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', border: '0.5px solid var(--border)' }}>
                        <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          onClick={() => setForm(f => ({ ...f, photoUrls: f.photoUrls.filter((_, j) => j !== i) }))}
                          style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer' }}
                        >
                          <Icon.X size={10} />
                        </button>
                      </div>
                    ))}
                    {form.photoUrls.length < 8 && (
                      <label style={{ aspectRatio: '1', borderRadius: 8, border: '0.5px dashed var(--border)', display: 'grid', placeItems: 'center', color: 'var(--muted)', cursor: 'pointer' }}>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          multiple
                          style={{ display: 'none' }}
                          onChange={async e => {
                            const files = Array.from(e.target.files ?? []);
                            if (!files.length) return;
                            const supabase = createClient();
                            const { data: { session } } = await supabase.auth.getSession();
                            if (!session) return;
                            const newUrls: string[] = [];
                            for (const file of files) {
                              if (form.photoUrls.length + newUrls.length >= 8) break;
                              const path = `${session.user.id}/${Date.now()}_${file.name}`;
                              const { error } = await supabase.storage.from('listing-photos').upload(path, file, { upsert: true });
                              if (!error) {
                                const { data: { publicUrl } } = supabase.storage.from('listing-photos').getPublicUrl(path);
                                newUrls.push(publicUrl);
                              }
                            }
                            setForm(f => ({ ...f, photoUrls: [...f.photoUrls, ...newUrls] }));
                            e.target.value = '';
                          }}
                        />
                        <Icon.Plus size={16} />
                      </label>
                    )}
                  </div>
                  <span className="muted" style={{ fontSize: 12, marginTop: 4 }}>{form.photoUrls.length} / 8 geüpload · minimaal 3 vereist</span>
                </Field>

                <Field label="Trade references" hint="Customers, suppliers, advisors. Minimum 3 recommended.">
                  <div className="col gap-2">
                    {form.references.map((r, i) => (
                      <div key={i} className="row hair gap-3" style={{ padding: '10px 14px', borderRadius: 8, alignItems: 'center' }}>
                        {r.status === 'verified'
                          ? <Icon.Check size={12} color="#00A86B" />
                          : <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#C8922A', display: 'inline-block', flexShrink: 0 }} />}
                        <div className="col" style={{ flex: 1, gap: 1 }}>
                          <span style={{ fontSize: 13, fontWeight: 500 }}>{r.name}{r.company ? ` — ${r.company}` : ''}</span>
                          <span className="muted" style={{ fontSize: 12 }}>{r.email}</span>
                        </div>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999,
                          background: r.status === 'verified' ? '#00A86B18' : '#C8922A18',
                          color: r.status === 'verified' ? '#00A86B' : '#C8922A', fontWeight: 500 }}>
                          {r.status === 'verified' ? 'Verified' : 'Invite sent'}
                        </span>
                        <button onClick={() => setForm(f => ({ ...f, references: f.references.filter((_, j) => j !== i) }))} style={{ color: 'var(--muted)', cursor: 'pointer' }}>
                          <Icon.X size={11} />
                        </button>
                      </div>
                    ))}
                    {form.references.length < 4 && (
                      <ReferenceForm
                        sellerName={form.name || 'the seller'}
                        onAdd={ref => setForm(f => ({ ...f, references: [...f.references, ref] }))}
                      />
                    )}
                  </div>
                </Field>
              </div>
            )}

            {cur.id === 'phased' && (
              <div className="col gap-4">
                <p className="subtle" style={{ fontSize: 14, fontWeight: 300, maxWidth: 560 }}>
                  Define how ownership transfers to the buyer. Add as many phases as you like — the final phase must reach 100%. Buyers see this structure before making an offer.
                </p>

                {form.customPhases.length > 0 && (
                  <div className="card" style={{ padding: 28 }}>
                    <PhaseTracker phases={form.customPhases} currentPhase={1} compact />
                  </div>
                )}

                <div className="col gap-2">
                  {form.customPhases.map((p, i) => {
                    const isLast = i === form.customPhases.length - 1;
                    return (
                      <div key={i} className="row hair gap-3" style={{ padding: '12px 16px', borderRadius: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)', minWidth: 20 }}>{i + 1}</span>
                        <input
                          value={p.title}
                          onChange={e => {
                            const next = [...form.customPhases];
                            next[i] = { ...next[i], title: e.target.value };
                            setForm({ ...form, customPhases: next });
                          }}
                          placeholder="Phase name"
                          style={{ flex: 1, fontSize: 13, background: 'transparent', border: 'none', outline: 'none', color: 'var(--fg)' }}
                        />
                        <div className="row gap-1" style={{ alignItems: 'center' }}>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={p.ownership}
                            onChange={e => {
                              const next = [...form.customPhases];
                              next[i] = { ...next[i], ownership: Number(e.target.value) };
                              setForm({ ...form, customPhases: next });
                            }}
                            style={{ width: 54, fontSize: 13, textAlign: 'right', background: 'transparent', border: 'none', outline: 'none', color: 'var(--fg)' }}
                          />
                          <span className="muted" style={{ fontSize: 13 }}>%</span>
                        </div>
                        {form.customPhases.length > 1 && (
                          <button
                            onClick={() => setForm({ ...form, customPhases: form.customPhases.filter((_, j) => j !== i) })}
                            style={{ fontSize: 16, color: 'var(--muted)', cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}
                          >×</button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="row gap-2">
                  <button
                    onClick={() => setForm({ ...form, customPhases: [...form.customPhases, { title: '', ownership: 0 }] })}
                    style={{ fontSize: 13, color: 'var(--blue)', cursor: 'pointer', padding: '6px 0' }}
                  >
                    + Add phase
                  </button>
                  {form.customPhases[form.customPhases.length - 1]?.ownership !== 100 && (
                    <span style={{ fontSize: 12, color: '#FF3B30', alignSelf: 'center' }}>Final phase must be 100%</span>
                  )}
                </div>

                <label className="row hair gap-3" style={{ padding: 16, borderRadius: 8, alignItems: 'flex-start', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.phasedAccepted} onChange={e => setForm({ ...form, phasedAccepted: e.target.checked })}
                    style={{ width: 16, height: 16, accentColor: 'var(--blue)', marginTop: 2 }} />
                  <span style={{ fontSize: 13 }}>I agree to use this phased ownership structure. I can negotiate specific KPIs with each buyer.</span>
                </label>
              </div>
            )}

            {cur.id === 'review' && (
              <div className="col gap-6">
                <div className="card col gap-4" style={{ padding: 24 }}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <h3>{form.name}</h3>
                    <span className="tabular" style={{ fontSize: 24, fontWeight: 500 }}>{score}%</span>
                  </div>
                  <div className="row gap-2 muted" style={{ fontSize: 13 }}>
                    <span>{form.sector}</span><Icon.Dot size={3} /><span>{form.location}</span><Icon.Dot size={3} /><span>€{(Number(form.revenue)/1000000).toFixed(1)}M revenue</span>
                  </div>
                  <ScoreBar score={score} breakdown={breakdown} />
                </div>

                <div className="hair col gap-3" style={{ padding: 20, borderRadius: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>What happens next</span>
                  <div className="col gap-2 subtle" style={{ fontSize: 13, fontWeight: 300 }}>
                    <div className="row gap-2"><Icon.Dot size={4} /> Verification team reviews your documents (5–10 business days)</div>
                    <div className="row gap-2"><Icon.Dot size={4} /> You get an email when your listing goes live</div>
                    <div className="row gap-2"><Icon.Dot size={4} /> Inbound interest appears in your seller dashboard</div>
                  </div>
                </div>

              </div>
            )}

            {(() => {
              const missing = [
                !stepComplete.basics && 'Business basics',
                !stepComplete.financials && 'Financials',
                !stepComplete.verification && 'Verification docs',
                !stepComplete.phased && 'Phased ownership',
              ].filter(Boolean) as string[];
              const allReady = missing.length === 0;
              return (
                <div className="col gap-3" style={{ paddingTop: 24, borderTop: '0.5px solid var(--border)' }}>
                  {showMissing && !allReady && (
                    <div style={{ background: '#FF3B3011', border: '0.5px solid #FF3B3044', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#FF3B30' }}>
                      Still missing: {missing.join(', ')}
                    </div>
                  )}
                  <Button
                    variant="primary"
                    size="lg"
                    disabled={submitting}
                    onClick={() => {
                      if (!allReady) {
                        setShowMissing(true);
                        setTimeout(() => setShowMissing(false), 3000);
                      } else {
                        handleSubmit();
                      }
                    }}
                    iconRight={submitting ? undefined : <Icon.Arrow size={14} />}
                    style={{ width: '100%' }}
                  >
                    {submitting ? 'Listing…' : 'List this business'}
                  </Button>
                </div>
              );
            })()}
          </div>
        </div>
      </section>
    </div>
  );
}

type SellerListing = {
  id: string;
  name: string;
  sector: string;
  location: string;
  asking_price: number;
  score: number;
  verified: boolean;
  status: string;
  rejection_reason: string | null;
  documents: { financials_path?: string; tax_filings_path?: string } | null;
  created_at: string;
};

type SellerDeal = {
  id: string;
  buyer: string;
  phase: number;
  status: string;
  next: string;
  nda_signed_buyer: boolean;
  nda_signed_seller: boolean;
};

function KycGate({ status }: { status: string }) {
  return (
    <div className="col" style={{ padding: '64px 0', alignItems: 'center', gap: 20, textAlign: 'center' }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: '#C8922A18', display: 'grid', placeItems: 'center' }}>
        <span style={{ color: '#C8922A' }}><Icon.Shield size={24} /></span>
      </div>
      <div className="col gap-2" style={{ maxWidth: 400 }}>
        <p style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
          {status === 'pending' ? 'Verification under review' : 'Identity verification required'}
        </p>
        <p className="muted" style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>
          {status === 'pending'
            ? 'Your documents are being reviewed. This usually takes 1 business day. You\'ll receive an email when approved.'
            : 'You need to verify your identity and confirm you\'re 18+ before you can buy or sell on SafeBusinessSelling.'}
        </p>
      </div>
      {status !== 'pending' && (
        <Button href="/verify-identity" variant="primary" iconRight={<Icon.Arrow size={12} />}>
          Verify my identity
        </Button>
      )}
    </div>
  );
}

function ListingStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    pending_review: { label: 'Pending review', color: '#C8922A', bg: '#C8922A18' },
    live:           { label: 'Live',           color: '#00A86B', bg: '#00A86B18' },
    rejected:       { label: 'Rejected',       color: '#FF3B30', bg: '#FF3B3018' },
    draft:          { label: 'Draft',          color: 'var(--muted)', bg: 'var(--surface-2)' },
    under_offer:    { label: 'Under offer',    color: 'var(--blue)', bg: 'var(--blue)18' },
    sold:           { label: 'Sold',           color: 'var(--subtle)', bg: 'var(--surface-2)' },
  };
  const s = map[status] ?? map.draft;
  return (
    <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 999, color: s.color, background: s.bg }}>
      {s.label}
    </span>
  );
}

export function SellerDashboardPage() {
  const router = useRouter();
  const [section, setSection] = useState('overview');
  const [myListings, setMyListings] = useState<SellerListing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [sellerDeals, setSellerDeals] = useState<SellerDeal[]>([]);
  const [kycStatus, setKycStatus] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profileData } = await supabase.from('profiles').select('kyc_status').eq('id', session.user.id).single();
      setKycStatus(profileData?.kyc_status ?? 'none');

      const [{ data: listingsData }, { data: convData }] = await Promise.all([
        supabase
          .from('listings')
          .select('id, name, sector, location, asking_price, score, verified, status, rejection_reason, documents, created_at')
          .eq('seller_id', session.user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('conversations')
          .select('id, buyer_id, current_phase, status, nda_signed_buyer, nda_signed_seller')
          .eq('seller_id', session.user.id)
          .neq('status', 'archived'),
      ]);

      setMyListings((listingsData ?? []) as SellerListing[]);

      if (convData && convData.length > 0) {
        const buyerIds = [...new Set(convData.map((c: { buyer_id: string }) => c.buyer_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', buyerIds);
        const profileMap = Object.fromEntries(
          (profilesData ?? []).map((p: { id: string; full_name: string | null; email: string }) => [p.id, p])
        );
        setSellerDeals(convData.map((c: { id: string; buyer_id: string; current_phase: number; status: string; nda_signed_buyer: boolean; nda_signed_seller: boolean }) => {
          const p = profileMap[c.buyer_id] as { full_name: string | null; email: string } | undefined;
          const buyer = p?.full_name ?? p?.email ?? 'Unknown buyer';
          let status = 'NDA pending';
          let next = 'Buyer reviewing teaser';
          if (c.nda_signed_buyer && c.nda_signed_seller) {
            status = 'NDA signed · escrow funded';
            next = 'Awaiting data room request';
          } else if (c.nda_signed_buyer) {
            status = 'NDA signed by buyer';
            next = 'Awaiting your NDA signature';
          }
          return { id: c.id, buyer, phase: c.current_phase ?? 1, status, next, nda_signed_buyer: c.nda_signed_buyer, nda_signed_seller: c.nda_signed_seller };
        }));
      }

      setListingsLoading(false);
    }
    loadData();
  }, []);

  const inbox = [
    { from: 'Marek Sokolski', preview: 'Hi — I run a freight ops business in Warsaw and...', date: '2h ago', unread: true, verified: true },
    { from: 'Jana Visser', preview: 'I have a couple of follow-up questions on the EB...', date: 'Yesterday', unread: true, verified: true },
    { from: 'Deal coordinator', preview: 'Your verification is complete. Listing goes live...', date: '2 days ago', unread: false, verified: false, system: true },
    { from: 'Daan Bakker', preview: 'Would you be open to a phased timeline that ext...', date: '3 days ago', unread: false, verified: true },
  ];

  return (
    <div className="page-enter" style={{ background: 'var(--bg)' }}>
      <section style={{ padding: '32px 0 0' }}>
        <div className="container col gap-6">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
            <div className="col gap-2">
              <SectionEyebrow>Selling</SectionEyebrow>
              <h1 style={{ fontSize: 36 }}>Northwind Logistics</h1>
            </div>
            <AccountTabs />
          </div>
          <div className="row gap-3" style={{ justifyContent: 'flex-end' }}>
            <Button href="/listing/l-001" variant="secondary" size="sm">View public listing</Button>
            <Button variant="primary" size="sm" onClick={() => router.push('/seller/onboarding')}>Edit listing</Button>
          </div>
        </div>
      </section>

      <section className="hair-b" style={{ padding: '24px 0' }}>
        <div className="container">
        <div className="dash-tabs row gap-6">
          {[
            { id: 'overview', l: 'Listing overview' },
            { id: 'inbox', l: 'Messages', n: 2 },
            { id: 'deals', l: 'Active deals', n: sellerDeals.length || null },
            { id: 'score', l: 'Listing score' },
          ].map(t => (
            <button key={t.id} onClick={() => setSection(t.id)} className="row gap-2"
              style={{
                fontSize: 13, fontWeight: 500,
                color: section === t.id ? 'var(--fg)' : 'var(--subtle)',
                paddingBottom: 14, marginBottom: -1,
                borderBottom: section === t.id ? '1.5px solid var(--fg)' : '1.5px solid transparent',
              }}>
              <span>{t.l}</span>
              {t.n && <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 999, background: 'var(--blue)', color: '#FFF' }}>{t.n}</span>}
            </button>
          ))}
        </div>
        </div>
      </section>

      <section style={{ padding: '32px 0 96px' }}>
        <div className="container">
          {kycStatus !== null && kycStatus !== 'verified' ? <KycGate status={kycStatus} /> : <>
          {section === 'overview' && (
            <div className="col gap-6">
              {/* KPI row */}
              <div className="kpi-grid" style={{ border: '0.5px solid var(--border)', borderRadius: 10 }}>
                {[
                  { k: 'Listing score', v: '92%', d: '+5 this week', color: '#00A86B' },
                  { k: 'Listing views', v: '1,284', d: '+28% vs. last week' },
                  { k: 'Inbound interest', v: '14', d: '6 verified buyers' },
                  { k: 'Active deals', v: '2', d: 'Both in Phase 1' },
                ].map((m, i) => (
                  <div key={i} className="kpi-cell col gap-2" style={{ flex: 1, padding: 24 }}>
                    <span className="muted" style={{ fontSize: 12 }}>{m.k}</span>
                    <span className="tabular" style={{ fontSize: 32, fontWeight: 500, letterSpacing: -1 }}>{m.v}</span>
                    <span className="muted" style={{ fontSize: 11, color: m.color || 'var(--muted)' }}>{m.d}</span>
                  </div>
                ))}
              </div>

              <div className="row mobile-wrap" style={{ gap: 16, alignItems: 'stretch' }}>
                {/* Score card */}
                <div className="card col gap-4" style={{ padding: 24, flex: 1 }}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <h4>Listing score</h4>
                    <a onClick={() => setSection('score')} style={{ fontSize: 12, color: 'var(--blue)', cursor: 'pointer' }}>Improve →</a>
                  </div>
                  <div className="row gap-3" style={{ alignItems: 'baseline' }}>
                    <span className="tabular" style={{ fontSize: 56, fontWeight: 500, letterSpacing: -2 }}>92</span>
                    <span className="muted">/ 100</span>
                  </div>
                  <ScoreBar score={92} />
                  <p className="muted" style={{ fontSize: 12 }}>Early listing on the platform.</p>
                </div>

                {/* Activity */}
                <div className="card col gap-3" style={{ padding: 24, flex: 1.4 }}>
                  <h4>Recent activity</h4>
                  <div className="col gap-3" style={{ marginTop: 4 }}>
                    {[
                      { d: 'New verified buyer expressed interest · Marek S.', t: '2h ago' },
                      { d: 'Your listing was bookmarked 4 times', t: 'Today' },
                      { d: 'Daan B. requested data room access · NDA pending', t: 'Yesterday' },
                      { d: 'Listing score increased 87 → 92 (added trade references)', t: '2 days ago' },
                      { d: 'Verification completed — listing went live', t: '4 days ago' },
                    ].map((a, i) => (
                      <div key={i} className="row gap-3" style={{ fontSize: 13, paddingBottom: i < 4 ? 12 : 0, borderBottom: i < 4 ? '0.5px solid var(--border)' : 'none' }}>
                        <Icon.Dot size={6} color="#0047FF" />
                        <span style={{ flex: 1 }}>{a.d}</span>
                        <span className="muted" style={{ fontSize: 12 }}>{a.t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Active deals card */}
              <div className="card col gap-4" style={{ padding: 24 }}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <h4>Active deals</h4>
                  <a onClick={() => setSection('deals')} style={{ fontSize: 12, color: 'var(--blue)', cursor: 'pointer' }}>View all →</a>
                </div>
                <div className="col gap-3">
                  {sellerDeals.length === 0 ? (
                    <span className="muted" style={{ fontSize: 13 }}>No active deals yet.</span>
                  ) : sellerDeals.map(d => (
                    <div key={d.id} className="row hair mobile-col" style={{ padding: 16, borderRadius: 8, gap: 24, alignItems: 'center' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface-2)', border: '0.5px solid var(--border)' }} />
                      <div className="col" style={{ minWidth: 160, gap: 2 }}>
                        <span style={{ fontSize: 14, fontWeight: 500 }}>{d.buyer}</span>
                      </div>
                      <div className="col" style={{ flex: 1, minWidth: 0, gap: 6 }}>
                        <PhaseTracker phases={PHASES} currentPhase={d.phase} compact />
                      </div>
                      <div className="col" style={{ minWidth: 220, gap: 2, alignItems: 'flex-end' }}>
                        <span style={{ fontSize: 12 }}>{d.status}</span>
                        <span className="muted" style={{ fontSize: 11 }}>{d.next}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* My listings */}
              <div className="card col gap-4" style={{ padding: 24 }}>
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4>My listings</h4>
                  <Button variant="primary" size="sm" onClick={() => router.push('/seller/onboarding')}>+ New listing</Button>
                </div>

                {listingsLoading ? (
                  <div style={{ height: 60, background: 'var(--surface-2)', borderRadius: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />
                ) : myListings.length === 0 ? (
                  <div className="col" style={{ padding: '24px 0', alignItems: 'center', gap: 8, textAlign: 'center' }}>
                    <p className="muted" style={{ fontSize: 13 }}>No listings yet. Create your first listing to get started.</p>
                  </div>
                ) : (
                  <div className="col gap-2">
                    {myListings.map(l => (
                      <div key={l.id} className="row hair" style={{ padding: '14px 16px', borderRadius: 8, alignItems: 'center', gap: 16 }}>
                        <div className="col gap-1" style={{ flex: 1 }}>
                          <div className="row gap-3" style={{ alignItems: 'center' }}>
                            <span style={{ fontSize: 14, fontWeight: 500 }}>{l.name || '(no name)'}</span>
                            <ListingStatusBadge status={l.status} />
                            {l.verified && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: '#00A86B18', color: '#00A86B', fontWeight: 500 }}>Verified</span>}
                          </div>
                          <span className="muted" style={{ fontSize: 12 }}>
                            {l.sector}{l.location ? ` · ${l.location}` : ''}{l.asking_price ? ` · €${(l.asking_price / 1_000_000).toFixed(1)}M` : ''}
                          </span>
                          <div className="row gap-3" style={{ marginTop: 4 }}>
                            <span style={{ fontSize: 11, color: (l.documents as { financials_path?: string } | null)?.financials_path ? '#00A86B' : 'var(--muted)' }}>
                              {(l.documents as { financials_path?: string } | null)?.financials_path ? '✓' : '✗'} Financials
                            </span>
                            <span style={{ fontSize: 11, color: (l.documents as { tax_filings_path?: string } | null)?.tax_filings_path ? '#00A86B' : 'var(--muted)' }}>
                              {(l.documents as { tax_filings_path?: string } | null)?.tax_filings_path ? '✓' : '✗'} Tax filings
                            </span>
                          </div>
                          {l.status === 'rejected' && l.rejection_reason && (
                            <div style={{ marginTop: 6, background: '#FF3B3011', border: '0.5px solid #FF3B3044', borderRadius: 6, padding: '6px 10px', fontSize: 12, color: '#FF3B30' }}>
                              Rejected: {l.rejection_reason}
                            </div>
                          )}
                          {l.status === 'pending_review' && (
                            <span style={{ fontSize: 12, color: '#C8922A', marginTop: 2 }}>
                              Under review — you'll be notified when approved.
                            </span>
                          )}
                        </div>
                        {l.score != null && (
                          <span className="tabular muted" style={{ fontSize: 13 }}>Score {l.score}%</span>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => router.push('/seller/onboarding')}>Edit</Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {section === 'inbox' && (
            <div className="row" style={{ gap: 16, alignItems: 'flex-start', minHeight: 560 }}>
              <div className="card col" style={{ flex: '0 0 360px', padding: 0, overflow: 'hidden' }}>
                {inbox.map((m, i) => (
                  <div key={i} className="col gap-2" style={{ padding: 16, borderTop: i ? '0.5px solid var(--border)' : 'none', background: i === 0 ? 'var(--surface-2)' : 'transparent', cursor: 'pointer' }}>
                    <div className="row" style={{ justifyContent: 'space-between' }}>
                      <div className="row gap-2">
                        <span style={{ fontSize: 13, fontWeight: m.unread ? 500 : 400 }}>{m.from}</span>
                        {m.verified && <Icon.Check size={10} color="#00A86B" />}
                        {m.unread && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--blue)' }} />}
                      </div>
                      <span className="muted" style={{ fontSize: 11 }}>{m.date}</span>
                    </div>
                    <span className="muted" style={{ fontSize: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{m.preview}</span>
                  </div>
                ))}
              </div>

              <div className="card col gap-4" style={{ flex: 1, padding: 28, minHeight: 520 }}>
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 16, borderBottom: '0.5px solid var(--border)' }}>
                  <div className="col gap-2">
                    <div className="row gap-2"><span style={{ fontSize: 16, fontWeight: 500 }}>Marek Sokolski</span><VerifiedBadge /></div>
                    <div className="row gap-2 muted" style={{ fontSize: 12 }}>
                      <span>Verified buyer · €1M – €5M budget</span><Icon.Dot size={3} /><span>Logistics operator (Warsaw)</span>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" iconRight={<Icon.ArrowUpRight size={11} />}>View profile</Button>
                </div>

                <div className="col gap-4" style={{ flex: 1, paddingBottom: 8 }}>
                  <div className="col gap-2" style={{ alignItems: 'flex-start', maxWidth: '80%' }}>
                    <div className="hair" style={{ padding: 14, borderRadius: 10, fontSize: 14, fontWeight: 300, background: 'var(--surface-2)' }}>
                      Hi — I run a freight ops business in Warsaw and I've been looking for a BeNeLux-DACH route concentration like Northwind for ~9 months. Your phased structure is exactly the model I prefer.
                      <br/><br/>
                      Two questions before I request the data room:<br/>
                      1) What's the customer concentration on the top 5 accounts?<br/>
                      2) Is the ops team retained through Phase 2?
                    </div>
                    <span className="muted" style={{ fontSize: 11 }}>Marek · 2 hours ago</span>
                  </div>
                </div>

                <div className="hair-t" style={{ paddingTop: 16 }}>
                  <Field label="Reply">
                    <textarea rows={3} placeholder="Type your reply…" style={{ minHeight: 80, resize: 'vertical' }} />
                  </Field>
                  <div className="row" style={{ justifyContent: 'space-between', marginTop: 12 }}>
                    <span className="muted" style={{ fontSize: 11 }}>Messages are routed through SBS — both sides are verified.</span>
                    <Button variant="primary" size="sm">Send reply</Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {section === 'deals' && (
            <div className="col gap-4">
              {sellerDeals.length === 0 ? (
                <div className="col" style={{ padding: '64px 0', alignItems: 'center', gap: 16, textAlign: 'center' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--surface-2)', display: 'grid', placeItems: 'center' }}>
                    <Icon.Building size={20} />
                  </div>
                  <div className="col gap-2">
                    <p style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>No active deals yet</p>
                    <p className="muted" style={{ fontSize: 13, maxWidth: 360, margin: 0 }}>
                      When buyers start a conversation and sign the NDA, their deals appear here with phase tracking.
                    </p>
                  </div>
                </div>
              ) : sellerDeals.map(d => (
                <div key={d.id} className="card col gap-6" style={{ padding: 28 }}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <div className="row gap-3">
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--surface-2)', border: '0.5px solid var(--border)' }} />
                      <div className="col" style={{ gap: 2 }}>
                        <div className="row gap-2">
                          <span style={{ fontSize: 15, fontWeight: 500 }}>{d.buyer}</span>
                          {d.nda_signed_buyer && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: '#00A86B18', color: '#00A86B', fontWeight: 500 }}>NDA signed</span>}
                        </div>
                        <span className="muted" style={{ fontSize: 12 }}>{d.status}</span>
                      </div>
                    </div>
                    <div className="row gap-2">
                      <Button variant="secondary" size="sm" icon={<Icon.Message size={12} />}>Message</Button>
                      <Button variant="primary" size="sm">Advance phase</Button>
                    </div>
                  </div>

                  <PhaseTracker phases={PHASES} currentPhase={d.phase} />

                  <div className="row hair" style={{ padding: 16, borderRadius: 8, alignItems: 'center', gap: 16 }}>
                    <Icon.Lock size={14} />
                    <span style={{ fontSize: 13 }}>Next milestone: <span style={{ fontWeight: 500 }}>{d.next}</span></span>
                    <Button variant="ghost" size="sm" iconRight={<Icon.ArrowUpRight size={11} />}>Open deal room</Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {section === 'score' && (
            <div className="row" style={{ gap: 24, alignItems: 'flex-start' }}>
              <div className="card col gap-4" style={{ padding: 28, flex: 1 }}>
                <h4>Listing score · 92</h4>
                <ScoreBar score={92} breakdown={[
                  { label: 'Identity & ownership verified', weight: 15, done: true },
                  { label: '3 years of financials uploaded', weight: 20, done: true },
                  { label: 'Tax filings cross-checked', weight: 15, done: true },
                  { label: 'Trade references (3 of 3)', weight: 10, done: true },
                  { label: 'AI-narrative approved', weight: 10, done: true },
                  { label: 'Data room populated', weight: 15, done: true },
                  { label: 'Phased ownership template signed', weight: 10, done: true },
                ]} />
              </div>
            </div>
          )}
          </>}
        </div>
      </section>
    </div>
  );
}

type BuyerDeal = {
  id: string;
  listing: string;
  listing_id: string;
  seller: string;
  phase: number;
  status: string;
  sellerPhases: { title: string; ownership: number }[];
  proposedPhases: { title: string; ownership: number }[] | null;
  proposalSent: boolean;
  nda_signed_buyer: boolean;
  nda_signed_seller: boolean;
};

const DEFAULT_PHASES = [
  { title: 'LOI & Discovery', ownership: 0 },
  { title: 'Operating handover', ownership: 51 },
  { title: 'Full ownership', ownership: 100 },
];

export function BuyerDashboardPage() {
  const router = useRouter();
  const [section, setSection] = useState('matches');
  const [user, setUser] = useState<User | null>(null);
  const [matches, setMatches] = useState<AiMatch[]>([]);
  const [saved, setSaved] = useState<SavedRow[]>([]);
  const [ndas, setNdas] = useState<NdaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState<BuyerDeal[]>([]);
  const [proposingFor, setProposingFor] = useState<string | null>(null);
  const [kycStatus, setKycStatus] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/sign-in'); return; }
      setUser(session.user);

      const { data: profileData } = await supabase.from('profiles').select('kyc_status').eq('id', session.user.id).single();
      setKycStatus(profileData?.kyc_status ?? 'none');

      const [{ data: savedData }, { data: ndaData }, { data: convData }] = await Promise.all([
        supabase.from('saved_listings').select('*, listings(*)').eq('buyer_id', session.user.id),
        supabase.from('ndas').select('id, listing_id, status').eq('buyer_id', session.user.id),
        supabase.from('conversations')
          .select('id, listing_id, seller_id, current_phase, status, nda_signed_buyer, nda_signed_seller, listings(name, phases)')
          .eq('buyer_id', session.user.id)
          .neq('status', 'archived'),
      ]);
      setSaved((savedData ?? []) as SavedRow[]);
      setNdas((ndaData ?? []) as NdaRow[]);

      if (convData && convData.length > 0) {
        const sellerIds = [...new Set(convData.map((c: { seller_id: string }) => c.seller_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', sellerIds);
        const profileMap = Object.fromEntries(
          (profilesData ?? []).map((p: { id: string; full_name: string | null; email: string }) => [p.id, p])
        );
        setDeals(convData.map((c: { id: string; listing_id: string; seller_id: string; current_phase: number; status: string; nda_signed_buyer: boolean; nda_signed_seller: boolean; listings: { name: string; phases: unknown } | null }) => {
          const sp = profileMap[c.seller_id] as { full_name: string | null; email: string } | undefined;
          const seller = sp?.full_name ?? sp?.email ?? 'Unknown seller';
          const rawPhases = c.listings?.phases;
          const sellerPhases = Array.isArray(rawPhases) ? rawPhases as { title: string; ownership: number }[] : DEFAULT_PHASES;
          let status = 'Active';
          if (c.nda_signed_buyer && c.nda_signed_seller) status = 'NDA signed · books open';
          else if (c.nda_signed_buyer) status = 'NDA signed by you · awaiting seller';
          else status = 'NDA pending';
          return {
            id: c.id,
            listing: c.listings?.name ?? 'Unknown listing',
            listing_id: c.listing_id,
            seller,
            phase: c.current_phase ?? 1,
            status,
            sellerPhases,
            proposedPhases: null,
            proposalSent: false,
            nda_signed_buyer: c.nda_signed_buyer,
            nda_signed_seller: c.nda_signed_seller,
          };
        }));
      }

      try {
        const raw = sessionStorage.getItem('sbs_matches');
        if (raw) setMatches(JSON.parse(raw));
      } catch {}

      setLoading(false);
    }
    load();
  }, [router]);

  async function toggleSave(listingId: string) {
    if (!user) return;
    const supabase = createClient();
    const existing = saved.find(s => s.listing_id === listingId);
    if (existing) {
      await supabase.from('saved_listings').delete().eq('id', existing.id);
      setSaved(prev => prev.filter(s => s.listing_id !== listingId));
    } else {
      const { data } = await supabase
        .from('saved_listings')
        .insert({ buyer_id: user.id, listing_id: listingId })
        .select('*, listings(*)')
        .single();
      if (data) setSaved(prev => [...prev, data as SavedRow]);
    }
  }

  async function requestNda(listingId: string, sellerId: string) {
    if (!user) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('ndas')
      .insert({ listing_id: listingId, buyer_id: user.id, seller_id: sellerId })
      .select('id, listing_id, status')
      .single();
    if (data) setNdas(prev => [...prev, data as NdaRow]);
  }

  const displayName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'there';
  const savedCards = saved.map(s => dbToCard(s.listings));

  const tabs = [
    { id: 'matches', l: 'AI matches', n: matches.length || null },
    { id: 'deals', l: 'Active deals', n: deals.length || null },
    { id: 'payments', l: 'Payments & escrow', n: null },
    { id: 'saved', l: 'Saved listings', n: saved.length || null },
  ];

  if (loading) {
    return (
      <div className="page-enter">
        <section style={{ padding: '32px 0 96px' }}>
          <div className="container col gap-4">
            <div style={{ height: 60, background: 'var(--surface-2)', borderRadius: 10, animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ height: 200, background: 'var(--surface-2)', borderRadius: 10, animation: 'pulse 1.5s ease-in-out infinite' }} />
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
              <SectionEyebrow>Buying</SectionEyebrow>
              <h1 style={{ fontSize: 36 }}>Welcome back, {displayName}</h1>
            </div>
            <AccountTabs />
          </div>
          <div className="row gap-3" style={{ justifyContent: 'flex-end' }}>
            <Button href="/" variant="secondary" size="sm">Chat with Ahmed AI</Button>
            <Button variant="primary" size="sm" onClick={() => router.push('/marketplace')} iconRight={<Icon.Arrow size={12} />}>Browse marketplace</Button>
          </div>
        </div>
      </section>

      <section className="hair-b" style={{ padding: '24px 0' }}>
        <div className="container">
        <div className="dash-tabs row gap-6">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setSection(t.id)} className="row gap-2"
              style={{
                fontSize: 13, fontWeight: 500,
                color: section === t.id ? 'var(--fg)' : 'var(--subtle)',
                paddingBottom: 14, marginBottom: -1,
                borderBottom: section === t.id ? '1.5px solid var(--fg)' : '1.5px solid transparent',
              }}>
              <span>{t.l}</span>
              {t.n != null && t.n > 0 && (
                <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 999, background: 'var(--surface-2)', color: 'var(--subtle)' }}>{t.n}</span>
              )}
            </button>
          ))}
        </div>
        </div>
      </section>

      <section style={{ padding: '32px 0 96px' }}>
        <div className="container">
          {kycStatus !== null && kycStatus !== 'verified' ? <KycGate status={kycStatus} /> : <>

          {section === 'matches' && (
            <div className="col gap-4">
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <p style={{ fontSize: 14 }}>{matches.length} matches based on your buyer profile</p>
                  <p className="muted" style={{ fontSize: 12 }}>Re-runs every time you chat with Ahmed AI</p>
                </div>
                <Button href="/" variant="ghost" size="sm">Refine with Ahmed AI →</Button>
              </div>

              {matches.length === 0 ? (
                <div className="col" style={{ padding: '64px 0', alignItems: 'center', gap: 16, textAlign: 'center' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--surface-2)', display: 'grid', placeItems: 'center' }}>
                    <Icon.Sparkle size={20} />
                  </div>
                  <div className="col gap-2">
                    <p style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>No matches yet</p>
                    <p className="muted" style={{ fontSize: 13, maxWidth: 360, margin: 0 }}>Chat with Ahmed AI to tell us what you're looking for. We'll score every listing against your profile.</p>
                  </div>
                  <Button href="/" variant="primary" iconRight={<Icon.Arrow size={12} />}>Start with Ahmed AI</Button>
                </div>
              ) : (
                <div className="col gap-3">
                  {matches.map(m => {
                    const l = m.listing;
                    const ndaForListing = ndas.find(n => n.listing_id === String(l.id));
                    return (
                      <div key={m.id} className="card match-card row" style={{ padding: 0, overflow: 'hidden' }}>
                        <div className="match-card-img img-ph" style={{ width: 180, borderRadius: 0, borderRight: '0.5px solid var(--border)' }} />
                        <div className="col gap-3" style={{ flex: 1, padding: 24 }}>
                          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div className="col gap-2">
                              <div className="row gap-2">
                                {Boolean(l.verified) && <VerifiedBadge />}
                              </div>
                              <h4>{String(l.name ?? '')}</h4>
                              <span className="muted" style={{ fontSize: 12 }}>
                                {String(l.sector ?? '')} · {String(l.location ?? '')} · {typeof l.asking_price === 'number' ? formatEur(l.asking_price) : String(l.asking ?? '')}
                              </span>
                            </div>
                            <div className="col" style={{ alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                              <span className="tabular" style={{ fontSize: 28, fontWeight: 500, letterSpacing: -0.8, color: m.fit >= 80 ? 'var(--green)' : 'var(--fg)' }}>{m.fit}</span>
                              <span className="muted" style={{ fontSize: 11 }}>/ 100 fit</span>
                            </div>
                          </div>
                          <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
                            {m.reasons.slice(0, 3).map(r => (
                              <span key={r} className="row gap-2" style={{ fontSize: 11, padding: '4px 10px', borderRadius: 999, background: 'var(--surface-2)', color: 'var(--subtle)' }}>
                                <Icon.Check size={10} color="#00A86B" /> {r}
                              </span>
                            ))}
                          </div>
                          <div className="row gap-2" style={{ marginTop: 4 }}>
                            <Button href={`/listing/${String(l.id ?? '')}`} variant="primary" size="sm">View listing</Button>
                            {!ndaForListing && (
                              <Button variant="secondary" size="sm" onClick={() => requestNda(String(l.id), String(l.seller_id ?? ''))}>
                                Request NDA
                              </Button>
                            )}
                            {ndaForListing?.status === 'pending' && <span className="badge">NDA pending</span>}
                            {ndaForListing?.status === 'fully_signed' && <span className="badge badge-verified"><Icon.Check size={10} /> NDA signed</span>}
                            <button onClick={() => toggleSave(String(l.id))} style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)', cursor: 'pointer' }}>
                              {saved.find(s => s.listing_id === String(l.id)) ? '★ Saved' : '☆ Save'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {section === 'deals' && (
            <div className="col gap-4">
              {deals.length === 0 ? (
                <div className="col" style={{ padding: '64px 0', alignItems: 'center', gap: 16, textAlign: 'center' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--surface-2)', display: 'grid', placeItems: 'center' }}>
                    <Icon.Building size={20} />
                  </div>
                  <div className="col gap-2">
                    <p style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>No active deals</p>
                    <p className="muted" style={{ fontSize: 13, maxWidth: 360, margin: 0 }}>
                      Once you express interest and sign an NDA, your active deals appear here with phase tracking and escrow status.
                    </p>
                  </div>
                  <Button href="/marketplace" variant="primary" iconRight={<Icon.Arrow size={12} />}>Browse marketplace</Button>
                </div>
              ) : deals.map(d => (
                <div key={d.id} className="card col gap-6" style={{ padding: 28 }}>
                  <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="col gap-1">
                      <span style={{ fontSize: 15, fontWeight: 500 }}>{d.listing}</span>
                      <span className="muted" style={{ fontSize: 12 }}>Seller: {d.seller} · {d.status}</span>
                    </div>
                    <Button variant="secondary" size="sm" icon={<Icon.Message size={12} />}>Message seller</Button>
                  </div>

                  <div>
                    <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500, marginBottom: 12, display: 'block' }}>
                      {d.proposalSent ? 'Your proposed structure (pending seller approval)' : "Seller's phased ownership structure"}
                    </span>
                    <PhaseTracker phases={d.proposalSent && d.proposedPhases ? d.proposedPhases : d.sellerPhases} currentPhase={d.phase} />
                  </div>

                  {d.proposalSent && (
                    <div className="row gap-2" style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--surface-2)', fontSize: 13 }}>
                      <span className="muted">Proposal sent — waiting for seller to respond.</span>
                    </div>
                  )}

                  {!d.proposalSent && proposingFor !== d.id && (
                    <button
                      onClick={() => {
                        setDeals(prev => prev.map(x => x.id === d.id ? { ...x, proposedPhases: x.sellerPhases.map(p => ({ ...p })) } : x));
                        setProposingFor(d.id);
                      }}
                      style={{ fontSize: 13, color: 'var(--blue)', cursor: 'pointer', alignSelf: 'flex-start' }}
                    >
                      + Propose different structure
                    </button>
                  )}

                  {proposingFor === d.id && d.proposedPhases && (
                    <div className="col gap-4 hair" style={{ padding: 20, borderRadius: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>Your proposed structure</span>

                      <div className="col gap-2">
                        {d.proposedPhases.map((p, i) => (
                          <div key={i} className="row hair gap-3" style={{ padding: '10px 14px', borderRadius: 8, alignItems: 'center' }}>
                            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)', minWidth: 20 }}>{i + 1}</span>
                            <input
                              value={p.title}
                              onChange={e => setDeals(prev => prev.map(x => x.id !== d.id ? x : {
                                ...x,
                                proposedPhases: x.proposedPhases!.map((pp, j) => j === i ? { ...pp, title: e.target.value } : pp),
                              }))}
                              placeholder="Phase name"
                              style={{ flex: 1, fontSize: 13, background: 'transparent', border: 'none', outline: 'none', color: 'var(--fg)' }}
                            />
                            <div className="row gap-1" style={{ alignItems: 'center' }}>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={p.ownership}
                                onChange={e => setDeals(prev => prev.map(x => x.id !== d.id ? x : {
                                  ...x,
                                  proposedPhases: x.proposedPhases!.map((pp, j) => j === i ? { ...pp, ownership: Number(e.target.value) } : pp),
                                }))}
                                style={{ width: 54, fontSize: 13, textAlign: 'right', background: 'transparent', border: 'none', outline: 'none', color: 'var(--fg)' }}
                              />
                              <span className="muted" style={{ fontSize: 13 }}>%</span>
                            </div>
                            {d.proposedPhases!.length > 1 && (
                              <button
                                onClick={() => setDeals(prev => prev.map(x => x.id !== d.id ? x : {
                                  ...x,
                                  proposedPhases: x.proposedPhases!.filter((_, j) => j !== i),
                                }))}
                                style={{ fontSize: 16, color: 'var(--muted)', cursor: 'pointer', padding: '0 4px' }}
                              >×</button>
                            )}
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => setDeals(prev => prev.map(x => x.id !== d.id ? x : {
                          ...x,
                          proposedPhases: [...x.proposedPhases!, { title: '', ownership: 0 }],
                        }))}
                        style={{ fontSize: 13, color: 'var(--blue)', cursor: 'pointer', alignSelf: 'flex-start' }}
                      >
                        + Add phase
                      </button>

                      {d.proposedPhases[d.proposedPhases.length - 1]?.ownership !== 100 && (
                        <span style={{ fontSize: 12, color: '#FF3B30' }}>Final phase must be 100%</span>
                      )}

                      <div className="row gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={d.proposedPhases[d.proposedPhases.length - 1]?.ownership !== 100}
                          onClick={() => {
                            setDeals(prev => prev.map(x => x.id === d.id ? { ...x, proposalSent: true } : x));
                            setProposingFor(null);
                          }}
                        >
                          Send proposal to seller
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setProposingFor(null); }}>Cancel</Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {section === 'payments' && (
            <div className="col" style={{ padding: '64px 0', alignItems: 'center', gap: 16, textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--surface-2)', display: 'grid', placeItems: 'center' }}>
                <Icon.Lock size={20} />
              </div>
              <div className="col gap-2">
                <p style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>No transactions yet</p>
                <p className="muted" style={{ fontSize: 13, maxWidth: 360, margin: 0 }}>
                  Your escrow payments and transaction history will appear here once you start a deal.
                </p>
              </div>
            </div>
          )}

          {section === 'saved' && (
            savedCards.length === 0 ? (
              <div className="col" style={{ padding: '64px 0', alignItems: 'center', gap: 16, textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--surface-2)', display: 'grid', placeItems: 'center' }}>
                  <Icon.Bookmark size={20} />
                </div>
                <div className="col gap-2">
                  <p style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>No saved listings</p>
                  <p className="muted" style={{ fontSize: 13, maxWidth: 360, margin: 0 }}>
                    Save listings from the marketplace or your AI matches to compare them later.
                  </p>
                </div>
                <Button href="/marketplace" variant="primary" iconRight={<Icon.Arrow size={12} />}>Browse marketplace</Button>
              </div>
            ) : (
              <div className="mobile-grid-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {savedCards.map(l => <ListingCard key={l.id} listing={l} href={`/listing/${l.id}`} />)}
              </div>
            )
          )}

          </>}
        </div>
      </section>
    </div>
  );
}
