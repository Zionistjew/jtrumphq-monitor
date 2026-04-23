import nodemailer from "nodemailer";

export type CriticalAlertNotificationInput = {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  projectSlug: string;
  projectName: string;
  projectSymbol: string;
  walletLabel?: string | null;
  walletAddress?: string | null;
  walletCategory?: string | null;
  value?: string | null;
  variancePct?: number | null;
  createdAt: string;
  firstSeenAt?: string | null;
  lastSeenAt?: string | null;
  occurrenceCount?: number | null;
};

function hasTelegramConfig() {
  console.log("========== TELEGRAM ENV DEBUG ==========");
  console.log("TELEGRAM_BOT_TOKEN exists:", !!process.env.TELEGRAM_BOT_TOKEN);
  console.log("TELEGRAM_CHAT_ID exists:", !!process.env.TELEGRAM_CHAT_ID);
  console.log("========================================");

  return Boolean(
    process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID
  );
}

function hasSmtpConfig() {
  console.log("============ SMTP ENV DEBUG ============");
  console.log("SMTP_HOST exists:", !!process.env.SMTP_HOST);
  console.log("SMTP_PORT exists:", !!process.env.SMTP_PORT);
  console.log("SMTP_USER exists:", !!process.env.SMTP_USER);
  console.log("SMTP_PASS exists:", !!process.env.SMTP_PASS);
  console.log("SMTP_FROM exists:", !!process.env.SMTP_FROM);
  console.log("========================================");

  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.SMTP_FROM
  );
}

function buildAlertText(alert: CriticalAlertNotificationInput) {
  return `
🚨 WEB3MB CRITICAL ALERT

Project: ${alert.projectName} (${alert.projectSymbol})
Slug: ${alert.projectSlug}

Severity: ${alert.severity.toUpperCase()}
Title: ${alert.title}

Message:
${alert.message}

Wallet Label: ${alert.walletLabel || "N/A"}
Wallet Category: ${alert.walletCategory || "N/A"}
Wallet Address: ${alert.walletAddress || "N/A"}

Value: ${alert.value || "N/A"}
Variance: ${alert.variancePct ?? "N/A"}%

Created: ${alert.createdAt}
First Seen: ${alert.firstSeenAt || "N/A"}
Last Seen: ${alert.lastSeenAt || "N/A"}

Occurrence Count: ${alert.occurrenceCount ?? 1}

WEB3MB Compliance Engine
  `.trim();
}

async function sendTelegram(text: string) {
  if (!hasTelegramConfig()) {
    return {
      ok: false,
      skipped: true,
      reason: "telegram_not_configured",
    };
  }

  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN!;
    const chatId = process.env.TELEGRAM_CHAT_ID!;

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Telegram API Error: ${JSON.stringify(data)}`);
    }

    console.log("✅ Telegram alert sent successfully");

    return {
      ok: true,
      skipped: false,
      channel: "telegram",
    };
  } catch (error: any) {
    console.error("❌ Telegram notification failed:", error.message);

    return {
      ok: false,
      skipped: false,
      channel: "telegram",
      error: error?.message || "Telegram notification failed",
    };
  }
}

async function sendEmail(subject: string, text: string) {
  if (!hasSmtpConfig()) {
    return {
      ok: false,
      skipped: true,
      reason: "smtp_not_configured",
      channel: "email",
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST!,
      port: Number(process.env.SMTP_PORT!),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM!,
      to: "verify@web3mb.com",
      subject,
      text,
    });

    console.log("✅ Email alert sent successfully");

    return {
      ok: true,
      skipped: false,
      channel: "email",
    };
  } catch (error: any) {
    console.error("❌ Email notification failed:", error.message);

    return {
      ok: false,
      skipped: false,
      channel: "email",
      error: error?.message || "Email notification failed",
    };
  }
}

export async function notifyCriticalAlert(
  alert: CriticalAlertNotificationInput
) {
  const subject = `[WEB3MB Critical Alert] ${alert.projectName}`;
  const text = buildAlertText(alert);

  const telegramResult = await sendTelegram(text);
  const emailResult = await sendEmail(subject, text);

  const telegramSent = telegramResult.ok === true;
  const emailSent = emailResult.ok === true;

  if (telegramSent || emailSent) {
    const statusParts: string[] = [];

    if (telegramSent) {
      statusParts.push("telegram_sent");
    } else if ((telegramResult as any).skipped) {
      statusParts.push("telegram_skipped");
    } else {
      statusParts.push("telegram_failed");
    }

    if (emailSent) {
      statusParts.push("email_sent");
    } else if ((emailResult as any).skipped) {
      statusParts.push("email_skipped");
    } else {
      statusParts.push("email_failed");
    }

    const errorParts = [telegramResult, emailResult]
      .map((result: any) => result.error)
      .filter(Boolean);

    return {
      ok: true,
      status: statusParts.join(","),
      error: errorParts.length ? errorParts.join(" | ") : undefined,
    };
  }

  const allErrors = [telegramResult, emailResult]
    .map((result: any) => result.error || result.reason)
    .filter(Boolean);

  return {
    ok: false,
    status: "notification_failed",
    error: allErrors.length
      ? allErrors.join(" | ")
      : "Neither Telegram nor SMTP succeeded.",
  };
}
