import type { Metadata } from 'next';
import { Baloo_2, Mukta, Tiro_Devanagari_Hindi } from 'next/font/google';
import './globals.css';
import AppProviders from '@/components/AppProviders';
import DevBanner from '@/components/ui/DevBanner';

const baloo2 = Baloo_2({
  subsets: ['latin', 'devanagari'],
  variable: '--font-baloo2',
  display: 'swap',
});

const mukta = Mukta({
  subsets: ['latin', 'devanagari'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mukta',
  display: 'swap',
});

const tiroDevanagariHindi = Tiro_Devanagari_Hindi({
  subsets: ['latin', 'devanagari'],
  variable: '--font-tiro-devanagari-hindi',
  display: 'swap',
  weight: '400',
});

export const metadata: Metadata = {
  title: 'Aksharvan',
  description: 'Hindi phonics learning app for children',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hi">
      <body
        className={`${baloo2.variable} ${mukta.variable} ${tiroDevanagariHindi.variable} font-mukta`}
      >
        <AppProviders>
          <DevBanner />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
