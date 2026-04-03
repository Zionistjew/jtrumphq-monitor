import { Connection, PublicKey } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { JTRUMP_MINT, OFFICIAL_WALLETS } from '@/lib/config'

const RPC_URL =
  process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'

const connection = new Connection(RPC_URL, 'confirmed')

export type WalletSnapshot = {
  label: string
  category: string
  address: string
  solBalance: number
  jtrumpBalance: number
}

async function getSolBalance(address: string): Promise<number> {
  try {
    const pubkey = new PublicKey(address)
    const lamports = await connection.getBalance(pubkey)
    return lamports / 1_000_000_000
  } catch (error) {
    console.error(`SOL balance error for ${address}:`, error)
    return 0
  }
}

async function getMintBalancesByOwner(
  mintAddress: string
): Promise<Record<string, number>> {
  try {
    const mint = new PublicKey(mintAddress)

    const resp = await connection.getParsedProgramAccounts(
      TOKEN_PROGRAM_ID,
      {
        filters: [
          { dataSize: 165 },
          {
            memcmp: {
              offset: 0,
              bytes: mint.toBase58(),
            },
          },
        ],
      }
    )

    const balances: Record<string, number> = {}

    for (const acct of resp) {
      const parsed: any = acct.account.data
      const info = parsed?.parsed?.info
      if (!info) continue

      const owner = info.owner as string
      const amount = Number(info.tokenAmount?.uiAmount || 0)

      if (!owner) continue

      balances[owner] = (balances[owner] || 0) + amount
    }

    return balances
  } catch (error) {
    console.error('Mint balance scan error:', error)
    return {}
  }
}

export async function fetchWalletSnapshots(): Promise<WalletSnapshot[]> {
  const [jtrumpOwnerBalances] = await Promise.all([
    getMintBalancesByOwner(JTRUMP_MINT),
  ])

  const snapshots = await Promise.all(
    OFFICIAL_WALLETS.map(async (wallet) => {
      const solBalance = await getSolBalance(wallet.address)

      return {
        label: wallet.label,
        category: wallet.category,
        address: wallet.address,
        solBalance,
        jtrumpBalance: jtrumpOwnerBalances[wallet.address] || 0,
      }
    })
  )

  return snapshots
}
