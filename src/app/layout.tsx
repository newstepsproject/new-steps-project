import type { Metadata, Viewport } from "next";
// Temporarily disabled Google Fonts due to network connectivity issues
// import { Inter, Montserrat, Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { Providers } from "./providers";
import { MobilePerformanceOptimizer } from "@/components/performance/MobilePerformanceOptimizer";

// Using system fonts as fallbacks to prevent terminal errors
const inter = { variable: "--font-inter" };
const montserrat = { variable: "--font-montserrat" };
const poppins = { variable: "--font-poppins" };

export const metadata: Metadata = {
  title: {
    default: "New Steps Project | Give New Life to Old Kicks",
    template: "%s | New Steps Project"
  },
  description: "Connect donated sports shoes with young athletes in need. Donate your gently used athletic footwear or request quality sports shoes at no cost. Making sports accessible for everyone.",
  keywords: [
    "donate sports shoes",
    "athletic footwear donation", 
    "youth athletes",
    "sports equipment sharing",
    "free sports shoes",
    "community sports support",
    "sustainable athletics",
    "shoe donation platform"
  ],
  authors: [{ name: "New Steps Project Team" }],
  creator: "New Steps Project",
  publisher: "New Steps Project",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://newsteps.fit"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://newsteps.fit",
    title: "New Steps Project | Give New Life to Old Kicks",
    description: "Connect donated sports shoes with young athletes in need. Making sports accessible for everyone through community-driven shoe sharing.",
    siteName: "New Steps Project",
    images: [
      {
        url: "/images/gpt-hero-image.png",
        width: 1200,
        height: 630,
        alt: "New Steps Project - Connecting athletes with quality sports shoes",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "New Steps Project | Give New Life to Old Kicks",
    description: "Connect donated sports shoes with young athletes in need. Making sports accessible for everyone.",
    images: ["/images/gpt-hero-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "google-site-verification-code", // Add your actual verification code
  },
  manifest: '/manifest.json',
  appleWebApp: {
    statusBarStyle: 'default',
    title: 'New Steps Project',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
  icons: {
    apple: '/images/logo.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#F97C5D',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Mobile Performance Optimizations */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Critical CSS inlined for mobile */}
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Critical CSS for mobile loading */
            body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
            .loading-spinner { 
              display: inline-block; 
              width: 20px; 
              height: 20px; 
              border: 2px solid #f3f3f3; 
              border-top: 2px solid #3498db; 
              border-radius: 50%; 
              animation: spin 1s linear infinite; 
            }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            /* Low bandwidth optimizations */
            .low-bandwidth img { filter: contrast(1.1) brightness(1.1); }
            .low-bandwidth video { display: none; }
          `
        }} />
      </head>
      <body 
        className={cn(
          inter.variable,
          montserrat.variable,
          poppins.variable,
          "min-h-screen bg-background font-sans antialiased"
        )}
        suppressHydrationWarning
      >
        <MobilePerformanceOptimizer>
          <Providers>
            {children}
          </Providers>
        </MobilePerformanceOptimizer>
        <Toaster />
      </body>
    </html>
  );
}