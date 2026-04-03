export const dynamic = "force-dynamic";
export const revalidate = 0;

import { fetchWalletSnapshots } from '@/server/walletMonitor'
import { OFFICIAL_WALLETS, JTRUMP_MINT } from '@/lib/wallets'

export async function GET() {
  try {
    const snapshots = await fetchWalletSnapshots()

    const snapshotMap = new Map(
      snapshots.map((w: any) => [w.address, w])
    )

    const wallets = OFFICIAL_WALLETS.map((wallet) => {
      const snap = snapshotMap.get(wallet.address)

      return {
        label: wallet.label,
        category: wallet.category,
        address: wallet.address,
        purpose: wallet.purpose,
        solBalance: snap?.solBalance ?? 0,
        jtrumpBalance: snap?.jtrumpBalance ?? 0,
        tokenAccounts: snap?.tokenAccounts ?? [],
      }
    })

    return Response.json({
      ok: true,
      count: wallets.length,
      mint: JTRUMP_MINT,
      wallets,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Wallet API error:', error)

    return Response.json(
      {
        ok: false,
        error: 'Failed to fetch wallet snapshots',
      },
      { status: 500 }
    )
  }
}
