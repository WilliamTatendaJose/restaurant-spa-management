import type React from 'react';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ProvidersWrapper } from '@/components/providers-wrapper';
import { ConditionalLayout } from '@/components/conditional-layout';
import Head from 'next/head';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://restaurant-spa-management.vercel.app'),
  title: 'Spa & Restaurant Management System',
  description:
    'Offline-first management system for spa and restaurant businesses with Supabase sync',
  keywords: [
    'Spa management',
    'Restaurant management',
    'Point of sale',
    'Booking system',
    'Offline-first',
    'Supabase',
    'Next.js',
  ],
  authors: [{ name: 'William Jose', url: 'https://www.williamjose.com' }],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'Spa & Restaurant Management System',
    description:
      'Offline-first management system for spa and restaurant businesses with Supabase sync',
    type: 'website',
    url: 'https://restaurant-spa-management.vercel.app',
    images: [
      {
        url: '/placeholder-logo.png', // Replace with your actual logo URL
        width: 800,
        height: 600,
        alt: 'Spa & Restaurant Management System Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Spa & Restaurant Management System',
    description:
      'Offline-first management system for spa and restaurant businesses with Supabase sync',
    creator: '@williamjose',
    images: ['/placeholder-logo.png'], // Replace with your actual logo URL
  },
  generator: 'v0.dev',
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#059669" />
        <link rel="apple-touch-icon" href="/placeholder-logo.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </Head>
      <html lang='en' suppressHydrationWarning>
        <body className={inter.className}>
          <ProvidersWrapper>
            <ConditionalLayout>{children}</ConditionalLayout>
          </ProvidersWrapper>
        </body>
      </html>
    </>
  );
}
