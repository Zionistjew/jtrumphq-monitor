"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

type CheckoutPlan = "starter" | "growth";

type PaymentSession = {
  paymentId?: string;
  id?: string;
  plan?: string;
  amountSol?: number;
  amountLamports?: number;
  recipientWallet?: string;
  recipient?: string;
  expiresAt?: string;
  expires_at?: string;
  amountUsd?: number;
  solUsdRate?: number;
  solUsdRateSource?: string;
};

type PhantomProvider = {
  isPhantom?: boolean;
  publicKey?: PublicKey;
  connect: () => Promise<{ publicKey: PublicKey }>;
  signAndSendTransaction: (
    transaction: Transaction
  ) => Promise<{ signature: string }>;
};

declare global {
  interface Window {
    solana?: PhantomProvider;
  }
}

const PLAN_CONFIG = {
  starter: {
    label: "Starter",
    price: "$99/mo",
    description: "For one token project launching public trust monitoring.",
    features: [
      "1 project",
      "Up to 5 wallets",
      "Live wallet monitoring",
      "Basic alerts",
      "Public trust badge",
    ],
  },
  growth: {
    label: "Growth",
    price: "$299/mo",
    description: "For active founders managing multiple token projects.",
    features: [
      "Up to 5 projects",
      "Up to 50 wallets",
      "Advanced alerts",
      "Trust analytics",
      "Priority support",
    ],
  },
} as const;

function maskWallet(wallet?: string) {
  if (!wallet) return "";
  if (wallet.length <= 12) return wallet;
  return `${wallet.slice(0, 6)}...${wallet.slice(-6)}`;
}

function getPaymentId(payment: PaymentSession | null) {
  return payment?.paymentId || payment?.id || "";
}

function getRecipient(payment: PaymentSession | null) {
  return payment?.recipientWallet || payment?.recipient || "";
}

function getLamports(payment: PaymentSession | null) {
  if (!payment) return 0;

  if (typeof payment.amountLamports === "number") {
    return payment.amountLamports;
  }

  if (typeof payment.amountSol === "number") {
    return Math.round(payment.amountSol * LAMPORTS_PER_SOL);
  }

  return 0;
}

function getSolAmount(payment: PaymentSession | null) {
  if (!payment?.amountSol) return "—";
  return `${payment.amountSol.toFixed(4)} SOL`;
}

export default function CryptoPlanCheckoutPage({
  params,
}: {
  params: { plan: string };
}) {
  const normalizedPlan = params.plan?.toLowerCase();

  const plan =
    normalizedPlan === "starter" || normalizedPlan === "growth"
      ? (normalizedPlan as CheckoutPlan)
      : null;

  const config = plan ? PLAN_CONFIG[plan] : null;

  const [payment, setPayment] = useState<PaymentSession | null>(null);
  const [wallet, setWallet] = useState("");
  const [status, setStatus] = useState("Preparing payment session...");
  const [error, setError] = useState("");
  const [signature, setSignature] = useState("");
  const [loading, setLoading] = useState(false);

  const rpcUrl = useMemo(() => {
    return (
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
      "https://api.mainnet-beta.solana.com"
    );
  }, []);

  useEffect(() => {
    async function createPaymentSession() {
      if (!config || !plan) return;

      setError("");
      setStatus("Creating secure payment session...");

      try {
        const res = await fetch("/api/payments/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ plan }),
        });

        const data = await res.json();

        if (!res.ok || data?.ok === false) {
          throw new Error(data?.error || "Unable to create payment session");
        }

        setPayment(data.payment || data);
        setStatus("Payment session ready");
      } catch (err: any) {
        setError(err?.message || "Failed to create payment session");
        setStatus("Payment session failed");
      }
    }

    createPaymentSession();
  }, [config, plan]);

  async function connectPhantom() {
    setError("");

    try {
      const provider = window.solana;

      if (!provider?.isPhantom) {
        throw new Error("Phantom wallet is not installed.");
      }

      const response = await provider.connect();
      setWallet(response.publicKey.toBase58());
      setStatus("Wallet connected");
    } catch (err: any) {
      setError(err?.message || "Failed to connect Phantom");
    }
  }

  async function payWithPhantom() {
    setError("");
    setLoading(true);

    try {
      const provider = window.solana;

      if (!provider?.isPhantom) {
        throw new Error("Phantom wallet is not installed.");
      }

      const connected = provider.publicKey
        ? { publicKey: provider.publicKey }
        : await provider.connect();

      const fromPubkey = connected.publicKey;
      setWallet(fromPubkey.toBase58());

      const recipient = getRecipient(payment);
      const lamports = getLamports(payment);
      const paymentId = getPaymentId(payment);

      if (!recipient) throw new Error("Missing payment recipient.");
      if (!lamports) throw new Error("Missing payment amount.");
      if (!paymentId) throw new Error("Missing payment ID.");

      const connection = new Connection(rpcUrl, "confirmed");

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey: new PublicKey(recipient),
          lamports,
        })
      );

      transaction.feePayer = fromPubkey;

      const latestBlockhash = await connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = latestBlockhash.blockhash;

      setStatus("Waiting for Phantom approval...");

      const result = await provider.signAndSendTransaction(transaction);

      setSignature(result.signature);
      setStatus("Payment sent. Confirming on-chain...");

      await connection.confirmTransaction(
        {
          signature: result.signature,
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        },
        "confirmed"
      );

      const confirmRes = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentId,
          signature: result.signature,
          walletAddress: fromPubkey.toBase58(),
          plan,
        }),
      });

      const confirmData = await confirmRes.json().catch(() => null);

      if (!confirmRes.ok || confirmData?.ok === false) {
        throw new Error(
          confirmData?.error ||
            "Payment sent, but subscription activation did not complete."
        );
      }

      setStatus("Payment confirmed. Subscription activation complete.");
    } catch (err: any) {
      setError(err?.message || "Payment failed");
      setStatus("Payment failed");
    } finally {
      setLoading(false);
    }
  }

  if (!config || !plan) {
    return (
      <main className="min-h-screen bg-black px-6 py-12 text-white">
        <div className="mx-auto max-w-2xl rounded-3xl border border-red-500/40 bg-red-500/5 p-8">
          <h1 className="text-3xl font-bold">Invalid Plan</h1>

          <p className="mt-4 text-zinc-300">
            The selected checkout plan does not exist.
          </p>

          <Link
            href="/app/billing"
            className="mt-6 inline-flex rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-black hover:bg-cyan-400"
          >
            Back to Billing
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-black text-white">
      <aside className="hidden w-[310px] shrink-0 border-r border-white/10 bg-[#050816] xl:block">
        <div className="flex min-h-screen flex-col px-6 py-8">
          <img
            src="https://web3mb.com/wp-content/uploads/2026/04/WEB3MB-L.png"
            alt="WEB3MB Logo"
            className="h-24 w-auto object-contain"
          />

          <div className="mt-5 inline-flex rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs uppercase tracking-[0.22em] text-cyan-300">
            Secure Checkout
          </div>

          <p className="mt-5 text-sm leading-7 text-zinc-400">
            Activate your WEB3MB subscription using Phantom wallet payment.
          </p>

          <div className="mt-8 space-y-3">
            <Link
              href="/app/billing"
              className="block rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-sm font-semibold hover:bg-white/10"
            >
              Back to Billing
            </Link>

            <Link
              href="/app"
              className="block rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-sm font-semibold hover:bg-white/10"
            >
              Owner Dashboard
            </Link>

            <Link
              href="/transparency"
              className="block rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-sm font-semibold hover:bg-white/10"
            >
              Public Directory
            </Link>
          </div>

          <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">
              Support
            </div>

            <div className="mt-3 break-all text-xs font-semibold">
              verify@web3mb.com
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 px-6 py-12">
        <div className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">
                WEB3MB Crypto Checkout
              </p>

              <h1 className="mt-4 text-4xl font-bold">
                Activate {config.label}
              </h1>

              <p className="mt-4 max-w-2xl text-zinc-400">
                {config.description}
              </p>
            </div>

            <Link
              href="/app/billing"
              className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/15"
            >
              Back to Billing
            </Link>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-[1fr_1.2fr]">
            <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-6">
              <div className="text-sm uppercase tracking-[0.25em] text-cyan-300">
                Selected Plan
              </div>

              <h2 className="mt-3 text-3xl font-bold">{config.label}</h2>

              <div className="mt-4 text-4xl font-bold text-cyan-400">
                {config.price}
              </div>

              <ul className="mt-6 space-y-3 text-sm text-zinc-300">
                {config.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span className="text-cyan-400">•</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <div className="text-sm uppercase tracking-[0.25em] text-zinc-400">
                Status
              </div>

              <h2 className="mt-2 text-2xl font-bold">{status}</h2>

              {error ? (
                <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              <div className="mt-6 space-y-4 text-sm">
                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <div className="text-zinc-500">Payment ID</div>
                  <div className="mt-1 break-all font-semibold">
                    {getPaymentId(payment) || "Creating..."}
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <div className="text-zinc-500">Amount</div>

                  <div className="mt-1 font-semibold">
                    {payment?.amountUsd ? `$${payment.amountUsd} USD / ` : ""}
                    {getSolAmount(payment)}
                  </div>

                  {payment?.solUsdRate ? (
                    <div className="mt-1 text-xs text-zinc-500">
                      Live conversion rate: 1 SOL = ${payment.solUsdRate}
                    </div>
                  ) : null}

                  {payment?.solUsdRateSource ? (
                    <div className="mt-1 text-xs text-zinc-600">
                      Rate source: {payment.solUsdRateSource}
                    </div>
                  ) : null}
                </div>

                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <div className="text-emerald-300">Secure Recipient</div>
                  <div className="mt-1 text-zinc-300">
                    Payment destination is embedded securely inside the Phantom
                    transaction and is not displayed publicly on this page.
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={connectPhantom}
                  className="rounded-xl bg-white px-5 py-4 font-semibold text-black hover:bg-zinc-200"
                >
                  Connect Phantom
                </button>

                <button
                  onClick={payWithPhantom}
                  disabled={loading || !payment}
                  className="rounded-xl bg-emerald-500 px-5 py-4 font-semibold text-black hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Processing..." : "Pay With Phantom"}
                </button>
              </div>

              {wallet ? (
                <div className="mt-5 rounded-xl border border-white/10 bg-black/30 p-4 text-sm">
                  <div className="text-zinc-500">Connected Wallet</div>
                  <div className="mt-1 break-all font-semibold">
                    {maskWallet(wallet)}
                  </div>
                </div>
              ) : null}

              {signature ? (
                <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
                  <div className="text-emerald-300">Transaction Signature</div>
                  <div className="mt-1 break-all font-semibold">
                    {signature}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
