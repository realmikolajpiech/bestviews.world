import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
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
  title: 'BestViews.world — Find a view worth the journey',
  description:
    'Discover exact viewpoints, know when to go, and keep a personal map of the most remarkable views in the world.',
  openGraph: {
    title: 'BestViews.world — Find a view worth the journey',
    description: 'Discover exact viewpoints, know when to go, and map the remarkable views you experience.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'BestViews.world — Find a view worth the journey' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BestViews.world — Find a view worth the journey',
    description: 'Discover exact viewpoints, know when to go, and map the remarkable views you experience.',
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
