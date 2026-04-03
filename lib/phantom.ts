'use client'

import { BrowserSDK, AddressType } from '@phantom/browser-sdk'
import bs58 from 'bs58'

export const sdk = new BrowserSDK({
  providers: ['injected'],
  addressTypes: [AddressType.solana],
  appId: process.env.NEXT_PUBLIC_PHANTOM_APP_ID || 'jtrumphq',
})

export async function connectPhantom() {
  try {
    const { addresses } = await sdk.connect({ provider: 'injected' })
    const solanaAddress = addresses.find(
      (a: any) => a.addressType === AddressType.solana || a.type === AddressType.solana
    )
    return solanaAddress?.address ?? null
  } catch (err) {
    console.error('Phantom connect error:', err)
    return null
  }
}

export async function signAuthMessage(message: string) {
  try {
    const result: any = await sdk.solana.signMessage(message)

    // Normalize the SDK response shape
    const rawSignature =
      result?.signature ??
      result?.sig ??
      result

    if (!rawSignature) {
      throw new Error('No signature returned from Phantom')
    }

    // Convert Uint8Array/Buffer-like into base58 for server verification
    const signatureBase58 =
      typeof rawSignature === 'string'
        ? rawSignature
        : bs58.encode(new Uint8Array(rawSignature))

    return signatureBase58
  } catch (err) {
    console.error('Sign error:', err)
    throw err
  }
}
