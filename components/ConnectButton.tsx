'use client'

import { useState } from 'react'
import { ADMIN_WALLET } from '@/lib/config'
import { connectPhantom, signAuthMessage } from '@/lib/phantom'
import { getNonce, verifySignature } from '@/lib/api'

export default function ConnectButton() {
  const [wallet, setWallet] = useState<string | null>(null)
  const [status, setStatus] = useState('Connect Phantom')

  const onConnect = async () => {
    try {
      setStatus('Connecting...')
      const address = await connectPhantom()
      if (!address) throw new Error('Wallet not found')

      setWallet(address)

      const { nonce } = await getNonce(address)
      const message = `JTRUMPHQ admin login\nWallet: ${address}\nNonce: ${nonce}`
      const signature = await signAuthMessage(message)

      const result = await verifySignature({
        walletAddress: address,
        message,
        signature,
      })

      if (result.ok && result.isAdmin) {
        setStatus('Admin Connected')
      } else if (result.ok) {
        setStatus('Connected')
      } else {
        setStatus('Connect Failed')
      }
    } catch (err) {
      console.error(err)
      setStatus('Connect Failed')
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button className="btn" onClick={onConnect}>
        {status}
      </button>
      {wallet ? (
        <span className="text-sm text-zinc-400">
          {wallet.slice(0, 4)}...{wallet.slice(-4)}
        </span>
      ) : null}
    </div>
  )
}
