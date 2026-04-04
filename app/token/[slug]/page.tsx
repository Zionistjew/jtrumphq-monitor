import { getProjectBySlug } from "@/lib/projects";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

export default function TokenProjectPage({ params }: PageProps) {
  const project = getProjectBySlug(params.slug);

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
            <div className="mt-2 text-2xl font-bold">{project.wallets.length}</div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <div className="text-sm text-zinc-400">Slug</div>
            <div className="mt-2 text-2xl font-bold">{project.slug}</div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <div className="text-sm text-zinc-400">Status</div>
            <div className="mt-2 text-2xl font-bold text-green-400">Live</div>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
          <h2 className="mb-5 text-2xl font-semibold">Configured Wallets</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left text-zinc-400">
                  <th className="py-3">Label</th>
                  <th>Category</th>
                  <th>Address</th>
                  <th>Purpose</th>
                  <th>Explorer</th>
                </tr>
              </thead>

              <tbody>
                {project.wallets.map((wallet) => (
                  <tr key={wallet.address} className="border-b border-zinc-900">
                    <td className="py-4 font-medium">{wallet.label}</td>
                    <td className={`capitalize ${categoryColor(wallet.category)}`}>
                      {wallet.category}
                    </td>
                    <td className="font-mono">{shortAddress(wallet.address)}</td>
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
            <h2 className="mb-4 text-2xl font-semibold">Platform Value</h2>
            <ul className="space-y-3 text-zinc-300">
              <li>• Reusable token dashboard structure</li>
              <li>• Project-based configuration by slug</li>
              <li>• Ready for multi-token monetization</li>
              <li>• Easy to onboard future projects</li>
            </ul>
          </section>

          <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
            <h2 className="mb-4 text-2xl font-semibold">Next Upgrade</h2>
            <ul className="space-y-3 text-zinc-300">
              <li>• Per-project live wallet API</li>
              <li>• Per-project alert feed</li>
              <li>• Holder distribution charts</li>
              <li>• Paid branded dashboards</li>
            </ul>
          </section>
        </section>
      </div>
    </main>
  );
}
