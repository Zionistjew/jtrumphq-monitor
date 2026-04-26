import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="flex min-h-screen bg-black text-white">
      <aside className="hidden w-[280px] shrink-0 border-r border-white/10 bg-[#050816] xl:block">
        <div className="flex min-h-screen flex-col px-5 py-7">
          <img
            src="https://web3mb.com/wp-content/uploads/2026/04/WEB3MB-L.png"
            alt="WEB3MB"
            className="h-20 w-auto object-contain"
          />

          <div className="mt-8 space-y-3">
            <Link href="/app" className="block rounded-xl bg-white/5 px-4 py-4 hover:bg-white/10">
              Dashboard
            </Link>

            <Link href="/app/billing" className="block rounded-xl bg-white/5 px-4 py-4 hover:bg-white/10">
              Billing
            </Link>

            <Link href="/privacy" className="block rounded-xl bg-white/5 px-4 py-4 hover:bg-white/10">
              Privacy Policy
            </Link>

            <Link href="/refunds" className="block rounded-xl bg-white/5 px-4 py-4 hover:bg-white/10">
              Refund Policy
            </Link>
          </div>

          <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">
              Support
            </div>
            <div className="mt-3 text-xs font-semibold">
              verify@web3mb.com
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 px-6 py-10">
        <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">
            Legal
          </p>

          <h1 className="mt-4 text-4xl font-bold">
            Terms of Service
          </h1>

          <div className="mt-8 space-y-6 text-zinc-300 leading-8">
            <p>WEB3MB provides blockchain transparency, wallet verification, analytics, and token trust infrastructure services.</p>
            <p>All blockchain transactions are final and irreversible.</p>
            <p>Users are responsible for ensuring their token projects comply with applicable laws.</p>
            <p>WEB3MB may suspend fraudulent or malicious projects.</p>
            <p>WEB3MB does not guarantee investment returns or token price performance.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
