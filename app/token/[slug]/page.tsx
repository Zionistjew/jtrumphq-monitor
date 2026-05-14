import Link from "next/link";
import { headers } from "next/headers";

type WalletRow = {
  label?: string | null;
  category?: string | null;
  address?: string | null;
  purpose?: string | null;
  allocation?: number | null;
  liveTokenBalance?: number | null;
  liveSolBalance?: number | null;
  variance?: number | null;
  verified?: boolean | null;
  lowSol?: boolean | null;
};

type WalletApiResponse = {
  ok: boolean;
  slug: string;
  name: string;
  symbol: string;
  mint?: string | null;
  count: number;
  wallets: WalletRow[];
};

type TrustScoreResponse = {
  ok: boolean;
  project?: {
    id: number;
    slug: string;
    name: string;
    symbol: string;
    mint?: string | null;
  };
  score?: number;
  grade?: string;
  status?: string;
  breakdown?: {
    walletScore?: number;
    alertScore?: number;
    liquidityScore?: number;
    disclosureScore?: number;
  };
  metrics?: {
    walletSourceUsed?: string;
    disclosedWallets?: number;
    validWallets?: number;
    readableWallets?: number;
    verifiedWallets?: number;
    mismatchWallets?: number;
    lowSolWallets?: number;
    invalidWallets?: number;
    declaredAllocation?: number;
    liveDisclosedBalance?: number;
    coverageRatio?: number;
    activeCriticalAlerts?: number;
    activeWarningAlerts?: number;
    activeInfoAlerts?: number;
  };
  issues?: string[];
  generatedAt?: string;
  rpc?: string;
};

function formatNumber(value?: number | null, maximumFractionDigits = 2) {
  if (value == null || Number.isNaN(value)) return "—";

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
  }).format(value);
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString();
}

function shortAddress(address?: string | null) {
  if (!address) return "—";
  if (address.length <= 14) return address;

  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

function gradeTone(grade?: string) {
  if (!grade) return "border-white/10 bg-white/5 text-white";

  if (grade.startsWith("A")) {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
  }

  if (grade.startsWith("B")) {
    return "border-cyan-500/20 bg-cyan-500/10 text-cyan-200";
  }

  if (grade.startsWith("C")) {
    return "border-amber-500/20 bg-amber-500/10 text-amber-200";
  }

  return "border-rose-500/20 bg-rose-500/10 text-rose-200";
}

async function getBaseUrl() {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "http";

  const isLocalHost =
    host?.includes("localhost") || host?.includes("127.0.0.1");

  if (host && isLocalHost) {
    return `${proto}://${host}`;
  }

  const configured = process.env.NEXT_PUBLIC_APP_URL;

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  if (host) {
    return `${proto}://${host}`;
  }

  return "http://localhost:3001";
}

async function getTokenData(slug: string): Promise<WalletApiResponse | null> {
  try {
    const baseUrl = await getBaseUrl();
    const url = `${baseUrl}/api/token/${slug}/wallets`;

    const res = await fetch(url, {
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("token fetch failed:", res.status, url);
      return null;
    }

    const data = (await res.json()) as WalletApiResponse;

    if (!data.ok) {
      console.error("token payload not ok:", data);
      return null;
    }

    return data;
  } catch (error) {
    console.error("token fetch error:", error);
    return null;
  }
}

async function getTrustScore(slug: string): Promise<TrustScoreResponse | null> {
  try {
    const baseUrl = await getBaseUrl();
    const url = `${baseUrl}/api/trust-score/${slug}`;

    const res = await fetch(url, {
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("trust fetch failed:", res.status, url);
      return null;
    }

    const data = (await res.json()) as TrustScoreResponse;

    if (!data.ok) {
      console.error("trust payload not ok:", data);
      return null;
    }

    return data;
  } catch (error) {
    console.error("trust fetch error:", error);
    return null;
  }
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-sm sm:rounded-3xl sm:p-6">
      <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
        {label}
      </div>

      <div
        className="mt-3 truncate text-3xl font-semibold text-white sm:mt-4 sm:text-4xl"
        title={String(value)}
      >
        {value}
      </div>

      {hint ? (
        <div className="mt-3 text-sm leading-6 text-zinc-400">{hint}</div>
      ) : null}
    </div>
  );
}

function MetricTile({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </div>

      <div
        className="mt-3 truncate text-xl font-semibold text-white sm:text-2xl"
        title={String(value)}
      >
        {value}
      </div>
    </div>
  );
}

export default async function TokenPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [tokenData, trustData] = await Promise.all([
    getTokenData(slug),
    getTrustScore(slug),
  ]);

  if (!tokenData) {
    return (
      <div className="min-h-screen bg-[#050816] text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-8 xl:max-w-[1600px]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-10">
            <div className="text-xs uppercase tracking-[0.24em] text-cyan-300">
              WEB3MB / Public Transparency Layer
            </div>

            <h1 className="mt-4 text-4xl font-semibold">Project not found</h1>

            <p className="mt-4 max-w-2xl text-lg text-zinc-300">
              We could not load this public project dashboard.
            </p>

            <div className="mt-8">
              <Link
                href="/transparency"
                className="inline-flex rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/15"
              >
                Back to Public Directory
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const wallets = tokenData.wallets || [];

  const totalDeclared = wallets.reduce(
    (sum, wallet) => sum + Number(wallet.allocation || 0),
    0
  );

  const totalLive = wallets.reduce(
    (sum, wallet) => sum + Number(wallet.liveTokenBalance || 0),
    0
  );

  const verifiedWallets = wallets.filter((wallet) => wallet.verified).length;
  const lowSolWallets = wallets.filter((wallet) => wallet.lowSol).length;

  const mismatchWallets = wallets.filter(
    (wallet) => Math.abs(Number(wallet.variance || 0)) > 0
  ).length;

  const coverageRatio =
    totalDeclared > 0 ? (totalLive / totalDeclared) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="mx-auto max-w-[1700px] px-3 py-5 sm:px-4 md:px-8 xl:px-12">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.03] p-4 shadow-2xl sm:rounded-[2rem] sm:p-6 md:p-8 xl:p-10">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 max-w-4xl">
              <div className="text-xs uppercase tracking-[0.24em] text-cyan-300">
                WEB3MB / Public Transparency Layer
              </div>

              <h1 className="mt-4 break-words text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl xl:text-6xl">
                {tokenData.name}
              </h1>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200">
                  {tokenData.symbol}
                </span>

                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300">
                  /token/{tokenData.slug}
                </span>

                {trustData?.status ? (
                  <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300">
                    Status: {trustData.status}
                  </span>
                ) : null}
              </div>

              <p className="mt-6 max-w-4xl text-base leading-8 text-zinc-300 md:text-lg">
                Public investor-facing transparency dashboard showing disclosed
                wallet coverage, live token balance verification, trust scoring,
                and operational integrity signals.
              </p>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-3 xl:w-auto xl:min-w-[520px]">
              <Link
                href="/transparency"
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-sm font-medium text-white transition hover:bg-white/15"
              >
                Transparency Directory
              </Link>

              <Link
                href="/app"
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-sm font-medium text-white transition hover:bg-white/15"
              >
                Open Owner Hub
              </Link>

              <Link
                href="/app/projects/new"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-4 text-sm font-semibold text-black transition hover:opacity-90"
              >
                Create Project
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            <StatCard
              label="Disclosed Wallets"
              value={wallets.length}
              hint="Publicly disclosed wallets tracked by WEB3MB."
            />

            <StatCard
              label="Verified Wallets"
              value={verifiedWallets}
              hint="Wallets whose live balance matches declared allocation."
            />

            <StatCard
              label="Allocation Mismatches"
              value={mismatchWallets}
              hint="Wallets showing live balance variance."
            />

            <StatCard
              label="Coverage Ratio"
              value={`${formatNumber(coverageRatio)}%`}
              hint="Live disclosed balances versus declared total allocation."
            />
          </div>

          <div className="mt-8 grid gap-5 2xl:grid-cols-[minmax(0,1.25fr)_minmax(430px,0.75fr)]">
            <div className="min-w-0 rounded-[2rem] border border-white/10 bg-black/20 p-7 xl:p-8">
              <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">
                Public Project Snapshot
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <MetricTile
                  label="Project Mint"
                  value={shortAddress(tokenData.mint)}
                />

                <MetricTile
                  label="Live Wallet Reads"
                  value={`${wallets.length} tracked wallet${
                    wallets.length === 1 ? "" : "s"
                  }`}
                />

                <MetricTile
                  label="Declared Allocation"
                  value={formatNumber(totalDeclared, 0)}
                />

                <MetricTile
                  label="Live Disclosed Balance"
                  value={formatNumber(totalLive, 3)}
                />
              </div>

              {tokenData.mint ? (
                <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                    Full Mint Address
                  </div>

                  <div className="mt-3 break-all text-sm font-medium leading-6 text-zinc-300">
                    {tokenData.mint}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-black/20 p-7 xl:p-8">
              <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">
                WEB3MB Trust Score
              </div>

              {trustData ? (
                <>
                  <div className="mt-6 flex flex-wrap items-end gap-4">
                    <div className="text-6xl font-semibold text-white md:text-7xl">
                      {trustData.score ?? "—"}
                    </div>

                    <div className="pb-2 text-xl text-zinc-400">/ 100</div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <span
                      className={`rounded-full border px-4 py-2 text-sm font-medium ${gradeTone(
                        trustData.grade
                      )}`}
                    >
                      Grade {trustData.grade || "—"}
                    </span>

                    <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300">
                      Status: {trustData.status || "—"}
                    </span>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <MetricTile
                      label="Wallet Score"
                      value={`${trustData.breakdown?.walletScore ?? "—"} / 40`}
                    />

                    <MetricTile
                      label="Alert Score"
                      value={`${trustData.breakdown?.alertScore ?? "—"} / 25`}
                    />

                    <MetricTile
                      label="Liquidity Score"
                      value={`${
                        trustData.breakdown?.liquidityScore ?? "—"
                      } / 20`}
                    />

                    <MetricTile
                      label="Disclosure Score"
                      value={`${
                        trustData.breakdown?.disclosureScore ?? "—"
                      } / 15`}
                    />
                  </div>

                  <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                      Generated
                    </div>

                    <div className="mt-3 text-sm text-zinc-200">
                      {formatDateTime(trustData.generatedAt)}
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-zinc-300">
                  Trust score is not available yet for this project.
                </div>
              )}
            </div>
          </div>

          {trustData?.issues?.length ? (
            <div className="mt-10 rounded-[2rem] border border-amber-500/20 bg-amber-500/10 p-7 xl:p-8">
              <div className="text-xs uppercase tracking-[0.22em] text-amber-300">
                Key Issues
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {trustData.issues.map((issue, index) => (
                  <div
                    key={`${issue}-${index}`}
                    className="rounded-2xl border border-amber-500/20 bg-black/20 p-5 text-sm leading-7 text-amber-100"
                  >
                    {issue}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-10 rounded-[2rem] border border-white/10 bg-black/20 p-7 xl:p-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-4xl">
                <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">
                  Disclosed Wallets
                </div>

                <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
                  Live Wallet Verification
                </h2>

                <p className="mt-3 max-w-4xl text-base leading-7 text-zinc-300">
                  Publicly disclosed wallet balances compared against declared
                  allocations using live RPC data.
                </p>
              </div>

              {trustData ? (
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300">
                  RPC: {trustData.rpc || "—"}
                </div>
              ) : null}
            </div>

            <div className="mt-8 space-y-6">
              {wallets.length > 0 ? (
                wallets.map((wallet, index) => {
                  const declared = Number(wallet.allocation || 0);
                  const live = Number(wallet.liveTokenBalance || 0);
                  const sol = Number(wallet.liveSolBalance || 0);
                  const variance = Number(wallet.variance || 0);
                  const verified = Boolean(wallet.verified);
                  const lowSol = Boolean(wallet.lowSol);

                  const liveSolClass = lowSol
                    ? "text-rose-300"
                    : "text-white";

                  const varianceClass =
                    Math.abs(variance) > 0
                      ? "text-rose-300"
                      : "text-emerald-300";

                  return (
                    <div
                      key={`${wallet.address}-${index}`}
                      className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.02] p-4 sm:rounded-[2rem] sm:p-6 xl:p-7"
                    >
                      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.95fr)]">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="min-w-0 break-words text-2xl font-semibold text-white sm:text-3xl">
                              {wallet.label || "Unnamed Wallet"}
                            </h3>

                            {wallet.category ? (
                              <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-cyan-200">
                                {wallet.category}
                              </span>
                            ) : null}

                            {verified ? (
                              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-emerald-200">
                                Verified
                              </span>
                            ) : (
                              <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-amber-200">
                                Mismatch
                              </span>
                            )}

                            {lowSol ? (
                              <span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-rose-200">
                                Low SOL
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-4 break-all text-sm text-zinc-300 sm:text-lg md:text-2xl">
                            {wallet.address || "—"}
                          </div>

                          {wallet.purpose ? (
                            <div className="mt-4 text-base leading-7 text-zinc-300">
                              <span className="font-medium text-zinc-100">
                                Purpose:
                              </span>{" "}
                              {wallet.purpose}
                            </div>
                          ) : null}
                        </div>

                        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                          <MetricTile
                            label="Declared"
                            value={formatNumber(declared, 0)}
                          />

                          <MetricTile
                            label="Live Balance"
                            value={formatNumber(live, 3)}
                          />

                          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                            <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                              Live SOL
                            </div>

                            <div
                              className={`mt-3 truncate text-2xl font-semibold ${liveSolClass}`}
                              title={formatNumber(sol, 6)}
                            >
                              {formatNumber(sol, 6)}
                            </div>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                            <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                              Variance
                            </div>

                            <div
                              className={`mt-3 truncate text-2xl font-semibold ${varianceClass}`}
                              title={formatNumber(variance, 3)}
                            >
                              {formatNumber(variance, 3)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 grid gap-4 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
                        {wallet.address ? (
                          <a
                            href={`https://solscan.io/account/${wallet.address}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/15 md:w-auto"
                          >
                            View on Solscan
                          </a>
                        ) : null}

                        <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm text-zinc-400">
                          <span className="block text-zinc-500">
                            Short address
                          </span>

                          <span
                            className="mt-2 block truncate text-zinc-300"
                            title={wallet.address || ""}
                          >
                            {shortAddress(wallet.address)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-zinc-300">
                  No disclosed wallets are currently available for this project.
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <StatCard
              label="Low SOL Wallets"
              value={lowSolWallets}
              hint="Wallets that may need operational funding."
            />

            <StatCard
              label="Declared Allocation"
              value={formatNumber(totalDeclared, 0)}
              hint="Total allocation disclosed by the project."
            />

            <StatCard
              label="Live Disclosed Balance"
              value={formatNumber(totalLive, 3)}
              hint="Live token balance across disclosed wallets."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
