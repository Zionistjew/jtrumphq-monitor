"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

type PlanKey = "launch-pass" | "starter" | "growth" | "enterprise";

const LOGO_URL = "https://web3mb.com/wp-content/uploads/2026/04/WEB3MB-L.png";

const PLANS: Record<
  PlanKey,
  {
    name: string;
    price: string;
    description: string;
    bullets: string[];
  }
> = {
  "launch-pass": {
    name: "Launch Pass",
    price: "$149 one-time",
    description: "For founders launching one token transparency dashboard.",
    bullets: [
      "1 project",
      "Up to 10 wallets",
      "Public dashboard",
      "Trust score",
      "Wallet disclosure",
    ],
  },
  starter: {
    name: "Starter",
    price: "$99/mo",
    description: "For early-stage token teams building investor trust.",
    bullets: [
      "1 project",
      "Up to 15 wallets",
      "Public trust dashboard",
      "Verified wallet labels",
      "Basic alerts",
    ],
  },
  growth: {
    name: "Growth",
    price: "$299/mo",
    description: "For active founders managing multiple token projects.",
    bullets: [
      "Up to 5 projects",
      "Up to 50 wallets",
      "Advanced alerts",
      "Trust analytics",
      "Priority support",
    ],
  },
  enterprise: {
    name: "Enterprise",
    price: "Custom",
    description: "For launchpads, agencies, exchanges, and serious teams.",
    bullets: [
      "Unlimited projects",
      "Custom wallet monitoring",
      "Team workflows",
      "Custom integrations",
      "Enterprise support",
    ],
  },
};

function maskWallet(wallet: string) {
  return `${wallet.slice(0, 6)}...${wallet.slice(-6)}`;
}

export default function CryptoCheckoutPage() {
  const params = useParams();
  const router = useRouter();

  const rawPlan = String(params?.plan || "starter").toLowerCase();
  const planKey: PlanKey =
    rawPlan === "launch-pass" ||
    rawPlan === "starter" ||
    rawPlan === "growth" ||
    rawPlan === "enterprise"
      ? rawPlan
      : "starter";

  const plan = PLANS[planKey];

  const [wallet, setWallet] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function connectPhantom() {
    try {
      const provider = (window as any).solana;

      if (!provider || !provider.isPhantom) {
        alert("Phantom wallet not found.");
        return;
      }

      const resp = await provider.connect();
      setWallet(resp.publicKey.toString());
    } catch (error) {
      console.error(error);
    }
  }

  async function payWithPhantom() {
    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSignature("TEMP_SIGNATURE_REMOVE_AFTER_REAL_PAYMENT");
      router.push("/app/projects/new");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-[330px] shrink-0 border-r border-white/10 bg-[#070b1a] lg:flex lg:flex-col">
          <div className="p-8">
            <img
              src={LOGO_URL}
              alt="WEB3MB"
              className="h-24 w-auto object-contain"
            />

            <div className="mt-8 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-5 py-3 text-center text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
              Secure Checkout
            </div>

            <p className="mt-7 text-sm leading-7 text-zinc-300">
              Activate your WEB3MB subscription using Phantom wallet payment.
            </p>

            <nav className="mt-10 space-y-3">
              <Link
                href="/app/billing"
                className="block rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-black hover:bg-white/10"
              >
                Back to Billing
              </Link>

              <Link
                href="/app"
                className="block rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-black hover:bg-white/10"
              >
                Owner Dashboard
              </Link>

              <Link
                href="/transparency"
                className="block rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-black hover:bg-white/10"
              >
                Public Directory
              </Link>
            </nav>
          </div>

          <div className="mt-auto p-8">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                Support
              </div>
              <div className="mt-4 text-sm font-black">verify@web3mb.com</div>
            </div>
          </div>
        </aside>

        <section className="relative flex-1 overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.18),transparent_35%)]" />

          <img
            src={LOGO_URL}
            alt=""
            className="pointer-events-none absolute right-10 top-10 hidden w-[520px] opacity-[0.04] blur-[1px] xl:block"
          />

          <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-6 py-12">
            <div className="w-full rounded-3xl border border-white/10 bg-zinc-950/80 p-8 shadow-2xl backdrop-blur md:p-10">
              <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-start">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
                    WEB3MB Crypto Checkout
                  </p>

                  <h1 className="mt-4 text-4xl font-black tracking-tight">
                    Activate {plan.name}
                  </h1>

                  <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400">
                    {plan.description}
                  </p>
                </div>

                <Link
                  href="/app/billing"
                  className="rounded-xl border border-white/10 bg-white/10 px-5 py-4 text-sm font-black hover:bg-white/15"
                >
                  Back to Billing
                </Link>
              </div>

              <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
                <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/5 p-7">
                  <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
                    Selected Plan
                  </p>

                  <h2 className="mt-5 text-3xl font-black">{plan.name}</h2>

                  <div className="mt-5 text-4xl font-black text-cyan-300">
                    {plan.price}
                  </div>

                  <ul className="mt-8 space-y-4 text-sm text-zinc-200">
                    {plan.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-3">
                        <span className="text-cyan-300">•</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-7">
                  <p className="text-xs font-black uppercase tracking-[0.35em] text-zinc-400">
                    Status
                  </p>

                  <h2 className="mt-5 text-2xl font-black">
                    Ready for Phantom payment
                  </h2>

                  <div className="mt-6 space-y-4">
                    <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                      <div className="text-sm text-zinc-500">Amount</div>
                      <div className="mt-1 font-black">{plan.price}</div>
                    </div>

                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                      <div className="text-sm font-black text-emerald-300">
                        Secure Recipient
                      </div>
                      <div className="mt-2 text-sm leading-6 text-zinc-200">
                        Payment destination is embedded securely inside the
                        Phantom transaction and is not displayed publicly on
                        this page.
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={connectPhantom}
                      className="rounded-xl bg-white px-5 py-4 font-black text-black hover:bg-zinc-200"
                    >
                      Connect Phantom
                    </button>

                    <button
                      type="button"
                      onClick={payWithPhantom}
                      disabled={loading}
                      className="rounded-xl bg-emerald-500 px-5 py-4 font-black text-black hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loading ? "Processing..." : "Pay With Phantom"}
                    </button>
                  </div>

                  {wallet ? (
                    <div className="mt-5 rounded-xl border border-white/10 bg-black/30 p-4 text-sm">
                      <div className="text-zinc-500">Connected Wallet</div>
                      <div className="mt-1 break-all font-black">
                        {maskWallet(wallet)}
                      </div>
                    </div>
                  ) : null}

                  {signature ? (
                    <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
                      <div className="text-emerald-300">
                        Transaction Signature
                      </div>
                      <div className="mt-1 break-all font-black">
                        {signature}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
