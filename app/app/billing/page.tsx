import Link from "next/link";

const plans = [
  {
    name: "Launch Pass",
    price: "$149",
    subtitle: "One-Time Payment",
    description: "Perfect for meme coin launches and first-time token founders.",
    cta: "Launch Fast",
    href: "/checkout/crypto/launch-pass",
    featured: true,
    features: [
      "Wallet verification",
      "Trust badge",
      "Public token listing",
      "Liquidity disclosure",
      "Founder wallet verification",
      "30-day trust visibility",
      "No recurring billing",
    ],
  },
  {
    name: "Starter",
    price: "$99/mo",
    subtitle: "Monthly",
    description: "Best for one token project launching public trust monitoring.",
    cta: "Get Started",
    href: "/checkout/crypto/starter",
    featured: false,
    features: [
      "1 Project",
      "Up to 5 wallets",
      "Live monitoring",
      "Basic alerts",
      "Trust badge",
    ],
  },
  {
    name: "Growth",
    price: "$299/mo",
    subtitle: "Monthly",
    description: "Best for active founders managing multiple projects.",
    cta: "Get Started",
    href: "/checkout/crypto/growth",
    featured: false,
    features: [
      "Up to 5 projects",
      "Up to 50 wallets",
      "Advanced alerts",
      "Trust analytics",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    subtitle: "Custom Pricing",
    description: "For launchpads, exchanges, funds, and agencies.",
    cta: "Contact Sales",
    href: "mailto:verify@web3mb.com?subject=WEB3MB Enterprise Inquiry",
    featured: false,
    features: [
      "Unlimited projects",
      "Unlimited wallets",
      "API access",
      "White-label",
      "Dedicated support",
    ],
  },
];

export default function BillingPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">
            WEB3MB Billing
          </p>

          <h1 className="mt-3 text-3xl font-bold sm:text-4xl md:text-5xl">
            Choose Your Transparency Plan
          </h1>

          <p className="mt-4 max-w-3xl text-zinc-400">
            Launch once. Scale forever. Pick the plan that fits your project.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={
                plan.featured
                  ? "rounded-2xl sm:rounded-3xl border border-cyan-500 bg-cyan-950/20 p-4 sm:p-6 shadow-2xl shadow-cyan-950/30"
                  : "rounded-2xl sm:rounded-3xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6"
              }
            >
              {plan.featured ? (
                <div className="mb-4 inline-flex rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                  Best for New Launches
                </div>
              ) : null}

              <h2 className="text-2xl font-bold">{plan.name}</h2>

              <p className="mt-2 text-sm text-zinc-400">{plan.subtitle}</p>

              <div className="mt-4 text-3xl font-bold text-cyan-400 sm:text-4xl">
                {plan.price}
              </div>

              <p className="mt-5 min-h-[64px] text-sm leading-6 text-zinc-400">
                {plan.description}
              </p>

              <ul className="mt-6 space-y-2 text-sm text-zinc-200">
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
                  className="mt-7 block rounded-xl bg-cyan-500 py-3 text-center font-semibold text-black hover:bg-cyan-400"
                >
                  {plan.cta}
                </a>
              ) : (
                <Link
                  href={plan.href}
                  className="mt-7 block rounded-xl bg-cyan-500 py-3 text-center font-semibold text-black hover:bg-cyan-400"
                >
                  {plan.cta}
                </Link>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.04] p-4 sm:p-6">
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">
            Revenue Engine
          </p>

          <h2 className="mt-3 text-2xl font-bold">
            One-time launch verification plus recurring trust monitoring
          </h2>

          <p className="mt-3 max-w-4xl text-sm leading-7 text-zinc-400">
            Launch Pass gives fast-moving token founders a one-time trust entry
            point, while Starter and Growth unlock ongoing monitoring, alerts,
            and recurring transparency coverage.
          </p>
        </div>
      </div>
    </main>
  );
}
