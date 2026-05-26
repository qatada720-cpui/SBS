import type { Metadata } from 'next';
import { DM_Sans, Instrument_Serif, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { AppShell } from '@/components/providers/app-shell';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600'],
  display: 'swap',
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: '400',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SafeBusineSSSelling — Safely buy & sell businesses',
  description: 'A premium B2B marketplace where entrepreneurs safely buy and sell businesses.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" className={`${dmSans.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}>
      <body>
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
