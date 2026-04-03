const nonceStore = new Map<string, string>()

export function setNonce(walletAddress: string, nonce: string) {
  nonceStore.set(walletAddress, nonce)
}

export function getNonce(walletAddress: string) {
  return nonceStore.get(walletAddress)
}

export function deleteNonce(walletAddress: string) {
  nonceStore.delete(walletAddress)
}
