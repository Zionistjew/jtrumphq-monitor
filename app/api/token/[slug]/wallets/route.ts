import { NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ProjectRow = {
  id: number;
  slug: string;
  name: string;
  symbol: string;
  mint: string;
  wallets?: unknown;
};

type ProjectWalletRow = {
  label: string | null;
  category: string | null;
  address: string;
  purpose: string | null;
  allocation: number | null;
  verified?: boolean | null;
};

type LegacyWallet = {
  label?: string;
  category?: string;
  address?: string;
  purpose?: string;
  allocation?: number;
  verified?: boolean;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getRpcUrl() {
  return (
    process.env.SOLANA_RPC_URL ||
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
    "https://api.mainnet-beta.solana.com"
  );
}

function isValidPublicKey(value?: string | null) {
  try {
    if (!value) return false;
    new PublicKey(value);
    return true;
  } catch {
    return false;
  }
}

function normalizeLegacyWallets(wallets: unknown): ProjectWalletRow[] {
  if (!Array.isArray(wallets)) return [];

  return wallets
    .map((wallet) => wallet as LegacyWallet)
    .filter(
      (wallet) =>
        typeof wallet?.address === "string" &&
        wallet.address.trim().length > 0
    )
    .map((wallet) => ({
      label: wallet.label || "Wallet",
      category: wallet.category || "uncategorized",
      address: String(wallet.address).trim(),
      purpose: wallet.purpose || "",
      allocation:
        typeof wallet.allocation === "number" &&
        Number.isFinite(wallet.allocation)
          ? wallet.allocation
          : 0,
      verified: Boolean(wallet.verified),
    }));
}

async function getTokenBalanceForOwner(
  connection: Connection,
  owner: PublicKey,
  mint: PublicKey
): Promise<number> {
  const parsed = await connection.getParsedTokenAccountsByOwner(owner, {
    mint,
  });

  if (!parsed.value.length) return 0;

  return parsed.value.reduce((sum, item) => {
    const parsedInfo = item.account.data.parsed?.info;
    const amount = parsedInfo?.tokenAmount?.uiAmount;

    if (typeof amount === "number" && Number.isFinite(amount)) {
      return sum + amount;
    }

    const uiAmountString = parsedInfo?.tokenAmount?.uiAmountString;
    const numeric = Number(uiAmountString || 0);

    return Number.isFinite(numeric) ? sum + numeric : sum;
  }, 0);
}

function buildWalletResponse(params: {
  wallet: ProjectWalletRow;
  liveTokenBalance: number;
  liveSolBalance: number;
  error?: string;
}) {
  const allocation =
    typeof params.wallet.allocation === "number" &&
    Number.isFinite(params.wallet.allocation)
      ? params.wallet.allocation
      : 0;

  const variance = params.liveTokenBalance - allocation;
  const lowSol = params.liveSolBalance <= 0.01;
  const verified = Math.abs(variance) === 0 && params.liveSolBalance > 0.01;

  return {
    label: params.wallet.label || "Wallet",
    category: params.wallet.category || "uncategorized",
    address: params.wallet.address,
    purpose: params.wallet.purpose || "",
    allocation,

    verified,
    verificationStatus: verified ? "verified" : "mismatch",
    lowSol,
    variance,

    liveTokenBalance: params.liveTokenBalance,
    liveSolBalance: params.liveSolBalance,

    tokenBalance: params.liveTokenBalance,
    solBalance: params.liveSolBalance,

    tokenAccounts: [],
    error: params.error || null,
  };
}

export async function GET(
  _request: Request,
  context: { params: { slug: string } }
) {
  try {
    const slug = context.params.slug;

    if (!slug) {
      return NextResponse.json(
        { ok: false, detail: "Missing project slug." },
        { status: 400 }
      );
    }

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, slug, name, symbol, mint, wallets")
      .eq("slug", slug)
      .maybeSingle<ProjectRow>();

    if (projectError) {
      return NextResponse.json(
        { ok: false, detail: projectError.message },
        { status: 500 }
      );
    }

    if (!project) {
      return NextResponse.json(
        { ok: false, detail: "Project not found." },
        { status: 404 }
      );
    }

    if (!project.mint || !isValidPublicKey(project.mint)) {
      return NextResponse.json(
        {
          ok: false,
          detail: "Project mint is missing or invalid.",
        },
        { status: 400 }
      );
    }

    const { data: normalizedWallets, error: walletRowsError } = await supabase
      .from("project_wallets")
      .select("label, category, address, purpose, allocation, verified")
      .eq("project_id", project.id);

    if (walletRowsError) {
      return NextResponse.json(
        { ok: false, detail: walletRowsError.message },
        { status: 500 }
      );
    }

    const walletRows: ProjectWalletRow[] =
      normalizedWallets && normalizedWallets.length > 0
        ? normalizedWallets
        : normalizeLegacyWallets(project.wallets);

    const validWalletRows = walletRows.filter((wallet) =>
      isValidPublicKey(wallet.address)
    );

    const connection = new Connection(getRpcUrl(), "confirmed");
    const mintKey = new PublicKey(project.mint);

    const wallets = await Promise.all(
      validWalletRows.map(async (wallet) => {
        try {
          const owner = new PublicKey(wallet.address);

          const lamports = await connection.getBalance(owner, "confirmed");
          const liveSolBalance = lamports / 1_000_000_000;

          const liveTokenBalance = await getTokenBalanceForOwner(
            connection,
            owner,
            mintKey
          );

          return buildWalletResponse({
            wallet,
            liveTokenBalance,
            liveSolBalance,
          });
        } catch (error) {
          return buildWalletResponse({
            wallet,
            liveTokenBalance: 0,
            liveSolBalance: 0,
            error:
              error instanceof Error ? error.message : "Wallet read failed",
          });
        }
      })
    );

    return NextResponse.json({
      ok: true,
      slug: project.slug,
      name: project.name,
      symbol: project.symbol,
      mint: project.mint,
      count: wallets.length,
      wallets,
      updatedAt: new Date().toISOString(),
      rpc: getRpcUrl(),
      source:
        normalizedWallets && normalizedWallets.length > 0
          ? "project_wallets"
          : "projects.wallets",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        detail:
          error instanceof Error
            ? error.message
            : "Unexpected server error.",
      },
      { status: 500 }
    );
  }
}
