"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type WalletInput = {
  label: string;
  category: string;
  address: string;
  purpose: string;
  allocation: string;
};

export default function NewProjectPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    slug: "",
    name: "",
    symbol: "",
    mint: "",
    description: "",
    theme_primary: "red",
    theme_accent: "zinc",
  });

  const [wallets, setWallets] = useState<WalletInput[]>([
    {
      label: "",
      category: "treasury",
      address: "",
      purpose: "",
      allocation: "",
    },
  ]);

  function updateWallet(
    index: number,
    key: keyof WalletInput,
    value: string
  ) {
    const next = [...wallets];
    next[index][key] = value;
    setWallets(next);
  }

  function addWallet() {
    setWallets([
      ...wallets,
      {
        label: "",
        category: "treasury",
        address: "",
        purpose: "",
        allocation: "",
      },
    ]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/app/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...form,
        wallets,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to create project");
      setLoading(false);
      return;
    }

    router.push("/app");
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-2xl font-bold text-white">Create Project</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <input
          className="w-full rounded border p-3 text-black"
          placeholder="Slug"
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
          required
        />

        <input
          className="w-full rounded border p-3 text-black"
          placeholder="Project Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />

        <input
          className="w-full rounded border p-3 text-black"
          placeholder="Symbol"
          value={form.symbol}
          onChange={(e) => setForm({ ...form, symbol: e.target.value })}
          required
        />

        <input
          className="w-full rounded border p-3 text-black"
          placeholder="Mint Address"
          value={form.mint}
          onChange={(e) => setForm({ ...form, mint: e.target.value })}
          required
        />

        <textarea
          className="w-full rounded border p-3 text-black"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={4}
        />

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Wallets</h2>

          {wallets.map((wallet, i) => (
            <div key={i} className="rounded border p-4 space-y-3">
              <input
                className="w-full rounded border p-3 text-black"
                placeholder="Wallet Label"
                value={wallet.label}
                onChange={(e) => updateWallet(i, "label", e.target.value)}
                required
              />

              <input
                className="w-full rounded border p-3 text-black"
                placeholder="Category"
                value={wallet.category}
                onChange={(e) => updateWallet(i, "category", e.target.value)}
                required
              />

              <input
                className="w-full rounded border p-3 text-black"
                placeholder="Wallet Address"
                value={wallet.address}
                onChange={(e) => updateWallet(i, "address", e.target.value)}
                required
              />

              <input
                className="w-full rounded border p-3 text-black"
                placeholder="Purpose"
                value={wallet.purpose}
                onChange={(e) => updateWallet(i, "purpose", e.target.value)}
              />

              <input
                className="w-full rounded border p-3 text-black"
                placeholder="Allocation"
                value={wallet.allocation}
                onChange={(e) => updateWallet(i, "allocation", e.target.value)}
              />
            </div>
          ))}

          <button
            type="button"
            className="rounded border px-4 py-2 text-white"
            onClick={addWallet}
          >
            Add Wallet
          </button>
        </section>

        {error ? <p className="text-red-400">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="rounded bg-white px-6 py-3 font-semibold text-black"
        >
          {loading ? "Creating..." : "Create Project"}
        </button>
      </form>
    </main>
  );
}
