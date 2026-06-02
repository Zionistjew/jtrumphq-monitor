"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type WalletEntry = {
  label: string;
  category: string;
  address: string;
  purpose: string;
  allocation: string;
};

type ProjectForm = {
  name: string;
  symbol: string;
  slug: string;
  mint: string;
  description: string;
};

const walletTemplates: WalletEntry[] = [
  {
    label: "Treasury",
    category: "Treasury",
    address: "",
    purpose: "Treasury operations and reserves",
    allocation: "20",
  },
  {
    label: "Liquidity",
    category: "Liquidity",
    address: "",
    purpose: "Liquidity pool and market support",
    allocation: "15",
  },
  {
    label: "Community",
    category: "Community",
    address: "",
    purpose: "Community growth, rewards, and ecosystem support",
    allocation: "15",
  },
];

const categories = [
  "Treasury",
  "Liquidity",
  "Marketing",
  "Community",
  "Team",
  "Development",
  "Reserve",
  "Burn",
  "Other",
];

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isLikelySolanaAddress(value: string) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value.trim());
}

function cleanNumber(value: string) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function shortAddress(value: string) {
  const clean = value.trim();
  if (!clean) return "No address added";
  if (clean.length <= 14) return clean;
  return `${clean.slice(0, 6)}...${clean.slice(-6)}`;
}

export default function ProjectClient() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [checkingPlan, setCheckingPlan] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState<ProjectForm>({
    name: "",
    symbol: "",
    slug: "",
    mint: "",
    description: "",
  });

  const [wallets, setWallets] = useState<WalletEntry[]>(walletTemplates);

  useEffect(() => {
    let mounted = true;

    async function checkSubscription() {
      try {
        const res = await fetch("/api/app/subscription", {
          credentials: "include",
          cache: "no-store",
        });

        const data = await res.json().catch(() => null);

        if (!mounted) return;

        if (!res.ok || !data?.ok) {
          router.replace("/app/billing?reason=subscription-required");
          return;
        }

        const hasActivePlan = data?.subscription?.status === "active";
        const limitReached = data?.usage?.upgrade_required === true;

        if (!hasActivePlan) {
          router.replace("/app/billing?reason=subscription-required");
          return;
        }

        if (limitReached) {
          router.replace("/app/billing?reason=project-limit");
          return;
        }

        setCheckingPlan(false);
      } catch {
        router.replace("/app/billing?reason=subscription-check-failed");
      }
    }

    checkSubscription();

    return () => {
      mounted = false;
    };
  }, [router]);

  const totalAllocation = useMemo(() => {
    return wallets.reduce((sum, wallet) => {
      return sum + cleanNumber(wallet.allocation);
    }, 0);
  }, [wallets]);

  const validWallets = useMemo(() => {
    return wallets.filter((w) => isLikelySolanaAddress(w.address));
  }, [wallets]);

  const duplicateAddresses = useMemo(() => {
    const seen = new Set<string>();
    const duplicates = new Set<string>();

    wallets.forEach((wallet) => {
      const address = wallet.address.trim();
      if (!address) return;

      if (seen.has(address)) {
        duplicates.add(address);
      }

      seen.add(address);
    });

    return duplicates;
  }, [wallets]);

  const readinessScore = useMemo(() => {
    let score = 0;

    if (form.name.trim()) score += 15;
    if (form.symbol.trim()) score += 15;
    if (form.slug.trim()) score += 10;
    if (isLikelySolanaAddress(form.mint)) score += 20;
    if (validWallets.length > 0) score += 20;
    if (validWallets.length >= 2) score += 10;
    if (totalAllocation > 0 && totalAllocation <= 100) score += 10;

    if (duplicateAddresses.size > 0) score -= 15;
    if (totalAllocation > 100) score -= 15;

    return Math.max(0, Math.min(100, score));
  }, [form, validWallets.length, totalAllocation, duplicateAddresses.size]);

  function updateForm(key: keyof ProjectForm, value: string) {
    setForm((prev) => {
      if (key === "name" && !prev.slug) {
        return { ...prev, name: value, slug: normalizeSlug(value) };
      }

      if (key === "slug") {
        return { ...prev, slug: normalizeSlug(value) };
      }

      return { ...prev, [key]: value };
    });
  }

  function updateWallet(index: number, key: keyof WalletEntry, value: string) {
    setWallets((prev) =>
      prev.map((wallet, i) =>
        i === index ? { ...wallet, [key]: value } : wallet
      )
    );
  }

  function addWallet() {
    setWallets((prev) => [
      ...prev,
      {
        label: "",
        category: "Treasury",
        address: "",
        purpose: "",
        allocation: "",
      },
    ]);
  }

  function removeWallet(index: number) {
    setWallets((prev) => prev.filter((_, i) => i !== index));
  }

  function canContinue() {
    if (step === 1) {
      return Boolean(
        form.name.trim() &&
          form.symbol.trim() &&
          form.slug.trim() &&
          isLikelySolanaAddress(form.mint)
      );
    }

    if (step === 2) {
      return (
        validWallets.length > 0 &&
        duplicateAddresses.size === 0 &&
        totalAllocation > 0 &&
        totalAllocation <= 100
      );
    }

    return true;
  }

  function goNext() {
    setError("");

    if (!canContinue()) {
      if (step === 1) {
        setError(
          "Please complete the project name, symbol, slug, and a valid Solana mint address."
        );
      }

      if (step === 2) {
        setError(
          "Please add at least one valid wallet, remove duplicate addresses, and keep total allocation between 1% and 100%."
        );
      }

      return;
    }

    setStep((s) => Math.min(4, s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    setError("");
    setStep((s) => Math.max(1, s - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submitProject() {
    setError("");
    setSubmitting(true);

    try {
      const subscriptionRes = await fetch("/api/app/subscription", {
        credentials: "include",
        cache: "no-store",
      });

      const subscriptionData = await subscriptionRes.json().catch(() => null);

      if (
        !subscriptionRes.ok ||
        !subscriptionData?.ok ||
        subscriptionData?.subscription?.status !== "active"
      ) {
        router.replace("/app/billing?reason=subscription-required");
        return;
      }

      if (subscriptionData?.usage?.upgrade_required === true) {
        router.replace("/app/billing?reason=project-limit");
        return;
      }

      const payload = {
        name: form.name.trim(),
        symbol: form.symbol.trim().toUpperCase(),
        slug: normalizeSlug(form.slug),
        mint: form.mint.trim(),
        description: form.description.trim(),
        theme: {
          primary: "cyan",
          accent: "violet",
        },
        wallets: wallets
          .filter((wallet) => wallet.address.trim())
          .map((wallet) => ({
            label: wallet.label.trim() || wallet.category,
            category: wallet.category.trim() || "Treasury",
            address: wallet.address.trim(),
            purpose: wallet.purpose.trim(),
            allocation: cleanNumber(wallet.allocation),
          })),
      };

      const res = await fetch("/api/app/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (
          data?.code === "PROJECT_LIMIT_REACHED" ||
          data?.error?.toLowerCase?.().includes("limit")
        ) {
          router.replace("/app/billing?reason=project-limit");
          return;
        }

        throw new Error(
          data?.error || data?.message || "Project creation failed."
        );
      }

      router.push(`/token/${payload.slug}`);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Something went wrong creating this project.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "mt-2 w-full rounded-2xl border border-zinc-800 bg-black px-4 py-4 text-base text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10";

  const panelClass =
    "rounded-3xl border border-zinc-800 bg-zinc-950/80 p-5 shadow-xl shadow-black/30 sm:p-8";

  if (checkingPlan) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="rounded-3xl border border-cyan-400/20 bg-zinc-950 p-8 text-center shadow-2xl shadow-cyan-500/10">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
          <h1 className="mt-6 text-2xl font-black">Checking Subscription</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            WEB3MB is verifying your plan before opening project onboarding.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-6xl px-4 pb-32 pt-6 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-3xl border border-cyan-400/20 bg-zinc-950/80 p-5 shadow-2xl shadow-cyan-500/10 sm:mb-8 sm:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300 sm:text-sm sm:tracking-[0.3em]">
                WEB3MB Onboarding
              </p>

              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                Create Your Transparency Project
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
                Add your token, disclose key wallets, and publish a live public
                trust dashboard for investors and your community.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-sm text-zinc-300">
                Step <span className="font-bold text-white">{step}</span> of{" "}
                <span className="font-bold text-white">4</span>
              </div>

              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
                Readiness:{" "}
                <span className="font-black text-cyan-300">
                  {readinessScore}%
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-4 gap-2">
            {["Project", "Wallets", "Review", "Publish"].map((item, index) => {
              const active = step >= index + 1;

              return (
                <div key={item} className="min-w-0">
                  <div
                    className={`h-2 rounded-full transition ${
                      active ? "bg-cyan-400" : "bg-zinc-800"
                    }`}
                  />
                  <p
                    className={`mt-2 hidden truncate text-xs sm:block ${
                      active ? "text-cyan-300" : "text-zinc-500"
                    }`}
                  >
                    {item}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-sm leading-6 text-red-200">
            {error}
          </div>
        ) : null}

        {step === 1 ? (
          <section className={panelClass}>
            <h2 className="text-2xl font-bold">Project Information</h2>

            <p className="mt-2 text-sm leading-6 text-zinc-400">
              This information powers your public WEB3MB transparency page.
            </p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="block min-w-0">
                <span className="text-sm font-medium text-zinc-300">
                  Project Name
                </span>
                <input
                  value={form.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                  placeholder="Example: JTRUMP"
                  className={inputClass}
                />
              </label>

              <label className="block min-w-0">
                <span className="text-sm font-medium text-zinc-300">
                  Symbol
                </span>
                <input
                  value={form.symbol}
                  onChange={(e) =>
                    updateForm("symbol", e.target.value.toUpperCase())
                  }
                  placeholder="JTRUMP"
                  className={inputClass}
                />
              </label>

              <label className="block min-w-0">
                <span className="text-sm font-medium text-zinc-300">
                  Public Slug
                </span>
                <input
                  value={form.slug}
                  onChange={(e) => updateForm("slug", e.target.value)}
                  placeholder="jtrump"
                  className={inputClass}
                />
                <p className="mt-2 break-all text-xs text-zinc-500">
                  Public URL: /token/{form.slug || "your-project"}
                </p>
              </label>

              <label className="block min-w-0">
                <span className="text-sm font-medium text-zinc-300">
                  Token Mint Address
                </span>
                <input
                  value={form.mint}
                  onChange={(e) => updateForm("mint", e.target.value)}
                  placeholder="Solana mint address"
                  className={inputClass}
                />
                {form.mint && !isLikelySolanaAddress(form.mint) ? (
                  <p className="mt-2 text-xs leading-5 text-amber-300">
                    This does not look like a valid Solana address yet.
                  </p>
                ) : null}
              </label>
            </div>

            <label className="mt-5 block min-w-0">
              <span className="text-sm font-medium text-zinc-300">
                Description
              </span>
              <textarea
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
                placeholder="Briefly describe the project, mission, and transparency commitment."
                rows={5}
                className={inputClass}
              />
            </label>
          </section>
        ) : null}

        {step === 2 ? (
          <section className={panelClass}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold">Disclosed Wallets</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Add treasury, liquidity, marketing, community, team, or other
                  key wallets.
                </p>
              </div>

              <button
                type="button"
                onClick={addWallet}
                className="w-full rounded-2xl border border-cyan-400/40 px-5 py-3 text-sm font-bold text-cyan-200 transition hover:bg-cyan-400/10 sm:w-auto"
              >
                + Add Wallet
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-zinc-800 bg-black p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Valid Wallets
                </p>
                <p className="mt-2 text-3xl font-black">
                  {validWallets.length}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-black p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Allocation
                </p>
                <p
                  className={`mt-2 text-3xl font-black ${
                    totalAllocation > 100 ? "text-red-300" : "text-white"
                  }`}
                >
                  {totalAllocation.toFixed(2)}%
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-black p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Duplicates
                </p>
                <p
                  className={`mt-2 text-3xl font-black ${
                    duplicateAddresses.size > 0 ? "text-red-300" : "text-white"
                  }`}
                >
                  {duplicateAddresses.size}
                </p>
              </div>
            </div>

            {totalAllocation > 100 ? (
              <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-sm leading-6 text-red-200">
                Declared allocation is above 100%. Please reduce wallet
                allocation before continuing.
              </div>
            ) : null}

            {duplicateAddresses.size > 0 ? (
              <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-sm leading-6 text-red-200">
                Duplicate wallet addresses detected. Each disclosed wallet
                should be unique.
              </div>
            ) : null}

            <div className="mt-6 grid gap-5">
              {wallets.map((wallet, index) => {
                const address = wallet.address.trim();
                const isDuplicate =
                  address.length > 0 && duplicateAddresses.has(address);
                const isInvalid =
                  address.length > 0 && !isLikelySolanaAddress(address);
                const allocation = Math.max(
                  0,
                  Math.min(100, cleanNumber(wallet.allocation))
                );

                return (
                  <div
                    key={index}
                    className="min-w-0 rounded-3xl border border-zinc-800 bg-black p-4 sm:p-5"
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm text-zinc-500">
                          Wallet #{index + 1}
                        </p>
                        <h3 className="truncate text-lg font-bold">
                          {wallet.label || wallet.category || "New Wallet"}
                        </h3>
                        <p className="mt-1 break-all font-mono text-xs text-zinc-600">
                          {shortAddress(wallet.address)}
                        </p>
                      </div>

                      {wallets.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => removeWallet(index)}
                          className="shrink-0 rounded-xl border border-red-500/30 px-3 py-2 text-xs font-bold text-red-300 transition hover:bg-red-500/10"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>

                    <div className="mb-5">
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-zinc-500">
                          Declared allocation
                        </span>
                        <span className="font-bold text-zinc-300">
                          {cleanNumber(wallet.allocation).toFixed(2)}%
                        </span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-900">
                        <div
                          className={`h-full rounded-full ${
                            totalAllocation > 100
                              ? "bg-red-400"
                              : "bg-cyan-400"
                          }`}
                          style={{ width: `${allocation}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="min-w-0">
                        <span className="text-sm text-zinc-300">Label</span>
                        <input
                          value={wallet.label}
                          onChange={(e) =>
                            updateWallet(index, "label", e.target.value)
                          }
                          placeholder="Treasury"
                          className={inputClass}
                        />
                      </label>

                      <label className="min-w-0">
                        <span className="text-sm text-zinc-300">Category</span>
                        <select
                          value={wallet.category}
                          onChange={(e) =>
                            updateWallet(index, "category", e.target.value)
                          }
                          className={inputClass}
                        >
                          {categories.map((category) => (
                            <option key={category}>{category}</option>
                          ))}
                        </select>
                      </label>

                      <label className="min-w-0 sm:col-span-2">
                        <span className="text-sm text-zinc-300">
                          Wallet Address
                        </span>
                        <input
                          value={wallet.address}
                          onChange={(e) =>
                            updateWallet(index, "address", e.target.value)
                          }
                          placeholder="Solana wallet address"
                          className={`${inputClass} font-mono text-sm`}
                        />

                        {isInvalid ? (
                          <p className="mt-2 text-xs leading-5 text-amber-300">
                            This wallet address may be invalid.
                          </p>
                        ) : null}

                        {isDuplicate ? (
                          <p className="mt-2 text-xs leading-5 text-red-300">
                            This wallet address is duplicated.
                          </p>
                        ) : null}
                      </label>

                      <label className="min-w-0">
                        <span className="text-sm text-zinc-300">
                          Allocation % of Supply
                        </span>
                        <input
                          value={wallet.allocation}
                          onChange={(e) =>
                            updateWallet(index, "allocation", e.target.value)
                          }
                          placeholder="20"
                          inputMode="decimal"
                          className={inputClass}
                        />
                      </label>

                      <label className="min-w-0">
                        <span className="text-sm text-zinc-300">Purpose</span>
                        <input
                          value={wallet.purpose}
                          onChange={(e) =>
                            updateWallet(index, "purpose", e.target.value)
                          }
                          placeholder="Treasury operations"
                          className={inputClass}
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {step === 3 ? (
          <section className={panelClass}>
            <h2 className="text-2xl font-bold">Review Before Publishing</h2>

            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Confirm your project and wallet disclosures before WEB3MB creates
              the public transparency dashboard.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-4">
              <div className="rounded-2xl border border-zinc-800 bg-black p-5">
                <p className="text-sm text-zinc-500">Project</p>
                <p className="mt-2 truncate text-xl font-bold">
                  {form.name || "—"}
                </p>
                <p className="text-sm text-cyan-300">
                  {form.symbol || "SYMBOL"}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-black p-5">
                <p className="text-sm text-zinc-500">Valid Wallets</p>
                <p className="mt-2 text-3xl font-black">
                  {validWallets.length}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-black p-5">
                <p className="text-sm text-zinc-500">Allocation</p>
                <p className="mt-2 text-3xl font-black">
                  {totalAllocation.toFixed(2)}%
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-black p-5">
                <p className="text-sm text-zinc-500">Readiness</p>
                <p className="mt-2 text-3xl font-black">{readinessScore}%</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-zinc-800 bg-black p-5">
              <p className="text-sm text-zinc-500">Token Mint</p>
              <p className="mt-2 break-all font-mono text-xs text-zinc-300">
                {form.mint || "No mint address added"}
              </p>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-800">
              {wallets.map((wallet, index) => {
                const allocation = Math.max(
                  0,
                  Math.min(100, cleanNumber(wallet.allocation))
                );

                return (
                  <div
                    key={index}
                    className="border-b border-zinc-800 bg-black p-4 last:border-b-0"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-bold">
                          {wallet.label || wallet.category || "Wallet"}
                        </p>
                        <p className="text-sm text-zinc-500">
                          {wallet.category}
                        </p>
                      </div>

                      <div className="text-sm font-bold text-zinc-300">
                        {cleanNumber(wallet.allocation).toFixed(2)}% allocation
                      </div>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-900">
                      <div
                        className="h-full rounded-full bg-cyan-400"
                        style={{ width: `${allocation}%` }}
                      />
                    </div>

                    <p className="mt-3 break-all font-mono text-xs text-zinc-500">
                      {wallet.address || "No address added"}
                    </p>

                    {wallet.purpose ? (
                      <p className="mt-2 text-sm leading-6 text-zinc-400">
                        {wallet.purpose}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {step === 4 ? (
          <section className="rounded-3xl border border-cyan-400/20 bg-zinc-950/80 p-5 text-center shadow-2xl shadow-cyan-500/10 sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cyan-400 text-3xl font-black text-black">
              ✓
            </div>

            <h2 className="mt-6 text-3xl font-black">Ready to Publish</h2>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
              WEB3MB will create your project, attach the disclosed wallets, and
              redirect you to the public transparency dashboard.
            </p>

            <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-zinc-800 bg-black p-5 text-left">
              <p className="text-sm text-zinc-500">Public Dashboard</p>
              <p className="mt-2 break-all text-cyan-300">
                https://app.web3mb.com/token/{form.slug || "your-project"}
              </p>
            </div>

            <div className="mx-auto mt-5 max-w-xl rounded-2xl border border-zinc-800 bg-black p-5 text-left">
              <p className="text-sm text-zinc-500">Launch Summary</p>
              <div className="mt-3 grid gap-3 text-sm text-zinc-300 sm:grid-cols-3">
                <div>
                  <p className="text-zinc-500">Wallets</p>
                  <p className="font-bold text-white">{validWallets.length}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Allocation</p>
                  <p className="font-bold text-white">
                    {totalAllocation.toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500">Readiness</p>
                  <p className="font-bold text-white">{readinessScore}%</p>
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-800 bg-black/95 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-6xl gap-3">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 1 || submitting}
            className="w-full rounded-2xl border border-zinc-700 px-5 py-4 text-sm font-bold text-zinc-300 transition hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:min-w-32"
          >
            Back
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={goNext}
              disabled={!canContinue() || submitting}
              className="w-full rounded-2xl bg-cyan-400 px-5 py-4 text-sm font-black text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={submitProject}
              disabled={submitting}
              className="w-full rounded-2xl bg-cyan-400 px-5 py-4 text-sm font-black text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Publishing..." : "Publish Project"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
