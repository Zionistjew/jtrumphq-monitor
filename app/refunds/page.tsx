export default function RefundPage() {
  return (
    <main className="min-h-screen bg-black text-white px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold text-cyan-400 mb-6">
          Refund Policy
        </h1>

        <div className="space-y-6 text-zinc-300 leading-8">
          <p>
            Due to the irreversible nature of blockchain payments, all payments
            are generally final.
          </p>

          <p>
            Refund requests may be reviewed on a case-by-case basis for service
            failures.
          </p>

          <p>
            Subscription cancellations stop future billing but do not guarantee
            refunds for prior billing periods.
          </p>

          <p>
            Enterprise contracts may include separate refund terms.
          </p>

          <p>
            For support contact verify@web3mb.com
          </p>
        </div>
      </div>
    </main>
  );
}
