import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Hukan SEO Auditor — Professional Website SEO Audits",
    template: "%s | Hukan SEO Auditor",
  },
  description:
    "Comprehensive SEO audits for KES 500. Technical SEO, on-page, performance, structured data, and AI search readiness. Download a professional PDF report.",
  keywords: [
    "SEO audit",
    "website audit",
    "Kenya SEO",
    "technical SEO",
    "on-page SEO",
    "SEO report",
  ],
  authors: [{ name: "Hukan" }],
  openGraph: {
    type: "website",
    locale: "en_KE",
    siteName: "Hukan SEO Auditor",
    title: "Hukan SEO Auditor — Professional Website SEO Audits",
    description:
      "Comprehensive SEO audits for KES 500. Get a detailed professional PDF report.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hukan SEO Auditor",
    description: "Professional SEO audits for KES 500.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
