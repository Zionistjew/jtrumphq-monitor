"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type WalletInput = {
  label: string;
  category: string;
  address: string;
  purpose: string;
};

type ThemeInput = {
  primary: string;
  accent: string;
};

export default function CreateProjectPage() {
  const router = useRouter();

  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [mint, setMint] = useState("");
  const [description, setDescription] = useState("");
  const [theme, setTheme] = useState<ThemeInput>({
    primary: "red",
    accent: "zinc",
  });

  const [wallets, setWallets] = useState<WalletInput[]>([
    {
      label: "",
      category: "treasury",
      address: "",
      purpose: "",
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const normalizedSlug = useMemo(() => {
    return slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }, [slug]);

  function updateWallet(index: number, field: keyof WalletInput, value: string) {
    setWallets((prev) =>
      prev.map((wallet, i) =>
        i === index ? { ...wallet, [field]: value } : wallet
      )
    );
  }

  function addWallet() {
    setWallets((prev) => [
      ...prev,
      {
        label: "",
        category: "treasury",
        address: "",
        purpose: "",
      },
    ]);
  }

  function removeWallet(index: number) {
    setWallets((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (!normalizedSlug || !name.trim() || !mint.trim()) {
        throw new Error("Slug, name, and mint are required.");
      }

      const existingRes = await fetch("/api/projects", {
        cache: "no-store",
      });

      const existingJson = await existingRes.json();

      if (!existingRes.ok) {
        throw new Error(existingJson.error || "Failed to check existing projects.");
      }

      const existingProjects = Array.isArray(existingJson.projects)
        ? existingJson.projects
        : [];

      const duplicate = existingProjects.find(
        (project: any) => project.slug?.toLowerCase() === normalizedSlug
      );

      if (duplicate) {
        throw new Error(`Slug "${normalizedSlug}" already exists. Use a different slug.`);
      }

      const cleanWallets = wallets
        .map((wallet) => ({
          label: wallet.label.trim(),
          category: wallet.category.trim(),
          address: wallet.address.trim(),
          purpose: wallet.purpose.trim(),
        }))
        .filter(
          (wallet) =>
            wallet.label || wallet.category || wallet.address || wallet.purpose
        );

      const payload = {
        slug: normalizedSlug,
        name: name.trim(),
        symbol: symbol.trim(),
        mint: mint.trim(),
        description: description.trim(),
        theme,
        wallets: cleanWallets,
      };

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Failed to create project.");
      }

      setSuccessMessage(`Project "${payload.name}" created successfully. Redirecting...`);

      setTimeout(() => {
        router.push(`/token/${payload.slug}`);
      }, 900);
    } catch (error: any) {
      setErrorMessage(error?.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="inline-block rounded-full border border-red-700 px-4 py-1 text-xs uppercase tracking-[0.3em] text-red-300">
            Admin
          </p>
          <h1 className="mt-4 text-4xl font-bold">Create Project</h1>
          <p className="mt-2 text-neutral-400">
            Add a new token transparency dashboard project.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-3xl border border-neutral-800 bg-neutral-950 p-6"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-neutral-300">
                Project Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 outline-none focus:border-red-700"
                placeholder="Test Alpha 4"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-neutral-300">
                Symbol
              </label>
              <input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 outline-none focus:border-red-700"
                placeholder="TA4"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-neutral-300">
                Slug
              </label>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 outline-none focus:border-red-700"
                placeholder="test-alpha-4"
              />
              <p className="mt-2 text-xs text-neutral-500">
                Normalized slug:{" "}
                <span className="text-neutral-300">{normalizedSlug || "—"}</span>
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm text-neutral-300">
                Mint
              </label>
              <input
                value={mint}
                onChange={(e) => setMint(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 outline-none focus:border-red-700"
                placeholder="Token mint address"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-neutral-300">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[110px] w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 outline-none focus:border-red-700"
              placeholder="Describe the project..."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-neutral-300">
                Theme Primary
              </label>
              <input
                value={theme.primary}
                onChange={(e) =>
                  setTheme((prev) => ({ ...prev, primary: e.target.value }))
                }
                className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 outline-none focus:border-red-700"
                placeholder="red"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-neutral-300">
                Theme Accent
              </label>
              <input
                value={theme.accent}
                onChange={(e) =>
                  setTheme((prev) => ({ ...prev, accent: e.target.value }))
                }
                className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 outline-none focus:border-red-700"
                placeholder="zinc"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-800 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Wallets</h2>
              <button
                type="button"
                onClick={addWallet}
                className="rounded-xl border border-neutral-700 px-4 py-2 text-sm hover:border-red-700"
              >
                Add Wallet
              </button>
            </div>

            <div className="space-y-4">
              {wallets.map((wallet, index) => (
                <div
                  key={index}
                  className="grid gap-3 rounded-2xl border border-neutral-800 bg-black p-4 md:grid-cols-2"
                >
                  <input
                    value={wallet.label}
                    onChange={(e) => updateWallet(index, "label", e.target.value)}
                    className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 outline-none focus:border-red-700"
                    placeholder="Wallet label"
                  />
                  <input
                    value={wallet.category}
                    onChange={(e) =>
                      updateWallet(index, "category", e.target.value)
                    }
                    className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 outline-none focus:border-red-700"
                    placeholder="treasury"
                  />
                  <input
                    value={wallet.address}
                    onChange={(e) =>
                      updateWallet(index, "address", e.target.value)
                    }
                    className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 outline-none focus:border-red-700 md:col-span-2"
                    placeholder="Wallet address"
                  />
                  <input
                    value={wallet.purpose}
                    onChange={(e) =>
                      updateWallet(index, "purpose", e.target.value)
                    }
                    className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 outline-none focus:border-red-700 md:col-span-2"
                    placeholder="Purpose"
                  />

                  {wallets.length > 1 && (
                    <div className="md:col-span-2">
                      <button
                        type="button"
                        onClick={() => removeWallet(index)}
                        className="rounded-xl border border-red-900 px-4 py-2 text-sm text-red-300 hover:bg-red-950"
                      >
                        Remove Wallet
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {successMessage && (
            <div className="rounded-2xl border border-emerald-800 bg-emerald-950/40 px-4 py-3 text-emerald-300">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="rounded-2xl border border-red-800 bg-red-950/40 px-4 py-3 text-red-300">
              {errorMessage}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-2xl bg-red-700 px-6 py-3 font-medium text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Creating..." : "Create Project"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-2xl border border-neutral-700 px-6 py-3 text-neutral-200 hover:border-neutral-500"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
