import Link from "next/link";

const plans = [
  {
    name: "Launch Pass",
    price: "$149",
    subtitle: "One-Time Payment",
    description: "Perfect for meme coin launches and first-time token founders.",
    cta: "Launch Fast",
    href: "/checkout/crypto/launch-pass",
    featured: false,
    features: [
      "Wallet verification",
      "Trust badge",
      "Public token listing",
      "Liquidity disclosure",
      "Founder wallet verification",
      "30-day trust visibility",
      "No recurring billing"
    ]
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
      "Trust badge"
    ]
  },
  {
    name: "Growth",
    price: "$299/mo",
    subtitle: "Monthly",
    description: "Best for active founders managing multiple projects.",
    cta: "Get Started",
    href: "/checkout/crypto/growth",
    featured: true,
    features: [
      "Up to 5 projects",
      "Up to 50 wallets",
      "Advanced alerts",
      "Trust analytics",
      "Priority support"
    ]
  },
  {
    name: "Enterprise",
    price: "Custom",
    subtitle: "Custom Pricing",
    description: "For launchpads, exchanges, funds, and agencies.",
    cta: "Contact Sales",
    href: "/contact",
    featured: false,
    features: [
      "Unlimited projects",
      "Unlimited wallets",
      "API access",
      "White-label",
      "Dedicated support"
    ]
  }
];

export default function BillingPage() {
  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold mb-4">
          Choose Your Transparency Plan
        </h1>

        <p className="text-zinc-400 mb-12">
          Launch once. Scale forever. Pick the plan that fits your project.
        </p>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-6 ${
                plan.featured
                  ? "border-cyan-500 bg-cyan-950/20"
                  : "border-zinc-800 bg-zinc-950"
              }`}
            >
              <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
              <p className="text-sm text-zinc-400 mb-2">{plan.subtitle}</p>
              <div className="text-4xl font-bold text-cyan-400 mb-4">
                {plan.price}
              </div>

              <p className="text-zinc-400 text-sm mb-6">
                {plan.description}
              </p>

              <ul className="space-y-2 mb-6 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className="block text-center bg-cyan-500 hover:bg-cyan-400 text-black font-semibold py-3 rounded-xl"
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
