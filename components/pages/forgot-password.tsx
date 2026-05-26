'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Icon, SectionEyebrow, Field } from '@/components/ui';
import { createClient } from '@/lib/supabase-browser';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
  }

  if (done) {
    return (
      <div className="page-enter">
        <section style={{ padding: '96px 0 80px' }}>
          <div className="container col gap-6" style={{ maxWidth: 440, margin: '0 auto', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: '#00A86B18', display: 'grid', placeItems: 'center' }}>
              <Icon.Check size={24} color="#00A86B" />
            </div>
            <div className="col gap-2">
              <h2 style={{ fontSize: 28, fontWeight: 700 }}>Check your email</h2>
              <p className="muted" style={{ fontSize: 15, lineHeight: 1.6 }}>
                We sent a password reset link to <strong>{email}</strong>. Click it to set a new password.
              </p>
            </div>
            <Link href="/sign-in" className="btn btn-secondary">Back to sign in</Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-enter">
      <section style={{ padding: '96px 0 80px' }}>
        <div className="container" style={{ maxWidth: 440, margin: '0 auto' }}>
          <div className="col gap-4" style={{ marginBottom: 32, textAlign: 'center' }}>
            <SectionEyebrow>Reset password</SectionEyebrow>
            <h1 style={{ fontSize: 40, letterSpacing: -1.2 }}>Forgot your password?</h1>
            <p style={{ fontSize: 15, color: 'var(--subtle)', fontWeight: 300, lineHeight: 1.6 }}>
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
          </div>

          <div className="card col gap-4" style={{ padding: 36 }}>
            <form className="col gap-4" onSubmit={submit}>
              <Field label="Email">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  autoComplete="email"
                />
              </Field>

              {error && (
                <div style={{ background: '#FF3B3011', border: '0.5px solid #FF3B3044', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#FF3B30' }}>
                  {error}
                </div>
              )}

              <Button
                variant="primary"
                type="submit"
                size="lg"
                disabled={loading}
                iconRight={loading ? undefined : <Icon.Arrow size={14} />}
                style={{ width: '100%', marginTop: 8 }}
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </Button>
            </form>

            <div className="hair-t" style={{ paddingTop: 20, textAlign: 'center' }}>
              <span className="muted" style={{ fontSize: 13 }}>
                Remembered your password?{' '}
                <Link href="/sign-in" style={{ color: 'var(--fg)', fontWeight: 500 }}>Sign in</Link>
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
