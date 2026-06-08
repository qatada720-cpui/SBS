'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button, Icon, VerifiedBadge, SectionEyebrow } from '@/components/ui';
import { createClient as _createClient } from '@/lib/supabase-browser';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createClient = () => _createClient() as any;

type Message = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

type Conversation = {
  id: string;
  listing_id: string;
  listing_name: string;
  buyer_id: string;
  seller_id: string;
  counterparty_name: string;
  counterparty_id: string;
  nda_signed: boolean;
  last_message: string;
  last_ts: string;
};

function formatTs(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

export function MessagingPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const active = convos.find((c) => c.id === activeId);

  // Load conversations on mount
  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);

      const { data: rawConvos } = await supabase
        .from('conversations')
        .select('*, listings(id, name)')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (!rawConvos || rawConvos.length === 0) { setLoading(false); return; }

      // Collect counterparty IDs
      const counterpartyIds = rawConvos.map((c: any) =>
        c.buyer_id === user.id ? c.seller_id : c.buyer_id
      );
      const uniqueIds = [...new Set(counterpartyIds)] as string[];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', uniqueIds);

      const profileMap: Record<string, string> = {};
      (profiles ?? []).forEach((p: any) => {
        profileMap[p.id] = p.full_name ?? 'Unknown';
      });

      // Load last message per conversation
      const convoIds = rawConvos.map((c: any) => c.id);
      const { data: lastMsgs } = await supabase
        .from('messages')
        .select('conversation_id, body, created_at')
        .in('conversation_id', convoIds)
        .order('created_at', { ascending: false });

      const lastMsgMap: Record<string, { body: string; created_at: string }> = {};
      (lastMsgs ?? []).forEach((m: any) => {
        if (!lastMsgMap[m.conversation_id]) lastMsgMap[m.conversation_id] = m;
      });

      const mapped: Conversation[] = rawConvos.map((c: any) => {
        const counterpartyId = c.buyer_id === user.id ? c.seller_id : c.buyer_id;
        const ndaSigned = c.buyer_id === user.id ? c.nda_signed_buyer : c.nda_signed_seller;
        const last = lastMsgMap[c.id];
        return {
          id: c.id,
          listing_id: c.listing_id,
          listing_name: c.listings?.name ?? 'Unknown listing',
          buyer_id: c.buyer_id,
          seller_id: c.seller_id,
          counterparty_id: counterpartyId,
          counterparty_name: profileMap[counterpartyId] ?? 'Unknown',
          nda_signed: !!ndaSigned,
          last_message: last?.body ?? 'No messages yet',
          last_ts: last?.created_at ? formatTs(last.created_at) : '',
        };
      });

      setConvos(mapped);
      if (mapped.length > 0) setActiveId(mapped[0].id);
      setLoading(false);
    }
    load();
  }, []);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeId) return;
    async function loadMsgs() {
      const supabase = createClient();
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', activeId)
        .order('created_at', { ascending: true });
      setMessages(data ?? []);
    }
    loadMsgs();
  }, [activeId]);

  // Scroll to bottom
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'; }
  }, [input]);

  async function sendMessage() {
    if (!input.trim() || !activeId || !userId) return;
    setSending(true);
    const body = input.trim();
    setInput('');
    const supabase = createClient();
    const { data: newMsg } = await supabase
      .from('messages')
      .insert({ conversation_id: activeId, sender_id: userId, body })
      .select()
      .single();
    if (newMsg) setMessages((prev) => [...prev, newMsg]);
    // Update convo last message
    setConvos((prev) => prev.map((c) =>
      c.id === activeId ? { ...c, last_message: body, last_ts: 'Just now' } : c
    ));
    setSending(false);
    textareaRef.current?.focus();
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  if (loading) return (
    <div className="page-enter" style={{ padding: '80px 0', textAlign: 'center' }}>
      <div className="container"><p className="muted">Loading conversations…</p></div>
    </div>
  );

  if (!userId) return (
    <div className="page-enter" style={{ padding: '80px 0', textAlign: 'center' }}>
      <div className="container col gap-4" style={{ alignItems: 'center' }}>
        <p style={{ fontSize: 18, fontWeight: 600 }}>Sign in to view messages</p>
        <Link href="/sign-in?next=/messages" className="btn btn-primary">Sign in</Link>
      </div>
    </div>
  );

  if (convos.length === 0) return (
    <div className="page-enter" style={{ padding: '80px 0', textAlign: 'center' }}>
      <div className="container col gap-4" style={{ alignItems: 'center' }}>
        <Icon.Message size={32} />
        <p style={{ fontSize: 18, fontWeight: 600 }}>No conversations yet</p>
        <p className="muted">Express interest in a listing to start a conversation with the seller.</p>
        <Link href="/marketplace" className="btn btn-primary">Browse listings</Link>
      </div>
    </div>
  );

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
          <div style={{ width: 300, flexShrink: 0, borderRight: '0.5px solid var(--hair)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 16px 8px', position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 1 }}>
              <div className="row" style={{ background: 'var(--surface)', borderRadius: 8, padding: '8px 12px', gap: 8, border: '0.5px solid var(--hair)' }}>
                <Icon.Search size={13} />
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>Search conversations…</span>
              </div>
            </div>

            {convos.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                style={{
                  all: 'unset', display: 'flex', flexDirection: 'column', gap: 4,
                  padding: '14px 16px', cursor: 'pointer',
                  borderBottom: '0.5px solid var(--hair)',
                  background: activeId === c.id ? 'var(--surface)' : 'transparent',
                  borderLeft: activeId === c.id ? '2px solid #0047FF' : '2px solid transparent',
                  transition: 'background 0.15s',
                }}
              >
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="col gap-1" style={{ flex: 1, minWidth: 0 }}>
                    <div className="row gap-2" style={{ alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>{c.counterparty_name}</span>
                      {!c.nda_signed && (
                        <span style={{ fontSize: 10, background: '#C8922A22', color: '#C8922A', padding: '1px 5px', borderRadius: 4, fontWeight: 500 }}>
                          NDA pending
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>{c.listing_name}</span>
                    <span style={{ fontSize: 12, color: 'var(--subtle)', fontWeight: 300, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: 200 }}>
                      {c.last_message}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--muted)', flexShrink: 0 }}>{c.last_ts}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Chat area */}
          {active && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ padding: '14px 20px', borderBottom: '0.5px solid var(--hair)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <div className="col gap-1">
                  <div className="row gap-2" style={{ alignItems: 'center' }}>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>{active.counterparty_name}</span>
                    <VerifiedBadge />
                  </div>
                  <div className="row gap-2">
                    <Link href={`/listing/${active.listing_id}`} style={{ fontSize: 12, color: '#0047FF' }}>
                      {active.listing_name}
                    </Link>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>·</span>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {active.buyer_id === userId ? 'You are buying' : 'You are selling'}
                    </span>
                  </div>
                </div>
                <div className="row gap-2">
                  {active.nda_signed
                    ? <span className="badge badge-verified" style={{ fontSize: 11 }}><Icon.Check size={10} /> NDA signed</span>
                    : <Button size="sm">Sign NDA</Button>
                  }
                  <Button size="sm" variant="secondary">Schedule call</Button>
                </div>
              </div>

              {/* Messages */}
              <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {!active.nda_signed && (
                  <div style={{ background: '#C8922A11', border: '0.5px solid #C8922A44', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#C8922A', marginBottom: 8 }}>
                    <strong>NDA required</strong> — Sign the NDA to unlock financials and detailed documents.
                  </div>
                )}

                {messages.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, padding: '40px 0' }}>
                    No messages yet. Start the conversation.
                  </div>
                )}

                {messages.map((msg) => {
                  const isMe = msg.sender_id === userId;
                  return (
                    <div key={msg.id} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap: 10, alignItems: 'flex-end' }}>
                      {!isMe && (
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#0047FF22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#0047FF', flexShrink: 0 }}>
                          {active.counterparty_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </div>
                      )}
                      <div style={{ maxWidth: '70%', display: 'flex', flexDirection: 'column', gap: 4, alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          background: isMe ? '#0047FF' : 'var(--surface)',
                          color: isMe ? '#fff' : 'var(--fg)',
                          borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          padding: '10px 14px', fontSize: 14, lineHeight: 1.5,
                          border: isMe ? 'none' : '0.5px solid var(--hair)',
                        }}>
                          {msg.body}
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>{formatTs(msg.created_at)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input */}
              <div style={{ padding: '12px 20px 16px', borderTop: '0.5px solid var(--hair)', flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', background: 'var(--surface)', border: '0.5px solid var(--hair)', borderRadius: 12, padding: '10px 12px' }}>
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="Write a message… (Enter to send)"
                    rows={1}
                    style={{ flex: 1, resize: 'none', border: 'none', background: 'transparent', outline: 'none', fontSize: 14, color: 'var(--fg)', fontFamily: 'var(--font-inter)', lineHeight: 1.5 }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || sending}
                    style={{
                      all: 'unset', width: 32, height: 32, borderRadius: '50%',
                      background: input.trim() && !sending ? '#0047FF' : 'var(--muted)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: input.trim() && !sending ? 'pointer' : 'default', flexShrink: 0,
                    }}
                  >
                    <Icon.Arrow size={14} />
                  </button>
                </div>
                <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, textAlign: 'center' }}>
                  Messages are monitored for safety. Never share bank details outside of the SafeBusinessSelling escrow system.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
