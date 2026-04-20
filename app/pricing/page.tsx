import Link from "next/link";

const plans = [
  {
    name: "Starter",
    price: "1 SOL",
    description: "Ideal for early-stage projects launching a basic transparency page.",
    features: [
      "1 project",
      "Public transparency profile",
      "Wallet disclosure page",
    ],
    href: "/checkout/crypto?plan=starter",
  },
  {
    name: "Pro",
    price: "3 SOL",
    description: "For active teams that need stronger investor-facing transparency.",
    features: [
      "Up to 5 projects",
      "Enhanced dashboard access",
      "More disclosure coverage",
    ],
    href: "/checkout/crypto?plan=pro",
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For serious organizations needing full transparency infrastructure.",
    features: [
      "Unlimited projects",
      "Custom setup support",
      "Advanced onboarding",
    ],
    href: "/checkout/crypto?plan=enterprise",
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Pricing</h1>
          <p className="mt-4 text-zinc-400">
            Choose the transparency plan that fits your project stage.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-8"
            >
              <h2 className="text-2xl font-semibold">{plan.name}</h2>
              <div className="mt-3 text-3xl font-bold">{plan.price}</div>
              <p className="mt-4 text-sm leading-6 text-zinc-400">
                {plan.description}
              </p>

              <ul className="mt-6 space-y-3 text-sm text-zinc-300">
                {plan.features.map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className="mt-8 inline-block rounded-xl bg-cyan-500 px-5 py-3 text-sm font-medium text-black hover:bg-cyan-400"
              >
                Choose {plan.name}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
