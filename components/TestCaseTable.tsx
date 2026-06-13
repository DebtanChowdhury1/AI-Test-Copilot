'use client'

import { useState } from 'react'
import PriorityBadge from './PriorityBadge'
import StatusBadge from './StatusBadge'
import { TestCase } from '@/lib/ai-router'

interface TestCaseTableProps {
  testCases: TestCase[]
  editable?: boolean
  onUpdate?: (id: string, updates: Partial<TestCase>) => void
}

const STATUS_OPTIONS = [
  { value: 'not_run', label: 'Not Run' },
  { value: 'pass', label: 'Pass' },
  { value: 'fail', label: 'Fail' },
  { value: 'blocked', label: 'Blocked' },
]

const CATEGORY_ICONS: Record<string, string> = {
  positive: '✓',
  negative: '✕',
  edge_case: '◈',
}

export default function TestCaseTable({ testCases, editable = false, onUpdate }: TestCaseTableProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const toggle = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))

  if (!testCases?.length) {
    return (
      <div className="text-center py-12 text-slate-600 text-sm">No test cases yet.</div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Table header */}
      <div className="grid gap-3 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-600"
        style={{
          background: 'rgba(0,0,0,0.3)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          gridTemplateColumns: '72px 1fr 88px 96px 96px 32px',
        }}
      >
        <span>ID</span>
        <span>Test Case</span>
        <span>Category</span>
        <span>Priority</span>
        <span>Status</span>
        <span />
      </div>

      {/* Rows */}
      <div>
        {testCases.map((tc, idx) => (
          <div
            key={tc.id}
            className="animate-fade-in"
            style={{ animationDelay: `${idx * 30}ms`, borderBottom: idx < testCases.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
          >
            {/* Main row */}
            <div
              className="grid gap-3 px-4 py-3 cursor-pointer items-center transition-all duration-150 group"
              style={{
                gridTemplateColumns: '72px 1fr 88px 96px 96px 32px',
                background: expanded[tc.id] ? 'rgba(59,130,246,0.04)' : 'transparent',
              }}
              onClick={() => toggle(tc.id)}
              onMouseEnter={(e) => { if (!expanded[tc.id]) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)' }}
              onMouseLeave={(e) => { if (!expanded[tc.id]) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              {/* ID */}
              <span className="font-mono text-xs text-slate-600">{tc.id}</span>

              {/* Title */}
              <span className="text-sm text-slate-200 font-medium line-clamp-2 group-hover:text-white transition-colors">
                {tc.title}
              </span>

              {/* Category */}
              <span className="text-xs flex items-center gap-1.5">
                <span className="text-slate-600">{CATEGORY_ICONS[tc.category] ?? '·'}</span>
                <span className="text-slate-500 capitalize">{tc.category.replace('_', ' ')}</span>
              </span>

              {/* Priority */}
              <span onClick={(e) => e.stopPropagation()}>
                <PriorityBadge priority={tc.priority} />
              </span>

              {/* Status */}
              <span onClick={(e) => e.stopPropagation()}>
                {editable && onUpdate ? (
                  <select
                    value={tc.status}
                    onChange={(e) => onUpdate(tc.id, { status: e.target.value as TestCase['status'] })}
                    className="text-xs px-2 py-1 rounded-lg w-full"
                    style={{
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#94a3b8',
                      outline: 'none',
                    }}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value} style={{ background: '#0d1117' }}>{s.label}</option>
                    ))}
                  </select>
                ) : (
                  <StatusBadge status={tc.status} />
                )}
              </span>

              {/* Expand */}
              <span className="flex items-center justify-center text-slate-600 group-hover:text-slate-400 transition-colors">
                <svg
                  className="w-4 h-4 transition-transform duration-200"
                  style={{ transform: expanded[tc.id] ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </div>

            {/* Expanded detail */}
            {expanded[tc.id] && (
              <div
                className="px-4 pb-5 pt-2 animate-fade-in"
                style={{ background: 'rgba(59,130,246,0.03)', borderTop: '1px solid rgba(59,130,246,0.08)' }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
                  {tc.preconditions && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 mb-2">Preconditions</p>
                      <p className="text-slate-300 text-xs leading-relaxed">{tc.preconditions}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 mb-2">Test Steps</p>
                    <ol className="space-y-1.5">
                      {tc.steps.map((step, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                          <span className="flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-blue-400 font-semibold"
                            style={{ background: 'rgba(59,130,246,0.1)', fontSize: '10px' }}>
                            {i + 1}
                          </span>
                          <span className="leading-relaxed pt-0.5">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 mb-2">Expected Result</p>
                    <p className="text-slate-300 text-xs leading-relaxed">{tc.expectedResult}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 mb-2">Notes</p>
                    {editable && onUpdate ? (
                      <textarea
                        value={tc.notes}
                        onChange={(e) => onUpdate(tc.id, { notes: e.target.value })}
                        placeholder="Add notes..."
                        rows={2}
                        className="text-xs px-3 py-2 rounded-xl resize-none w-full placeholder:text-slate-700"
                        style={{
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(255,255,255,0.07)',
                          color: '#94a3b8',
                          outline: 'none',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <p className="text-slate-500 text-xs italic">{tc.notes || 'No notes'}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
