import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarProvider } from "@/contexts/sidebar-context";
import { GlobalSidebar } from "@/components/layout/GlobalSidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BlogCanvas - AI-Powered Content at Scale",
  description: "Create, manage, and publish high-quality blog content with AI assistance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SidebarProvider>
          <GlobalSidebar />
          <main className="lg:pl-64 transition-all duration-300 min-h-screen">
            {children}
          </main>
        </SidebarProvider>
      </body>
    </html>
  );
}
