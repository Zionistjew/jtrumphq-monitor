"use client";

import { useState } from "react";
import Link from "next/link";

type FormState = {
  project_name: string;
  token_symbol: string;
  website: string;
  x_account: string;
  telegram: string;
  founder_name: string;
  founder_email: string;
  project_description: string;
  why_selected: string;
};

const initialForm: FormState = {
  project_name: "",
  token_symbol: "",
  website: "",
  x_account: "",
  telegram: "",
  founder_name: "",
  founder_email: "",
  project_description: "",
  why_selected: "",
};

export default function FoundingProjectsPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  function updateField(name: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function submitApplication(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");

    try {
      const res = await fetch("/api/founding-projects/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error || "Application could not be submitted.");
        return;
      }

      setSuccess(
        "Application submitted successfully. WEB3MB will review your project and contact you from founder@web3mb.com."
      );
      setForm(initialForm);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <section className="mx-auto max-w-7xl px-6 py-8">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="https://web3mb.com/wp-content/uploads/2026/04/WEB3MB-L.png"
              alt="WEB3MB"
              className="h-10 w-auto"
            />
            <div>
              <p className="text-sm font-semibold tracking-[0.3em] text-cyan-300">
                WEB3MB
              </p>
              <p className="text-xs text-zinc-400">
                Transparency Center
              </p>
            </div>
          </Link>

          <div className="flex gap-3">
            <Link
              href="/transparency"
              className="rounded-full border border-white/15 px-4 py-2 text-sm text-zinc-200 hover:border-cyan-300 hover:text-cyan-200"
            >
              Registry
            </Link>
            <Link
              href="/app"
              className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-black hover:bg-cyan-300"
            >
              Get Verified
            </Link>
          </div>
        </header>

        <section className="grid gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-200">
              First 5 Projects Only
            </div>

            <h1 className="max-w-4xl text-4xl font-black tracking-tight md:text-6xl">
              Become One Of The First 5 Verified Projects On WEB3MB
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
              WEB3MB is selecting five founding crypto projects to receive
              complimentary project verification, public registry placement,
              trust score analysis, transparency dashboard exposure, and trust
              seal award visibility.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                "90 Days Free Verification",
                "Featured Homepage Placement",
                "Public Registry Listing",
                "Trust Score Analysis",
                "Trust Seal Awards",
                "Featured Case Study Exposure",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-zinc-200"
                >
                  <span className="mr-2 text-cyan-300">✓</span>
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-3xl border border-yellow-300/20 bg-yellow-300/10 p-5">
              <p className="text-sm font-semibold text-yellow-200">
                Founding Project Offer
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-300">
                This program is designed to help WEB3MB showcase real verified
                projects while giving early crypto founders a stronger public
                transparency profile before broader platform expansion.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-cyan-950/30">
            <h2 className="text-2xl font-bold">Apply For Founding Project Status</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Applications are reviewed manually by WEB3MB. Contact:
              founder@web3mb.com
            </p>

            {success ? (
              <div className="mt-6 rounded-2xl border border-emerald-300/30 bg-emerald-300/10 p-4 text-sm text-emerald-200">
                {success}
              </div>
            ) : null}

            {error ? (
              <div className="mt-6 rounded-2xl border border-red-300/30 bg-red-300/10 p-4 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <form onSubmit={submitApplication} className="mt-6 grid gap-4">
              <input
                required
                value={form.project_name}
                onChange={(e) => updateField("project_name", e.target.value)}
                placeholder="Project Name *"
                className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none focus:border-cyan-300"
              />

              <input
                value={form.token_symbol}
                onChange={(e) => updateField("token_symbol", e.target.value)}
                placeholder="Token Symbol"
                className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none focus:border-cyan-300"
              />

              <input
                value={form.website}
                onChange={(e) => updateField("website", e.target.value)}
                placeholder="Website"
                className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none focus:border-cyan-300"
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  value={form.x_account}
                  onChange={(e) => updateField("x_account", e.target.value)}
                  placeholder="X / Twitter"
                  className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none focus:border-cyan-300"
                />

                <input
                  value={form.telegram}
                  onChange={(e) => updateField("telegram", e.target.value)}
                  placeholder="Telegram"
                  className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none focus:border-cyan-300"
                />
              </div>

              <input
                required
                value={form.founder_name}
                onChange={(e) => updateField("founder_name", e.target.value)}
                placeholder="Founder Name *"
                className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none focus:border-cyan-300"
              />

              <input
                required
                type="email"
                value={form.founder_email}
                onChange={(e) => updateField("founder_email", e.target.value)}
                placeholder="Founder Email *"
                className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none focus:border-cyan-300"
              />

              <textarea
                value={form.project_description}
                onChange={(e) =>
                  updateField("project_description", e.target.value)
                }
                placeholder="Briefly describe your project"
                rows={4}
                className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none focus:border-cyan-300"
              />

              <textarea
                value={form.why_selected}
                onChange={(e) => updateField("why_selected", e.target.value)}
                placeholder="Why should your project be selected as one of the first 5?"
                rows={4}
                className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none focus:border-cyan-300"
              />

              <button
                disabled={loading}
                type="submit"
                className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-black hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Submitting..." : "Apply For Founding Project Status"}
              </button>
            </form>
          </div>
        </section>
      </section>
    </main>
  );
}
