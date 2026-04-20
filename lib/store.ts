import fs from "fs";
import path from "path";
import crypto from "crypto";
import type { PlanKey } from "./plans";

export type PaymentStatus =
  | "pending"
  | "submitted"
  | "confirmed"
  | "expired"
  | "failed";

export type PaymentRecord = {
  id: string;
  plan: PlanKey;
  amountSol: number;
  amountLamports: number;
  recipientWallet: string;
  expectedSenderWallet?: string;
  txSignature?: string;
  reference: string;
  memo: string;
  status: PaymentStatus;
  userId?: string;
  createdAt: string;
  expiresAt: string;
  confirmedAt?: string;
};

export type UserRecord = {
  id: string;
  walletAddress: string;
  role: "admin" | "user";
  createdAt: string;
};

export type EntitlementRecord = {
  id: string;
  userId: string;
  plan: PlanKey;
  status: "active" | "expired" | "cancelled";
  sourcePaymentId: string;
  startsAt: string;
  endsAt?: string;
};

export type NonceRecord = {
  walletAddress: string;
  nonce: string;
  createdAt: string;
};

type DB = {
  payments: PaymentRecord[];
  users: UserRecord[];
  entitlements: EntitlementRecord[];
  nonces: NonceRecord[];
};

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_PATH = path.join(DATA_DIR, "db.json");

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_PATH)) {
    const initial: DB = {
      payments: [],
      users: [],
      entitlements: [],
      nonces: [],
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), "utf-8");
  }
}

function readDb(): DB {
  ensureDb();
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(raw) as DB;
}

function writeDb(db: DB) {
  ensureDb();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

export function randomId(prefix: string) {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

export const store = {
  getDb(): DB {
    return readDb();
  },

  saveDb(db: DB) {
    writeDb(db);
  },

  createPayment(payment: PaymentRecord) {
    const db = readDb();
    db.payments.push(payment);
    writeDb(db);
    return payment;
  },

  updatePayment(id: string, updates: Partial<PaymentRecord>) {
    const db = readDb();
    const idx = db.payments.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    db.payments[idx] = { ...db.payments[idx], ...updates };
    writeDb(db);
    return db.payments[idx];
  },

  getPaymentById(id: string) {
    const db = readDb();
    return db.payments.find((p) => p.id === id) ?? null;
  },

  getPaymentBySignature(signature: string) {
    const db = readDb();
    return db.payments.find((p) => p.txSignature === signature) ?? null;
  },

  getOrCreateUser(walletAddress: string, role: "admin" | "user" = "user") {
    const db = readDb();
    const existing = db.users.find(
      (u) => u.walletAddress.toLowerCase() === walletAddress.toLowerCase()
    );
    if (existing) return existing;

    const user: UserRecord = {
      id: randomId("user"),
      walletAddress,
      role,
      createdAt: new Date().toISOString(),
    };

    db.users.push(user);
    writeDb(db);
    return user;
  },

  getUserById(userId: string) {
    const db = readDb();
    return db.users.find((u) => u.id === userId) ?? null;
  },

  getUserByWallet(walletAddress: string) {
    const db = readDb();
    return (
      db.users.find(
        (u) => u.walletAddress.toLowerCase() === walletAddress.toLowerCase()
      ) ?? null
    );
  },

  createEntitlement(entitlement: EntitlementRecord) {
    const db = readDb();
    db.entitlements.push(entitlement);
    writeDb(db);
    return entitlement;
  },

  getActiveEntitlement(userId: string) {
    const db = readDb();
    const now = Date.now();

    return (
      db.entitlements.find((e) => {
        if (e.userId !== userId) return false;
        if (e.status !== "active") return false;
        if (!e.endsAt) return true;
        return new Date(e.endsAt).getTime() > now;
      }) ?? null
    );
  },

  getUserEntitlements(userId: string) {
    const db = readDb();
    return db.entitlements.filter((e) => e.userId === userId);
  },

  createNonce(walletAddress: string, nonce: string) {
    const db = readDb();
    db.nonces = db.nonces.filter(
      (n) => n.walletAddress.toLowerCase() !== walletAddress.toLowerCase()
    );
    db.nonces.push({
      walletAddress,
      nonce,
      createdAt: new Date().toISOString(),
    });
    writeDb(db);
  },

  getNonce(walletAddress: string) {
    const db = readDb();
    return (
      db.nonces.find(
        (n) => n.walletAddress.toLowerCase() === walletAddress.toLowerCase()
      ) ?? null
    );
  },

  deleteNonce(walletAddress: string) {
    const db = readDb();
    db.nonces = db.nonces.filter(
      (n) => n.walletAddress.toLowerCase() !== walletAddress.toLowerCase()
    );
    writeDb(db);
  },
};
