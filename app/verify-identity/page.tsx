'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Icon, SectionEyebrow, Field } from '@/components/ui';
import { createClient as _createClient } from '@/lib/supabase-browser';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createClient = () => _createClient() as any;

function age(dob: string): number {
  const d = new Date(dob);
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

export default function VerifyIdentityPage() {
  const router = useRouter();
  const [dob, setDob] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const dobAge = dob ? age(dob) : null;
  const tooYoung = dobAge !== null && dobAge < 18;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!dob || !docFile) { setError('Fill in all fields.'); return; }
    if (tooYoung) { setError('You must be 18 or older to use SafeBusinessSelling.'); return; }

    setSubmitting(true);
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/sign-in'); return; }

    const path = `${session.user.id}/${Date.now()}_${docFile.name}`;
    const { error: uploadError } = await supabase.storage
      .from('kyc-documents')
      .upload(path, docFile, { upsert: true });

    if (uploadError) { setError('Upload failed. Try again.'); setSubmitting(false); return; }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ date_of_birth: dob, id_document_path: path, kyc_status: 'pending' })
      .eq('id', session.user.id);

    if (updateError) { setError('Could not save. Try again.'); setSubmitting(false); return; }

    router.push('/dashboard?kyc=submitted');
  }

  return (
    <div className="page-enter">
      <section style={{ padding: '96px 0 80px' }}>
        <div className="container" style={{ maxWidth: 480, margin: '0 auto' }}>
          <div className="col gap-4" style={{ marginBottom: 32, textAlign: 'center' }}>
            <SectionEyebrow>Identity verification</SectionEyebrow>
            <h1 style={{ fontSize: 36, letterSpacing: -1 }}>Verify your identity</h1>
            <p style={{ fontSize: 15, color: 'var(--subtle)', fontWeight: 300, lineHeight: 1.6 }}>
              Required before buying or selling. We verify your identity to keep the platform safe for everyone.
            </p>
          </div>

          <div className="card col gap-4" style={{ padding: 36 }}>
            <form className="col gap-4" onSubmit={handleSubmit}>

              <Field label="Date of birth" hint="You must be 18 or older.">
                <input
                  type="date"
                  value={dob}
                  onChange={e => setDob(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  required
                />
                {tooYoung && (
                  <span style={{ fontSize: 12, color: '#FF3B30', marginTop: 4 }}>
                    You must be at least 18 years old.
                  </span>
                )}
                {dobAge !== null && dobAge >= 18 && (
                  <span style={{ fontSize: 12, color: '#00A86B', marginTop: 4 }}>
                    ✓ Age confirmed ({dobAge} years old)
                  </span>
                )}
              </Field>

              <Field label="Identity document" hint="Passport, driver's licence, or national ID. PDF or photo.">
                {docFile ? (
                  <div className="row hair gap-3" style={{ padding: '10px 14px', borderRadius: 8, alignItems: 'center' }}>
                    <Icon.Doc size={14} />
                    <span style={{ flex: 1, fontSize: 13 }}>{docFile.name}</span>
                    <button type="button" onClick={() => setDocFile(null)} style={{ color: 'var(--muted)', cursor: 'pointer' }}>
                      <Icon.X size={11} />
                    </button>
                  </div>
                ) : (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, border: '0.5px dashed var(--border-strong)', cursor: 'pointer' }}>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      style={{ display: 'none' }}
                      onChange={e => setDocFile(e.target.files?.[0] ?? null)}
                    />
                    <Icon.Upload size={14} />
                    <span style={{ fontSize: 13, color: 'var(--muted)' }}>Click to upload</span>
                  </label>
                )}
              </Field>

              {error && (
                <div style={{ background: '#FF3B3011', border: '0.5px solid #FF3B3044', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#FF3B30' }}>
                  {error}
                </div>
              )}

              <div className="row hair" style={{ padding: 14, borderRadius: 8, gap: 10, alignItems: 'flex-start' }}>
                <span style={{ flexShrink: 0, marginTop: 1 }}><Icon.Shield size={14} /></span>
                <p className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>
                  Your document is encrypted and only reviewed by our compliance team. It is never shared with buyers or sellers.
                </p>
              </div>

              <Button
                variant="primary"
                type="submit"
                size="lg"
                disabled={submitting || tooYoung || !dob || !docFile}
                iconRight={submitting ? undefined : <Icon.Arrow size={14} />}
                style={{ width: '100%' }}
              >
                {submitting ? 'Submitting…' : 'Submit for review'}
              </Button>
            </form>
          </div>

          <p className="muted" style={{ fontSize: 12, textAlign: 'center', marginTop: 20, lineHeight: 1.6 }}>
            Verification usually takes 1 business day. You'll receive an email when approved.
          </p>
        </div>
      </section>
    </div>
  );
}
