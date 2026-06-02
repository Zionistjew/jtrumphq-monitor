"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type AnalyticsData = {
  ok: boolean;
  slug: string;
  totals: {
    impressions: number;
    clicks: number;
    ctr: number;
  };
  last7d: {
    impressions: number;
    clicks: number;
    ctr: number;
  };
  top_domains: {
    domain: string;
    impressions: number;
    clicks: number;
    ctr: number;
  }[];
  daily: {
    date: string;
    impressions: number;
    clicks: number;
  }[];
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value || 0);
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
        {label}
      </p>
      <p className="mt-4 text-4xl font-black text-white">{value}</p>
      <p className="mt-3 text-sm leading-6 text-zinc-400">{hint}</p>
    </div>
  );
}

export default function TrustSealAnalyticsPage() {
  const params = useParams();
  const slug = String(params?.id || "");

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadAnalytics() {
    setLoading(true);

    try {
      const res = await fetch(`/api/projects/${slug}/analytics`, {
        cache: "no-store",
      });

      const json = await res.json();

      if (json?.ok) {
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (slug) loadAnalytics();
  }, [slug]);

  const maxDaily = useMemo(() => {
    if (!data?.daily?.length) return 1;

    return Math.max(
      ...data.daily.map((day) => day.impressions + day.clicks),
      1
    );
  }, [data]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="rounded-3xl border border-cyan-400/20 bg-zinc-950 p-8 text-center shadow-2xl shadow-cyan-500/10">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
          <h1 className="mt-6 text-2xl font-black">Loading Analytics</h1>
          <p className="mt-3 text-sm text-zinc-400">
            WEB3MB is loading Trust Seal performance data.
          </p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-black px-4 py-8 text-white">
        <div className="mx-auto max-w-6xl rounded-3xl border border-red-500/30 bg-red-950/30 p-8">
          <h1 className="text-3xl font-black">Analytics unavailable</h1>
          <p className="mt-3 text-zinc-300">
            WEB3MB could not load analytics for this project.
          </p>
          <Link
            href={`/app/projects/${slug}`}
            className="mt-6 inline-flex rounded-2xl bg-white px-5 py-3 text-sm font-black text-black"
          >
            Back to Project
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-3xl border border-white/10 bg-zinc-950 p-6">
          <Link
            href={`/app/projects/${slug}`}
            className="text-sm font-bold text-cyan-300 hover:text-cyan-200"
          >
            ← Back to Project
          </Link>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">
                WEB3MB Trust Seal Analytics
              </p>

              <h1 className="mt-3 text-3xl font-black sm:text-5xl">
                Embed Performance
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">
                Track Trust Seal impressions, clicks, click-through rate, and
                top referring domains for this project.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={loadAnalytics}
                className="rounded-2xl border border-zinc-700 px-5 py-3 text-sm font-black text-white hover:bg-zinc-900"
              >
                Refresh
              </button>

              <Link
                href={`/app/projects/${slug}/install`}
                className="rounded-2xl bg-cyan-400 px-5 py-3 text-center text-sm font-black text-black hover:bg-cyan-300"
              >
                Install Trust Seal
              </Link>
            </div>
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Impressions"
            value={formatNumber(data.totals.impressions)}
            hint="Lifetime Trust Seal views across installed websites."
          />

          <StatCard
            label="Total Clicks"
            value={formatNumber(data.totals.clicks)}
            hint="Visitors who clicked through to the transparency dashboard."
          />

          <StatCard
            label="Total CTR"
            value={`${data.totals.ctr}%`}
            hint="Click-through rate from seal views to dashboard visits."
          />

          <StatCard
            label="7-Day CTR"
            value={`${data.last7d.ctr}%`}
            hint="Recent engagement rate over the last seven days."
          />
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_420px]">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-black">Last 30 Days Activity</h2>
                <p className="mt-2 text-sm text-zinc-400">
                  Daily Trust Seal impressions and clicks.
                </p>
              </div>

              <div className="rounded-full border border-zinc-700 px-4 py-2 text-xs font-bold text-zinc-300">
                {data.daily.length} active day{data.daily.length === 1 ? "" : "s"}
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {data.daily.length ? (
                data.daily.map((day) => {
                  const total = day.impressions + day.clicks;
                  const width = Math.max((total / maxDaily) * 100, 4);

                  return (
                    <div key={day.date}>
                      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                        <span className="font-bold text-white">{day.date}</span>
                        <span className="text-zinc-400">
                          {formatNumber(day.impressions)} impressions ·{" "}
                          {formatNumber(day.clicks)} clicks
                        </span>
                      </div>

                      <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-cyan-400"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-zinc-800 bg-black p-6 text-sm text-zinc-400">
                  No daily activity has been recorded yet.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
            <h2 className="text-2xl font-black">Top Domains</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Websites where this Trust Seal is being viewed.
            </p>

            <div className="mt-6 space-y-3">
              {data.top_domains.length ? (
                data.top_domains.map((domain) => (
                  <div
                    key={domain.domain}
                    className="rounded-2xl border border-zinc-800 bg-black p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-bold text-white">
                          {domain.domain}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          CTR: {domain.ctr}%
                        </p>
                      </div>

                      <div className="text-right text-xs text-zinc-400">
                        <p>{formatNumber(domain.impressions)} views</p>
                        <p>{formatNumber(domain.clicks)} clicks</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-zinc-800 bg-black p-6 text-sm text-zinc-400">
                  No referring domains recorded yet.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-5">
          <h2 className="text-xl font-black text-cyan-200">
            Analytics Summary
          </h2>

          <p className="mt-3 text-sm leading-7 text-cyan-50/80">
            Your WEB3MB Trust Seal has generated{" "}
            <strong className="text-white">
              {formatNumber(data.totals.impressions)}
            </strong>{" "}
            lifetime impressions and{" "}
            <strong className="text-white">
              {formatNumber(data.totals.clicks)}
            </strong>{" "}
            dashboard clicks. This data helps prove that your transparency seal
            is visible, trusted, and driving investor engagement.
          </p>
        </section>
      </div>
    </main>
  );
}
