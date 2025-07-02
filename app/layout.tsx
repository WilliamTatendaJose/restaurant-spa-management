import type React from 'react';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ProvidersWrapper } from '@/components/providers-wrapper';
import { ConditionalLayout } from '@/components/conditional-layout';
import Head from 'next/head';
import lewa_logo from '@/public/lewa_logo.png';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://lewa.co.zw'),
  title: 'Lewa Health Spa',
  description:
    'Lewa Health Spa is a spa and restaurant business that provides a range of services to its customers.',
  keywords: [
    'Lewa Health Spa',
    'Lewa',
    'Health Spa',
    'Spa',
    'Health',
    'Lewa Health Spa',
    'Lewa Health Spa',
    'Luxury Spa',
    'Luxury',
    'Spa',
    'Massage',
    'Facial',
    'Body Treatments',
    'Body Massage',
    'Body Treatments',
    'Health',
    'Lewa Health Spa',
    'Harare',
    'Harare Spa',
    'Harare Spa',
    'Harare Spa',
    'Luxury Spa',
    'Spa management',
    'Restaurant management',
    'Point of sale',
    'Booking system',
    'Offline-first',
    'Supabase',
    'Next.js',
  ],
  authors: [{ name: 'William Jose', url: 'https://techrehub.co.zw' }],
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
    title: 'Lewa Health Spa',
    description:
      'Lewa Health Spa is a spa and restaurant business that provides a range of services to its customers.',
    type: 'website',
    url: 'https://lewa.co.zw',
    images: [
      {
        url: '/lewa_logo.png', 
        width: 800,
        height: 600,
        alt: 'Lewa Health Spa Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Spa & Restaurant Management System',
    description:
      'Offline-first management system for spa and restaurant businesses with Supabase sync',
    creator: '@williamjose',
    images: ['/lewa_logo.png'],
  },
  generator: '  ',
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
