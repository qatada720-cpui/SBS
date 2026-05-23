'use client';

import { useEffect, type ReactNode } from 'react';

/** Official brand theme: dark mode + #0047FF accent */
export const BRAND_THEME = {
  mode: 'dark' as const,
  accentBlue: '#0047FF',
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', BRAND_THEME.mode);
    document.documentElement.style.setProperty('--blue', BRAND_THEME.accentBlue);
  }, []);

  return <>{children}</>;
}
