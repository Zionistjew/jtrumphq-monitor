"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Project = {
  id: string | number;
  name: string;
  symbol: string;
  slug: string;
  mint?: string;
  description?: string;
};

type SubscriptionStatus = {
  ok?: boolean;
  authenticated?: boolean;
  subscription?: {
    plan: string;
    plan_label: string;
    status: string;
    starts_at?: string | null;
    ends_at?: string | null;
    renewal_date?: string | null;
    wallet_address?: string;
  } | null;
  usage?: {
    project_limit: number;
    projects_used: number;
    projects_remaining: number;
    project_usage_percent: number;
    wallet_limit: number;
    wallets_used: number;
    wallets_remaining: number;
    wallet_usage_percent: number;
    upgrade_required: boolean;
  };
  upgrade?: {
    recommended: boolean;
    target: string | null;
  };
};

function shortAddress(value?: string) {
  if (!value) return "—";
  return `${value.slice(0, 6)}...${value.slice(-6)}`;
}

function formatDate(value?: string | null) {
  if (!value) return "No renewal date";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatLimit(value?: number) {
  if (!value) return "0";
  if (value >= 999999) return "Unlimited";
  return String(value);
}

export default function AppHome() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [projectsRes, subscriptionRes] = await Promise.allSettled([
          fetch("/api/app/projects", {
            credentials: "include",
            cache: "no-store",
          }),
          fetch("/api/app/subscription", {
            credentials: "include",
            cache: "no-store",
          }),
        ]);

        if (projectsRes.status === "fulfilled") {
          const data = await projectsRes.value.json().catch(() => null);
          if (projectsRes.value.ok) {
            setProjects(data?.projects || []);
          }
        }

        if (subscriptionRes.status === "fulfilled") {
          const data = await subscriptionRes.value.json().catch(() => null);
          if (subscriptionRes.value.ok) {
            setSubscription(data);
          }
        }
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const planLabel =
    subscription?.subscription?.plan_label || "No Active Plan";

  const planStatus =
    subscription?.subscription?.status || "inactive";

  const renewalDate = subscription?.subscription?.renewal_date;
  const usage = subscription?.usage;
  const upgradeTarget = subscription?.upgrade?.target || "/app/billing";

  return (
    <main className="min-h-screen bg-[#030712] px-4 py-6 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl sm:p-8">
          <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">
            WEB3MB / OWNER HUB
          </div>

          <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
            WEB3MB Owner Dashboard
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-300">
            Manage crypto transparency projects, verify wallets, review alerts,
            and monitor public trust signals.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Link
              href="/app/projects"
              className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
            >
              <div className="text-lg font-semibold text-white">
                My Projects
              </div>
              <p className="mt-2 text-sm text-zinc-400">
                View and manage transparency projects.
              </p>
            </Link>

            <Link
              href="/app/billing"
              className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-5 transition hover:bg-cyan-500/15"
            >
              <div className="text-lg font-semibold text-cyan-200">
                Create Project
              </div>
              <p className="mt-2 text-sm text-zinc-400">
                Activate billing before onboarding a project.
              </p>
            </Link>

            <Link
              href="/app/verify-wallets"
              className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
            >
              <div className="text-lg font-semibold text-white">
                Wallet Verification
              </div>
              <p className="mt-2 text-sm text-zinc-400">
                Check live wallet balances and disclosures.
              </p>
            </Link>

            <Link
              href="/app/alerts"
              className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
            >
              <div className="text-lg font-semibold text-white">
                Alert Center
              </div>
              <p className="mt-2 text-sm text-zinc-400">
                Review critical transparency alerts.
              </p>
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-cyan-500/30 bg-cyan-500/10 p-6 shadow-2xl shadow-cyan-950/20 sm:p-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                  Subscription Status
                </div>

                <h2 className="mt-3 text-2xl font-black">
                  {loading ? "Loading Plan..." : `${planLabel} Plan`}
                </h2>

                <p className="mt-2 text-sm text-zinc-300">
                  Status:{" "}
                  <span className="font-black uppercase text-emerald-300">
                    {planStatus}
                  </span>
                </p>

                <p className="mt-1 text-sm text-zinc-400">
                  Renewal: {formatDate(renewalDate)}
                </p>
              </div>

              <span className="w-fit rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-emerald-300">
                Active
              </span>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <UsageMeter
                label="Projects Used"
                used={usage?.projects_used || 0}
                limit={usage?.project_limit || 0}
                percent={usage?.project_usage_percent || 0}
              />

              <UsageMeter
                label="Wallets Used"
                used={usage?.wallets_used || 0}
                limit={usage?.wallet_limit || 0}
                percent={usage?.wallet_usage_percent || 0}
              />
            </div>

            {usage?.upgrade_required ? (
              <div className="mt-6 rounded-2xl border border-orange-400/30 bg-orange-400/10 p-4">
                <div className="text-sm font-black text-orange-300">
                  Project limit reached
                </div>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  Your current plan has used all available project slots.
                  Upgrade to Growth to create up to 5 projects.
                </p>

                <Link
                  href={upgradeTarget}
                  className="mt-4 inline-flex rounded-xl bg-orange-400 px-5 py-3 text-sm font-black text-black hover:bg-orange-300"
                >
                  Upgrade Plan
                </Link>
              </div>
            ) : (
              <Link
                href="/app/billing"
                className="mt-6 inline-flex rounded-xl bg-cyan-400 px-5 py-3 text-sm font-black text-black hover:bg-cyan-300"
              >
                Manage Billing
              </Link>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl sm:p-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">
                  Active Projects
                </div>
                <h2 className="mt-2 text-2xl font-black">
                  Your Transparency Dashboards
                </h2>
              </div>

              <Link
                href="/app/projects"
                className="rounded-xl bg-cyan-400 px-5 py-3 text-center text-sm font-black text-black hover:bg-cyan-300"
              >
                Manage Projects
              </Link>
            </div>

            {loading ? (
              <div className="mt-6 rounded-xl border border-white/10 bg-black/30 p-5 text-sm text-zinc-400">
                Loading projects...
              </div>
            ) : projects.length === 0 ? (
              <div className="mt-6 rounded-xl border border-white/10 bg-black/30 p-5 text-sm text-zinc-400">
                No projects found yet.
              </div>
            ) : (
              <div className="mt-6 grid gap-5">
                {projects.slice(0, 3).map((project) => (
                  <div
                    key={String(project.id)}
                    className="rounded-2xl border border-white/10 bg-black/30 p-5"
                  >
                    <div className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                      {project.symbol}
                    </div>

                    <h3 className="mt-2 text-xl font-black">
                      {project.name}
                    </h3>

                    <p className="mt-3 text-sm text-zinc-400">
                      {project.description || "Transparency dashboard is live."}
                    </p>

                    <div className="mt-4 rounded-xl border border-white/10 bg-black/40 p-4 text-sm">
                      <div className="text-zinc-500">Mint</div>
                      <div className="mt-1 font-semibold text-zinc-200">
                        {shortAddress(project.mint)}
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                      <Link
                        href={`/token/${project.slug}`}
                        className="flex-1 rounded-xl bg-cyan-400 px-4 py-3 text-center text-sm font-black text-black hover:bg-cyan-300"
                      >
                        View Dashboard
                      </Link>

                      <Link
                        href="/app/verify-wallets"
                        className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-black text-white hover:bg-white/10"
                      >
                        Verify Wallets
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function UsageMeter({
  label,
  used,
  limit,
  percent,
}: {
  label: string;
  used: number;
  limit: number;
  percent: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black text-white">{label}</p>
        <p className="text-sm font-black text-cyan-300">
          {used} / {formatLimit(limit)}
        </p>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-cyan-400"
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}
