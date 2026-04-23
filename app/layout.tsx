import type { Metadata } from "next";
import "./globals.css";
import RouteShell from "@/components/layout/RouteShell";

export const metadata: Metadata = {
  title: "WEB3MB Transparency Center",
  description:
    "WEB3MB Transparency Center — public trust dashboards, wallet disclosure, and investor-facing crypto transparency.",
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
