import type { Metadata } from "next";
import "./globals.css";
import RouteShell from "@/components/layout/RouteShell";

const siteUrl = "https://app.web3mb.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "WEB3MB Transparency Center | Crypto Wallet Verification & Trust Scores",
    template: "%s | WEB3MB Transparency Center",
  },
  description:
    "WEB3MB helps crypto projects verify wallets, publish investor-facing transparency dashboards, earn trust seal awards, and build public trust with explainable trust scores.",
  keywords: [
    "crypto transparency",
    "wallet verification",
    "Solana transparency",
    "crypto trust score",
    "token verification",
    "blockchain compliance",
    "crypto audit dashboard",
    "wallet ownership proof",
    "Web3 trust",
    "meme coin transparency",
    "project wallet monitoring",
    "investor transparency dashboard",
  ],
  applicationName: "WEB3MB Transparency Center",
  creator: "WEB3MB",
  publisher: "WEB3MB",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: "WEB3MB Transparency Center",
    description:
      "Crypto wallet verification, trust scores, trust seal awards, and investor-facing transparency dashboards.",
    url: siteUrl,
    siteName: "WEB3MB Transparency Center",
    images: [
      {
        url: "/WEB3MB-L.png",
        width: 1200,
        height: 630,
        alt: "WEB3MB Transparency Center",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WEB3MB Transparency Center",
    description:
      "Verify crypto project wallets, publish public trust dashboards, and earn WEB3MB trust seal awards.",
    images: ["/WEB3MB-L.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#050816] text-white antialiased">
        <RouteShell>{children}</RouteShell>
      </body>
    </html>
  );
}
