import Link from "next/link";

const plans = [
  {
    name: "Starter",
    price: "$99/mo",
    description: "Best for one token project launching public trust monitoring.",
    features: [
      "1 Project",
      "Up to 5 wallets",
      "Live wallet monitoring",
      "Basic alerts",
      "Public trust badge",
      "Public directory listing",
    ],
    href: "/checkout/crypto/starter",
    button: "Get Started",
    featured: false,
  },
  {
    name: "Growth",
    price: "$299/mo",
    description: "Best for active founders managing multiple token projects.",
    features: [
      "Up to 5 projects",
      "Up to 50 wallets",
      "Advanced alerts",
      "Trust analytics",
      "Priority support",
      "Enhanced public visibility",
    ],
    href: "/checkout/crypto/growth",
    button: "Get Started",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "Best for launchpads, funds, agencies, and enterprise teams.",
    features: [
      "Unlimited projects",
      "Unlimited wallets",
      "API access",
      "White-label monitoring",
      "Dedicated support",
      "Custom integrations",
    ],
    href: "mailto:sales@web3mb.com?subject=WEB3MB Enterprise Inquiry",
    button: "Contact Sales",
    featured: false,
  },
];

export default function BillingPage() {
  return (
    <div className="min-h-screen bg-[#030712] px-8 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 max-w-4xl">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">
            WEB3MB Billing
          </p>

          <h1 className="mt-4 text-4xl font-bold md:text-5xl">
            Choose Your Transparency Plan
          </h1>

          <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-400">
            Turn wallet disclosure, live verification, alerts, and public trust
            scoring into a recurring transparency layer for crypto projects.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={
                plan.featured
                  ? "rounded-3xl border border-cyan-500/40 bg-cyan-500/[0.08] p-8 shadow-2xl shadow-cyan-950/30"
                  : "rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl"
              }
            >
              {plan.featured ? (
                <div className="mb-5 inline-flex rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                  Recommended
                </div>
              ) : null}

              <h2 className="text-2xl font-bold text-white">{plan.name}</h2>

              <p className="mt-3 min-h-[52px] text-sm leading-6 text-zinc-400">
                {plan.description}
              </p>

              <div className="mt-6 text-4xl font-bold text-cyan-400">
                {plan.price}
              </div>

              <ul className="mt-8 space-y-3 text-sm text-zinc-300">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span className="text-cyan-400">•</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {plan.href.startsWith("mailto:") ? (
                <a
                  href={plan.href}
                  className="mt-8 block rounded-xl bg-cyan-500 px-4 py-3 text-center font-semibold text-black transition hover:bg-cyan-400"
                >
                  {plan.button}
                </a>
              ) : (
                <Link
                  href={plan.href}
                  className="mt-8 block rounded-xl bg-cyan-500 px-4 py-3 text-center font-semibold text-black transition hover:bg-cyan-400"
                >
                  {plan.button}
                </Link>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="text-sm uppercase tracking-[0.25em] text-cyan-300">
            Revenue Engine
          </div>

          <h2 className="mt-3 text-2xl font-bold text-white">
            What each paid plan unlocks
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <h3 className="font-semibold text-white">Project Publishing</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Paid founders can publish public trust dashboards for their
                token projects.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <h3 className="font-semibold text-white">Trust Badge</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Qualified projects receive public-facing WEB3MB trust and
                verification status.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <h3 className="font-semibold text-white">Live Monitoring</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Wallet changes, allocation mismatches, and risk alerts are
                monitored through the owner console.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
