"use client";

import { useState } from "react";

type WalletInput = {
  label: string;
  category: string;
  address: string;
  purpose: string;
};

export default function CreateProjectPage() {
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [mint, setMint] = useState("");
  const [description, setDescription] = useState("");
  const [wallets, setWallets] = useState<WalletInput[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const addWallet = () => {
    setWallets([
      ...wallets,
      { label: "", category: "", address: "", purpose: "" },
    ]);
  };

  const updateWallet = (index: number, field: string, value: string) => {
    const updated = [...wallets];
    (updated[index] as any)[field] = value;
    setWallets(updated);
  };

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");

  const handleSubmit = async () => {
    setStatus("");

    if (!name || !symbol || !mint) {
      setStatus("Please fill in Name, Symbol, and Mint.");
      return;
    }

    const slug = slugify(name);

    const project = {
      slug,
      name,
      symbol,
      mint,
      description,
      theme: {
        primary: "red",
        accent: "zinc",
      },
      wallets,
    };

    try {
      setLoading(true);

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(project),
      });

      const data = await res.json();

      if (data.ok) {
        setStatus(`Project created successfully: /token/${slug}`);
        setName("");
        setSymbol("");
        setMint("");
        setDescription("");
        setWallets([]);
      } else {
        setStatus(`Create failed: ${data.error || "Unknown error"}`);
      }
    } catch (err: any) {
      setStatus(`Network error: ${err?.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-3xl font-bold">Create Project</h1>

        <div className="grid gap-4">
          <input
            placeholder="Project Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded bg-zinc-900 p-3"
          />

          <input
            placeholder="Symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="rounded bg-zinc-900 p-3"
          />

          <input
            placeholder="Mint Address"
            value={mint}
            onChange={(e) => setMint(e.target.value)}
            className="rounded bg-zinc-900 p-3"
          />

          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded bg-zinc-900 p-3"
          />
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Wallets</h2>

          {wallets.map((wallet, i) => (
            <div key={i} className="grid gap-2 rounded bg-zinc-900 p-4">
              <input
                placeholder="Label"
                value={wallet.label}
                onChange={(e) => updateWallet(i, "label", e.target.value)}
                className="rounded bg-black p-2"
              />

              <input
                placeholder="Category (liquidity, treasury, dev, etc)"
                value={wallet.category}
                onChange={(e) => updateWallet(i, "category", e.target.value)}
                className="rounded bg-black p-2"
              />

              <input
                placeholder="Wallet Address"
                value={wallet.address}
                onChange={(e) => updateWallet(i, "address", e.target.value)}
                className="rounded bg-black p-2"
              />

              <input
                placeholder="Purpose"
                value={wallet.purpose}
                onChange={(e) => updateWallet(i, "purpose", e.target.value)}
                className="rounded bg-black p-2"
              />
            </div>
          ))}

          <button
            onClick={addWallet}
            className="rounded bg-blue-600 px-4 py-2"
          >
            + Add Wallet
          </button>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="rounded bg-green-600 px-6 py-3 text-lg font-semibold disabled:opacity-50"
        >
          {loading ? "Creating..." : "🚀 Create Project"}
        </button>

        {status && (
          <div className="rounded border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">
            {status}
          </div>
        )}
      </div>
    </main>
  );
}
