type Status = 'not_run' | 'pass' | 'fail' | 'blocked'

const config: Record<Status, { label: string; color: string; bg: string; border: string }> = {
  pass:    { label: 'Pass',    color: '#34d399', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)' },
  fail:    { label: 'Fail',    color: '#f87171', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)' },
  blocked: { label: 'Blocked', color: '#fb923c', bg: 'rgba(249,115,22,0.1)',  border: 'rgba(249,115,22,0.25)' },
  not_run: { label: 'Not Run', color: '#64748b', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.2)' },
}

export default function StatusBadge({ status }: { status: string }) {
  const c = config[status as Status] ?? config.not_run
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-medium"
      style={{ color: c.color, background: c.bg, border: `1px solid ${c.border}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }} />
      {c.label}
    </span>
  )
}
