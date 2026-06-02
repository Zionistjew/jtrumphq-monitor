import Image from "next/image";
import { headers } from "next/headers";

type TrustResponse = {
  ok: boolean;
  project?: {
    name?: string;
    symbol?: string;
    slug?: string;
  };
  score?: number;
  grade?: string;
  status?: string;
};

async function getBaseUrl() {
  const h = await headers();

  const host =
    h.get("x-forwarded-host") ||
    h.get("host") ||
    "localhost:3000";

  const proto =
    h.get("x-forwarded-proto") ||
    (host.includes("localhost") ? "http" : "https");

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  return `${proto}://${host}`;
}

async function getTrustData(
  slug: string
): Promise<TrustResponse | null> {
  try {
    const baseUrl = await getBaseUrl();

    const res = await fetch(
      `${baseUrl}/api/trust-score/${slug}`,
      {
        cache: "no-store",
      }
    );

    if (!res.ok) return null;

    const data = (await res.json()) as TrustResponse;

    if (!data.ok) return null;

    return data;
  } catch {
    return null;
  }
}

function getGradeColors(grade?: string) {
  if (!grade) {
    return {
      border: "border-zinc-700",
      badge: "bg-zinc-800 text-zinc-200",
      glow: "from-zinc-900 via-zinc-950 to-black",
      score: "text-white",
    };
  }

  if (grade.startsWith("A")) {
    return {
      border: "border-emerald-500/40",
      badge: "bg-emerald-500/20 text-emerald-200",
      glow: "from-emerald-950 via-[#071421] to-black",
      score: "text-emerald-300",
    };
  }

  if (grade.startsWith("B")) {
    return {
      border: "border-cyan-500/40",
      badge: "bg-cyan-500/20 text-cyan-200",
      glow: "from-cyan-950 via-[#071421] to-black",
      score: "text-cyan-300",
    };
  }

  if (grade.startsWith("C")) {
    return {
      border: "border-amber-500/40",
      badge: "bg-amber-500/20 text-amber-200",
      glow: "from-amber-950 via-[#071421] to-black",
      score: "text-amber-300",
    };
  }

  return {
    border: "border-rose-500/40",
    badge: "bg-rose-500/20 text-rose-200",
    glow: "from-rose-950 via-[#071421] to-black",
    score: "text-rose-300",
  };
}

export default async function EmbedWidget({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const trust = await getTrustData(slug);

  if (!trust) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent p-4">
        <div className="rounded-3xl border border-white/10 bg-[#050816] p-6 text-center text-white shadow-2xl">
          <div className="text-sm text-zinc-400">
            WEB3MB Widget Unavailable
          </div>
        </div>
      </div>
    );
  }

  const colors = getGradeColors(trust.grade);

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent p-3">
      <div
        className={`w-full max-w-md overflow-hidden rounded-3xl border ${colors.border} bg-gradient-to-br ${colors.glow} shadow-[0_25px_80px_rgba(0,0,0,0.55)]`}
      >
        <div className="p-6">
          {/* Logo */}
          <div className="flex items-center justify-between">
            <Image
              src="/WEB3MB-L.png"
              alt="WEB3MB"
              width={180}
              height={50}
              priority
              className="h-auto w-auto"
            />

            <div className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200">
              Verified
            </div>
          </div>

          {/* Header */}
          <div className="mt-5 text-[11px] uppercase tracking-[0.35em] text-zinc-400">
            Verified By WEB3MB
          </div>

          {/* Project */}
          <div className="mt-4">
            <div className="break-words text-3xl font-black text-white">
              {trust.project?.name || slug}
            </div>

            <div className="mt-2 text-sm text-zinc-400">
              {trust.project?.symbol || "PROJECT"}
            </div>
          </div>

          {/* Score Area */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-5">
            <div className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">
              Trust Score
            </div>

            <div
              className={`mt-3 text-6xl font-black leading-none ${colors.score}`}
            >
              {trust.score ?? "—"}
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <div
                className={`rounded-full px-4 py-2 text-sm font-bold ${colors.badge}`}
              >
                Grade {trust.grade || "—"}
              </div>

              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300">
                {trust.status || "Unknown"}
              </div>
            </div>
          </div>

          {/* Verification Features */}
          <div className="mt-5 grid gap-3">
            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-200">
              ✓ Wallet Transparency Enabled
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-200">
              ✓ Live Trust Monitoring
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-200">
              ✓ WEB3MB Verification Active
            </div>
          </div>

          {/* CTA */}
          <div className="mt-6 border-t border-white/10 pt-5">
            <a
              href={`https://app.web3mb.com/token/${slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-bold text-black transition hover:bg-cyan-400"
            >
              View Full Transparency Dashboard →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
