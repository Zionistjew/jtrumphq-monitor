"use client";

import { useMemo, useState } from "react";

type WalletForm = {
  label: string;
  category: string;
  address: string;
  purpose: string;
  allocation: string;
};

type FormState = {
  slug: string;
  name: string;
  symbol: string;
  mint: string;
  description: string;
  primaryColor: string;
  accentColor: string;
  wallets: WalletForm[];
};

const EMPTY_WALLET: WalletForm = {
  label: "",
  category: "",
  address: "",
  purpose: "",
  allocation: "",
};

const EMPTY_FORM: FormState = {
  slug: "",
  name: "",
  symbol: "",
  mint: "",
  description: "",
  primaryColor: "",
  accentColor: "",
  wallets: [{ ...EMPTY_WALLET }],
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-sm">
      <div className="mb-5">
        <div className="text-lg font-semibold text-white">{title}</div>
        {subtitle ? (
          <div className="mt-1 text-sm leading-6 text-zinc-400">{subtitle}</div>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  type?: string;
}) {
  const commonClassName =
    "w-full rounded-2xl border border-white/10 bg-[#0a1020] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-cyan-400";

  return (
    <label className="block">
      <div className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-400">
        {label}
      </div>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={5}
          className={cn(commonClassName, "resize-y")}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={commonClassName}
        />
      )}
    </label>
  );
}

export default function AdminCreateProjectPage() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"success" | "error" | null>(
    null
  );

  const canSubmit = useMemo(() => {
    return (
      form.slug.trim() &&
      form.name.trim() &&
      form.symbol.trim() &&
      form.mint.trim()
    );
  }, [form]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function updateWallet(index: number, key: keyof WalletForm, value: string) {
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
      wallets: [...prev.wallets, { ...EMPTY_WALLET }],
    }));
  }

  function removeWallet(index: number) {
    setForm((prev) => ({
      ...prev,
      wallets:
        prev.wallets.length === 1
          ? [{ ...EMPTY_WALLET }]
          : prev.wallets.filter((_, i) => i !== index),
    }));
  }

  function resetForm() {
    setForm({
      ...EMPTY_FORM,
      wallets: [{ ...EMPTY_WALLET }],
    });
    setMessage(null);
    setMessageTone(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setMessageTone(null);

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
          primary: form.primaryColor.trim() || "cyan",
          accent: form.accentColor.trim() || "zinc",
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
        throw new Error(data?.error || `Create project failed: ${res.status}`);
      }

      setMessage("Project created successfully.");
      setMessageTone("success");
      resetForm();
    } catch (error) {
      const text =
        error instanceof Error ? error.message : "Failed to create project.";
      setMessage(text);
      setMessageTone("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.03] p-6 shadow-2xl md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">
                WEB3MB / Admin
              </div>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
                Create Project
              </h1>
              <p className="mt-3 text-sm leading-7 text-zinc-300">
                Register a new transparency project with blank fields ready for
                real production data entry.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/15"
              >
                Clear Form
              </button>
            </div>
          </div>

          {message ? (
            <div
              className={cn(
                "mt-6 rounded-2xl border p-4 text-sm",
                messageTone === "success"
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                  : "border-rose-500/20 bg-rose-500/10 text-rose-200"
              )}
            >
              {message}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <SectionCard
              title="Project Identity"
              subtitle="Enter the base information for the public trust page and owner dashboard."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label="Project Name"
                  value={form.name}
                  onChange={(value) => updateField("name", value)}
                  placeholder=""
                />
                <Field
                  label="Project Symbol"
                  value={form.symbol}
                  onChange={(value) => updateField("symbol", value)}
                  placeholder=""
                />
                <Field
                  label="Project Slug"
                  value={form.slug}
                  onChange={(value) => updateField("slug", value)}
                  placeholder=""
                />
                <Field
                  label="Mint Address"
                  value={form.mint}
                  onChange={(value) => updateField("mint", value)}
                  placeholder=""
                />
              </div>

              <div className="mt-5">
                <Field
                  label="Description"
                  value={form.description}
                  onChange={(value) => updateField("description", value)}
                  placeholder=""
                  multiline
                />
              </div>
            </SectionCard>

            <SectionCard
              title="Brand Theme"
              subtitle="Optional theme labels. Leave blank if you want the system defaults."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label="Primary Color Token"
                  value={form.primaryColor}
                  onChange={(value) => updateField("primaryColor", value)}
                  placeholder=""
                />
                <Field
                  label="Accent Color Token"
                  value={form.accentColor}
                  onChange={(value) => updateField("accentColor", value)}
                  placeholder=""
                />
              </div>
            </SectionCard>

            <SectionCard
              title="Disclosed Wallets"
              subtitle="Add only the wallets you want publicly disclosed and monitored."
            >
              <div className="space-y-5">
                {form.wallets.map((wallet, index) => (
                  <div
                    key={index}
                    className="rounded-3xl border border-white/10 bg-black/20 p-5"
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="text-sm font-medium text-zinc-200">
                        Wallet {index + 1}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeWallet(index)}
                        className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-200 transition hover:bg-rose-500/15"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                      <Field
                        label="Wallet Label"
                        value={wallet.label}
                        onChange={(value) =>
                          updateWallet(index, "label", value)
                        }
                        placeholder=""
                      />
                      <Field
                        label="Wallet Category"
                        value={wallet.category}
                        onChange={(value) =>
                          updateWallet(index, "category", value)
                        }
                        placeholder=""
                      />
                      <Field
                        label="Wallet Address"
                        value={wallet.address}
                        onChange={(value) =>
                          updateWallet(index, "address", value)
                        }
                        placeholder=""
                      />
                      <Field
                        label="Purpose"
                        value={wallet.purpose}
                        onChange={(value) =>
                          updateWallet(index, "purpose", value)
                        }
                        placeholder=""
                      />
                      <Field
                        label="Declared Allocation"
                        value={wallet.allocation}
                        onChange={(value) =>
                          updateWallet(index, "allocation", value)
                        }
                        placeholder=""
                        type="number"
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addWallet}
                  className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-5 py-3 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/15"
                >
                  Add Wallet
                </button>
              </div>
            </SectionCard>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-2xl border border-white/10 bg-white/10 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/15"
              >
                Reset
              </button>

              <button
                type="submit"
                disabled={!canSubmit || submitting}
                className={cn(
                  "rounded-2xl px-6 py-3 text-sm font-semibold transition",
                  !canSubmit || submitting
                    ? "cursor-not-allowed bg-white/20 text-zinc-400"
                    : "bg-white text-black hover:opacity-90"
                )}
              >
                {submitting ? "Creating..." : "Create Project"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
