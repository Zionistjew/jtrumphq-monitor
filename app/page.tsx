import Header from '@/components/Header'
import Link from 'next/link'
import { EXTERNAL_LINKS } from '@/lib/config'

export default function HomePage() {
  return (
    <main>
      <Header />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 text-2xl font-semibold">Admin Dashboard</h2>
          <p className="mb-4 text-zinc-400">Monitor official wallets, view recent events, and route alerts to Telegram and email.</p>
          <Link className="btn" href="/admin">Open Admin</Link>
        </div>
        <div className="card">
          <h2 className="mb-3 text-2xl font-semibold">Public Transparency</h2>
          <p className="mb-4 text-zinc-400">Public-facing wallet map and trust page for investors and holders.</p>
          <Link className="btn-secondary" href="/transparency">View Transparency</Link>
        </div>
      </div>

      <div className="mt-6 card">
        <h2 className="mb-3 text-xl font-semibold">Official External Links</h2>
        <div className="flex flex-wrap gap-4">
          <a href={EXTERNAL_LINKS.solscan} target="_blank">Solscan</a>
          <a href={EXTERNAL_LINKS.birdeye} target="_blank">Birdeye</a>
          <a href={EXTERNAL_LINKS.telegram} target="_blank">Telegram</a>
        </div>
      </div>
    </main>
  )
}
