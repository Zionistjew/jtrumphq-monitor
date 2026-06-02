import Link from "next/link";
import { headers } from "next/headers";
import PrintButton from "./print-button";

export const dynamic = "force-dynamic";

async function getBaseUrl() {
  const h = headers();
  const host = h.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

async function safeFetch(url: string) {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function gradeColor(grade: string) {
  if (grade === "A") return "text-emerald-400";
  if (grade === "B") return "text-lime-400";
  if (grade === "C") return "text-yellow-400";
  if (grade === "D") return "text-orange-400";
  return "text-red-400";
}

export default async function AuditReportPage({
  params,
}: {
  params: { slug: string };
}) {
  const baseUrl = await getBaseUrl();
  const slug = params.slug;

  const trust = await safeFetch(`${baseUrl}/api/trust-score/${slug}`);
  const walletsData = await safeFetch(`${baseUrl}/api/token/${slug}/wallets`);
  const alertsData = await safeFetch(`${baseUrl}/api/token/${slug}/alerts`);

  const projectName =
    trust?.name || trust?.project?.name || walletsData?.name || slug.toUpperCase();

  const symbol =
    trust?.symbol || trust?.project?.symbol || walletsData?.symbol || slug.toUpperCase();

  const score = trust?.score ?? trust?.trustScore ?? 0;
  const grade = trust?.grade ?? "N/A";
  const status = trust?.status ?? "Unknown";

  const holderAnalysis = trust?.holderAnalysis || {};
  const sellPressure = trust?.sellPressure || {};
  const wallets = walletsData?.wallets || [];
  const alerts = alertsData?.alerts || [];

  const generatedDate = new Date().toLocaleString();

  return (
    <main className="min-h-screen bg-[#070b18] text-white print:bg-white print:text-black">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8 flex items-center justify-between gap-4 print:hidden">
          <Link
            href={`/token/${slug}`}
            className="rounded-xl border border-cyan-400/30 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-cyan-400/10"
          >
            ← Back to Dashboard
          </Link>

          <PrintButton />
        </div>

        <section className="border-b border-cyan-400/20 pb-8 print:border-zinc-300">
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-cyan-300 print:text-cyan-700">
            WEB3MB Transparency Center
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Investor Audit Report
          </h1>

          <div className="mt-5 grid gap-3 text-sm text-zinc-300 sm:grid-cols-2 print:text-zinc-700">
            <p><span className="font-bold text-white print:text-black">Project:</span> {projectName}</p>
            <p><span className="font-bold text-white print:text-black">Symbol:</span> {symbol}</p>
            <p><span className="font-bold text-white print:text-black">Slug:</span> {slug}</p>
            <p><span className="font-bold text-white print:text-black">Generated:</span> {generatedDate}</p>
          </div>
        </section>

        <section className="mt-8 grid gap-5 sm:grid-cols-3">
          <div className="rounded-2xl border border-cyan-400/20 bg-white/5 p-6 shadow-xl print:border-zinc-300 print:bg-white">
            <p className="text-sm font-bold uppercase text-zinc-400">Trust Score</p>
            <p className="mt-3 text-5xl font-black">{score}</p>
          </div>

          <div className="rounded-2xl border border-cyan-400/20 bg-white/5 p-6 shadow-xl print:border-zinc-300 print:bg-white">
            <p className="text-sm font-bold uppercase text-zinc-400">Grade</p>
            <p className={`mt-3 text-5xl font-black ${gradeColor(grade)}`}>{grade}</p>
          </div>

          <div className="rounded-2xl border border-cyan-400/20 bg-white/5 p-6 shadow-xl print:border-zinc-300 print:bg-white">
            <p className="text-sm font-bold uppercase text-zinc-400">Status</p>
            <p className="mt-3 text-2xl font-black">{status}</p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-cyan-400/20 bg-white/5 p-6 shadow-xl print:border-zinc-300 print:bg-white">
          <h2 className="text-2xl font-black">Executive Risk Summary</h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <p className="font-bold text-cyan-200 print:text-black">Overall Risk</p>
              <p className="mt-2 text-sm text-zinc-300 print:text-zinc-700">
                Current project risk is based on wallet verification, holder concentration,
                sell pressure, wallet health, and allocation coverage.
              </p>
            </div>

            <div>
              <p className="font-bold text-cyan-200 print:text-black">Investor Assessment</p>
              <p className="mt-2 text-sm text-zinc-300 print:text-zinc-700">
                This report is generated from live WEB3MB transparency data and is intended
                to help investors quickly evaluate project credibility and risk exposure.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-cyan-400/20 bg-white/5 p-6 shadow-xl print:border-zinc-300 print:bg-white">
          <h2 className="text-2xl font-black">Investor Intelligence</h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {[
              ["Largest Holder %", `${holderAnalysis?.largestHolderPercent ?? "N/A"}%`],
              ["Top 10 %", `${holderAnalysis?.top10Percent ?? "N/A"}%`],
              ["Concentration Risk", holderAnalysis?.concentrationRisk ?? "N/A"],
              [
                "Sell Pressure Index",
                `${sellPressure?.score ?? "N/A"}${sellPressure?.level ? ` (${sellPressure.level})` : ""}`,
              ],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-white/10 bg-black/30 p-4 print:border-zinc-200 print:bg-zinc-50">
                <p className="text-sm font-bold text-zinc-400">{label}</p>
                <p className="mt-2 text-3xl font-black">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-cyan-400/20 bg-white/5 p-6 shadow-xl print:border-zinc-300 print:bg-white">
          <h2 className="text-2xl font-black">Wallet Summary</h2>

          <div className="mt-5 overflow-hidden rounded-xl border border-cyan-400/20 print:border-zinc-300">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-cyan-400/10 print:bg-zinc-100">
                <tr>
                  <th className="p-3">Wallet</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Verified</th>
                  <th className="p-3">SOL</th>
                </tr>
              </thead>
              <tbody>
                {wallets.length > 0 ? (
                  wallets.map((wallet: any, index: number) => (
                    <tr key={index} className="border-t border-white/10 print:border-zinc-200">
                      <td className="p-3 font-semibold">{wallet.label || wallet.name || "Wallet"}</td>
                      <td className="p-3">{wallet.category || wallet.purpose || "N/A"}</td>
                      <td className="p-3">{wallet.verified ? "Verified" : "Unverified"}</td>
                      <td className="p-3">{wallet.solBalance ?? wallet.sol_balance ?? "N/A"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="p-3 text-zinc-400" colSpan={4}>No wallet data available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-cyan-400/20 bg-white/5 p-6 shadow-xl print:border-zinc-300 print:bg-white">
          <h2 className="text-2xl font-black">Recommended Actions</h2>

          <ul className="mt-4 list-disc space-y-2 pl-6 text-sm text-zinc-300 print:text-zinc-700">
            <li>Verify all disclosed team, treasury, liquidity, and community wallets.</li>
            <li>Maintain healthy SOL balances for operational wallets.</li>
            <li>Reduce holder concentration where possible.</li>
            <li>Keep wallet allocations aligned with public disclosures.</li>
            <li>Monitor sell pressure and liquidity changes regularly.</li>
          </ul>
        </section>

        <section className="mt-8 rounded-2xl border border-cyan-400/20 bg-white/5 p-6 shadow-xl print:border-zinc-300 print:bg-white">
          <h2 className="text-2xl font-black">Recent Alerts</h2>

          <div className="mt-4 space-y-3">
            {alerts.length > 0 ? (
              alerts.slice(0, 8).map((alert: any, index: number) => (
                <div key={index} className="rounded-xl border border-white/10 bg-black/30 p-4 print:border-zinc-200 print:bg-zinc-50">
                  <p className="font-bold">{alert.title || alert.message || "Alert"}</p>
                  {alert.severity && (
                    <p className="mt-1 text-sm text-zinc-400 print:text-zinc-600">
                      Severity: {alert.severity}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-400">No recent alerts found.</p>
            )}
          </div>
        </section>

        <footer className="mt-10 border-t border-cyan-400/20 pt-6 text-xs text-zinc-400 print:border-zinc-300 print:text-zinc-500">
          This report was generated by WEB3MB Transparency Center. It is not financial advice.
          Investors should perform their own due diligence.
        </footer>
      </div>
    </main>
  );
}
