'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmail } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/auth-context';

import {
  Loader2,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Flower2,
  ArrowRight,
} from 'lucide-react';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth ? useAuth() : { user: null, isLoading: false };

  useEffect(() => {
    if (user && !authLoading) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  async function handleServerAction(formData: FormData) {
    setIsLoading(true);
    setError('');
    const result = await signInWithEmail(formData);
    setIsLoading(false);
    if (result.error) {
      setError(result.error.message);
      toast({
        title: 'Sign in failed',
        description: result.error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Welcome back!',
        description: 'You have been successfully signed in.',
      });
      // Force a full reload to ensure auth context picks up the new session
      window.location.href = '/dashboard';
    }
  }

  if (authLoading || (user && !authLoading)) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-4' aria-busy='true' aria-live='polite'>
        <Loader2 className='h-10 w-10 animate-spin text-emerald-600' />
        <span className='sr-only'>Redirecting to dashboard...</span>
      </div>
    );
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-4'>
      {/* Animated Background Elements */}
      <div className='pointer-events-none absolute inset-0 overflow-hidden'>
        <div className='absolute left-1/4 top-1/4 h-96 w-96 animate-pulse rounded-full bg-emerald-500/10 blur-3xl'></div>
        <div
          className='absolute bottom-1/4 right-1/4 h-80 w-80 animate-pulse rounded-full bg-amber-500/10 blur-3xl'
          style={{ animationDelay: '1s' }}
        ></div>
      </div>

      <div className='relative z-10 w-full max-w-md space-y-8'>
        <div className='mb-10 text-center'>
          <div className='mb-4 inline-flex items-center justify-center'>
            <div className='relative'>
              <div className='absolute inset-0 rounded-full bg-emerald-500/20 blur-lg'></div>
              <Flower2 className='relative h-12 w-12 text-emerald-600' />
            </div>
          </div>
          <div>
            <span className='text-3xl font-light tracking-wide text-gray-800'>
              LEWA
            </span>
            <span className='text-md -mt-1 block font-medium text-emerald-600'>
              HEALTH SPA
            </span>
          </div>
        </div>

        <Card className='animate-slide-up relative overflow-hidden rounded-2xl border-0 bg-white/80 shadow-2xl backdrop-blur-lg'>
          <CardHeader className='space-y-1 text-center'>
            <CardTitle className='text-2xl font-bold tracking-tight'>
              Welcome Back
            </CardTitle>
            <CardDescription>
              Enter your credentials to access your dashboard.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form action={handleServerAction} className='space-y-4' aria-busy={isLoading} aria-live='polite'>
              {error && (
                <Alert variant='destructive'>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className='space-y-2'>
                <Label htmlFor='email'>Email</Label>
                <div className='relative'>
                  <Mail className='absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400' />
                  <Input
                    id='email'
                    name='email'
                    type='email'
                    placeholder='your.email@example.com'
                    required
                    disabled={isLoading}
                    className='h-12 pl-10'
                  />
                </div>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='password'>Password</Label>
                <div className='relative'>
                  <Lock className='absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400' />
                  <Input
                    id='password'
                    name='password'
                    type={showPassword ? 'text' : 'password'}
                    placeholder='••••••••'
                    required
                    disabled={isLoading}
                    className='h-12 pl-10'
                  />
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-gray-500'
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className='h-5 w-5' />
                    ) : (
                      <Eye className='h-5 w-5' />
                    )}
                  </Button>
                </div>
              </div>
              <Button
                type='submit'
                className='text-md h-12 w-full'
                disabled={isLoading}
                aria-busy={isLoading}
              >
                {isLoading ? (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                ) : (
                  'Sign In'
                )}
                {!isLoading && <ArrowRight className='ml-2 h-4 w-4' />}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
