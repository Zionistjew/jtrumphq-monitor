import Header from '@/components/Header'
import MetricCard from '@/components/MetricCard'
import WalletTable from '@/components/WalletTable'
import TransferFeed from '@/components/TransferFeed'
import AlertFeed from '@/components/AlertFeed'
import { ADMIN_WALLET } from '@/lib/config'

export default function AdminPage() {
  const shortAdmin =
    ADMIN_WALLET.length > 10
      ? `${ADMIN_WALLET.slice(0, 4)}...${ADMIN_WALLET.slice(-5)}`
      : ADMIN_WALLET

  return (
    <main>
      <Header />
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          label="Admin Wallet"
          value={shortAdmin}
          helper="Configured as dashboard authority"
        />
        <MetricCard
          label="Tracked Wallets"
          value="7"
          helper="Liquidity, Treasury, Dev, Community"
        />
        <MetricCard
          label="Alert Channels"
          value="Telegram + Email"
          helper="Telegram + hello@jailtrumphq.com"
        />
        <MetricCard
          label="Token"
          value="JTRUMP"
          helper="Solana SPL token monitor"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <WalletTable />
        <TransferFeed />
      </div>

      <div className="mt-6">
        <AlertFeed />
      </div>
    </main>
  )
}
