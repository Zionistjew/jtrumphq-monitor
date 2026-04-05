import { getProjectBySlug } from "@/lib/projects";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Wallet = {
  label: string;
  category: string;
  address: string;
  purpose: string;
  solBalance: number;
  tokenBalance: number;
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

type WalletsApiResponse = {
  ok: boolean;
  slug: string;
  name: string;
  symbol: string;
  mint: string;
  count: number;
  wallets: Wallet[];
  updatedAt: string;
};

type AlertsApiResponse = {
  ok: boolean;
  slug: string;
  name: string;
  symbol: string;
  mint: string;
  count: number;
  alerts: AlertItem[];
  updatedAt: string;
};

type PageProps = {
  params: {
    slug: string;
  };
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

async function getProjectWallets(slug: string): Promise<WalletsApiResponse | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
    const res = await fetch(`${baseUrl}/api/token/${slug}/wallets`, {
      cache: "no-store",
    });

    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getProjectAlerts(slug: string): Promise<AlertsApiResponse | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
    const res = await fetch(`${baseUrl}/api/token/${slug}/alerts`, {
      cache: "no-store",
    });

    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function TokenProjectPage({ params }: PageProps) {
  const project = await getProjectBySlug(params.slug);

  if (!project) {
    return (
      <main className="min-h-screen bg-black p-8 text-white">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-4xl font-bold">Project not found</h1>
          <p className="mt-3 text-zinc-400">
            This token project has not been configured yet.
          </p>
          <a
            href="/"
            className="mt-6 inline-block rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm hover:bg-zinc-800"
          >
            Back to platform
          </a>
        </div>
      </main>
    );
  }

  const walletsData = await getProjectWallets(project.slug);
  const alertsData = await getProjectAlerts(project.slug);

  const wallets = walletsData?.ok ? walletsData.wallets : [];
  const alerts = alertsData?.ok ? alertsData.alerts : [];

  const totalTracked = wallets.reduce((sum, w) => sum + w.tokenBalance, 0);
  const treasuryTracked = wallets
    .filter((w) => w.category === "treasury")
    .reduce((sum, w) => sum + w.tokenBalance, 0);

  const criticalAlerts = alerts.filter((a) => a.severity === "critical").length;
  const warningAlerts = alerts.filter((a) => a.severity === "warning").length;

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        <section className="rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-950 via-black to-red-950/20 p-8 shadow-2xl">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center rounded-full border border-red-800 bg-red-950/30 px-3 py-1 text-xs uppercase tracking-[0.2em] text-red-300">
                Project Dashboard
              </div>

              <h1 className="text-4xl font-bold md:text-5xl">
                {project.name}
              </h1>

              <p className="mt-4 text-lg text-zinc-300">
                {project.description}
              </p>

              <div className="mt-4 text-sm text-zinc-500">
                Mint: {project.mint}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="/"
                className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm hover:bg-zinc-800"
              >
                Platform Home
              </a>
              <a
                href="/alerts"
                className="rounded-xl border border-red-700 bg-red-900/30 px-4 py-2 text-sm text-red-300 hover:bg-red-900/50"
              >
                Global Alerts
              </a>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <div className="text-sm text-zinc-400">Project</div>
            <div className="mt-2 text-2xl font-bold">{project.symbol}</div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <div className="text-sm text-zinc-400">Wallets Tracked</div>
            <div className="mt-2 text-2xl font-bold">{wallets.length}</div>
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
            <div className="text-sm text-zinc-400">Treasury Tracked</div>
            <div className="mt-2 text-2xl font-bold text-blue-400">
              {treasuryTracked.toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <div className="text-sm text-zinc-400">Total Alerts</div>
            <div className="mt-2 text-2xl font-bold">{alerts.length}</div>
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

        <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold">Project Alerts</h2>
            <div className="text-sm text-zinc-500">
              {alertsData?.ok ? `${alerts.length} tracked events` : "No alerts"}
            </div>
          </div>

          {!alertsData?.ok && (
            <p className="text-zinc-500">Unable to load project alerts right now.</p>
          )}

          {alertsData?.ok && alerts.length === 0 && (
            <p className="text-zinc-500">No alert-worthy token movement found.</p>
          )}

          {alertsData?.ok && alerts.length > 0 && (
            <div className="space-y-3">
              {alerts.slice(0, 8).map((alert) => (
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
          <h2 className="mb-5 text-2xl font-semibold">Project Wallets</h2>

          {!walletsData?.ok && (
            <p className="text-zinc-500">Unable to load project wallets right now.</p>
          )}

          {walletsData?.ok && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-left text-zinc-400">
                    <th className="py-3">Label</th>
                    <th>Category</th>
                    <th>Address</th>
                    <th>SOL</th>
                    <th>{project.symbol}</th>
                    <th>Purpose</th>
                    <th>Explorer</th>
                  </tr>
                </thead>

                <tbody>
                  {wallets.map((wallet) => (
                    <tr key={wallet.address} className="border-b border-zinc-900">
                      <td className="py-4 font-medium">{wallet.label}</td>
                      <td className={`capitalize ${categoryColor(wallet.category)}`}>
                        {wallet.category}
                      </td>
                      <td className="font-mono">{shortAddress(wallet.address)}</td>
                      <td>{wallet.solBalance.toFixed(4)}</td>
                      <td>
                        {wallet.tokenBalance.toLocaleString(undefined, {
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
          )}
        </section>
      </div>
    </main>
  );
}
