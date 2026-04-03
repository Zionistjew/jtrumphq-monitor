import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "sent-alerts.json");

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(FILE_PATH)) {
    fs.writeFileSync(FILE_PATH, JSON.stringify([]), "utf8");
  }
}

export function getSentAlerts(): string[] {
  ensureFile();

  try {
    const raw = fs.readFileSync(FILE_PATH, "utf8");
    const parsed = JSON.parse(raw);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function hasSentAlert(signature: string): boolean {
  const sent = getSentAlerts();
  return sent.includes(signature);
}

export function markAlertSent(signature: string) {
  const sent = getSentAlerts();

  if (!sent.includes(signature)) {
    sent.push(signature);
    fs.writeFileSync(FILE_PATH, JSON.stringify(sent, null, 2), "utf8");
  }
}
