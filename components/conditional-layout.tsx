'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';
import ProtectedRoute from '@/components/protected-route';

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Pages that don't need authentication or layout
  const publicPages = ['/login', '/', '/treatments'];
  const isPublicPage = publicPages.includes(pathname);

  // If it's a public page, render without layout or protection
  if (isPublicPage) {
    return <>{children}</>;
  }

  // For all other pages, wrap with authentication and layout
  return (
    <ProtectedRoute>
      <div className='flex min-h-screen bg-background'>
        <div className='hidden md:flex'>
          <Sidebar />
        </div>
        <div className='flex flex-1 flex-col'>
          <Header />
          <main className='flex-1 overflow-auto'>{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
