import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

export const SOLANA_RPC_URL =
  process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";

export const RECEIVING_WALLET = process.env.SOLANA_RECEIVING_WALLET || "";

export function getConnection(
  commitment: "processed" | "confirmed" | "finalized" = "confirmed"
) {
  return new Connection(SOLANA_RPC_URL, commitment);
}

export function solToLamports(sol: number) {
  return Math.round(sol * LAMPORTS_PER_SOL);
}

export function lamportsToSol(lamports: number) {
  return lamports / LAMPORTS_PER_SOL;
}

export async function buildSolTransferTransaction(params: {
  fromWallet: string;
  toWallet: string;
  lamports: number;
}) {
  const connection = getConnection("confirmed");
  const { blockhash } = await connection.getLatestBlockhash("confirmed");

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

  return tx;
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function verifySolTransfer(params: {
  signature: string;
  senderWallet?: string;
  recipientWallet: string;
  expectedLamports: number;
}) {
  const connection = getConnection("confirmed");

  const statusResp = await connection.getSignatureStatuses(
    [params.signature],
    { searchTransactionHistory: true }
  );

  const sigInfo = statusResp.value[0];

  if (!sigInfo) {
    return {
      ok: false,
      pending: true,
      reason: "Signature not found yet",
    };
  }

  if (sigInfo.err) {
    return {
      ok: false,
      pending: false,
      reason: "Transaction failed on-chain",
    };
  }

  if (
    sigInfo.confirmationStatus !== "confirmed" &&
    sigInfo.confirmationStatus !== "finalized"
  ) {
    return {
      ok: false,
      pending: true,
      reason: "Transaction submitted but not confirmed yet",
    };
  }

  let tx = null;

  for (let i = 0; i < 6; i++) {
    tx = await connection.getParsedTransaction(params.signature, {
      maxSupportedTransactionVersion: 0,
      commitment: "confirmed",
    });

    if (tx) break;
    await sleep(1200);
  }

  if (!tx) {
    return {
      ok: false,
      pending: true,
      reason: "Transaction confirmed but details are not indexed yet",
    };
  }

  if (tx.meta?.err) {
    return {
      ok: false,
      pending: false,
      reason: "Transaction failed on-chain",
    };
  }

  let matched = false;

  for (const ix of tx.transaction.message.instructions) {
    if (!("parsed" in ix)) continue;
    if (ix.program !== "system") continue;
    if (ix.parsed?.type !== "transfer") continue;

    const info = ix.parsed.info;
    const source = String(info.source || "");
    const destination = String(info.destination || "");
    const lamports = Number(info.lamports || 0);

    const senderMatches = params.senderWallet
      ? source === params.senderWallet
      : true;

    const recipientMatches = destination === params.recipientWallet;
    const amountMatches = lamports === params.expectedLamports;

    if (senderMatches && recipientMatches && amountMatches) {
      matched = true;
      break;
    }
  }

  if (!matched) {
    return {
      ok: false,
      pending: false,
      reason: "Transaction does not match expected payment",
    };
  }

  return {
    ok: true,
    pending: false,
    reason: "Verified",
  };
}
