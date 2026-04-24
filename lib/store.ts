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

/**
 * Temporary in-memory store
 * Works on Vercel without filesystem writes
 * Later we move this fully into Supabase
 */
const db: DB = {
  payments: [],
  users: [],
  entitlements: [],
  nonces: [],
};

export function randomId(prefix: string) {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

export const store = {
  getDb(): DB {
    return db;
  },

  saveDb(updatedDb: DB) {
    db.payments = updatedDb.payments;
    db.users = updatedDb.users;
    db.entitlements = updatedDb.entitlements;
    db.nonces = updatedDb.nonces;
  },

  createPayment(payment: PaymentRecord) {
    db.payments.push(payment);
    return payment;
  },

  updatePayment(id: string, updates: Partial<PaymentRecord>) {
    const idx = db.payments.findIndex((p) => p.id === id);

    if (idx === -1) return null;

    db.payments[idx] = {
      ...db.payments[idx],
      ...updates,
    };

    return db.payments[idx];
  },

  getPaymentById(id: string) {
    return db.payments.find((p) => p.id === id) ?? null;
  },

  getPaymentBySignature(signature: string) {
    return db.payments.find((p) => p.txSignature === signature) ?? null;
  },

  getOrCreateUser(walletAddress: string, role: "admin" | "user" = "user") {
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

    return user;
  },

  getUserById(userId: string) {
    return db.users.find((u) => u.id === userId) ?? null;
  },

  getUserByWallet(walletAddress: string) {
    return (
      db.users.find(
        (u) => u.walletAddress.toLowerCase() === walletAddress.toLowerCase()
      ) ?? null
    );
  },

  createEntitlement(entitlement: EntitlementRecord) {
    db.entitlements.push(entitlement);
    return entitlement;
  },

  getActiveEntitlement(userId: string) {
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
    return db.entitlements.filter((e) => e.userId === userId);
  },

  createNonce(walletAddress: string, nonce: string) {
    db.nonces = db.nonces.filter(
      (n) => n.walletAddress.toLowerCase() !== walletAddress.toLowerCase()
    );

    db.nonces.push({
      walletAddress,
      nonce,
      createdAt: new Date().toISOString(),
    });
  },

  getNonce(walletAddress: string) {
    return (
      db.nonces.find(
        (n) => n.walletAddress.toLowerCase() === walletAddress.toLowerCase()
      ) ?? null
    );
  },

  deleteNonce(walletAddress: string) {
    db.nonces = db.nonces.filter(
      (n) => n.walletAddress.toLowerCase() !== walletAddress.toLowerCase()
    );
  },
};
