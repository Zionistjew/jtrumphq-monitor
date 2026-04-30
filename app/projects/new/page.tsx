"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type WalletInput = {
  label: string;
  category: string;
  address: string;
  allocation: string;
  purpose: string;
  verified: boolean;
};

const WALLET_CATEGORIES = [
  "Treasury",
  "Liquidity",
  "Team",
  "Marketing",
  "Development",
  "Community",
  "Burn",
  "Reserve",
  "Other",
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function emptyWallet(): WalletInput {
  return {
    label: "",
    category: "Treasury",
    address: "",
    allocation: "",
    purpose: "",
    verified: false,
  };
}

export default function NewProjectPage() {
  const router = useRouter();

  const [mint, setMint] = useState("");
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [wallets, setWallets] = useState<WalletInput[]>([emptyWallet()]);

  const [loading, setLoading] = useState(false);
  const [autoLoading, setAutoLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const totalAllocation = useMemo(() => {
    return wallets.reduce((sum, wallet) => {
      const n = Number(wallet.allocation);
      return sum + (Number.isFinite(n) ? n : 0);
    }, 0);
  }, [wallets]);

  function updateWallet(index: number, field: keyof WalletInput, value: string | boolean) {
    setWallets((current) =>
      current.map((wallet, i) =>
        i === index ? { ...wallet, [field]: value } : wallet
      )
    );
  }

  function addWallet() {
    setWallets((current) => [...current, emptyWallet()]);
  }

  function removeWallet(index: number) {
    setWallets((current) => {
      if (current.length === 1) return [emptyWallet()];
      return current.filter((_, i) => i !== index);
    });
  }

  async function handleAutoFill() {
    setError("");
    setSuccess("");

    if (!mint.trim()) {
      setError("Paste a token mint address first.");
      return;
    }

    try {
      setAutoLoading(true);

      const cleanMint = mint.trim();

      if (!name.trim()) {
        setName("WEB3MB Token");
      }

      if (!symbol.trim()) {
        setSymbol("WMB");
      }

      if (!slug.trim()) {
        setSlug(slugify(symbol || name || cleanMint.slice(0, 8)));
      }

      if (!description.trim()) {
        setDescription(
          "This public transparency dashboard displays verified project wallets, disclosed allocations, and investor trust signals."
        );
      }

      setSuccess("Auto-fill prepared. Add project wallets below, then create your dashboard.");
    } catch (err: any) {
      setError(err?.message || "Auto-fill failed.");
    } finally {
      setAutoLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const cleanMint = mint.trim();
    const cleanName = name.trim();
    const cleanSymbol = symbol.trim();
    const cleanSlug = slugify(slug || name || symbol);

    if (!cleanMint) return setError("Token mint address is required.");
    if (!cleanName) return setError("Project name is required.");
    if (!cleanSymbol) return setError("Token symbol is required.");
    if (!cleanSlug) return setError("Project slug is required.");

    const cleanedWallets = wallets
      .map((wallet) => ({
        label: wallet.label.trim(),
        category: wallet.category.trim(),
        address: wallet.address.trim(),
        allocation: wallet.allocation ? Number(wallet.allocation) : null,
        purpose: wallet.purpose.trim(),
        verified: wallet.verified,
      }))
      .filter((wallet) => wallet.address || wallet.label || wallet.purpose);

    for (const wallet of cleanedWallets) {
      if (!wallet.label) return setError("Each added wallet needs a label.");
      if (!wallet.address) return setError("Each added wallet needs a wallet address.");
      if (!wallet.category) return setError("Each added wallet needs a category.");
    }

    try {
      setLoading(true);

      const res = await fetch("/api/app/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: cleanName,
          symbol: cleanSymbol,
          slug: cleanSlug,
          mint: cleanMint,
          description: description.trim(),
          theme: {
            primary: "cyan",
            accent: "blue",
          },
          wallets: cleanedWallets,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || data?.message || "Project creation failed.");
      }

      setSuccess("Trust dashboard created successfully.");
      router.push(`/token/${cleanSlug}`);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Something went wrong while creating the project.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 shadow-2xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.35em] text-cyan-400">
            WEB3MB Auto Onboarding
          </p>

          <h1 className="text-3xl font-black tracking-tight">
            Paste Mint. Add Wallets. Generate Trust Dashboard.
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-400">
            Paste your Solana token mint address, enter your project information,
            disclose your project wallets, and WEB3MB will generate a public
            investor transparency dashboard.
          </p>
        </section>

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 shadow-2xl"
        >
          {error ? (
            <div className="mb-5 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="mb-5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-300">
              {success}
            </div>
          ) : null}

          <div>
            <label className="mb-2 block text-xs font-bold text-zinc-200">
              Token Mint Address
            </label>

            <div className="flex gap-3">
              <input
                value={mint}
                onChange={(e) => setMint(e.target.value)}
                placeholder="Paste Solana token mint address"
                className="w-full rounded-lg border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
              />

              <button
                type="button"
                onClick={handleAutoFill}
                disabled={autoLoading}
                className="rounded-lg bg-cyan-400 px-5 py-3 text-sm font-black text-black hover:bg-cyan-300 disabled:opacity-60"
              >
                {autoLoading ? "Loading..." : "Auto-Fill"}
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-bold text-zinc-200">
                Project Name
              </label>
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slug) setSlug(slugify(e.target.value));
                }}
                placeholder="Example: WEB3MB Token"
                className="w-full rounded-lg border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-zinc-200">
                Token Symbol
              </label>
              <input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="Example: WMB"
                className="w-full rounded-lg border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-xs font-bold text-zinc-200">
              Project Slug
            </label>
            <input
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              placeholder="Example: web3mb-token"
              className="w-full rounded-lg border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
            />
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-xs font-bold text-zinc-200">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell investors what your token does..."
              rows={4}
              className="w-full resize-y rounded-lg border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
            />
          </div>

          <section className="mt-8 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-5">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-400">
                  Wallet Disclosure
                </p>
                <h2 className="mt-2 text-xl font-black">
                  Add Project Wallets
                </h2>
                <p className="mt-2 text-sm text-zinc-400">
                  Add treasury, liquidity, team, marketing, development, community,
                  burn, and reserve wallets. These appear on the public dashboard.
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm">
                <span className="text-zinc-400">Total Allocation: </span>
                <span
                  className={
                    totalAllocation > 100
                      ? "font-black text-red-400"
                      : "font-black text-cyan-300"
                  }
                >
                  {totalAllocation}%
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {wallets.map((wallet, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-zinc-800 bg-black/70 p-5"
                >
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <h3 className="font-black text-white">
                      Wallet #{index + 1}
                    </h3>

                    <button
                      type="button"
                      onClick={() => removeWallet(index)}
                      className="rounded-lg border border-red-500/40 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-500/10"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-bold text-zinc-300">
                        Wallet Label
                      </label>
                      <input
                        value={wallet.label}
                        onChange={(e) =>
                          updateWallet(index, "label", e.target.value)
                        }
                        placeholder="Example: Treasury Wallet"
                        className="w-full rounded-lg border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold text-zinc-300">
                        Category
                      </label>
                      <select
                        value={wallet.category}
                        onChange={(e) =>
                          updateWallet(index, "category", e.target.value)
                        }
                        className="w-full rounded-lg border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                      >
                        {WALLET_CATEGORIES.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="mb-2 block text-xs font-bold text-zinc-300">
                      Wallet Address
                    </label>
                    <input
                      value={wallet.address}
                      onChange={(e) =>
                        updateWallet(index, "address", e.target.value)
                      }
                      placeholder="Paste Solana wallet address"
                      className="w-full rounded-lg border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-bold text-zinc-300">
                        Allocation %
                      </label>
                      <input
                        value={wallet.allocation}
                        onChange={(e) =>
                          updateWallet(index, "allocation", e.target.value)
                        }
                        placeholder="Example: 20"
                        inputMode="decimal"
                        className="w-full rounded-lg border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                      />
                    </div>

                    <label className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300">
                      <input
                        type="checkbox"
                        checked={wallet.verified}
                        onChange={(e) =>
                          updateWallet(index, "verified", e.target.checked)
                        }
                        className="h-4 w-4"
                      />
                      Mark as verified disclosed wallet
                    </label>
                  </div>

                  <div className="mt-4">
                    <label className="mb-2 block text-xs font-bold text-zinc-300">
                      Purpose
                    </label>
                    <textarea
                      value={wallet.purpose}
                      onChange={(e) =>
                        updateWallet(index, "purpose", e.target.value)
                      }
                      placeholder="Example: Used for project treasury, operations, investor protection, or liquidity support."
                      rows={3}
                      className="w-full resize-y rounded-lg border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addWallet}
              className="mt-5 w-full rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-300 hover:bg-cyan-400/20"
            >
              + Add Another Wallet
            </button>
          </section>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-cyan-400 px-5 py-4 text-sm font-black text-black hover:bg-cyan-300 disabled:opacity-60"
          >
            {loading ? "Creating Trust Dashboard..." : "Create Trust Dashboard"}
          </button>
        </form>
      </div>
    </main>
  );
}
