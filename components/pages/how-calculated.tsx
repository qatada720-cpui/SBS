'use client';
import Link from 'next/link';
import { Icon, SectionEyebrow } from '@/components/ui';

const FACTORS = [
  {
    id: 'financials',
    label: 'Verified financials',
    weight: 30,
    icon: 'Doc',
    color: '#0047FF',
    description: 'Three years of audited P&L, balance sheets, and tax filings reviewed by a certified accountant. This is the single largest component — clean, audited books signal a trustworthy seller.',
    subFactors: [
      { name: '3 years audited P&L', pts: 15 },
      { name: 'Tax filings (Belastingdienst or equivalent)', pts: 10 },
      { name: 'Balance sheet & cash flow statement', pts: 5 },
    ],
  },
  {
    id: 'legal',
    label: 'Legal & ownership clarity',
    weight: 20,
    icon: 'Shield',
    color: '#00A86B',
    description: 'KvK registration, clean IP ownership, no pending litigation, and a verified cap table. Legal clarity prevents deal fall-throughs at closing.',
    subFactors: [
      { name: 'KvK / company registration verified', pts: 8 },
      { name: 'IP & trademark ownership confirmed', pts: 6 },
      { name: 'No material litigation or liens', pts: 6 },
    ],
  },
  {
    id: 'revenue',
    label: 'Revenue quality',
    weight: 20,
    icon: 'Star',
    color: '#C8922A',
    description: 'Recurring vs. one-time revenue, customer concentration, and churn rate. A business with 80%+ recurring revenue scores significantly higher than one dependent on project-based income.',
    subFactors: [
      { name: 'Recurring revenue % (ARR/MRR)', pts: 10 },
      { name: 'Customer concentration (no single >20%)', pts: 6 },
      { name: 'Revenue trend (3yr CAGR)', pts: 4 },
    ],
  },
  {
    id: 'operations',
    label: 'Operational independence',
    weight: 15,
    icon: 'Building',
    color: '#7C6FFF',
    description: 'How dependent is the business on the current owner? A business with documented SOPs, a stable management team, and systems in place scores higher — it can survive a CEO transition.',
    subFactors: [
      { name: 'Management team in place (not owner-dependent)', pts: 8 },
      { name: 'Documented SOPs and processes', pts: 4 },
      { name: 'Key-man risk assessment', pts: 3 },
    ],
  },
  {
    id: 'growth',
    label: 'Growth potential',
    weight: 10,
    icon: 'Arrow',
    color: '#FF6B35',
    description: 'Market size, competitive moat, and identifiable growth levers (untapped geographies, pricing power, product expansion). Assessed by SafeBusineSSSelling analysts using industry benchmarks.',
    subFactors: [
      { name: 'Addressable market size', pts: 4 },
      { name: 'Competitive differentiation', pts: 4 },
      { name: 'Identified growth levers', pts: 2 },
    ],
  },
  {
    id: 'phased',
    label: 'Phased ownership support',
    weight: 5,
    icon: 'Check',
    color: '#00A86B',
    description: 'Whether the seller commits to a phased handover (typically 6–18 months). This dramatically reduces transition risk for buyers and is a strong signal of seller confidence in the business.',
    subFactors: [
      { name: 'Seller commits to phased transition', pts: 3 },
      { name: 'Transition plan documented', pts: 2 },
    ],
  },
];

const EXAMPLE_LISTING = {
  name: 'Northwind Logistics',
  scores: [27, 18, 16, 12, 8, 5],
  total: 86,
};

function ScoreFactorRow({ factor, score }: { factor: typeof FACTORS[0]; score: number }) {
  const pct = Math.round((score / factor.weight) * 100);
  return (
    <div className="card col gap-4" style={{ padding: '20px 24px' }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div className="col gap-2" style={{ flex: 1, minWidth: 240 }}>
          <div className="row gap-2" style={{ alignItems: 'center' }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: `${factor.color}18`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: factor.color,
            }}>
              <Icon.Shield size={14} />
            </div>
            <div className="col gap-0">
              <span style={{ fontSize: 14, fontWeight: 600 }}>{factor.label}</span>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>Weight: {factor.weight} pts</span>
            </div>
          </div>
          <p style={{ fontSize: 13, color: 'var(--subtle)', lineHeight: 1.6, fontWeight: 300, margin: 0 }}>
            {factor.description}
          </p>
        </div>
        <div className="col gap-3" style={{ minWidth: 200 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Max score</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{factor.weight} pts</span>
          </div>
          <div style={{ height: 6, background: 'var(--hair)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${pct}%`,
              background: factor.color,
              borderRadius: 999,
              transition: 'width 0.6s ease',
            }} />
          </div>
          <div className="col gap-1">
            {factor.subFactors.map((sf) => (
              <div key={sf.name} className="row" style={{ justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--subtle)', fontWeight: 300 }}>{sf.name}</span>
                <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500, flexShrink: 0 }}>+{sf.pts}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function HowCalculatedPage() {
  return (
    <div className="page-enter">
      {/* Hero */}
      <section style={{ padding: '72px 0 56px' }}>
        <div className="container col gap-5" style={{ maxWidth: 760 }}>
          <SectionEyebrow>Trust Score</SectionEyebrow>
          <h1 style={{ fontSize: 48, fontWeight: 700, letterSpacing: -1.5, margin: 0 }}>
            How is the score<br />calculated?
          </h1>
          <p style={{ fontSize: 17, color: 'var(--subtle)', lineHeight: 1.7, fontWeight: 300, margin: 0 }}>
            Every listing on SafeBusineSSSelling receives a Trust Score from 0 to 100. It's not a subjective rating — it's a structured, document-backed assessment across six verifiable dimensions. Here's exactly how it works.
          </p>
          <div className="row gap-3" style={{ flexWrap: 'wrap' }}>
            <span className="badge badge-verified">
              <Icon.Shield size={10} /> Independently verified
            </span>
            <span className="badge">
              <Icon.Lock size={10} /> Document-backed
            </span>
            <span className="badge">
              Updated every 90 days
            </span>
          </div>
        </div>
      </section>

      {/* Score overview */}
      <section style={{ padding: '0 0 56px' }}>
        <div className="container col gap-4" style={{ maxWidth: 760 }}>
          <div className="card" style={{ padding: '28px 32px' }}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 32, flexWrap: 'wrap' }}>
              <div className="col gap-3" style={{ flex: 1, minWidth: 200 }}>
                <span style={{ fontSize: 12, fontWeight: 500, letterSpacing: 0.8, textTransform: 'uppercase', color: 'var(--muted)' }}>Score breakdown</span>
                {FACTORS.map((f) => (
                  <div key={f.id} className="row" style={{ justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 13, color: 'var(--subtle)', fontWeight: 300 }}>{f.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>{f.weight} pts</span>
                  </div>
                ))}
                <div className="hair-t row" style={{ paddingTop: 10, justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Total possible</span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#0047FF' }}>100 pts</span>
                </div>
              </div>
              <div className="col gap-3" style={{ minWidth: 200 }}>
                <span style={{ fontSize: 12, fontWeight: 500, letterSpacing: 0.8, textTransform: 'uppercase', color: 'var(--muted)' }}>Score tiers</span>
                {[
                  { range: '90 – 100', label: 'Elite', color: '#00A86B', desc: 'Institutional-grade' },
                  { range: '75 – 89', label: 'Strong', color: '#0047FF', desc: 'Highly recommended' },
                  { range: '60 – 74', label: 'Good', color: '#C8922A', desc: 'Minor gaps only' },
                  { range: '40 – 59', label: 'Fair', color: '#FF6B35', desc: 'Due diligence required' },
                  { range: '0 – 39', label: 'Limited', color: 'var(--muted)', desc: 'Not yet recommended' },
                ].map((t) => (
                  <div key={t.range} className="row gap-2" style={{ alignItems: 'center' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 500, minWidth: 70, color: t.color }}>{t.range}</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{t.label}</span>
                    <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 300 }}>— {t.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Factors */}
      <section style={{ padding: '0 0 56px' }}>
        <div className="container col gap-4" style={{ maxWidth: 760 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5, margin: 0 }}>The six factors</h2>
          {FACTORS.map((f, i) => (
            <ScoreFactorRow key={f.id} factor={f} score={EXAMPLE_LISTING.scores[i]} />
          ))}
        </div>
      </section>

      {/* Example */}
      <section style={{ padding: '0 0 56px' }}>
        <div className="container col gap-4" style={{ maxWidth: 760 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5, margin: 0 }}>Worked example</h2>
          <div className="card col gap-5" style={{ padding: '28px 32px' }}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div className="col gap-1">
                <span style={{ fontSize: 16, fontWeight: 600 }}>{EXAMPLE_LISTING.name}</span>
                <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 300 }}>Logistics · Rotterdam, NL · €2.4M revenue</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 40, fontWeight: 700, color: '#0047FF', lineHeight: 1 }}>{EXAMPLE_LISTING.total}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>/ 100 — Strong</div>
              </div>
            </div>
            <div className="col gap-2">
              {FACTORS.map((f, i) => (
                <div key={f.id} className="row" style={{ justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div className="row gap-2" style={{ flex: 1, minWidth: 200 }}>
                    <span style={{ fontSize: 13, color: 'var(--subtle)', fontWeight: 300 }}>{f.label}</span>
                  </div>
                  <div className="row gap-3" style={{ minWidth: 200 }}>
                    <div style={{ flex: 1, height: 4, background: 'var(--hair)', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.round((EXAMPLE_LISTING.scores[i] / f.weight) * 100)}%`,
                        background: f.color,
                        borderRadius: 999,
                      }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, minWidth: 48, textAlign: 'right' }}>
                      {EXAMPLE_LISTING.scores[i]} / {f.weight}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '0 0 80px' }}>
        <div className="container col gap-5" style={{ maxWidth: 760 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5, margin: 0 }}>Common questions</h2>
          {[
            {
              q: 'Who performs the verification?',
              a: "SafeBusineSSSelling works with a panel of certified accountants, legal advisors, and industry analysts. Every verification is performed by an independent third party — not by the seller.",
            },
            {
              q: 'Can a score decrease after listing?',
              a: 'Yes. Scores are reviewed every 90 days and updated if new information emerges (audits, litigation, ownership changes). Buyers are notified of score changes above ±5 points.',
            },
            {
              q: 'What happens if a seller refuses verification?',
              a: "Listings without completed verification display a score below 40 and carry a 'Unverified' label. We never suppress this — buyers always see the full picture.",
            },
            {
              q: 'Is the score the same as a valuation?',
              a: "No. The Trust Score measures documentation quality and business integrity — not market value. Use the asking price and revenue multiples on each listing for valuation context.",
            },
          ].map((faq) => (
            <div key={faq.q} className="col gap-2" style={{ borderBottom: '0.5px solid var(--hair)', paddingBottom: 20 }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>{faq.q}</span>
              <p style={{ fontSize: 14, color: 'var(--subtle)', lineHeight: 1.7, fontWeight: 300, margin: 0 }}>{faq.a}</p>
            </div>
          ))}

          <div className="row gap-3" style={{ marginTop: 8 }}>
            <Link href="/marketplace" className="btn btn-primary">Browse verified listings</Link>
            <Link href="/seller/onboarding" className="btn btn-secondary">List your business</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
