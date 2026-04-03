export default function MetricCard({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <div className="card">
      <div className="label">{label}</div>
      <div className="metric mt-2">{value}</div>
      {helper ? <div className="mt-2 text-sm text-zinc-400">{helper}</div> : null}
    </div>
  )
}
