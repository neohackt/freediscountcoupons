import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { OrganizationJsonLd } from "@/components/seo/OrganizationJsonLd";
import { WebSiteJsonLd } from "@/components/seo/WebSiteJsonLd";
import { BRAND_CONFIG, SITE_URL } from "@/lib/constants";
import { GoogleAnalytics } from '@next/third-parties/google';
import { ClarityProvider } from '@/components/analytics/ClarityProvider';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: BRAND_CONFIG.seo.title,
    template: BRAND_CONFIG.seo.titleTemplate,
  },
  description: BRAND_CONFIG.seo.description,
  keywords: [...BRAND_CONFIG.seo.keywords],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: BRAND_CONFIG.name,
    title: BRAND_CONFIG.seo.title,
    description: BRAND_CONFIG.seo.description,
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND_CONFIG.seo.title,
    description: BRAND_CONFIG.seo.description,
  },
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GSC_VERIFICATION || '',
    other: {
      'msvalidate.01': process.env.NEXT_PUBLIC_BING_VERIFICATION || '',
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-gray-50`}>
        <OrganizationJsonLd />
        <WebSiteJsonLd />
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || ''} />
        <ClarityProvider />
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}