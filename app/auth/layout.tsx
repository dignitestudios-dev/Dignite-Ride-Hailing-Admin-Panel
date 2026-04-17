"use client";

import { Logo } from "@/components/logo";
import GridShape from "@/components/grid-shape";
import { PublicRoute } from "@/components/PublicRoute";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PublicRoute>
      <div className="flex h-screen bg-background">
        {/* Left side - Form */}
        <div className="flex flex-1 items-center justify-center p-8">
          {children}
        </div>
        {/* Right side - Brand */}
        <div className="hidden h-full w-1/2 items-center bg-linear-to-tl from-primary to-secondary lg:grid">
          <div className="relative z-1 flex items-center justify-center">
            <GridShape />
            <div className="flex flex-col items-center max-w-xs">
              <div className="mb-6 flex h-50 w-50 items-center justify-center rounded-full bg-black/70">

              <Logo size={160} color="#ffffff" />
              </div>
              <h1 className="text-4xl font-semibold text-white">
                Admin Panel
              </h1>
              <p className="mt-2 text-center text-gray-100">
                Welcome to the Admin Panel. Please Sign in to Continue.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PublicRoute>
  );
}
