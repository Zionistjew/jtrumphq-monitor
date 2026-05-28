"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const LOGO_URL =
  "https://web3mb.com/wp-content/uploads/2026/04/WEB3MB-L.png";

type PhantomProvider = {
  isPhantom?: boolean;
  publicKey?: {
    toString(): string;
  };
  connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{
    publicKey: {
      toString(): string;
    };
  }>;
  signMessage: (
    message: Uint8Array,
    display?: "utf8" | "hex"
  ) => Promise<{
    signature: Uint8Array;
    publicKey?: {
      toString(): string;
    };
  }>;
};

function getPhantomProvider(): PhantomProvider | null {
  if (typeof window === "undefined") return null;

  const win = window as Window & {
    phantom?: {
      solana?: PhantomProvider;
    };
    solana?: PhantomProvider;
  };

  return win.phantom?.solana || win.solana || null;
}

function isMobileDevice() {
  if (typeof navigator === "undefined") return false;

  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function openInPhantomBrowser() {
  if (typeof window === "undefined") return;

  const currentUrl = encodeURIComponent(window.location.href);
  const ref = encodeURIComponent(window.location.origin);

  window.location.href = `https://phantom.app/ul/browse/${currentUrl}?ref=${ref}`;
}

export default function LoginPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState<string | null>(null);
  const [error, setError] = useState("");

  const mobile = useMemo(() => isMobileDevice(), []);

  useEffect(() => {
    autoReconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function autoReconnect() {
    try {
      const provider = getPhantomProvider();

      if (!provider?.isPhantom) return;

      const response = await provider.connect({
        onlyIfTrusted: true,
      });

      if (response?.publicKey) {
        await loginWithWallet(provider);
      }
    } catch {
      // Silent by design. User can click Connect Phantom manually.
    }
  }

  async function connectWallet() {
    try {
      setLoading(true);
      setError("");

      const provider = getPhantomProvider();

      if (!provider?.isPhantom) {
        if (mobile) {
          openInPhantomBrowser();
          return;
        }

        setError("Please install or unlock Phantom Wallet.");
        window.open("https://phantom.app/download", "_blank", "noopener,noreferrer");
        return;
      }

      await provider.connect();

      await loginWithWallet(provider);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Wallet connection failed");
    } finally {
      setLoading(false);
    }
  }

  async function loginWithWallet(provider: PhantomProvider) {
    const walletAddress = provider.publicKey?.toString();

    if (!walletAddress) {
      throw new Error("Unable to read Phantom wallet address.");
    }

    setWallet(walletAddress);

    const nonceRes = await fetch("/api/auth/wallet/nonce", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        walletAddress,
      }),
    });

    const nonceData = await nonceRes.json();

    if (!nonceData.ok) {
      throw new Error(nonceData.error || "Nonce request failed");
    }

    const encodedMessage = new TextEncoder().encode(nonceData.message);

    const signed = await provider.signMessage(encodedMessage, "utf8");

    const verifyRes = await fetch("/api/auth/wallet/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        walletAddress,
        message: nonceData.message,
        signature: Array.from(signed.signature),
      }),
    });

    const verifyData = await verifyRes.json();

    if (!verifyData.ok) {
      throw new Error(verifyData.error || "Verification failed");
    }

    router.push("/app");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#030712] px-5 py-8 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur sm:p-8">
        <div className="flex justify-center">
          <img
            src={LOGO_URL}
            alt="WEB3MB"
            className="h-20 w-auto object-contain sm:h-24"
          />
        </div>

        <h1 className="mt-6 text-center text-3xl font-black sm:text-4xl">
          WEB3MB Login
        </h1>

        <p className="mt-4 text-center text-sm leading-7 text-zinc-400">
          Securely access your transparency dashboards using Phantom wallet
          authentication.
        </p>

        {mobile ? (
          <div className="mt-5 rounded-2xl border border-cyan-500/25 bg-cyan-500/10 p-4 text-sm leading-6 text-cyan-100">
            On mobile, this button will open WEB3MB inside Phantom so your wallet
            can connect securely.
          </div>
        ) : null}

        <button
          onClick={connectWallet}
          disabled={loading}
          className="mt-8 w-full rounded-2xl bg-cyan-500 px-6 py-4 text-base font-black text-black transition hover:bg-cyan-400 disabled:opacity-50 sm:text-lg"
        >
          {loading
            ? "Connecting..."
            : mobile
              ? "Open Phantom Login"
              : "Connect Phantom"}
        </button>

        {wallet ? (
          <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
            Connected:
            <div className="mt-2 break-all font-mono text-xs">{wallet}</div>
          </div>
        ) : null}

        {error ? (
          <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        ) : null}
      </div>
    </main>
  );
}
