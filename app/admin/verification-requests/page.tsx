"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type VerificationRequest = {
  id: string;
  project_slug: string;
  wallet_address: string;
  signature: string;
  message: string;
  status: string;
  created_at: string;
};

function shortAddress(address: string) {
  if (!address) return "—";
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

function shortText(value: string, start = 18, end = 18) {
  if (!value) return "—";
  if (value.length <= start + end + 3) return value;
  return `${value.slice(0, start)}...${value.slice(-end)}`;
}

export default function AdminVerificationRequestsPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function loadRequests() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/wallets/verify/pending", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to load requests");
      }

      setRequests(data.requests || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  }

  async function approveRequest(id: string) {
    try {
      setWorkingId(id);

      const res = await fetch("/api/wallets/verify/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requestId: id }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Approve failed");
      }

      await loadRequests();
    } catch (err: any) {
      alert(err?.message || "Approve failed");
    } finally {
      setWorkingId(null);
    }
  }

  async function rejectRequest(id: string) {
    try {
      setWorkingId(id);

      const res = await fetch("/api/wallets/verify/reject", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requestId: id }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Reject failed");
      }

      await loadRequests();
    } catch (err: any) {
      alert(err?.message || "Reject failed");
    } finally {
      setWorkingId(null);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <div className="mx-auto max-w-[1500px] px-4 py-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link href="/admin/create-project">
            <img
              src="/WEB3MB-L.png"
              alt="WEB3MB"
              className="h-20 w-auto object-contain"
            />
          </Link>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/create-project"
              className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold hover:bg-white/15"
            >
              Create Project
            </Link>

            <Link
              href="/transparency/leaderboard"
              className="rounded-xl border border-cyan-400/30 bg-cyan-500/15 px-4 py-3 text-sm font-bold text-cyan-100 hover:bg-cyan-500/25"
            >
              Leaderboard
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.03] p-6 shadow-2xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">
                WEB3MB Admin
              </div>

              <h1 className="mt-3 text-4xl font-black">
                Verification Requests
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-300">
                Review wallet ownership claims submitted by project owners.
                Approving a request marks the wallet as verified and improves
                transparency metrics.
              </p>
            </div>

            <button
              onClick={loadRequests}
              className="rounded-xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-bold hover:bg-white/15"
            >
              Refresh
            </button>
          </div>

          {error ? (
            <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
              {error}
            </div>
          ) : null}

          <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
            <div className="hidden grid-cols-[120px_220px_minmax(0,1fr)_150px_180px] gap-4 bg-white/[0.06] px-5 py-4 text-xs font-black uppercase tracking-[0.15em] text-zinc-400 lg:grid">
              <div>Project</div>
              <div>Wallet</div>
              <div>Message</div>
              <div>Date</div>
              <div>Actions</div>
            </div>

            <div className="divide-y divide-white/10">
              {loading ? (
                <div className="p-8 text-center text-zinc-300">
                  Loading verification requests...
                </div>
              ) : requests.length > 0 ? (
                requests.map((request) => (
                  <div
                    key={request.id}
                    className="grid gap-4 px-5 py-5 lg:grid-cols-[120px_220px_minmax(0,1fr)_150px_180px] lg:items-center"
                  >
                    <div>
                      <div className="text-xs uppercase text-zinc-500 lg:hidden">
                        Project
                      </div>

                      <Link
                        href={`/token/${request.project_slug}`}
                        className="font-black text-cyan-200 hover:underline"
                      >
                        {request.project_slug}
                      </Link>
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs uppercase text-zinc-500 lg:hidden">
                        Wallet
                      </div>

                      <div className="font-mono text-sm font-bold text-white">
                        {shortAddress(request.wallet_address)}
                      </div>

                      <div className="mt-1 break-all text-xs leading-5 text-zinc-500">
                        {request.wallet_address}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs uppercase text-zinc-500 lg:hidden">
                        Message
                      </div>

                      <div className="max-w-full break-words text-sm leading-6 text-zinc-300">
                        {request.message.slice(0, 180)}
                        {request.message.length > 180 ? "..." : ""}
                      </div>

                      <div className="mt-1 text-xs text-zinc-500">
                        Signature:
                        <span className="ml-1 font-mono">
                          {shortText(request.signature)}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs uppercase text-zinc-500 lg:hidden">
                        Date
                      </div>

                      <div className="text-xs leading-5 text-zinc-400">
                        {new Date(request.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs leading-5 text-zinc-500">
                        {new Date(request.created_at).toLocaleTimeString()}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
                      <button
                        disabled={workingId === request.id}
                        onClick={() => approveRequest(request.id)}
                        className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-black text-black hover:bg-emerald-400 disabled:cursor-wait disabled:opacity-50"
                      >
                        {workingId === request.id ? "Working..." : "Approve"}
                      </button>

                      <button
                        disabled={workingId === request.id}
                        onClick={() => rejectRequest(request.id)}
                        className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-black text-red-200 hover:bg-red-500/20 disabled:cursor-wait disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-zinc-300">
                  No pending verification requests.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
