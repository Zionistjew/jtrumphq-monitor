import Link from "next/link";

export default function PrivacyPage() {
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

            <Link href="/terms" className="block rounded-xl bg-white/5 px-4 py-4 hover:bg-white/10">
              Terms
            </Link>

            <Link href="/refunds" className="block rounded-xl bg-white/5 px-4 py-4 hover:bg-white/10">
              Refund Policy
            </Link>
          </div>
        </div>
      </aside>

      <main className="flex-1 px-6 py-10">
        <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">
            Legal
          </p>

          <h1 className="mt-4 text-4xl font-bold">
            Privacy Policy
          </h1>

          <div className="mt-8 space-y-6 text-zinc-300 leading-8">
            <p>WEB3MB collects wallet addresses, payment records, and project metadata required to operate the platform.</p>
            <p>We do not sell customer data.</p>
            <p>Blockchain activity remains publicly visible on-chain.</p>
            <p>Users are responsible for protecting wallet credentials.</p>
            <p>Policies may evolve as regulations change.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
