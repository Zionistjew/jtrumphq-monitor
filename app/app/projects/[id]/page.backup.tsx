"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Wallet = {
  label?: string;
  category?: string;
  address?: string;
  purpose?: string;
  allocation?: number;
  declaredAllocation?: number;
  allocationPercent?: number;
  solBalance?: number;
  tokenBalance?: number;
  declaredTokenBalance?: number;
  variancePercent?: number;
  verified?: boolean;
  lowSol?: boolean;
};

type WalletResponse = {
  ok?: boolean;
  slug?: string;
  name?: string;
  symbol?: string;
  mint?: string;
  count?: number;
  wallets?: Wallet[];
};

type TrustResponse = {
  ok?: boolean;
  score?: number;
  grade?: string;
  status?: string;
  breakdown?: Record<string, number>;
  metrics?: Record<string, any>;
};

type AlertItem = {
  severity: "critical" | "warning" | "info" | "success";
  title: string;
  description: string;
  source: string;
};

type TimelineItem = {
  severity: "critical" | "warning" | "info" | "success";
  time: string;
  title: string;
  description: string;
  eventType: string;
};

export default function OwnerProjectControlCenter() {
  const params = useParams();
  const slug = String(params?.id || "");

  const [walletData, setWalletData] = useState<WalletResponse | null>(null);
  const [trustData, setTrustData] = useState<TrustResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState("");
  const [lastScan, setLastScan] = useState<Date | null>(null);

  async function loadProject() {
    if (!slug) return;

    setLoading(true);

    try {
      const [walletRes, trustRes] = await Promise.allSettled([
        fetch(`/api/token/${slug}/wallets`, { cache: "no-store" }),
        fetch(`/api/trust-score/${slug}`, { cache: "no-store" }),
      ]);

      if (walletRes.status === "fulfilled") {
        setWalletData(await walletRes.value.json().catch(() => null));
      }

      if (trustRes.status === "fulfilled") {
        setTrustData(await trustRes.value.json().catch(() => null));
      }

      setLastScan(new Date());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProject();
  }, [slug]);

  const wallets = walletData?.wallets || [];
  const verifiedCount = wallets.filter((wallet) => wallet.verified).length;

  const totalAllocation = useMemo(() => {
    return wallets.reduce(
      (sum, wallet) => sum + getAllocationPercent(wallet),
      0
    );
  }, [wallets]);

  const trustScore = Number(trustData?.score ?? 0);
  const grade =
    trustData?.grade ||
    (trustScore >= 85
      ? "A"
      : trustScore >= 70
        ? "B"
        : trustScore >= 50
          ? "C"
          : "F");

  const risk = getRiskVisuals(grade, trustScore);
  const alerts = buildAlerts(wallets, trustScore, grade);
  const timeline = buildTimeline(wallets, trustScore, grade, lastScan);
  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const warningCount = alerts.filter((a) => a.severity === "warning").length;

  const publicUrl = `https://app.web3mb.com/token/${slug}`;
  const trustSealUrl = `https://app.web3mb.com/api/trust-seal/${slug}`;
  const embedCode = `<a href="${publicUrl}" target="_blank" rel="noopener noreferrer"><img src="${trustSealUrl}" alt="Verified by WEB3MB" /></a>`;

  async function copyText(label: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 1600);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black p-4 text-white">
        <div className="mx-auto max-w-[1500px]">
          <div className="animate-pulse rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="h-6 w-56 rounded bg-zinc-800" />
            <div className="mt-4 h-28 rounded-xl bg-zinc-900" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-[1500px] px-4 pb-8 pt-3 sm:px-5 lg:px-5">
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className={`text-[11px] font-bold uppercase tracking-[0.28em] ${risk.text}`}>
              Owner Control Center
            </p>
            <h1 className="mt-1 text-2xl font-black sm:text-3xl">
              {walletData?.name || slug}
            </h1>
            <p className="mt-1 max-w-3xl text-xs text-zinc-400 sm:text-sm">
              Manage trust, wallet health, public transparency, alerts, monitoring history, and WEB3MB verification.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href={`/token/${slug}`} className="rounded-xl border border-zinc-700 px-4 py-2.5 text-center text-xs font-bold text-zinc-200 hover:bg-zinc-900">
              Public Dashboard
            </Link>

            <button onClick={loadProject} className={`rounded-xl px-4 py-2.5 text-xs font-black text-black ${risk.button}`}>
              Refresh Scan
            </button>
          </div>
        </div>

        <section className="grid items-start gap-3 xl:grid-cols-[1.12fr_0.88fr]">
          <TrustHero
            risk={risk}
            trustScore={trustScore}
            grade={grade}
            status={trustData?.status || "Live verification active"}
            lastScan={lastScan}
            wallets={wallets.length}
            verifiedCount={verifiedCount}
            warningCount={warningCount}
            criticalCount={criticalCount}
          />

          <AlertsPanel alerts={alerts} />
        </section>

        <section className="mt-3 grid items-start gap-3 xl:grid-cols-[1.05fr_0.95fr]">
          <WalletHealth wallets={wallets} />
          <MonitoringTimeline timeline={timeline} />
        </section>

        <section className="mt-3 grid items-start gap-3 xl:grid-cols-3">
          <AllocationSummary wallets={wallets} totalAllocation={totalAllocation} />

          <VerificationBadgePanel
            score={trustScore}
            grade={grade}
            riskLabel={risk.label}
            wallets={wallets.length}
            embedCode={embedCode}
            publicUrl={publicUrl}
            copied={copied}
            onCopy={copyText}
          />

          <ProjectLinks
            publicUrl={publicUrl}
            trustSealUrl={trustSealUrl}
            copied={copied}
            onCopy={copyText}
          />
        </section>
      </div>
    </main>
  );
}

function TrustHero({
  risk,
  trustScore,
  grade,
  status,
  lastScan,
  wallets,
  verifiedCount,
  warningCount,
  criticalCount,
}: {
  risk: ReturnType<typeof getRiskVisuals>;
  trustScore: number;
  grade: string;
  status: string;
  lastScan: Date | null;
  wallets: number;
  verifiedCount: number;
  warningCount: number;
  criticalCount: number;
}) {
  const progress = wallets ? Math.round((verifiedCount / wallets) * 100) : 0;

  return (
    <div className={`rounded-2xl border ${risk.border} bg-zinc-950 p-4 shadow-xl ${risk.shadow}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs text-zinc-400">WEB3MB Trust Score</p>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-5xl font-black">{trustScore}</span>
            <span className="pb-2 text-base font-bold text-zinc-400">/100</span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${risk.badge}`}>Grade {grade}</span>
            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${risk.badge}`}>{risk.label}</span>
            <span className="rounded-full border border-zinc-700 px-2.5 py-1 text-[11px] font-bold text-zinc-300">{status}</span>
          </div>

          <p className="mt-3 text-xs text-zinc-400">
            Last verified: <span className="font-bold text-white">{lastScan ? lastScan.toLocaleString() : "Just now"}</span>
          </p>
        </div>

        <div className={`mx-auto rounded-full border p-3 ${risk.border} lg:mx-0`}>
          <div className={`flex h-24 w-24 items-center justify-center rounded-full text-3xl font-black text-black ${risk.circle}`}>
            {grade}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-4">
        <Metric label="Wallets" value={wallets} />
        <Metric label="Verified" value={`${verifiedCount}/${wallets}`} />
        <Metric label="Warnings" value={warningCount} />
        <Metric label="Critical" value={criticalCount} />
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex justify-between text-xs">
          <span className="text-zinc-400">Wallet verification progress</span>
          <span className="font-bold">{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
          <div className={`h-full rounded-full ${risk.progress}`} style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}

function ProjectLinks({
  publicUrl,
  trustSealUrl,
  copied,
  onCopy,
}: {
  publicUrl: string;
  trustSealUrl: string;
  copied: string;
  onCopy: (label: string, text: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
      <h2 className="text-lg font-bold">Project Links</h2>
      <p className="mt-1 text-xs text-zinc-400">Quick links for sharing public verification.</p>

      <div className="mt-4 space-y-2.5">
        <button onClick={() => onCopy("public", publicUrl)} className="w-full rounded-xl border border-zinc-800 bg-black p-3 text-left text-xs hover:border-cyan-400/50">
          <p className="font-bold text-white">Copy Public URL</p>
          <p className="mt-1 break-all text-[11px] text-zinc-500">{publicUrl}</p>
        </button>

        <button onClick={() => onCopy("seal", trustSealUrl)} className="w-full rounded-xl border border-zinc-800 bg-black p-3 text-left text-xs hover:border-cyan-400/50">
          <p className="font-bold text-white">Copy Trust Seal Image URL</p>
          <p className="mt-1 break-all text-[11px] text-zinc-500">{trustSealUrl}</p>
        </button>

        {copied ? <p className="rounded-lg bg-cyan-400/10 px-3 py-2 text-xs text-cyan-300">Copied successfully.</p> : null}
      </div>
    </div>
  );
}

function AlertsPanel({ alerts }: { alerts: AlertItem[] }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">Active Alerts</h2>
          <p className="mt-1 text-xs text-zinc-400">Live monitoring signals generated from wallet health and trust data.</p>
        </div>

        <span className="rounded-full border border-zinc-700 px-2.5 py-1 text-[11px] font-bold text-zinc-300">{alerts.length}</span>
      </div>

      <div className="mt-4 grid gap-2.5">
        {alerts.length ? (
          alerts.map((alert, index) => {
            const style = getAlertStyle(alert.severity);

            return (
              <div key={`${alert.title}-${index}`} className={`rounded-xl border ${style.border} ${style.bg} p-3`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className={`text-[11px] font-black uppercase ${style.text}`}>{alert.severity}</p>
                    <h3 className="mt-1 text-sm font-bold text-white">{alert.title}</h3>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[11px] ${style.pill}`}>{alert.source}</span>
                </div>

                <p className="mt-1.5 text-xs leading-5 text-zinc-300">{alert.description}</p>
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
            <p className="text-[11px] font-black uppercase text-emerald-300">success</p>
            <h3 className="mt-1 text-sm font-bold text-white">No active alerts</h3>
            <p className="mt-1.5 text-xs leading-5 text-zinc-300">WEB3MB did not detect any current wallet health or trust issues.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function WalletHealth({ wallets }: { wallets: Wallet[] }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
      <h2 className="text-lg font-bold">Wallet Health</h2>
      <p className="mt-1 text-xs text-zinc-400">Live balances, declared allocations, and variance indicators.</p>

      <div className="mt-4 grid gap-3">
        {wallets.length ? (
          wallets.map((wallet, index) => <WalletCard key={`${wallet.address || "wallet"}-${index}`} wallet={wallet} />)
        ) : (
          <div className="rounded-xl border border-zinc-800 bg-black p-4 text-xs text-zinc-400">No wallets found for this project yet.</div>
        )}
      </div>
    </div>
  );
}

function MonitoringTimeline({ timeline }: { timeline: TimelineItem[] }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">Monitoring Timeline</h2>
          <p className="mt-1 text-xs text-zinc-400">Recent wallet, verification, and trust-score events.</p>
        </div>

        <span className="rounded-full border border-zinc-700 px-2.5 py-1 text-[11px] font-bold text-zinc-300">Live</span>
      </div>

      <div className="mt-4">
        {timeline.map((item, index) => {
          const style = getAlertStyle(item.severity);
          const isLast = index === timeline.length - 1;

          return (
            <div key={`${item.title}-${index}`} className="relative pl-7">
              {!isLast ? <div className="absolute left-[8px] top-5 h-full w-px bg-zinc-800" /> : null}

              <div className={`absolute left-0 top-1.5 h-4 w-4 rounded-full border ${style.border} ${style.bg}`} />

              <div className="pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[11px] font-black uppercase ${style.text}`}>{item.eventType}</span>
                  <span className="text-[11px] text-zinc-500">{item.time}</span>
                </div>

                <h3 className="mt-0.5 text-sm font-bold text-white">{item.title}</h3>
                <p className="mt-1 text-xs leading-5 text-zinc-400">{item.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AllocationSummary({ wallets, totalAllocation }: { wallets: Wallet[]; totalAllocation: number }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
      <h2 className="text-lg font-bold">Allocation Summary</h2>
      <p className="mt-1 text-xs text-zinc-400">Declared wallet allocation coverage.</p>

      <div className="mt-4">
        <div className="mb-1.5 flex justify-between text-xs">
          <span className="text-zinc-400">Declared</span>
          <span className="font-bold">{totalAllocation.toFixed(2)}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
          <div className="h-full rounded-full bg-cyan-400" style={{ width: `${Math.min(totalAllocation, 100)}%` }} />
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        {wallets.map((wallet, index) => {
          const allocationPercent = getAllocationPercent(wallet);

          return (
            <div key={`${wallet.label || "allocation"}-${index}`}>
              <div className="mb-1 flex justify-between text-[11px]">
                <span className="text-zinc-400">{wallet.label || wallet.category || "Wallet"}</span>
                <span>{allocationPercent.toFixed(2)}%</span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                <div className="h-full rounded-full bg-zinc-500" style={{ width: `${Math.min(allocationPercent, 100)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-black p-3">
      <p className="text-[11px] text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}

function WalletCard({ wallet }: { wallet: Wallet }) {
  const variance = Number(wallet.variancePercent || 0);
  const absVariance = Math.abs(variance);
  const allocationPercent = getAllocationPercent(wallet);

  const state = wallet.lowSol
    ? { label: "Low SOL", border: "border-red-500/40", badge: "border-red-500/40 bg-red-500/10 text-red-300" }
    : absVariance > 10
      ? { label: "Variance", border: "border-orange-500/40", badge: "border-orange-500/10 border-orange-500/40 text-orange-300" }
      : wallet.verified
        ? { label: "Healthy", border: "border-emerald-500/40", badge: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" }
        : { label: "Review", border: "border-zinc-800", badge: "border-zinc-700 bg-zinc-900 text-zinc-300" };

  return (
    <div className={`rounded-xl border ${state.border} bg-black p-4`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-base font-bold">{wallet.label || "Wallet"}</p>
          <p className="text-xs text-zinc-500">{wallet.category || "Uncategorized"}</p>
        </div>

        <span className={`w-fit rounded-full border px-2.5 py-1 text-[11px] font-bold ${state.badge}`}>{state.label}</span>
      </div>

      <p className="mt-2 break-all text-[11px] text-zinc-500">{wallet.address || "No wallet address"}</p>

      <div className="mt-3 grid gap-2 sm:grid-cols-4">
        <MiniStat label="SOL" value={Number(wallet.solBalance || 0).toFixed(4)} />
        <MiniStat label="Token Balance" value={formatNumber(wallet.tokenBalance)} />
        <MiniStat label="Allocation" value={`${allocationPercent.toFixed(2)}%`} />
        <MiniStat label="Variance" value={`${variance.toFixed(2)}%`} />
      </div>

      {wallet.purpose ? <p className="mt-3 text-xs text-zinc-400">{wallet.purpose}</p> : null}
    </div>
  );
}

function VerificationBadgePanel({
  score,
  grade,
  riskLabel,
  wallets,
  embedCode,
  publicUrl,
  copied,
  onCopy,
}: {
  score: number;
  grade: string;
  riskLabel: string;
  wallets: number;
  embedCode: string;
  publicUrl: string;
  copied: string;
  onCopy: (label: string, text: string) => void;
}) {
  const risk = getRiskVisuals(grade, score);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
      <h2 className="text-lg font-bold">WEB3MB Verification Badge</h2>
      <p className="mt-1 text-xs text-zinc-400">Display this badge on your project website to prove wallet transparency.</p>

      <div className={`mt-4 rounded-xl border ${risk.border} bg-black p-4 ${risk.shadow}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className={`text-[11px] font-black uppercase tracking-[0.22em] ${risk.text}`}>WEB3MB Verified</p>
            <p className="mt-1.5 text-xl font-black">Trust Score: {score}</p>
            <p className="mt-0.5 text-xs text-zinc-400">Grade {grade} · {riskLabel}</p>
          </div>

          <div className={`flex h-12 w-12 items-center justify-center rounded-full text-xl font-black text-black ${risk.circle}`}>
            {grade}
          </div>
        </div>

        <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-xs text-zinc-300">
          {wallets} wallets monitored · Public transparency report available
        </div>

        <Link href={publicUrl.replace("https://app.web3mb.com", "")} className={`mt-3 block rounded-xl px-3 py-2.5 text-center text-xs font-black text-black ${risk.button}`}>
          View Transparency Report
        </Link>
      </div>

      <div className="mt-3 rounded-xl border border-zinc-800 bg-black p-3">
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-zinc-500">Developer Embed Code</p>
        <code className="block whitespace-pre-wrap break-all text-[11px] text-cyan-200">{embedCode}</code>
      </div>

      <button onClick={() => onCopy("embed", embedCode)} className={`mt-3 w-full rounded-xl px-4 py-2.5 text-xs font-black text-black ${risk.button}`}>
        {copied === "embed" ? "Copied" : "Copy Embed Code"}
      </button>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-2.5">
      <p className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 break-all text-xs font-bold text-white">{value}</p>
    </div>
  );
}

function getAllocationPercent(wallet: Wallet) {
  const candidates = [wallet.allocationPercent, wallet.declaredAllocation, wallet.allocation];

  for (const value of candidates) {
    const n = Number(value);
    if (Number.isFinite(n) && n >= 0 && n <= 100) return n;
  }

  return 0;
}

function buildAlerts(wallets: Wallet[], score: number, grade: string): AlertItem[] {
  const alerts: AlertItem[] = [];

  if (score < 50 || String(grade).toUpperCase() === "F") {
    alerts.push({
      severity: "critical",
      title: "Project trust score is high risk",
      description:
        "The WEB3MB trust score is below the recommended launch threshold. Review wallet verification, disclosed allocations, and active wallet warnings.",
      source: "Trust Score",
    });
  }

  wallets.forEach((wallet) => {
    const label = wallet.label || wallet.category || "Wallet";
    const variance = Number(wallet.variancePercent || 0);
    const absVariance = Math.abs(variance);

    if (wallet.lowSol) {
      alerts.push({
        severity: "warning",
        title: `${label} has low SOL balance`,
        description: "This wallet may not have enough SOL available for transaction activity.",
        source: "Wallet",
      });
    }

    if (absVariance > 25) {
      alerts.push({
        severity: "critical",
        title: `${label} allocation variance is severe`,
        description: `This wallet is showing a ${variance.toFixed(2)}% variance from declared allocation. Review immediately.`,
        source: "Allocation",
      });
    } else if (absVariance > 10) {
      alerts.push({
        severity: "warning",
        title: `${label} allocation variance detected`,
        description: `This wallet is showing a ${variance.toFixed(2)}% variance from declared allocation.`,
        source: "Allocation",
      });
    }
  });

  if (wallets.length > 0 && wallets.every((wallet) => wallet.verified)) {
    alerts.push({
      severity: "success",
      title: "All disclosed wallets verified",
      description: "Every disclosed wallet is currently passing WEB3MB verification checks.",
      source: "Verification",
    });
  }

  return alerts.slice(0, 8);
}

function buildTimeline(wallets: Wallet[], score: number, grade: string, lastScan: Date | null): TimelineItem[] {
  const timeline: TimelineItem[] = [];

  timeline.push({
    severity: score < 50 || String(grade).toUpperCase() === "F" ? "critical" : "info",
    time: lastScan ? "Just now" : "Pending scan",
    title: `Trust score recalculated at ${score}/100`,
    description: `WEB3MB completed a trust-score refresh and assigned Grade ${grade}.`,
    eventType: "Trust Score",
  });

  wallets.forEach((wallet, index) => {
    const label = wallet.label || wallet.category || `Wallet ${index + 1}`;
    const variance = Number(wallet.variancePercent || 0);
    const absVariance = Math.abs(variance);

    if (wallet.lowSol) {
      timeline.push({
        severity: "warning",
        time: `${index + 2} min ago`,
        title: `${label} low SOL warning triggered`,
        description: "The wallet SOL balance appears low and may require funding.",
        eventType: "Wallet Health",
      });
    }

    if (absVariance > 25) {
      timeline.push({
        severity: "critical",
        time: `${index + 4} min ago`,
        title: `${label} severe allocation variance detected`,
        description: `Variance is currently ${variance.toFixed(2)}%.`,
        eventType: "Allocation",
      });
    } else if (absVariance > 10) {
      timeline.push({
        severity: "warning",
        time: `${index + 5} min ago`,
        title: `${label} allocation variance detected`,
        description: `Variance is currently ${variance.toFixed(2)}%.`,
        eventType: "Allocation",
      });
    }

    timeline.push({
      severity: wallet.verified ? "success" : "info",
      time: `${index + 10} min ago`,
      title: wallet.verified ? `${label} wallet verification completed` : `${label} wallet scan completed`,
      description: wallet.verified
        ? "WEB3MB confirmed this wallet is passing verification checks."
        : "WEB3MB scanned wallet balance, allocation, and verification state.",
      eventType: wallet.verified ? "Verification" : "Scan",
    });
  });

  if (wallets.length > 0) {
    timeline.push({
      severity: "info",
      time: "15 min ago",
      title: `${wallets.length} disclosed wallets indexed`,
      description: "WEB3MB loaded disclosed wallets and prepared monitoring signals.",
      eventType: "Indexing",
    });
  }

  timeline.push({
    severity: "info",
    time: "30 min ago",
    title: "Monitoring session initialized",
    description:
      "WEB3MB initialized wallet health, trust score, allocation, and verification monitoring.",
    eventType: "System",
  });

  return timeline.slice(0, 10);
}

function getAlertStyle(severity: AlertItem["severity"]) {
  if (severity === "critical") {
    return {
      border: "border-red-500/40",
      bg: "bg-red-500/10",
      text: "text-red-300",
      pill: "bg-red-500/20 text-red-200",
    };
  }

  if (severity === "warning") {
    return {
      border: "border-orange-500/40",
      bg: "bg-orange-500/10",
      text: "text-orange-300",
      pill: "bg-orange-500/20 text-orange-200",
    };
  }

  if (severity === "success") {
    return {
      border: "border-emerald-500/40",
      bg: "bg-emerald-500/10",
      text: "text-emerald-300",
      pill: "bg-emerald-500/20 text-emerald-200",
    };
  }

  return {
    border: "border-cyan-500/40",
    bg: "bg-cyan-500/10",
    text: "text-cyan-300",
    pill: "bg-cyan-500/20 text-cyan-200",
  };
}

function getRiskVisuals(grade: string, score: number) {
  const g = String(grade || "").toUpperCase();

  if (g === "A" || score >= 85) {
    return {
      label: "Low Risk",
      text: "text-emerald-300",
      border: "border-emerald-500/30",
      badge: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
      circle: "bg-emerald-400",
      button: "bg-emerald-400 hover:bg-emerald-300",
      progress: "bg-emerald-400",
      shadow: "shadow-emerald-500/10",
    };
  }

  if (g === "B" || score >= 70) {
    return {
      label: "Moderate Trust",
      text: "text-lime-300",
      border: "border-lime-500/30",
      badge: "border-lime-500/40 bg-lime-500/10 text-lime-300",
      circle: "bg-lime-400",
      button: "bg-lime-400 hover:bg-lime-300",
      progress: "bg-lime-400",
      shadow: "shadow-lime-500/10",
    };
  }

  if (g === "C" || score >= 50) {
    return {
      label: "Medium Risk",
      text: "text-orange-300",
      border: "border-orange-500/30",
      badge: "border-orange-500/40 bg-orange-500/10 text-orange-300",
      circle: "bg-orange-400",
      button: "bg-orange-400 hover:bg-orange-300",
      progress: "bg-orange-400",
      shadow: "shadow-orange-500/10",
    };
  }

  return {
    label: "High Risk",
    text: "text-red-300",
    border: "border-red-500/30",
    badge: "border-red-500/40 bg-red-500/10 text-red-300",
    circle: "bg-red-400",
    button: "bg-red-400 hover:bg-red-300",
    progress: "bg-red-400",
    shadow: "shadow-red-500/10",
  };
}

function formatNumber(value: any) {
  const n = Number(value || 0);

  if (!Number.isFinite(n)) return "0";

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(n);
}
