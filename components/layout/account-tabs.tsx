'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/buyer/dashboard', label: 'Buying' },
  { href: '/seller/dashboard', label: 'Selling' },
  { href: '/settings', label: 'Settings' },
] as const;

export function AccountTabs() {
  const pathname = usePathname();

  return (
    <nav aria-label="Account navigation">
      <div className="row gap-2 hair" role="tablist" style={{ padding: 4, borderRadius: 999, width: 'fit-content' }}>
        {TABS.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              role="tab"
              aria-selected={active}
              aria-current={active ? 'page' : undefined}
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
    </nav>
  );
}
