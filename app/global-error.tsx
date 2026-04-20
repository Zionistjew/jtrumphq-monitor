"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main className="min-h-screen bg-black px-4 py-12 text-white">
          <div className="mx-auto max-w-2xl rounded-2xl border border-red-800 bg-zinc-950 p-6">
            <h1 className="text-3xl font-bold">Application Error</h1>
            <p className="mt-4 text-red-300">
              {error?.message || "Unknown error"}
            </p>
            <button
              onClick={() => reset()}
              className="mt-6 rounded-xl bg-white px-4 py-3 font-semibold text-black"
            >
              Reload
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
