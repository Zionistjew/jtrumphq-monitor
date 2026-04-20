"use client";

import { useEffect, useState } from "react";

type TrustSealCardProps = {
  projectName: string;
  projectSlug: string;
};

export default function TrustSealCard({
  projectName,
  projectSlug,
}: TrustSealCardProps) {
  const trustSealUrl = `https://app.web3mb.com/api/trust-seal/${projectSlug}`;
  const embedCode = `<a href="https://app.web3mb.com/token/${projectSlug}" target="_blank" rel="noopener noreferrer">
  <img src="${trustSealUrl}" alt="${projectName} Trust Seal" style="max-width: 320px;" />
</a>`;

  const [copyState, setCopyState] = useState<"idle" | "url" | "embed">("idle");

  useEffect(() => {
    if (copyState === "idle") return;
    const timeout = setTimeout(() => setCopyState("idle"), 2000);
    return () => clearTimeout(timeout);
  }, [copyState]);

  async function copyText(value: string, type: "url" | "embed") {
    try {
      await navigator.clipboard.writeText(value);
      setCopyState(type);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  }

  return (
    <div className="xl:col-span-2 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-8 shadow-lg">
      <h2 className="text-2xl font-semibold">Trust Seal</h2>
      <p className="mt-2 text-sm text-zinc-400">
        Public-facing verification block for websites, investor decks, and community pages.
      </p>

      <div className="mt-6 rounded-3xl border border-zinc-800 bg-black/40 p-6">
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
          <img
            src={trustSealUrl}
            alt={`${projectName} Trust Seal`}
            className="block h-auto w-full"
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                Trust Seal URL
              </div>
              <button
                type="button"
                onClick={() => copyText(trustSealUrl, "url")}
                className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300 hover:bg-cyan-500/20"
              >
                {copyState === "url" ? "Copied" : "Copy URL"}
              </button>
            </div>

            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words text-xs leading-6 text-zinc-300">
{trustSealUrl}
            </pre>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                HTML Embed Code
              </div>
              <button
                type="button"
                onClick={() => copyText(embedCode, "embed")}
                className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300 hover:bg-cyan-500/20"
              >
                {copyState === "embed" ? "Copied" : "Copy Code"}
              </button>
            </div>

            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words text-xs leading-6 text-zinc-300">
{embedCode}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
