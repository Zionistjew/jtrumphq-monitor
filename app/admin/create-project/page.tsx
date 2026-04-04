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
    text.toLowerCase().replace(/\s+/g, "-");

  const generateConfig = () => {
    const slug = slugify(name);

    const config = {
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

    return JSON.stringify(config, null, 2);
  };

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Create Project</h1>

        <div className="grid gap-4">
          <input
            placeholder="Project Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-zinc-900 p-3 rounded"
          />

          <input
            placeholder="Symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="bg-zinc-900 p-3 rounded"
          />

          <input
            placeholder="Mint Address"
            value={mint}
            onChange={(e) => setMint(e.target.value)}
            className="bg-zinc-900 p-3 rounded"
          />

          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-zinc-900 p-3 rounded"
          />
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Wallets</h2>

          {wallets.map((wallet, i) => (
            <div key={i} className="grid gap-2 bg-zinc-900 p-4 rounded">
              <input
                placeholder="Label"
                value={wallet.label}
                onChange={(e) =>
                  updateWallet(i, "label", e.target.value)
                }
                className="p-2 bg-black rounded"
              />

              <input
                placeholder="Category (liquidity, treasury, dev, etc)"
                value={wallet.category}
                onChange={(e) =>
                  updateWallet(i, "category", e.target.value)
                }
                className="p-2 bg-black rounded"
              />

              <input
                placeholder="Wallet Address"
                value={wallet.address}
                onChange={(e) =>
                  updateWallet(i, "address", e.target.value)
                }
                className="p-2 bg-black rounded"
              />

              <input
                placeholder="Purpose"
                value={wallet.purpose}
                onChange={(e) =>
                  updateWallet(i, "purpose", e.target.value)
                }
                className="p-2 bg-black rounded"
              />
            </div>
          ))}

          <button
            onClick={addWallet}
            className="bg-blue-600 px-4 py-2 rounded"
          >
            + Add Wallet
          </button>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Generated Config</h2>

          <textarea
            value={generateConfig()}
            readOnly
            className="w-full h-64 bg-zinc-900 p-3 rounded font-mono text-sm"
          />
        </div>
      </div>
    </main>
  );
}
