'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// useRouter only used in SignInPage
import { Button, Icon, SectionEyebrow, Field } from '@/components/ui';
import { createClient } from '@/lib/supabase-browser';

export function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? 'Wrong email or password.'
        : error.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="page-enter">
      <section style={{ padding: '96px 0 80px' }}>
        <div className="container" style={{ maxWidth: 440, margin: '0 auto' }}>
          <div className="col gap-4" style={{ marginBottom: 32, textAlign: 'center' }}>
            <SectionEyebrow>Sign in</SectionEyebrow>
            <h1 style={{ fontSize: 40, letterSpacing: -1.2 }}>Welcome back</h1>
            <p style={{ fontSize: 15, color: 'var(--subtle)', fontWeight: 300, lineHeight: 1.6 }}>
              One account to buy businesses, sell your own, and manage all your deals.
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
              <Field label="Password">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </Field>

              {error && (
                <div style={{ background: '#FF3B3011', border: '0.5px solid #FF3B3044', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#FF3B30' }}>
                  {error}
                </div>
              )}

              <div className="row" style={{ justifyContent: 'flex-end' }}>
                <Link href="/forgot-password" className="muted" style={{ fontSize: 12 }}>
                  Forgot password?
                </Link>
              </div>
              <Button
                variant="primary"
                type="submit"
                size="lg"
                disabled={loading}
                iconRight={loading ? undefined : <Icon.Arrow size={14} />}
                style={{ width: '100%', marginTop: 8 }}
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>

            <div className="hair-t" style={{ paddingTop: 20, textAlign: 'center' }}>
              <span className="muted" style={{ fontSize: 13 }}>
                No account yet?{' '}
                <Link href="/sign-up" style={{ color: 'var(--fg)', fontWeight: 500 }}>
                  Sign up
                </Link>
              </span>
            </div>
          </div>

          <div className="row gap-2" style={{ justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
            <span className="badge badge-verified"><Icon.Lock size={10} /> Escrow protected</span>
            <span className="badge"><Icon.Shield size={10} /> Buy & sell</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export function SignUpPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.name },
      },
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
                We sent a confirmation link to <strong>{form.email}</strong>. Click it to activate your account.
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
        <div className="container" style={{ maxWidth: 480, margin: '0 auto' }}>
          <div className="col gap-4" style={{ marginBottom: 32, textAlign: 'center' }}>
            <SectionEyebrow>Sign up</SectionEyebrow>
            <h1 style={{ fontSize: 40, letterSpacing: -1.2 }}>Create your account</h1>
            <p style={{ fontSize: 15, color: 'var(--subtle)', fontWeight: 300, lineHeight: 1.6 }}>
              One account to buy and sell businesses. Verification and escrow keep every deal protected.
            </p>
          </div>

          <div className="card col gap-4" style={{ padding: 36 }}>
            <form className="col gap-4" onSubmit={submit}>
              <Field label="Full name">
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Full name"
                  required
                  autoComplete="name"
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@company.com"
                  required
                  autoComplete="email"
                />
              </Field>
              <Field label="Password" hint="Minimum 8 characters">
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </Field>

              {error && (
                <div style={{ background: '#FF3B3011', border: '0.5px solid #FF3B3044', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#FF3B30' }}>
                  {error}
                </div>
              )}

              <p style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5 }}>
                By signing up you agree to our{' '}
                <Link href="/contact" style={{ color: 'var(--subtle)' }}>Terms</Link>{' '}and{' '}
                <Link href="/contact" style={{ color: 'var(--subtle)' }}>Privacy Policy</Link>.
              </p>
              <Button
                variant="primary"
                type="submit"
                size="lg"
                disabled={loading}
                iconRight={loading ? undefined : <Icon.Arrow size={14} />}
                style={{ width: '100%', marginTop: 4 }}
              >
                {loading ? 'Creating account…' : 'Create account'}
              </Button>
            </form>

            <div className="hair-t" style={{ paddingTop: 20, textAlign: 'center' }}>
              <span className="muted" style={{ fontSize: 13 }}>
                Already have an account?{' '}
                <Link href="/sign-in" style={{ color: 'var(--fg)', fontWeight: 500 }}>Sign in</Link>
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
