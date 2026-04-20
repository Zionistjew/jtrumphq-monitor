import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

declare global {
  interface Window {
    phantom?: {
      solana?: {
        isPhantom?: boolean;
        publicKey?: { toString(): string };
        connect: () => Promise<{ publicKey: { toString(): string } }>;
        signMessage: (
          message: Uint8Array | string,
          display?: "utf8" | "hex"
        ) => Promise<{ signature: Uint8Array }>;
        signAndSendTransaction: (
          transaction: Transaction
        ) => Promise<{ signature: string }>;
      };
    };
  }
}

export function getPhantomProvider() {
  if (typeof window === "undefined") return null;
  return window?.phantom?.solana ?? null;
}

export async function connectPhantomWallet() {
  const provider = getPhantomProvider();

  if (!provider?.isPhantom) {
    throw new Error("Phantom wallet not found. Please install Phantom.");
  }

  const res = await provider.connect();

  return {
    provider,
    walletAddress: res.publicKey.toString(),
  };
}

export async function signNonceMessage(message: string) {
  const provider = getPhantomProvider();

  if (!provider?.isPhantom) {
    throw new Error("Phantom wallet not found.");
  }

  const encoded = new TextEncoder().encode(message);
  const result = await provider.signMessage(encoded, "utf8");
  return Array.from(result.signature);
}

export async function sendSolPayment(params: {
  rpcUrl: string;
  fromWallet: string;
  toWallet: string;
  lamports: number;
}) {
  const provider = getPhantomProvider();
  if (!provider?.isPhantom) {
    throw new Error("Phantom wallet not found.");
  }

  const connection = new Connection(params.rpcUrl, "confirmed");
  const { blockhash } = await connection.getLatestBlockhash("finalized");

  const tx = new Transaction({
    feePayer: new PublicKey(params.fromWallet),
    recentBlockhash: blockhash,
  }).add(
    SystemProgram.transfer({
      fromPubkey: new PublicKey(params.fromWallet),
      toPubkey: new PublicKey(params.toWallet),
      lamports: params.lamports,
    })
  );

  const result = await provider.signAndSendTransaction(tx);
  return { signature: result.signature };
}
