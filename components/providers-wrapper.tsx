'use client';

import { AuthProvider } from '@/lib/auth-context';
import { SyncStatusProvider } from '@/components/sync-status-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';

export function ProvidersWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
      <AuthProvider>
        <SyncStatusProvider>
          {children}
          <Toaster />
        </SyncStatusProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
