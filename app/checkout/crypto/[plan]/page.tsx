"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type PlanKey = "launch-pass" | "starter" | "growth" | "enterprise";

const PLANS = {
  starter: {
    name: "Starter",
    price: "$99/mo",
    description: "For early-stage token teams building investor trust.",
    bullets: ["1 project", "Up to 15 wallets", "Public trust dashboard"],
  },
  growth: {
    name: "Growth",
    price: "$299/mo",
    description: "For active founders managing multiple token projects.",
    bullets: ["Up to 5 projects", "Up to 50 wallets", "Advanced alerts"],
  },
  enterprise: {
    name: "Enterprise",
    price: "Custom",
    description: "For large scale teams.",
    bullets: ["Unlimited projects", "Custom integrations"],
  },
};

function maskWallet(w: string) {
  return w.slice(0, 6) + "..." + w.slice(-6);
}

export default function CryptoCheckoutPage() {
  const params = useParams();
  const router = useRouter();

  const planKey = String(params?.plan || "starter") as PlanKey;
  const plan = PLANS[planKey] || PLANS.starter;

  const [wallet, setWallet] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function connectPhantom() {
    const provider = (window as any).solana;
    if (!provider || !provider.isPhantom) {
      alert("Phantom not found");
      return;
    }
    const resp = await provider.connect();
    setWallet(resp.publicKey.toString());
  }

  async function payWithPhantom() {
    setLoading(true);

    try {
      // TODO: Replace with real payment logic
      await new Promise((r) => setTimeout(r, 1500));

      setSignature("TEMP_SIGNATURE_REMOVE_AFTER_REAL_PAYMENT");

      router.push("/app/projects/new");
    } catch (e) {
      console.error(e);
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="flex min-h-screen">

        {/* SIDEBAR */}
        <aside className="hidden w-[330px] border-r border-white/10 bg-[#070b1a] lg:flex flex-col">
          <div className="p-8">

            {/* ✅ NEW LOGO */}
            <img
              src="https://web3mb.com/wp-content/uploads/2026/04/WEB3MB-L.png"
              alt="WEB3MB"
              className="h-24 object-contain"
            />

            <div className="mt-8 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-5 py-3 text-center text-xs font-black text-cyan-300">
              Secure Checkout
            </div>

            <p className="mt-6 text-sm text-zinc-300">
              Activate your WEB3MB subscription using Phantom wallet.
            </p>

            <div className="mt-10 space-y-3">
              <Link href="/app/billing" className="block p-4 rounded-xl bg-white/5 hover:bg-white/10">
                Back to Billing
              </Link>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <section className="relative flex-1">

          {/* 🔥 BACKGROUND EFFECT */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.15),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.2),transparent_40%)]" />

          {/* 🔥 BIG LOGO BACKGROUND */}
          <img
            src="https://web3mb.com/wp-content/uploads/2026/04/WEB3MB-L.png"
            className="absolute right-10 top-10 w-[500px] opacity-[0.04]"
          />

          <div className="relative max-w-6xl mx-auto px-6 py-12">

            <h1 className="text-4xl font-black mb-6">
              Activate {plan.name}
            </h1>

            <div className="grid lg:grid-cols-2 gap-8">

              {/* PLAN CARD */}
              <div className="border border-cyan-400/30 bg-cyan-400/5 p-6 rounded-2xl">
                <h2 className="text-2xl font-black">{plan.name}</h2>
                <div className="text-3xl text-cyan-300 mt-2">{plan.price}</div>

                <ul className="mt-6 space-y-2">
                  {plan.bullets.map((b) => (
                    <li key={b}>• {b}</li>
                  ))}
                </ul>
              </div>

              {/* PAYMENT */}
              <div className="border border-white/10 bg-white/[0.03] p-6 rounded-2xl">

                <h2 className="text-xl font-black mb-4">Checkout</h2>

                <div className="flex gap-3">
                  <button
                    onClick={connectPhantom}
                    className="bg-white text-black px-5 py-3 rounded-xl"
                  >
                    Connect Phantom
                  </button>

                  <button
                    onClick={payWithPhantom}
                    disabled={loading}
                    className="bg-emerald-500 text-black px-5 py-3 rounded-xl"
                  >
                    {loading ? "Processing..." : "Pay With Phantom"}
                  </button>
                </div>

                {wallet && (
                  <div className="mt-4">
                    Wallet: {maskWallet(wallet)}
                  </div>
                )}

                {signature && (
                  <div className="mt-4 text-emerald-400">
                    {signature}
                  </div>
                )}

              </div>

            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
