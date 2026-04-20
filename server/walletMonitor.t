import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { JTRUMP_MINT, OFFICIAL_WALLETS } from "@/lib/config";

const RPC_URL =
  process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

const connection = new Connection(RPC_URL, "confirmed");

export type WalletInput = {
  label: string;
  category: string;
  address: string;
  purpose?: string;
};

export type TokenAccountSnapshot = {
  mint: string;
  amount: number;
};

export type WalletSnapshot = {
  label: string;
  category: string;
  address: string;
  solBalance: number;
  jtrumpBalance: number;
  tokenAccounts: TokenAccountSnapshot[];
};

async function getSolBalance(address: string): Promise<number> {
  try {
    const pubkey = new PublicKey(address);
    const lamports = await connection.getBalance(pubkey);
    return lamports / 1_000_000_000;
  } catch (error) {
    console.error(`SOL balance error for ${address}:`, error);
    return 0;
  }
}

async function getTokenAccountsByOwner(
  ownerAddress: string
): Promise<TokenAccountSnapshot[]> {
  try {
    const owner = new PublicKey(ownerAddress);

    const response = await connection.getParsedTokenAccountsByOwner(owner, {
      programId: TOKEN_PROGRAM_ID,
    });

    const tokenAccounts: TokenAccountSnapshot[] = response.value
      .map((acct) => {
        const parsed: any = acct.account.data;
        const info = parsed?.parsed?.info;

        const mint = info?.mint as string | undefined;
        const amount = Number(info?.tokenAmount?.uiAmount || 0);

        if (!mint) return null;

        return {
          mint,
          amount,
        };
      })
      .filter(
        (item): item is TokenAccountSnapshot =>
          !!item && !!item.mint && Number.isFinite(item.amount)
      );

    return tokenAccounts;
  } catch (error) {
    console.error(`Token account scan error for ${ownerAddress}:`, error);
    return [];
  }
}

export async function fetchWalletSnapshots(
  wallets: WalletInput[] = OFFICIAL_WALLETS,
  primaryMint: string = JTRUMP_MINT
): Promise<WalletSnapshot[]> {
  const snapshots = await Promise.all(
    wallets.map(async (wallet) => {
      const [solBalance, tokenAccounts] = await Promise.all([
        getSolBalance(wallet.address),
        getTokenAccountsByOwner(wallet.address),
      ]);

      const primaryToken = tokenAccounts.find(
        (token) => token.mint === primaryMint
      );

      return {
        label: wallet.label,
        category: wallet.category,
        address: wallet.address,
        solBalance,
        jtrumpBalance: primaryToken?.amount || 0,
        tokenAccounts,
      };
    })
  );

  return snapshots;
}
