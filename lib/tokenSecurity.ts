import { Connection, PublicKey } from "@solana/web3.js";

const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
  "https://solana.drpc.org";

type Status = "active" | "revoked" | "unknown";
type LpStatus = "locked" | "burned" | "unlocked" | "unknown";

export async function getTokenSecurity(mintAddress: string) {
  let mintAuthority: Status = "unknown";
  let freezeAuthority: Status = "unknown";

  try {
    const connection = new Connection(RPC_URL);
    const mintPubkey = new PublicKey(mintAddress);
    const mintInfo = await connection.getParsedAccountInfo(mintPubkey);

    const data: any = mintInfo.value?.data;
    const info = data?.parsed?.info;

    mintAuthority = info?.mintAuthority ? "active" : "revoked";
    freezeAuthority = info?.freezeAuthority ? "active" : "revoked";
  } catch (error) {
    console.error("Token security error:", error);
  }

  const rawLpStatus = (process.env.NEXT_PUBLIC_LP_STATUS || "unknown").toLowerCase();
  const lpProofUrl = process.env.NEXT_PUBLIC_LP_PROOF_URL || "";

  const allowedLpStatuses: LpStatus[] = ["locked", "burned", "unlocked", "unknown"];
  const lpStatus: LpStatus = allowedLpStatuses.includes(rawLpStatus as LpStatus)
    ? (rawLpStatus as LpStatus)
    : "unknown";

  return {
    mintAuthority,
    freezeAuthority,
    lpStatus,
    lpProofUrl,
  };
}
