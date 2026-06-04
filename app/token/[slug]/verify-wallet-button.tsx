"use client";

import { useState } from "react";

type VerifyWalletButtonProps = {
  projectSlug: string;
  walletAddress: string;
  walletLabel?: string | null;
};

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function shortWallet(address?: string) {
  if (!address) return "—";
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function VerifyWalletButton({
  projectSlug,
  walletAddress,
  walletLabel,
}: VerifyWalletButtonProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [connectedWallet, setConnectedWallet] = useState("");

  async function verifyOwnership() {
    try {
      setLoading(true);
      setError("");
      setConnectedWallet("");

      const provider = (window as any).solana;

      if (!provider || !provider.isPhantom) {
        throw new Error("Phantom wallet not found.");
      }

      const connected = await provider.connect();
      const wallet = connected.publicKey.toString();
      setConnectedWallet(wallet);

      if (wallet !== walletAddress) {
        throw new Error("WALLET_MISMATCH");
      }

      const message = [
        "WEB3MB Wallet Ownership Verification",
        `Project: ${projectSlug}`,
        `Wallet: ${walletAddress}`,
        `Label: ${walletLabel || "Disclosed Wallet"}`,
        `Timestamp: ${new Date().toISOString()}`,
        "I confirm that I control this wallet for WEB3MB transparency verification.",
      ].join("\n");

      const encodedMessage = new TextEncoder().encode(message);
      const signed = await provider.signMessage(encodedMessage, "utf8");

      const signature =
        typeof signed?.signature === "string"
          ? signed.signature
          : bytesToHex(signed.signature);

      const res = await fetch("/api/wallets/verify/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectSlug,
          walletAddress,
          signature,
          message,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data?.error || "Verification request failed.");
      }

      setSubmitted(true);
    } catch (err: any) {
      const message =
        err?.message === "WALLET_MISMATCH"
          ? "Wallet verification failed"
          : err?.message || "Verification failed.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 text-center text-sm font-black text-emerald-200">
        Verification Request Submitted
        <div className="mt-1 text-xs font-medium text-emerald-100/80">
          Pending WEB3MB admin review.
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <button
        type="button"
        onClick={verifyOwnership}
        disabled={loading}
        className="inline-flex w-full items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/15 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-500/25 disabled:cursor-wait disabled:opacity-60 md:w-auto"
      >
        {loading ? "Signing..." : "Verify Ownership"}
      </button>

      {error ? (
        <div className="mt-2 max-w-xl rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          <div className="font-semibold">{error}</div>

          <div className="mt-1">
            Please switch Phantom to the wallet shown on this card and try again.
          </div>

          {connectedWallet ? (
            <div className="mt-2 space-y-1 text-xs text-red-300/80">
              <div>Connected: {shortWallet(connectedWallet)}</div>
              <div>Required: {shortWallet(walletAddress)}</div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
