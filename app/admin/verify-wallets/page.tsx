"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import bs58 from "bs58";

type ProjectWallet = {
  label: string;
  address: string;
  category: string;
};

type Project = {
  slug: string;
  name: string;
  symbol: string;
  wallets: ProjectWallet[];
};

type ClaimRecord = {
  wallet_address: string;
  wallet_label: string;
  claimant_address: string;
  status: string;
  verified_at: string;
};

type PhantomProvider = {
  isPhantom?: boolean;
  publicKey?: { toBase58: () => string };
  connect: () => Promise<{ publicKey: { toBase58: () => string } }>;
  signMessage: (
    message: Uint8Array,
    encoding?: string
  ) => Promise<{ signature: Uint8Array }>;
};

declare global {
  interface Window {
    solana?: PhantomProvider;
  }
}

function buildVerificationMessage(slug: string, walletAddress: string) {
  return [
    "WEB3MB Wallet Verification",
    `Project: ${slug}`,
    `Wallet: ${walletAddress}`,
    `Issued At: ${new Date().toISOString()}`,
    "Purpose: Verify disclosed wallet ownership for WEB3MB Transparency Center.",
  ].join("\n");
}

function shortAddress(address: string) {
  if (!address) return "";
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export default function VerifyWalletsPage() {
  const router = useRouter();

  const [slug, setSlug] = useState("");
  const [project, setProject] = useState<Project | null>(null);
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [selectedWallet, setSelectedWallet] = useState("");
  const [connectedWallet, setConnectedWallet] = useState("");
  const [loadingProject, setLoadingProject] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const selectedWalletMeta = useMemo(
    () => project?.wallets.find((wallet) => wallet.address === selectedWallet) || null,
    [project, selectedWallet]
  );

  async function handleLogout() {
    setLoggingOut(true);
    setError("");
    setNotice("");

    try {
      const res = await fetch("/api/admin/logout", {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Logout failed.");
      }

      router.push("/admin/login");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logout failed.");
      setLoggingOut(false);
    }
  }

  async function connectWallet() {
    setError("");
    const provider = window.solana;

    if (!provider?.isPhantom) {
      setError("Phantom wallet was not detected in this browser.");
      return;
    }

    try {
      const response = await provider.connect();
      const wallet = response.publicKey.toBase58();
      setConnectedWallet(wallet);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wallet connection failed.");
    }
  }

  async function loadProject() {
    setLoadingProject(true);
    setError("");
    setNotice("");
    setProject(null);
    setClaims([]);
    setSelectedWallet("");
    setMessage("");

    try {
      const res = await fetch("/api/projects", { cache: "no-store" });
      const data = await res.json();

      const projects = Array.isArray(data)
        ? data
        : Array.isArray(data?.projects)
        ? data.projects
        : [];

      const found =
        projects.find((item: Project) => item.slug === slug.trim()) || null;

      if (!found) {
        setError("Project not found.");
        return;
      }

      setProject(found);

      const claimsRes = await fetch(`/api/token/${found.slug}/claims`, {
        cache: "no-store",
      });
      const claimsData = claimsRes.ok ? await claimsRes.json() : {};
      setClaims(Array.isArray(claimsData?.claims) ? claimsData.claims : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load project.");
    } finally {
      setLoadingProject(false);
    }
  }

  async function verifySelectedWallet() {
    setError("");
    setNotice("");

    if (!project) {
      setError("Load a project first.");
      return;
    }

    if (!selectedWalletMeta) {
      setError("Select a disclosed wallet.");
      return;
    }

    const provider = window.solana;

    if (!provider?.isPhantom) {
      setError("Phantom wallet was not detected in this browser.");
      return;
    }

    if (!connectedWallet) {
      setError("Connect the matching Phantom wallet first.");
      return;
    }

    if (connectedWallet !== selectedWalletMeta.address) {
      setError(
        "Connected wallet does not match the disclosed wallet you selected."
      );
      return;
    }

    setVerifying(true);

    try {
      const verificationMessage = buildVerificationMessage(
        project.slug,
        selectedWalletMeta.address
      );

      const encodedMessage = new TextEncoder().encode(verificationMessage);
      const signed = await provider.signMessage(encodedMessage, "utf8");
      const signature = bs58.encode(signed.signature);

      const res = await fetch("/api/wallet-claims/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug: project.slug,
          walletAddress: selectedWalletMeta.address,
          signature,
          message: verificationMessage,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Verification failed.");
      }

      setMessage(verificationMessage);
      setNotice(`Wallet verified: ${selectedWalletMeta.label}`);

      const claimsRes = await fetch(`/api/token/${project.slug}/claims`, {
        cache: "no-store",
      });
      const claimsData = claimsRes.ok ? await claimsRes.json() : {};
      setClaims(Array.isArray(claimsData?.claims) ? claimsData.claims : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300">
              Admin Wallet Verification
            </div>
            <h1 className="mt-5 text-4xl font-bold">Verify Project Wallets</h1>
            <p className="mt-3 max-w-3xl text-zinc-400">
              Connect Phantom, select a disclosed wallet, and sign a verification
              message to mark it as verified by project.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:items-end">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm">
              <div className="text-emerald-400 font-medium">Admin Session Active</div>
              <div className="mt-1 text-zinc-300">
                You are logged in and can verify disclosed wallets.
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loggingOut ? "Logging out..." : "Log Out"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
          <div className="xl:col-span-2 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-8 shadow-lg">
            <h2 className="text-2xl font-semibold">Verification Flow</h2>

            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Project Slug
                </label>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="lotto"
                  className="w-full rounded-xl border border-zinc-700 bg-black/40 px-4 py-3 text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-end gap-3">
                <button
                  type="button"
                  onClick={loadProject}
                  disabled={loadingProject || !slug.trim()}
                  className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-black hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loadingProject ? "Loading..." : "Load Project"}
                </button>

                <button
                  type="button"
                  onClick={connectWallet}
                  className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-medium text-white hover:bg-zinc-800"
                >
                  {connectedWallet ? "Wallet Connected" : "Connect Phantom"}
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4 text-sm">
                <div className="text-zinc-500">Admin Status</div>
                <div className="mt-1 font-medium text-emerald-400">
                  Logged in
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4 text-sm">
                <div className="text-zinc-500">Phantom Wallet</div>
                <div className="mt-1 font-medium text-cyan-300">
                  {connectedWallet ? shortAddress(connectedWallet) : "Not connected"}
                </div>
              </div>
            </div>

            {connectedWallet && (
              <div className="mt-4 rounded-2xl border border-zinc-800 bg-black/30 p-4 text-sm text-zinc-300">
                Connected wallet:{" "}
                <span className="font-medium text-cyan-300">{connectedWallet}</span>
              </div>
            )}

            {project && (
              <div className="mt-8 rounded-2xl border border-zinc-800 bg-black/30 p-6">
                <div className="text-sm text-zinc-400">Loaded Project</div>
                <div className="mt-2 text-xl font-semibold">
                  {project.name} ({project.symbol})
                </div>

                <div className="mt-6">
                  <label className="mb-2 block text-sm font-medium text-zinc-300">
                    Disclosed Wallet
                  </label>
                  <select
                    value={selectedWallet}
                    onChange={(e) => setSelectedWallet(e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-black/40 px-4 py-3 text-white outline-none focus:border-cyan-500"
                  >
                    <option value="">Select wallet</option>
                    {project.wallets.map((wallet) => (
                      <option key={wallet.address} value={wallet.address}>
                        {wallet.label} — {wallet.address}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedWalletMeta && (
                  <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">
                    <div>
                      <span className="text-zinc-500">Label:</span>{" "}
                      {selectedWalletMeta.label}
                    </div>
                    <div className="mt-2">
                      <span className="text-zinc-500">Category:</span>{" "}
                      {selectedWalletMeta.category}
                    </div>
                    <div className="mt-2 break-all">
                      <span className="text-zinc-500">Address:</span>{" "}
                      {selectedWalletMeta.address}
                    </div>
                  </div>
                )}

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={verifySelectedWallet}
                    disabled={verifying || !selectedWalletMeta}
                    className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-black hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {verifying ? "Verifying..." : "Verify Selected Wallet"}
                  </button>
                </div>
              </div>
            )}

            {message && (
              <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="text-xs uppercase tracking-wide text-zinc-500">
                  Signed Verification Message
                </div>
                <pre className="mt-3 whitespace-pre-wrap break-words text-xs leading-6 text-zinc-300">
{message}
                </pre>
              </div>
            )}

            {notice && (
              <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-300">
                {notice}
              </div>
            )}

            {error && (
              <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-300">
                {error}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-8 shadow-lg">
            <h2 className="text-2xl font-semibold">Verified Wallets</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Verified wallet claims stored for the currently loaded project.
            </p>

            {claims.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-zinc-800 bg-black/30 p-5 text-sm text-zinc-400">
                No verified wallets yet.
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {claims.map((claim) => (
                  <div
                    key={`${claim.wallet_address}-${claim.verified_at}`}
                    className="rounded-2xl border border-zinc-800 bg-black/30 p-4"
                  >
                    <div className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                      Verified
                    </div>

                    <div className="mt-3 text-sm font-medium text-zinc-100">
                      {claim.wallet_label}
                    </div>

                    <div className="mt-2 break-all text-xs text-zinc-400">
                      {claim.wallet_address}
                    </div>

                    <div className="mt-3 text-xs text-zinc-500">
                      Verified at {new Date(claim.verified_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
