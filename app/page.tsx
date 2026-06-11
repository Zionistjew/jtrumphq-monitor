import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "WEB3MB Transparency Center | Crypto Wallet Verification & Trust Scores",
  description:
    "WEB3MB helps crypto projects verify wallets, publish investor-facing transparency dashboards, earn trust seal awards, and build public trust with explainable trust scores.",
  openGraph: {
    title: "WEB3MB Transparency Center",
    description:
      "Crypto wallet verification, trust scores, trust seal awards, and investor-facing transparency dashboards.",
    url: "https://app.web3mb.com",
    siteName: "WEB3MB Transparency Center",
    images: [
      {
        url: "https://app.web3mb.com/WEB3MB-L.png",
        width: 1200,
        height: 630,
        alt: "WEB3MB Transparency Center",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WEB3MB Transparency Center",
    description:
      "Verify crypto project wallets, publish public trust dashboards, and earn WEB3MB trust seal awards.",
    images: ["https://app.web3mb.com/WEB3MB-L.png"],
  },
  alternates: {
    canonical: "https://app.web3mb.com",
  },
};

const features = [
  {
    title: "Wallet Verification",
    description:
      "Verify treasury, team, liquidity, and marketing wallets so investors can see public ownership proof.",
    icon: "✅",
  },
  {
    title: "Trust Scores",
    description:
      "Generate explainable WEB3MB trust scores based on wallet health, alerts, liquidity, and disclosure depth.",
    icon: "📊",
  },
  {
    title: "Trust Seal Awards",
    description:
      "Earn public badges like Platinum Verified, Perfect Trust Score, and Fully Verified.",
    icon: "🏆",
  },
  {
    title: "Investor Reports",
    description:
      "Give communities a public dashboard with risk summaries, wallet monitoring, and audit-style reporting.",
    icon: "📄",
  },
];

const links = [
  { label: "View Demo Dashboard", href: "/token/web3mb-demo" },
  { label: "Verification Registry", href: "/verification-registry" },
  { label: "Leaderboard", href: "/transparency/leaderboard" },
];

const plans = [
  {
    name: "Launch Pass",
    price: "$149",
    description: "One-time launch verification package for early projects.",
    href: "/app/billing",
  },
  {
    name: "Starter",
    price: "$99/mo",
    description:
      "For one project with core wallet verification and trust scoring.",
    href: "/app/billing",
  },
  {
    name: "Growth",
    price: "$299/mo",
    description: "For teams managing multiple verified transparency dashboards.",
    href: "/app/billing",
  },
];

type RegistryStats = {
  verifiedWallets: number;
  verifiedProjects: number;
  platinumProjects: number;
};

type DemoShowcase = {
  projectName: string;
  score: number;
  grade: string;
  status: string;
  verifiedWallets: number;
  totalWallets: number;
  tier: string;
};

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://app.web3mb.com"
  );
}

async function getRegistryStats(): Promise<RegistryStats> {
  try {
    const res = await fetch(`${getBaseUrl()}/api/verification-registry`, {
      cache: "no-store",
    });

    const data = await res.json();

    return {
      verifiedWallets: data?.stats?.verifiedWallets || 0,
      verifiedProjects: data?.stats?.verifiedProjects || 0,
      platinumProjects: data?.stats?.platinumProjects || 0,
    };
  } catch {
    return {
      verifiedWallets: 0,
      verifiedProjects: 0,
      platinumProjects: 0,
    };
  }
}

async function getDemoShowcase(): Promise<DemoShowcase> {
  try {
    const res = await fetch(`${getBaseUrl()}/api/trust-score/web3mb-demo`, {
      cache: "no-store",
    });

    const data = await res.json();

    return {
      projectName: data?.project?.name || data?.projectName || "WEB3MB Demo",
      score: data?.score || 0,
      grade: data?.grade || "—",
      status: data?.status || "Unknown",
      verifiedWallets: data?.verification?.verifiedWallets || 4,
      totalWallets: data?.verification?.totalWallets || 4,
      tier: data?.verification?.tier || "Platinum",
    };
  } catch {
    return {
      projectName: "WEB3MB Demo",
      score: 100,
      grade: "A+",
      status: "Perfect",
      verifiedWallets: 4,
      totalWallets: 4,
      tier: "Platinum",
    };
  }
}

export default async function HomePage() {
  const [registryStats, demoShowcase] = await Promise.all([
    getRegistryStats(),
    getDemoShowcase(),
  ]);

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-8 md:flex-row md:items-center md:justify-between">
          <Link href="/">
            <img
              src="/WEB3MB-L.png"
              alt="WEB3MB"
              className="h-20 w-auto object-contain"
            />
          </Link>

          <nav className="flex flex-wrap gap-3">
            <Link
              href="/transparency"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold hover:bg-white/10"
            >
              Directory
            </Link>

            <Link
              href="/verification-registry"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold hover:bg-white/10"
            >
              Registry
            </Link>

            <Link
              href="/app/billing"
              className="rounded-xl border border-cyan-400/30 bg-cyan-500/15 px-4 py-3 text-sm font-black text-cyan-100 hover:bg-cyan-500/25"
            >
              Get Verified
            </Link>
          </nav>
        </header>

        <section className="grid gap-10 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
              Crypto Transparency Layer
            </div>

            <h1 className="mt-6 max-w-5xl text-4xl font-black tracking-tight sm:text-6xl lg:text-7xl">
              Make your crypto project easier to trust.
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-300">
              WEB3MB verifies project wallets, generates investor-facing trust
              scores, issues public trust seal awards, and gives communities a
              transparent dashboard they can inspect before they invest.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/app/billing"
                className="rounded-2xl bg-white px-7 py-4 text-center text-sm font-black text-black hover:bg-zinc-200"
              >
                Get Verified
              </Link>

              <Link
                href="/token/web3mb-demo"
                className="rounded-2xl border border-cyan-400/30 bg-cyan-500/15 px-7 py-4 text-center text-sm font-black text-cyan-100 hover:bg-cyan-500/25"
              >
                View Live Demo
              </Link>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-3xl font-black">
                  {demoShowcase.score}
                </div>
                <div className="mt-1 text-sm text-zinc-400">
                  {demoShowcase.status} demo trust score
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-3xl font-black">
                  {demoShowcase.grade}
                </div>
                <div className="mt-1 text-sm text-zinc-400">
                  WEB3MB trust grade
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-3xl font-black">{demoShowcase.tier}</div>
                <div className="mt-1 text-sm text-zinc-400">
                  Verification tier
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/[0.12] via-white/[0.04] to-purple-500/[0.12] p-6 shadow-2xl">
            <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
              <div className="text-xs uppercase tracking-[0.24em] text-cyan-300">
                Live Showcase
              </div>

              <h2 className="mt-4 text-3xl font-black">
                {demoShowcase.projectName}
              </h2>

              <div className="mt-5 grid gap-3">
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                  <div className="text-sm text-emerald-200">Trust Score</div>
                  <div className="mt-1 text-3xl font-black">
                    {demoShowcase.score} / 100
                  </div>
                </div>

                <div className="rounded-2xl border border-purple-400/20 bg-purple-500/10 p-4">
                  <div className="text-sm text-purple-200">
                    Verification Status
                  </div>
                  <div className="mt-1 text-3xl font-black">
                    {demoShowcase.tier} Verified
                  </div>
                </div>

                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4">
                  <div className="text-sm text-cyan-200">Wallet Coverage</div>
                  <div className="mt-1 text-3xl font-black">
                    {demoShowcase.verifiedWallets}/{demoShowcase.totalWallets}{" "}
                    Verified
                  </div>
                </div>
              </div>

              <Link
                href="/token/web3mb-demo"
                className="mt-5 inline-flex w-full justify-center rounded-2xl border border-white/10 bg-white px-5 py-4 text-sm font-black text-black hover:bg-zinc-200"
              >
                Open Demo Dashboard
              </Link>
            </div>
          </div>
        </section>

        <section className="py-10">
          <div className="rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/[0.10] via-cyan-500/[0.08] to-purple-500/[0.10] p-6 md:p-8">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-emerald-300">
                  Live Transparency Proof
                </div>
                <h2 className="mt-3 text-4xl font-black">
                  Public trust signals already live.
                </h2>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-300">
                  WEB3MB is already tracking verified wallet records, public
                  trust scores, platinum verification status, investor
                  dashboards, and trust seal awards through live production
                  APIs.
                </p>
              </div>

              <Link
                href="/verification-registry"
                className="rounded-2xl border border-white/10 bg-white px-6 py-4 text-center text-sm font-black text-black hover:bg-zinc-200"
              >
                View Live Registry
              </Link>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                  Verified Wallets
                </div>
                <div className="mt-3 text-4xl font-black text-white">
                  {registryStats.verifiedWallets}
                </div>
                <div className="mt-2 text-sm text-zinc-400">
                  Owner-verified wallet records.
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                  Verified Projects
                </div>
                <div className="mt-3 text-4xl font-black text-white">
                  {registryStats.verifiedProjects}
                </div>
                <div className="mt-2 text-sm text-zinc-400">
                  Listed in the public registry.
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                  Platinum Projects
                </div>
                <div className="mt-3 text-4xl font-black text-white">
                  {registryStats.platinumProjects}
                </div>
                <div className="mt-2 text-sm text-zinc-400">
                  Full wallet verification achieved.
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                  Demo Trust Score
                </div>
                <div className="mt-3 text-4xl font-black text-white">
                  {demoShowcase.score}
                </div>
                <div className="mt-2 text-sm text-zinc-400">
                  {demoShowcase.grade} {demoShowcase.status} showcase score.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-8">
          <div className="text-xs uppercase tracking-[0.24em] text-cyan-300">
            Platform Features
          </div>
          <h2 className="mt-3 text-4xl font-black">
            Everything needed to prove transparency.
          </h2>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"
              >
                <div className="text-4xl">{feature.icon}</div>
                <h3 className="mt-5 text-xl font-black">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-zinc-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-10">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 md:p-8">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-cyan-300">
                  Public Trust Network
                </div>
                <h2 className="mt-3 text-4xl font-black">
                  Give investors links they can verify.
                </h2>
                <p className="mt-4 text-sm leading-7 text-zinc-300">
                  WEB3MB creates public pages that projects can share with
                  communities, investors, exchanges, and launch partners.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {links.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-5 text-sm font-black text-cyan-100 hover:bg-cyan-500/20"
                  >
                    {item.label} →
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-10">
          <div className="text-xs uppercase tracking-[0.24em] text-cyan-300">
            Pricing
          </div>
          <h2 className="mt-3 text-4xl font-black">Start with verification.</h2>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className="rounded-3xl border border-white/10 bg-black/30 p-6"
              >
                <h3 className="text-2xl font-black">{plan.name}</h3>
                <div className="mt-4 text-4xl font-black">{plan.price}</div>
                <p className="mt-4 min-h-[72px] text-sm leading-7 text-zinc-400">
                  {plan.description}
                </p>
                <Link
                  href={plan.href}
                  className="mt-6 inline-flex w-full justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/15 px-5 py-4 text-sm font-black text-cyan-100 hover:bg-cyan-500/25"
                >
                  Choose Plan
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="py-10">
          <div className="rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/[0.12] via-cyan-500/[0.08] to-purple-500/[0.1] p-8 text-center">
            <h2 className="text-4xl font-black">
              Ready to earn WEB3MB verification?
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-zinc-300">
              Verify your wallets, publish your dashboard, earn trust seal
              awards, and show investors your project is serious about
              transparency.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/app/billing"
                className="rounded-2xl bg-white px-7 py-4 text-sm font-black text-black hover:bg-zinc-200"
              >
                Get Verified
              </Link>
              <Link
                href="/verification-registry"
                className="rounded-2xl border border-white/10 bg-white/10 px-7 py-4 text-sm font-black text-white hover:bg-white/15"
              >
                View Registry
              </Link>
            </div>
          </div>
        </section>

        <footer className="border-t border-white/10 py-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-lg font-black text-white">
                WEB3MB Transparency Center
              </div>
              <div className="mt-2 text-sm text-zinc-400">
                Crypto wallet verification, trust scores, and investor-facing
                transparency dashboards.
              </div>
              <div className="mt-2 text-sm font-bold text-cyan-300">
                verify@web3mb.com
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              <Link
                href="/transparency"
                className="text-zinc-400 hover:text-white"
              >
                Directory
              </Link>
              <Link
                href="/verification-registry"
                className="text-zinc-400 hover:text-white"
              >
                Registry
              </Link>
              <Link
                href="/transparency/leaderboard"
                className="text-zinc-400 hover:text-white"
              >
                Leaderboard
              </Link>
              <Link href="/privacy" className="text-zinc-400 hover:text-white">
                Privacy
              </Link>
              <Link href="/terms" className="text-zinc-400 hover:text-white">
                Terms
              </Link>
            </div>
          </div>
        </footer>
      </section>
    </div>
  );
}
