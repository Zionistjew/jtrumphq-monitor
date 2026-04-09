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
  destinationTokenAccount?: string | null;
  status: string;
};

function CryptoCheckoutContent() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "starter";
  const token = (searchParams.get("token") || "USDC") as "USDC" | "SOL";

  const [payment, setPayment] = useState<PaymentResponse | null>(null);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(true);

  const [txSignature, setTxSignature] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [verifySuccess, setVerifySuccess] = useState("");

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

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();

    if (!payment?.paymentId || !txSignature.trim()) {
      setVerifyError("Transaction signature is required.");
      return;
    }

    try {
      setVerifyLoading(true);
      setVerifyError("");
      setVerifySuccess("");

      const res = await fetch("/api/payments/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentId: payment.paymentId,
          txSignature: txSignature.trim(),
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Verification failed.");
      }

      setVerifySuccess("Payment verified successfully.");
      setPayment((prev) =>
        prev
          ? {
              ...prev,
              status: "confirmed",
            }
          : prev
      );
    } catch (e: any) {
      setVerifyError(e?.message || "Verification failed.");
    } finally {
      setVerifyLoading(false);
    }
  }

  const destinationToShow =
    payment?.token === "USDC"
      ? payment.destinationTokenAccount || payment.destinationWallet
      : payment?.destinationWallet || "";

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-[32px] border border-neutral-800 bg-gradient-to-br from-neutral-950 via-black to-red-950/30 p-6 shadow-2xl">
          <div className="mb-6">
            <p className="inline-block rounded-full border border-red-700 px-4 py-1 text-xs uppercase tracking-[0.3em] text-red-300">
              Crypto Checkout
            </p>
            <h1 className="mt-4 text-4xl font-bold">Complete Your Payment</h1>
            <p className="mt-2 text-neutral-400">
              Pay with {token} on Solana and verify the transaction below.
            </p>
          </div>

          {creating && (
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 px-4 py-4 text-neutral-300">
              Preparing payment...
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-800 bg-red-950/40 px-4 py-4 text-red-300">
              {error}
            </div>
          )}

          {payment && (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-neutral-800 bg-black/70 p-5">
                  <p className="text-sm text-neutral-400">Plan</p>
                  <p className="mt-2 text-2xl font-semibold capitalize">
                    {payment.plan}
                  </p>
                </div>

                <div className="rounded-2xl border border-neutral-800 bg-black/70 p-5">
                  <p className="text-sm text-neutral-400">Token</p>
                  <p className="mt-2 text-2xl font-semibold">{payment.token}</p>
                </div>

                <div className="rounded-2xl border border-neutral-800 bg-black/70 p-5">
                  <p className="text-sm text-neutral-400">Amount</p>
                  <p className="mt-2 text-2xl font-semibold">{payment.amount}</p>
                </div>

                <div className="rounded-2xl border border-neutral-800 bg-black/70 p-5">
                  <p className="text-sm text-neutral-400">USD Value</p>
                  <p className="mt-2 text-2xl font-semibold">
                    ${payment.amountUsd}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-800 bg-black/70 p-5">
                <p className="text-sm text-neutral-400">
                  {payment.token === "USDC"
                    ? "Send USDC to this token account"
                    : "Send payment to this wallet"}
                </p>
                <code className="mt-3 block break-all rounded-xl bg-neutral-950 px-4 py-3 text-sm text-neutral-200">
                  {destinationToShow}
                </code>
              </div>

              <div className="rounded-2xl border border-neutral-800 bg-black/70 p-5">
                <p className="text-sm text-neutral-400">Reference</p>
                <code className="mt-3 block break-all rounded-xl bg-neutral-950 px-4 py-3 text-sm text-neutral-200">
                  {payment.reference}
                </code>
              </div>

              <div className="rounded-2xl border border-amber-800 bg-amber-950/20 p-5 text-amber-200">
                Send the exact amount shown above. After payment, copy the
                transaction signature from your wallet and paste it below.
              </div>

              {payment.status !== "confirmed" && (
                <form
                  onSubmit={handleVerify}
                  className="rounded-2xl border border-neutral-800 bg-black/70 p-5"
                >
                  <label className="mb-2 block text-sm text-neutral-300">
                    Paste transaction signature
                  </label>

                  <input
                    value={txSignature}
                    onChange={(e) => setTxSignature(e.target.value)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 outline-none focus:border-red-700"
                    placeholder="Transaction signature"
                  />

                  {verifyError && (
                    <div className="mt-4 rounded-2xl border border-red-800 bg-red-950/40 px-4 py-3 text-red-300">
                      {verifyError}
                    </div>
                  )}

                  {verifySuccess && (
                    <div className="mt-4 rounded-2xl border border-emerald-800 bg-emerald-950/40 px-4 py-3 text-emerald-300">
                      {verifySuccess}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={verifyLoading}
                    className="mt-5 inline-flex rounded-2xl bg-red-700 px-6 py-3 font-medium text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {verifyLoading ? "Verifying..." : "Verify Payment"}
                  </button>
                </form>
              )}

              {payment.status === "confirmed" && (
                <div className="rounded-2xl border border-emerald-800 bg-emerald-950/30 p-5 text-emerald-200">
                  Payment confirmed on-chain.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function CryptoCheckoutPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black px-6 py-10 text-white">
          <div className="mx-auto max-w-4xl rounded-[32px] border border-neutral-800 bg-gradient-to-br from-neutral-950 via-black to-red-950/30 p-6">
            <h1 className="text-4xl font-bold">Crypto Checkout</h1>
            <p className="mt-3 text-neutral-400">Loading checkout...</p>
          </div>
        </main>
      }
    >
      <CryptoCheckoutContent />
    </Suspense>
  );
}
