// Product pages: Marketplace, Listing detail, AI Buyer Matching

// ───────────────────────── Marketplace ─────────────────────────
function MarketplacePage({ onNav }) {
  const { LISTINGS, SECTORS, REVENUE_RANGES } = window.SBS_DATA;
  const [sector, setSector] = React.useState('All sectors');
  const [revRange, setRevRange] = React.useState('Any revenue');
  const [verifiedOnly, setVerifiedOnly] = React.useState(false);
  const [premiumOnly, setPremiumOnly] = React.useState(false);
  const [minScore, setMinScore] = React.useState(0);
  const [sort, setSort] = React.useState('score');
  const [q, setQ] = React.useState('');

  const filtered = React.useMemo(() => {
    let f = LISTINGS.filter(l =>
      (sector === 'All sectors' || l.sector === sector) &&
      (!verifiedOnly || l.verified) &&
      (!premiumOnly || l.premium) &&
      l.score >= minScore &&
      (q === '' || l.name.toLowerCase().includes(q.toLowerCase()) || l.sector.toLowerCase().includes(q.toLowerCase()))
    );
    if (sort === 'score') f = [...f].sort((a, b) => b.score - a.score);
    if (sort === 'newest') f = [...f].sort((a, b) => a.id < b.id ? 1 : -1);
    return f;
  }, [sector, verifiedOnly, premiumOnly, minScore, sort, q]);

  return (
    <div className="page-enter">
      <section style={{ padding: '56px 0 32px' }}>
        <div className="container col gap-3">
          <SectionEyebrow>Marketplace</SectionEyebrow>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end', gap: 24 }}>
            <h1 style={{ fontSize: 48 }}>{filtered.length} verified businesses</h1>
            <div className="row gap-3">
              <div className="row hair" style={{ padding: '0 12px', height: 36, borderRadius: 8, gap: 8, minWidth: 280 }}>
                <Icon.Search size={14} />
                <input
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder="Search by name or sector"
                  style={{ border: 'none', padding: 0, height: '100%', background: 'transparent', fontSize: 13 }}
                />
              </div>
              <select value={sort} onChange={e => setSort(e.target.value)} style={{ height: 36, padding: '0 12px', fontSize: 13, width: 'auto', appearance: 'none', background: 'transparent' }}>
                <option value="score">Sort: Listing score</option>
                <option value="newest">Sort: Newest first</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <section className="hair-t" style={{ padding: '20px 0' }}>
        <div className="container col gap-3">
          <div className="row gap-2 scroll-x">
            {SECTORS.map(s => (
              <button key={s} className={`chip ${sector === s ? 'active' : ''}`} onClick={() => setSector(s)}>{s}</button>
            ))}
          </div>
          <div className="row" style={{ justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div className="row gap-2">
              {REVENUE_RANGES.map(r => (
                <button key={r} className={`chip ${revRange === r ? 'active' : ''}`} onClick={() => setRevRange(r)}>{r}</button>
              ))}
            </div>
            <div className="row gap-3">
              <label className="row gap-2" style={{ fontSize: 13, cursor: 'pointer', color: verifiedOnly ? 'var(--fg)' : 'var(--subtle)' }}>
                <input type="checkbox" checked={verifiedOnly} onChange={e => setVerifiedOnly(e.target.checked)} style={{ width: 14, height: 14, accentColor: 'var(--blue)' }} />
                Verified only
              </label>
              <label className="row gap-2" style={{ fontSize: 13, cursor: 'pointer', color: premiumOnly ? 'var(--fg)' : 'var(--subtle)' }}>
                <input type="checkbox" checked={premiumOnly} onChange={e => setPremiumOnly(e.target.checked)} style={{ width: 14, height: 14, accentColor: 'var(--blue)' }} />
                Premium only
              </label>
              <div className="row gap-2" style={{ fontSize: 13 }}>
                <span className="muted">Min score</span>
                <input type="range" min="0" max="100" step="5" value={minScore} onChange={e => setMinScore(+e.target.value)}
                  style={{ width: 100, accentColor: 'var(--blue)' }} />
                <span className="tabular" style={{ minWidth: 32 }}>{minScore}%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '40px 0 64px' }}>
        <div className="container">
          {filtered.length === 0 ? (
            <div className="col" style={{ padding: 80, alignItems: 'center', gap: 12 }}>
              <Icon.Search size={24} />
              <p className="muted">No listings match these filters.</p>
              <Button variant="secondary" size="sm" onClick={() => { setSector('All sectors'); setVerifiedOnly(false); setPremiumOnly(false); setMinScore(0); setQ(''); }}>Reset filters</Button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {filtered.map(l => (
                <ListingCard key={l.id} listing={l} onClick={() => onNav('listing', l.id)} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// ───────────────────────── Listing detail ─────────────────────────
function ListingPage({ listingId, onNav }) {
  const { LISTINGS, PHASES, REVIEWS } = window.SBS_DATA;
  const listing = LISTINGS.find(l => l.id === listingId) || LISTINGS[0];
  const [tab, setTab] = React.useState('overview');
  const [selectedPhoto, setSelectedPhoto] = React.useState(0);

  const breakdown = [
    { label: 'Identity & ownership verified', weight: 15, done: true },
    { label: '3 years of financials', weight: 20, done: true },
    { label: 'Tax filings cross-checked', weight: 15, done: true },
    { label: 'Trade references (min. 3)', weight: 10, done: true },
    { label: 'AI-narrative approved', weight: 10, done: true },
    { label: 'Data room populated', weight: 15, done: listing.score >= 80 },
    { label: 'Phased ownership template signed', weight: 10, done: listing.score >= 85 },
    { label: 'Premium upgrade', weight: 5, done: listing.premium },
  ];

  return (
    <div className="page-enter">
      {/* breadcrumb */}
      <section style={{ padding: '32px 0 0' }}>
        <div className="container row gap-2" style={{ fontSize: 12, color: 'var(--muted)' }}>
          <a onClick={() => onNav('marketplace')} style={{ cursor: 'pointer' }}>Marketplace</a>
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
              {listing.premium && <PremiumBadge />}
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
                    <span className="muted" style={{ fontSize: 13 }}>from 14 verified reviews</span>
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

// ───────────────────────── AI Buyer Matching ─────────────────────────
function AIMatchPage({ onNav }) {
  const { MATCHES } = window.SBS_DATA;
  const [step, setStep] = React.useState(0);
  const [answers, setAnswers] = React.useState({});
  const [thinking, setThinking] = React.useState(false);

  const questions = [
    { id: 'budget', q: 'What is your total budget for this acquisition?', type: 'select', options: ['< €500K', '€500K – €1M', '€1M – €5M', '€5M – €10M', '€10M+'] },
    { id: 'sectors', q: 'Which sectors interest you?', type: 'multi', options: ['SaaS', 'E-commerce / DTC', 'Logistics', 'Healthcare', 'Food & Beverage', 'Professional Services', 'Automotive', 'Other'] },
    { id: 'experience', q: 'What sector experience are you bringing?', type: 'select', options: ['I\'m an operator in the same sector', 'Adjacent industry, transferable skills', 'Strategic / investor — hands-off', 'First-time owner-operator'] },
    { id: 'location', q: 'Where can you be operationally present?', type: 'select', options: ['Anywhere in Europe', 'Netherlands & Belgium', 'DACH region', 'Within 2-hour drive of [your city]', 'Fully remote-acceptable'] },
    { id: 'role', q: 'How involved do you want to be day-to-day?', type: 'select', options: ['Full-time CEO from day one', 'Phased into CEO over 6 months', 'Chair / strategic, not operational', 'Pure financial sponsor'] },
    { id: 'timeline', q: 'When do you want to close?', type: 'select', options: ['Within 90 days', '3–6 months', '6–12 months', 'Whenever the right deal appears'] },
  ];

  const total = questions.length;
  const isAnswered = step < total && (
    questions[step].type === 'multi'
      ? (answers[questions[step].id] || []).length > 0
      : !!answers[questions[step].id]
  );

  function setAnswer(v) {
    setAnswers({ ...answers, [questions[step].id]: v });
  }
  function toggleMulti(v) {
    const cur = answers[questions[step].id] || [];
    const next = cur.includes(v) ? cur.filter(x => x !== v) : [...cur, v];
    setAnswers({ ...answers, [questions[step].id]: next });
  }

  function next() {
    if (step < total - 1) setStep(step + 1);
    else {
      setThinking(true);
      setTimeout(() => { setThinking(false); setStep(total); }, 1800);
    }
  }

  // RESULTS
  if (step === total) {
    return (
      <div className="page-enter">
        <section style={{ padding: '64px 0 32px' }}>
          <div className="container col gap-3">
            <div className="row gap-2"><Icon.Sparkle size={14} /><span style={{ fontSize: 12, color: 'var(--muted)', letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 500 }}>AI Buyer Match · 3 matches</span></div>
            <h1 style={{ fontSize: 48 }}>Your shortlist.</h1>
            <p className="subtle" style={{ fontSize: 16, fontWeight: 300, maxWidth: 560 }}>Three verified businesses match your profile with high confidence. Each has a rationale you can validate before requesting NDA access.</p>
          </div>
        </section>

        <section style={{ padding: '32px 0 80px' }}>
          <div className="container col gap-4">
            {MATCHES.map((m, i) => (
              <div key={m.listing.id} className="card row" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="img-ph" style={{ width: 220, borderRadius: 0, borderRight: '0.5px solid var(--border)' }} />
                <div className="col gap-4" style={{ flex: 1, padding: 28 }}>
                  <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="col gap-2">
                      <div className="row gap-2">
                        {m.listing.verified && <VerifiedBadge />}
                        {m.listing.premium && <PremiumBadge />}
                      </div>
                      <h3>{m.listing.name}</h3>
                      <div className="row gap-2 muted" style={{ fontSize: 12 }}>
                        <span>{m.listing.sector}</span><Icon.Dot size={3} /><span>{m.listing.location}</span><Icon.Dot size={3} /><span>{m.listing.revenue}</span>
                      </div>
                    </div>
                    <div className="col" style={{ alignItems: 'flex-end', gap: 4 }}>
                      <div className="row gap-2" style={{ alignItems: 'baseline' }}>
                        <span className="tabular" style={{ fontSize: 36, fontWeight: 500, letterSpacing: -1 }}>{m.fit}</span>
                        <span className="muted" style={{ fontSize: 12 }}>/ 100 fit</span>
                      </div>
                      <span className="muted" style={{ fontSize: 11 }}>Asking {m.listing.asking}</span>
                    </div>
                  </div>

                  <div className="col gap-2" style={{ paddingTop: 16, borderTop: '0.5px solid var(--border)' }}>
                    <span className="muted" style={{ fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 500 }}>Why this matches</span>
                    <div className="row gap-2" style={{ flexWrap: 'wrap', marginTop: 4 }}>
                      {m.reasons.map(r => (
                        <span key={r} className="row gap-2" style={{ fontSize: 12, padding: '4px 10px', borderRadius: 999, background: 'var(--surface-2)' }}>
                          <Icon.Check size={10} color="#00A86B" /> {r}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="row gap-2" style={{ marginTop: 4 }}>
                    <Button variant="primary" size="sm" onClick={() => onNav('listing', m.listing.id)} iconRight={<Icon.Arrow size={12} />}>View listing</Button>
                    <Button variant="secondary" size="sm">Save to dashboard</Button>
                    <Button variant="ghost" size="sm">Dismiss</Button>
                  </div>
                </div>
              </div>
            ))}

            <div className="row hair" style={{ padding: 20, borderRadius: 10, justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
              <span style={{ fontSize: 13, color: 'var(--subtle)' }}>Not seeing the right fit?</span>
              <div className="row gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setStep(0); setAnswers({}); }}>Re-run match</Button>
                <Button variant="secondary" size="sm" onClick={() => onNav('marketplace')}>Browse all listings</Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (thinking) {
    return (
      <div className="page-enter" style={{ minHeight: '70vh', display: 'grid', placeItems: 'center' }}>
        <div className="col gap-4" style={{ alignItems: 'center', textAlign: 'center', maxWidth: 380 }}>
          <div className="row gap-3" style={{ alignItems: 'center' }}>
            <Icon.Sparkle size={18} />
            <div className="row gap-1">
              <span className="pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--fg)', animationDelay: '0s' }} />
              <span className="pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--fg)', animationDelay: '0.2s' }} />
              <span className="pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--fg)', animationDelay: '0.4s' }} />
            </div>
          </div>
          <h2 style={{ fontSize: 28 }}>Scanning 2,413 verified businesses…</h2>
          <p className="muted" style={{ fontSize: 14, fontWeight: 300 }}>Filtering on sector experience, budget band, geographic reach, and operating style.</p>
        </div>
      </div>
    );
  }

  // QUESTIONNAIRE
  const cur = questions[step];
  const answer = answers[cur.id];

  return (
    <div className="page-enter">
      <section style={{ padding: '64px 0 24px' }}>
        <div className="container-narrow col gap-3">
          <div className="row gap-2"><Icon.Sparkle size={14} /><span style={{ fontSize: 12, color: 'var(--muted)', letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 500 }}>AI Buyer Match</span></div>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h1 style={{ fontSize: 40 }}>Find the right business for you.</h1>
            <span className="tabular muted" style={{ fontSize: 13 }}>Question {step + 1} / {total}</span>
          </div>
          <div className="score-bar" style={{ marginTop: 8 }}>
            <div className="score-fill brand" style={{ width: `${((step + 1) / total) * 100}%` }} />
          </div>
        </div>
      </section>

      <section style={{ padding: '40px 0 96px' }}>
        <div className="container-narrow col gap-8">
          <h2 style={{ fontSize: 32, letterSpacing: -1, fontWeight: 500 }}>{cur.q}</h2>

          <div className="col gap-2">
            {cur.options.map(o => {
              const selected = cur.type === 'multi' ? (answer || []).includes(o) : answer === o;
              return (
                <button key={o}
                  onClick={() => cur.type === 'multi' ? toggleMulti(o) : setAnswer(o)}
                  className="row"
                  style={{
                    padding: '18px 20px', textAlign: 'left',
                    borderRadius: 10,
                    border: '0.5px solid ' + (selected ? 'var(--fg)' : 'var(--border)'),
                    background: selected ? 'var(--surface-2)' : 'transparent',
                    fontSize: 15, fontWeight: 400,
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease',
                  }}>
                  <span>{o}</span>
                  {selected
                    ? <Icon.Check size={14} color={cur.type === 'multi' ? 'var(--blue)' : 'var(--fg)'} />
                    : <span style={{ width: 14, height: 14, borderRadius: cur.type === 'multi' ? 4 : '50%', border: '0.5px solid var(--border-strong)' }} />}
                </button>
              );
            })}
          </div>

          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', paddingTop: 24, borderTop: '0.5px solid var(--border)' }}>
            <Button variant="ghost" size="sm" onClick={() => step > 0 && setStep(step - 1)} disabled={step === 0}>← Back</Button>
            <Button variant="primary" onClick={next} disabled={!isAnswered} iconRight={<Icon.Arrow size={12} />}>
              {step === total - 1 ? 'See matches' : 'Continue'}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

Object.assign(window, { MarketplacePage, ListingPage, AIMatchPage });
