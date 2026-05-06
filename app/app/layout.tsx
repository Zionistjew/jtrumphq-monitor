import Link from "next/link";
import type { ReactNode } from "react";

const navItems = [
  { label: "Dashboard", href: "/app" },
  { label: "My Projects", href: "/app/projects" },
  { label: "Create Project", href: "/app/billing", primary: true },
  { label: "Public Directory", href: "/transparency" },
  { label: "Wallet Verification", href: "/app/verify-wallets" },
  { label: "Alert Center", href: "/app/alerts" },
];

const LOGO_URL =
  "https://web3mb.com/wp-content/uploads/2026/04/WEB3MB-L.png";

export default function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-black/30 p-5 lg:block">
          <div className="mb-8">
            <Link href="/app" className="block">
              <img
                src={LOGO_URL}
                alt="WEB3MB"
                className="h-20 w-auto object-contain"
              />
            </Link>

            <div className="mt-5 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">
              WEB3MB
            </div>

            <div className="mt-2 text-lg font-bold">
              Transparency Center
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  item.primary
                    ? "block rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/15"
                    : "block rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200 transition hover:bg-white/10"
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <section className="min-w-0 flex-1">{children}</section>
      </div>
    </div>
  );
}
