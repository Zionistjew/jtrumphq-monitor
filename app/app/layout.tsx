import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";

type AppLayoutProps = {
  children: ReactNode;
};

const navItems = [
  {
    section: "Workspace",
    links: [
      { label: "Dashboard", href: "/app" },
      { label: "My Projects", href: "/app/projects", badge: "Live" },
      { label: "Create Project", href: "/app/projects/new", primary: true },
    ],
  },
  {
    section: "Operations",
    links: [
      { label: "Public Directory", href: "/transparency" },
      { label: "Wallet Verification", href: "/app/verify-wallets" },
      { label: "Alert Center", href: "/app/alerts" },
    ],
  },
];

function NavLink({
  label,
  href,
  badge,
  primary = false,
}: {
  label: string;
  href: string;
  badge?: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        primary
          ? "flex items-center justify-between rounded-2xl border border-white/70 bg-white px-5 py-4 font-semibold text-black hover:bg-zinc-200"
          : "flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 font-semibold text-white hover:border-cyan-400/30 hover:bg-white/[0.08]"
      }
    >
      <span>{label}</span>

      {badge ? (
        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-cyan-300">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-[300px] shrink-0 border-r border-white/10 bg-[#030612]/95 xl:flex xl:flex-col">
          <div className="border-b border-white/10 px-6 py-7">
            <Image
              src="/branding/web3mb-logo.png"
              alt="WEB3MB"
              width={220}
              height={70}
              className="h-auto w-auto"
              priority
            />

            <div className="mt-6 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-cyan-300">
              Enterprise Console
            </div>

            <p className="mt-5 text-sm leading-8 text-zinc-400">
              Manage projects, public trust dashboards, disclosures, and
              monitoring workflows from one connected workspace.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-7">
            <div className="space-y-8">
              {navItems.map((group) => (
                <div key={group.section}>
                  <div className="mb-4 text-xs uppercase tracking-[0.22em] text-cyan-300/80">
                    {group.section}
                  </div>

                  <div className="space-y-3">
                    {group.links.map((item) => (
                      <NavLink
                        key={`${group.section}-${item.label}`}
                        label={item.label}
                        href={item.href}
                        badge={item.badge}
                        primary={item.primary}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-white/10 px-6 py-6">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <div className="text-xs uppercase tracking-[0.22em] text-cyan-300/80">
                Support
              </div>

              <a
                href="mailto:verify@web3mb.com"
                className="mt-4 block whitespace-nowrap text-[12px] font-semibold text-white hover:text-cyan-300"
              >
                verify@web3mb.com
              </a>

              <p className="mt-4 text-sm leading-7 text-zinc-400">
                Use this contact for verification support, platform setup, and
                dashboard assistance.
              </p>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {children}
        </div>
      </div>
    </div>
  );
}
