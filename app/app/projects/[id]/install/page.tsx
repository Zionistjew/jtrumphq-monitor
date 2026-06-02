"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

export default function TrustSealInstallPage() {
  const params = useParams();
  const slug = String(params?.id || "");

  const [copied, setCopied] = useState("");

  const scriptCode = useMemo(() => {
    return `<script src="https://app.web3mb.com/embed.js"></script>
<div data-web3mb="${slug}"></div>`;
  }, [slug]);

  const iframeCode = useMemo(() => {
    return `<iframe
  src="https://app.web3mb.com/embed/${slug}"
  width="420"
  height="420"
  frameborder="0"
  style="border:0;border-radius:24px;overflow:hidden;"
  title="WEB3MB Trust Seal">
</iframe>`;
  }, [slug]);

  async function copyText(label: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 1600);
  }

  return (
    <main className="min-h-screen bg-black px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <Link
            href={`/app/projects/${slug}`}
            className="text-sm font-bold text-cyan-300 hover:text-cyan-200"
          >
            ← Back to Project
          </Link>

          <h1 className="mt-4 text-3xl font-black sm:text-4xl">
            Trust Seal Installation Center
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">
            Copy and paste the WEB3MB Trust Seal onto your website, landing
            page, token page, or investor portal.
          </p>
        </div>

        <section className="grid gap-5 lg:grid-cols-[1fr_420px]">
          <div className="space-y-5">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
              <h2 className="text-xl font-bold">Recommended Script Embed</h2>
              <p className="mt-2 text-sm text-zinc-400">
                Best for websites, WordPress, Wix, Squarespace, and custom HTML.
              </p>

              <pre className="mt-4 overflow-x-auto rounded-2xl border border-zinc-800 bg-black p-4 text-xs leading-6 text-cyan-200">
                <code>{scriptCode}</code>
              </pre>

              <button
                onClick={() => copyText("script", scriptCode)}
                className="mt-4 w-full rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black text-black hover:bg-cyan-300"
              >
                {copied === "script" ? "Copied!" : "Copy Script Embed"}
              </button>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
              <h2 className="text-xl font-bold">Iframe Embed</h2>
              <p className="mt-2 text-sm text-zinc-400">
                Use this if your platform blocks external JavaScript.
              </p>

              <pre className="mt-4 overflow-x-auto rounded-2xl border border-zinc-800 bg-black p-4 text-xs leading-6 text-emerald-200">
                <code>{iframeCode}</code>
              </pre>

              <button
                onClick={() => copyText("iframe", iframeCode)}
                className="mt-4 w-full rounded-2xl border border-emerald-400/40 px-5 py-3 text-sm font-black text-emerald-200 hover:bg-emerald-400/10"
              >
                {copied === "iframe" ? "Copied!" : "Copy Iframe Embed"}
              </button>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
              <h2 className="text-xl font-bold">Installation Notes</h2>

              <div className="mt-4 grid gap-3 text-sm leading-6 text-zinc-300">
                <div className="rounded-2xl border border-zinc-800 bg-black p-4">
                  <strong className="text-white">WordPress:</strong> Add a Custom
                  HTML block and paste the script embed.
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-black p-4">
                  <strong className="text-white">Wix / Squarespace:</strong> Use
                  the Embed Code or Custom Code block.
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-black p-4">
                  <strong className="text-white">React / Next.js:</strong> Use
                  the iframe version for easiest compatibility.
                </div>
              </div>
            </div>
          </div>

          <aside className="rounded-3xl border border-cyan-400/20 bg-zinc-950 p-5 shadow-2xl shadow-cyan-500/10">
            <h2 className="text-xl font-bold">Live Preview</h2>
            <p className="mt-2 text-sm text-zinc-400">
              This is how your WEB3MB Trust Seal will appear externally.
            </p>

            <div className="mt-5 overflow-hidden rounded-3xl border border-zinc-800 bg-black">
              <iframe
                src={`/embed/${slug}`}
                width="100%"
                height="430"
                title="WEB3MB Trust Seal Preview"
                className="block border-0"
              />
            </div>

            <div className="mt-5 grid gap-3">
              <Link
                href={`/embed/${slug}`}
                target="_blank"
                className="rounded-2xl border border-zinc-700 px-5 py-3 text-center text-sm font-bold text-zinc-200 hover:bg-zinc-900"
              >
                Open Widget Page
              </Link>

              <Link
                href={`/token/${slug}`}
                target="_blank"
                className="rounded-2xl bg-white px-5 py-3 text-center text-sm font-black text-black hover:opacity-90"
              >
                View Public Dashboard
              </Link>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
