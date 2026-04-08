import Link from "next/link";

const plans = [
  { key: "starter", name: "Starter", usdc: 29, sol: 0.2 },
  { key: "pro", name: "Pro", usdc: 99, sol: 0.7 },
  { key: "enterprise", name: "Enterprise", usdc: 499, sol: 3.5 },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold">Crypto Pricing</h1>
        <p className="mt-2 text-neutral-400">
          Pay with USDC or SOL on Solana.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className="rounded-3xl border border-neutral-800 bg-neutral-950 p-6"
            >
              <h2 className="text-2xl font-semibold">{plan.name}</h2>
              <div className="mt-4 space-y-1 text-neutral-300">
                <p>{plan.usdc} USDC</p>
                <p>{plan.sol} SOL</p>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <Link
                  href={`/checkout/crypto?plan=${plan.key}&token=USDC`}
                  className="rounded-2xl bg-red-700 px-5 py-3 text-center font-medium hover:bg-red-600"
                >
                  Pay with USDC
                </Link>

                <Link
                  href={`/checkout/crypto?plan=${plan.key}&token=SOL`}
                  className="rounded-2xl border border-neutral-700 px-5 py-3 text-center hover:border-neutral-500"
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
