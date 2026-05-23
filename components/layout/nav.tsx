'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button, Logo } from '@/components/ui';
import { NAV_LINKS } from '@/lib/routes';

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Nav({ transparent = false }: { transparent?: boolean }) {
  const pathname = usePathname();

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
        <div className="row gap-8" style={{ alignItems: 'center' }}>
          <Link href="/" className="row gap-3" style={{ cursor: 'pointer' }}>
            <Logo size={0.9} />
          </Link>
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

        <div className="row gap-4" style={{ alignItems: 'center' }}>
          <Link
            href="/sign-in"
            className={`nav-link ${isActive(pathname, '/sign-in') ? 'active' : ''}`}
            style={{ cursor: 'pointer' }}
          >
            Sign in
          </Link>
          <Link href="/sign-up">
            <Button variant="primary" size="sm">
              Sign up
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
