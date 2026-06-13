'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Button, Icon, SectionEyebrow, Field } from '@/components/ui';
import { createClient } from '@/lib/supabase-browser';

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div style={{ background: '#FF3B3011', border: '0.5px solid #FF3B3044', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#FF3B30' }}>
      {msg}
    </div>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createClient();
    const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin}/reset-password`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (resetError) { setError(resetError.message); setLoading(false); return; }
    setSent(true);
    setLoading(false);
  }

  if (sent) return (
    <div className="page-enter">
      <section style={{ padding: '96px 0 80px' }}>
        <div className="container" style={{ maxWidth: 440, margin: '0 auto', textAlign: 'center' }}>
          <div className="col gap-4" style={{ alignItems: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#0047FF11', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon.Message size={22} />
            </div>
            <h1 style={{ fontSize: 28, letterSpacing: -0.5 }}>Check your email</h1>
            <p style={{ fontSize: 15, color: 'var(--subtle)', fontWeight: 300, lineHeight: 1.6 }}>
              If <strong>{email}</strong> has an account, you'll receive a reset link within a minute.
            </p>
            <p className="muted" style={{ fontSize: 13 }}>
              Didn't receive anything?{' '}
              <button
                onClick={() => setSent(false)}
                style={{ color: 'var(--fg)', fontWeight: 500, cursor: 'pointer' }}
              >
                Try again
              </button>
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
            <SectionEyebrow>Forgot password</SectionEyebrow>
            <h1 style={{ fontSize: 40, letterSpacing: -1.2 }}>Reset your password</h1>
            <p style={{ fontSize: 15, color: 'var(--subtle)', fontWeight: 300, lineHeight: 1.6 }}>
              Enter your email and we'll send you a link to set a new password.
            </p>
          </div>

          <div className="card col gap-4" style={{ padding: 36 }}>
            <form className="col gap-4" onSubmit={handleSubmit}>
              <Field label="Email">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  autoComplete="email"
                  autoFocus
                />
              </Field>
              {error && <ErrorBox msg={error} />}
              <Button
                variant="primary"
                type="submit"
                size="lg"
                disabled={loading || !email}
                iconRight={loading ? undefined : <Icon.Arrow size={14} />}
                style={{ width: '100%', marginTop: 8 }}
              >
                {loading ? 'Sending…' : 'Send reset link'}
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
