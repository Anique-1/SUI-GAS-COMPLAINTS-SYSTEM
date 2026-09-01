import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "SUI Gas Pipeline Pakistan - Gas Complaint System",
  description: "Official portal for recording, tracking, approving, and reviewing pipeline complaints for SUI Gas Pakistan.",
  icons: {
    icon: "/favicon.png",
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
