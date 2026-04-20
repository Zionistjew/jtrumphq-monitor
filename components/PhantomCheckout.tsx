"use client";

export default function PhantomCheckout({ plan }: { plan: string }) {
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-white">
      <h1 className="text-3xl font-bold">Crypto Checkout</h1>
      <p className="mt-4 text-zinc-400">Plan: {plan}</p>
      <p className="mt-2 text-zinc-400">Phantom checkout component is loading.</p>
    </div>
  );
}
