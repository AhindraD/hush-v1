import type { Metadata } from 'next';
import './globals.css';
import { HushProvider } from '@/providers';

export const metadata: Metadata = {
  title: 'HUSH — Silent Philanthropy',
  description:
    'Confidential Philanthropy Engine on Solana. Stealth deposits, private ephemeral rollups, AI yield optimization, and ZK-Tax-Receipt compliance.',
  metadataBase: new URL('https://hush.finance'),
  openGraph: {
    title: 'HUSH — Silent Philanthropy',
    description: 'Give generously. Stay private.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HUSH — Silent Philanthropy',
    description: 'Give generously. Stay private.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Font preconnects */}
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-body antialiased">
        <HushProvider>{children}</HushProvider>
      </body>
    </html>
  );
}
