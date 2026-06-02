"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type ProjectOption = {
  id: number;
  slug: string;
  name: string;
  symbol: string;
  mint?: string | null;
};

type WalletRead = {
  label: string;
  category: string;
  address: string;
  purpose?: string | null;
  allocation?: number | null;
  allocationPercent?: number | null;
  declaredTokenBalance?: number | null;
  tokenSupply?: number | null;
  liveTokenBalance?: number | null;
  liveSolBalance?: number | null;
  variance?: number | null;
  variancePercent?: number | null;
  verified?: boolean;
  verified_at?: string | null;
  lowSol?: boolean;
};

type WalletApiResponse = {
  ok: boolean;
  slug: string;
  name: string;
  symbol: string;
  mint?: string | null;
  count: number;
  wallets: WalletRead[];
};

const REFRESH_MS = 30_000;
const LOW_SOL_THRESHOLD = 0.01;

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function formatNumber(value?: number | null, maximumFractionDigits = 2) {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
  }).format(value);
}

function shortenAddress(address?: string | null) {
  if (!address) return "—";
  if (address.length <= 14) return address;
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

function buildVerificationMessage(params: {
  walletAddress: string;
  projectSlug: string;
}) {
  return [
    "WEB3MB Wallet Verification",
    `Project: ${params.projectSlug}`,
    `Wallet: ${params.walletAddress}`,
    "Purpose: Verify wallet ownership for project transparency.",
  ].join("\n");
}

function getCoverageRatio(totalDeclared: number, totalLive: number) {
  if (totalDeclared <= 0) return 0;
  return (totalLive / totalDeclared) * 100;
}

function getMismatchCount(wallets: WalletRead[]) {
  return wallets.filter((wallet) => {
    const variancePercent = Number(wallet.variancePercent ?? 0);
    return Math.abs(variancePercent) > 2;
  }).length;
}

function getLowSolCount(wallets: WalletRead[]) {
  return wallets.filter((wallet) => {
    const sol = Number(wallet.liveSolBalance || 0);
    return sol <= LOW_SOL_THRESHOLD;
  }).length;
}

function getVerifiedCount(wallets: WalletRead[]) {
  return wallets.filter((wallet) => Boolean(wallet.verified)).length;
}

function getMatchPercent(declared: number, live: number) {
  if (declared <= 0) return 0;
  return (live / declared) * 100;
}

function getProgressTone(declared: number, live: number) {
  const variance = Math.abs(live - declared);

  if (declared <= 0 && live > 0) return "critical";
  if (variance === 0) return "healthy";

  const pct = declared > 0 ? (variance / declared) * 100 : 0;

  if (pct >= 15) return "critical";
  return "warning";
}

function getStatusToneClasses(
  tone: "healthy" | "warning" | "critical" | "neutral"
) {
  switch (tone) {
    case "healthy":
      return {
        badge: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
        bar: "bg-emerald-400",
      };
    case "warning":
      return {
        badge: "border-amber-500/20 bg-amber-500/10 text-amber-200",
        bar: "bg-amber-400",
      };
    case "critical":
      return {
        badge: "border-rose-500/20 bg-rose-500/10 text-rose-200",
        bar: "bg-rose-400",
      };
    default:
      return {
        badge: "border-white/10 bg-white/5 text-zinc-300",
        bar: "bg-white/30",
      };
  }
}

function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "warning";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-5 shadow-sm",
        tone === "warning"
          ? "border-amber-500/25 bg-amber-500/10"
          : "border-white/10 bg-white/5"
      )}
    >
      <div className="text-xs uppercase tracking-[0.18em] text-zinc-400">
        {label}
      </div>
      <div className="mt-3 break-words text-3xl font-semibold text-white">
        {value}
      </div>
      {hint ? (
        <div className="mt-2 text-sm leading-6 text-zinc-400">{hint}</div>
      ) : null}
    </div>
  );
}

function InfoPanel({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
        {title}
      </div>
      <div className="mt-3 break-words text-sm leading-7 text-zinc-300">
        {text}
      </div>
    </div>
  );
}

export default function VerifyWalletsPage() {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [walletData, setWalletData] = useState<WalletApiResponse | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingWallets, setLoadingWallets] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [verifyingAddress, setVerifyingAddress] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    try {
      setLoadingProjects(true);
      setError(null);

      const res = await fetch("/api/projects", {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`Failed to load projects: ${res.status}`);
      }

      const data = await res.json();
      const rows = Array.isArray(data?.projects) ? data.projects : [];

      const mapped: ProjectOption[] = rows.map((project: any) => ({
        id: Number(project.id),
        slug: project.slug,
        name: project.name,
        symbol: project.symbol,
        mint: project.mint ?? null,
      }));

      setProjects(mapped);

      if (!selectedSlug && mapped.length > 0) {
        setSelectedSlug(mapped[0].slug);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load projects";
      setError(message);
    } finally {
      setLoadingProjects(false);
    }
  }, [selectedSlug]);

  const loadWallets = useCallback(
    async (slug: string, showRefreshState = false) => {
      if (!slug) return;

      try {
        setError(null);

        if (showRefreshState) {
          setRefreshing(true);
        } else {
          setLoadingWallets(true);
        }

        const res = await fetch(`/api/token/${slug}/wallets`, {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`Failed to load wallet verification: ${res.status}`);
        }

        const data = (await res.json()) as WalletApiResponse;

        if (!data.ok) {
          throw new Error("Wallet verification response was not successful");
        }

        const normalizedWallets = Array.isArray(data.wallets)
          ? data.wallets.map((wallet) => {
              const allocation = Number(wallet.allocation || 0);
              const allocationPercent = Number(wallet.allocationPercent || 0);
              const declaredTokenBalance = Number(
                wallet.declaredTokenBalance ?? allocation
              );
              const tokenSupply = Number(wallet.tokenSupply || 0);
              const liveTokenBalance = Number(wallet.liveTokenBalance || 0);
              const liveSolBalance = Number(wallet.liveSolBalance || 0);
              const variance = Number(
                wallet.variance ?? liveTokenBalance - declaredTokenBalance
              );
              const variancePercent = Number(wallet.variancePercent ?? 0);

              return {
                ...wallet,
                allocation,
                allocationPercent,
                declaredTokenBalance,
                tokenSupply,
                liveTokenBalance,
                liveSolBalance,
                variance,
                variancePercent,
                verified: Boolean(wallet.verified),
              };
            })
          : [];

        setWalletData({
          ...data,
          wallets: normalizedWallets,
        });

        setLastSynced(new Date().toLocaleString());
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load wallet verification";
        setError(message);
      } finally {
        setLoadingWallets(false);
        setRefreshing(false);
      }
    },
    []
  );

  const copyAddress = useCallback(async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      window.setTimeout(() => {
        setCopiedAddress((current) => (current === address ? null : current));
      }, 1800);
    } catch {
      window.alert("Unable to copy address.");
    }
  }, []);

  const verifyWalletOwnership = useCallback(
    async (walletAddress: string) => {
      try {
        setError(null);
        setSuccess(null);
        setVerifyingAddress(walletAddress);

        if (!selectedSlug) {
          throw new Error("Please select a project first.");
        }

        const provider = (window as any).solana;

        if (!provider || !provider.isPhantom) {
          throw new Error(
            "Phantom wallet not found. Please install or unlock Phantom."
          );
        }

        const connected = await provider.connect();
        const connectedWallet = connected.publicKey.toString();

        if (connectedWallet !== walletAddress) {
          throw new Error(
            `Connected Phantom wallet does not match this disclosed wallet. Connected: ${shortenAddress(
              connectedWallet
            )}. Required: ${shortenAddress(walletAddress)}`
          );
        }

        if (typeof provider.signMessage !== "function") {
          throw new Error(
            "Your Phantom wallet does not support message signing."
          );
        }

        const message = buildVerificationMessage({
          walletAddress,
          projectSlug: selectedSlug,
        });

        const encodedMessage = new TextEncoder().encode(message);
        const signed = await provider.signMessage(encodedMessage, "utf8");

        let signatureBytes: number[];

        if (signed?.signature instanceof Uint8Array) {
          signatureBytes = Array.from(signed.signature);
        } else if (Array.isArray(signed?.signature)) {
          signatureBytes = signed.signature;
        } else if (signed instanceof Uint8Array) {
          signatureBytes = Array.from(signed);
        } else {
          throw new Error("Phantom did not return a valid signature.");
        }

        const res = await fetch("/api/wallets/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            projectSlug: selectedSlug,
            walletAddress,
            message,
            signature: signatureBytes,
          }),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok || !data?.ok) {
          throw new Error(data?.error || "Wallet ownership verification failed.");
        }

        setWalletData((current) => {
          if (!current) return current;

          return {
            ...current,
            wallets: current.wallets.map((wallet) =>
              wallet.address === walletAddress
                ? {
                    ...wallet,
                    verified: true,
                    verified_at: data.verifiedAt || new Date().toISOString(),
                  }
                : wallet
            ),
          };
        });

        setSuccess(
          `Wallet ${shortenAddress(
            walletAddress
          )} has been cryptographically verified by WEB3MB.`
        );

        await loadWallets(selectedSlug, true);
      } catch (err: any) {
        setError(err?.message || "Wallet ownership verification failed.");
      } finally {
        setVerifyingAddress(null);
      }
    },
    [selectedSlug, loadWallets]
  );

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (!selectedSlug) return;
    loadWallets(selectedSlug, false);
  }, [selectedSlug, loadWallets]);

  useEffect(() => {
    if (!autoRefresh || !selectedSlug) return;

    const tick = async () => {
      if (document.hidden) return;
      await loadWallets(selectedSlug, false);
    };

    const interval = window.setInterval(tick, REFRESH_MS);
    return () => window.clearInterval(interval);
  }, [autoRefresh, selectedSlug, loadWallets]);

  const totals = useMemo(() => {
    const wallets = walletData?.wallets || [];
    const totalDeclared = wallets.reduce(
      (sum, wallet) => sum + Number(wallet.allocation || 0),
      0
    );
    const totalLive = wallets.reduce(
      (sum, wallet) => sum + Number(wallet.liveTokenBalance || 0),
      0
    );
    const healthyReads = wallets.filter(
      (wallet) => wallet.liveTokenBalance != null
    ).length;
    const mismatches = getMismatchCount(wallets);
    const coverageRatio = getCoverageRatio(totalDeclared, totalLive);
    const lowSolCount = getLowSolCount(wallets);
    const verifiedCount = getVerifiedCount(wallets);

    return {
      totalDeclared,
      totalLive,
      healthyReads,
      mismatches,
      coverageRatio,
      lowSolCount,
      verifiedCount,
    };
  }, [walletData]);

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.03] p-6 shadow-2xl">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">
                WEB3MB / WALLET TRACKING ENGINE
              </div>

              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                Wallet Verification
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-300">
                Compare each project’s disclosed wallets and declared token
                allocations against live Solana balances, then verify ownership
                with a Phantom-signed message.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap xl:justify-end">
              <select
                value={selectedSlug}
                onChange={(e) => setSelectedSlug(e.target.value)}
                disabled={loadingProjects || projects.length === 0}
                className="min-w-[220px] rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400"
              >
                {projects.length === 0 ? (
                  <option value="">No projects available</option>
                ) : (
                  projects.map((project) => (
                    <option
                      key={project.id}
                      value={project.slug}
                      className="bg-[#0b1120]"
                    >
                      {project.name} ({project.symbol})
                    </option>
                  ))
                )}
              </select>

              <button
                onClick={() => selectedSlug && loadWallets(selectedSlug, true)}
                disabled={!selectedSlug || refreshing}
                className="rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {refreshing ? "Refreshing..." : "Refresh Now"}
              </button>

              <button
                onClick={() => setAutoRefresh((prev) => !prev)}
                className={cn(
                  "rounded-xl border px-4 py-2.5 text-sm font-medium transition",
                  autoRefresh
                    ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
                    : "border-white/10 bg-white/10 text-zinc-200 hover:bg-white/15"
                )}
              >
                Auto-Refresh {autoRefresh ? "On" : "Off"}
              </button>
            </div>
          </div>

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
              {success}
            </div>
          ) : null}

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Tracked Wallets"
              value={walletData?.count ?? 0}
              hint="Declared project wallets currently being monitored."
            />

            <StatCard
              label="Healthy Wallet Reads"
              value={totals.healthyReads}
              hint="Live wallet reads successfully resolved from RPC."
            />

            <StatCard
              label="Ownership Verified"
              value={totals.verifiedCount}
              hint="Wallets cryptographically verified through Phantom signature."
            />

            <StatCard
              label="Coverage Ratio"
              value={`${formatNumber(totals.coverageRatio)}%`}
              hint="Live disclosed wallet balances versus declared token allocation."
              tone={totals.coverageRatio > 100 ? "warning" : "default"}
            />
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-3">
            <InfoPanel
              title="Ownership Verification"
              text="The Verify Ownership button asks Phantom to sign a WEB3MB verification message. No funds move. The signature proves the connected wallet controls the disclosed address."
            />

            <InfoPanel
              title="Project Mint"
              text={
                walletData?.mint
                  ? `All token balances on this page are resolved against the active project mint: ${walletData.mint}`
                  : "No mint is currently available for this selected project."
              }
            />

            <InfoPanel
              title="Refresh Behavior"
              text="Auto refresh pauses when the tab is hidden. Manual refresh is always available for immediate verification."
            />
          </div>

          <div className="mt-8 rounded-3xl border border-white/10 bg-black/20 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">
                  Wallet Tracking Engine
                </div>

                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Live Disclosed Wallet Reads
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-300">
                  Compare each disclosed wallet&apos;s allocation with live
                  balances and verify ownership using Phantom message signing.
                </p>
              </div>

              <div className="shrink-0 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300">
                Synced {lastSynced || "—"}
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-emerald-300">
                  Ownership Verified
                </div>
                <div className="mt-2 text-2xl font-semibold text-white">
                  {totals.verifiedCount}
                </div>
                <div className="mt-1 text-sm text-emerald-200/80">
                  Wallets verified by Phantom signature.
                </div>
              </div>

              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-amber-300">
                  Mismatch
                </div>
                <div className="mt-2 text-2xl font-semibold text-white">
                  {totals.mismatches}
                </div>
                <div className="mt-1 text-sm text-amber-200/80">
                  Wallets with allocation drift.
                </div>
              </div>

              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-rose-300">
                  Low SOL
                </div>
                <div className="mt-2 text-2xl font-semibold text-white">
                  {totals.lowSolCount}
                </div>
                <div className="mt-1 text-sm text-rose-200/80">
                  Wallets below operational SOL threshold.
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {loadingWallets && !walletData ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-zinc-300">
                  Loading wallet verification...
                </div>
              ) : walletData?.wallets?.length ? (
                walletData.wallets.map((wallet, index) => {
                  const declared = Number(
                    wallet.declaredTokenBalance ?? wallet.allocation ?? 0
                  );
                  const allocationPercent = Number(wallet.allocationPercent || 0);
                  const live = Number(wallet.liveTokenBalance || 0);
                  const liveSol = Number(wallet.liveSolBalance || 0);
                  const variance = Number(wallet.variance ?? live - declared);
                  const variancePercent = Number(wallet.variancePercent ?? 0);
                  const mismatch = Math.abs(variancePercent) > 2;
                  const lowSol = Boolean(
                    wallet.lowSol ?? liveSol <= LOW_SOL_THRESHOLD
                  );
                  const ownerVerified = Boolean(wallet.verified);
                  const matchPercent = getMatchPercent(declared, live);
                  const progressTone = getProgressTone(declared, live);
                  const progressStyles = getStatusToneClasses(progressTone);
                  const cardTone = ownerVerified
                    ? "border-emerald-500/30"
                    : mismatch && progressTone === "critical"
                      ? "border-rose-500/20"
                      : mismatch
                        ? "border-amber-500/20"
                        : "border-white/10";

                  return (
                    <div
                      key={`${wallet.address}-${index}`}
                      className={cn(
                        "rounded-3xl border bg-gradient-to-br from-white/[0.04] to-white/[0.02] p-5",
                        cardTone
                      )}
                    >
                      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)]">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="min-w-0 break-words text-2xl font-semibold text-white">
                              {wallet.label || "Unnamed Wallet"}
                            </h3>

                            {wallet.category ? (
                              <span className="max-w-full rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-cyan-200">
                                {wallet.category}
                              </span>
                            ) : null}

                            {ownerVerified ? (
                              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-emerald-200">
                                Owner Verified
                              </span>
                            ) : (
                              <span className="rounded-full border border-zinc-500/20 bg-zinc-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-zinc-300">
                                Not Owner Verified
                              </span>
                            )}

                            {mismatch ? (
                              <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-amber-200">
                                Mismatch
                              </span>
                            ) : null}

                            {lowSol ? (
                              <span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-rose-200">
                                Low SOL
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-4 break-all text-xl text-zinc-300">
                            {wallet.address}
                          </div>

                          {wallet.purpose ? (
                            <div className="mt-3 text-sm leading-6 text-zinc-300">
                              <span className="font-medium text-zinc-100">
                                Purpose:
                              </span>{" "}
                              {wallet.purpose}
                            </div>
                          ) : null}
                        </div>

                        <div className="grid min-w-0 grid-cols-2 gap-3 2xl:grid-cols-4">
                          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                            <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                              Declared Tokens
                            </div>
                            <div className="mt-3 break-words text-2xl font-semibold text-white">
                              {formatNumber(declared, 0)}
                            </div>
                            <div className="mt-1 text-xs text-zinc-500">
                              {formatNumber(allocationPercent, 2)}% of supply
                            </div>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                            <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                              Live Token Balance
                            </div>
                            <div className="mt-3 break-words text-2xl font-semibold text-white">
                              {formatNumber(live, 3)}
                            </div>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                            <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                              Live SOL
                            </div>
                            <div
                              className={cn(
                                "mt-3 break-words text-2xl font-semibold",
                                lowSol ? "text-rose-300" : "text-white"
                              )}
                            >
                              {formatNumber(liveSol, 6)}
                            </div>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                            <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                              Variance
                            </div>
                            <div
                              className={cn(
                                "mt-3 break-words text-2xl font-semibold",
                                mismatch ? "text-rose-300" : "text-emerald-300"
                              )}
                            >
                              {formatNumber(variance, 3)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6">
                        <div className="mb-2 flex items-center justify-between gap-3 text-sm text-zinc-400">
                          <span>Allocation Match</span>
                          <span className="shrink-0">
                            {declared > 0
                              ? `${formatNumber(matchPercent)}%`
                              : "—"}
                          </span>
                        </div>

                        <div className="h-3 overflow-hidden rounded-full bg-white/10">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              progressStyles.bar
                            )}
                            style={{
                              width: `${
                                declared > 0 ? Math.min(matchPercent, 100) : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="mt-6 grid gap-3 md:grid-cols-[auto_auto_auto_minmax(0,1fr)] md:items-center">
                        <button
                          onClick={() => verifyWalletOwnership(wallet.address)}
                          disabled={
                            verifyingAddress === wallet.address || ownerVerified
                          }
                          className={cn(
                            "inline-flex w-full items-center justify-center rounded-xl border px-4 py-2 text-sm font-black transition md:w-auto",
                            ownerVerified
                              ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
                              : "border-cyan-500/30 bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25",
                            verifyingAddress === wallet.address
                              ? "cursor-wait opacity-70"
                              : ""
                          )}
                        >
                          {ownerVerified
                            ? "Ownership Verified"
                            : verifyingAddress === wallet.address
                              ? "Verifying..."
                              : "Verify Ownership"}
                        </button>

                        <a
                          href={`https://solscan.io/account/${wallet.address}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15 md:w-auto"
                        >
                          View on Solscan
                        </a>

                        <button
                          onClick={() => copyAddress(wallet.address)}
                          className={cn(
                            "inline-flex w-full items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium transition md:w-auto",
                            copiedAddress === wallet.address
                              ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
                              : "border-white/10 bg-white/10 text-white hover:bg-white/15"
                          )}
                        >
                          {copiedAddress === wallet.address
                            ? "Copied"
                            : "Copy Address"}
                        </button>

                        <div className="min-w-0 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-400">
                          <span className="block text-zinc-500">
                            Short address
                          </span>
                          <span className="mt-1 block break-all text-zinc-300">
                            {shortenAddress(wallet.address)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-zinc-300">
                  No disclosed wallets found for the selected project.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
