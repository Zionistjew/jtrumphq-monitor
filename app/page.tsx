"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl space-y-8">

        <div>
          <h1 className="text-4xl font-bold">JTRUMPHQ Dashboard</h1>
          <p className="mt-2 text-neutral-400">
            Control center for payments, transparency, and token tracking.
          </p>
        </div>

        {/* NAV GRID */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          {/* PRICING */}
          <Link href="/pricing" className="card">
            <h2>💰 Pricing</h2>
            <p>View plans and start checkout</p>
          </Link>

          {/* CHECKOUT */}
          <Link href="/checkout/crypto?plan=starter" className="card">
            <h2>🚀 Start Checkout</h2>
            <p>Begin crypto payment flow</p>
          </Link>

          {/* TRANSPARENCY */}
          <Link href="/transparency" className="card">
            <h2>📊 Transparency</h2>
            <p>View wallet activity</p>
          </Link>

          {/* ALERTS */}
          <Link href="/alerts" className="card">
            <h2>🚨 Alerts</h2>
            <p>Monitor system alerts</p>
          </Link>

          {/* TOKEN */}
          <Link href="/token/test-alpha" className="card">
            <h2>🪙 Token Dashboard</h2>
            <p>View a token project</p>
          </Link>

          {/* ADMIN */}
          <Link href="/admin/create-project" className="card">
            <h2>🔐 Admin</h2>
            <p>Create new project</p>
          </Link>

        </div>
      </div>

      {/* STYLES */}
      <style jsx>{`
        .card {
          border: 1px solid #262626;
          border-radius: 20px;
          padding: 20px;
          background: #0a0a0a;
          transition: all 0.2s ease;
        }
        .card:hover {
          border-color: #ef4444;
          transform: translateY(-4px);
        }
        .card h2 {
          font-size: 18px;
          font-weight: 600;
        }
        .card p {
          margin-top: 6px;
          color: #a3a3a3;
          font-size: 14px;
        }
      `}</style>
    </main>
  );
}
