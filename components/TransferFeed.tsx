const MOCK = [
  { when: 'Just now', label: 'Treasury 1', action: 'No new large transfers detected' },
  { when: '1h ago', label: 'Liquidity Pool', action: 'No outbound LP movement detected' },
]

export default function TransferFeed() {
  return (
    <div className="card">
      <h2 className="mb-4 text-xl font-semibold">Recent Activity</h2>
      <div className="space-y-3">
        {MOCK.map((item, idx) => (
          <div key={idx} className="rounded-xl border border-zinc-800 p-3">
            <div className="text-sm text-zinc-400">{item.when}</div>
            <div className="font-medium">{item.label}</div>
            <div className="text-sm">{item.action}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
