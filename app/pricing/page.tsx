import Link from "next/link";

const plans = [
  { key: "starter", name: "Starter", sol: 0.2, usd: 29 },
  { key: "pro", name: "Pro", sol: 0.7, usd: 99 },
  { key: "enterprise", name: "Enterprise", sol: 3.5, usd: 499 },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold">SOL Pricing</h1>
        <p className="mt-2 text-neutral-400">
          Pay with SOL on Solana.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className="rounded-3xl border border-neutral-800 bg-neutral-950 p-6"
            >
              <h2 className="text-2xl font-semibold">{plan.name}</h2>

              <div className="mt-4 space-y-1 text-neutral-300">
                <p>{plan.sol} SOL</p>
                <p>${plan.usd} value</p>
              </div>

              <div className="mt-6">
                <Link
                  href={`/checkout/crypto?plan=${plan.key}`}
                  className="block rounded-2xl bg-red-700 px-5 py-3 text-center font-medium hover:bg-red-600"
                >
                  Pay with SOL
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
