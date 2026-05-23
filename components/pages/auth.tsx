'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Icon, SectionEyebrow, Field } from '@/components/ui';

export function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push('/dashboard');
    }, 600);
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
              <Field label="Password" hint="Demo: any password works">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </Field>
              <div className="row" style={{ justifyContent: 'flex-end' }}>
                <Link href="/contact" className="muted" style={{ fontSize: 12 }}>
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
            <span className="badge badge-verified">
              <Icon.Lock size={10} /> Escrow protected
            </span>
            <span className="badge">
              <Icon.Shield size={10} /> Buy & sell
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

export function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push('/dashboard');
    }, 600);
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
              <p style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5 }}>
                By signing up you agree to our{' '}
                <Link href="/contact" style={{ color: 'var(--subtle)' }}>
                  Terms
                </Link>{' '}
                and{' '}
                <Link href="/contact" style={{ color: 'var(--subtle)' }}>
                  Privacy Policy
                </Link>
                .
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
                <Link href="/sign-in" style={{ color: 'var(--fg)', fontWeight: 500 }}>
                  Sign in
                </Link>
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
