"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type WalletForm = {
  label: string;
  category: string;
  address: string;
  purpose: string;
  allocation: string;
};

const emptyWallet = (): WalletForm => ({
  label: "",
  category: "treasury",
  address: "",
  purpose: "",
  allocation: "",
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function CreateProjectPage() {
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [slug, setSlug] = useState("");
  const [mint, setMint] = useState("");
  const [description, setDescription] = useState("");
  const [primaryColor, setPrimaryColor] = useState("cyan");
  const [accentColor, setAccentColor] = useState("zinc");
  const [wallets, setWallets] = useState<WalletForm[]>([emptyWallet()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createdSlug, setCreatedSlug] = useState("");

  const suggestedSlug = useMemo(() => slugify(name), [name]);

  function updateWallet(index: number, field: keyof WalletForm, value: string) {
    setWallets((prev) =>
      prev.map((wallet, i) =>
        i === index ? { ...wallet, [field]: value } : wallet
      )
    );
  }

  function addWallet() {
    setWallets((prev) => [...prev, emptyWallet()]);
  }

  function removeWallet(index: number) {
    setWallets((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    setCreatedSlug("");

    const finalSlug = slugify(slug || suggestedSlug);

    const cleanedWallets = wallets
      .map((wallet) => ({
        label: wallet.label.trim(),
        category: wallet.category.trim(),
        address: wallet.address.trim(),
        purpose: wallet.purpose.trim(),
        allocation: Number(wallet.allocation || 0),
      }))
      .filter((wallet) => wallet.label && wallet.address);

    if (!name.trim()) {
      setLoading(false);
      setError("Project name is required.");
      return;
    }

    if (!symbol.trim()) {
      setLoading(false);
      setError("Project symbol is required.");
      return;
    }

    if (!finalSlug) {
      setLoading(false);
      setError("Project slug is required.");
      return;
    }

    if (!mint.trim()) {
      setLoading(false);
      setError("Mint address is required.");
      return;
    }

    if (cleanedWallets.length === 0) {
      setLoading(false);
      setError("Add at least one wallet before creating the project.");
      return;
    }

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug: finalSlug,
          name: name.trim(),
          symbol: symbol.trim().toUpperCase(),
          mint: mint.trim(),
          description: description.trim(),
          theme: {
            primary: primaryColor,
            accent: accentColor,
          },
          wallets: cleanedWallets,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Failed to create project.");
      }

      setCreatedSlug(finalSlug);
      setSuccess("Project created successfully.");
      setName("");
      setSymbol("");
      setSlug("");
      setMint("");
      setDescription("");
      setPrimaryColor("cyan");
      setAccentColor("zinc");
      setWallets([emptyWallet()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-10">
          <div className="inline-flex rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300">
            Admin Project Setup
          </div>

          <h1 className="mt-5 text-4xl font-bold">Create Project</h1>
          <p className="mt-3 max-w-3xl text-zinc-400">
            Set up a new transparency project, assign its wallets, define intended
            allocations, and publish it into the WEB3MB public directory.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-8">
            <h2 className="text-2xl font-semibold">Project Details</h2>

            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Project Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="WEB3MB Demo Token"
                  className="w-full rounded-xl border border-zinc-700 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Symbol
                </label>
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  placeholder="WDT"
                  className="w-full rounded-xl border border-zinc-700 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Slug
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                  placeholder={suggestedSlug || "web3mb-demo-token"}
                  className="w-full rounded-xl border border-zinc-700 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
                />
                <p className="mt-2 text-xs text-zinc-500">
                  Public URL preview: /token/{slug || suggestedSlug || "your-project-slug"}
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Mint Address
                </label>
                <input
                  type="text"
                  value={mint}
                  onChange={(e) => setMint(e.target.value)}
                  placeholder="Enter Solana mint address"
                  className="w-full rounded-xl border border-zinc-700 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe the project, its purpose, and what users should know."
                className="w-full rounded-xl border border-zinc-700 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
              />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Primary Theme Color
                </label>
                <select
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
                >
                  <option value="cyan">cyan</option>
                  <option value="blue">blue</option>
                  <option value="emerald">emerald</option>
                  <option value="purple">purple</option>
                  <option value="red">red</option>
                  <option value="amber">amber</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Accent Color
                </label>
                <select
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
                >
                  <option value="zinc">zinc</option>
                  <option value="slate">slate</option>
                  <option value="gray">gray</option>
                  <option value="neutral">neutral</option>
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Wallets</h2>
                <p className="mt-2 text-zinc-400">
                  Add treasury, liquidity, development, community, or other
                  public wallets tied to this project. Allocation is the intended
                  number of project tokens for that wallet.
                </p>
              </div>

              <button
                type="button"
                onClick={addWallet}
                className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-3 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20"
              >
                Add Wallet
              </button>
            </div>

            <div className="mt-8 space-y-6">
              {wallets.map((wallet, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-zinc-800 bg-black/30 p-6"
                >
                  <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Wallet #{index + 1}</h3>

                    {wallets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeWallet(index)}
                        className="text-sm font-medium text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-zinc-300">
                        Wallet Label
                      </label>
                      <input
                        type="text"
                        value={wallet.label}
                        onChange={(e) =>
                          updateWallet(index, "label", e.target.value)
                        }
                        placeholder="Treasury Wallet"
                        className="w-full rounded-xl border border-zinc-700 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-zinc-300">
                        Category
                      </label>
                      <select
                        value={wallet.category}
                        onChange={(e) =>
                          updateWallet(index, "category", e.target.value)
                        }
                        className="w-full rounded-xl border border-zinc-700 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
                      >
                        <option value="treasury">treasury</option>
                        <option value="liquidity">liquidity</option>
                        <option value="development">development</option>
                        <option value="community">community</option>
                        <option value="marketing">marketing</option>
                        <option value="reserve">reserve</option>
                        <option value="team">team</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-zinc-300">
                        Wallet Address
                      </label>
                      <input
                        type="text"
                        value={wallet.address}
                        onChange={(e) =>
                          updateWallet(index, "address", e.target.value)
                        }
                        placeholder="Enter wallet address"
                        className="w-full rounded-xl border border-zinc-700 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-zinc-300">
                        Intended Allocation
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={wallet.allocation}
                        onChange={(e) =>
                          updateWallet(index, "allocation", e.target.value)
                        }
                        placeholder="200000000"
                        className="w-full rounded-xl border border-zinc-700 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-zinc-300">
                        Purpose
                      </label>
                      <input
                        type="text"
                        value={wallet.purpose}
                        onChange={(e) =>
                          updateWallet(index, "purpose", e.target.value)
                        }
                        placeholder="Describe what this wallet is used for"
                        className="w-full rounded-xl border border-zinc-700 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-300">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-300">
              <div>{success}</div>
              {createdSlug && (
                <div className="mt-3 flex flex-wrap gap-4">
                  <Link
                    href={`/token/${createdSlug}`}
                    className="font-medium text-cyan-300 hover:text-cyan-200"
                  >
                    View public dashboard
                  </Link>
                  <Link
                    href="/transparency"
                    className="font-medium text-cyan-300 hover:text-cyan-200"
                  >
                    Open transparency directory
                  </Link>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-4">
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-black transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating Project..." : "Create Project"}
            </button>

            <Link
              href="/dashboard"
              className="rounded-xl border border-zinc-700 px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              Back to Dashboard
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
