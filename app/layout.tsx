import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ProvidersWrapper } from "@/components/providers-wrapper";
import { ConditionalLayout } from "@/components/conditional-layout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Spa & Restaurant Management System",
  description:
    "Offline-first management system for spa and restaurant businesses with Supabase sync",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ProvidersWrapper>
          <ConditionalLayout>{children}</ConditionalLayout>
        </ProvidersWrapper>
      </body>
    </html>
  );
}
