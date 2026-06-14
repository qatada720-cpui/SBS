'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Icon, SectionEyebrow, Field } from '@/components/ui';
import { AccountTabs } from '@/components/layout/account-tabs';
import { createClient as _createClient } from '@/lib/supabase-browser';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createClient = () => _createClient() as any;

const ROLES = [
  { value: 'buyer', label: 'Buying', desc: 'I want to acquire a business' },
  { value: 'seller', label: 'Selling', desc: 'I want to sell my business' },
  { value: 'both', label: 'Both', desc: "I'm open to buying and selling" },
] as const;

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 100,
        background: ok ? '#00A86B18' : '#FF3B3011',
        border: `0.5px solid ${ok ? '#00A86B44' : '#FF3B3044'}`,
        color: ok ? '#00A86B' : '#FF3B30',
        padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
        display: 'flex', alignItems: 'center', gap: 8,
      }}
    >
      {ok ? <Icon.Check size={12} color="#00A86B" /> : null}
      {msg}
    </div>
  );
}

export function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'buyer' | 'seller' | 'both'>('buyer');
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/sign-in?next=/settings'); return; }
      setEmail(user.email ?? '');
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single();
      if (profile) {
        setName(profile.full_name ?? '');
        setRole(profile.role ?? 'buyer');
      }
      setProfileLoading(false);
    }
    load();
  }, [router]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setProfileSaving(false); return; }
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: name.trim(), role })
      .eq('id', user.id);
    setProfileSaving(false);
    showToast(error ? error.message : 'Profile saved.', !error);
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPw !== confirmPw) { showToast('Passwords do not match.', false); return; }
    if (newPw.length < 8) { showToast('Password must be at least 8 characters.', false); return; }
    setPwSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setPwSaving(false);
    if (error) { showToast(error.message, false); return; }
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
    showToast('Password updated.', true);
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/sign-in');
    router.refresh();
  }

  return (
    <div className="page-enter">
      <section style={{ padding: '32px 0 0' }}>
        <div className="container col gap-4">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
            <div className="col gap-2">
              <SectionEyebrow>Account</SectionEyebrow>
              <h1 style={{ fontSize: 36 }}>Settings</h1>
            </div>
            <AccountTabs />
          </div>
        </div>
      </section>

      <section style={{ padding: '40px 0 96px' }}>
        <div className="container col gap-8" style={{ maxWidth: 640 }}>

          {/* Profile */}
          <div className="card col gap-6" style={{ padding: 32 }}>
            <div className="col gap-1">
              <h2 style={{ fontSize: 18, fontWeight: 500 }}>Profile</h2>
              <p style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 300 }}>Your public name and account type.</p>
            </div>

            {profileLoading ? (
              <div style={{ height: 160, background: 'var(--surface-2)', borderRadius: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />
            ) : (
              <form className="col gap-5" onSubmit={saveProfile}>
                <div className="col gap-2">
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--subtle)', letterSpacing: 0.3 }}>Email</label>
                  <div style={{
                    height: 42, borderRadius: 8, border: '0.5px solid var(--border)',
                    background: 'var(--surface-2)', padding: '0 12px',
                    display: 'flex', alignItems: 'center', fontSize: 14, color: 'var(--muted)',
                  }}>
                    {email}
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>Email cannot be changed here. Contact support if needed.</span>
                </div>

                <Field label="Full name">
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your full name"
                    autoComplete="name"
                  />
                </Field>

                <div className="col gap-2">
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--subtle)', letterSpacing: 0.3 }}>
                    Account type
                  </label>
                  <div role="radiogroup" aria-label="Account type" className="col gap-2">
                    {ROLES.map(r => (
                      <button
                        key={r.value}
                        type="button"
                        role="radio"
                        aria-checked={role === r.value}
                        onClick={() => setRole(r.value)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 14,
                          padding: '10px 14px', borderRadius: 10,
                          border: role === r.value ? '1.5px solid var(--fg)' : '0.5px solid var(--border-strong)',
                          background: role === r.value ? 'var(--surface-2)' : 'transparent',
                          cursor: 'pointer', textAlign: 'left',
                        }}
                      >
                        <div className="col" style={{ gap: 2, flex: 1 }}>
                          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg)' }}>{r.label}</span>
                          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{r.desc}</span>
                        </div>
                        <span style={{
                          width: 16, height: 16, borderRadius: '50%',
                          border: role === r.value ? '4px solid var(--fg)' : '1.5px solid var(--border-strong)',
                          flexShrink: 0,
                        }} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="row" style={{ justifyContent: 'flex-end' }}>
                  <Button variant="primary" type="submit" disabled={profileSaving} aria-busy={profileSaving}>
                    {profileSaving ? 'Saving…' : 'Save profile'}
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Password */}
          <div className="card col gap-6" style={{ padding: 32 }}>
            <div className="col gap-1">
              <h2 style={{ fontSize: 18, fontWeight: 500 }}>Password</h2>
              <p style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 300 }}>Change your login password.</p>
            </div>

            <form className="col gap-4" onSubmit={savePassword}>
              <Field label="Current password">
                <input
                  type="password"
                  value={currentPw}
                  onChange={e => setCurrentPw(e.target.value)}
                  placeholder="Your current password"
                  autoComplete="current-password"
                />
              </Field>
              <Field label="New password">
                <input
                  type="password"
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                />
              </Field>
              <Field label="Confirm new password">
                <input
                  type="password"
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  placeholder="Repeat new password"
                  autoComplete="new-password"
                />
              </Field>

              <div className="row" style={{ justifyContent: 'flex-end' }}>
                <Button variant="primary" type="submit" disabled={!newPw || !confirmPw || pwSaving} aria-busy={pwSaving}>
                  {pwSaving ? 'Updating…' : 'Update password'}
                </Button>
              </div>
            </form>
          </div>

          {/* Session */}
          <div className="card col gap-4" style={{ padding: 32 }}>
            <div className="col gap-1">
              <h2 style={{ fontSize: 18, fontWeight: 500 }}>Session</h2>
              <p style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 300 }}>Sign out of your account on this device.</p>
            </div>
            <Button variant="secondary" onClick={signOut} style={{ width: 'fit-content' }}>
              Sign out
            </Button>
          </div>

          {/* Danger zone */}
          <div className="col gap-4" style={{ padding: 24, borderRadius: 12, border: '0.5px solid #FF3B3044', background: '#FF3B3008' }}>
            <div className="col gap-1">
              <h2 style={{ fontSize: 16, fontWeight: 500, color: '#FF3B30' }}>Danger zone</h2>
              <p style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 300 }}>
                Deleting your account is permanent and cannot be undone. All your data, listings, and deal history will be removed.
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={() => showToast('Contact support at hello@safebusinessselling.com to delete your account.', false)}
              style={{ width: 'fit-content', color: '#FF3B30', border: '0.5px solid #FF3B3044' }}
            >
              Delete account
            </Button>
          </div>

        </div>
      </section>

      {toast && <Toast msg={toast.msg} ok={toast.ok} />}
    </div>
  );
}
