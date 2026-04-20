import Link from "next/link";

const plans = {
  starter: {
    name: "Starter",
    price: "0.1 SOL",
    description:
      "Ideal for early-stage projects launching a basic transparency page.",
    features: [
      "1 project",
      "Public transparency profile",
      "Wallet disclosure page",
    ],
  },
  pro: {
    name: "Pro",
    price: "0.25 SOL",
    description:
      "Built for active teams that need stronger investor-facing transparency.",
    features: [
      "Up to 5 projects",
      "Expanded dashboard access",
      "More disclosure coverage",
    ],
  },
  enterprise: {
    name: "Enterprise",
    price: "1 SOL",
    description:
      "For organizations that need full transparency infrastructure and custom support.",
    features: [
      "Unlimited projects",
      "Custom onboarding",
      "Priority setup support",
    ],
  },
} as const;

type PlanKey = keyof typeof plans;

export default function CryptoCheckoutPage({
  searchParams,
}: {
  searchParams?: { plan?: string };
}) {
  const selectedPlan = searchParams?.plan?.toLowerCase() as PlanKey | undefined;
  const plan = selectedPlan && plans[selectedPlan] ? plans[selectedPlan] : null;

  if (!plan) {
    return (
      <main className="min-h-screen bg-black text-white">
        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold sm:text-5xl">Choose Your Plan</h1>
            <p className="mt-4 text-lg text-zinc-400">
              Select a transparency plan to continue to checkout.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {Object.entries(plans).map(([key, value]) => (
              <div
                key={key}
                className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-8 shadow-lg"
              >
                <h2 className="text-2xl font-semibold">{value.name}</h2>
                <p className="mt-3 text-3xl font-bold">{value.price}</p>
                <p className="mt-4 text-sm leading-6 text-zinc-400">
                  {value.description}
                </p>

                <Link
                  href={`/checkout/crypto?plan=${key}`}
                  className="mt-8 inline-block rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-zinc-200"
                >
                  Choose {value.name}
                </Link>
              </div>
            ))}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto max-w-4xl px-6 py-16">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-8 shadow-lg">
          <div className="inline-flex rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300">
            Secure Solana Checkout
          </div>

          <h1 className="mt-6 text-4xl font-bold">
            {plan.name} Plan Checkout
          </h1>

          <p className="mt-4 text-lg text-zinc-400">{plan.description}</p>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-800 bg-black/30 p-6">
              <div className="text-sm text-zinc-400">Selected Plan</div>
              <div className="mt-2 text-2xl font-semibold">{plan.name}</div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-black/30 p-6">
              <div className="text-sm text-zinc-400">Price</div>
              <div className="mt-2 text-2xl font-semibold">{plan.price}</div>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-zinc-800 bg-black/30 p-6">
            <h2 className="text-xl font-semibold">What’s included</h2>
            <ul className="mt-4 space-y-3 text-sm text-zinc-300">
              {plan.features.map((feature) => (
                <li key={feature}>• {feature}</li>
              ))}
            </ul>
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <button className="rounded-xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-black hover:bg-cyan-400">
              Pay with Phantom
            </button>

            <Link
              href="/pricing"
              className="rounded-xl border border-zinc-700 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Back to Pricing
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
