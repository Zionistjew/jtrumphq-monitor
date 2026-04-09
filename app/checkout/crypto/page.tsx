"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function CheckoutInner() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "starter";
  const token = searchParams.get("token") || "USDC";

  const [payment, setPayment] = useState<any>(null);
  const [signature, setSignature] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function createPayment() {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan, token }),
      });

      const json = await res.json();
      setPayment(json);
      setLoading(false);
    }

    createPayment();
  }, [plan, token]);

  async function verifyPayment() {
    setStatus("Verifying...");

    const res = await fetch("/api/payments/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reference: payment.reference,
        signature,
      }),
    });

    const json = await res.json();

    if (json.ok) {
      setStatus("✅ Payment verified!");
    } else {
      setStatus("❌ Payment failed");
    }
  }

  if (loading) {
    return <p>Loading checkout...</p>;
  }

  return (
    <div>
      <h1>Crypto Checkout</h1>

      <p>Plan: {plan}</p>
      <p>Token: {token}</p>
      <p>Amount: {payment.amount}</p>

      <p>Send payment to:</p>
      <p>{payment.address}</p>

      <p>Reference:</p>
      <p>{payment.reference}</p>

      {/* 🔥 THIS IS WHAT YOU ARE MISSING IN PRODUCTION */}
      <div style={{ marginTop: 20 }}>
        <input
          placeholder="Paste transaction signature"
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
        />

        <button onClick={verifyPayment}>
          Verify Payment
        </button>

        <p>{status}</p>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p>Loading checkout...</p>}>
      <CheckoutInner />
    </Suspense>
  );
}
