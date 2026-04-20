import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WEB3MB Transparency Center",
  description: "Real-time crypto transparency and investor protection platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-black text-white min-h-screen">{children}</body>
    </html>
  );
}
