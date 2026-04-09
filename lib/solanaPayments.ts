import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";

const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);

const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
);

function requireEnv(name: string, value: string | undefined) {
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function getConnection() {
  return new Connection(
    requireEnv("SOLANA_RPC_URL", process.env.SOLANA_RPC_URL),
    "confirmed"
  );
}

export function getReceivingWallet() {
  return requireEnv(
    "NEXT_PUBLIC_RECEIVING_WALLET",
    process.env.NEXT_PUBLIC_RECEIVING_WALLET
  );
}

export function getUsdcMint() {
  return requireEnv(
    "NEXT_PUBLIC_USDC_MINT",
    process.env.NEXT_PUBLIC_USDC_MINT
  );
}

export async function getUsdcDestinationTokenAccount(ownerAddress?: string) {
  const owner = new PublicKey(ownerAddress || getReceivingWallet());
  const mint = new PublicKey(getUsdcMint());

  const [ata] = PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  return ata.toBase58();
}

function toRawTokenAmount(amount: number, decimals: number) {
  return BigInt(Math.round(amount * 10 ** decimals));
}

function getAccountKeyAtIndex(tx: any, index: number) {
  const key = tx?.transaction?.message?.accountKeys?.[index];
  if (!key) return "";

  if (typeof key === "string") return key;
  if (typeof key?.pubkey?.toBase58 === "function") return key.pubkey.toBase58();
  if (typeof key?.toBase58 === "function") return key.toBase58();

  return String(key);
}

function getPayerFromParsedTx(tx: any) {
  const firstKey = tx?.transaction?.message?.accountKeys?.[0];
  if (!firstKey) return undefined;

  if (typeof firstKey === "string") return firstKey;
  if (typeof firstKey?.pubkey?.toBase58 === "function") {
    return firstKey.pubkey.toBase58();
  }
  if (typeof firstKey?.toBase58 === "function") {
    return firstKey.toBase58();
  }

  return undefined;
}

function findAccountIndex(tx: any, targetAddress: string) {
  const keys = tx?.transaction?.message?.accountKeys || [];
  for (let i = 0; i < keys.length; i++) {
    if (getAccountKeyAtIndex(tx, i) === targetAddress) {
      return i;
    }
  }
  return -1;
}

export async function verifySolanaPayment(input: {
  token: "SOL" | "USDC";
  amount: number;
  txSignature: string;
  destinationWallet: string;
}) {
  const connection = getConnection();

  const tx = await connection.getParsedTransaction(input.txSignature, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });

  if (!tx) {
    throw new Error("Transaction not found on-chain.");
  }

  if (tx.meta?.err) {
    throw new Error("Transaction failed on-chain.");
  }

  const payerWallet = getPayerFromParsedTx(tx);

  if (input.token === "SOL") {
    const expectedLamports = BigInt(
      Math.round(input.amount * LAMPORTS_PER_SOL)
    );

    const destinationIndex = findAccountIndex(tx, input.destinationWallet);

    if (destinationIndex === -1) {
      throw new Error("Destination wallet not found in transaction.");
    }

    const preBalances = tx.meta?.preBalances || [];
    const postBalances = tx.meta?.postBalances || [];

    const pre = BigInt(preBalances[destinationIndex] ?? 0);
    const post = BigInt(postBalances[destinationIndex] ?? 0);
    const delta = post - pre;

    // allow tiny rounding / RPC differences
    const toleranceLamports = BigInt(5000);

    if (delta + toleranceLamports < expectedLamports) {
      throw new Error(
        `No matching SOL transfer found. Expected at least ${expectedLamports.toString()} lamports, found ${delta.toString()}.`
      );
    }

    return {
      ok: true,
      payerWallet,
      destinationAddress: input.destinationWallet,
    };
  }

  const usdcMint = getUsdcMint();
  const destinationTokenAccount = await getUsdcDestinationTokenAccount(
    input.destinationWallet
  );
  const expectedRaw = toRawTokenAmount(input.amount, 6);

  const postBalances = tx.meta?.postTokenBalances || [];
  const preBalances = tx.meta?.preTokenBalances || [];

  const postEntry = postBalances.find((entry: any) => {
    const account = getAccountKeyAtIndex(tx, entry.accountIndex);
    return account === destinationTokenAccount && entry.mint === usdcMint;
  });

  const preEntry = preBalances.find((entry: any) => {
    const account = getAccountKeyAtIndex(tx, entry.accountIndex);
    return account === destinationTokenAccount && entry.mint === usdcMint;
  });

  const postRaw = BigInt(postEntry?.uiTokenAmount?.amount ?? "0");
  const preRaw = BigInt(preEntry?.uiTokenAmount?.amount ?? "0");
  const delta = postRaw - preRaw;

  if (delta !== expectedRaw) {
    throw new Error(
      `No matching USDC transfer found. Expected ${expectedRaw.toString()}, found ${delta.toString()}.`
    );
  }

  return {
    ok: true,
    payerWallet,
    destinationAddress: destinationTokenAccount,
  };
}
