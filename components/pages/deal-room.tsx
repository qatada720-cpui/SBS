'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Button, Icon, SectionEyebrow } from '@/components/ui';
import { createClient as _createClient } from '@/lib/supabase-browser';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createClient = () => _createClient() as any;

const KT_THRESHOLD = 100000;

const KT_SECTIONS: { key: string; label: string; hint: string }[] = [
  { key: 'operations', label: 'Daily operations & key processes', hint: 'What happens every day/week that only the owner knows? Routines, checklists, opening/closing, order flow.' },
  { key: 'customers', label: 'Key customers & contracts', hint: 'Top customers, contract terms, renewal dates, who the contact persons are.' },
  { key: 'suppliers', label: 'Suppliers & partners', hint: 'Critical suppliers, pricing agreements, payment terms, backup options.' },
  { key: 'systems', label: 'Systems, tools & access', hint: 'Software, accounts, domains, passwords location, licenses, who administers what.' },
  { key: 'team', label: 'Team & roles', hint: 'Who does what, key employees, informal roles, contracts, retention risks.' },
  { key: 'finances', label: 'Financial administration & obligations', hint: 'Bookkeeping setup, recurring obligations, loans, subscriptions, tax calendar.' },
  { key: 'risks', label: 'Risks & known issues', hint: 'Open disputes, dependencies, seasonality, anything the buyer must not discover too late.' },
  { key: 'personal', label: 'Personal relationships & network', hint: 'Relationships that keep the business alive: key customer contacts, supplier friendships, community ties. Plan in-person introductions.' },
];

type Phase = {
  id?: string;
  position: number;
  title: string;
  description: string;
  ownership_percentage: number;
  status: 'pending' | 'active' | 'completed';
};

type Agreement = {
  id: string;
  status: 'draft' | 'active' | 'completed' | 'dissolved';
  dissolution_clause: string;
  dissolution_notice_days: number;
  dissolution_reason: string | null;
  dissolved_at: string | null;
  buyer_signed_at: string | null;
  seller_signed_at: string | null;
};

type KnowledgeTransfer = {
  id: string;
  form: Record<string, string>;
  status: 'draft' | 'submitted' | 'approved';
};

type ChatMsg = { role: 'user' | 'assistant'; content: string };

const DEFAULT_PHASES: Omit<Phase, 'id'>[] = [
  { position: 1, title: 'LOI & Discovery', description: 'NDA signed, books open, escrow funded.', ownership_percentage: 0, status: 'pending' },
  { position: 2, title: 'Operating handover', description: '6-month seller-led transition, KPIs locked.', ownership_percentage: 51, status: 'pending' },
  { position: 3, title: 'Full ownership', description: 'Final earn-out cleared, equity transferred.', ownership_percentage: 100, status: 'pending' },
];

export function DealRoomPage({ conversationId }: { conversationId: string }) {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [conv, setConv] = useState<any>(null);
  const [counterpartyName, setCounterpartyName] = useState('');

  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [phasesDirty, setPhasesDirty] = useState(false);
  const [savingPhases, setSavingPhases] = useState(false);
  const [phaseError, setPhaseError] = useState('');
  const [clauseDraft, setClauseDraft] = useState('');
  const [noticeDays, setNoticeDays] = useState(30);
  const [showDissolve, setShowDissolve] = useState(false);
  const [dissolveReason, setDissolveReason] = useState('');

  const [kt, setKt] = useState<KnowledgeTransfer | null>(null);
  const [ktForm, setKtForm] = useState<Record<string, string>>({});
  const [ktSaving, setKtSaving] = useState(false);
  const [ktSavedAt, setKtSavedAt] = useState<string | null>(null);

  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const isSeller = !!conv && conv.seller_id === userId;
  const isBuyer = !!conv && conv.buyer_id === userId;
  const askingPrice = conv?.listings?.asking_price ?? 0;
  const ktRequired = askingPrice > KT_THRESHOLD;
  const bothSigned = !!agreement?.buyer_signed_at && !!agreement?.seller_signed_at;
  const editable = agreement?.status === 'draft' && !bothSigned;

  // ── Load everything ──────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);

      const { data: c } = await supabase
        .from('conversations')
        .select('*, listings(id, name, asking_price, seller_id)')
        .eq('id', conversationId)
        .single();
      if (!c) { setNotFound(true); setLoading(false); return; }
      setConv(c);

      const counterpartyId = c.buyer_id === user.id ? c.seller_id : c.buyer_id;
      const { data: profile } = await supabase
        .from('profiles').select('full_name').eq('id', counterpartyId).single();
      setCounterpartyName(profile?.full_name ?? 'Counterparty');

      // Agreement: load or create with default phases
      let { data: agr } = await supabase
        .from('deal_agreements').select('*').eq('conversation_id', conversationId).maybeSingle();
      if (!agr) {
        const { data: created } = await supabase
          .from('deal_agreements')
          .insert({ conversation_id: conversationId })
          .select().single();
        if (created) {
          agr = created;
          await supabase.from('deal_agreement_phases').insert(
            DEFAULT_PHASES.map((p) => ({ ...p, agreement_id: agr!.id }))
          );
        } else {
          // Race condition: another session inserted first — re-fetch
          const { data: refetched } = await supabase
            .from('deal_agreements').select('*').eq('conversation_id', conversationId).maybeSingle();
          agr = refetched;
        }
      }
      if (agr) {
        setAgreement(agr);
        setClauseDraft(agr.dissolution_clause);
        setNoticeDays(agr.dissolution_notice_days);
        const { data: ph } = await supabase
          .from('deal_agreement_phases')
          .select('*').eq('agreement_id', agr.id).order('position');
        setPhases((ph ?? []).map((p: Phase) => ({ ...p, description: p.description ?? '' })));
      }

      // Knowledge transfer: only for deals > €100K
      if ((c.listings?.asking_price ?? 0) > KT_THRESHOLD) {
        let { data: ktRow } = await supabase
          .from('knowledge_transfers').select('*').eq('conversation_id', conversationId).maybeSingle();
        if (!ktRow) {
          const { data: createdKt } = await supabase
            .from('knowledge_transfers')
            .insert({
              conversation_id: conversationId,
              listing_id: c.listing_id,
              seller_id: c.seller_id,
              buyer_id: c.buyer_id,
              form: {},
            })
            .select().single();
          if (createdKt) {
            ktRow = createdKt;
          } else {
            // Race condition: other session inserted first — re-fetch
            const { data: refetched } = await supabase
              .from('knowledge_transfers').select('*').eq('conversation_id', conversationId).maybeSingle();
            ktRow = refetched;
          }
        }
        if (ktRow) {
          setKt(ktRow);
          setKtForm((ktRow.form as Record<string, string>) ?? {});
        }
      }

      setLoading(false);
    }
    load();
  }, [conversationId]);

  // ── Axon greeting ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loading && conv && ktRequired && chat.length === 0) {
      setChat([{
        role: 'assistant',
        content: isSeller
          ? `I'm Axon, your AI-COO for this handover. This deal is above €100K, so a complete knowledge transfer is required before final ownership transfer. I'll help you fill in each section of the form — ask me anything, or tell me which part of the business is hardest to explain.`
          : `I'm Axon, your AI-COO for this handover. This deal is above €100K, so the seller must complete a knowledge transfer form before final ownership transfer. I can tell you what to check in each section and which questions to ask the seller.`,
      }]);
    }
  }, [loading, conv, ktRequired, isSeller, chat.length]);

  useEffect(() => {
    const el = chatScrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [chat]);

  // ── Phased ownership handlers ────────────────────────────────────────────
  function updatePhase(i: number, patch: Partial<Phase>) {
    setPhases((prev) => prev.map((p, j) => (j === i ? { ...p, ...patch } : p)));
    setPhasesDirty(true);
    setPhaseError('');
  }

  function addPhase() {
    setPhases((prev) => [
      ...prev,
      { position: prev.length + 1, title: `Phase ${prev.length + 1}`, description: '', ownership_percentage: 100, status: 'pending' },
    ]);
    setPhasesDirty(true);
  }

  function removePhase(i: number) {
    setPhases((prev) => prev.filter((_, j) => j !== i).map((p, j) => ({ ...p, position: j + 1 })));
    setPhasesDirty(true);
  }

  function validatePhases(): string {
    if (phases.length < 2) return 'A phased deal needs at least 2 phases.';
    for (let i = 0; i < phases.length; i++) {
      const pct = phases[i].ownership_percentage;
      if (Number.isNaN(pct) || pct < 0 || pct > 100) return `Phase ${i + 1}: percentage must be between 0 and 100.`;
      if (!phases[i].title.trim()) return `Phase ${i + 1}: title is required.`;
      if (i > 0 && pct < phases[i - 1].ownership_percentage) return `Phase ${i + 1}: ownership can never decrease between phases.`;
    }
    if (phases[phases.length - 1].ownership_percentage !== 100) return 'The final phase must end at 100% ownership.';
    return '';
  }

  async function savePhases() {
    if (!agreement) return;
    const err = validatePhases();
    if (err) { setPhaseError(err); return; }
    setSavingPhases(true);
    const supabase = createClient();
    await supabase.from('deal_agreement_phases').delete().eq('agreement_id', agreement.id);
    const { data: inserted } = await supabase
      .from('deal_agreement_phases')
      .insert(phases.map((p, i) => ({
        agreement_id: agreement.id,
        position: i + 1,
        title: p.title.trim(),
        description: p.description || null,
        ownership_percentage: p.ownership_percentage,
        status: 'pending',
      })))
      .select().order('position');
    // Changing the structure invalidates any existing signature
    await supabase.from('deal_agreements')
      .update({ dissolution_clause: clauseDraft, dissolution_notice_days: noticeDays, buyer_signed_at: null, seller_signed_at: null })
      .eq('id', agreement.id);
    setAgreement({ ...agreement, dissolution_clause: clauseDraft, dissolution_notice_days: noticeDays, buyer_signed_at: null, seller_signed_at: null });
    if (inserted) setPhases(inserted.map((p: Phase) => ({ ...p, description: p.description ?? '' })));
    setPhasesDirty(false);
    setSavingPhases(false);
  }

  async function signAgreement() {
    if (!agreement || !userId || !conv) return;
    const supabase = createClient();
    const field = isBuyer ? 'buyer_signed_at' : 'seller_signed_at';
    const now = new Date().toISOString();
    const otherSigned = isBuyer ? !!agreement.seller_signed_at : !!agreement.buyer_signed_at;
    const patch: Record<string, unknown> = { [field]: now };
    if (otherSigned) patch.status = 'active';
    await supabase.from('deal_agreements').update(patch).eq('id', agreement.id);
    if (otherSigned && phases.length > 0 && phases[0].id) {
      await supabase.from('deal_agreement_phases').update({ status: 'active' }).eq('id', phases[0].id);
      await supabase.from('conversations').update({ current_phase: 1 }).eq('id', conv.id);
      setPhases((prev) => prev.map((p, i) => (i === 0 ? { ...p, status: 'active' } : p)));
    }
    setAgreement({ ...agreement, ...patch } as Agreement);
  }

  async function completePhase(i: number) {
    if (!agreement || !conv) return;
    const supabase = createClient();
    const phase = phases[i];
    const next = phases[i + 1];
    await supabase.from('deal_agreement_phases')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', phase.id);
    if (next?.id) {
      await supabase.from('deal_agreement_phases').update({ status: 'active' }).eq('id', next.id);
      await supabase.from('conversations').update({ current_phase: next.position }).eq('id', conv.id);
    } else {
      await supabase.from('deal_agreements').update({ status: 'completed' }).eq('id', agreement.id);
      setAgreement({ ...agreement, status: 'completed' });
    }
    setPhases((prev) => prev.map((p, j) =>
      j === i ? { ...p, status: 'completed' } : j === i + 1 ? { ...p, status: 'active' } : p
    ));
  }

  async function dissolveAgreement() {
    if (!agreement || !dissolveReason.trim()) return;
    const supabase = createClient();
    await supabase.from('deal_agreements')
      .update({ status: 'dissolved', dissolved_at: new Date().toISOString(), dissolution_reason: dissolveReason.trim() })
      .eq('id', agreement.id);
    setAgreement({ ...agreement, status: 'dissolved', dissolution_reason: dissolveReason.trim(), dissolved_at: new Date().toISOString() } as Agreement);
    setShowDissolve(false);
  }

  // ── Knowledge transfer handlers ──────────────────────────────────────────
  const emptySections = KT_SECTIONS.filter((s) => !ktForm[s.key]?.trim()).map((s) => s.label);

  async function saveKt(submit = false) {
    if (!kt) return;
    setKtSaving(true);
    const supabase = createClient();
    const patch: Record<string, unknown> = { form: ktForm };
    if (submit) { patch.status = 'submitted'; patch.submitted_at = new Date().toISOString(); }
    await supabase.from('knowledge_transfers').update(patch).eq('id', kt.id);
    setKt({ ...kt, form: ktForm, status: submit ? 'submitted' : kt.status });
    setKtSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setKtSaving(false);
  }

  async function approveKt() {
    if (!kt) return;
    const supabase = createClient();
    await supabase.from('knowledge_transfers')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', kt.id);
    setKt({ ...kt, status: 'approved' });
  }

  // ── Axon chat ────────────────────────────────────────────────────────────
  const sendChat = useCallback(async () => {
    if (!chatInput.trim() || chatBusy) return;
    const userMsg: ChatMsg = { role: 'user', content: chatInput.trim() };
    const history = [...chat, userMsg];
    setChat([...history, { role: 'assistant', content: '' }]);
    setChatInput('');
    setChatBusy(true);
    try {
      const res = await fetch('/api/axon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          context: {
            listingName: conv?.listings?.name,
            askingPrice,
            role: isSeller ? 'seller' : 'buyer',
            emptySections,
          },
        }),
      });
      if (!res.ok || !res.body) throw new Error('axon failed');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const text = acc;
        setChat((prev) => prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: text } : m)));
      }
    } catch {
      setChat((prev) => prev.map((m, i) =>
        i === prev.length - 1 ? { ...m, content: 'Something went wrong — please try again.' } : m
      ));
    }
    setChatBusy(false);
  }, [chatInput, chatBusy, chat, conv, askingPrice, isSeller, emptySections]);

  // ── Render ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="page-enter" style={{ padding: '80px 0', textAlign: 'center' }}>
      <div className="container"><p className="muted">Loading deal room…</p></div>
    </div>
  );

  if (!userId) return (
    <div className="page-enter" style={{ padding: '80px 0', textAlign: 'center' }}>
      <div className="container col gap-4" style={{ alignItems: 'center' }}>
        <p style={{ fontSize: 18, fontWeight: 600 }}>Sign in to view this deal</p>
        <Link href={`/sign-in?next=/deal/${conversationId}`} className="btn btn-primary">Sign in</Link>
      </div>
    </div>
  );

  if (notFound || !conv) return (
    <div className="page-enter" style={{ padding: '80px 0', textAlign: 'center' }}>
      <div className="container col gap-4" style={{ alignItems: 'center' }}>
        <p style={{ fontSize: 18, fontWeight: 600 }}>Deal not found</p>
        <p className="muted">This deal does not exist or you are not a participant.</p>
        <Link href="/messages" className="btn btn-primary">Back to messages</Link>
      </div>
    </div>
  );

  const statusColors: Record<string, string> = {
    draft: '#C8922A', active: '#0047FF', completed: '#1F9D55', dissolved: '#D64545',
  };

  return (
    <div className="page-enter" style={{ padding: '32px 0 80px' }}>
      <div className="container col" style={{ gap: 24 }}>

        {/* Header */}
        <div className="col gap-1">
          <SectionEyebrow>Deal room</SectionEyebrow>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
            <div className="col gap-1">
              <h1 style={{ fontSize: 26, fontWeight: 600, margin: 0 }}>{conv.listings?.name ?? 'Deal'}</h1>
              <p className="muted" style={{ margin: 0, fontSize: 13 }}>
                With {counterpartyName} · {isBuyer ? 'You are buying' : 'You are selling'} · Deal value €{Number(askingPrice).toLocaleString('nl-NL')}
              </p>
            </div>
            <div className="row gap-2">
              {agreement && (
                <span className="badge" style={{ fontSize: 11, color: statusColors[agreement.status], borderColor: statusColors[agreement.status] + '55' }}>
                  Agreement: {agreement.status}
                </span>
              )}
              <Link href="/messages" className="btn btn-secondary btn-sm">Back to messages</Link>
            </div>
          </div>
        </div>

        {agreement?.status === 'dissolved' && (
          <div style={{ background: '#D6454511', border: '0.5px solid #D6454555', borderRadius: 10, padding: '14px 18px', fontSize: 13, color: '#D64545' }}>
            <strong>Agreement dissolved.</strong> Reason: {agreement.dissolution_reason}. Ownership reverts to the last completed phase per the dissolution clause.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: ktRequired ? 'minmax(0, 1fr) minmax(0, 1fr)' : 'minmax(0, 1fr)', gap: 24, alignItems: 'start' }}>

          {/* ── Left: phased ownership ── */}
          <div className="col" style={{ gap: 16 }}>
            <div style={{ border: '0.5px solid var(--hair)', borderRadius: 14, padding: 24 }}>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <h2 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>Phased ownership</h2>
                {editable && <Button size="sm" variant="ghost" onClick={addPhase} icon={<Icon.Plus size={12} />}>Add phase</Button>}
              </div>
              <p className="muted" style={{ fontSize: 13, marginTop: 4, marginBottom: 16 }}>
                Ownership transfers in steps. {editable ? 'Adjust the percentages until both parties agree, then sign.' : 'Percentages are locked — the agreement is signed.'}
              </p>

              <div className="col" style={{ gap: 12 }}>
                {phases.map((p, i) => (
                  <div key={p.id ?? i} style={{
                    border: '0.5px solid var(--hair)', borderRadius: 10, padding: '14px 16px',
                    background: p.status === 'active' ? '#0047FF0A' : p.status === 'completed' ? '#1F9D550A' : 'var(--surface)',
                    borderLeft: p.status === 'active' ? '2px solid #0047FF' : p.status === 'completed' ? '2px solid #1F9D55' : '0.5px solid var(--hair)',
                  }}>
                    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                      <div className="row gap-2" style={{ alignItems: 'center', flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', flexShrink: 0 }}>PHASE {i + 1}</span>
                        {editable ? (
                          <input value={p.title} onChange={(e) => updatePhase(i, { title: e.target.value })}
                            style={{ flex: 1, fontSize: 14, fontWeight: 600, background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 6, padding: '4px 8px', color: 'var(--fg)', outline: 'none', minWidth: 0 }} />
                        ) : (
                          <span style={{ fontSize: 14, fontWeight: 600 }}>{p.title}</span>
                        )}
                      </div>
                      <div className="row gap-2" style={{ alignItems: 'center', flexShrink: 0 }}>
                        {editable ? (
                          <input type="number" min={0} max={100} value={p.ownership_percentage}
                            onChange={(e) => updatePhase(i, { ownership_percentage: Number(e.target.value) })}
                            style={{ width: 64, fontSize: 14, fontWeight: 600, background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 6, padding: '4px 8px', color: 'var(--fg)', outline: 'none', textAlign: 'right' }} />
                        ) : (
                          <span style={{ fontSize: 15, fontWeight: 600 }}>{Number(p.ownership_percentage)}</span>
                        )}
                        <span className="muted" style={{ fontSize: 13 }}>% buyer ownership</span>
                        {editable && phases.length > 2 && (
                          <button onClick={() => removePhase(i)} style={{ all: 'unset', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }} aria-label="Remove phase">
                            <Icon.X size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                    {editable ? (
                      <input value={p.description} onChange={(e) => updatePhase(i, { description: e.target.value })}
                        placeholder="What must be completed in this phase?"
                        style={{ width: '100%', marginTop: 8, fontSize: 13, background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 6, padding: '6px 8px', color: 'var(--fg)', outline: 'none', boxSizing: 'border-box' }} />
                    ) : (
                      p.description && <p className="muted" style={{ fontSize: 13, margin: '8px 0 0' }}>{p.description}</p>
                    )}
                    {!editable && agreement?.status === 'active' && p.status === 'active' && isSeller && (
                      <div style={{ marginTop: 10 }}>
                        <Button size="sm" onClick={() => completePhase(i)} icon={<Icon.Check size={12} />}>
                          Mark phase complete
                        </Button>
                      </div>
                    )}
                    {p.status === 'completed' && (
                      <span className="badge badge-verified" style={{ fontSize: 10, marginTop: 8, display: 'inline-flex' }}>
                        <Icon.Check size={9} /> Completed
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {phaseError && <p style={{ color: '#D64545', fontSize: 13, marginTop: 12, marginBottom: 0 }}>{phaseError}</p>}
            </div>

            {/* Dissolution clause */}
            <div style={{ border: '0.5px solid var(--hair)', borderRadius: 14, padding: 24 }}>
              <h2 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>Dissolution clause</h2>
              <p className="muted" style={{ fontSize: 13, marginTop: 4, marginBottom: 14 }}>
                What happens if either party wants out before full transfer.
              </p>
              {editable ? (
                <>
                  <textarea value={clauseDraft} onChange={(e) => { setClauseDraft(e.target.value); setPhasesDirty(true); }} rows={5}
                    style={{ width: '100%', fontSize: 13, lineHeight: 1.6, background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--fg)', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'var(--font-inter)' }} />
                  <div className="row gap-2" style={{ alignItems: 'center', marginTop: 10 }}>
                    <span style={{ fontSize: 13 }}>Notice period:</span>
                    <input type="number" min={0} value={noticeDays} onChange={(e) => { setNoticeDays(Number(e.target.value)); setPhasesDirty(true); }}
                      style={{ width: 60, fontSize: 13, background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 6, padding: '4px 8px', color: 'var(--fg)', outline: 'none', textAlign: 'right' }} />
                    <span className="muted" style={{ fontSize: 13 }}>days</span>
                  </div>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>{agreement?.dissolution_clause}</p>
                  <p className="muted" style={{ fontSize: 12, marginTop: 8, marginBottom: 0 }}>Notice period: {agreement?.dissolution_notice_days} days</p>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
              {editable && (
                <>
                  <Button onClick={savePhases} disabled={savingPhases || !phasesDirty}>
                    {savingPhases ? 'Saving…' : 'Save deal structure'}
                  </Button>
                  {!phasesDirty && (
                    (isBuyer && agreement?.buyer_signed_at) || (isSeller && agreement?.seller_signed_at)
                      ? <span className="badge badge-verified" style={{ fontSize: 12, alignSelf: 'center' }}><Icon.Check size={10} /> You signed — waiting for {counterpartyName}</span>
                      : <Button variant="secondary" onClick={signAgreement} icon={<Icon.Shield size={12} />}>Sign agreement</Button>
                  )}
                </>
              )}
              {agreement?.status === 'active' && (
                <Button variant="ghost" onClick={() => setShowDissolve((v) => !v)} style={{ color: '#D64545' }}>
                  Invoke dissolution clause
                </Button>
              )}
            </div>

            {showDissolve && agreement?.status === 'active' && (
              <div style={{ border: '0.5px solid #D6454555', background: '#D6454508', borderRadius: 10, padding: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 8px', color: '#D64545' }}>Dissolve this agreement</p>
                <p className="muted" style={{ fontSize: 12, margin: '0 0 10px' }}>
                  Ownership reverts to the last completed phase after the {agreement.dissolution_notice_days}-day notice period. This cannot be undone.
                </p>
                <textarea value={dissolveReason} onChange={(e) => setDissolveReason(e.target.value)} rows={2}
                  placeholder="Reason for dissolution (required)"
                  style={{ width: '100%', fontSize: 13, background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 8, padding: '8px 10px', color: 'var(--fg)', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'var(--font-inter)' }} />
                <div className="row gap-2" style={{ marginTop: 10 }}>
                  <Button size="sm" onClick={dissolveAgreement} disabled={!dissolveReason.trim()} style={{ background: '#D64545' }}>Confirm dissolution</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowDissolve(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>

          {/* ── Right: knowledge transfer + Axon (deals > €100K) ── */}
          {ktRequired ? (
            <div className="col" style={{ gap: 16 }}>
              <div style={{ border: '0.5px solid var(--hair)', borderRadius: 14, padding: 24 }}>
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>Knowledge transfer</h2>
                  <span className="badge" style={{ fontSize: 11 }}>
                    {kt?.status === 'approved' ? 'Approved by buyer' : kt?.status === 'submitted' ? 'Awaiting buyer approval' : `${KT_SECTIONS.length - emptySections.length}/${KT_SECTIONS.length} sections filled`}
                  </span>
                </div>
                <p className="muted" style={{ fontSize: 13, marginTop: 4, marginBottom: 16 }}>
                  Required for deals above €100.000. {isSeller ? 'Document everything the buyer needs to run the business — Axon helps you below.' : 'The seller documents the business here; review each section before approving.'}
                </p>

                <div className="col" style={{ gap: 14 }}>
                  {KT_SECTIONS.map((s) => (
                    <div key={s.key} className="col gap-1">
                      <div className="row gap-2" style={{ alignItems: 'center' }}>
                        <label style={{ fontSize: 13, fontWeight: 600 }}>{s.label}</label>
                        {ktForm[s.key]?.trim() && <Icon.Check size={11} color="#1F9D55" />}
                      </div>
                      {isSeller && kt?.status === 'draft' ? (
                        <textarea
                          value={ktForm[s.key] ?? ''}
                          onChange={(e) => setKtForm((prev) => ({ ...prev, [s.key]: e.target.value }))}
                          placeholder={s.hint}
                          rows={2}
                          style={{ width: '100%', fontSize: 13, lineHeight: 1.5, background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 8, padding: '8px 10px', color: 'var(--fg)', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'var(--font-inter)' }}
                        />
                      ) : (
                        <p style={{ fontSize: 13, lineHeight: 1.5, margin: 0, color: ktForm[s.key]?.trim() ? 'var(--fg)' : 'var(--muted)', whiteSpace: 'pre-wrap' }}>
                          {ktForm[s.key]?.trim() || 'Not filled in yet.'}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="row gap-2" style={{ marginTop: 18, alignItems: 'center', flexWrap: 'wrap' }}>
                  {isSeller && kt?.status === 'draft' && (
                    <>
                      <Button size="sm" variant="secondary" onClick={() => saveKt(false)} disabled={ktSaving}>
                        {ktSaving ? 'Saving…' : 'Save draft'}
                      </Button>
                      <Button size="sm" onClick={() => saveKt(true)} disabled={ktSaving || emptySections.length > 0}>
                        Submit to buyer
                      </Button>
                      {emptySections.length > 0 && <span className="muted" style={{ fontSize: 12 }}>{emptySections.length} section(s) still empty</span>}
                      {ktSavedAt && <span className="muted" style={{ fontSize: 12 }}>Saved {ktSavedAt}</span>}
                    </>
                  )}
                  {isBuyer && kt?.status === 'submitted' && (
                    <Button size="sm" onClick={approveKt} icon={<Icon.Check size={12} />}>Approve knowledge transfer</Button>
                  )}
                  {kt?.status === 'approved' && (
                    <span className="badge badge-verified" style={{ fontSize: 12 }}><Icon.Check size={10} /> Knowledge transfer approved</span>
                  )}
                </div>
              </div>

              {/* Axon chat */}
              <div style={{ border: '0.5px solid var(--hair)', borderRadius: 14, display: 'flex', flexDirection: 'column', height: 420, overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '0.5px solid var(--hair)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#0047FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon.Sparkle size={14} />
                  </div>
                  <div className="col">
                    <span style={{ fontSize: 14, fontWeight: 600 }}>Axon — AI-COO</span>
                    <span className="muted" style={{ fontSize: 11 }}>Personal guidance for your handover</span>
                  </div>
                </div>
                <div ref={chatScrollRef} style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {chat.map((m, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
                      <div style={{
                        maxWidth: '85%', fontSize: 13, lineHeight: 1.55, padding: '9px 12px',
                        background: m.role === 'user' ? '#0047FF' : 'var(--surface)',
                        color: m.role === 'user' ? '#fff' : 'var(--fg)',
                        border: m.role === 'user' ? 'none' : '0.5px solid var(--hair)',
                        borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                        whiteSpace: 'pre-wrap',
                      }}>
                        {m.content || '…'}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: 12, borderTop: '0.5px solid var(--hair)', display: 'flex', gap: 8 }}>
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') sendChat(); }}
                    placeholder="Ask Axon about the handover…"
                    style={{ flex: 1, fontSize: 13, background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 8, padding: '9px 12px', color: 'var(--fg)', outline: 'none' }}
                  />
                  <Button size="sm" onClick={sendChat} disabled={!chatInput.trim() || chatBusy}>
                    {chatBusy ? '…' : 'Send'}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ border: '0.5px solid var(--hair)', borderRadius: 14, padding: 24, alignSelf: 'start' }}>
              <h2 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>Knowledge transfer</h2>
              <p className="muted" style={{ fontSize: 13, marginTop: 8, marginBottom: 0 }}>
                The Axon-guided knowledge transfer is required for deals above €100.000. This deal (€{Number(askingPrice).toLocaleString('nl-NL')}) is below that threshold, so a formal transfer form is optional — agree on the handover directly in your messages.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
