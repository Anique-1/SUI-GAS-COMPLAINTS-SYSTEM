import type { Metadata, Viewport } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    default: "SNGPL Gas Complaint & Emergency Portal | Sui Northern Gas Pipelines Limited",
    template: "%s | SNGPL Portal"
  },
  description: "Official portal for recording, tracking, resolving, and auditing emergency 1199 pipeline complaints, gas leaks, bill disputes, and FIR records for SNGPL Pakistan.",
  keywords: [
    "SNGPL",
    "Sui Northern Gas Pipelines Limited",
    "Sui Gas Complaint",
    "1199 Emergency Helpline",
    "Gas Leak Complaint",
    "Bill Dispute",
    "Sui Gas Online Portal"
  ],
  authors: [{ name: "Sui Northern Gas Pipelines Limited" }],
  creator: "SNGPL",
  publisher: "SNGPL Pakistan",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: {
    icon: "/favicon.png",
    apple: "/sngpl-logo.png",
  },
  openGraph: {
    type: "website",
    locale: "en_PK",
    url: "https://sngpl1.vercel.app",
    title: "SNGPL Gas Complaint & Emergency Portal",
    description: "Official portal for recording, tracking, resolving, and auditing emergency 1199 pipeline complaints, gas leaks, and bill disputes for SNGPL Pakistan.",
    siteName: "SNGPL Portal",
    images: [
      {
        url: "/sngpl-logo.png",
        width: 800,
        height: 600,
        alt: "SNGPL Official Logo",
      },
    ],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "google3dfce55e56b5a06d",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {/* Premium background glowing orbs */}
        <div className="bg-glow-container">
          <div className="bg-glow-orb-1"></div>
          <div className="bg-glow-orb-2"></div>
        </div>
        {children}
      </body>
    </html>
  );
}
