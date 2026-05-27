'use client';
import { useState, useEffect, useRef, useTransition, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Icon, SectionEyebrow, Stat, Field } from '@/components/ui';
import { TEAM } from '@/lib/data';

const AHMED_OPENING = "I'm Ahmed — I help buyers find verified businesses on SafeBusinessSelling. To find your best matches, I'll ask a few short questions. What sector or type of business are you looking at?";

type ChatMessage = {
  from: string;
  text: string;
  searching?: boolean;
};

type GroqMessage = { role: 'user' | 'assistant'; content: string };

export function HomePage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { from: 'bot', text: AHMED_OPENING },
  ]);
  const [groqHistory, setGroqHistory] = useState<GroqMessage[]>([]);
  const [thinking, setThinking] = useState(false);
  const [, startTransition] = useTransition();
  const [navigating, setNavigating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const userAnswerCount = messages.filter((m) => m.from === 'user').length;

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  const sendAnswer = useCallback(async (trimmed: string) => {
    setMessages((m) => [...m, { from: 'user', text: trimmed }]);
    setThinking(true);

    const newHistory: GroqMessage[] = [
      ...groqHistory,
      { role: 'user', content: trimmed },
    ];

    try {
      const res = await fetch('/api/ahmed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newHistory }),
      });

      if (!res.ok || !res.body) throw new Error('Request failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let displayed = '';

      setThinking(false);
      setMessages((m) => [...m, { from: 'bot', text: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
      }

      // Typewriter: batch 4 chars per tick, low priority so typing stays responsive
      for (let i = 0; i < fullText.length; i += 4) {
        displayed += fullText.slice(i, i + 4);
        const snap = displayed;
        startTransition(() => {
          setMessages((m) => {
            const updated = [...m];
            updated[updated.length - 1] = { from: 'bot', text: snap };
            return updated;
          });
        });
        await new Promise((r) => setTimeout(r, 30));
      }

      setGroqHistory([...newHistory, { role: 'assistant', content: fullText }]);
    } catch {
      setThinking(false);
      setMessages((m) => [...m, { from: 'bot', text: "Sorry, something went wrong. Please try again." }]);
    }
  }, [groqHistory, startTransition]);

  const showMatchingBusinesses = useCallback(async () => {
    if (navigating || thinking) return;
    setNavigating(true);
    setMessages((m) => [
      ...m,
      { from: 'bot', text: 'Scanning verified businesses and scoring each match from 1 to 100…', searching: true },
    ]);

    try {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: groqHistory }),
      });
      const data = await res.json();
      sessionStorage.setItem('sbs_matches', JSON.stringify(data.matches));
      sessionStorage.setItem('sbs_profile', JSON.stringify(data.profile));
    } catch {
      // continue to page even if matching fails
    }

    router.push('/ai-match');
  }, [navigating, thinking, groqHistory, router]);

  return (
    <div className="page-enter" style={{ height: 'calc(100dvh - 64px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <section style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 24px 0' }}>
        <div className="col" style={{ width: '100%', maxWidth: 680, flex: 1, minHeight: 0 }}>
          {/* Small header */}
          <div className="row gap-3" style={{ alignItems: 'center', paddingBottom: 24 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface-2)', border: '0.5px solid var(--border)', display: 'grid', placeItems: 'center' }}>
              <Icon.Sparkle size={13} />
            </div>
            <div className="col" style={{ gap: 1 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>Ahmed AI</span>
              <span className="row gap-2" style={{ fontSize: 11, color: 'var(--muted)' }}>
                <Icon.Dot size={4} color="#00A86B" />
                SafeBusineSSSelling
              </span>
            </div>
          </div>

          {/* Chat scroll area */}
          <div ref={scrollRef} className="col gap-4" style={{ flex: 1, overflowY: 'auto', paddingBottom: 16 }}>
            {messages.map((m, i) => (
              <Message key={i} msg={m} />
            ))}
            {thinking && <TypingIndicator />}
          </div>
        </div>
      </section>

      {/* Bottom composer */}
      <div style={{ padding: '8px 24px 32px', display: 'flex', justifyContent: 'center', background: 'linear-gradient(to top, var(--bg) 60%, transparent)' }}>
        <div className="col gap-3" style={{ width: '100%', maxWidth: 680 }}>
          {!navigating && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={showMatchingBusinesses}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Show matching businesses
              <Icon.Arrow size={12} />
            </button>
          )}

          {!navigating ? (
            <Composer
              onSend={sendAnswer}
              disabled={thinking}
              answerCount={userAnswerCount}
              shouldFocus={!thinking}
            />
          ) : (
            <div className="row hair" style={{ padding: 14, borderRadius: 12, alignItems: 'center', gap: 10, justifyContent: 'center', background: 'var(--surface)' }}>
              <span className="spin" style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid var(--border-strong)', borderTopColor: 'var(--fg)', display: 'inline-block' }} />
              <span style={{ fontSize: 13, color: 'var(--subtle)' }}>Loading your matches…</span>
            </div>
          )}

          {/* Bottom trust line */}
          <div className="row gap-3" style={{ justifyContent: 'center', flexWrap: 'wrap', fontSize: 11, color: 'var(--muted)', paddingTop: 4 }}>
            <span className="row gap-2"><Icon.Dot size={4} color="#00A86B" /> 95% success rate</span>
            <span style={{ opacity: 0.4 }}>·</span>
            <span>Verified documents</span>
            <span style={{ opacity: 0.4 }}>·</span>
            <span>€200k+ minimum</span>
            <span style={{ opacity: 0.4 }}>·</span>
            <span>Phased ownership</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const Composer = memo(function Composer({
  onSend,
  disabled,
  answerCount,
  shouldFocus,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
  answerCount: number;
  shouldFocus: boolean;
}) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'; }
  }, [input]);

  useEffect(() => {
    if (shouldFocus) textareaRef.current?.focus();
  }, [shouldFocus]);

  function send() {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    setInput('');
    onSend(trimmed);
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className={`prompt-box ${input.trim() ? 'has-value' : ''}`} style={{ width: '100%', border: '0.5px solid var(--border-strong)', borderRadius: 14, background: 'var(--surface)' }}>
      <textarea
        ref={textareaRef}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Type your answer…"
        rows={1}
        className="prompt-input"
        style={{
          border: 'none', outline: 'none', background: 'transparent',
          padding: '14px 16px 0', fontSize: 15, lineHeight: 1.5, fontWeight: 300,
          resize: 'none', minHeight: 24, width: '100%', fontFamily: 'inherit',
          color: 'var(--fg)',
        }}
      />
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', padding: '8px 8px 8px 16px' }}>
        <span className="muted" style={{ fontSize: 11 }}>
          {answerCount > 0 ? `Answered ${answerCount} · ` : ''}↵ to send · stop anytime above
        </span>
        <button
          onClick={send}
          disabled={!input.trim()}
          aria-label="Send"
          style={{
            width: 32, height: 32, borderRadius: 8,
            background: input.trim() ? 'var(--blue)' : 'var(--surface-2)',
            color: input.trim() ? '#FFFFFF' : 'var(--muted)',
            display: 'grid', placeItems: 'center',
            cursor: input.trim() ? 'pointer' : 'not-allowed',
          }}
        >
          <Icon.Arrow size={13} />
        </button>
      </div>
    </div>
  );
});

function Message({ msg }: { msg: ChatMessage }) {
  if (msg.from === 'bot') {
    return (
      <div className="row gap-3" style={{ alignItems: 'flex-start' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface-2)', border: '0.5px solid var(--border)', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 2 }}>
          <Icon.Sparkle size={11} />
        </div>
        <div className="col gap-2" style={{ maxWidth: '88%' }}>
          <div style={{ fontSize: 15, lineHeight: 1.55, fontWeight: 300 }}>{msg.text}</div>
          {msg.searching && (
            <div className="row gap-2 muted" style={{ fontSize: 12, marginTop: 4 }}>
              <span className="spin" style={{ width: 11, height: 11, borderRadius: '50%', border: '1.5px solid var(--border-strong)', borderTopColor: 'var(--fg)', display: 'inline-block' }} />
              Matching against verified listings…
            </div>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="row" style={{ justifyContent: 'flex-end' }}>
      <div style={{
        maxWidth: '80%',
        background: 'var(--surface-2)',
        border: '0.5px solid var(--border)',
        padding: '10px 14px',
        borderRadius: 12,
        borderBottomRightRadius: 4,
        fontSize: 14,
        lineHeight: 1.5,
        fontWeight: 400,
      }}>
        {msg.text}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="row gap-3" style={{ alignItems: 'flex-start' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface-2)', border: '0.5px solid var(--border)', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 2 }}>
        <Icon.Sparkle size={11} />
      </div>
      <div className="row gap-1" style={{ padding: '14px 4px' }}>
        <span className="pulse" style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--subtle)', animationDelay: '0s' }} />
        <span className="pulse" style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--subtle)', animationDelay: '0.15s' }} />
        <span className="pulse" style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--subtle)', animationDelay: '0.3s' }} />
      </div>
    </div>
  );
}
export function HowItWorksPage() {
  const [side, setSide] = useState<'buyer' | 'seller'>('buyer');

  const buyerSteps = [
    { n: '01', t: 'Tell us what you\'re looking for', d: 'Run a 6-question AI match. Indicate budget, sector experience, location preference, and the level of operational involvement you want.', dur: '5 min' },
    { n: '02', t: 'Get a ranked shortlist', d: 'Our model returns 5–8 fit-scored matches drawn only from verified listings. Each match comes with a "why this fits" rationale.', dur: 'Instant' },
    { n: '03', t: 'Sign NDA, unlock data room', d: 'Digital NDA + €5K refundable escrow deposit unlocks financials, contracts, ops manuals, and direct seller messaging.', dur: 'Same-day' },
    { n: '04', t: 'Run diligence with a coordinator', d: 'A neutral SBS deal coordinator runs the timeline. Independent advisors (legal, financial) are vetted and bookable in-app.', dur: '4–8 weeks' },
    { n: '05', t: 'Phased close on escrow', d: 'Funds release as ownership phases trigger. KPI-gated earn-outs protect both sides.', dur: '6–18 months' },
  ];

  const sellerSteps = [
    { n: '01', t: 'Submit your financials', d: 'Upload last 3 years of financials and tax filings. We use them to verify revenue and EBITDA, and generate a structured listing.', dur: '~30 min' },
    { n: '02', t: 'Verification + AI listing copy', d: 'Our verification team confirms ownership, financials, and trade references. Our AI drafts your listing — you approve every word.', dur: '5–10 days' },
    { n: '03', t: 'Earn your listing score', d: 'Higher completeness, third-party reviews, and clean diligence files compound into your listing score. Premium listings see 4.2× more buyer interest.', dur: 'Ongoing' },
    { n: '04', t: 'Vet inbound buyers', d: 'Only buyers who have signed an NDA + funded escrow can message you. Every buyer profile is verified.', dur: 'Live' },
    { n: '05', t: 'Phased close with handover', d: 'You stay operational through Phase 2 with locked KPIs. Equity transfers as milestones clear; the platform holds funds in escrow.', dur: '6–18 months' },
  ];

  const steps = side === 'buyer' ? buyerSteps : sellerSteps;

  return (
    <div className="page-enter">
      <section style={{ padding: '96px 0 32px' }}>
        <div className="container col gap-4">
          <SectionEyebrow>How it works</SectionEyebrow>
          <h1 style={{ fontSize: 64, maxWidth: 760 }}>A protected path, from first inquiry to full ownership.</h1>
          <p style={{ fontSize: 17, color: 'var(--subtle)', maxWidth: 620, fontWeight: 300 }}>
            Choose your side. Each path is purpose-built for the role you're playing in the deal.
          </p>

          <div className="row gap-2 hair" style={{ padding: 4, borderRadius: 999, width: 'fit-content', marginTop: 24 }}>
            {[{ id: 'buyer', l: 'For buyers' }, { id: 'seller', l: 'For sellers' }].map(t => (
              <button key={t.id} onClick={() => setSide(t.id as 'buyer' | 'seller')}
                style={{
                  padding: '8px 18px', borderRadius: 999, fontSize: 13, fontWeight: 500,
                  background: side === t.id ? 'var(--fg)' : 'transparent',
                  color: side === t.id ? 'var(--bg)' : 'var(--fg)',
                  transition: 'all 0.15s ease',
                }}>{t.l}</button>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '32px 0 64px' }}>
        <div className="container">
          <div className="col">
            {steps.map((s, i) => (
              <div key={s.n} className="row mobile-col" style={{ alignItems: 'flex-start', gap: 48, padding: '40px 0', borderTop: i === 0 ? 'none' : '0.5px solid var(--border)' }}>
                <div className="row gap-4 mobile-full" style={{ minWidth: 280, alignItems: 'flex-start' }}>
                  <span className="tabular muted" style={{ fontSize: 13, fontWeight: 500, minWidth: 24 }}>{s.n}</span>
                  <h3 style={{ fontSize: 22 }}>{s.t}</h3>
                </div>
                <p style={{ flex: 1, fontSize: 15, color: 'var(--subtle)', fontWeight: 300, lineHeight: 1.6, maxWidth: 560 }}>{s.d}</p>
                <div className="muted tabular" style={{ fontSize: 12, minWidth: 100, textAlign: 'right' }}>{s.dur}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="hair-t section">
        <div className="container">
          <div className="col gap-3" style={{ marginBottom: 48, maxWidth: 720 }}>
            <SectionEyebrow>Fees</SectionEyebrow>
            <h2>Simple, percentage-based, no monthly cost.</h2>
          </div>
          <div className="row mobile-wrap" style={{ gap: 16, alignItems: 'stretch' }}>
            {[
              { p: 'Buyer', tag: '1.5%', sub: 'of transaction value', f: ['AI match access', 'NDA + data room', 'Deal coordinator', 'Escrow protection', 'Phased ownership contract'] },
              { p: 'Seller', tag: '4%', sub: 'on close only', f: ['Verified listing', 'AI-generated copy', 'Buyer screening', 'Deal coordinator', 'Handover playbook'], featured: true },
              { p: 'Premium seller', tag: '€2,400', sub: 'one-time, on top of 4%', f: ['Featured placement', 'Premium badge', 'Priority verification (48h)', 'Dedicated advisor', 'Listing score boost'] },
            ].map(t => (
              <div key={t.p} className="card col" style={{ flex: 1, padding: 32, background: t.featured ? 'var(--fg)' : 'var(--surface)', color: t.featured ? 'var(--bg)' : 'var(--fg)' }}>
                <div className="col gap-2" style={{ marginBottom: 32 }}>
                  <span style={{ fontSize: 12, opacity: 0.6 }}>{t.p}</span>
                  <div className="row" style={{ alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 40, fontWeight: 500, letterSpacing: -1.5 }}>{t.tag}</span>
                    <span style={{ fontSize: 13, opacity: 0.6 }}>{t.sub}</span>
                  </div>
                </div>
                <div className="col gap-3" style={{ flex: 1 }}>
                  {t.f.map(x => (
                    <div key={x} className="row gap-2" style={{ fontSize: 13 }}>
                      <Icon.Check size={12} color={t.featured ? '#FFFFFF' : '#00A86B'} />
                      <span style={{ opacity: 0.9 }}>{x}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export function AboutPage() {
  return (
    <div className="page-enter">
      <section style={{ padding: '96px 0 64px' }}>
        <div className="container col gap-6" style={{ maxWidth: 820 }}>
          <SectionEyebrow>About</SectionEyebrow>
          <h1 style={{ fontSize: 64, letterSpacing: -2 }}>We built the marketplace we wished existed when we sold our first company.</h1>
          <p style={{ fontSize: 18, color: 'var(--subtle)', fontWeight: 300, lineHeight: 1.55 }}>
            SafeBusinessSelling is a B2B marketplace for small and mid-cap private businesses. We verify every listing, escrow every payment, and structure every transaction around a phased ownership model — because the worst day in a private sale is rarely the day before close, it's the six months after.
          </p>
        </div>
      </section>

      <section className="hair-t hair-b" style={{ padding: '56px 0' }}>
        <div className="container row" style={{ gap: 32, flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <Stat value="2026" label="Founded" />
          <Stat value="0" label="Fraud incidents" />
          <Stat value="Free" label="To list your business" />
          <Stat value="NL" label="Based in Amsterdam" />
        </div>
      </section>

      <section className="section">
        <div className="container row mobile-wrap" style={{ alignItems: 'flex-start', gap: 80 }}>
          <div className="mobile-full" style={{ flex: '0 0 280px' }}>
            <SectionEyebrow>Mission</SectionEyebrow>
          </div>
          <div className="col gap-4" style={{ flex: 1, maxWidth: 720 }}>
            <h2>To make small-business succession as safe as any institutional transaction.</h2>
            <p style={{ fontSize: 15, color: 'var(--subtle)', fontWeight: 300, lineHeight: 1.7 }}>
              Selling a business is rarely a one-time, all-cash event. Yet most marketplaces treat it that way — a static listing, a handshake, an asset transfer. We treat it as a structured transition: verified facts, escrowed funds, phased equity, and a coordinator on call. The result is a market where ordinary operators can transact at the standard of care institutional buyers take for granted.
            </p>
          </div>
        </div>
      </section>

      <section className="hair-t section">
        <div className="container">
          <div className="col gap-3" style={{ marginBottom: 56 }}>
            <SectionEyebrow>Team</SectionEyebrow>
            <h2>Operators, auditors, and engineers.</h2>
          </div>
          <div className="mobile-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
            {TEAM.map(p => (
              <div key={p.name} className="col gap-4">
                <div className="img-ph" style={{ aspectRatio: '4/5', borderRadius: 8 }} />
                <div className="col gap-2">
                  <div style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.2 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{p.role}</div>
                  <p style={{ fontSize: 13, color: 'var(--subtle)', fontWeight: 300, lineHeight: 1.55, marginTop: 4 }}>{p.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="hair-t section-sm">
        <div className="container">
          <div className="col gap-3" style={{ marginBottom: 32, maxWidth: 620 }}>
            <SectionEyebrow>Safety stats</SectionEyebrow>
            <h2 style={{ fontSize: 32 }}>The numbers behind "safely."</h2>
          </div>
          <div className="mobile-grid-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, border: '0.5px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            {[
              { v: '7-step', l: 'Verification process', d: 'Identity, ownership, financials, tax filings, trade refs, sector compliance, beneficial owners.' },
              { v: '€10M', l: 'Escrow capacity', d: 'Funds held by a regulated trustee. Released only on milestone trigger.' },
              { v: '€2.5M', l: 'Indemnity insurance', d: 'Per-deal coverage against verified misrepresentation. Underwritten by Lloyd\'s.' },
              { v: '24h', l: 'Deal-coordinator SLA', d: 'A named coordinator responds within 24 hours, every weekday.' },
              { v: 'SOC 2', l: 'Type II certified', d: 'Annual audit by an independent security firm. Report on request.' },
              { v: 'AFM-reg', l: 'Dutch financial supervision', d: 'SBS B.V. operates under AFM-registered escrow rules.' },
            ].map((s, i) => (
              <div key={i} className="col gap-3" style={{ padding: 28, borderRight: ((i + 1) % 3 !== 0) ? '0.5px solid var(--border)' : 'none', borderTop: i >= 3 ? '0.5px solid var(--border)' : 'none' }}>
                <div style={{ fontSize: 32, fontWeight: 500, letterSpacing: -1 }}>{s.v}</div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{s.l}</div>
                <p style={{ fontSize: 12, color: 'var(--subtle)', fontWeight: 300, lineHeight: 1.5 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', topic: 'general', msg: '' });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="page-enter">
      <section style={{ padding: '96px 0 64px' }}>
        <div className="container row" style={{ alignItems: 'flex-start', gap: 80 }}>
          <div className="col gap-4" style={{ flex: '0 0 380px' }}>
            <SectionEyebrow>Contact</SectionEyebrow>
            <h1 style={{ fontSize: 56 }}>Talk to a coordinator.</h1>
            <p style={{ fontSize: 15, color: 'var(--subtle)', fontWeight: 300, lineHeight: 1.6 }}>
              For deal-specific questions, use your dashboard inbox. For everything else, this form routes to the right desk within one business day.
            </p>

            <div className="col gap-3" style={{ marginTop: 24, paddingTop: 24, borderTop: '0.5px solid var(--border)' }}>
              {[
                { k: 'Email', v: 'hello@safebusinessselling.com' },
                { k: 'Press', v: 'press@safebusinessselling.com' },
                { k: 'Office', v: 'Keizersgracht 124, 1015 CW Amsterdam' },
              ].map(c => (
                <div key={c.k} className="row" style={{ justifyContent: 'space-between', gap: 16 }}>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>{c.k}</span>
                  <span style={{ fontSize: 13 }}>{c.v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ flex: 1, padding: 40 }}>
            {!submitted ? (
              <form className="col gap-4" onSubmit={submit}>
                <Field label="Your name">
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name" required />
                </Field>
                <Field label="Email">
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" required />
                </Field>
                <Field label="Topic">
                  <select value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} style={{ appearance: 'none' }}>
                    <option value="general">General inquiry</option>
                    <option value="buyer">Buyer support</option>
                    <option value="seller">Seller support</option>
                    <option value="press">Press</option>
                    <option value="partner">Partnership</option>
                  </select>
                </Field>
                <Field label="Message">
                  <textarea rows={5} value={form.msg} onChange={e => setForm({ ...form, msg: e.target.value })} placeholder="What can we help with?" required style={{ resize: 'vertical', minHeight: 120 }} />
                </Field>
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>Reply within 1 business day.</span>
                  <Button variant="primary" type="submit" iconRight={<Icon.Arrow size={12} />}>Send message</Button>
                </div>
              </form>
            ) : (
              <div className="col gap-4" style={{ alignItems: 'center', textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', border: '0.5px solid var(--green)', display: 'grid', placeItems: 'center', color: 'var(--green)' }}>
                  <Icon.Check size={20} color="#00A86B" />
                </div>
                <h3>Message received</h3>
                <p className="muted" style={{ fontSize: 14, maxWidth: 320 }}>A coordinator will reply within one business day. We've sent a confirmation to {form.email || 'your email'}.</p>
                <Button variant="secondary" size="sm" onClick={() => { setSubmitted(false); setForm({ name: '', email: '', topic: 'general', msg: '' }); }}>Send another</Button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
