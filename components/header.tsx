'use client';

import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { SyncStatus } from '@/components/sync-status';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import  Sidebar  from '@/components/sidebar';
import { Menu, Bell, LogOut, User, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export function Header() {
  const { userDetails, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) return name.charAt(0).toUpperCase();
    if (email) return email.charAt(0).toUpperCase();
    return 'U';
  };

  const userName = userDetails?.name || userDetails?.email || 'Unknown User';
  const userEmail = userDetails?.email || 'No email';

  return (
    <header className='sticky top-0 z-40 border-b bg-background'>
      <div className='container flex h-16 items-center justify-between px-4'>
        {/* Left side: Mobile menu and App title */}
        <div className='flex items-center gap-4'>
          <div className='md:hidden'>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant='ghost' size='icon'>
                  <Menu className='h-5 w-5' />
                  <span className='sr-only'>Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side='left' className='p-0'>
                <Sidebar />
              </SheetContent>
            </Sheet>
          </div>
          <div className='hidden md:block'>
            <h1 className='text-lg font-semibold'>Restaurant SPA Management</h1>
          </div>
        </div>

        {/* Right side: Sync, Theme, Notifications, User Menu */}
        <div className='flex items-center space-x-4'>
          <SyncStatus />
          <ThemeToggle />

          <Button variant='ghost' size='icon'>
            <Bell className='h-5 w-5' />
            <span className='sr-only'>Notifications</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon' className='rounded-full'>
                <Avatar className='h-8 w-8'>
                  <AvatarFallback>
                    {getInitials(userDetails?.name, userDetails?.email)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuLabel>
                <div className='flex flex-col'>
                  <span className='text-sm font-medium'>{userName}</span>
                  <span className='text-xs text-muted-foreground'>
                    {userEmail}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/profile')}>
                <User className='mr-2 h-4 w-4' />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                <Settings className='mr-2 h-4 w-4' />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className='mr-2 h-4 w-4' />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
