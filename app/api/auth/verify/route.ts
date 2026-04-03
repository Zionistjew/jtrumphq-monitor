import nacl from 'tweetnacl'
import bs58 from 'bs58'
import { getNonce, deleteNonce } from '@/lib/nonces'
import { ADMIN_WALLET } from '@/lib/config'

export async function POST(req: Request) {
  const { walletAddress, message, signature } = await req.json()

  const nonce = getNonce(walletAddress)
  if (!nonce || !message.includes(nonce)) {
    return Response.json({ error: 'Invalid nonce' }, { status: 400 })
  }

  const ok = nacl.sign.detached.verify(
    new TextEncoder().encode(message),
    bs58.decode(signature),
    bs58.decode(walletAddress),
  )

  if (!ok) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }

  deleteNonce(walletAddress)

  return Response.json({
    ok: true,
    walletAddress,
    isAdmin: walletAddress === ADMIN_WALLET,
  })
}
