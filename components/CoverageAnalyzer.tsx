'use client'

import { useState } from 'react'
import type { CoverageAnalysis, CoverageGap } from '@/app/api/suites/[id]/analyze/route'
import type { TestCase } from '@/lib/ai-router'

const SEVERITY_CONFIG = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)',  label: 'Critical' },
  high:     { color: '#f97316', bg: 'rgba(249,115,22,0.1)',  border: 'rgba(249,115,22,0.25)', label: 'High' },
  medium:   { color: '#eab308', bg: 'rgba(234,179,8,0.1)',   border: 'rgba(234,179,8,0.25)',  label: 'Medium' },
  low:      { color: '#6b7280', bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.2)', label: 'Low' },
}

const COVERAGE_LABELS: Record<string, string> = {
  functional: 'Functional', regression: 'Regression', edgeCases: 'Edge Cases',
  negative: 'Negative', performance: 'Performance', security: 'Security', accessibility: 'Accessibility',
}

const STATUS_COLORS = {
  strong:  '#10b981',
  partial: '#eab308',
  missing: '#1e293b',
}

const RISK_CONFIG = {
  low:      { color: '#10b981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)',  label: 'Low Risk' },
  medium:   { color: '#eab308', bg: 'rgba(234,179,8,0.1)',   border: 'rgba(234,179,8,0.25)',   label: 'Medium Risk' },
  high:     { color: '#f97316', bg: 'rgba(249,115,22,0.1)',  border: 'rgba(249,115,22,0.25)',  label: 'High Risk' },
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)',    label: 'Critical Risk' },
}

function gapToSkeletonCase(gap: CoverageGap, index: number): TestCase {
  const sevPriority: Record<string, TestCase['priority']> = {
    critical: 'critical', high: 'high', medium: 'medium', low: 'low',
  }
  const cat: TestCase['category'] =
    gap.severity === 'critical' || gap.severity === 'high' ? 'negative' : 'edge_case'

  return {
    id: `TC-NEW-${index + 1}`,
    title: gap.suggestedTitle,
    category: cat,
    priority: sevPriority[gap.severity] ?? 'medium',
    preconditions: '',
    steps: ['', '', ''],
    expectedResult: '',
    status: 'not_run',
    notes: `Coverage gap — ${gap.area}: ${gap.description}`,
  }
}

interface Props {
  suiteId: string
  existingCount: number
  onAddTestCases: (cases: TestCase[]) => void
}

export default function CoverageAnalyzer({ suiteId, existingCount, onAddTestCases }: Props) {
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<CoverageAnalysis | null>(null)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)

  // Per-gap state
  const [addedGaps, setAddedGaps] = useState<Set<number>>(new Set())
  const [fixingGap, setFixingGap] = useState<number | null>(null)

  // Fix-all state
  const [fixingAll, setFixingAll] = useState(false)
  const [fixAllDone, setFixAllDone] = useState(false)

  const runAnalysis = async () => {
    setLoading(true)
    setError('')
    setAddedGaps(new Set())
    setFixAllDone(false)
    try {
      const res = await fetch(`/api/suites/${suiteId}/analyze`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Analysis failed'); return }
      setAnalysis(data)
      setOpen(true)
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  // Quick add (skeleton, no AI) for a single gap
  const handleAddGap = (gap: CoverageGap, idx: number) => {
    const tc = gapToSkeletonCase(gap, existingCount + addedGaps.size)
    onAddTestCases([tc])
    setAddedGaps(prev => new Set(prev).add(idx))
  }

  // AI Fix single gap
  const handleAIFixGap = async (gap: CoverageGap, idx: number) => {
    setFixingGap(idx)
    try {
      const res = await fetch(`/api/suites/${suiteId}/fix-gaps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gaps: [gap] }),
      })
      const data = await res.json()
      if (!res.ok) { return }
      const newCases: TestCase[] = data.testCases.map((tc: TestCase, i: number) => ({
        ...tc, id: `TC-${String(existingCount + addedGaps.size + i + 1).padStart(3, '0')}`,
      }))
      onAddTestCases(newCases)
      setAddedGaps(prev => new Set(prev).add(idx))
    } catch { /* silent */ }
    finally { setFixingGap(null) }
  }

  // AI Fix ALL gaps
  const handleFixAll = async () => {
    if (!analysis?.gaps.length) return
    const unresolved = analysis.gaps.filter((_, i) => !addedGaps.has(i))
    if (!unresolved.length) return
    setFixingAll(true)
    try {
      const res = await fetch(`/api/suites/${suiteId}/fix-gaps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gaps: unresolved }),
      })
      const data = await res.json()
      if (!res.ok) return
      const newCases: TestCase[] = data.testCases.map((tc: TestCase, i: number) => ({
        ...tc, id: `TC-${String(existingCount + i + 1).padStart(3, '0')}`,
      }))
      onAddTestCases(newCases)
      // Mark all as added
      const all = new Set(analysis.gaps.map((_, i) => i))
      setAddedGaps(all)
      setFixAllDone(true)
    } catch { /* silent */ }
    finally { setFixingAll(false) }
  }

  const coverageEntries = analysis
    ? Object.entries(analysis.coverageMap) as [string, 'strong' | 'partial' | 'missing'][]
    : []

  const unresolvedCount = analysis
    ? analysis.gaps.filter((_, i) => !addedGaps.has(i)).length
    : 0

  return (
    <div>
      {/* Trigger */}
      <button onClick={runAnalysis} disabled={loading}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-60"
        style={{
          background: loading ? 'rgba(139,92,246,0.1)' : 'linear-gradient(135deg,rgba(139,92,246,0.2),rgba(99,102,241,0.15))',
          border: '1px solid rgba(139,92,246,0.35)', color: '#c4b5fd',
          boxShadow: loading ? 'none' : '0 0 20px rgba(139,92,246,0.15)',
        }}>
        {loading ? (
          <><span className="w-4 h-4 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />Analyzing coverage…</>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M11 8v6M8 11h6"/>
            </svg>
            {analysis ? 'Re-analyze Coverage' : 'AI Coverage Probe'}
          </>
        )}
      </button>

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      {/* Panel */}
      {analysis && open && (
        <div className="mt-4 rounded-2xl overflow-hidden animate-fade-up"
          style={{ background: 'rgba(9,12,28,0.97)', border: '1px solid rgba(139,92,246,0.2)', boxShadow: '0 16px 60px rgba(0,0,0,0.6)' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(139,92,246,0.04)' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.3),rgba(99,102,241,0.2))', border: '1px solid rgba(139,92,246,0.4)' }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#c4b5fd" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M11 8v6M8 11h6"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-white">Coverage Analysis</p>
                <p className="text-xs text-slate-500">
                  {unresolvedCount > 0
                    ? `${unresolvedCount} gap${unresolvedCount !== 1 ? 's' : ''} remaining — fix them to improve your health score`
                    : 'All gaps addressed ✓'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold"
                style={{ background: RISK_CONFIG[analysis.riskLevel].bg, border: `1px solid ${RISK_CONFIG[analysis.riskLevel].border}`, color: RISK_CONFIG[analysis.riskLevel].color }}>
                ⚠ {RISK_CONFIG[analysis.riskLevel].label}
              </span>
              <button onClick={() => setOpen(false)} className="text-slate-600 hover:text-slate-300 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Summary */}
            <p className="text-sm text-slate-300 leading-relaxed px-4 py-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {analysis.summary}
            </p>

            {/* Coverage map */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Coverage Map</p>
              <div className="grid grid-cols-7 gap-2">
                {coverageEntries.map(([key, status]) => {
                  const col = STATUS_COLORS[status]
                  return (
                    <div key={key} className="flex flex-col items-center gap-1.5">
                      <div className="w-full h-2 rounded-full relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <div className="absolute inset-0 rounded-full" style={{ background: status !== 'missing' ? col : 'transparent', boxShadow: status === 'strong' ? `0 0 8px ${col}60` : 'none' }} />
                      </div>
                      <span className="text-[9px] font-semibold text-center" style={{ color: status === 'missing' ? '#1e3a5f' : col }}>
                        {COVERAGE_LABELS[key]?.split(' ')[0]}
                      </span>
                      <span className="text-[8px] capitalize font-medium" style={{ color: status === 'strong' ? col : status === 'partial' ? '#eab308' : '#1e293b' }}>
                        {status}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Strengths */}
            {analysis.strengths.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#10b981' }}>✓ Strengths</p>
                <div className="space-y-1.5">
                  {analysis.strengths.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-400 leading-relaxed px-3 py-2 rounded-xl"
                      style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.1)' }}>
                      <svg className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gaps section */}
            {analysis.gaps.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#f97316' }}>⚡ Coverage Gaps — What Could Break</p>
                    <p className="text-[10px] text-slate-600 mt-0.5">Fix each gap individually or let AI generate all fixes at once</p>
                  </div>

                  {/* Fix All button */}
                  {unresolvedCount > 0 && (
                    <button onClick={handleFixAll} disabled={fixingAll}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex-shrink-0 disabled:opacity-60"
                      style={{
                        background: fixingAll ? 'rgba(139,92,246,0.15)' : 'linear-gradient(135deg,rgba(139,92,246,0.25),rgba(99,102,241,0.2))',
                        border: '1px solid rgba(139,92,246,0.4)', color: '#c4b5fd',
                        boxShadow: fixingAll ? 'none' : '0 0 16px rgba(139,92,246,0.2)',
                      }}>
                      {fixingAll
                        ? <><span className="w-3.5 h-3.5 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />Generating fixes…</>
                        : <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>AI Fix All {unresolvedCount} Gap{unresolvedCount !== 1 ? 's' : ''}</>}
                    </button>
                  )}

                  {fixAllDone && unresolvedCount === 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                      style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#34d399' }}>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                      All gaps fixed — Save your suite
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {analysis.gaps.map((gap: CoverageGap, i) => {
                    const cfg = SEVERITY_CONFIG[gap.severity]
                    const isAdded = addedGaps.has(i)
                    const isFixing = fixingGap === i

                    return (
                      <div key={i} className="rounded-xl overflow-hidden transition-all duration-300"
                        style={{ background: isAdded ? 'rgba(16,185,129,0.04)' : 'rgba(255,255,255,0.02)', border: `1px solid ${isAdded ? 'rgba(16,185,129,0.2)' : cfg.border}` }}>
                        <div className="flex items-start gap-3 p-4">
                          {/* Severity icon */}
                          <div className="flex-shrink-0 mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center"
                            style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                            {isAdded
                              ? <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={2.5} strokeLinecap="round"><path d="M5 13l4 4L19 7"/></svg>
                              : <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke={cfg.color} strokeWidth={2.5} strokeLinecap="round"><path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
                          </div>

                          <div className="flex-1 min-w-0">
                            {/* Gap header */}
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className="text-xs font-bold" style={{ color: isAdded ? '#34d399' : cfg.color }}>{gap.area}</span>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
                                style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                                {gap.severity}
                              </span>
                              {isAdded && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
                                  style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}>
                                  ✓ Added to suite
                                </span>
                              )}
                            </div>

                            {/* Description */}
                            <p className="text-xs text-slate-400 leading-relaxed mb-3">{gap.description}</p>

                            {/* Suggested test case */}
                            <div className="flex items-start gap-2 mb-3 p-2.5 rounded-lg"
                              style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
                              <svg className="w-3 h-3 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                              <span className="text-[11px] text-blue-300 font-medium leading-relaxed">{gap.suggestedTitle}</span>
                            </div>

                            {/* Action buttons */}
                            {!isAdded && (
                              <div className="flex gap-2 flex-wrap">
                                {/* Quick add — skeleton case */}
                                <button onClick={() => handleAddGap(gap, i)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
                                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(148,163,184,0.9)' }}>
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                                  Add skeleton
                                </button>

                                {/* AI Fix — complete test case */}
                                <button onClick={() => handleAIFixGap(gap, i)} disabled={isFixing || fixingAll}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 disabled:opacity-60"
                                  style={{ background: isFixing ? 'rgba(139,92,246,0.1)' : 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#c4b5fd' }}>
                                  {isFixing
                                    ? <><span className="w-3 h-3 border border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />Generating…</>
                                    : <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>AI Fix this</>}
                                </button>
                              </div>
                            )}

                            {isAdded && (
                              <p className="text-xs text-emerald-400 font-medium">
                                Test case added — go to Edit mode to complete the steps, then Save.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
