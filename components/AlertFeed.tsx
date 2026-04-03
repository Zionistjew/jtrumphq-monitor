const ALERTS = [
  { severity: 'info', message: 'Telegram alerts configured after env setup.' },
  { severity: 'info', message: 'Admin auth uses Phantom signed message verification.' },
]

export default function AlertFeed() {
  return (
    <div className="card">
      <h2 className="mb-4 text-xl font-semibold">Alerts</h2>
      <div className="space-y-3">
        {ALERTS.map((a, idx) => (
          <div key={idx} className="rounded-xl border border-zinc-800 p-3">
            <div className="text-xs uppercase tracking-wide text-zinc-400">{a.severity}</div>
            <div>{a.message}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
