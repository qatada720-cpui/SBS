'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button, Icon, VerifiedBadge, SectionEyebrow } from '@/components/ui';

type Message = {
  id: string;
  from: 'me' | 'them';
  text: string;
  ts: string;
  read?: boolean;
};

type Conversation = {
  id: string;
  listingId: string;
  listingName: string;
  counterparty: string;
  role: 'buyer' | 'seller';
  lastMessage: string;
  lastTs: string;
  unread: number;
  ndaSigned: boolean;
  score: number;
  messages: Message[];
};

const MOCK_CONVOS: Conversation[] = [
  {
    id: 'c1',
    listingId: '1',
    listingName: 'Northwind Logistics',
    counterparty: 'Thomas van den Berg',
    role: 'buyer',
    lastMessage: 'Can you share the last 3 years of audited financials?',
    lastTs: '10:42',
    unread: 2,
    ndaSigned: true,
    score: 91,
    messages: [
      { id: 'm1', from: 'them', text: "Hi, I came across your Northwind Logistics listing. Very interesting profile — strong recurring revenue base.", ts: 'Yesterday 14:20' },
      { id: 'm2', from: 'me', text: "Thanks for reaching out! Happy to connect. Are you looking at a full acquisition or phased transition?", ts: 'Yesterday 14:35' },
      { id: 'm3', from: 'them', text: "We'd prefer a phased handover — 12 months ideally. Our team has logistics background.", ts: 'Yesterday 15:01' },
      { id: 'm4', from: 'me', text: "That works well for us. Phased ownership is exactly what we were hoping for.", ts: 'Yesterday 15:22' },
      { id: 'm5', from: 'them', text: "Can you share the last 3 years of audited financials?", ts: '10:42' },
    ],
  },
  {
    id: 'c2',
    listingId: '3',
    listingName: 'Meridian SaaS',
    counterparty: 'Sara El-Hassan',
    role: 'seller',
    lastMessage: "We reviewed your offer — let's schedule a call.",
    lastTs: 'Yesterday',
    unread: 0,
    ndaSigned: true,
    score: 87,
    messages: [
      { id: 'm1', from: 'me', text: "Hi Sara, I'm interested in Meridian SaaS. I've read the listing carefully — the ARR growth is impressive.", ts: 'Mon 09:10' },
      { id: 'm2', from: 'them', text: "Thanks! We've grown ARR from €600K to €1.9M over 3 years. Fully bootstrapped, no VC debt.", ts: 'Mon 11:33' },
      { id: 'm3', from: 'me', text: "Would you consider an offer at 4.5× ARR with a 6-month seller earnout?", ts: 'Mon 14:05' },
      { id: 'm4', from: 'them', text: "We reviewed your offer — let's schedule a call.", ts: 'Yesterday 16:48' },
    ],
  },
  {
    id: 'c3',
    listingId: '5',
    listingName: 'Halcyon Skincare',
    counterparty: 'Imani Okonkwo',
    role: 'buyer',
    lastMessage: 'NDA sent — please sign before we proceed.',
    lastTs: 'Mon',
    unread: 1,
    ndaSigned: false,
    score: 79,
    messages: [
      { id: 'm1', from: 'them', text: "Hello, I saw your interest in Halcyon Skincare. Before we share financials, we need an NDA in place.", ts: 'Mon 10:00' },
      { id: 'm2', from: 'them', text: "NDA sent — please sign before we proceed.", ts: 'Mon 10:02' },
    ],
  },
];

export function MessagingPage() {
  const [convos] = useState<Conversation[]>(MOCK_CONVOS);
  const [activeId, setActiveId] = useState<string>(MOCK_CONVOS[0].id);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Record<string, Message[]>>(() =>
    Object.fromEntries(MOCK_CONVOS.map((c) => [c.id, c.messages]))
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const active = convos.find((c) => c.id === activeId)!;
  const activeMessages = messages[activeId] ?? [];

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, activeId]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'; }
  }, [input]);

  function sendMessage() {
    if (!input.trim()) return;
    const newMsg: Message = {
      id: `m${Date.now()}`,
      from: 'me',
      text: input.trim(),
      ts: 'Just now',
    };
    setMessages((prev) => ({ ...prev, [activeId]: [...(prev[activeId] ?? []), newMsg] }));
    setInput('');
    textareaRef.current?.focus();
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  return (
    <div className="page-enter" style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ borderBottom: '0.5px solid var(--hair)', padding: '16px 0' }}>
        <div className="container row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="col gap-1">
            <SectionEyebrow>Secure messaging</SectionEyebrow>
            <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Messages</h1>
          </div>
          <div className="row gap-2">
            <span className="badge badge-verified" style={{ fontSize: 11 }}>
              <Icon.Shield size={10} /> End-to-end encrypted
            </span>
            <span className="badge" style={{ fontSize: 11 }}>
              <Icon.Lock size={10} /> NDA-gated
            </span>
          </div>
        </div>
      </div>

      <div className="container" style={{ flex: 1, overflow: 'hidden', padding: '0 var(--container-px)', display: 'flex', gap: 0 }}>
        <div style={{ display: 'flex', flex: 1, gap: 0, height: '100%', overflow: 'hidden' }}>

          {/* Sidebar */}
          <div style={{
            width: 300,
            flexShrink: 0,
            borderRight: '0.5px solid var(--hair)',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{ padding: '16px 16px 8px', position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 1 }}>
              <div className="row" style={{
                background: 'var(--surface)',
                borderRadius: 8,
                padding: '8px 12px',
                gap: 8,
                border: '0.5px solid var(--hair)',
              }}>
                <Icon.Search size={13} />
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>Search conversations…</span>
              </div>
            </div>

            {convos.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                style={{
                  all: 'unset',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  padding: '14px 16px',
                  cursor: 'pointer',
                  borderBottom: '0.5px solid var(--hair)',
                  background: activeId === c.id ? 'var(--surface)' : 'transparent',
                  borderLeft: activeId === c.id ? '2px solid #0047FF' : '2px solid transparent',
                  transition: 'background 0.15s',
                }}
              >
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="col gap-1" style={{ flex: 1, minWidth: 0 }}>
                    <div className="row gap-2" style={{ alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>{c.counterparty}</span>
                      {!c.ndaSigned && (
                        <span style={{ fontSize: 10, background: '#C8922A22', color: '#C8922A', padding: '1px 5px', borderRadius: 4, fontWeight: 500 }}>
                          NDA pending
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400 }}>{c.listingName}</span>
                    <span style={{
                      fontSize: 12,
                      color: 'var(--subtle)',
                      fontWeight: 300,
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      maxWidth: 200,
                    }}>
                      {c.lastMessage}
                    </span>
                  </div>
                  <div className="col" style={{ alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>{c.lastTs}</span>
                    {c.unread > 0 && (
                      <span style={{
                        background: '#0047FF',
                        color: '#fff',
                        fontSize: 10,
                        fontWeight: 600,
                        borderRadius: 999,
                        minWidth: 16,
                        height: 16,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 4px',
                      }}>
                        {c.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Chat area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Chat header */}
            <div style={{
              padding: '14px 20px',
              borderBottom: '0.5px solid var(--hair)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <div className="col gap-1">
                <div className="row gap-2" style={{ alignItems: 'center' }}>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{active.counterparty}</span>
                  <VerifiedBadge />
                </div>
                <div className="row gap-2">
                  <Link
                    href={`/listing/${active.listingId}`}
                    style={{ fontSize: 12, color: '#0047FF', fontWeight: 400 }}
                  >
                    {active.listingName}
                  </Link>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>·</span>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {active.role === 'buyer' ? 'Interested buyer' : 'Listing seller'}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>·</span>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>Match score {active.score}</span>
                </div>
              </div>
              <div className="row gap-2">
                {active.ndaSigned ? (
                  <span className="badge badge-verified" style={{ fontSize: 11 }}>
                    <Icon.Check size={10} /> NDA signed
                  </span>
                ) : (
                  <Button size="sm">Sign NDA</Button>
                )}
                <Button size="sm" variant="secondary">Schedule call</Button>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {!active.ndaSigned && (
                <div style={{
                  background: '#C8922A11',
                  border: '0.5px solid #C8922A44',
                  borderRadius: 10,
                  padding: '12px 16px',
                  fontSize: 13,
                  color: '#C8922A',
                  marginBottom: 8,
                }}>
                  <strong>NDA required</strong> — Sign the NDA to unlock financials and detailed documents for this listing.
                </div>
              )}

              {activeMessages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: msg.from === 'me' ? 'row-reverse' : 'row',
                    gap: 10,
                    alignItems: 'flex-end',
                  }}
                >
                  {msg.from === 'them' && (
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: '#0047FF22',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#0047FF',
                      flexShrink: 0,
                    }}>
                      {active.counterparty.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                  )}
                  <div style={{
                    maxWidth: '70%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    alignItems: msg.from === 'me' ? 'flex-end' : 'flex-start',
                  }}>
                    <div style={{
                      background: msg.from === 'me' ? '#0047FF' : 'var(--surface)',
                      color: msg.from === 'me' ? '#fff' : 'var(--fg)',
                      borderRadius: msg.from === 'me' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      padding: '10px 14px',
                      fontSize: 14,
                      lineHeight: 1.5,
                      border: msg.from === 'me' ? 'none' : '0.5px solid var(--hair)',
                    }}>
                      {msg.text}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>{msg.ts}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div style={{
              padding: '12px 20px 16px',
              borderTop: '0.5px solid var(--hair)',
              flexShrink: 0,
            }}>
              <div style={{
                display: 'flex',
                gap: 10,
                alignItems: 'flex-end',
                background: 'var(--surface)',
                border: '0.5px solid var(--hair)',
                borderRadius: 12,
                padding: '10px 12px',
              }}>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Write a message… (Enter to send)"
                  rows={1}
                  style={{
                    flex: 1,
                    resize: 'none',
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    fontSize: 14,
                    color: 'var(--fg)',
                    fontFamily: 'var(--font-inter)',
                    lineHeight: 1.5,
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  style={{
                    all: 'unset',
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: input.trim() ? '#0047FF' : 'var(--muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: input.trim() ? 'pointer' : 'default',
                    flexShrink: 0,
                    transition: 'background 0.15s',
                  }}
                >
                  <Icon.Arrow size={14} />
                </button>
              </div>
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, textAlign: 'center' }}>
                Messages are monitored for safety. Never share bank details outside of the SafeBusineSSSelling escrow system.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
