// Main app — router + tweaks for SafeBusinessSelling

const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "dark",
  "accentBlue": "#0047FF",
  "density": "comfortable"
}/*EDITMODE-END*/;

function App() {
  const [page, setPage] = useState('home');
  const [listingId, setListingId] = useState('l-001');
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Apply theme to root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tweaks.theme);
    document.documentElement.style.setProperty('--blue', tweaks.accentBlue || '#0047FF');
  }, [tweaks.theme, tweaks.accentBlue]);

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [page, listingId]);

  function nav(p, arg) {
    setPage(p);
    if (p === 'listing' && arg) setListingId(arg);
  }

  let content;
  switch (page) {
    case 'home': content = <HomePage onNav={nav} />; break;
    case 'marketplace': content = <MarketplacePage onNav={nav} />; break;
    case 'listing': content = <ListingPage listingId={listingId} onNav={nav} />; break;
    case 'ai-match': content = <AIMatchPage onNav={nav} />; break;
    case 'how': content = <HowItWorksPage onNav={nav} />; break;
    case 'about': content = <AboutPage onNav={nav} />; break;
    case 'contact': content = <ContactPage onNav={nav} />; break;
    case 'seller-onboarding': content = <SellerOnboardingPage onNav={nav} />; break;
    case 'seller-dashboard': content = <SellerDashboardPage onNav={nav} />; break;
    case 'buyer-dashboard': content = <BuyerDashboardPage onNav={nav} />; break;
    default: content = <HomePage onNav={nav} />;
  }

  const showFooter = !['home', 'seller-dashboard', 'buyer-dashboard', 'seller-onboarding'].includes(page);

  return (
    <React.Fragment>
      <Nav page={page} onNav={nav} />
      <main key={page + listingId}>{content}</main>
      {showFooter && <Footer onNav={nav} />}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Theme">
          <TweakRadio
            label="Mode"
            value={tweaks.theme}
            onChange={v => setTweak('theme', v)}
            options={[{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }]}
          />
          <TweakColor
            label="Accent blue"
            value={tweaks.accentBlue}
            onChange={v => setTweak('accentBlue', v)}
            options={['#0047FF', '#1E40AF', '#2A6FDB', '#0066CC']}
          />
        </TweakSection>
        <TweakSection label="Quick nav">
          <div className="row" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
            {[
              { id: 'home', l: 'Home' },
              { id: 'marketplace', l: 'Marketplace' },
              { id: 'listing', l: 'Listing detail' },
              { id: 'ai-match', l: 'AI match' },
              { id: 'seller-onboarding', l: 'Seller onboarding' },
              { id: 'seller-dashboard', l: 'Seller dashboard' },
              { id: 'buyer-dashboard', l: 'Buyer dashboard' },
              { id: 'how', l: 'How it works' },
              { id: 'about', l: 'About' },
              { id: 'contact', l: 'Contact' },
            ].map(b => (
              <button key={b.id} onClick={() => nav(b.id)} style={{
                padding: '8px 10px', fontSize: 12, borderRadius: 6,
                border: '0.5px solid var(--border)',
                background: page === b.id ? 'var(--fg)' : 'transparent',
                color: page === b.id ? 'var(--bg)' : 'var(--fg)',
                textAlign: 'left',
              }}>{b.l}</button>
            ))}
          </div>
        </TweakSection>
      </TweaksPanel>
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
