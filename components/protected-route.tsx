'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  allowedRoles?: string[];
}

export default function ProtectedRoute({
  children,
  redirectTo = '/login',
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push(redirectTo);
      } else if (allowedRoles && (!user.role || !allowedRoles.includes(user.role))) {
        router.push('/unauthorized');
      }
    }
  }, [user, isLoading, router, redirectTo, allowedRoles]);

  if (
    isLoading ||
    !user ||
    (allowedRoles && (!user.role || !allowedRoles.includes(user.role)))
  ) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='space-y-4 text-center'>
          <Loader2 className='mx-auto h-8 w-8 animate-spin' />
          <p className='text-muted-foreground'>Verifying access...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
