"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type QuickLink = {
  title: string;
  description: string;
  href: string;
  emoji: string;
  tag?: string;
};

const quickLinks: QuickLink[] = [
  {
    title: "Pricing",
    description: "View plans and start the payment flow.",
    href: "/pricing",
    emoji: "💰",
    tag: "Revenue",
  },
  {
    title: "Start Checkout",
    description: "Open the SOL checkout for a new payment session.",
    href: "/checkout/crypto?plan=starter",
    emoji: "🚀",
    tag: "Payments",
  },
  {
    title: "Transparency",
    description: "Monitor token transparency and activity feeds.",
    href: "/transparency",
    emoji: "📊",
    tag: "Public",
  },
  {
    title: "Alerts",
    description: "Review alert surfaces and system-level events.",
    href: "/alerts",
    emoji: "🚨",
    tag: "Monitoring",
  },
  {
    title: "Admin Login",
    description: "Authenticate to access the protected admin area.",
    href: "/admin/login",
    emoji: "🔐",
    tag: "Admin",
  },
  {
    title: "Create Project",
    description: "Launch a new token dashboard from the admin panel.",
    href: "/admin/create-project",
    emoji: "🛠️",
    tag: "Admin",
  },
];

const tokenExamples = [
  { slug: "jtrump", label: "JTRUMP" },
  { slug: "test-alpha-4", label: "Test Alpha 4" },
  { slug: "test-alpha-5", label: "Test Alpha 5" },
];

export default function HomePage() {
  const [slug, setSlug] = useState("jtrump");

  const normalizedSlug = useMemo(() => {
    return slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }, [slug]);

  const tokenHref = normalizedSlug ? `/token/${normalizedSlug}` : "/token/jtrump";

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="inline-block rounded-full border border-red-700 px-4 py-1 text-xs uppercase tracking-[0.3em] text-red-300">
              SaaS Control Center
            </p>
            <h1 className="mt-4 text-4xl font-bold md:text-5xl">
              JTRUMPHQ Platform Dashboard
            </h1>
            <p className="mt-3 max-w-3xl text-neutral-400">
              Central workspace for payments, project onboarding, token
              dashboards, transparency feeds, and operational monitoring.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:min-w-[300px]">
            <StatCard label="Payments" value="SOL Live" />
            <StatCard label="Admin" value="Protected" />
            <StatCard label="Projects" value="Multi-App" />
            <StatCard label="Status" value="Active" />
          </div>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="rounded-[28px] border border-neutral-800 bg-gradient-to-br from-neutral-950 via-black to-red-950/20 p-6 shadow-2xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-red-300">
                  Operations Hub
                </p>
                <h2 className="mt-2 text-3xl font-semibold">
                  Launch, monetize, and monitor from one screen
                </h2>
                <p className="mt-3 max-w-2xl text-neutral-400">
                  Use this dashboard as the front door to your SaaS workflow:
                  pricing, checkout, admin creation, token dashboards, and
                  transparency tools.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/pricing"
                  className="rounded-2xl bg-red-700 px-5 py-3 font-medium text-white transition hover:bg-red-600"
                >
                  Open Pricing
                </Link>
                <Link
                  href="/admin/create-project"
                  className="rounded-2xl border border-neutral-700 px-5 py-3 text-neutral-200 transition hover:border-neutral-500"
                >
                  Launch Project
                </Link>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {quickLinks.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group rounded-2xl border border-neutral-800 bg-black/60 p-5 transition hover:-translate-y-1 hover:border-red-700"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-2xl">{item.emoji}</span>
                    {item.tag && (
                      <span className="rounded-full border border-neutral-700 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                        {item.tag}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold group-hover:text-red-300">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-400">
                    {item.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-neutral-800 bg-neutral-950 p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Open Token Dashboard</h2>
                <span className="rounded-full border border-neutral-700 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                  Dynamic Slug
                </span>
              </div>

              <p className="mt-3 text-sm text-neutral-400">
                Jump directly into any project dashboard using a slug.
              </p>

              <div className="mt-4">
                <label className="mb-2 block text-sm text-neutral-300">
                  Token Slug
                </label>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full rounded-2xl border border-neutral-800 bg-black px-4 py-3 outline-none focus:border-red-700"
                  placeholder="jtrump"
                />
                <p className="mt-2 text-xs text-neutral-500">
                  Preview:{" "}
                  <span className="text-neutral-300">
                    {normalizedSlug || "jtrump"}
                  </span>
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {tokenExamples.map((item) => (
                  <button
                    key={item.slug}
                    type="button"
                    onClick={() => setSlug(item.slug)}
                    className="rounded-full border border-neutral-700 px-3 py-2 text-xs text-neutral-300 transition hover:border-red-700 hover:text-white"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <Link
                href={tokenHref}
                className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-red-700 px-5 py-3 font-medium text-white transition hover:bg-red-600"
              >
                Open Dashboard
              </Link>
            </div>

            <div className="rounded-[28px] border border-neutral-800 bg-neutral-950 p-6 shadow-xl">
              <h2 className="text-xl font-semibold">Platform Navigation</h2>
              <div className="mt-4 space-y-3">
                <MiniLink title="Public Home" href="/" />
                <MiniLink title="Transparency Feed" href="/transparency" />
                <MiniLink title="Alerts" href="/alerts" />
                <MiniLink title="Pricing" href="/pricing" />
                <MiniLink title="Admin Login" href="/admin/login" />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          <Panel
            title="Revenue Engine"
            body="Drive users into pricing and checkout with a cleaner SaaS journey. This is your payments command center."
            href="/pricing"
            cta="Manage Payments"
          />
          <Panel
            title="Project Onboarding"
            body="Create new transparency dashboards and route them instantly into public token pages."
            href="/admin/create-project"
            cta="Create New Project"
          />
          <Panel
            title="Monitoring Layer"
            body="Use transparency, alerts, and wallet endpoints as the operational intelligence layer of the platform."
            href="/alerts"
            cta="Review Alerts"
          />
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}

function Panel({
  title,
  body,
  href,
  cta,
}: {
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="rounded-[28px] border border-neutral-800 bg-neutral-950 p-6 shadow-xl">
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-neutral-400">{body}</p>
      <Link
        href={href}
        className="mt-5 inline-flex rounded-2xl border border-neutral-700 px-4 py-3 text-sm text-neutral-200 transition hover:border-red-700 hover:text-white"
      >
        {cta}
      </Link>
    </div>
  );
}

function MiniLink({ title, href }: { title: string; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-2xl border border-neutral-800 bg-black/60 px-4 py-3 text-sm transition hover:border-red-700"
    >
      <span>{title}</span>
      <span className="text-neutral-500">→</span>
    </Link>
  );
}
