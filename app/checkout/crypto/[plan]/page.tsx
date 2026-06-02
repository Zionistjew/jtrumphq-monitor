"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

type PlanKey = "launch-pass" | "starter" | "growth" | "enterprise";

type PaymentSession = {
  id: string;
  plan: string;
  amountUsd: number;
  solAmount: number;
  lamports: number;
  solUsdRate?: number;
  solUsdRateSource?: string;
  recipient: string;
};

type LatestBlockhashResponse = {
  ok?: boolean;
  blockhash?: string;
  lastValidBlockHeight?: number;
  error?: string;
  details?: string[];
};

const LOGO_URL = "https://web3mb.com/wp-content/uploads/2026/04/WEB3MB-L.png";

const PLANS: Record<
  PlanKey,
  { name: string; price: string; description: string; bullets: string[] }
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

function getPlanKey(value: string): PlanKey {
  const clean = value.toLowerCase();

  if (
    clean === "launch-pass" ||
    clean === "starter" ||
    clean === "growth" ||
    clean === "enterprise"
  ) {
    return clean;
  }

  return "starter";
}

function maskWallet(wallet: string) {
  return `${wallet.slice(0, 6)}...${wallet.slice(-6)}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getServerBlockhash(): Promise<{
  blockhash: string;
  lastValidBlockHeight: number;
}> {
  const res = await fetch("/api/solana/latest-blockhash", {
    method: "GET",
    cache: "no-store",
  });

  const data = (await res.json().catch(() => null)) as LatestBlockhashResponse | null;

  if (!res.ok || !data?.ok || !data.blockhash || !data.lastValidBlockHeight) {
    throw new Error(
      data?.error ||
        data?.details?.join(" | ") ||
        "Unable to get latest Solana blockhash."
    );
  }

  return {
    blockhash: data.blockhash,
    lastValidBlockHeight: data.lastValidBlockHeight,
  };
}

export default function CryptoCheckoutPage() {
  const params = useParams();
  const router = useRouter();

  const planKey = getPlanKey(String(params?.plan || "starter"));
  const plan = PLANS[planKey];

  const [wallet, setWallet] = useState<string | null>(null);
  const [payment, setPayment] = useState<PaymentSession | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  const rpcUrl =
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
    "https://api.mainnet-beta.solana.com";

  const amountLabel = useMemo(() => {
    if (!payment) return plan.price;
    return `${payment.solAmount} SOL / $${payment.amountUsd}`;
  }, [payment, plan.price]);

  async function createPaymentSession(
    walletForSession?: string
  ): Promise<PaymentSession> {
    setSessionLoading(true);
    setError("");

    try {
      if (planKey === "enterprise") {
        throw new Error(
          "Enterprise plans require manual setup. Please contact support."
        );
      }

      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          plan: planKey,
          walletAddress: walletForSession || wallet || "",
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.error || data?.message || "Payment session failed."
        );
      }

      if (
        !data?.payment?.id ||
        !data?.payment?.recipient ||
        !data?.payment?.lamports
      ) {
        throw new Error("Payment session is missing payment details.");
      }

      setPayment(data.payment);
      return data.payment;
    } finally {
      setSessionLoading(false);
    }
  }

  async function connectPhantom() {
    try {
      setError("");

      const provider = (window as any).solana;

      if (!provider || !provider.isPhantom) {
        throw new Error(
          "Phantom wallet not found. Please install or unlock Phantom."
        );
      }

      const resp = await provider.connect();
      const walletAddress = resp.publicKey.toString();

      setWallet(walletAddress);

      if (!payment && planKey !== "enterprise") {
        await createPaymentSession(walletAddress);
      }
    } catch (err: any) {
      setError(err?.message || "Unable to connect Phantom.");
    }
  }

  async function buildTransaction(
    payerPublicKey: PublicKey,
    activePayment: PaymentSession
  ) {
    const recipientPublicKey = new PublicKey(activePayment.recipient);
    const { blockhash, lastValidBlockHeight } = await getServerBlockhash();

    const transaction = new Transaction({
      feePayer: payerPublicKey,
      blockhash,
      lastValidBlockHeight,
    });

    transaction.add(
      SystemProgram.transfer({
        fromPubkey: payerPublicKey,
        toPubkey: recipientPublicKey,
        lamports: Number(activePayment.lamports),
      })
    );

    return {
      transaction,
      blockhash,
      lastValidBlockHeight,
    };
  }

  async function sendSolPayment(
    provider: any,
    payerPublicKey: PublicKey,
    activePayment: PaymentSession
  ) {
    const { transaction, blockhash, lastValidBlockHeight } =
      await buildTransaction(payerPublicKey, activePayment);

    if (typeof provider.signAndSendTransaction === "function") {
      const result = await provider.signAndSendTransaction(transaction);

      const txSignature =
        typeof result === "string" ? result : result?.signature || "";

      if (!txSignature) {
        throw new Error("Phantom did not return a transaction signature.");
      }

      return txSignature;
    }

    const signedTransaction = await provider.signTransaction(transaction);

    const connection = new Connection(rpcUrl, "confirmed");

    const txSignature = await connection.sendRawTransaction(
      signedTransaction.serialize(),
      {
        skipPreflight: false,
        preflightCommitment: "confirmed",
        maxRetries: 5,
      }
    );

    const confirmation = await connection.confirmTransaction(
      {
        signature: txSignature,
        blockhash,
        lastValidBlockHeight,
      },
      "confirmed"
    );

    if (confirmation.value.err) {
      throw new Error("Transaction failed on-chain.");
    }

    return txSignature;
  }

  async function payWithPhantom() {
    try {
      setPaying(true);
      setError("");
      setSignature(null);

      const provider = (window as any).solana;

      if (!provider || !provider.isPhantom) {
        throw new Error(
          "Phantom wallet not found. Please install or unlock Phantom."
        );
      }

      const connected = await provider.connect();
      const payerPublicKey = new PublicKey(connected.publicKey.toString());
      const payerWallet = payerPublicKey.toBase58();

      setWallet(payerWallet);

      const activePayment =
        payment || (await createPaymentSession(payerWallet));

      let txSignature = "";

      try {
        txSignature = await sendSolPayment(
          provider,
          payerPublicKey,
          activePayment
        );
      } catch (sendError: any) {
        const msg = String(sendError?.message || sendError || "").toLowerCase();

        if (
          msg.includes("blockhash not found") ||
          msg.includes("blockhash expired") ||
          msg.includes("transaction expired")
        ) {
          await sleep(900);

          txSignature = await sendSolPayment(
            provider,
            payerPublicKey,
            activePayment
          );
        } else {
          throw sendError;
        }
      }

      setSignature(txSignature);

      const confirmRes = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          paymentId: activePayment.id,
          signature: txSignature,
          walletAddress: payerWallet,
        }),
      });

      const confirmData = await confirmRes.json().catch(() => null);

      if (!confirmRes.ok) {
        throw new Error(
          confirmData?.error ||
            confirmData?.message ||
            "Payment sent, but dashboard unlock failed."
        );
      }

      router.push(confirmData?.redirectTo || "/app/projects/new");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Payment failed.");
    } finally {
      setPaying(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="sticky top-0 z-50 flex items-center justify-between border-b border-white/10 bg-[#070b1a]/95 px-4 py-3 backdrop-blur lg:hidden">
        <Link href="/app/billing" className="block">
          <img
            src={LOGO_URL}
            alt="WEB3MB"
            className="h-12 w-auto object-contain"
          />
        </Link>

        <Link
          href="/app/billing"
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white"
        >
          Change Plan
        </Link>
      </div>

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
                className="block rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black hover:bg-white/10 sm:px-5 sm:py-4"
              >
                Back to Billing
              </Link>

              <Link
                href="/app"
                className="block rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black hover:bg-white/10 sm:px-5 sm:py-4"
              >
                Owner Dashboard
              </Link>

              <Link
                href="/transparency"
                className="block rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black hover:bg-white/10 sm:px-5 sm:py-4"
              >
                Public Directory
              </Link>
            </nav>
          </div>

          <div className="mt-auto p-8">
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 sm:rounded-2xl">
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

          <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-4 py-6 sm:px-6 sm:py-12">
            <div className="w-full rounded-xl border border-white/10 bg-zinc-950/80 p-4 shadow-2xl backdrop-blur sm:rounded-3xl sm:p-8 md:p-10">
              <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-start">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
                    WEB3MB Crypto Checkout
                  </p>

                  <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                    Activate {plan.name}
                  </h1>

                  <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400">
                    {plan.description}
                  </p>
                </div>

                <Link
                  href="/app/billing"
                  className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-black hover:bg-white/15 sm:px-5 sm:py-4"
                >
                  Back to Billing
                </Link>
              </div>

              <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr] lg:gap-8">
                <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/5 p-4 sm:rounded-2xl sm:p-7">
                  <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
                    Selected Plan
                  </p>

                  <h2 className="mt-5 text-3xl font-black">{plan.name}</h2>

                  <div className="mt-5 text-3xl font-black text-cyan-300 sm:text-4xl">
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

                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 sm:rounded-2xl sm:p-7">
                  <p className="text-xs font-black uppercase tracking-[0.35em] text-zinc-400">
                    Status
                  </p>

                  <h2 className="mt-5 text-2xl font-black">
                    {sessionLoading
                      ? "Creating payment session"
                      : payment
                        ? "Ready for Phantom payment"
                        : "Connect Phantom to create payment session"}
                  </h2>

                  {error ? (
                    <div className="mt-5 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
                      {error}
                    </div>
                  ) : null}

                  <div className="mt-6 space-y-4">
                    <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                      <div className="text-sm text-zinc-500">Payment ID</div>
                      <div className="mt-1 break-all font-black">
                        {payment?.id ||
                          (sessionLoading
                            ? "Creating..."
                            : "Connect Phantom first")}
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                      <div className="text-sm text-zinc-500">Amount</div>
                      <div className="mt-1 font-black">{amountLabel}</div>

                      {payment?.solUsdRate ? (
                        <div className="mt-2 text-xs text-zinc-500">
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
                      <div className="text-sm font-black text-emerald-300">
                        Secure Recipient
                      </div>
                      <div className="mt-2 text-sm leading-6 text-zinc-200">
                        Phantom will open and show the exact SOL amount before
                        approval.
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={connectPhantom}
                      disabled={paying}
                      className="rounded-xl bg-white px-4 py-3 font-black text-black hover:bg-zinc-200 disabled:cursor-wait disabled:opacity-70 sm:px-5 sm:py-4"
                    >
                      Connect Phantom
                    </button>

                    <button
                      type="button"
                      onClick={payWithPhantom}
                      disabled={paying || sessionLoading}
                      className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-3 font-black text-black hover:bg-emerald-400 disabled:cursor-wait disabled:opacity-70 sm:px-5 sm:py-4"
                    >
                      {paying ? "Sending SOL..." : "Pay With Phantom"}
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
                      <div className="mt-1 break-all font-black">{signature}</div>
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
