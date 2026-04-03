export const dynamic = "force-dynamic";
export const revalidate = 0;

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

type AlertsApiResponse = {
  ok: boolean;
  count: number;
  alerts: AlertItem[];
};

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

function directionBadge(direction: AlertItem["direction"]) {
  switch (direction) {
    case "in":
      return (
        <span className="inline-flex items-center rounded-full border border-green-800 bg-green-950/40 px-2 py-1 text-xs text-green-400">
          Incoming
        </span>
      );
    case "out":
      return (
        <span className="inline-flex items-center rounded-full border border-orange-800 bg-orange-950/40 px-2 py-1 text-xs text-orange-400">
          Outgoing
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-400">
          Neutral
        </span>
      );
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

async function getAlertsData(): Promise<AlertsApiResponse | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/transparency/alerts`, {
      cache: "no-store",
    });

    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function AlertsPage() {
  const alertsData = await getAlertsData();

  return (
    <main className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-7xl space-y-10">
        <section>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h1 className="text-4xl font-bold">JTRUMP Alert Feed</h1>

            <div className="flex gap-3">
              <a
                href="/transparency"
                className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-sm hover:bg-zinc-800"
              >
                Dashboard
              </a>

              <a
                href="/alerts"
                className="px-4 py-2 rounded-lg bg-red-900/30 border border-red-700 text-red-400 text-sm hover:bg-red-900/50"
              >
                Alerts
              </a>
            </div>
          </div>

          <p className="mt-2 max-w-3xl text-zinc-400">
            Public monitoring feed for large JTRUMP wallet movements across
            official project wallets.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <div className="text-sm text-zinc-400">Total Alerts</div>
            <div className="text-2xl font-bold">
              {alertsData?.ok ? alertsData.count : 0}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <div className="text-sm text-zinc-400">Critical Alerts</div>
            <div className="text-2xl font-bold text-red-400">
              {alertsData?.ok
                ? alertsData.alerts.filter((a) => a.severity === "critical").length
                : 0}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <div className="text-sm text-zinc-400">Warning Alerts</div>
            <div className="text-2xl font-bold text-yellow-400">
              {alertsData?.ok
                ? alertsData.alerts.filter((a) => a.severity === "warning").length
                : 0}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold">Live Alert History</h2>
            <div className="text-sm text-zinc-500">
              {alertsData?.ok ? `${alertsData.count} alert events` : "No alerts"}
            </div>
          </div>

          {!alertsData?.ok && (
            <p className="text-zinc-500">Unable to load alerts right now.</p>
          )}

          {alertsData?.ok && alertsData.alerts.length === 0 && (
            <p className="text-zinc-500">No alert-worthy token movement found.</p>
          )}

          {alertsData?.ok && alertsData.alerts.length > 0 && (
            <div className="space-y-3">
              {alertsData.alerts.map((alert) => (
                <div
                  key={alert.signature}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-900 bg-black/20 p-4"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {severityBadge(alert.severity)}
                      <span className="font-medium">{alert.wallet}</span>
                      <span
                        className={`text-sm capitalize ${categoryColor(alert.category)}`}
                      >
                        {alert.category}
                      </span>
                      {directionBadge(alert.direction)}
                    </div>

                    <div className="text-sm text-zinc-300">{alert.message}</div>

                    <div className="text-sm text-zinc-400">
                      Amount:{" "}
                      <span className="font-semibold">
                        {alert.amount.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </span>{" "}
                      JTRUMP
                    </div>

                    <div className="text-sm text-zinc-500">
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
      </div>
    </main>
  );
}
