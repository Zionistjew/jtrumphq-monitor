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
  created_at?: string;
};

type SubscriptionStatus = {
  ok?: boolean;
  subscription?: {
    plan: string;
    plan_label: string;
    status: string;
    renewal_date?: string | null;
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

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPage() {
      try {
        setLoading(true);
        setError("");

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

          if (!projectsRes.value.ok) {
            throw new Error(data?.error || "Failed to load projects.");
          }

          setProjects(data?.projects || []);
        }

        if (subscriptionRes.status === "fulfilled") {
          const data = await subscriptionRes.value.json().catch(() => null);
          if (subscriptionRes.value.ok) {
            setSubscription(data);
          }
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load projects.");
      } finally {
        setLoading(false);
      }
    }

    loadPage();
  }, []);

  const usage = subscription?.usage;
  const planLabel = subscription?.subscription?.plan_label || "No Active Plan";
  const planStatus = subscription?.subscription?.status || "inactive";
  const renewalDate = subscription?.subscription?.renewal_date;
  const upgradeTarget = subscription?.upgrade?.target || "/app/billing";
  const canCreateProject = !usage?.upgrade_required;

  return (
    <main className="min-h-screen bg-[#030712] px-4 py-6 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">
              WEB3MB / OWNER HUB
            </p>

            <h1 className="mt-3 text-3xl font-black sm:text-4xl">
              My Projects
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">
              View and manage your live transparency dashboards, wallet
              disclosures, and public trust pages.
            </p>
          </div>

          <Link
            href={canCreateProject ? "/app/billing" : upgradeTarget}
            className={
              canCreateProject
                ? "rounded-xl bg-cyan-400 px-5 py-3 text-center text-sm font-black text-black hover:bg-cyan-300"
                : "rounded-xl bg-orange-400 px-5 py-3 text-center text-sm font-black text-black hover:bg-orange-300"
            }
          >
            {canCreateProject ? "Create New Project" : "Upgrade Plan"}
          </Link>
        </div>

        <section className="mt-8 rounded-3xl border border-cyan-500/30 bg-cyan-500/10 p-6 shadow-2xl shadow-cyan-950/20">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                Subscription Intelligence
              </p>

              <h2 className="mt-3 text-2xl font-black">{planLabel} Plan</h2>

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

            <div className="grid w-full gap-4 lg:max-w-2xl sm:grid-cols-2">
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
          </div>

          {usage?.upgrade_required ? (
            <div className="mt-5 rounded-2xl border border-orange-400/30 bg-orange-400/10 p-4">
              <h3 className="text-sm font-black text-orange-300">
                Project limit reached
              </h3>

              <p className="mt-2 text-sm leading-6 text-zinc-300">
                Your current plan includes{" "}
                <span className="font-bold text-white">
                  {formatLimit(usage.project_limit)}
                </span>{" "}
                project slot. You have used{" "}
                <span className="font-bold text-white">
                  {usage.projects_used}
                </span>
                . Upgrade to Growth to create up to 5 projects.
              </p>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={upgradeTarget}
                  className="rounded-xl bg-orange-400 px-5 py-3 text-center text-sm font-black text-black hover:bg-orange-300"
                >
                  Upgrade to Growth
                </Link>

                <Link
                  href="/app/billing"
                  className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-center text-sm font-black text-white hover:bg-white/10"
                >
                  View Billing
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-200">
              You have {usage?.projects_remaining || 0} project slot
              {(usage?.projects_remaining || 0) === 1 ? "" : "s"} remaining.
            </div>
          )}
        </section>

        {error ? (
          <div className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-sm text-zinc-400">
            Loading your projects...
          </div>
        ) : projects.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
            <h2 className="text-2xl font-black">No projects found yet</h2>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-zinc-400">
              Once you create a transparency dashboard, it will appear here.
            </p>

            <Link
              href="/app/billing"
              className="mt-6 inline-flex rounded-xl bg-cyan-400 px-5 py-3 text-sm font-black text-black hover:bg-cyan-300"
            >
              Start Project Setup
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <div
                key={String(project.id)}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                      {project.symbol || "TOKEN"}
                    </div>

                    <h2 className="mt-2 text-xl font-black text-white">
                      {project.name}
                    </h2>
                  </div>

                  <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-300">
                    Live
                  </span>
                </div>

                <p className="mt-4 line-clamp-3 text-sm leading-6 text-zinc-400">
                  {project.description || "Transparency dashboard is live."}
                </p>

                <div className="mt-5 rounded-xl border border-white/10 bg-black/40 p-4 text-sm">
                  <div className="text-zinc-500">Mint</div>
                  <div className="mt-1 break-all font-semibold text-zinc-200">
                    {shortAddress(project.mint)}
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={`/app/projects/${project.slug}`}
                    className="flex-1 rounded-xl bg-cyan-400 px-4 py-3 text-center text-sm font-black text-black hover:bg-cyan-300"
                  >
                    Owner Console
                  </Link>

                  <Link
                    href={`/token/${project.slug}`}
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-black text-white hover:bg-white/10"
                  >
                    Public Dashboard
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
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
          className={
            percent >= 100
              ? "h-full rounded-full bg-orange-400"
              : "h-full rounded-full bg-cyan-400"
          }
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}
