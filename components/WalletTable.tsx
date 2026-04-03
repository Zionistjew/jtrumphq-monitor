'use client'

import { useEffect, useState } from 'react'

type WalletSnapshot = {
  label: string
  category: string
  address: string
  solBalance: number
  jtrumpBalance: number
}

export default function WalletTable() {
  const [wallets, setWallets] = useState<WalletSnapshot[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function loadWallets() {
      try {
        const res = await fetch('/api/wallets')
        const data = await res.json()
        if (mounted && data.ok) {
          setWallets(data.wallets)
        }
      } catch (error) {
        console.error('Failed to load wallets:', error)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadWallets()
  }, [])

  if (loading) {
    return (
      <div className="card">
        <h2 className="mb-4 text-xl font-semibold">Official Wallets</h2>
        <div className="text-zinc-400">Loading live wallet balances...</div>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="mb-4 text-xl font-semibold">Official Wallets</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-zinc-400">
            <tr>
              <th className="pb-3 pr-4">Label</th>
              <th className="pb-3 pr-4">Category</th>
              <th className="pb-3 pr-4">SOL</th>
              <th className="pb-3 pr-4">JTRUMP</th>
              <th className="pb-3 pr-4">Address</th>
            </tr>
          </thead>
          <tbody>
            {wallets.map((w) => (
              <tr key={w.address} className="border-t border-zinc-800">
                <td className="py-3 pr-4">{w.label}</td>
                <td className="py-3 pr-4 capitalize">{w.category}</td>
                <td className="py-3 pr-4">{w.solBalance.toFixed(4)}</td>
                <td className="py-3 pr-4">
                  {w.jtrumpBalance.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="py-3 pr-4 font-mono text-xs">{w.address}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
