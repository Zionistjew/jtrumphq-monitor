import { randomBytes } from 'crypto'
import { setNonce } from '@/lib/nonces'

export async function POST(req: Request) {
  const { walletAddress } = await req.json()
  const nonce = randomBytes(16).toString('hex')
  setNonce(walletAddress, nonce)
  return Response.json({ nonce })
}
