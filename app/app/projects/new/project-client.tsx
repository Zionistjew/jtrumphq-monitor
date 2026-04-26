"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Metadata = {
  mint: string;
  name: string;
  symbol: string;
  decimals: number | null;
  supply: string | null;
  slug: string;
  description: string;
  source: string;
};

export default function ProjectCreationForm() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [error, setError] = useState("");
  const [lookupMessage, setLookupMessage] = useState("");
  const [metadata, setMetadata] = useState<Metadata | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    slug: "",
    mint: "",
    description: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  async function lookupMint() {
    setError("");
    setLookupMessage("");
    setMetadata(null);

    const mint = formData.mint.trim();

    if (!mint) {
      setError("Paste a token mint address first.");
      return;
    }

    setLookupLoading(true);

    try {
      const res = await fetch(
        `/api/app/projects?lookup=metadata&mint=${encodeURIComponent(mint)}`
      );

      const data = await res.json();

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || "Failed to lookup token metadata.");
      }

      const meta = data.metadata as Metadata;
      setMetadata(meta);

      setFormData((prev) => ({
        ...prev,
        name: prev.name || meta.name || "",
        symbol: prev.symbol || meta.symbol || "",
        slug: prev.slug || meta.slug || "",
        description: prev.description || meta.description || "",
      }));

      setLookupMessage(
        `Token details loaded from ${meta.source}. Review and create your project.`
      );
    } catch (err: any) {
      setError(err?.message || "Token lookup failed.");
    } finally {
      setLookupLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/app/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          wallets: [],
        }),
      });

      const data = await res.json();

      if (!res.ok || data?.ok === false) {
        if (data?.redirectTo) {
          router.push(data.redirectTo);
          return;
        }

        throw new Error(data?.error || "Failed to create project");
      }

      const slug = data?.project?.slug;

      if (!slug) {
        throw new Error("Project created, but no public slug was returned.");
      }

      router.push(`/token/${slug}`);
    } catch (err: any) {
      setError(err?.message || "Project creation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">
            WEB3MB Auto Onboarding
          </p>

          <h1 className="mt-3 text-4xl font-bold">
            Paste Mint. Generate Trust Dashboard.
          </h1>

          <p className="mt-4 max-w-3xl text-zinc-400">
            Paste your Solana token mint address and WEB3MB will auto-detect
            available token details, prepare your public profile, and generate
            your transparency dashboard.
          </p>
        </div>

        {error ? (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            {error}
          </div>
        ) : null}

        {lookupMessage ? (
          <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-200">
            {lookupMessage}
          </div>
        ) : null}

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-white/10 bg-white/[0.04] p-8"
        >
          <div className="grid gap-6">
            <div>
              <label className="mb-2 block text-sm text-zinc-300">
                Token Mint Address
              </label>

              <div className="flex flex-col gap-3 md:flex-row">
                <input
                  name="mint"
                  value={formData.mint}
                  onChange={handleChange}
                  required
                  className="flex-1 rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-cyan-400"
                  placeholder="Paste Solana token mint address"
                />

                <button
                  type="button"
                  onClick={lookupMint}
                  disabled={lookupLoading}
                  className="rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-black hover:bg-cyan-400 disabled:opacity-50"
                >
                  {lookupLoading ? "Scanning..." : "Auto-Fill"}
                </button>
              </div>
            </div>

            {metadata ? (
              <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-5">
                <div className="text-sm uppercase tracking-[0.25em] text-cyan-300">
                  Detected Token Data
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-4">
                  <div>
                    <div className="text-xs text-zinc-500">Name</div>
                    <div className="font-semibold">{metadata.name || "—"}</div>
                  </div>

                  <div>
                    <div className="text-xs text-zinc-500">Symbol</div>
                    <div className="font-semibold">
                      {metadata.symbol || "—"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-zinc-500">Decimals</div>
                    <div className="font-semibold">
                      {metadata.decimals ?? "—"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-zinc-500">Source</div>
                    <div className="font-semibold">{metadata.source}</div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-zinc-300">
                  Project Name
                </label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-cyan-400"
                  placeholder="Example: WEB3MB Token"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-300">
                  Token Symbol
                </label>
                <input
                  name="symbol"
                  value={formData.symbol}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-cyan-400"
                  placeholder="Example: WMB"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-300">
                Project Slug
              </label>
              <input
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-cyan-400"
                placeholder="Example: web3mb-token"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-300">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-cyan-400"
                placeholder="Tell investors what your token does..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-cyan-500 py-4 font-semibold text-black hover:bg-cyan-400 disabled:opacity-50"
            >
              {loading
                ? "Creating Trust Dashboard..."
                : "Create Trust Dashboard"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
