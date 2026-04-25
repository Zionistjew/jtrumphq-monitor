"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProjectCreationForm() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
        throw new Error(data?.error || "Failed to create project");
      }

      router.push(`/app/projects/${data.project.id}`);
    } catch (err: any) {
      setError(err?.message || "Project creation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/[0.04] p-8">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">
            WEB3MB
          </p>

          <h1 className="mt-3 text-4xl font-bold">
            Create Your Token Project
          </h1>

          <p className="mt-4 text-zinc-400">
            Launch your public transparency dashboard by submitting your token
            details.
          </p>
        </div>

        {error ? (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm text-zinc-300">
              Project Name
            </label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3"
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
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3"
              placeholder="Example: WMB"
            />
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
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3"
              placeholder="Example: web3mb-token"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-zinc-300">
              Token Mint Address
            </label>
            <input
              name="mint"
              value={formData.mint}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3"
              placeholder="Paste Solana token mint"
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
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3"
              placeholder="Tell investors what your token does..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-cyan-500 py-4 font-semibold text-black hover:bg-cyan-400 disabled:opacity-50"
          >
            {loading ? "Creating Project..." : "Create Project"}
          </button>
        </form>
      </div>
    </main>
  );
}
