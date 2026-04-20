import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

const mainCards = [
  {
    title: "Pricing",
    description: "Compare plans and choose the best transparency package for your project.",
    href: "/pricing",
  },
  {
    title: "Crypto Checkout",
    description: "Pay with Solana and activate access instantly.",
    href: "/checkout/crypto?plan=starter",
  },
  {
    title: "User Dashboard",
    description: "View your active plan, status, and account access.",
    href: "/dashboard",
  },
  {
    title: "Admin Login",
    description: "Access the admin area to manage projects and platform settings.",
    href: "/admin/login",
  },
  {
    title: "Create Project",
    description: "Create and manage a new token transparency project.",
    href: "/admin/create-project",
  },
  {
    title: "Transparency",
    description: "Browse public transparency dashboards and project visibility pages.",
    href: "/transparency",
  },
];

const planButtons = [
  {
    label: "Starter Checkout",
    href: "/checkout/crypto?plan=starter",
  },
  {
    label: "Pro Checkout",
    href: "/checkout/crypto?plan=pro",
  },
  {
    label: "Enterprise Checkout",
    href: "/checkout/crypto?plan=enterprise",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 flex justify-center">
            <Image
              src="/MB-TC.png"
              alt="WEB3MB Transparency Center Logo"
              width={240}
              height={120}
              priority
              unoptimized
              className="h-auto w-auto object-contain"
            />
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            WEB3MB Transparency Center
          </h1>

          <p className="mt-4 max-w-3xl text-base text-zinc-300 sm:text-lg">
            A crypto transparency SaaS platform for token monitoring, investor
            confidence, and project accountability.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {mainCards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-lg transition hover:-translate-y-1 hover:border-zinc-600 hover:bg-zinc-900"
            >
              <h2 className="text-xl font-semibold text-white">{card.title}</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                {card.description}
              </p>
              <span className="mt-5 inline-block text-sm font-medium text-cyan-400">
                Open →
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-14 rounded-3xl border border-zinc-800 bg-zinc-950/80 p-8">
          <div className="text-center">
            <h2 className="text-2xl font-semibold">Direct Plan Checkout</h2>
            <p className="mt-3 text-sm text-zinc-400">
              Jump straight into checkout for the plan you want.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {planButtons.map((plan) => (
              <Link
                key={plan.label}
                href={plan.href}
                className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-6 py-4 text-center text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20"
              >
                {plan.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
