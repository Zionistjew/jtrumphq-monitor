import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function requireEnv(name: string, value: string | undefined) {
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function getSupabaseAdmin() {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL", supabaseUrl),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY", supabaseServiceRoleKey),
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );
}

export async function createPaymentRecord(input: {
  projectSlug?: string;
  plan: string;
  token: "USDC" | "SOL";
  amount: number;
  amountUsd: number;
  destinationWallet: string;
}) {
  const supabase = getSupabaseAdmin();
  const reference = randomUUID();

  const { data, error } = await supabase
    .from("payments")
    .insert({
      project_slug: input.projectSlug || null,
      plan: input.plan,
      chain: "solana",
      token: input.token,
      amount: input.amount,
      amount_usd: input.amountUsd,
      destination_wallet: input.destinationWallet,
      reference,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw new Error(`createPaymentRecord failed: ${error.message}`);
  return data;
}

export async function getPaymentById(paymentId: string) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("payment_id", paymentId)
    .single();

  if (error) throw new Error(`getPaymentById failed: ${error.message}`);
  return data;
}

export async function getPaymentByReference(reference: string) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("reference", reference)
    .single();

  if (error) throw new Error(`getPaymentByReference failed: ${error.message}`);
  return data;
}

export async function markPaymentConfirmed(input: {
  paymentId: string;
  payerWallet?: string;
  txSignature: string;
}) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("payments")
    .update({
      status: "confirmed",
      payer_wallet: input.payerWallet || null,
      tx_signature: input.txSignature,
      confirmed_at: new Date().toISOString(),
    })
    .eq("payment_id", input.paymentId)
    .select()
    .single();

  if (error) throw new Error(`markPaymentConfirmed failed: ${error.message}`);
  return data;
}
