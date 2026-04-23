"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type WalletForm = {
  label: string;
  category: string;
  allocation: string;
  address: string;
  purpose: string;
};

type ProjectForm = {
  slug: string;
  name: string;
  symbol: string;
  mint: string;
  primaryTheme: string;
  accentTheme: string;
  description: string;
  wallets: WalletForm[];
};

const emptyWallet = (): WalletForm => ({
  label: "",
  category: "",
  allocation: "",
  address: "",
  purpose: "",
});

const emptyForm = (): ProjectForm => ({
  slug: "",
  name: "",
  symbol: "",
  mint: "",
  primaryTheme: "",
  accentTheme: "",
  description: "",
  wallets: [emptyWallet()],
});

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function NewProjectPage() {
  const [form, setForm] = useState<ProjectForm>(emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const canSubmit = useMemo(() => {
    return (
      form.slug.trim().length > 0 &&
      form.name.trim().length > 0 &&
      form.symbol.trim().length > 0 &&
      form.mint.trim().length > 0
    );
  }, [form]);

  function updateField<K extends keyof ProjectForm>(
    key: K,
    value: ProjectForm[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateWalletField(
    index: number,
    key: keyof WalletForm,
    value: string
  ) {
    setForm((prev) => ({
      ...prev,
      wallets: prev.wallets.map((wallet, i) =>
        i === index ? { ...wallet, [key]: value } : wallet
      ),
    }));
  }

  function addWallet() {
    setForm((prev) => ({
      ...prev,
      wallets: [...prev.wallets, emptyWallet()],
    }));
  }

  function removeWallet(index: number) {
    setForm((prev) => {
      if (prev.wallets.length === 1) {
        return {
          ...prev,
          wallets: [emptyWallet()],
        };
      }

      return {
        ...prev,
        wallets: prev.wallets.filter((_, i) => i !== index),
      };
    });
  }

  function resetForm() {
    setForm(emptyForm());
    setError("");
    setSuccess("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const cleanedWallets = form.wallets
        .map((wallet) => ({
          label: wallet.label.trim(),
          category: wallet.category.trim(),
          address: wallet.address.trim(),
          purpose: wallet.purpose.trim(),
          allocation: wallet.allocation.trim()
            ? Number(wallet.allocation.trim())
            : 0,
        }))
        .filter(
          (wallet) =>
            wallet.label ||
            wallet.category ||
            wallet.address ||
            wallet.purpose ||
            wallet.allocation
        );

      const payload = {
        slug: form.slug.trim(),
        name: form.name.trim(),
        symbol: form.symbol.trim(),
        mint: form.mint.trim(),
        description: form.description.trim(),
        theme: {
          primary: form.primaryTheme.trim() || "cyan",
          accent: form.accentTheme.trim() || "zinc",
        },
        wallets: cleanedWallets,
      };

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || `Request failed with status ${res.status}`);
      }

      setSuccess("Project created successfully.");
      setForm(emptyForm());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#030b24] text-white">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="mb-2 text-xs uppercase tracking-[0.22em] text-cyan-300">
              WEB3MB / Project Creation Studio
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-white">
              Create New Project
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-300">
              Launch a new WEB3MB transparency project with wallet disclosures,
              token metadata, and a public dashboard ready for investors and
              community members.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/app/projects"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Back to Projects
            </Link>
            <Link
              href="/app/dashboard"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Dashboard Home
            </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-white">Project Information</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Set the identity, slug, mint, and visual theme for this transparency
              dashboard.
            </p>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-cyan-300">
                  Project Slug
                </label>
                <input
                  value={form.slug}
                  onChange={(e) => updateField("slug", e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#09101f] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-cyan-300">
                  Project Name
                </label>
                <input
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#09101f] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-cyan-300">
                  Project Symbol
                </label>
                <input
                  value={form.symbol}
                  onChange={(e) => updateField("symbol", e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#09101f] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-cyan-300">
                  Mint Address
                </label>
                <input
                  value={form.mint}
                  onChange={(e) => updateField("mint", e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#09101f] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-cyan-300">
                  Primary Theme
                </label>
                <input
                  value={form.primaryTheme}
                  onChange={(e) => updateField("primaryTheme", e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#09101f] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-cyan-300">
                  Accent Theme
                </label>
                <input
                  value={form.accentTheme}
                  onChange={(e) => updateField("accentTheme", e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#09101f] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-cyan-300">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                rows={5}
                className="w-full rounded-xl border border-white/10 bg-[#09101f] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-white">Disclosed Wallets</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Add every wallet you want disclosed on the public dashboard and
              owner console.
            </p>

            <div className="mt-6 space-y-5">
              {form.wallets.map((wallet, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-white/10 bg-[#0a1020] p-5"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-cyan-300">
                        Wallet {index + 1}
                      </div>
                      <div className="mt-1 text-sm font-medium text-white">
                        Disclosure Wallet {index + 1}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeWallet(index)}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid gap-5 md:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-cyan-300">
                        Wallet Label
                      </label>
                      <input
                        value={wallet.label}
                        onChange={(e) =>
                          updateWalletField(index, "label", e.target.value)
                        }
                        className="w-full rounded-xl border border-white/10 bg-[#09101f] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-cyan-300">
                        Category
                      </label>
                      <input
                        value={wallet.category}
                        onChange={(e) =>
                          updateWalletField(index, "category", e.target.value)
                        }
                        className="w-full rounded-xl border border-white/10 bg-[#09101f] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-cyan-300">
                        Allocation
                      </label>
                      <input
                        value={wallet.allocation}
                        onChange={(e) =>
                          updateWalletField(index, "allocation", e.target.value)
                        }
                        className="w-full rounded-xl border border-white/10 bg-[#09101f] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  <div className="mt-5">
                    <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-cyan-300">
                      Wallet Address
                    </label>
                    <input
                      value={wallet.address}
                      onChange={(e) =>
                        updateWalletField(index, "address", e.target.value)
                      }
                      className="w-full rounded-xl border border-white/10 bg-[#09101f] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                    />
                  </div>

                  <div className="mt-5">
                    <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-cyan-300">
                      Purpose
                    </label>
                    <input
                      value={wallet.purpose}
                      onChange={(e) =>
                        updateWalletField(index, "purpose", e.target.value)
                      }
                      className="w-full rounded-xl border border-white/10 bg-[#09101f] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addWallet}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Add Wallet
              </button>
            </div>
          </div>

          {(error || success) && (
            <div
              className={cn(
                "rounded-2xl border px-4 py-3 text-sm",
                error
                  ? "border-red-500/30 bg-red-500/10 text-red-200"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              )}
            >
              {error || success}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className={cn(
                "rounded-xl px-4 py-3 text-sm font-semibold transition",
                !canSubmit || submitting
                  ? "cursor-not-allowed bg-white/20 text-zinc-400"
                  : "bg-white text-black hover:opacity-90"
              )}
            >
              {submitting ? "Creating..." : "Create Project"}
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Clear Form
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
