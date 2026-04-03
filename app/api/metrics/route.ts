import { OFFICIAL_WALLETS, JTRUMP_MINT } from '@/lib/config'

export async function GET() {
  return Response.json({
    token: 'JTRUMP',
    mint: JTRUMP_MINT,
    trackedWallets: OFFICIAL_WALLETS.length,
    note: 'Replace this route with live Dexscreener / RPC data in production.',
  })
}
