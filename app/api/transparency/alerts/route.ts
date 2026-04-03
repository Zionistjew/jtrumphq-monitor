export const dynamic = "force-dynamic";
export const revalidate = 0;

import { Connection, PublicKey } from "@solana/web3.js";
import { OFFICIAL_WALLETS, JTRUMP_MINT } from "@/lib/wallets";
import { sendTelegramMessage } from "@/lib/telegram";
import { hasSentAlert, markAlertSent } from "@/lib/alertMemory";

const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
  "https://api.mainnet-beta.solana.com";

type AlertSeverity = "info" | "warning" | "critical";

type AlertItem = {
  signature: string;
  timestamp: number;
  wallet: string;
  walletAddress: string;
  category: string;
  direction: "in" | "out" | "neutral";
  amount: number;
  severity: AlertSeverity;
  message: string;
};

export async function GET() {
  try {
    const connection = new Connection(RPC_URL, "confirmed");
    const alerts: AlertItem[] = [];
    const seen = new Set<string>();

    for (const wallet of OFFICIAL_WALLETS) {
      const pubkey = new PublicKey(wallet.address);
      const signatures = await connection.getSignaturesForAddress(pubkey, {
        limit: 3,
      });

      for (const sig of signatures) {
        if (seen.has(sig.signature)) continue;
        seen.add(sig.signature);

        let amount = 0;
        let direction: "in" | "out" | "neutral" = "neutral";

        try {
          const tx = await connection.getParsedTransaction(sig.signature, {
            maxSupportedTransactionVersion: 0,
          });

          const pre = tx?.meta?.preTokenBalances ?? [];
          const post = tx?.meta?.postTokenBalances ?? [];

          const preBalance = pre
            .filter((b) => b.mint === JTRUMP_MINT && b.owner === wallet.address)
            .reduce((sum, b) => sum + Number(b.uiTokenAmount.uiAmount || 0), 0);

          const postBalance = post
            .filter((b) => b.mint === JTRUMP_MINT && b.owner === wallet.address)
            .reduce((sum, b) => sum + Number(b.uiTokenAmount.uiAmount || 0), 0);

          const delta = postBalance - preBalance;
          amount = Math.abs(delta);

          if (delta > 0) direction = "in";
          else if (delta < 0) direction = "out";
        } catch (txError) {
          console.error("Alert tx parse error:", sig.signature, txError);
          continue;
        }

        if (amount <= 0) continue;

        let severity: AlertSeverity = "info";
        let message = `${wallet.label} had JTRUMP activity`;

        if (amount >= 10_000_000) {
          severity = "critical";
          message = `Whale alert: ${wallet.label} moved ${amount.toLocaleString()} JTRUMP`;
        } else if (amount >= 1_000_000) {
          severity = "warning";
          message = `Large movement: ${wallet.label} moved ${amount.toLocaleString()} JTRUMP`;
        } else {
          severity = "info";
          message = `${wallet.label} moved ${amount.toLocaleString()} JTRUMP`;
        }

        const alertItem: AlertItem = {
          signature: sig.signature,
          timestamp: sig.blockTime || 0,
          wallet: wallet.label,
          walletAddress: wallet.address,
          category: wallet.category,
          direction,
          amount,
          severity,
          message,
        };

        alerts.push(alertItem);

        if (!hasSentAlert(sig.signature)) {
          if (severity === "critical") {
            await sendTelegramMessage(
              `🚨 *CRITICAL ALERT*\n\n${message}\n\nWallet: ${wallet.label}\nDirection: ${direction}\n\nhttps://solscan.io/tx/${sig.signature}`
            );
            markAlertSent(sig.signature);
          } else if (severity === "warning") {
            await sendTelegramMessage(
              `⚠️ *Large Movement*\n\n${message}\n\nWallet: ${wallet.label}\nDirection: ${direction}\n\nhttps://solscan.io/tx/${sig.signature}`
            );
            markAlertSent(sig.signature);
          }
        }
      }
    }

    alerts.sort((a, b) => b.timestamp - a.timestamp);

    return Response.json({
      ok: true,
      count: alerts.length,
      alerts,
    });
  } catch (error) {
    console.error("Alerts API error:", error);

    return Response.json(
      {
        ok: false,
        error: "Failed to fetch alerts",
      },
      { status: 500 }
    );
  }
}
