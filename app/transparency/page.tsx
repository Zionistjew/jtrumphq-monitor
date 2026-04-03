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

type WalletApiResponse = {
  ok: boolean;
  count: number;
  mint: string;
  wallets: Wallet[];
  updatedAt: string;
};

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

export default async function TransparencyPage() {
  const data = await getWalletData();

  if (!data || !data.ok) {
    return (
      <main className="min-h-screen bg-black p-8 text-white">
        <h1 className="text-4xl font-bold">Error loading data</h1>
      </main>
    );
  }

  // 🔥 THIS is the new secure call (no errors)
  const security = await getTokenSecurity(data.mint);

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold">
            JTRUMP Transparency Center
          </h1>

          <div className="flex gap-3">
            <a href="/transparency" className="px-4 py-2 bg-zinc-900 rounded">
              Dashboard
            </a>
            <a href="/alerts" className="px-4 py-2 bg-red-900 rounded text-red-300">
              Alerts
            </a>
          </div>
        </div>

        {/* 🔥 TRUST STATUS (REAL DATA) */}
        <section className="grid gap-4 md:grid-cols-3">

          <div className="p-5 bg-green-950/20 border border-green-900 rounded-xl">
            <div className="text-green-300 text-sm">Mint Authority</div>
            <div className="text-xl font-bold mt-2">
              {security.mintAuthority === "revoked"
                ? "Revoked ✅"
                : "Active ⚠️"}
            </div>
          </div>

          <div className="p-5 bg-yellow-950/20 border border-yellow-900 rounded-xl">
            <div className="text-yellow-300 text-sm">Freeze Authority</div>
            <div className="text-xl font-bold mt-2">
              {security.freezeAuthority === "revoked"
                ? "Revoked ✅"
                : "Active ⚠️"}
            </div>
          </div>

          <div className="p-5 bg-red-950/20 border border-red-900 rounded-xl">
            <div className="text-red-300 text-sm">Live Monitoring</div>
            <div className="text-xl font-bold mt-2">
              Active
            </div>
          </div>

        </section>

        {/* WALLET TABLE */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">
            Official Wallets
          </h2>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400">
                <th className="text-left py-3">Label</th>
                <th>Category</th>
                <th>Address</th>
                <th>JTRUMP</th>
              </tr>
            </thead>

            <tbody>
              {data.wallets.map((wallet) => (
                <tr key={wallet.address} className="border-b border-zinc-900">
                  <td className="py-3">{wallet.label}</td>
                  <td>{wallet.category}</td>
                  <td>
                    {wallet.address.slice(0, 4)}...
                    {wallet.address.slice(-4)}
                  </td>
                  <td>
                    {wallet.jtrumpBalance.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

      </div>
    </main>
  );
}
