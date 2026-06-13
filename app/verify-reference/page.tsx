'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

function VerifyReferenceInner() {
  const params = useSearchParams();
  const token = params.get('token');
  const action = params.get('action');
  const [status, setStatus] = useState<'loading' | 'verified' | 'declined' | 'error'>('loading');

  useEffect(() => {
    if (!token) { setStatus('error'); return; }

    async function handle() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!) as any;
      const newStatus = action === 'decline' ? 'declined' : 'verified';
      // Only allow update if the token hasn't been acted on yet
      const { error, count } = await supabase
        .from('trade_references')
        .update({ status: newStatus, verified_at: new Date().toISOString() })
        .eq('token', token!)
        .eq('status', 'pending')
        .select('id', { count: 'exact', head: true });

      if (error) { setStatus('error'); return; }
      // count === 0 means token already used or doesn't exist
      setStatus(count === 0 ? 'error' : newStatus);
    }
    handle();
  }, [token, action]);

  const content = {
    loading: { title: 'Verifying…', msg: 'Even geduld.', color: '#555' },
    verified: { title: 'Bedankt voor je bevestiging!', msg: 'Je referentie is geregistreerd. De verkoper wordt op de hoogte gesteld.', color: '#00A86B' },
    declined: { title: 'Referentie afgewezen', msg: 'Je hebt aangegeven deze verkoper niet te kennen. De verkoper wordt niet op de hoogte gesteld.', color: '#FF3B30' },
    error: { title: 'Ongeldige link', msg: 'Deze verificatielink is ongeldig of al gebruikt.', color: '#FF3B30' },
  }[status];

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: 'sans-serif', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 420, textAlign: 'center', padding: 32 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>
          {status === 'verified' ? '✓' : status === 'declined' ? '✗' : status === 'loading' ? '⏳' : '⚠️'}
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8, color: content.color }}>{content.title}</h1>
        <p style={{ fontSize: 14, color: '#777', lineHeight: 1.6 }}>{content.msg}</p>
      </div>
    </div>
  );
}

export default function VerifyReferencePage() {
  return (
    <Suspense>
      <VerifyReferenceInner />
    </Suspense>
  );
}
