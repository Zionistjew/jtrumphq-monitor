"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PhantomCheckout from "@/components/PhantomCheckout";

export default function PhantomCheckoutClient() {
  const searchParams = useSearchParams();
  const plan = (searchParams.get("plan") || "").toLowerCase();

  const validPlan =
    plan === "starter" || plan === "pro" || plan === "enterprise";

  if (!validPlan) {
    return (
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-2 text-4xl font-bold">Choose Your Plan</h1>
        <p className="mb-8 text-zinc-400">
          Select a plan to continue to crypto checkout.
        </p>

        <div className="grid gap-6 md:grid-cols-3">
          <Link
            href="/checkout/crypto?plan=starter"
            className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6"
          >
            <h2 className="text-2xl font-semibold">Starter</h2>
            <p className="mt-3 text-zinc-400">0.1 SOL</p>
            <div className="mt-6 inline-block rounded-xl bg-white px-4 py-3 font-semibold text-black">
              Choose Starter
            </div>
          </Link>

          <Link
            href="/checkout/crypto?plan=pro"
            className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6"
          >
            <h2 className="text-2xl font-semibold">Pro</h2>
            <p className="mt-3 text-zinc-400">0.25 SOL</p>
            <div className="mt-6 inline-block rounded-xl bg-white px-4 py-3 font-semibold text-black">
              Choose Pro
            </div>
          </Link>

          <Link
            href="/checkout/crypto?plan=enterprise"
            className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6"
          >
            <h2 className="text-2xl font-semibold">Enterprise</h2>
            <p className="mt-3 text-zinc-400">1 SOL</p>
            <div className="mt-6 inline-block rounded-xl bg-white px-4 py-3 font-semibold text-black">
              Choose Enterprise
            </div>
          </Link>
        </div>
      </div>
    );
  }

  return <PhantomCheckout plan={plan} />;
}
