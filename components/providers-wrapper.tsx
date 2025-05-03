'use client'

import { SessionProvider } from "next-auth/react"
import { SyncStatusProvider } from "@/components/sync-status-provider"
import { AuthProvider } from "@/lib/auth-context"
import type { ReactNode } from "react"

export function ProvidersWrapper({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <SyncStatusProvider>
          {children}
        </SyncStatusProvider>
      </AuthProvider>
    </SessionProvider>
  )
}