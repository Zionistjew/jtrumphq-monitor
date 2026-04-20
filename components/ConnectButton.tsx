"use client";

import { useState } from "react";
import { connectPhantomWallet, signNonceMessage } from "@/lib/phantom";

export default function ConnectButton() {
  const [walletAddress, setWalletAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleConnect() {
    setLoading(true);
    setError("");

    try {
      const { walletAddress } = await connectPhantomWallet();
      setWalletAddress(walletAddress);
    } catch (err: any) {
      setError(err?.message || "Failed to connect Phantom");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignIn() {
    setLoading(true);
    setError("");

    try {
      const { walletAddress } = await connectPhantomWallet();
      setWalletAddress(walletAddress);

      const nonceRes = await fetch("/api/auth/wallet/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress }),
      });

      const nonceData = await nonceRes.json();

      if (!nonceData.ok) {
        throw new Error(nonceData.error || "Failed to get nonce");
      }

      const signature = await signNonceMessage(nonceData.message);

      const verifyRes = await fetch("/api/auth/wallet/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress,
          message: nonceData.message,
          signature,
        }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyData.ok) {
        throw new Error(verifyData.error || "Wallet sign-in failed");
      }

      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err?.message || "Failed to sign in with wallet");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleConnect}
        disabled={loading}
        className="rounded-xl bg-white px-4 py-3 font-semibold text-black disabled:opacity-50"
      >
        {loading
          ? "Working..."
          : walletAddress
          ? `Connected: ${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
          : "Connect Phantom"}
      </button>

      <button
        onClick={handleSignIn}
        disabled={loading}
        className="rounded-xl border border-zinc-700 px-4 py-3 font-semibold text-white disabled:opacity-50"
      >
        Sign In With Wallet
      </button>

      {error ? (
        <div className="rounded-xl border border-red-800 bg-red-950 px-4 py-3 text-red-300">
          {error}
        </div>
      ) : null}
    </div>
  );
}
