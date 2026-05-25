'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Icon, VerifiedBadge, PremiumBadge, ScoreBar, PhaseTracker, ListingCard, SectionEyebrow, Field } from '@/components/ui';
import { LISTINGS, SECTORS, PHASES, MATCHES } from '@/lib/data';
import { AccountTabs } from '@/components/layout/account-tabs';

export function SellerOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
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
    financialsUploaded: false,
    taxFilingsUploaded: false,
    photosUploaded: 0,
    referencesAdded: 0,
    phasedAccepted: false,
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
    if (form.photosUploaded >= 3) s += 10;
    if (form.referencesAdded >= 3) s += 5;
    if (form.phasedAccepted) s += 10;
    if (step >= steps.length - 1 && form.financialsUploaded) s += 5;
    return Math.min(100, s);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, step, steps.length]);

  const breakdown = [
    { label: 'Business basics complete', weight: 15, done: !!(form.name && form.sector && form.location) },
    { label: 'Financial summary entered', weight: 20, done: !!(form.revenue && form.ebitda && form.asking) },
    { label: '3 years of financials uploaded', weight: 15, done: form.financialsUploaded },
    { label: 'Tax filings uploaded', weight: 10, done: form.taxFilingsUploaded },
    { label: 'AI narrative approved', weight: 10, done: form.description.length > 40 },
    { label: '3+ photos uploaded', weight: 10, done: form.photosUploaded >= 3 },
    { label: '3+ trade references', weight: 5, done: form.referencesAdded >= 3 },
    { label: 'Phased ownership signed', weight: 10, done: form.phasedAccepted },
    { label: 'Submitted for verification', weight: 5, done: step >= steps.length - 1 && form.financialsUploaded },
  ];

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
            <span className="muted" style={{ fontSize: 11 }}>Higher scores get 4.2× more buyer interest.</span>
          </div>
        </div>
      </section>

      <section style={{ padding: '40px 0 96px' }}>
        <div className="container row" style={{ gap: 48, alignItems: 'flex-start' }}>
          {/* Steps rail */}
          <div className="col gap-1" style={{ width: 240, position: 'sticky', top: 88 }}>
            {steps.map((s, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <button key={s.id} onClick={() => setStep(i)}
                  className="row gap-3" style={{
                    padding: '12px 14px', borderRadius: 8, textAlign: 'left',
                    background: active ? 'var(--surface-2)' : 'transparent',
                    color: active || done ? 'var(--fg)' : 'var(--subtle)',
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
                <div className="row gap-3">
                  <Field label="Sector">
                    <select value={form.sector} onChange={e => setForm({ ...form, sector: e.target.value })}>
                      {SECTORS.slice(1).map(s => <option key={s}>{s}</option>)}
                    </select>
                  </Field>
                  <Field label="Location">
                    <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
                  </Field>
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
                  { k: 'financialsUploaded' as const, label: 'Last 3 years of financials', desc: 'P&L, balance sheet, cash flow. PDF or XLSX.', sample: 'financials-2023-2025.pdf · 2.4 MB' },
                  { k: 'taxFilingsUploaded' as const, label: 'Tax filings', desc: 'Last 3 fiscal-year corporate tax filings.', sample: 'tax-filings-bundle.pdf · 1.1 MB' },
                ]).map(u => (
                  <div key={u.k} className="card col gap-3" style={{ padding: 20 }}>
                    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div className="col" style={{ gap: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 500 }}>{u.label}</span>
                        <span className="muted" style={{ fontSize: 12 }}>{u.desc}</span>
                      </div>
                      {form[u.k]
                        ? <span className="badge badge-verified"><Icon.Check size={10} /> Uploaded</span>
                        : <Button variant="secondary" size="sm" icon={<Icon.Upload size={12} />} onClick={() => setForm({ ...form, [u.k]: true })}>Upload</Button>}
                    </div>
                    {form[u.k] && (
                      <div className="row gap-3 hair" style={{ padding: '10px 14px', borderRadius: 6, fontSize: 12, color: 'var(--subtle)' }}>
                        <Icon.Doc size={12} />
                        <span style={{ flex: 1 }}>{u.sample}</span>
                        <button onClick={() => setForm({ ...form, [u.k]: false })} style={{ color: 'var(--muted)' }}><Icon.X size={11} /></button>
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
                    {Array.from({ length: 8 }).map((_, i) => {
                      const filled = i < form.photosUploaded;
                      return (
                        <button key={i} onClick={() => setForm({ ...form, photosUploaded: Math.min(8, form.photosUploaded + 1) })}
                          className={filled ? 'img-ph' : ''}
                          style={{
                            aspectRatio: '1', borderRadius: 8, border: '0.5px dashed var(--border)',
                            background: filled ? undefined : 'transparent',
                            display: 'grid', placeItems: 'center', color: 'var(--muted)',
                            cursor: filled ? 'default' : 'pointer',
                          }}>
                          {!filled && <Icon.Plus size={16} />}
                        </button>
                      );
                    })}
                  </div>
                </Field>

                <Field label="Trade references" hint="Customers, suppliers, advisors. Minimum 3 recommended.">
                  <div className="col gap-2">
                    {Array.from({ length: 4 }).map((_, i) => {
                      const added = i < form.referencesAdded;
                      return (
                        <button key={i} onClick={() => setForm({ ...form, referencesAdded: Math.min(4, form.referencesAdded + 1) })}
                          className="row hair gap-3" style={{
                            padding: 14, borderRadius: 8, textAlign: 'left',
                            color: added ? 'var(--fg)' : 'var(--muted)',
                            cursor: added ? 'default' : 'pointer',
                          }}>
                          <span style={{ width: 20, height: 20, borderRadius: '50%', border: '0.5px solid var(--border-strong)', display: 'grid', placeItems: 'center' }}>
                            {added ? <Icon.Check size={10} color="#00A86B" /> : <Icon.Plus size={10} />}
                          </span>
                          <span style={{ fontSize: 13 }}>{added ? `Reference ${i + 1} — pending invitation sent` : 'Add reference'}</span>
                        </button>
                      );
                    })}
                  </div>
                </Field>
              </div>
            )}

            {cur.id === 'phased' && (
              <div className="col gap-4">
                <p className="subtle" style={{ fontSize: 14, fontWeight: 300, maxWidth: 560 }}>
                  Listings that use our default 3-phase contract get a +10 listing score boost and 3× more inbound interest. You can opt out, but most serious buyers expect it.
                </p>

                <div className="card" style={{ padding: 28 }}>
                  <PhaseTracker phases={PHASES} currentPhase={1} compact />
                </div>

                <div className="col gap-2">
                  {PHASES.map((p, i) => (
                    <div key={i} className="row hair gap-4" style={{ padding: 16, borderRadius: 8, alignItems: 'flex-start' }}>
                      <span className="tabular" style={{ fontSize: 14, fontWeight: 500, minWidth: 50 }}>Phase {i + 1}</span>
                      <span style={{ fontSize: 13, flex: 1 }}>{p.title}</span>
                      <span className="muted tabular" style={{ fontSize: 13 }}>{p.ownership}% ownership</span>
                    </div>
                  ))}
                </div>

                <label className="row hair gap-3" style={{ padding: 16, borderRadius: 8, alignItems: 'flex-start', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.phasedAccepted} onChange={e => setForm({ ...form, phasedAccepted: e.target.checked })}
                    style={{ width: 16, height: 16, accentColor: 'var(--blue)', marginTop: 2 }} />
                  <span style={{ fontSize: 13 }}>I agree to use the SafeBusinessSelling 3-phase ownership template. I can negotiate specific KPIs with each buyer.</span>
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

                <Button variant="primary" size="lg" onClick={() => router.push('/seller/dashboard')} iconRight={<Icon.Arrow size={14} />}>
                  Submit for verification
                </Button>
              </div>
            )}

            {step < steps.length - 1 && (
              <div className="row" style={{ justifyContent: 'space-between', paddingTop: 24, borderTop: '0.5px solid var(--border)' }}>
                <Button variant="ghost" size="sm" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>← Back</Button>
                <div className="row gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setStep(step + 1)}>Skip for now</Button>
                  <Button variant="primary" onClick={() => setStep(step + 1)} iconRight={<Icon.Arrow size={12} />}>Continue</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export function SellerDashboardPage() {
  const router = useRouter();
  const [section, setSection] = useState('overview');

  const inbox = [
    { from: 'Marek Sokolski', preview: 'Hi — I run a freight ops business in Warsaw and...', date: '2h ago', unread: true, verified: true },
    { from: 'Jana Visser', preview: 'I have a couple of follow-up questions on the EB...', date: 'Yesterday', unread: true, verified: true },
    { from: 'Deal coordinator', preview: 'Your verification is complete. Listing goes live...', date: '2 days ago', unread: false, verified: false, system: true },
    { from: 'Daan Bakker', preview: 'Would you be open to a phased timeline that ext...', date: '3 days ago', unread: false, verified: true },
  ];

  const activeDeals = [
    { buyer: 'Marek Sokolski', phase: 1, fit: 94, status: 'NDA signed · escrow funded', next: 'Awaiting data room request' },
    { buyer: 'Jana Visser', phase: 1, fit: 87, status: 'NDA pending signature', next: 'Buyer reviewing teaser' },
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
            <Link href="/listing/l-001">
              <Button variant="secondary" size="sm">View public listing</Button>
            </Link>
            <Button variant="primary" size="sm" onClick={() => router.push('/seller/onboarding')}>Edit listing</Button>
          </div>
        </div>
      </section>

      <section className="hair-b" style={{ padding: '24px 0' }}>
        <div className="container row gap-6">
          {[
            { id: 'overview', l: 'Listing overview' },
            { id: 'inbox', l: 'Messages', n: 2 },
            { id: 'deals', l: 'Active deals', n: 2 },
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
      </section>

      <section style={{ padding: '32px 0 96px' }}>
        <div className="container">
          {section === 'overview' && (
            <div className="col gap-6">
              {/* KPI row */}
              <div className="row" style={{ gap: 0, border: '0.5px solid var(--border)', borderRadius: 10 }}>
                {[
                  { k: 'Listing score', v: '92%', d: '+5 this week', color: '#00A86B' },
                  { k: 'Listing views', v: '1,284', d: '+28% vs. last week' },
                  { k: 'Inbound interest', v: '14', d: '6 verified buyers' },
                  { k: 'Active deals', v: '2', d: 'Both in Phase 1' },
                ].map((m, i) => (
                  <div key={i} className="col gap-2" style={{ flex: 1, padding: 24, borderRight: i < 3 ? '0.5px solid var(--border)' : 'none' }}>
                    <span className="muted" style={{ fontSize: 12 }}>{m.k}</span>
                    <span className="tabular" style={{ fontSize: 32, fontWeight: 500, letterSpacing: -1 }}>{m.v}</span>
                    <span className="muted" style={{ fontSize: 11, color: m.color || 'var(--muted)' }}>{m.d}</span>
                  </div>
                ))}
              </div>

              <div className="row" style={{ gap: 16, alignItems: 'stretch' }}>
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
                  <p className="muted" style={{ fontSize: 12 }}>Top 8% of listings on platform.</p>
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
                  {activeDeals.map((d, i) => (
                    <div key={i} className="row hair" style={{ padding: 16, borderRadius: 8, gap: 24, alignItems: 'center' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface-2)', border: '0.5px solid var(--border)' }} />
                      <div className="col" style={{ minWidth: 160, gap: 2 }}>
                        <span style={{ fontSize: 14, fontWeight: 500 }}>{d.buyer}</span>
                        <span className="muted" style={{ fontSize: 12 }}>Fit score {d.fit}</span>
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
              {activeDeals.map((d, i) => (
                <div key={i} className="card col gap-6" style={{ padding: 28 }}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <div className="row gap-3">
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--surface-2)', border: '0.5px solid var(--border)' }} />
                      <div className="col" style={{ gap: 2 }}>
                        <div className="row gap-2"><span style={{ fontSize: 15, fontWeight: 500 }}>{d.buyer}</span><VerifiedBadge /></div>
                        <span className="muted" style={{ fontSize: 12 }}>Fit score {d.fit} · Logistics operator</span>
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
                    <span style={{ fontSize: 13 }}>Escrow holds <span className="tabular" style={{ fontWeight: 500 }}>€5,000</span> refundable deposit. Next milestone: data room request.</span>
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
                  { label: 'Premium upgrade', weight: 5, done: false },
                ]} />
              </div>

              <div className="card col gap-4" style={{ padding: 28, flex: 1 }}>
                <PremiumBadge />
                <h4>Reach 100% with Premium</h4>
                <p className="muted" style={{ fontSize: 13 }}>Premium listings appear at the top of the marketplace and in AI match shortlists. Average lift: 4.2× more verified buyer interest.</p>
                <ul className="col gap-2" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {['Featured placement', 'Gold premium badge', 'Priority verification (48h)', 'Dedicated advisor'].map(x => (
                    <li key={x} className="row gap-2" style={{ fontSize: 13 }}><Icon.Check size={11} color="#C8922A" /> {x}</li>
                  ))}
                </ul>
                <Button variant="primary" size="sm">Upgrade for €2,400</Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export function BuyerDashboardPage() {
  const router = useRouter();
  const [section, setSection] = useState('matches');

  const deals = [
    { listing: LISTINGS[0], phase: 1, status: 'NDA signed · escrow funded', amount: '€5,000', next: 'Data room access opening today' },
    { listing: LISTINGS[1], phase: 2, status: 'Operating handover · month 3 of 6', amount: '€428,000', next: 'Q1 KPI gate review in 18 days' },
    { listing: LISTINGS[7], phase: 1, status: 'NDA pending counter-signature', amount: '€5,000', next: 'Awaiting seller signature' },
  ];

  return (
    <div className="page-enter">
      <section style={{ padding: '32px 0 0' }}>
        <div className="container col gap-6">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
            <div className="col gap-2">
              <SectionEyebrow>Buying</SectionEyebrow>
              <h1 style={{ fontSize: 36 }}>Welcome back, Marek</h1>
            </div>
            <AccountTabs />
          </div>
          <div className="row gap-3" style={{ justifyContent: 'flex-end' }}>
            <Link href="/">
              <Button variant="secondary" size="sm">Chat with Ahmed AI</Button>
            </Link>
            <Button variant="primary" size="sm" onClick={() => router.push('/marketplace')} iconRight={<Icon.Arrow size={12} />}>Browse marketplace</Button>
          </div>
        </div>
      </section>

      <section className="hair-b" style={{ padding: '24px 0' }}>
        <div className="container row gap-6">
          {[
            { id: 'matches', l: 'AI matches', n: 3 },
            { id: 'deals', l: 'Active deals', n: 3 },
            { id: 'payments', l: 'Payments & escrow' },
            { id: 'saved', l: 'Saved listings', n: 7 },
          ].map(t => (
            <button key={t.id} onClick={() => setSection(t.id)} className="row gap-2"
              style={{
                fontSize: 13, fontWeight: 500,
                color: section === t.id ? 'var(--fg)' : 'var(--subtle)',
                paddingBottom: 14, marginBottom: -1,
                borderBottom: section === t.id ? '1.5px solid var(--fg)' : '1.5px solid transparent',
              }}>
              <span>{t.l}</span>
              {t.n && <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 999, background: 'var(--surface-2)', color: 'var(--subtle)' }}>{t.n}</span>}
            </button>
          ))}
        </div>
      </section>

      <section style={{ padding: '32px 0 96px' }}>
        <div className="container">
          {section === 'matches' && (
            <div className="col gap-4">
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <p style={{ fontSize: 14 }}>{MATCHES.length} matches based on your buyer profile</p>
                  <p className="muted" style={{ fontSize: 12 }}>Updated 4 hours ago · Re-runs daily</p>
                </div>
                <Link href="/">
                  <Button variant="ghost" size="sm">Refine with Ahmed AI →</Button>
                </Link>
              </div>

              <div className="col gap-3">
                {MATCHES.map(m => (
                  <div key={m.listing.id} className="card row" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="img-ph" style={{ width: 180, borderRadius: 0, borderRight: '0.5px solid var(--border)' }} />
                    <div className="col gap-3" style={{ flex: 1, padding: 24 }}>
                      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div className="col gap-2">
                          <div className="row gap-2">{m.listing.verified && <VerifiedBadge />}{m.listing.premium && <PremiumBadge />}</div>
                          <h4>{m.listing.name}</h4>
                          <span className="muted" style={{ fontSize: 12 }}>{m.listing.sector} · {m.listing.location} · {m.listing.revenue}</span>
                        </div>
                        <div className="col" style={{ alignItems: 'flex-end', gap: 4 }}>
                          <span className="tabular" style={{ fontSize: 28, fontWeight: 500, letterSpacing: -0.8 }}>{m.fit}</span>
                          <span className="muted" style={{ fontSize: 11 }}>fit</span>
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
                        <Link href={`/listing/${m.listing.id}`}>
                          <Button variant="primary" size="sm">View listing</Button>
                        </Link>
                        <Button variant="secondary" size="sm">Request NDA</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'deals' && (
            <div className="col gap-4">
              {deals.map((d, i) => (
                <div key={i} className="card col gap-6" style={{ padding: 28 }}>
                  <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="row gap-4">
                      <div className="img-ph" style={{ width: 60, height: 60, borderRadius: 8 }} />
                      <div className="col gap-2">
                        <div className="row gap-2">{d.listing.verified && <VerifiedBadge />}{d.listing.premium && <PremiumBadge />}</div>
                        <h4>{d.listing.name}</h4>
                        <span className="muted" style={{ fontSize: 12 }}>{d.listing.sector} · {d.listing.location}</span>
                      </div>
                    </div>
                    <Link href={`/listing/${d.listing.id}`}>
                      <Button variant="secondary" size="sm" iconRight={<Icon.ArrowUpRight size={11} />}>Open deal</Button>
                    </Link>
                  </div>

                  <PhaseTracker phases={PHASES} currentPhase={d.phase} />

                  <div className="row hair" style={{ padding: 16, borderRadius: 8, gap: 24, alignItems: 'center' }}>
                    <div className="col" style={{ gap: 2, minWidth: 220 }}>
                      <span className="muted" style={{ fontSize: 11 }}>Status</span>
                      <span style={{ fontSize: 13 }}>{d.status}</span>
                    </div>
                    <div className="col" style={{ gap: 2, minWidth: 160 }}>
                      <span className="muted" style={{ fontSize: 11 }}>In escrow</span>
                      <span className="tabular" style={{ fontSize: 14, fontWeight: 500 }}>{d.amount}</span>
                    </div>
                    <div className="col" style={{ gap: 2, flex: 1 }}>
                      <span className="muted" style={{ fontSize: 11 }}>Next step</span>
                      <span style={{ fontSize: 13 }}>{d.next}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {section === 'payments' && (
            <div className="col gap-6">
              <div className="row" style={{ gap: 0, border: '0.5px solid var(--border)', borderRadius: 10 }}>
                {[
                  { k: 'In escrow', v: '€438K', d: 'Across 3 active deals' },
                  { k: 'Released to date', v: '€718K', d: 'Phase 1 + 2 closures' },
                  { k: 'Pending milestone', v: '€280K', d: 'Q1 KPI gate · 18 days' },
                ].map((m, i) => (
                  <div key={i} className="col gap-2" style={{ flex: 1, padding: 24, borderRight: i < 2 ? '0.5px solid var(--border)' : 'none' }}>
                    <span className="muted" style={{ fontSize: 12 }}>{m.k}</span>
                    <span className="tabular" style={{ fontSize: 32, fontWeight: 500, letterSpacing: -1 }}>{m.v}</span>
                    <span className="muted" style={{ fontSize: 11 }}>{m.d}</span>
                  </div>
                ))}
              </div>

              <div className="card col" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="row" style={{ padding: 24, borderBottom: '0.5px solid var(--border)', justifyContent: 'space-between' }}>
                  <h4>Recent transactions</h4>
                  <Button variant="ghost" size="sm">Download CSV</Button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-2)' }}>
                      <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: 500, color: 'var(--muted)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>Date</th>
                      <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: 500, color: 'var(--muted)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>Deal</th>
                      <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: 500, color: 'var(--muted)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>Type</th>
                      <th style={{ padding: '12px 24px', textAlign: 'right', fontWeight: 500, color: 'var(--muted)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>Amount</th>
                      <th style={{ padding: '12px 24px', textAlign: 'right', fontWeight: 500, color: 'var(--muted)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['12 May 2026', 'Halcyon Skincare', 'Phase 2 release', '€428,000', 'cleared'],
                      ['08 May 2026', 'Northwind Logistics', 'NDA escrow deposit', '€5,000', 'held'],
                      ['02 May 2026', 'Vesper Coffee Roasters', 'NDA escrow deposit', '€5,000', 'held'],
                      ['28 Apr 2026', 'Halcyon Skincare', 'Phase 1 release', '€290,000', 'cleared'],
                      ['21 Apr 2026', 'Halcyon Skincare', 'Closing payment', '€700,000', 'cleared'],
                    ].map((r, i) => (
                      <tr key={i} style={{ borderTop: '0.5px solid var(--border)' }}>
                        <td style={{ padding: '14px 24px', color: 'var(--subtle)' }}>{r[0]}</td>
                        <td style={{ padding: '14px 24px', fontWeight: 500 }}>{r[1]}</td>
                        <td style={{ padding: '14px 24px', color: 'var(--subtle)' }}>{r[2]}</td>
                        <td className="tabular" style={{ padding: '14px 24px', textAlign: 'right', fontWeight: 500 }}>{r[3]}</td>
                        <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                          <span className="badge" style={{ color: r[4] === 'cleared' ? 'var(--green)' : 'var(--subtle)' }}>
                            {r[4] === 'cleared' ? <Icon.Check size={10} /> : <Icon.Lock size={10} />}
                            {r[4]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {section === 'saved' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {LISTINGS.slice(0, 6).map(l => <ListingCard key={l.id} listing={l} href={`/listing/${l.id}`} />)}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
