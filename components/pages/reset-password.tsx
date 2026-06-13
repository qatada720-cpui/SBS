'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Icon, SectionEyebrow, Field } from '@/components/ui';
import { createClient as _createClient } from '@/lib/supabase-browser';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createClient = () => _createClient() as any;

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div style={{ background: '#FF3B3011', border: '0.5px solid #FF3B3044', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#FF3B30' }}>
      {msg}
    </div>
  );
}

export function ResetPasswordPage() {
  const router = useRouter();
  const params = useSearchParams();

  const [status, setStatus] = useState<'loading' | 'ready' | 'invalid' | 'done'>('loading');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const code = params.get('code');

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) { setStatus('invalid'); return; }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setStatus('invalid'); return; }

      setStatus('ready');
    }
    init();
  }, [params]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) { setError(updateError.message); setLoading(false); return; }

    setStatus('done');
    setTimeout(() => router.push('/dashboard'), 2500);
  }

  if (status === 'loading') return (
    <div className="page-enter" style={{ padding: '80px 0', textAlign: 'center' }}>
      <div className="container"><p className="muted">Verifying reset link…</p></div>
    </div>
  );

  if (status === 'invalid') return (
    <div className="page-enter">
      <section style={{ padding: '96px 0 80px' }}>
        <div className="container" style={{ maxWidth: 440, margin: '0 auto', textAlign: 'center' }}>
          <div className="col gap-4" style={{ marginBottom: 32, alignItems: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#FF3B3011', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon.X size={22} />
            </div>
            <h1 style={{ fontSize: 28, letterSpacing: -0.5 }}>Link expired</h1>
            <p style={{ fontSize: 15, color: 'var(--subtle)', fontWeight: 300, lineHeight: 1.6 }}>
              This password reset link is invalid or has already been used. Request a new one below.
            </p>
            <Link href="/forgot-password" className="btn btn-primary">Request new link</Link>
          </div>
        </div>
      </section>
    </div>
  );

  if (status === 'done') return (
    <div className="page-enter">
      <section style={{ padding: '96px 0 80px' }}>
        <div className="container" style={{ maxWidth: 440, margin: '0 auto', textAlign: 'center' }}>
          <div className="col gap-4" style={{ marginBottom: 32, alignItems: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#1F9D5511', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon.Check size={22} />
            </div>
            <h1 style={{ fontSize: 28, letterSpacing: -0.5 }}>Password updated</h1>
            <p style={{ fontSize: 15, color: 'var(--subtle)', fontWeight: 300, lineHeight: 1.6 }}>
              Your password has been changed. Redirecting you to your dashboard…
            </p>
          </div>
        </div>
      </section>
    </div>
  );

  return (
    <div className="page-enter">
      <section style={{ padding: '96px 0 80px' }}>
        <div className="container" style={{ maxWidth: 440, margin: '0 auto' }}>
          <div className="col gap-4" style={{ marginBottom: 32, textAlign: 'center' }}>
            <SectionEyebrow>Reset password</SectionEyebrow>
            <h1 style={{ fontSize: 40, letterSpacing: -1.2 }}>Choose a new password</h1>
            <p style={{ fontSize: 15, color: 'var(--subtle)', fontWeight: 300, lineHeight: 1.6 }}>
              Pick a strong password — at least 8 characters.
            </p>
          </div>

          <div className="card col gap-4" style={{ padding: 36 }}>
            <form className="col gap-4" onSubmit={handleSubmit}>
              <Field label="New password">
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  autoComplete="new-password"
                  autoFocus
                />
              </Field>
              <Field label="Confirm new password">
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repeat password"
                  required
                  autoComplete="new-password"
                />
              </Field>
              {error && <ErrorBox msg={error} />}
              <Button
                variant="primary"
                type="submit"
                size="lg"
                disabled={loading || !password || !confirm}
                iconRight={loading ? undefined : <Icon.Arrow size={14} />}
                style={{ width: '100%', marginTop: 8 }}
              >
                {loading ? 'Saving…' : 'Set new password'}
              </Button>
            </form>

            <div className="hair-t" style={{ paddingTop: 20, textAlign: 'center' }}>
              <Link href="/sign-in" style={{ fontSize: 13, color: 'var(--muted)' }}>
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
