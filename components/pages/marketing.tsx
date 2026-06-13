'use client';
import { useState, useEffect, useRef, useTransition, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Icon, SectionEyebrow, Stat, Field } from '@/components/ui';
import { TEAM } from '@/lib/data';

const AHMED_OPENING = "I'm Ahmed — senior M&A advisor at SafeBusinessSelling. I'll build your buyer profile through a short conversation, then score every verified listing against it.\n\nTo match you well, I'll ask about your target sector, budget, location, how hands-on you want to be post-close, and a few other deal factors. Takes about 5 minutes.\n\nWhat type of business are you looking to acquire?";

const PROFILE_TOPICS = [
  { key: 'sector',      label: 'Sector' },
  { key: 'budget',      label: 'Budget' },
  { key: 'financials',  label: 'Revenue / EBITDA' },
  { key: 'location',    label: 'Location' },
  { key: 'involvement', label: 'Your role post-close' },
  { key: 'experience',  label: 'Experience' },
  { key: 'timeline',    label: 'Timeline' },
  { key: 'handover',    label: 'Seller handover' },
  { key: 'dealbreakers',label: 'Deal-breakers' },
];

type ChatMessage = {
  from: string;
  text: string;
  searching?: boolean;
};

type GroqMessage = { role: 'user' | 'assistant'; content: string };

const TOPIC_KEYWORDS: Record<string, string[]> = {
  sector:       ['sector', 'industry', 'saas', 'e-commerce', 'ecommerce', 'logistics', 'logistiek', 'healthcare', 'zorg', 'food', 'eten', 'horeca', 'automotive', 'services', 'diensten', 'manufacturing', 'productie', 'hospitality', 'software', 'webshop', 'winkel', 'bedrijf', 'type'],
  budget:       ['€', 'euro', 'million', 'miljoen', 'duizend', 'thousand', '000', 'budget', 'spend', 'uitgeven', 'betalen', 'kopen voor', 'max', 'ceiling', 'afford', '500k', '1m', '2m', '3m', '5m', 'k ', ' k', 'ton'],
  financials:   ['revenue', 'omzet', 'winst', 'profit', 'ebitda', 'margin', 'marge', 'turnover', 'winstgevend', 'verlies', 'groeiend', 'groei', 'verdient', 'financial', 'financieel'],
  location:     ['nederland', 'netherlands', 'nl', 'amsterdam', 'rotterdam', 'den haag', 'utrecht', 'eindhoven', 'belgium', 'belgie', 'duitsland', 'germany', 'europe', 'europa', 'remote', 'online', 'locatie', 'stad', 'land', 'city', 'country', 'regio', 'region'],
  involvement:  ['runnen', 'runne', 'run', 'zelf', 'myself', 'full-time', 'fulltime', 'parttime', 'part-time', 'team', 'management', 'passief', 'passive', 'hands-on', 'operationeel', 'leiden', 'manage', 'day-to-day', 'dagelijks', 'strategic', 'investor'],
  experience:   ['eerste', 'first', 'eerder', 'before', 'ervaring', 'experience', 'gekocht', 'bought', 'overnamen', 'vorig', 'previous', 'nooit', 'never', 'wel eens'],
  timeline:     ['maanden', 'months', 'jaar', 'year', 'snel', 'quickly', 'wanneer', 'when', 'timeline', 'tijdlijn', 'half jaar', 'zo snel', 'as soon', 'deadline', 'haast', 'urgent'],
  handover:     ['verkoper', 'seller', 'blijft', 'stays', 'overdracht', 'handover', 'overgang', 'transition', 'inwerkperiode', 'help', 'begeleiding', 'guidance', 'stay on', 'blijven'],
  dealbreakers: ['niet', 'no ', 'geen', 'avoid', 'vermijden', 'nooit', 'never', 'liever niet', 'wil ik niet', 'skip', 'sla over', 'verliesgevend', 'loss', 'gereguleerd', 'regulated'],
};

function detectCoveredTopics(messages: ChatMessage[]): Set<string> {
  const userText = messages.filter(m => m.from === 'user').map(m => m.text.toLowerCase()).join(' ');
  const covered = new Set<string>();

  // Keyword matching
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some(kw => userText.includes(kw))) covered.add(topic);
  }

  // Regex: detect any number that looks like a budget (e.g. "1.5", "500", "2,5 miljoen")
  if (/\d[\d.,]*\s*(miljoen|million|k\b|duizend|thousand|m\b)/i.test(userText) || /€\s*\d/i.test(userText)) {
    covered.add('budget');
  }

  return covered;
}

const AHMED_KEY = 'sbs_ahmed_v1';

export function HomePage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { from: 'bot', text: AHMED_OPENING },
  ]);
  const [groqHistory, setGroqHistory] = useState<GroqMessage[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [, startTransition] = useTransition();
  const [navigating, setNavigating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const userAnswerCount = messages.filter((m) => m.from === 'user').length;
  const coveredTopics = detectCoveredTopics(messages);
  const topicsCount = coveredTopics.size;

  // Restore conversation from localStorage after hydration
  useEffect(() => {
    try {
      const raw = localStorage.getItem(AHMED_KEY);
      if (raw) {
        const { messages: saved, groqHistory: savedHistory } = JSON.parse(raw);
        if (Array.isArray(saved) && saved.length > 1) {
          setMessages(saved.filter((m: ChatMessage) => !m.searching));
          setGroqHistory(savedHistory ?? []);
        }
      }
    } catch {}
    setHydrated(true);
  }, []);

  // Persist after each complete exchange (groqHistory updates once per exchange, not during typewriter)
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(AHMED_KEY, JSON.stringify({
        messages: messages.filter(m => !m.searching),
        groqHistory,
      }));
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groqHistory, hydrated]);

  function clearConversation() {
    try { localStorage.removeItem(AHMED_KEY); } catch {}
    setMessages([{ from: 'bot', text: AHMED_OPENING }]);
    setGroqHistory([]);
  }

  // Prevent body scroll on home page
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

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
    <div className="page-enter" style={{
      height: 'calc(100dvh - 64px)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(37,99,235,0.07) 0%, transparent 70%)',
    }}>
      <section style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 24px 0', minHeight: 0, overflow: 'hidden' }}>
        <div style={{ width: '100%', maxWidth: 620, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>

          {/* Header */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, paddingBottom: 28, flexShrink: 0 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 14px 6px 8px',
              borderRadius: 999,
              border: '0.5px solid var(--border)',
              background: 'var(--surface)',
              fontSize: 12, fontWeight: 500,
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
                display: 'grid', placeItems: 'center',
              }}>
                <Icon.Sparkle size={10} />
              </div>
              Ahmed AI
              <span style={{ width: 1, height: 12, background: 'var(--border)', margin: '0 2px' }} />
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00A86B', boxShadow: '0 0 8px #00A86B99' }} />
              <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400 }}>live</span>
            </div>

            {/* Topic progress pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
              {PROFILE_TOPICS.map(t => {
                const done = coveredTopics.has(t.key);
                return (
                  <span key={t.key} style={{
                    fontSize: 11, padding: '3px 10px', borderRadius: 999,
                    background: done ? 'rgba(0,168,107,0.12)' : 'var(--surface)',
                    border: `0.5px solid ${done ? 'rgba(0,168,107,0.35)' : 'var(--border)'}`,
                    color: done ? '#00A86B' : 'var(--muted)',
                    fontWeight: done ? 500 : 400,
                    transition: 'all 0.2s ease',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                    {done && <span style={{ fontSize: 9 }}>✓</span>}
                    {t.label}
                  </span>
                );
              })}
            </div>
            {userAnswerCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                  {topicsCount} of {PROFILE_TOPICS.length} profile topics covered
                </span>
                <button
                  onClick={clearConversation}
                  style={{ fontSize: 11, color: 'var(--muted)', cursor: 'pointer', textDecoration: 'underline', background: 'none', border: 'none', padding: 0 }}
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Chat scroll */}
          <div style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex', flexDirection: 'column' }}>
            <div ref={scrollRef} className="col gap-6 chat-scroll" style={{ flex: 1, minHeight: 0, paddingBottom: 48 }}>
              {messages.map((m, i) => <Message key={i} msg={m} />)}
              {thinking && <TypingIndicator />}
            </div>
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
              background: 'linear-gradient(to top, var(--bg) 30%, transparent)',
              pointerEvents: 'none',
            }} />
          </div>
        </div>
      </section>

      {/* Composer area */}
      <div style={{ padding: '0 24px 24px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 620, display: 'flex', flexDirection: 'column', gap: 10 }}>

          {!navigating && userAnswerCount >= 6 && (
            <button onClick={showMatchingBusinesses} style={{
              alignSelf: 'center',
              padding: '10px 22px',
              borderRadius: 999, border: '0.5px solid rgba(37,99,235,0.4)',
              background: 'rgba(37,99,235,0.12)',
              color: '#93c5fd', fontSize: 13, fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 8,
              cursor: 'pointer', letterSpacing: -0.1,
              backdropFilter: 'blur(8px)',
              transition: 'all 0.15s ease',
            }}>
              <Icon.Sparkle size={12} /> Show matching businesses <Icon.Arrow size={12} />
            </button>
          )}

          {!navigating ? (
            <Composer onSend={sendAnswer} disabled={thinking} answerCount={userAnswerCount} shouldFocus={!thinking} />
          ) : (
            <div style={{
              padding: '16px 20px', borderRadius: 16,
              border: '0.5px solid var(--border)', background: 'var(--surface)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}>
              <span className="spin" style={{ width: 13, height: 13, borderRadius: '50%', border: '1.5px solid var(--border-strong)', borderTopColor: '#2563eb', display: 'inline-block' }} />
              <span style={{ fontSize: 13, color: 'var(--subtle)' }}>Finding your matches…</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, fontSize: 11, color: 'var(--muted)', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#00A86B', display: 'inline-block' }} />
              No password needed
            </span>
            <span style={{ opacity: 0.25 }}>·</span>
            <span>Verified businesses</span>
            <span style={{ opacity: 0.25 }}>·</span>
            <span>Phased ownership</span>
            <span style={{ opacity: 0.25 }}>·</span>
            <span>Amsterdam</span>
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

  const active = !!input.trim();
  return (
    <div style={{
      width: '100%',
      border: `0.5px solid ${active ? 'rgba(37,99,235,0.5)' : 'var(--border)'}`,
      borderRadius: 18,
      background: 'var(--surface)',
      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      boxShadow: active ? '0 0 0 3px rgba(37,99,235,0.08)' : 'none',
    }}>
      <textarea
        ref={textareaRef}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Type your answer…"
        rows={1}
        style={{
          border: 'none', outline: 'none', background: 'transparent',
          padding: '15px 16px 0', fontSize: 15, lineHeight: 1.6, fontWeight: 300,
          resize: 'none', minHeight: 24, width: '100%', fontFamily: 'inherit',
          color: 'var(--fg)',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 8px 8px 16px' }}>
        <span style={{ fontSize: 11, color: 'var(--muted)' }}>
          {answerCount === 0 ? 'Start typing · ↵ to send' : answerCount < 6 ? `${answerCount} answered · keep going` : `${answerCount} answered · ready to match`}
        </span>
        <button
          onClick={send}
          disabled={!active}
          aria-label="Send"
          style={{
            width: 32, height: 32, borderRadius: 10, border: 'none',
            background: active ? '#2563eb' : 'var(--surface-2)',
            color: active ? '#fff' : 'var(--muted)',
            display: 'grid', placeItems: 'center',
            cursor: active ? 'pointer' : 'default',
            transition: 'background 0.15s ease, color 0.15s ease',
          }}
        >
          <Icon.Arrow size={12} />
        </button>
      </div>
    </div>
  );
});

function Message({ msg }: { msg: ChatMessage }) {
  if (msg.from === 'bot') {
    return (
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{
          width: 24, height: 24, borderRadius: '50%', flexShrink: 0, marginTop: 3,
          background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
          display: 'grid', placeItems: 'center',
        }}>
          <Icon.Sparkle size={10} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 16, lineHeight: 1.7, fontWeight: 300, margin: 0, color: 'var(--fg)', letterSpacing: -0.1 }}>
            {msg.text}
          </p>
          {msg.searching && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 10, fontSize: 12, color: 'var(--muted)' }}>
              <span className="spin" style={{ width: 10, height: 10, borderRadius: '50%', border: '1.5px solid var(--border-strong)', borderTopColor: '#2563eb', display: 'inline-block' }} />
              Scanning verified listings…
            </div>
          )}
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{
        maxWidth: '68%',
        background: 'var(--surface)',
        border: '0.5px solid var(--border)',
        padding: '10px 15px',
        borderRadius: 18,
        borderBottomRightRadius: 5,
        fontSize: 14,
        lineHeight: 1.55,
        color: 'var(--fg)',
      }}>
        {msg.text}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{
        width: 24, height: 24, borderRadius: '50%', flexShrink: 0, marginTop: 3,
        background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
        display: 'grid', placeItems: 'center',
      }}>
        <Icon.Sparkle size={10} />
      </div>
      <div style={{ display: 'flex', gap: 5, paddingTop: 8 }}>
        {[0, 0.18, 0.36].map((delay, i) => (
          <span key={i} className="pulse" style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--muted)', animationDelay: `${delay}s`, display: 'inline-block' }} />
        ))}
      </div>
    </div>
  );
}
export function HowItWorksPage() {
  const [side, setSide] = useState<'buyer' | 'seller'>('buyer');

  const buyerSteps = [
    { n: '01', t: 'Tell us what you\'re looking for', d: 'Chat with Ahmed AI. He covers 9 profile topics — sector, budget, revenue floor, location, your role post-close, experience, timeline, handover needs, and deal-breakers. The more you share, the sharper the matches.', dur: '~5 min' },
    { n: '02', t: 'Get a ranked shortlist', d: 'Our model returns 5–8 fit-scored matches drawn only from verified listings. Each match comes with a "why this fits" rationale.', dur: 'Instant' },
    { n: '03', t: 'Sign NDA, unlock data room', d: 'Digital NDA + €5K refundable escrow deposit unlocks financials, contracts, ops manuals, and direct seller messaging.', dur: 'Same-day' },
    { n: '04', t: 'Run diligence with a coordinator', d: 'A neutral SBS deal coordinator runs the timeline. Independent advisors (legal, financial) are vetted and bookable in-app.', dur: '4–8 weeks' },
    { n: '05', t: 'Phased close on escrow', d: 'Funds release as ownership phases trigger. KPI-gated earn-outs protect both sides.', dur: '6–18 months' },
  ];

  const sellerSteps = [
    { n: '01', t: 'Submit your financials', d: 'Upload last 3 years of financials and tax filings. We use them to verify revenue and EBITDA, and generate a structured listing.', dur: '~30 min' },
    { n: '02', t: 'Verification + AI listing copy', d: 'Our verification team confirms ownership, financials, and trade references. Our AI drafts your listing — you approve every word.', dur: '5–10 days' },
    { n: '03', t: 'Earn your listing score', d: 'Higher completeness, third-party reviews, and clean diligence files compound into your listing score. A complete listing gets more serious buyer attention.', dur: 'Ongoing' },
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
            One account, two directions. See how it works whether you're acquiring or listing.
          </p>

          <div className="row gap-2 hair" style={{ padding: 4, borderRadius: 999, width: 'fit-content', marginTop: 24 }}>
            {[{ id: 'buyer', l: 'Acquiring a business' }, { id: 'seller', l: 'Listing a business' }].map(t => (
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
              { p: 'When buying', tag: '3%', sub: 'of transaction value, paid at close', f: ['AI match access', 'NDA + data room', 'Deal coordinator', 'Escrow protection', 'Phased ownership contract'] },
              { p: 'When selling', tag: '3%', sub: 'of transaction value, paid at close', f: ['Verified listing', 'AI-generated copy', 'Buyer screening', 'Deal coordinator', 'Handover playbook'], featured: true },
            ].map(t => (
              <div key={t.p} className="card col" style={{
                flex: 1, padding: 32,
                background: t.featured ? 'var(--surface)' : 'var(--surface)',
                border: t.featured ? '1px solid rgba(37,99,235,0.5)' : '0.5px solid var(--border)',
                boxShadow: t.featured ? '0 0 0 1px rgba(37,99,235,0.15), 0 8px 32px rgba(37,99,235,0.08)' : 'none',
              }}>
                <div className="col gap-2" style={{ marginBottom: 32 }}>
                  <div className="row gap-2" style={{ alignItems: 'center' }}>
                    <span style={{ fontSize: 12, opacity: 0.6 }}>{t.p}</span>
                  </div>
                  <div className="row" style={{ alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 40, fontWeight: 500, letterSpacing: -1.5 }}>{t.tag}</span>
                    <span style={{ fontSize: 13, opacity: 0.6 }}>{t.sub}</span>
                  </div>
                </div>
                <div className="col gap-3" style={{ flex: 1 }}>
                  {t.f.map(x => (
                    <div key={x} className="row gap-2" style={{ fontSize: 13 }}>
                      <Icon.Check size={12} color="#00A86B" />
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

export function PricingPage() {
  return (
    <div className="page-enter">
      <section style={{ padding: '96px 0 64px' }}>
        <div className="container col gap-4" style={{ maxWidth: 720 }}>
          <SectionEyebrow>Pricing</SectionEyebrow>
          <h1 style={{ fontSize: 56, letterSpacing: -1.8 }}>Simple fees. No monthly cost.</h1>
          <p style={{ fontSize: 17, color: 'var(--subtle)', fontWeight: 300, lineHeight: 1.6 }}>
            You pay nothing upfront. A single success fee is charged at close — only when a deal is completed.
          </p>
        </div>
      </section>

      <section className="hair-t section">
        <div className="container">
          <div className="row mobile-wrap" style={{ gap: 16, alignItems: 'stretch', maxWidth: 880, margin: '0 auto' }}>
            {[
              {
                p: 'When buying',
                tag: '3%',
                sub: 'of transaction value, paid at close',
                f: ['AI buyer matching', 'NDA + data room access', 'Deal coordinator', 'Escrow protection', 'Phased ownership contract'],
              },
              {
                p: 'When selling',
                tag: '3%',
                sub: 'of transaction value, paid at close',
                f: ['Verified listing', 'AI-generated listing copy', 'Buyer screening', 'Deal coordinator', 'Handover playbook'],
                featured: true,
              },
            ].map(t => (
              <div key={t.p} className="card col" style={{
                flex: 1, padding: 36,
                border: t.featured ? '1px solid rgba(37,99,235,0.5)' : '0.5px solid var(--border)',
                boxShadow: t.featured ? '0 0 0 1px rgba(37,99,235,0.15), 0 8px 32px rgba(37,99,235,0.08)' : 'none',
              }}>
                <div className="col gap-2" style={{ marginBottom: 32 }}>
                  <span style={{ fontSize: 12, opacity: 0.6 }}>{t.p}</span>
                  <div className="row" style={{ alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 48, fontWeight: 500, letterSpacing: -2 }}>{t.tag}</span>
                    <span style={{ fontSize: 13, opacity: 0.6 }}>{t.sub}</span>
                  </div>
                </div>
                <div className="col gap-3" style={{ flex: 1 }}>
                  {t.f.map(x => (
                    <div key={x} className="row gap-2" style={{ fontSize: 14 }}>
                      <Icon.Check size={12} color="#00A86B" />
                      <span style={{ opacity: 0.9 }}>{x}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container col gap-6" style={{ maxWidth: 720 }}>
          <h2 style={{ fontSize: 32, letterSpacing: -0.8 }}>How the fee works</h2>
          {[
            { n: '01', t: 'Deal is agreed', d: 'Buyer and seller agree on price and terms. The phased ownership contract is signed.' },
            { n: '02', t: 'Funds go into escrow', d: 'The buyer transfers the amount to a licensed escrow account. No money moves until conditions are met.' },
            { n: '03', t: 'Conditions are met', d: 'Each ownership phase completes. When the final phase closes, funds are released to the seller.' },
            { n: '04', t: 'Fee is charged at close', d: 'SafeBusinessSelling deducts 3% from the buyer\'s payment and 3% from the seller\'s proceeds. Nothing before.' },
          ].map(s => (
            <div key={s.n} className="row gap-5 hair" style={{ padding: 24, borderRadius: 12, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: 1, color: 'var(--muted)', minWidth: 24, paddingTop: 2 }}>{s.n}</span>
              <div className="col gap-1">
                <span style={{ fontSize: 15, fontWeight: 500 }}>{s.t}</span>
                <span style={{ fontSize: 14, color: 'var(--subtle)', fontWeight: 300, lineHeight: 1.6 }}>{s.d}</span>
              </div>
            </div>
          ))}
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
        <div className="container row mobile-wrap" style={{ alignItems: 'flex-start', gap: 80 }}>
          <div className="mobile-full" style={{ flex: '0 0 280px' }}>
            <SectionEyebrow>Team</SectionEyebrow>
          </div>
          <div className="col gap-6" style={{ flex: 1, maxWidth: 720 }}>
            {[
              { role: 'CEO', name: 'Qatada Al Shihabi' },
              { role: 'CTO', name: 'Soufyan Lazreq' },
              { role: 'Legal & Finance', name: 'Shehab Youssef' },
            ].map(m => (
              <div key={m.name} className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '0.5px solid var(--border)', paddingBottom: 20 }}>
                <span style={{ fontSize: 15, fontWeight: 400 }}>{m.name}</span>
                <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 400 }}>{m.role}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}

export function PrivacyPage() {
  return (
    <div className="page-enter">
      <section style={{ padding: '96px 0 64px' }}>
        <div className="container col gap-4" style={{ maxWidth: 720 }}>
          <SectionEyebrow>Legal</SectionEyebrow>
          <h1 style={{ fontSize: 48, letterSpacing: -1.5 }}>Privacybeleid</h1>
          <p style={{ fontSize: 14, color: 'var(--muted)' }}>Versie 1.0 — Ingangsdatum: 13 juni 2026</p>
        </div>
      </section>

      <section style={{ paddingBottom: 96 }}>
        <div className="container col gap-8" style={{ maxWidth: 720 }}>
          {[
            {
              title: '1. Verwerkingsverantwoordelijke',
              body: 'SafeBusinessSelling B.V. (KvK-nummer: [in te vullen], BTW: [in te vullen]), gevestigd aan Keizersgracht 124, 1015 CW Amsterdam, Nederland, is verantwoordelijk voor de verwerking van uw persoonsgegevens. Vragen? Mail naar privacy@safebusinessselling.com.',
            },
            {
              title: '2. Welke gegevens verzamelen wij?',
              body: 'Wij verwerken de volgende categorieën persoonsgegevens: (a) Accountgegevens — naam, e-mailadres, wachtwoord (gehasht); (b) Identiteitsverificatie — kopie identiteitsbewijs, uittreksel KvK, bankgegevens voor escrow; (c) Bedrijfs- en financiële gegevens — jaarrekeningen, omzetcijfers, EBITDA, die verkopers uploaden in het kader van listingverificatie; (d) Communicatie — berichten uitgewisseld via het platformberichtencentrum; (e) Gebruiksgegevens — IP-adres, browsertype, bezochte pagina\'s en tijdstempels, vastgelegd via cookies en serverlogboeken.',
            },
            {
              title: '3. Doeleinden en rechtsgronden (AVG art. 6)',
              body: 'Wij verwerken uw gegevens op basis van: (a) Uitvoering van een overeenkomst (art. 6 lid 1 sub b) — accountbeheer, verificatieproces, deal-coördinatie en escrowbeheer; (b) Gerechtvaardigd belang (art. 6 lid 1 sub f) — fraudepreventie, platformbeveiliging en verbetering van onze diensten; (c) Wettelijke verplichting (art. 6 lid 1 sub c) — voldoen aan anti-witwasregelgeving (Wwft) en fiscale verplichtingen; (d) Toestemming (art. 6 lid 1 sub a) — marketing-e-mails, waarvoor u zich te allen tijde kunt afmelden.',
            },
            {
              title: '4. Bewaartermijnen',
              body: 'Accountgegevens worden bewaard zolang uw account actief is, plus 2 jaar na verwijdering. Financiële documenten en dealgegevens bewaren wij 7 jaar op grond van fiscale verplichtingen (art. 52 AWR). Berichten worden 2 jaar na afsluiting van een deal bewaard. Logboeken en cookies worden maximaal 13 maanden bewaard.',
            },
            {
              title: '5. Ontvangers van uw gegevens',
              body: 'Wij delen uw gegevens uitsluitend met: (a) Geverifieerde tegenpartijen — een koper ontvangt uw bedrijfsgegevens uitsluitend nadat een NDA is getekend en escrow-deposito is gestort; (b) Verwerkers — hostingpartners (Supabase/AWS, EU-regio), escrow-dienstverlener, en geaccrediteerde adviseurs die u zelf boekt; (c) Toezichthouders — de AFM, Belastingdienst of justitiële autoriteiten indien wettelijk verplicht. Wij verkopen uw gegevens nooit aan derden.',
            },
            {
              title: '6. Internationale doorgifte',
              body: 'Uw gegevens worden verwerkt binnen de Europese Economische Ruimte (EER). Indien een verwerker buiten de EER is gevestigd, zullen wij passende waarborgen treffen (standaard contractbepalingen van de Europese Commissie).',
            },
            {
              title: '7. Uw rechten',
              body: 'Op grond van de AVG heeft u de volgende rechten: inzage (art. 15), rectificatie (art. 16), wissing (art. 17), beperking van de verwerking (art. 18), gegevensoverdraagbaarheid (art. 20) en bezwaar (art. 21). Dien uw verzoek in via privacy@safebusinessselling.com. Wij reageren binnen 30 dagen. U heeft tevens het recht een klacht in te dienen bij de Autoriteit Persoonsgegevens (autoriteitpersoonsgegevens.nl).',
            },
            {
              title: '8. Cookies',
              body: 'Wij gebruiken functionele cookies (noodzakelijk voor sessie- en authenticatiebeheer) en analytische cookies (anoniem, voor het meten van paginabezoeken). Wij gebruiken geen trackingcookies van derden voor advertentiedoeleinden. U kunt cookievoorkeuren aanpassen via uw browserinstellingen.',
            },
            {
              title: '9. Beveiliging',
              body: 'Wij treffen passende technische en organisatorische maatregelen: versleuteld datatransport (TLS 1.3), versleutelde opslag voor gevoelige documenten, row-level security op databaseniveau, en periodieke penetratietests. Bij een datalek dat een risico vormt voor uw rechten, informeren wij u en de AP binnen 72 uur.',
            },
            {
              title: '10. Wijzigingen',
              body: 'Wij kunnen dit beleid aanpassen. Materiële wijzigingen worden minimaal 30 dagen van tevoren per e-mail aangekondigd. De meest actuele versie is altijd beschikbaar op safebusinessselling.com/privacy.',
            },
            {
              title: '11. Contact',
              body: 'Voor privacyvragen of het uitoefenen van uw rechten: privacy@safebusinessselling.com of schriftelijk aan SafeBusinessSelling B.V., t.a.v. Privacy Officer, Keizersgracht 124, 1015 CW Amsterdam.',
            },
          ].map(s => (
            <div key={s.title} className="col gap-3" style={{ paddingBottom: 32, borderBottom: '0.5px solid var(--border)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 500 }}>{s.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--subtle)', lineHeight: 1.75, fontWeight: 300 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function TermsPage() {
  return (
    <div className="page-enter">
      <section style={{ padding: '96px 0 64px' }}>
        <div className="container col gap-4" style={{ maxWidth: 720 }}>
          <SectionEyebrow>Legal</SectionEyebrow>
          <h1 style={{ fontSize: 48, letterSpacing: -1.5 }}>Algemene Voorwaarden</h1>
          <p style={{ fontSize: 14, color: 'var(--muted)' }}>Versie 1.0 — Ingangsdatum: 13 juni 2026</p>
        </div>
      </section>

      <section style={{ paddingBottom: 96 }}>
        <div className="container col gap-8" style={{ maxWidth: 720 }}>
          {[
            {
              title: '1. Definities',
              body: '"Platform" betekent de online marktplaats van SafeBusinessSelling B.V. (hierna: SBS), toegankelijk via safebusinessselling.com. "Verkoper" is een onderneming of natuurlijke persoon die een bedrijf te koop aanbiedt via het Platform. "Koper" is een natuurlijke persoon of rechtspersoon die via het Platform een bedrijf wil verwerven. "Deal" is het geheel van afspraken omtrent de overdracht van een bedrijf, begeleid door SBS.',
            },
            {
              title: '2. Toepasselijkheid',
              body: 'Deze Algemene Voorwaarden zijn van toepassing op elk gebruik van het Platform en op alle overeenkomsten tussen SBS en Gebruikers. Door een account aan te maken accepteert u deze voorwaarden. SBS behoudt het recht deze voorwaarden te wijzigen; gewijzigde voorwaarden gelden 30 dagen na aankondiging per e-mail.',
            },
            {
              title: '3. Account en toegang',
              body: 'U bent minimaal 18 jaar en handelingsbevoegd om een account aan te maken. U bent verantwoordelijk voor de vertrouwelijkheid van uw inloggegevens. Elk account is strikt persoonlijk en niet overdraagbaar. SBS mag accounts opschorten of beëindigen bij vermoed misbruik, fraude of schending van deze voorwaarden.',
            },
            {
              title: '4. Verplichtingen van de Verkoper',
              body: 'Verkopers garanderen dat alle aangeleverde informatie (financiën, eigendomsstructuur, contracten) juist en volledig is. Het is verboden een bedrijf te listen waarvan u niet de rechtmatige eigenaar of gemachtigde vertegenwoordiger bent. SBS verifieert listings maar is niet aansprakelijk voor onjuistheden die een Verkoper opzettelijk of onopzettelijk verstrekt. Verkopers mogen buiten het Platform om geen deal sluiten met een Koper die via het Platform is geïntroduceerd, gedurende een periode van 24 maanden na eerste contact.',
            },
            {
              title: '5. Verplichtingen van de Koper',
              body: 'Kopers erkennen dat alle informatie die zij ontvangen na ondertekening van de NDA strikt vertrouwelijk is. Het doorsturen of anderszins openbaar maken van vertrouwelijke bedrijfsinformatie is verboden en kan leiden tot aansprakelijkheid. Kopers dienen hun escrow-deposito tijdig te storten conform de deal-voorwaarden.',
            },
            {
              title: '6. Vergoedingen',
              body: 'SBS rekent een succesfee van 3% van de transactiewaarde, verschuldigd bij closing. De fee wordt automatisch verrekend via de escrow. Er zijn geen maandelijkse kosten of listingkosten. Bij annulering vóór closing zijn geen fees verschuldigd, tenzij annulering verwijtbaar is aan de betreffende partij conform de deal-overeenkomst.',
            },
            {
              title: '7. Escrow en betalingen',
              body: 'Alle transactiegelden worden beheerd via een door SBS gecontracteerde, gecertificeerde escrow-dienstverlener. SBS geeft nooit directe instructies om buiten escrow te betalen. Fondsen worden vrijgegeven per eigendomsfase op basis van vooraf overeengekomen KPI\'s en mijlpalen. SBS is niet aansprakelijk voor vertragingen door de escrow-dienstverlener buiten de macht van SBS.',
            },
            {
              title: '8. Aansprakelijkheid',
              body: 'SBS is een facilitator en geen partij bij de koopovereenkomst tussen Koper en Verkoper. SBS is niet aansprakelijk voor directe of indirecte schade voortvloeiend uit beslissingen op basis van listings of adviezen op het Platform, behoudens opzet of grove nalatigheid van SBS. De aansprakelijkheid van SBS is in alle gevallen beperkt tot het bedrag dat SBS heeft ontvangen aan fees in verband met de betreffende transactie.',
            },
            {
              title: '9. Intellectueel eigendom',
              body: 'Alle intellectuele eigendomsrechten op het Platform (software, ontwerp, merkbeelden) berusten bij SBS. Gebruikers behouden hun eigen rechten op de documenten die zij uploaden. Door documenten te uploaden verleent u SBS een beperkte, niet-exclusieve licentie om die documenten te verwerken ten behoeve van verificatie en dealcoördinatie.',
            },
            {
              title: '10. Verboden gebruik',
              body: 'Het is verboden het Platform te gebruiken voor het verspreiden van malware, het uitvoeren van scrapers of geautomatiseerde queries zonder toestemming van SBS, het omzeilen van beveiligingsmaatregelen, het plaatsen van fictieve listings, of het lastigvallen van andere Gebruikers.',
            },
            {
              title: '11. Toepasselijk recht en geschillen',
              body: 'Op deze voorwaarden is uitsluitend Nederlands recht van toepassing. Geschillen worden voorgelegd aan de bevoegde rechter te Amsterdam, tenzij partijen besluiten gebruik te maken van mediation via het Nederlands Mediation Instituut.',
            },
            {
              title: '12. Contact',
              body: 'Voor vragen over deze voorwaarden: hello@safebusinessselling.com of SafeBusinessSelling B.V., Keizersgracht 124, 1015 CW Amsterdam, Nederland.',
            },
          ].map(s => (
            <div key={s.title} className="col gap-3" style={{ paddingBottom: 32, borderBottom: '0.5px solid var(--border)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 500 }}>{s.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--subtle)', lineHeight: 1.75, fontWeight: 300 }}>{s.body}</p>
            </div>
          ))}
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
