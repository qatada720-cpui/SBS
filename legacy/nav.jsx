// Nav + Footer for SafeBusinessSelling

const { useState: useState_nav } = React;

function Nav({ page, onNav, transparent = false }) {
  const links = [
    { id: 'about', label: 'About' },
    { id: 'how', label: 'How it works' },
    { id: 'marketplace', label: 'Marketplace' },
  ];
  return (
    <nav className="nav" style={transparent ? { background: 'transparent', backdropFilter: 'none', WebkitBackdropFilter: 'none', borderBottom: 'none' } : undefined}>
      <div className="container row" style={{ height: 64, justifyContent: 'space-between' }}>
        <div className="row gap-8" style={{ alignItems: 'center' }}>
          <a className="row gap-3" onClick={() => onNav('home')} style={{ cursor: 'pointer' }}>
            <Logo size={0.9} />
          </a>
          <div className="row gap-6" style={{ alignItems: 'center' }}>
            {links.map(l => (
              <a key={l.id} className={`nav-link ${page === l.id ? 'active' : ''}`} onClick={() => onNav(l.id)} style={{ cursor: 'pointer' }}>
                {l.label}
              </a>
            ))}
          </div>
        </div>

        <div className="row gap-4" style={{ alignItems: 'center' }}>
          <a className="nav-link" onClick={() => onNav('buyer-dashboard')} style={{ cursor: 'pointer' }}>Sign in</a>
          <Button variant="primary" size="sm" onClick={() => onNav('seller-onboarding')}>Sign up</Button>
        </div>
      </div>
    </nav>
  );
}

function Footer({ onNav }) {
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
              <span className="badge badge-verified"><Icon.Shield size={10} /> SOC 2 Type II</span>
              <span className="badge"><Icon.Lock size={10} /> Escrow protected</span>
            </div>
          </div>

          <div className="row" style={{ gap: 56 }}>
            {cols.map(c => (
              <div key={c.head} className="col gap-3" style={{ minWidth: 120 }}>
                <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)' }}>{c.head}</div>
                <div className="col gap-2">
                  {c.links.map((x, i) => (
                    <a key={i} onClick={() => onNav(x.p)} style={{ fontSize: 13, color: 'var(--subtle)', cursor: 'pointer', fontWeight: 300 }}
                       onMouseEnter={e => e.target.style.color = 'var(--fg)'}
                       onMouseLeave={e => e.target.style.color = 'var(--subtle)'}>
                      {x.l}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="hair-t row" style={{ paddingTop: 24, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>© 2026 SafeBusinessSelling B.V. KvK 81234567. Amsterdam, NL.</span>
          <span style={{ fontSize: 12, color: 'var(--muted)' }} className="row gap-2">
            <Icon.Dot size={5} color="#00A86B" /> All systems operational
          </span>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, { Nav, Footer });
