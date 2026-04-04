export const dynamic = "force-dynamic";
export const revalidate = 0;

import { getTokenSecurity } from "@/lib/tokenSecurity";

type Wallet = {
  label: string;
  category: string;
  address: string;
  purpose: string;
  solBalance: number;
  jtrumpBalance: number;
};

type AlertItem = {
  signature: string;
  timestamp: number;
  wallet: string;
  walletAddress: string;
  category: string;
  direction: "in" | "out" | "neutral";
  amount: number;
  severity: "info" | "warning" | "critical";
  message: string;
};

type WalletApiResponse = {
  ok: boolean;
  count: number;
  mint: string;
  wallets: Wallet[];
  updatedAt: string;
};

type AlertsApiResponse = {
  ok: boolean;
  count: number;
  alerts: AlertItem[];
};

function shortAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function solscanAccountUrl(address: string) {
  return `https://solscan.io/account/${address}`;
}

function solscanTxUrl(signature: string) {
  return `https://solscan.io/tx/${signature}`;
}

function categoryColor(category: string) {
  switch (category) {
    case "liquidity":
      return "text-green-400";
    case "treasury":
      return "text-blue-400";
    case "dev":
      return "text-yellow-400";
    case "community":
      return "text-purple-400";
    default:
      return "text-white";
  }
}

function severityBadge(severity: AlertItem["severity"]) {
  switch (severity) {
    case "critical":
      return (
        <span className="inline-flex items-center rounded-full border border-red-800 bg-red-950/40 px-2 py-1 text-xs text-red-400">
          🚨 Critical
        </span>
      );
    case "warning":
      return (
        <span className="inline-flex items-center rounded-full border border-yellow-800 bg-yellow-950/40 px-2 py-1 text-xs text-yellow-400">
          ⚠️ Warning
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-full border border-blue-800 bg-blue-950/40 px-2 py-1 text-xs text-blue-400">
          ℹ️ Info
        </span>
      );
  }
}

function formatTimestamp(timestamp: number) {
  if (!timestamp) return "Unknown time";
  return new Date(timestamp * 1000).toLocaleString();
}

function lpStatusDisplay(lpStatus: string) {
  switch (lpStatus) {
    case "locked":
      return {
        label: "Locked ✅",
        cardClass: "border-blue-900 bg-blue-950/20",
        textClass: "text-blue-300",
        bodyClass: "text-white",
        note: "Liquidity lock proof has been published.",
      };
    case "burned":
      return {
        label: "Burned ✅",
        cardClass: "border-green-900 bg-green-950/20",
        textClass: "text-green-300",
        bodyClass: "text-white",
        note: "LP tokens have been burned and are no longer recoverable.",
      };
    case "unlocked":
      return {
        label: "Unlocked ⚠️",
        cardClass: "border-red-900 bg-red-950/20",
        textClass: "text-red-300",
        bodyClass: "text-white",
        note: "Unlocked liquidity is a higher-risk signal for investors.",
      };
    default:
      return {
        label: "Unknown",
        cardClass: "border-zinc-800 bg-zinc-950",
        textClass: "text-zinc-300",
        bodyClass: "text-white",
        note: "Publish LP proof or status for stronger trust signals.",
      };
  }
}

async function getWalletData(): Promise<WalletApiResponse | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
    const res = await fetch(`${baseUrl}/api/wallets`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getAlertsData(): Promise<AlertsApiResponse | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
    const res = await fetch(`${baseUrl}/api/transparency/alerts`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function TransparencyPage() {
  const data = await getWalletData();
  const alertsData = await getAlertsData();

  if (!data || !data.ok) {
    return (
      <main className="min-h-screen bg-black p-8 text-white">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-4xl font-bold">JTRUMP Transparency Center</h1>
          <p className="mt-4 text-red-400">Unable to load transparency data.</p>
        </div>
      </main>
    );
  }

  const security = await getTokenSecurity(data.mint);
  const lpDisplay = lpStatusDisplay(security.lpStatus);

  const treasuryWallets = data.wallets.filter((w) => w.category === "treasury");
  const liquidityWallets = data.wallets.filter((w) => w.category === "liquidity");
  const devWallets = data.wallets.filter((w) => w.category === "dev");
  const communityWallets = data.wallets.filter((w) => w.category === "community");

  const treasury = treasuryWallets.reduce((sum, w) => sum + w.jtrumpBalance, 0);
  const liquidity = liquidityWallets.reduce((sum, w) => sum + w.jtrumpBalance, 0);
  const dev = devWallets.reduce((sum, w) => sum + w.jtrumpBalance, 0);
  const community = communityWallets.reduce((sum, w) => sum + w.jtrumpBalance, 0);
  const totalTracked = treasury + liquidity + dev + community;

  const percent = (value: number) =>
    totalTracked > 0 ? ((value / totalTracked) * 100).toFixed(1) : "0.0";

  const criticalAlerts =
    alertsData?.ok ? alertsData.alerts.filter((a) => a.severity === "critical").length : 0;
  const warningAlerts =
    alertsData?.ok ? alertsData.alerts.filter((a) => a.severity === "warning").length : 0;

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        <section className="rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-950 via-black to-red-950/20 p-8 shadow-2xl">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center rounded-full border border-red-800 bg-red-950/30 px-3 py-1 text-xs uppercase tracking-[0.2em] text-red-300">
                Investor Transparency
              </div>

              <h1 className="text-4xl font-bold md:text-5xl">
                JTRUMP Transparency Center
              </h1>

              <p className="mt-4 text-lg text-zinc-300">
                Live wallet visibility, treasury disclosures, large movement alerts,
                and public verification tools for investors and community members.
              </p>

              <p className="mt-3 text-sm text-zinc-500">
                Last updated: {new Date(data.updatedAt).toLocaleString()}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="/transparency"
                className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm hover:bg-zinc-800"
              >
                Dashboard
              </a>
              <a
                href="/alerts"
                className="rounded-xl border border-red-700 bg-red-900/30 px-4 py-2 text-sm text-red-300 hover:bg-red-900/50"
              >
                Alert Feed
              </a>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-5">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <div className="text-sm text-zinc-400">Official Wallets</div>
            <div className="mt-2 text-2xl font-bold">{data.count}</div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <div className="text-sm text-zinc-400">Tracked Supply</div>
            <div className="mt-2 text-2xl font-bold">
              {totalTracked.toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <div className="text-sm text-zinc-400">Treasury Share</div>
            <div className="mt-2 text-2xl font-bold text-blue-400">
              {percent(treasury)}%
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <div className="text-sm text-zinc-400">Critical Alerts</div>
            <div className="mt-2 text-2xl font-bold text-red-400">
              {criticalAlerts}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <div className="text-sm text-zinc-400">Warning Alerts</div>
            <div className="mt-2 text-2xl font-bold text-yellow-400">
              {warningAlerts}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-green-900 bg-green-950/20 p-5">
            <div className="text-sm text-green-300">Mint Authority</div>
            <div className="mt-2 text-xl font-semibold">
              {security.mintAuthority === "revoked"
                ? "Revoked ✅"
                : security.mintAuthority === "active"
                ? "Active ⚠️"
                : "Unknown"}
            </div>
            <p className="mt-2 text-sm text-zinc-400">
              Automatically checked from on-chain mint data.
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-900 bg-yellow-950/20 p-5">
            <div className="text-sm text-yellow-300">Freeze Authority</div>
            <div className="mt-2 text-xl font-semibold">
              {security.freezeAuthority === "revoked"
                ? "Revoked ✅"
                : security.freezeAuthority === "active"
                ? "Active ⚠️"
                : "Unknown"}
            </div>
            <p className="mt-2 text-sm text-zinc-400">
              Publicly displayed to improve investor trust and verification.
            </p>
          </div>

          <div className={`rounded-2xl p-5 border ${lpDisplay.cardClass}`}>
            <div className={`text-sm ${lpDisplay.textClass}`}>LP Status</div>
            <div className={`mt-2 text-xl font-semibold ${lpDisplay.bodyClass}`}>
              {lpDisplay.label}
            </div>
            <p className="mt-2 text-sm text-zinc-400">{lpDisplay.note}</p>

            {security.lpProofUrl ? (
              <a
                href={security.lpProofUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-sm text-blue-400 hover:underline"
              >
                View LP proof
              </a>
            ) : null}
          </div>

          <div className="rounded-2xl border border-red-900 bg-red-950/20 p-5">
            <div className="text-sm text-red-300">Live Monitoring</div>
            <div className="mt-2 text-xl font-semibold">Active</div>
            <p className="mt-2 text-sm text-zinc-400">
              Large wallet movements are tracked and surfaced in the public alert feed.
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold">Token Allocation Overview</h2>
            <div className="text-sm text-zinc-500">
              Based on publicly disclosed project wallets
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-zinc-800 bg-black/30 p-5">
              <div className="text-sm text-green-400">Liquidity</div>
              <div className="mt-2 text-xl font-semibold">
                {liquidity.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              <div className="mt-1 text-sm text-zinc-500">{percent(liquidity)}%</div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-black/30 p-5">
              <div className="text-sm text-blue-400">Treasury</div>
              <div className="mt-2 text-xl font-semibold">
                {treasury.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              <div className="mt-1 text-sm text-zinc-500">{percent(treasury)}%</div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-black/30 p-5">
              <div className="text-sm text-yellow-400">Development</div>
              <div className="mt-2 text-xl font-semibold">
                {dev.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              <div className="mt-1 text-sm text-zinc-500">{percent(dev)}%</div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-black/30 p-5">
              <div className="text-sm text-purple-400">Community</div>
              <div className="mt-2 text-xl font-semibold">
                {community.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              <div className="mt-1 text-sm text-zinc-500">{percent(community)}%</div>
            </div>
          </div>

          <p className="mt-5 max-w-3xl text-sm text-zinc-400">
            Tracked supply represents tokens held in publicly disclosed project wallets.
            Remaining circulating supply is distributed across liquidity pools and public holders.
          </p>
        </section>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold">🚨 Recent Alerts</h2>
            <a href="/alerts" className="text-sm text-red-300 hover:underline">
              View full alert feed
            </a>
          </div>

          {!alertsData?.ok && (
            <p className="text-zinc-500">No alerts available right now.</p>
          )}

          {alertsData?.ok && alertsData.alerts.length === 0 && (
            <p className="text-zinc-500">No alert-worthy token movement found.</p>
          )}

          {alertsData?.ok && alertsData.alerts.length > 0 && (
            <div className="space-y-3">
              {alertsData.alerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.signature}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-black/30 p-4"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {severityBadge(alert.severity)}
                      <span className="font-medium">{alert.wallet}</span>
                      <span className={`text-sm capitalize ${categoryColor(alert.category)}`}>
                        {alert.category}
                      </span>
                    </div>

                    <div className="text-sm text-zinc-300">{alert.message}</div>

                    <div className="text-xs text-zinc-500">
                      {formatTimestamp(alert.timestamp)}
                    </div>
                  </div>

                  <a
                    href={solscanTxUrl(alert.signature)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-blue-400 hover:underline"
                  >
                    View TX
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
          <h2 className="mb-5 text-2xl font-semibold">Official Wallets</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left text-zinc-400">
                  <th className="py-3">Label</th>
                  <th>Category</th>
                  <th>Address</th>
                  <th>SOL</th>
                  <th>JTRUMP</th>
                  <th>Purpose</th>
                  <th>Explorer</th>
                </tr>
              </thead>

              <tbody>
                {data.wallets.map((wallet) => (
                  <tr key={wallet.address} className="border-b border-zinc-900">
                    <td className="py-4 font-medium">{wallet.label}</td>
                    <td className={`capitalize ${categoryColor(wallet.category)}`}>
                      {wallet.category}
                    </td>
                    <td className="font-mono">{shortAddress(wallet.address)}</td>
                    <td>{wallet.solBalance.toFixed(4)}</td>
                    <td>
                      {wallet.jtrumpBalance.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="text-zinc-400">{wallet.purpose}</td>
                    <td>
                      <a
                        href={solscanAccountUrl(wallet.address)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
            <h2 className="mb-4 text-2xl font-semibold">Trust Proofs</h2>
            <ul className="space-y-3 text-zinc-300">
              <li>• Official project wallets are publicly disclosed.</li>
              <li>• Treasury allocations are split across multiple wallets.</li>
              <li>• Large token movements are monitored and surfaced publicly.</li>
              <li>• Wallet balances can be independently verified on Solscan.</li>
              <li>• Mint and freeze authority statuses are checked from on-chain data.</li>
              <li>• LP status is published for public investor review.</li>
            </ul>
          </section>

          <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
            <h2 className="mb-4 text-2xl font-semibold">Investor FAQ</h2>
            <div className="space-y-4 text-sm text-zinc-300">
              <div>
                <div className="font-semibold text-white">
                  Why is tracked supply lower than total supply?
                </div>
                <p className="mt-1 text-zinc-400">
                  Tracked supply reflects publicly disclosed project wallets, not every public holder wallet.
                </p>
              </div>

              <div>
                <div className="font-semibold text-white">
                  How can I verify these wallets?
                </div>
                <p className="mt-1 text-zinc-400">
                  Use the explorer links above to inspect balances and activity directly on Solscan.
                </p>
              </div>

              <div>
                <div className="font-semibold text-white">
                  What triggers an alert?
                </div>
                <p className="mt-1 text-zinc-400">
                  Significant JTRUMP movements in monitored wallets are classified and surfaced in the alert feed.
                </p>
              </div>

              <div>
                <div className="font-semibold text-white">
                  Is this financial advice?
                </div>
                <p className="mt-1 text-zinc-400">
                  No. This dashboard is a transparency and monitoring tool for independent verification.
                </p>
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
