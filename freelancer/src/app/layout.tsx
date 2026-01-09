// src/app/layout.tsx - Root Layout
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AuthBridge from '@/components/AuthBridge';
import { Suspense } from 'react';
import UnifiedAuthBridge from '@/components/UnifiedAuthBridge';


const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'JobDekho - Your Gateway to Freelance Opportunities',
  description: 'JobDekho connects talented freelancers with clients worldwide. Find your dream projects or hire skilled professionals. Join India\'s premier freelance marketplace today.',
  keywords: 'JobDekho, freelance jobs, hire freelancers, remote work, freelance marketplace, find jobs, freelance opportunities, India jobs',
  authors: [{ name: 'JobDekho Team' }],
  openGraph: {
    title: 'JobDekho - Your Gateway to Freelance Opportunities',
    description: 'Connect with talented freelancers or find your next project. JobDekho - India\'s premier freelance marketplace.',
    type: 'website',
    locale: 'en_IN',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={null}>
          <UnifiedAuthBridge />
        </Suspense>
        {children}
      </body>
    </html>
  );
}