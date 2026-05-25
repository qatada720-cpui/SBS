'use client';

import { usePathname } from 'next/navigation';
import { Nav } from '@/components/layout/nav';
import { Footer } from '@/components/layout/footer';
const HIDE_FOOTER = ['/', '/dashboard', '/seller/dashboard', '/buyer/dashboard', '/seller/onboarding', '/messages'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showFooter = !HIDE_FOOTER.includes(pathname);

  return (
    <>
      <Nav />
      <main className="page-enter">{children}</main>
      {showFooter && <Footer />}
    </>
  );
}
