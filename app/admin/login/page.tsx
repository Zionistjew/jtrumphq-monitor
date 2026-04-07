"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/admin/create-project";

  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Login failed.");
      }

      router.push(nextPath);
      router.refresh();
    } catch (error: any) {
      setErrorMessage(error?.message || "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-md rounded-3xl border border-neutral-800 bg-neutral-950 p-6">
        <p className="inline-block rounded-full border border-red-700 px-4 py-1 text-xs uppercase tracking-[0.3em] text-red-300">
          Admin Access
        </p>

        <h1 className="mt-4 text-3xl font-bold">Admin Login</h1>
        <p className="mt-2 text-neutral-400">
          Enter your admin password to continue.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm text-neutral-300">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 outline-none focus:border-red-700"
              placeholder="Enter admin password"
            />
          </div>

          {errorMessage && (
            <div className="rounded-2xl border border-red-800 bg-red-950/40 px-4 py-3 text-red-300">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-red-700 px-6 py-3 font-medium text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </main>
  );
}
