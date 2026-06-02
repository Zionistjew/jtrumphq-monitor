"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SubscriptionStatus = {
  ok?: boolean;
  subscription?: {
    plan: string;
    plan_label: string;
    status: string;
    starts_at?: string | null;
    ends_at?: string | null;
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

const PLANS = [
  {
    key: "launch-pass",
    name: "Launch Pass",
    price: "$149",
    cadence: "one-time",
    description:
      "Perfect for token launches needing a public transparency dashboard.",
    features: [
      "1 transparency project",
      "10 wallet disclosures",
      "Public trust dashboard",
      "Wallet verification",
      "Launch-ready transparency profile",
    ],
    cta: "Activate Launch Pass",
  },
  {
    key: "starter",
    name: "Starter",
    price: "$99",
    cadence: "/month",
    description:
      "Ideal for founders building trust with their investor community.",
    features: [
      "1 active project",
      "15 monitored wallets",
      "Public dashboard",
      "Basic alerts",
      "Transparency verification badge",
    ],
    cta: "Choose Starter",
  },
  {
    key: "growth",
    name: "Growth",
    price: "$299",
    cadence: "/month",
    description:
      "For active projects requiring advanced monitoring and scaling.",
    features: [
      "5 active projects",
      "50 monitored wallets",
      "Advanced alerts",
      "Monitoring timeline",
      "Priority support",
    ],
    cta: "Upgrade to Growth",
  },
  {
    key: "enterprise",
    name: "Enterprise",
    price: "Custom",
    cadence: "",
    description:
      "For launchpads, agencies, DAOs, and enterprise monitoring teams.",
    features: [
      "Unlimited projects",
      "Unlimited monitored wallets",
      "Custom integrations",
      "Dedicated infrastructure",
      "Enterprise onboarding",
    ],
    cta: "Contact Enterprise",
  },
];

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

export default function BillingPage() {
  const [subscription, setSubscription] =
    useState<SubscriptionStatus | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSubscription() {
      try {
        const res = await fetch("/api/app/subscription", {
          credentials: "include",
          cache: "no-store",
        });

        const data = await res.json().catch(() => null);

        if (res.ok) {
          setSubscription(data);
        }
      } finally {
        setLoading(false);
      }
    }

    loadSubscription();
  }, []);

  const activePlan =
    subscription?.subscription?.plan?.toLowerCase() || "";

  const usage = subscription?.usage;

  return (
    <main className="min-h-screen bg-[#030712] px-4 py-6 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl sm:p-8">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">
                WEB3MB BILLING
              </div>

              <h1 className="mt-3 text-3xl font-black sm:text-4xl">
                Subscription & Billing
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-400">
                Manage your WEB3MB subscription, monitor usage limits, and
                upgrade your transparency infrastructure.
              </p>
            </div>

            <Link
              href="/app"
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-center text-sm font-black hover:bg-white/10"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        <section className="mt-8 rounded-3xl border border-cyan-500/30 bg-cyan-500/10 p-6 shadow-2xl shadow-cyan-950/20 sm:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                Active Subscription
              </div>

              <h2 className="mt-3 text-3xl font-black">
                {loading
                  ? "Loading..."
                  : subscription?.subscription?.plan_label ||
                    "No Active Plan"}
              </h2>

              <div className="mt-3 flex flex-wrap gap-3">
                <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-emerald-300">
                  {subscription?.subscription?.status || "inactive"}
                </span>

                {usage?.upgrade_required ? (
                  <span className="rounded-full border border-orange-400/40 bg-orange-400/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-orange-300">
                    Upgrade Recommended
                  </span>
                ) : null}
              </div>

              <p className="mt-4 text-sm text-zinc-300">
                Renewal Date:{" "}
                <span className="font-bold text-white">
                  {formatDate(
                    subscription?.subscription?.renewal_date
                  )}
                </span>
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
            <div className="mt-6 rounded-2xl border border-orange-400/30 bg-orange-400/10 p-5">
              <h3 className="text-sm font-black text-orange-300">
                Your current plan has reached capacity
              </h3>

              <p className="mt-3 text-sm leading-7 text-zinc-300">
                You are currently using{" "}
                <span className="font-bold text-white">
                  {usage.projects_used}
                </span>{" "}
                of{" "}
                <span className="font-bold text-white">
                  {formatLimit(usage.project_limit)}
                </span>{" "}
                project slots.
              </p>

              <Link
                href="/checkout/crypto/growth"
                className="mt-5 inline-flex rounded-xl bg-orange-400 px-5 py-3 text-sm font-black text-black hover:bg-orange-300"
              >
                Upgrade to Growth
              </Link>
            </div>
          ) : null}
        </section>

        <section className="mt-8">
          <div className="grid gap-6 xl:grid-cols-4 md:grid-cols-2">
            {PLANS.map((plan) => {
              const isActive =
                activePlan === plan.key;

              const isUpgrade =
                activePlan === "starter" &&
                plan.key === "growth";

              return (
                <div
                  key={plan.key}
                  className={
                    isActive
                      ? "rounded-3xl border border-cyan-400/40 bg-cyan-400/10 p-6 shadow-2xl shadow-cyan-950/30"
                      : "rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl"
                  }
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                        {plan.name}
                      </div>

                      <div className="mt-4 flex items-end gap-1">
                        <div className="text-4xl font-black">
                          {plan.price}
                        </div>

                        <div className="pb-1 text-sm text-zinc-400">
                          {plan.cadence}
                        </div>
                      </div>
                    </div>

                    {isActive ? (
                      <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-300">
                        Current Plan
                      </span>
                    ) : isUpgrade ? (
                      <span className="rounded-full border border-orange-400/40 bg-orange-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-orange-300">
                        Recommended
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-5 text-sm leading-7 text-zinc-400">
                    {plan.description}
                  </p>

                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-3 text-sm text-zinc-200"
                      >
                        <span className="mt-1 text-cyan-300">•</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {isActive ? (
                    <div className="mt-8 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-center text-sm font-black text-emerald-300">
                      Active Subscription
                    </div>
                  ) : (
                    <Link
                      href={
                        plan.key === "enterprise"
                          ? "mailto:verify@web3mb.com?subject=WEB3MB Enterprise Inquiry"
                          : `/checkout/crypto/${plan.key}`
                      }
                      className={
                        isUpgrade
                          ? "mt-8 block rounded-xl bg-orange-400 px-5 py-3 text-center text-sm font-black text-black hover:bg-orange-300"
                          : "mt-8 block rounded-xl bg-cyan-400 px-5 py-3 text-center text-sm font-black text-black hover:bg-cyan-300"
                      }
                    >
                      {plan.cta}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </section>
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
          style={{
            width: `${Math.min(percent, 100)}%`,
          }}
        />
      </div>
    </div>
  );
}
