"use client";

import { useState } from "react";

export default function CryptoCheckoutPage() {
  const [wallet, setWallet] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);

  const connectPhantom = async () => {
    try {
      const provider = (window as any).solana;
      if (!provider) {
        alert("Phantom wallet not found");
        return;
      }

      const resp = await provider.connect();
      setWallet(resp.publicKey.toString());
    } catch (err) {
      console.error(err);
    }
  };

  const payWithPhantom = async () => {
    setLoading(true);

    try {
      // 🔥 Replace this with your real payment logic
      await new Promise((r) => setTimeout(r, 2000));

      setSignature("SIMULATED_SIGNATURE_123");
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  const maskWallet = (w: string) =>
    w.slice(0, 4) + "..." + w.slice(-4);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-3xl font-black mb-6">
          Pay with Phantom
        </h1>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={connectPhantom}
            className="rounded-xl bg-white px-5 py-4 font-semibold text-black hover:bg-zinc-200"
          >
            Connect Phantom
          </button>

          <button
            onClick={payWithPhantom}
            disabled={loading}
            className="rounded-xl bg-emerald-500 px-5 py-4 font-semibold text-black hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading ? "Processing..." : "Pay With Phantom"}
          </button>
        </div>

        {wallet && (
          <div className="mt-5 rounded-xl border border-white/10 bg-black/30 p-4 text-sm">
            <div className="text-zinc-500">Connected Wallet</div>
            <div className="mt-1 break-all font-semibold">
              {maskWallet(wallet)}
            </div>
          </div>
        )}

        {signature && (
          <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
            <div className="text-emerald-300">Transaction Signature</div>
            <div className="mt-1 break-all font-semibold">
              {signature}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
