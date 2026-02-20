import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { RegisterServiceWorker } from "./register-sw";
import { MetaPixel } from "@/components/tracking/MetaPixel";
import { QueryProvider } from "@/providers/query-provider";

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
  manifest: "/manifest.json",
  themeColor: "#4f46e5",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BlogCanvas",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const fbPixelId = process.env.NEXT_PUBLIC_FB_PIXEL_ID;

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {fbPixelId && <MetaPixel pixelId={fbPixelId} />}
        <RegisterServiceWorker />
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
