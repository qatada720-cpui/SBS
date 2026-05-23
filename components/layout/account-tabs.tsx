'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/buyer/dashboard', label: 'Buying' },
  { href: '/seller/dashboard', label: 'Selling' },
] as const;

export function AccountTabs() {
  const pathname = usePathname();

  return (
    <div className="row gap-2 hair" style={{ padding: 4, borderRadius: 999, width: 'fit-content' }}>
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 500,
              background: active ? 'var(--fg)' : 'transparent',
              color: active ? 'var(--bg)' : 'var(--fg)',
              transition: 'all 0.15s ease',
            }}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
