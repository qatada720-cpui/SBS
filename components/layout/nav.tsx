'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button, Logo } from '@/components/ui';
import { NAV_LINKS } from '@/lib/routes';

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function Nav({ transparent = false }: { transparent?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav
      className="nav"
      style={
        transparent
          ? { background: 'transparent', backdropFilter: 'none', WebkitBackdropFilter: 'none', borderBottom: 'none' }
          : undefined
      }
    >
      <div className="container row" style={{ height: 64, justifyContent: 'space-between' }}>
        {/* Logo */}
        <Link href="/" className="row gap-3" style={{ cursor: 'pointer' }}>
          <Logo size={0.9} />
        </Link>

        {/* Desktop nav links */}
        <div className="nav-desktop gap-8" style={{ alignItems: 'center' }}>
          <div className="row gap-6" style={{ alignItems: 'center' }}>
            {NAV_LINKS.map((l) => (
              <Link
                key={l.id}
                href={l.href}
                className={`nav-link ${isActive(pathname, l.href) ? 'active' : ''}`}
                style={{ cursor: 'pointer' }}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Desktop auth buttons */}
        <div className="nav-desktop gap-4" style={{ alignItems: 'center' }}>
          <Link
            href="/sign-in"
            className={`nav-link ${isActive(pathname, '/sign-in') ? 'active' : ''}`}
            style={{ cursor: 'pointer' }}
          >
            Sign in
          </Link>
          <Link href="/sign-up">
            <Button variant="primary" size="sm">Sign up</Button>
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="nav-mobile-btn"
          onClick={() => setOpen(o => !o)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          style={{ alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 6, background: 'transparent', color: 'var(--fg)' }}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="nav-mobile-menu">
          <div className="container col gap-1">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.id}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`nav-link ${isActive(pathname, l.href) ? 'active' : ''}`}
                style={{ padding: '10px 0', fontSize: 15, borderBottom: '0.5px solid var(--border)' }}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/sign-in"
              onClick={() => setOpen(false)}
              className={`nav-link ${isActive(pathname, '/sign-in') ? 'active' : ''}`}
              style={{ padding: '10px 0', fontSize: 15, borderBottom: '0.5px solid var(--border)' }}
            >
              Sign in
            </Link>
            <div style={{ paddingTop: 12 }}>
              <Link href="/sign-up" onClick={() => setOpen(false)}>
                <Button variant="primary" size="sm" style={{ width: '100%', justifyContent: 'center' }}>Sign up</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
