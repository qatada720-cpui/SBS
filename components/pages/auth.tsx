'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Icon, SectionEyebrow, Field } from '@/components/ui';
import { createClient } from '@/lib/supabase-browser';

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div style={{ background: '#FF3B3011', border: '0.5px solid #FF3B3044', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#FF3B30' }}>
      {msg}
    </div>
  );
}

function OtpInput({ onComplete }: { onComplete: (code: string) => void }) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const refs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));

  function handleChange(i: number, val: string) {
    const d = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = d;
    setDigits(next);
    if (d && i < 5) refs[i + 1].current?.focus();
    if (next.every(x => x)) onComplete(next.join(''));
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs[i - 1].current?.focus();
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const next = pasted.split('');
      setDigits(next);
      refs[5].current?.focus();
      onComplete(pasted);
    }
  }

  return (
    <div className="row" style={{ gap: 8, justifyContent: 'center' }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={refs[i]}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          style={{
            width: 44, height: 52, textAlign: 'center', fontSize: 22, fontWeight: 500,
            borderRadius: 8, border: '0.5px solid var(--border-strong)',
            background: 'var(--surface)', color: 'var(--fg)', padding: 0,
          }}
          autoFocus={i === 0}
        />
      ))}
    </div>
  );
}

export function SignUpPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, data: { full_name: name } },
    });
    if (error) { setError(error.message); setLoading(false); return; }
    setStep('otp');
    setLoading(false);
  }

  async function verifyOtp(code: string) {
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
    if (error) { setError('Invalid or expired code.'); setLoading(false); return; }
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="page-enter">
      <section style={{ padding: '96px 0 80px' }}>
        <div className="container" style={{ maxWidth: 440, margin: '0 auto' }}>
          <div className="col gap-4" style={{ marginBottom: 32, textAlign: 'center' }}>
            <SectionEyebrow>Sign up</SectionEyebrow>
            <h1 style={{ fontSize: 40, letterSpacing: -1.2 }}>Create your account</h1>
            <p style={{ fontSize: 15, color: 'var(--subtle)', fontWeight: 300, lineHeight: 1.6 }}>
              {step === 'email'
                ? 'One account to buy and sell businesses. No password needed.'
                : `We sent a 6-digit code to ${email}.`}
            </p>
          </div>

          <div className="card col gap-4" style={{ padding: 36 }}>
            {step === 'email' ? (
              <form className="col gap-4" onSubmit={sendOtp}>
                <Field label="Full name">
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" required autoComplete="name" />
                </Field>
                <Field label="Email">
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required autoComplete="email" />
                </Field>
                {error && <ErrorBox msg={error} />}
                <p style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5 }}>
                  By signing up you agree to our{' '}
                  <Link href="/contact" style={{ color: 'var(--subtle)' }}>Terms</Link>{' '}and{' '}
                  <Link href="/contact" style={{ color: 'var(--subtle)' }}>Privacy Policy</Link>.
                </p>
                <Button variant="primary" type="submit" size="lg" disabled={loading} iconRight={loading ? undefined : <Icon.Arrow size={14} />} style={{ width: '100%', marginTop: 4 }}>
                  {loading ? 'Sending code…' : 'Continue with email'}
                </Button>
              </form>
            ) : (
              <div className="col gap-6">
                <OtpInput onComplete={verifyOtp} />
                {error && <ErrorBox msg={error} />}
                {loading && <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>Verifying…</p>}
                <button onClick={() => { setStep('email'); setError(''); }} style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', cursor: 'pointer' }}>
                  ← Change email
                </button>
              </div>
            )}

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

export function SignInPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    if (error) { setError(error.message); setLoading(false); return; }
    setStep('otp');
    setLoading(false);
  }

  async function verifyOtp(code: string) {
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
    if (error) { setError('Invalid or expired code.'); setLoading(false); return; }
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
              {step === 'email'
                ? 'One account to buy businesses, sell your own, and manage all your deals.'
                : `We sent a 6-digit code to ${email}.`}
            </p>
          </div>

          <div className="card col gap-4" style={{ padding: 36 }}>
            {step === 'email' ? (
              <form className="col gap-4" onSubmit={sendOtp}>
                <Field label="Email">
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required autoComplete="email" />
                </Field>
                {error && <ErrorBox msg={error} />}
                <Button variant="primary" type="submit" size="lg" disabled={loading} iconRight={loading ? undefined : <Icon.Arrow size={14} />} style={{ width: '100%', marginTop: 8 }}>
                  {loading ? 'Sending code…' : 'Continue with email'}
                </Button>
              </form>
            ) : (
              <div className="col gap-6">
                <OtpInput onComplete={verifyOtp} />
                {error && <ErrorBox msg={error} />}
                {loading && <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>Verifying…</p>}
                <button onClick={() => { setStep('email'); setError(''); }} style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', cursor: 'pointer' }}>
                  ← Change email
                </button>
              </div>
            )}

            <div className="hair-t" style={{ paddingTop: 20, textAlign: 'center' }}>
              <span className="muted" style={{ fontSize: 13 }}>
                No account yet?{' '}
                <Link href="/sign-up" style={{ color: 'var(--fg)', fontWeight: 500 }}>Sign up</Link>
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
