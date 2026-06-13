type Priority = 'low' | 'medium' | 'high' | 'critical'

const config: Record<Priority, { label: string; color: string; bg: string; border: string }> = {
  critical: { label: 'Critical', color: '#f87171', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)' },
  high:     { label: 'High',     color: '#fb923c', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.25)' },
  medium:   { label: 'Medium',   color: '#facc15', bg: 'rgba(234,179,8,0.1)',  border: 'rgba(234,179,8,0.25)' },
  low:      { label: 'Low',      color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.2)' },
}

export default function PriorityBadge({ priority }: { priority: string }) {
  const c = config[priority as Priority] ?? config.medium
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
