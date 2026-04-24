import Link from "next/link";
import type { ReactNode } from "react";

const workspaceItems = [
  { label: "Dashboard", href: "/app" },
  { label: "My Projects", href: "/app/projects", badge: "LIVE" },
  { label: "Create Project", href: "/app/projects/new", primary: true },
];

const operationsItems = [
  { label: "Public Directory", href: "/transparency" },
  { label: "Wallet Verification", href: "/app/verify-wallets" },
  { label: "Alert Center", href: "/app/alerts" },
  { label: "Billing", href: "/app/billing", badge: "NEW" },
];

export default function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#030712] text-white">
      {/* Desktop Sidebar */}
      <aside className="hidden w-[310px] shrink-0 border-r border-white/10 bg-[#050816] xl:block">
        <div className="flex min-h-screen flex-col">
          {/* Logo Section */}
          <div className="px-6 py-8">
            <img
              src="https://web3mb.com/wp-content/uploads/2026/04/WEB3MB-L.png"
              alt="WEB3MB Logo"
              className="h-24 w-auto object-contain"
            />

            <div className="mt-5 inline-flex rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs uppercase tracking-[0.22em] text-cyan-300">
              Enterprise Console
            </div>

            <p className="mt-5 text-sm leading-7 text-zinc-400">
              Manage token projects, public trust dashboards, wallet disclosures,
              and compliance workflows from one unified platform.
            </p>
          </div>

          {/* Workspace */}
          <div className="border-t border-white/10 px-6 py-6">
            <div className="mb-4 text-xs uppercase tracking-[0.24em] text-cyan-300">
              Workspace
            </div>

            <div className="space-y-3">
              {workspaceItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    item.primary
                      ? "flex items-center justify-between rounded-xl border border-white/10 bg-white px-4 py-4 text-sm font-semibold text-black transition hover:bg-zinc-200"
                      : "flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-sm font-semibold text-white transition hover:bg-white/10"
                  }
                >
                  <span>{item.label}</span>

                  {item.badge ? (
                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[10px] tracking-[0.18em] text-cyan-300">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              ))}
            </div>
          </div>

          {/* Operations */}
          <div className="border-t border-white/10 px-6 py-6">
            <div className="mb-4 text-xs uppercase tracking-[0.24em] text-cyan-300">
              Operations
            </div>

            <div className="space-y-3">
              {operationsItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <span>{item.label}</span>

                  {item.badge ? (
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] tracking-[0.18em] text-emerald-300">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              ))}
            </div>
          </div>

          {/* Support */}
          <div className="mt-auto border-t border-white/10 px-6 py-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">
                Support
              </div>

              <div className="mt-3 text-xs font-semibold text-white break-all">
                verify@web3mb.com
              </div>

              <p className="mt-3 text-sm leading-6 text-zinc-400">
                Contact us for trust verification, onboarding help, enterprise
                integrations, and technical support.
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#050816] px-4 py-4 xl:hidden">
        <div className="flex items-center justify-between">
          <img
            src="https://web3mb.com/wp-content/uploads/2026/04/WEB3MB-L.png"
            alt="WEB3MB Logo"
            className="h-12 w-auto object-contain"
          />

          <Link
            href="/app/billing"
            className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-black"
          >
            Billing
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main className="min-w-0 flex-1 pt-20 xl:pt-0">
        {children}
      </main>
    </div>
  );
}
