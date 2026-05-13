"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Project = {
  id: string | number;
  name: string;
  symbol: string;
  slug: string;
  mint?: string;
  description?: string;
  created_at?: string;
};

function shortAddress(value?: string) {
  if (!value) return "—";
  return `${value.slice(0, 6)}...${value.slice(-6)}`;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProjects() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/app/projects", {
          credentials: "include",
          cache: "no-store",
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(data?.error || "Failed to load projects.");
        }

        setProjects(data?.projects || []);
      } catch (err: any) {
        setError(err?.message || "Failed to load projects.");
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, []);

  return (
    <main className="min-h-screen bg-[#030712] px-4 py-6 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">
              WEB3MB / OWNER HUB
            </p>

            <h1 className="mt-3 text-3xl font-black sm:text-4xl">
              My Projects
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">
              View and manage your live transparency dashboards, wallet
              disclosures, and public trust pages.
            </p>
          </div>

          <Link
            href="/app/billing"
            className="rounded-xl bg-cyan-400 px-5 py-3 text-center text-sm font-black text-black hover:bg-cyan-300"
          >
            Create New Project
          </Link>
        </div>

        {error ? (
          <div className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-sm text-zinc-400">
            Loading your projects...
          </div>
        ) : projects.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
            <h2 className="text-2xl font-black">No projects found yet</h2>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-zinc-400">
              Once you create a transparency dashboard, it will appear here.
            </p>

            <Link
              href="/app/billing"
              className="mt-6 inline-flex rounded-xl bg-cyan-400 px-5 py-3 text-sm font-black text-black hover:bg-cyan-300"
            >
              Start Project Setup
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <div
                key={String(project.id)}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                      {project.symbol || "TOKEN"}
                    </div>

                    <h2 className="mt-2 text-xl font-black text-white">
                      {project.name}
                    </h2>
                  </div>

                  <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-300">
                    Live
                  </span>
                </div>

                <p className="mt-4 line-clamp-3 text-sm leading-6 text-zinc-400">
                  {project.description || "Transparency dashboard is live."}
                </p>

                <div className="mt-5 rounded-xl border border-white/10 bg-black/40 p-4 text-sm">
                  <div className="text-zinc-500">Mint</div>
                  <div className="mt-1 break-all font-semibold text-zinc-200">
                    {shortAddress(project.mint)}
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={`/token/${project.slug}`}
                    className="flex-1 rounded-xl bg-cyan-400 px-4 py-3 text-center text-sm font-black text-black hover:bg-cyan-300"
                  >
                    View Dashboard
                  </Link>

                  <Link
                    href="/app/verify-wallets"
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-black text-white hover:bg-white/10"
                  >
                    Verify Wallets
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
