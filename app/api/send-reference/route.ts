import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY ?? '');
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name, company, email, sellerName, token } = await req.json();

  if (!name || !email || !token) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const verifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/verify-reference?token=${token}`;

  const { error } = await resend.emails.send({
    from: 'SafeBusinessSelling <noreply@safebusinessselling.com>',
    to: email,
    subject: `${sellerName} listed you as a trade reference`,
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #111;">
        <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 8px;">You've been listed as a trade reference</h2>
        <p style="font-size: 14px; color: #555; line-height: 1.6; margin-bottom: 24px;">
          <strong>${sellerName}</strong> is selling their business on SafeBusinessSelling and has listed you${company ? ` (${company})` : ''} as a trade reference.
        </p>
        <p style="font-size: 14px; color: #555; line-height: 1.6; margin-bottom: 32px;">
          Please confirm that you know this seller and can vouch for them by clicking the button below.
        </p>
        <a href="${verifyUrl}" style="display: inline-block; background: #111; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500;">
          Confirm reference
        </a>
        <p style="font-size: 12px; color: #999; margin-top: 32px;">
          If you don't know this person or didn't expect this email, you can ignore it or
          <a href="${verifyUrl}&action=decline" style="color: #999;">decline here</a>.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error('Resend error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
