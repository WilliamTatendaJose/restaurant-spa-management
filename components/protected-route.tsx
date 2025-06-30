'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  allowedRoles?: string[];
}

export default function ProtectedRoute({
  children,
  redirectTo = '/login',
  allowedRoles = [],
}: ProtectedRouteProps) {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUserRole = async () => {
      setIsLoading(true);
      const supabase = createClientComponentClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        router.push(redirectTo);
        return;
      }
      // Fetch the user's role from user_profiles table
      const { data, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (error || !data) {
        setIsLoading(false);
        router.push('/unauthorized');
        return;
      }
      setUserRole(data.role);
      setIsLoading(false);
      if (!allowedRoles.includes(data.role)) {
        router.push('/unauthorized');
      }
    };
    fetchUserRole();
  }, [allowedRoles, redirectTo, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2 text-muted-foreground">Verifying access...</p>
      </div>
    );
  }

  if (!userRole || !allowedRoles.includes(userRole)) {
    return null;
  }

  return <>{children}</>;
}
