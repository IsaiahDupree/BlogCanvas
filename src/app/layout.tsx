import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { RegisterServiceWorker } from "./register-sw";
import { MetaPixel } from "@/components/tracking/MetaPixel";
import { QueryProvider } from "@/providers/query-provider";
import { WebVitals } from "@/components/analytics/WebVitals";
import { StructuredData } from "@/components/seo/StructuredData";
import { ThemeProvider } from "@/contexts/theme-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "BlogCanvas - AI-Powered Content at Scale",
    template: "%s | BlogCanvas",
  },
  description: "Create, manage, and publish high-quality blog content with AI assistance. Streamline your content workflow with intelligent automation.",
  keywords: ["blog management", "content creation", "AI content", "blog automation", "content marketing"],
  authors: [{ name: "BlogCanvas Team" }],
  creator: "BlogCanvas",
  publisher: "BlogCanvas",
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
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://blogcanvas.com",
    title: "BlogCanvas - AI-Powered Content at Scale",
    description: "Create, manage, and publish high-quality blog content with AI assistance",
    siteName: "BlogCanvas",
  },
  twitter: {
    card: "summary_large_image",
    title: "BlogCanvas - AI-Powered Content at Scale",
    description: "Create, manage, and publish high-quality blog content with AI assistance",
    creator: "@blogcanvas",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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
      <head>
        <StructuredData />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {fbPixelId && <MetaPixel pixelId={fbPixelId} />}
        <RegisterServiceWorker />
        <WebVitals />
        <ThemeProvider>
          <QueryProvider>
            {children}
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
