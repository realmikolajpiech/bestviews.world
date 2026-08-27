import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import 'maplibre-gl/dist/maplibre-gl.css';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://bestviews.world'),
  title: 'BestViews.world — Find the best views anywhere',
  description:
    'Discover views shared by people, save the places that move you, and share exactly where you stood.',
  openGraph: {
    title: 'BestViews.world — Find the best views anywhere',
    description: 'The world’s most memorable views, shared by people who stood there.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'BestViews.world — Find the best views anywhere' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BestViews.world — Find the best views anywhere',
    description: 'The world’s most memorable views, shared by people who stood there.',
    images: ['/og.png'],
  },
};

export const viewport: Viewport = { themeColor: '#17201a' };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
