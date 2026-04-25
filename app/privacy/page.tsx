export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-black text-white px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold text-cyan-400 mb-6">
          Privacy Policy
        </h1>

        <div className="space-y-6 text-zinc-300 leading-8">
          <p>
            WEB3MB collects wallet addresses, project metadata, payment records,
            and analytics data required to operate our platform.
          </p>

          <p>
            We do not sell customer data.
          </p>

          <p>
            Blockchain transactions remain publicly visible on-chain.
          </p>

          <p>
            Users are responsible for protecting their wallet credentials.
          </p>

          <p>
            WEB3MB may update this policy as regulations evolve.
          </p>
        </div>
      </div>
    </main>
  );
}
