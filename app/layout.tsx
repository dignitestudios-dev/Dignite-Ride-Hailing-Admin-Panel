import type { Metadata } from "next";
import { Geist, Geist_Mono, Figtree } from "next/font/google";
import "./globals.css";
import "./nprogress.css";
import { SidebarConfigProvider } from "@/contexts/sidebar-context";
import { Providers } from "@/components/providers";
import { ProgressBar } from "@/components/progress-bar";
import { ConnectionStatus } from "@/components/connection-status";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ride Hailing - Admin Panel",
  description:
    "This is the ride hailing app, admin dashboard by dignite studios",
  icons: {
    icon: "/images/logo.png",
  },
  robots: "noindex, nofollow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={figtree.variable} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ProgressBar />
        <ConnectionStatus />
        <Providers>
          <SidebarConfigProvider>{children}</SidebarConfigProvider>
        </Providers>
      </body>
    </html>
  );
}
