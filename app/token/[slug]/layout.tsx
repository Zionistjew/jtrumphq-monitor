"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";

const LOGO_URL =
  "https://web3mb.com/wp-content/uploads/2026/04/WEB3MB-L.png";

const workspaceItems = [
  { label: "Dashboard", href: "/app" },
  { label: "My Projects", href: "/app/projects", badge: "LIVE" },
  { label: "Create Project", href: "/app/billing", active: true },
];

const operationItems = [
  { label: "Public Directory", href: "/transparency" },
  { label: "Wallet Verification", href: "/app/verify-wallets" },
  { label: "Alert Center", href: "/app/alerts" },
  { label: "Billing", href: "/app/billing", badge: "NEW" },
];

function SidebarContent({ onClick }: { onClick?: () => void }) {
  return (
    <div className="flex min-h-full flex-col">
      <div className="p-5 sm:p-6">
        <Link href="/app" onClick={onClick} className="block">
          <img
            src={LOGO_URL}
            alt="WEB3MB Transparency Center"
            className="h-20 w-auto object-contain sm:h-24"
          />
        </Link>

        <div className="mt-5 inline-flex rounded-full border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
          Enterprise Console
        </div>

        <p className="mt-5 text-sm leading-7 text-zinc-300">
          Manage token projects, public trust dashboards, wallet disclosures,
          and compliance workflows from one unified platform.
        </p>
      </div>

      <div className="border-t border-white/10 px-5 py-5 sm:px-6">
        <div className="mb-4 text-xs font-black uppercase tracking-[0.3em] text-cyan-300">
          Workspace
        </div>

        <nav className="space-y-3">
          {workspaceItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClick}
              className={
                item.active
                  ? "flex items-center justify-between rounded-xl bg-white px-4 py-4 text-sm font-black text-black transition hover:bg-zinc-200"
                  : "flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-sm font-black text-white transition hover:bg-white/10"
              }
            >
              <span>{item.label}</span>
              {item.badge ? (
                <span className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-cyan-300">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t border-white/10 px-5 py-5 sm:px-6">
        <div className="mb-4 text-xs font-black uppercase tracking-[0.3em] text-cyan-300">
          Operations
        </div>

        <nav className="space-y-3">
          {operationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClick}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-sm font-black text-white transition hover:bg-white/10"
            >
              <span>{item.label}</span>
              {item.badge ? (
                <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-300">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t border-white/10 p-5 sm:p-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
            Support
          </div>

          <div className="mt-4 text-sm font-black text-white">
            verify@web3mb.com
          </div>

          <p className="mt-3 text-xs leading-6 text-zinc-400">
            Contact us for trust verification, onboarding help, enterprise
            integrations, and technical support.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function TokenLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <div className="sticky top-0 z-50 flex items-center justify-between border-b border-white/10 bg-[#070b1a]/95 px-4 py-3 backdrop-blur lg:hidden">
        <Link href="/app">
          <img
            src={LOGO_URL}
            alt="WEB3MB"
            className="h-12 w-auto object-contain"
          />
        </Link>

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white"
        >
          Menu
        </button>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-[100] bg-black/70 lg:hidden">
          <div className="flex h-full w-[86vw] max-w-sm flex-col overflow-y-auto border-r border-white/10 bg-[#070b1a]">
            <div className="flex items-center justify-end border-b border-white/10 p-4">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black"
              >
                Close
              </button>
            </div>

            <SidebarContent onClick={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex min-h-screen">
        <aside className="hidden w-[300px] shrink-0 flex-col border-r border-white/10 bg-[#070b1a] lg:flex">
          <SidebarContent />
        </aside>

        <section className="min-w-0 flex-1">{children}</section>
      </div>
    </div>
  );
}
