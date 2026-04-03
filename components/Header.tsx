import ConnectButton from './ConnectButton'

export default function Header() {
  return (
    <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold">JTRUMPHQ Monitor</h1>
        <p className="text-zinc-400">Wallet monitoring, alerts, and transparency for JTRUMP.</p>
      </div>
      <ConnectButton />
    </header>
  )
}
