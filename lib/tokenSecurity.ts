import { Connection, PublicKey } from "@solana/web3.js";

const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
  "https://solana.drpc.org";

export async function getTokenSecurity(mintAddress: string) {
  try {
    const connection = new Connection(RPC_URL);

    const mintPubkey = new PublicKey(mintAddress);
    const mintInfo = await connection.getParsedAccountInfo(mintPubkey);

    const data: any = mintInfo.value?.data;

    if (!data) {
      return {
        mintAuthority: "unknown",
        freezeAuthority: "unknown",
      };
    }

    const info = data.parsed?.info;

    return {
      mintAuthority: info.mintAuthority ? "active" : "revoked",
      freezeAuthority: info.freezeAuthority ? "active" : "revoked",
    };
  } catch (error) {
    console.error("Token security error:", error);

    return {
      mintAuthority: "unknown",
      freezeAuthority: "unknown",
    };
  }
}
