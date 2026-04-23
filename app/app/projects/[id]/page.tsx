import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: {
    id: string;
  };
};

function GlowOrb({ className = "" }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute rounded-full blur-3xl opacity-20 ${className}`}
    />
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
      <div className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">
        {label}
      </div>
      <div className="mt-3 break-all text-lg font-semibold text-white">
        {value}
      </div>
    </div>
  );
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <main className="p-8 text-white">Not authenticated</main>;
  }

  const projectId = Number(params.id);

  if (!Number.isFinite(projectId)) {
    notFound();
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select(
      "id, owner_id, user_id, slug, name, symbol, mint, description, theme_primary, theme_accent, wallets, created_at"
    )
    .eq("id", projectId)
    .eq("owner_id", user.id)
    .single();

  if (projectError || !project) {
    notFound();
  }

  const { data: walletRows, error: walletError } = await supabase
    .from("project_wallets")
    .select("id, label, category, address, purpose, allocation, created_at")
    .eq("project_id", project.id)
    .order("created_at", { ascending: true });

  const wallets =
    walletRows && walletRows.length > 0
      ? walletRows
      : Array.isArray(project.wallets)
      ? project.wallets.map((wallet: any, index: number) => ({
          id: `json-${index}`,
          label: wallet?.label || "",
          category: wallet?.category || "",
          address: wallet?.address || "",
          purpose: wallet?.purpose || "",
          allocation: wallet?.allocation ?? 0,
          created_at: null,
        }))
      : [];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050816] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.08),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.10),transparent_24%),radial-gradient(circle_at_20%_80%,rgba(168,85,247,0.08),transparent_24%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:42px_42px] opacity-[0.08]" />

      <GlowOrb className="left-[-100px] top-[80px] h-[240px] w-[240px] bg-cyan-400" />
      <GlowOrb className="right-[0] top-[120px] h-[220px] w-[220px] bg-fuchsia-500" />
      <GlowOrb className="bottom-[120px] left-[20%] h-[260px] w-[260px] bg-blue-500" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <Image
          src="/branding/web3mb-icon.png"
          alt=""
          width={520}
          height={520}
          priority
          className="absolute right-[-80px] top-[120px] opacity-[0.035] blur-[1px]"
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-4">
              <Image
                src="/branding/web3mb-logo.png"
                alt="WEB3MB"
                width={170}
                height={44}
                priority
                className="h-auto w-[170px] opacity-95"
              />

              <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-cyan-300">
                Owner Project Console
              </div>
            </div>

            <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
              {project.name}
            </h1>

            <p className="mt-3 text-lg text-zinc-300">{project.symbol}</p>

            <p className="mt-6 max-w-3xl text-zinc-400">
              {project.description || "No description provided yet."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/app/projects"
              className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white backdrop-blur-sm transition hover:bg-white/10"
            >
              Back to Projects
            </Link>

            <Link
              href={`/token/${project.slug}`}
              className="rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-zinc-200"
            >
              View Public Dashboard
            </Link>
          </div>
        </div>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_20px_80px_rgba(0,0,0,0.45)]">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Project Slug" value={project.slug} />
            <StatCard label="Mint Address" value={project.mint} />
            <StatCard
              label="Theme"
              value={`${project.theme_primary || "red"} / ${project.theme_accent || "zinc"}`}
            />
            <StatCard label="Wallet Count" value={wallets.length} />
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Project Details</h2>
            <div className="text-sm text-zinc-400">
              Internal owner metadata
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <StatCard label="Project ID" value={project.id} />
            <StatCard label="Owner ID" value={project.owner_id} />
            <StatCard label="User ID" value={project.user_id} />
            <StatCard
              label="Created At"
              value={
                project.created_at
                  ? new Date(project.created_at).toLocaleString()
                  : "—"
              }
            />
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Project Wallets</h2>
              <p className="mt-2 text-sm text-zinc-400">
                Owner-side wallet inventory and allocation view.
              </p>
            </div>

            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300">
              {walletError
                ? "Loaded from legacy JSON wallet data"
                : "Loaded from normalized wallet rows"}
            </div>
          </div>

          {wallets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-8 text-center text-zinc-400">
              No wallets found for this project yet.
            </div>
          ) : (
            <div className="space-y-5">
              {wallets.map((wallet: any) => (
                <div
                  key={wallet.id}
                  className="rounded-2xl border border-white/10 bg-black/20 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
                >
                  <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr_0.8fr_2fr]">
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">
                        Label
                      </div>
                      <div className="mt-2 text-xl font-semibold text-white">
                        {wallet.label}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">
                        Category
                      </div>
                      <div className="mt-2 text-lg font-medium text-white">
                        {wallet.category}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">
                        Allocation
                      </div>
                      <div className="mt-2 text-lg font-semibold text-white">
                        {wallet.allocation ?? 0}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">
                        Address
                      </div>
                      <div className="mt-2 break-all text-base font-medium text-white">
                        {wallet.address}
                      </div>
                    </div>
                  </div>

                  {wallet.purpose ? (
                    <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">
                        Purpose
                      </div>
                      <div className="mt-2 text-zinc-200">{wallet.purpose}</div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
