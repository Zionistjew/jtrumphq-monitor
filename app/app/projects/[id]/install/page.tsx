"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

const APP_URL = "https://app.web3mb.com";

function CodeCard({
  title,
  description,
  code,
  copied,
  copyKey,
  onCopy,
  tone = "cyan",
}: {
  title: string;
  description: string;
  code: string;
  copied: string;
  copyKey: string;
  onCopy: (label: string, text: string) => void;
  tone?: "cyan" | "emerald" | "amber" | "purple";
}) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-200 border-emerald-400/30 hover:bg-emerald-400/10"
      : tone === "amber"
        ? "text-amber-200 border-amber-400/30 hover:bg-amber-400/10"
        : tone === "purple"
          ? "text-purple-200 border-purple-400/30 hover:bg-purple-400/10"
          : "text-cyan-200 border-cyan-400/30 hover:bg-cyan-400/10";

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
      <h2 className="text-xl font-black text-white">{title}</h2>

      <p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p>

      <pre className="mt-4 max-h-[260px] overflow-auto rounded-2xl border border-zinc-800 bg-black p-4 text-xs leading-6 text-zinc-200">
        <code>{code}</code>
      </pre>

      <button
        onClick={() => onCopy(copyKey, code)}
        className={`mt-4 w-full rounded-2xl border px-5 py-3 text-sm font-black ${toneClass}`}
      >
        {copied === copyKey ? "Copied!" : `Copy ${title}`}
      </button>
    </div>
  );
}

export default function TrustSealInstallPage() {
  const params = useParams();
  const slug = String(params?.id || "");

  const [copied, setCopied] = useState("");

  const publicDashboardUrl = `${APP_URL}/token/${slug}`;
  const widgetUrl = `${APP_URL}/embed/${slug}`;
  const svgSealUrl = `${APP_URL}/api/trust-seal/${slug}`;

  const scriptCode = useMemo(() => {
    return `<script src="${APP_URL}/embed.js"></script>
<div
  data-web3mb="${slug}"
  data-theme="dark"
  data-width="420"
  data-height="720">
</div>`;
  }, [slug]);

  const iframeCode = useMemo(() => {
    return `<iframe
  src="${widgetUrl}"
  width="420"
  height="720"
  frameborder="0"
  loading="lazy"
  style="border:0;border-radius:24px;overflow:hidden;background:transparent;"
  title="WEB3MB Trust Seal">
</iframe>`;
  }, [widgetUrl]);

  const imageCode = useMemo(() => {
    return `<a href="${publicDashboardUrl}" target="_blank" rel="noopener noreferrer">
  <img
    src="${svgSealUrl}"
    alt="WEB3MB Trust Seal"
    width="960"
    height="300"
    style="max-width:100%;height:auto;border-radius:24px;"
  />
</a>`;
  }, [publicDashboardUrl, svgSealUrl]);

  const directLinkCode = useMemo(() => {
    return publicDashboardUrl;
  }, [publicDashboardUrl]);

  const markdownCode = useMemo(() => {
    return `[![WEB3MB Trust Seal](${svgSealUrl})](${publicDashboardUrl})`;
  }, [svgSealUrl, publicDashboardUrl]);

  const wordpressCode = useMemo(() => {
    return `<div style="max-width:960px;margin:24px auto;">
  <a href="${publicDashboardUrl}" target="_blank" rel="noopener noreferrer">
    <img
      src="${svgSealUrl}"
      alt="WEB3MB Trust Seal"
      style="width:100%;height:auto;border-radius:24px;"
    />
  </a>
</div>`;
  }, [publicDashboardUrl, svgSealUrl]);

  async function copyText(label: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 1600);
  }

  return (
    <main className="min-h-screen bg-[#050816] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link
              href={`/app/projects/${slug}`}
              className="text-sm font-bold text-cyan-300 hover:text-cyan-200"
            >
              ← Back to Project
            </Link>

            <div className="mt-5 text-xs font-black uppercase tracking-[0.3em] text-cyan-300">
              WEB3MB Install Wizard
            </div>

            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
              Trust Seal Install Center
            </h1>

            <p className="mt-4 max-w-4xl text-sm leading-7 text-zinc-400">
              Add your live WEB3MB Trust Seal to websites, launch pages,
              whitepapers, investor portals, Linktree pages, WordPress pages,
              and token communities.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/token/${slug}`}
              target="_blank"
              className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-bold hover:bg-white/15"
            >
              Public Dashboard
            </Link>

            <Link
              href={`/embed/${slug}`}
              target="_blank"
              className="rounded-2xl border border-cyan-400/30 bg-cyan-500/15 px-5 py-3 text-sm font-bold text-cyan-100 hover:bg-cyan-500/25"
            >
              Open Widget
            </Link>
          </div>
        </div>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_440px]">
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <CodeCard
                title="SVG Image Seal"
                description="Best for websites, WordPress, whitepapers, media kits, and static pages. This loads the live Trust Seal image and links to the full public dashboard."
                code={imageCode}
                copied={copied}
                copyKey="image"
                onCopy={copyText}
                tone="cyan"
              />

              <CodeCard
                title="Full Iframe Widget"
                description="Best for landing pages and custom websites. This shows the full interactive WEB3MB Trust Seal 2.0 card."
                code={iframeCode}
                copied={copied}
                copyKey="iframe"
                onCopy={copyText}
                tone="emerald"
              />

              <CodeCard
                title="JavaScript Auto Embed"
                description="Best for sites where you want WEB3MB to render the widget automatically inside a placeholder div."
                code={scriptCode}
                copied={copied}
                copyKey="script"
                onCopy={copyText}
                tone="purple"
              />

              <CodeCard
                title="WordPress Custom HTML"
                description="Paste this into a WordPress Custom HTML block. It is safe, simple, and does not require external JavaScript."
                code={wordpressCode}
                copied={copied}
                copyKey="wordpress"
                onCopy={copyText}
                tone="amber"
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <CodeCard
                title="Direct Dashboard Link"
                description="Use this for Telegram, Discord, X/Twitter, Linktree, Dexscreener descriptions, and investor messages."
                code={directLinkCode}
                copied={copied}
                copyKey="link"
                onCopy={copyText}
                tone="cyan"
              />

              <CodeCard
                title="Markdown Badge"
                description="Use this in GitHub READMEs, docs, community pages, or markdown-supported launch pages."
                code={markdownCode}
                copied={copied}
                copyKey="markdown"
                onCopy={copyText}
                tone="emerald"
              />
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
              <h2 className="text-xl font-black">Installation Notes</h2>

              <div className="mt-5 grid gap-3 text-sm leading-6 text-zinc-300 lg:grid-cols-2">
                <div className="rounded-2xl border border-zinc-800 bg-black p-4">
                  <strong className="text-white">WordPress:</strong> Add a
                  Custom HTML block and paste the SVG Image Seal or WordPress
                  Custom HTML snippet.
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-black p-4">
                  <strong className="text-white">Wix / Squarespace:</strong>{" "}
                  Use an Embed Code block. If scripts are blocked, use the
                  iframe version.
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-black p-4">
                  <strong className="text-white">React / Next.js:</strong> Use
                  the iframe or image version for easiest compatibility.
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-black p-4">
                  <strong className="text-white">Telegram / Discord:</strong>{" "}
                  Share the Direct Dashboard Link so investors can review the
                  full transparency report.
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-cyan-400/20 bg-zinc-950 p-5 shadow-2xl shadow-cyan-500/10">
              <h2 className="text-xl font-black">Live Widget Preview</h2>

              <p className="mt-2 text-sm leading-6 text-zinc-400">
                This is how the full embedded WEB3MB Trust Seal widget appears
                externally.
              </p>

              <div className="mt-5 overflow-hidden rounded-3xl border border-zinc-800 bg-black">
                <iframe
                  src={`/embed/${slug}`}
                  width="100%"
                  height="760"
                  title="WEB3MB Trust Seal Preview"
                  className="block border-0"
                />
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
              <h2 className="text-xl font-black">SVG Seal Preview</h2>

              <p className="mt-2 text-sm leading-6 text-zinc-400">
                This is the lightweight Trust Seal image for faster installs.
              </p>

              <div className="mt-5 overflow-hidden rounded-3xl border border-zinc-800 bg-black p-2">
                <img
                  src={`/api/trust-seal/${slug}`}
                  alt="WEB3MB Trust Seal"
                  className="h-auto w-full rounded-2xl"
                />
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
