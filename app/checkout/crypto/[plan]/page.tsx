"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  params: {
    plan: string;
  };
};

type PaymentResponse = {
  ok: boolean;
  paymentId: string;
  amountSol: number;
  amountLamports: number;
  recipientWallet: string;
  expiresAt: string;
  status: string;
  error?: string;
};

type ConfirmResponse = {
  ok: boolean;
  status?: string;
  unlocked?: boolean;
  pending?: boolean;
  reason?: string;
  error?: string;
};

function getPhantomProvider() {
  if (typeof window === "undefined") return null;
  return (window as any)?.phantom?.solana ?? null;
}

async function connectPhantomWallet() {
  const provider = getPhantomProvider();

  if (!provider?.isPhantom) {
    throw new Error("Phantom wallet not found. Please install Phantom.");
  }

  const res = await provider.connect();

  return {
    provider,
    walletAddress: res.publicKey.toString(),
  };
}

export default function CheckoutPlanPage({ params }: Props) {
  const plan = params.plan?.toLowerCase();
  const [payment, setPayment] = useState<PaymentResponse | null>(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [txSignature, setTxSignature] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  const shortWallet = useMemo(() => {
    if (!walletAddress) return "";
    return `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;
  }, [walletAddress]);

  useEffect(() => {
    async function createPayment() {
      if (plan !== "starter" && plan !== "pro" && plan !== "enterprise") {
        setStatus("invalid");
        return;
      }

      try {
        setStatus("creating");

        const res = await fetch("/api/payments/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan }),
        });

        const data = await res.json();

        if (!data.ok) {
          throw new Error(data.error || "Failed to create payment session");
        }

        setPayment(data);
        setStatus("ready");
      } catch (err: any) {
        setError(err?.message || "Failed to create payment session");
        setStatus("failed");
      }
    }

    createPayment();
  }, [plan]);

  useEffect(() => {
    if (!payment?.paymentId) return;
    if (status !== "submitted" && status !== "confirming") return;

    const currentPaymentId = payment.paymentId;
    let interval: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    async function pollStatus(paymentId: string) {
      try {
        setIsPolling(true);

        const res = await fetch(`/api/payments/status/${paymentId}`);
        const data = await res.json();

        if (cancelled) return;

        if (data?.status === "confirmed") {
          if (interval) clearInterval(interval);
          setStatus("confirmed");
          setIsPolling(false);
          window.location.href = "/dashboard";
          return;
        }

        if (data?.status === "expired") {
          if (interval) clearInterval(interval);
          setStatus("expired");
          setIsPolling(false);
          setError("Payment session expired.");
          return;
        }

        if (data?.status === "failed") {
          if (interval) clearInterval(interval);
          setStatus("failed");
          setIsPolling(false);
          setError("Payment verification failed.");
          return;
        }

        setStatus("submitted");
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message || "Failed while checking payment status");
      }
    }

    pollStatus(currentPaymentId);
    interval = setInterval(() => pollStatus(currentPaymentId), 3000);

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      setIsPolling(false);
    };
  }, [payment?.paymentId, status]);

  async function handleConnect() {
    setError("");

    try {
      const { walletAddress } = await connectPhantomWallet();
      setWalletAddress(walletAddress);
    } catch (err: any) {
      setError(err?.message || "Failed to connect Phantom");
    }
  }

  async function handlePay() {
    if (!payment) {
      setError("Payment session not ready.");
      return;
    }

    if (!walletAddress) {
      setError("Connect Phantom first.");
      return;
    }

    setError("");
    setIsPaying(true);

    try {
      const { provider, walletAddress: connectedWallet } =
        await connectPhantomWallet();

      setWalletAddress(connectedWallet);
      setStatus("opening-wallet");

      const solanaWeb3 = await import("@solana/web3.js");

      const blockhashRes = await fetch("/api/solana/latest-blockhash");
      const blockhashData = await blockhashRes.json();

      if (!blockhashData.ok || !blockhashData.blockhash) {
        throw new Error(blockhashData.error || "Failed to fetch blockhash");
      }

      const tx = new solanaWeb3.Transaction({
        feePayer: new solanaWeb3.PublicKey(connectedWallet),
        recentBlockhash: blockhashData.blockhash,
      }).add(
        solanaWeb3.SystemProgram.transfer({
          fromPubkey: new solanaWeb3.PublicKey(connectedWallet),
          toPubkey: new solanaWeb3.PublicKey(payment.recipientWallet),
          lamports: payment.amountLamports,
        })
      );

      const result = await provider.signAndSendTransaction(tx);
      const signature = result.signature;

      setTxSignature(signature);
      setStatus("confirming");

      const confirmRes = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: payment.paymentId,
          signature,
          senderWallet: connectedWallet,
        }),
      });

      const confirmData: ConfirmResponse = await confirmRes.json();

      if (!confirmData.ok && !confirmData.pending) {
        throw new Error(confirmData.error || "Payment confirmation failed");
      }

      if (confirmData.status === "confirmed" && confirmData.unlocked) {
        setStatus("confirmed");
        window.location.href = "/dashboard";
        return;
      }

      setStatus("submitted");
    } catch (err: any) {
      setError(err?.message || "Failed to send payment");
      setStatus("failed");
    } finally {
      setIsPaying(false);
    }
  }

  if (status === "invalid") {
    return (
      <main className="min-h-screen bg-black px-4 py-12 text-white">
        <div className="mx-auto max-w-2xl rounded-2xl border border-red-800 bg-zinc-950 p-6">
          <h1 className="text-3xl font-bold">Invalid Plan</h1>
          <p className="mt-4 text-zinc-400">
            The selected checkout plan does not exist.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-4 py-12 text-white">
      <div className="mx-auto max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
        <h1 className="text-3xl font-bold">Crypto Checkout</h1>
        <p className="mt-4 text-zinc-400 capitalize">Selected Plan: {plan}</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={handleConnect}
            className="rounded-xl bg-white px-4 py-3 font-semibold text-black"
          >
            {walletAddress ? `Connected: ${shortWallet}` : "Connect Phantom"}
          </button>

          <button
            onClick={handlePay}
            disabled={
              !payment ||
              !walletAddress ||
              isPaying ||
              isPolling ||
              status === "confirmed"
            }
            className="rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-black disabled:opacity-50"
          >
            {isPaying
              ? "Processing..."
              : isPolling
              ? "Checking Confirmation..."
              : "Pay With Phantom"}
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="mb-4">
            <div className="text-sm text-zinc-400">Status</div>
            <div className="text-lg font-semibold capitalize">
              {status === "loading" && "Loading"}
              {status === "creating" && "Creating payment session"}
              {status === "ready" && "Payment session ready"}
              {status === "opening-wallet" && "Opening wallet"}
              {status === "confirming" && "Confirming payment"}
              {status === "submitted" &&
                "Payment submitted. Waiting for confirmation"}
              {status === "confirmed" && "Payment confirmed. Redirecting"}
              {status === "expired" && "Payment expired"}
              {status === "failed" && "Something went wrong"}
            </div>
          </div>

          {payment ? (
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-zinc-400">Payment ID:</span>{" "}
                {payment.paymentId}
              </div>
              <div>
                <span className="text-zinc-400">Amount:</span>{" "}
                {payment.amountSol} SOL
              </div>
              <div className="break-all">
                <span className="text-zinc-400">Recipient:</span>{" "}
                {payment.recipientWallet}
              </div>
              <div>
                <span className="text-zinc-400">Expires:</span>{" "}
                {payment.expiresAt}
              </div>
              {walletAddress ? (
                <div className="break-all">
                  <span className="text-zinc-400">Connected Wallet:</span>{" "}
                  {walletAddress}
                </div>
              ) : null}
              {txSignature ? (
                <div className="break-all">
                  <span className="text-zinc-400">Signature:</span>{" "}
                  {txSignature}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="text-sm text-zinc-400">
              Preparing your payment session...
            </div>
          )}
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-800 bg-red-950 px-4 py-3 text-red-300">
            {error}
          </div>
        ) : null}
      </div>
    </main>
  );
}
