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
        <div className="hidden h-full w-1/2 items-center bg-primary lg:grid">
          <div className="relative z-1 flex items-center justify-center">
            <GridShape />
            <div className="flex flex-col items-center max-w-xs">
              <Logo size={100} color="#ffffff" />
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
