import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { SyncStatusProvider } from "@/components/sync-status-provider"
import { AuthProvider } from "@/lib/auth-context"
import { Session } from "inspector/promises"
import { SessionProvider } from "next-auth/react"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Spa & Restaurant Management System",
  description: "Offline-first management system for spa and restaurant businesses",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
       
          <AuthProvider>
            <SyncStatusProvider>
              <div className="flex min-h-screen flex-col">
                <Header />
                <div className="flex flex-1">
                  <Sidebar />
                  <main className="flex-1 overflow-y-auto bg-muted/20 pb-16">{children}</main>
                </div>
                <Toaster />
              </div>
            </SyncStatusProvider>
          </AuthProvider>
        
        </ThemeProvider>
      </body>
    </html>
  )
}
