"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type PaymentResponse = {
  paymentId: string;
  reference: string;
  plan: string;
  token: "USDC" | "SOL";
  amount: number;
  amountUsd: number;
  destinationWallet: string;
  status: string;
};

function CryptoCheckoutContent() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "starter";
  const token = (searchParams.get("token") || "USDC") as "USDC" | "SOL";

  const [payment, setPayment] = useState<PaymentResponse | null>(null);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(true);

  useEffect(() => {
    let active = true;

    async function createPayment() {
      try {
        setCreating(true);
        setError("");

        const res = await fetch("/api/payments/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan, token }),
        });

        const json = await res.json();

        if (!res.ok || !json.ok) {
          throw new Error(json.error || "Failed to create payment.");
        }

        if (active) {
          setPayment(json.payment);
        }
      } catch (e: any) {
        if (active) {
          setError(e?.message || "Failed to create payment.");
        }
      } finally {
        if (active) {
          setCreating(false);
        }
      }
    }

    createPayment();

    return () => {
      active = false;
    };
  }, [plan, token]);

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-3xl rounded-3xl border border-neutral-800 bg-neutral-950 p-6">
        <h1 className="text-3xl font-bold">Crypto Checkout</h1>

        {creating && (
          <p className="mt-4 text-neutral-400">Preparing payment...</p>
        )}

        {error && (
          <div className="mt-4 rounded-2xl border border-red-800 bg-red-950/40 px-4 py-3 text-red-300">
            {error}
          </div>
        )}

        {payment && (
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-neutral-800 p-4">
              <p>
                <strong>Plan:</strong> {payment.plan}
              </p>
              <p>
                <strong>Token:</strong> {payment.token}
              </p>
              <p>
                <strong>Amount:</strong> {payment.amount}
              </p>
              <p>
                <strong>USD Value:</strong> ${payment.amountUsd}
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-800 p-4">
              <p className="mb-2">
                <strong>Send payment to:</strong>
              </p>
              <code className="block break-all rounded-xl bg-black p-3 text-sm">
                {payment.destinationWallet}
              </code>
            </div>

            <div className="rounded-2xl border border-neutral-800 p-4">
              <p className="mb-2">
                <strong>Reference:</strong>
              </p>
              <code className="block break-all rounded-xl bg-black p-3 text-sm">
                {payment.reference}
              </code>
            </div>

            <div className="rounded-2xl border border-amber-800 bg-amber-950/30 p-4 text-amber-200">
              Send the exact amount and keep the transaction signature. Next
              we’ll add automatic wallet-connect verification.
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function CryptoCheckoutPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black px-6 py-10 text-white">
          <div className="mx-auto max-w-3xl rounded-3xl border border-neutral-800 bg-neutral-950 p-6">
            <h1 className="text-3xl font-bold">Crypto Checkout</h1>
            <p className="mt-4 text-neutral-400">Loading checkout...</p>
          </div>
        </main>
      }
    >
      <CryptoCheckoutContent />
    </Suspense>
  );
}
