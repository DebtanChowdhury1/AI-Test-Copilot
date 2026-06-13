'use client'

import { useState } from 'react'
import { TestCase } from '@/lib/ai-router'

const CATEGORIES: TestCase['category'][] = ['positive', 'negative', 'edge_case']
const PRIORITIES: TestCase['priority'][] = ['low', 'medium', 'high', 'critical']
const ALL_TESTING_TYPES = ['Functional', 'Regression', 'Edge Cases', 'Negative', 'Performance', 'Security', 'Accessibility']

const TYPE_COLORS: Record<string, string> = {
  Functional: '#60a5fa', Regression: '#a78bfa', 'Edge Cases': '#f59e0b',
  Negative: '#f87171', Performance: '#34d399', Security: '#fb923c', Accessibility: '#c084fc',
}

const PRIORITY_COLORS: Record<string, string> = {
  low: '#6b7280', medium: '#eab308', high: '#f97316', critical: '#ef4444',
}
const CATEGORY_LABELS: Record<string, string> = {
  positive: 'Positive', negative: 'Negative', edge_case: 'Edge Case',
}

const fieldStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 9, color: 'rgb(226,232,240)', outline: 'none', fontFamily: 'inherit',
  transition: 'border-color 0.15s',
}
const labelStyle: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
  color: 'rgba(100,116,139,0.8)', marginBottom: 6, display: 'block',
}

function genId(index: number) {
  return `TC-${String(index + 1).padStart(3, '0')}`
}

function blankCase(index: number): TestCase {
  return {
    id: genId(index), title: '', category: 'positive', priority: 'medium',
    preconditions: '', steps: [''], expectedResult: '', status: 'not_run', notes: '',
  }
}

interface SuiteEditorProps {
  testCases: TestCase[]
  suiteTitle: string
  suiteId: string
  originalTestingTypes?: string[]
  onSave: (testCases: TestCase[], title: string) => void
  onCancel: () => void
  saving: boolean
}

export default function SuiteEditor({
  testCases: initial, suiteTitle: initialTitle, suiteId,
  originalTestingTypes = ['Functional'], onSave, onCancel, saving,
}: SuiteEditorProps) {
  const [title, setTitle] = useState(initialTitle)
  const [cases, setCases] = useState<TestCase[]>(initial.map((tc, i) => ({ ...tc, id: genId(i) })))
  const [expandedId, setExpandedId] = useState<string | null>(cases[0]?.id ?? null)

  // Regenerate panel state
  const [showRegen, setShowRegen] = useState(false)
  const [regenMode, setRegenMode] = useState<'replace' | 'merge'>('replace')
  const [regenTypes, setRegenTypes] = useState<string[]>(
    originalTestingTypes.length > 0 ? originalTestingTypes : ['Functional']
  )
  const [regenLoading, setRegenLoading] = useState(false)
  const [regenResult, setRegenResult] = useState<{ count: number; added: number; mode: string } | null>(null)
  const [regenError, setRegenError] = useState('')

  const toggleRegenType = (t: string) =>
    setRegenTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])

  const handleRegenerate = async () => {
    if (regenTypes.length === 0) { setRegenError('Select at least one testing type'); return }
    setRegenLoading(true)
    setRegenError('')
    setRegenResult(null)
    try {
      const res = await fetch(`/api/suites/${suiteId}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: regenMode, testingTypes: regenTypes }),
      })
      const data = await res.json()
      if (!res.ok) { setRegenError(data.error ?? 'Regeneration failed'); return }

      // Re-number IDs cleanly
      const newCases: TestCase[] = data.testCases.map((tc: TestCase, i: number) => ({
        ...tc, id: genId(i),
      }))
      setCases(newCases)
      setExpandedId(newCases[0]?.id ?? null)
      setRegenResult({
        count: newCases.length,
        added: data.addedCount,
        mode: regenMode,
      })
      setShowRegen(false)
    } catch {
      setRegenError('Network error — please try again')
    } finally {
      setRegenLoading(false)
    }
  }

  /* ── helpers ── */
  const updateCase = (id: string, patch: Partial<TestCase>) =>
    setCases(cs => cs.map(c => c.id === id ? { ...c, ...patch } : c))
  const updateStep = (id: string, si: number, val: string) =>
    setCases(cs => cs.map(c => c.id === id ? { ...c, steps: c.steps.map((s, i) => i === si ? val : s) } : c))
  const addStep = (id: string) =>
    setCases(cs => cs.map(c => c.id === id ? { ...c, steps: [...c.steps, ''] } : c))
  const removeStep = (id: string, si: number) =>
    setCases(cs => cs.map(c => c.id === id ? { ...c, steps: c.steps.filter((_, i) => i !== si) } : c))
  const deleteCase = (id: string) =>
    setCases(cs => {
      const next = cs.filter(c => c.id !== id).map((c, i) => ({ ...c, id: genId(i) }))
      setExpandedId(next[0]?.id ?? null)
      return next
    })
  const addCase = () => {
    const tc = blankCase(cases.length)
    setCases(cs => [...cs, tc])
    setExpandedId(tc.id)
  }

  return (
    <div>
      {/* ── Regenerate trigger bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button
          type="button"
          onClick={() => { setShowRegen(v => !v); setRegenResult(null); setRegenError('') }}
          style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px',
            borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
            background: showRegen ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.04)',
            border: showRegen ? '1px solid rgba(139,92,246,0.4)' : '1px solid rgba(255,255,255,0.08)',
            color: showRegen ? '#c4b5fd' : 'rgba(148,163,184,0.8)',
          }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Regenerate with AI
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
            style={{ transform: showRegen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
            <path d="M19 9l-7 7-7-7"/>
          </svg>
        </button>

        <span style={{ fontSize: 11, color: 'rgba(100,116,139,0.6)' }}>
          {cases.length} test case{cases.length !== 1 ? 's' : ''}
        </span>

        {regenResult && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 8, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', marginLeft: 'auto' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round"><path d="M5 13l4 4L19 7"/></svg>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#34d399' }}>
              {regenResult.mode === 'replace'
                ? `Replaced with ${regenResult.count} new cases`
                : `Added ${regenResult.added} new cases · ${regenResult.count} total`}
            </span>
          </div>
        )}
      </div>

      {/* ── Regenerate panel ── */}
      {showRegen && (
        <div style={{
          marginBottom: 20, borderRadius: 16, padding: '20px',
          background: 'rgba(9,12,28,0.9)', border: '1px solid rgba(139,92,246,0.25)',
          boxShadow: '0 8px 32px rgba(139,92,246,0.08)',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Regenerate Test Cases</p>
              <p style={{ fontSize: 10, color: 'rgba(100,116,139,0.7)', margin: 0 }}>Uses your original requirement — choose scope and mode</p>
            </div>
          </div>

          {/* Mode selection */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Regeneration Mode</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {([
                { value: 'replace', label: 'Replace All', desc: 'Fresh set of test cases', icon: 'M4 4l16 16M4 20L20 4' },
                { value: 'merge',   label: 'Add New',    desc: 'Keep existing + add unique new cases', icon: 'M12 5v14M5 12h14' },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRegenMode(opt.value)}
                  style={{
                    flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
                    background: regenMode === opt.value ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.03)',
                    borderColor: regenMode === opt.value ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.07)',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={regenMode === opt.value ? '#c4b5fd' : 'rgba(100,116,139,0.7)'} strokeWidth="2.5" strokeLinecap="round"><path d={opt.icon}/></svg>
                    <span style={{ fontSize: 12, fontWeight: 700, color: regenMode === opt.value ? '#c4b5fd' : 'rgba(148,163,184,0.8)' }}>{opt.label}</span>
                  </div>
                  <p style={{ fontSize: 10, color: 'rgba(100,116,139,0.7)', margin: 0 }}>{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Testing types */}
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Testing Types <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 10, color: 'rgba(100,116,139,0.5)' }}>(select which to generate)</span></label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {ALL_TESTING_TYPES.map(t => {
                const active = regenTypes.includes(t)
                const color = TYPE_COLORS[t] ?? '#93c5fd'
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleRegenType(t)}
                    style={{
                      padding: '5px 11px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                      background: active ? `${color}18` : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${active ? `${color}45` : 'rgba(255,255,255,0.07)'}`,
                      color: active ? color : 'rgba(100,116,139,0.7)',
                    }}>
                    {t}
                  </button>
                )
              })}
            </div>
          </div>

          {regenError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 12px', borderRadius: 9, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', fontSize: 12, marginBottom: 14 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
              {regenError}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => setShowRegen(false)}
              style={{ padding: '9px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'rgba(148,163,184,0.7)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={regenLoading || regenTypes.length === 0}
              style={{
                flex: 1, padding: '9px 16px', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 700, cursor: regenLoading ? 'wait' : 'pointer',
                background: regenLoading ? 'rgba(139,92,246,0.4)' : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                opacity: regenTypes.length === 0 ? 0.5 : 1,
                boxShadow: regenLoading ? 'none' : '0 0 20px rgba(139,92,246,0.3)',
                transition: 'all 0.2s',
              }}>
              {regenLoading ? (
                <>
                  <span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', display: 'inline-block', animation: 'spin-slow 0.7s linear infinite' }} />
                  Generating with AI…
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                  </svg>
                  Regenerate {regenTypes.length > 0 ? `(${regenTypes.join(', ')})` : ''}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Suite title ── */}
      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>Suite Title</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Suite title…"
          style={{ ...fieldStyle, padding: '10px 14px', fontSize: 14, fontWeight: 600 }}
          onFocus={e => { e.target.style.borderColor = 'rgba(59,130,246,0.5)' }}
          onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
        />
      </div>

      {/* ── Test case list ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {cases.map((tc) => {
          const open = expandedId === tc.id
          return (
            <div key={tc.id} style={{
              borderRadius: 16, overflow: 'hidden', transition: 'border-color 0.2s',
              background: open ? 'rgba(9,12,28,0.9)' : 'rgba(9,12,28,0.6)',
              border: `1px solid ${open ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.06)'}`,
            }}>
              {/* ── Row header ── */}
              <div
                onClick={() => setExpandedId(open ? null : tc.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', cursor: 'pointer', userSelect: 'none' }}>
                <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(100,116,139,0.6)', flexShrink: 0 }}>{tc.id}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: tc.title ? 'rgba(226,232,240,0.9)' : 'rgba(100,116,139,0.5)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {tc.title || 'Untitled test case'}
                </span>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: PRIORITY_COLORS[tc.priority], flexShrink: 0 }} />
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(100,116,139,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
                  <path d="M19 9l-7 7-7-7"/>
                </svg>
              </div>

              {/* ── Expanded editor ── */}
              {open && (
                <div style={{ padding: '0 16px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Title */}
                  <div>
                    <label style={labelStyle}>Test Case Title</label>
                    <input
                      value={tc.title}
                      onChange={e => updateCase(tc.id, { title: e.target.value })}
                      placeholder="e.g. Valid login redirects to dashboard"
                      style={{ ...fieldStyle, padding: '9px 12px', fontSize: 13 }}
                      onFocus={e => { e.target.style.borderColor = 'rgba(59,130,246,0.45)' }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
                    />
                  </div>

                  {/* Category + Priority */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Category</label>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {CATEGORIES.map(cat => (
                          <button key={cat} type="button" onClick={() => updateCase(tc.id, { category: cat })}
                            style={{ flex: 1, padding: '6px 4px', borderRadius: 8, fontSize: 10, fontWeight: 600, cursor: 'pointer', border: '1px solid', transition: 'all 0.15s',
                              background: tc.category === cat ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)',
                              color: tc.category === cat ? '#93c5fd' : 'rgba(100,116,139,0.7)',
                              borderColor: tc.category === cat ? 'rgba(59,130,246,0.35)' : 'rgba(255,255,255,0.06)',
                            }}>
                            {CATEGORY_LABELS[cat]}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Priority</label>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {PRIORITIES.map(p => (
                          <button key={p} type="button" onClick={() => updateCase(tc.id, { priority: p })}
                            style={{ flex: 1, padding: '6px 2px', borderRadius: 8, fontSize: 10, fontWeight: 600, cursor: 'pointer', border: '1px solid', transition: 'all 0.15s',
                              background: tc.priority === p ? `${PRIORITY_COLORS[p]}18` : 'rgba(255,255,255,0.03)',
                              color: tc.priority === p ? PRIORITY_COLORS[p] : 'rgba(100,116,139,0.7)',
                              borderColor: tc.priority === p ? `${PRIORITY_COLORS[p]}45` : 'rgba(255,255,255,0.06)',
                            }}>
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Preconditions */}
                  <div>
                    <label style={labelStyle}>Preconditions</label>
                    <textarea
                      value={tc.preconditions}
                      onChange={e => updateCase(tc.id, { preconditions: e.target.value })}
                      placeholder="e.g. User must be registered and not logged in"
                      rows={2}
                      style={{ ...fieldStyle, padding: '9px 12px', fontSize: 12, resize: 'vertical', lineHeight: 1.6 }}
                      onFocus={e => { e.target.style.borderColor = 'rgba(59,130,246,0.45)' }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
                    />
                  </div>

                  {/* Steps */}
                  <div>
                    <label style={labelStyle}>Test Steps</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {tc.steps.map((step, si) => (
                        <div key={si} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{ width: 20, height: 20, borderRadius: 7, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#93c5fd', flexShrink: 0 }}>{si + 1}</span>
                          <input
                            value={step}
                            onChange={e => updateStep(tc.id, si, e.target.value)}
                            placeholder={`Step ${si + 1}…`}
                            style={{ ...fieldStyle, flex: 1, padding: '7px 10px', fontSize: 12 }}
                            onFocus={e => { e.target.style.borderColor = 'rgba(59,130,246,0.45)' }}
                            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
                          />
                          {tc.steps.length > 1 && (
                            <button type="button" onClick={() => removeStep(tc.id, si)}
                              style={{ width: 24, height: 24, borderRadius: 7, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.06)', color: 'rgba(239,68,68,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.15)'; (e.currentTarget as HTMLElement).style.color = '#ef4444' }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.06)'; (e.currentTarget as HTMLElement).style.color = 'rgba(239,68,68,0.7)' }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                            </button>
                          )}
                        </div>
                      ))}
                      <button type="button" onClick={() => addStep(tc.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, border: '1px dashed rgba(59,130,246,0.25)', background: 'rgba(59,130,246,0.04)', color: 'rgba(96,165,250,0.75)', fontSize: 11, cursor: 'pointer', transition: 'all 0.15s', width: 'fit-content' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(59,130,246,0.09)'; (e.currentTarget as HTMLElement).style.color = '#93c5fd' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(59,130,246,0.04)'; (e.currentTarget as HTMLElement).style.color = 'rgba(96,165,250,0.75)' }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                        Add step
                      </button>
                    </div>
                  </div>

                  {/* Expected Result */}
                  <div>
                    <label style={labelStyle}>Expected Result</label>
                    <textarea
                      value={tc.expectedResult}
                      onChange={e => updateCase(tc.id, { expectedResult: e.target.value })}
                      placeholder="Describe the expected outcome…"
                      rows={2}
                      style={{ ...fieldStyle, padding: '9px 12px', fontSize: 12, resize: 'vertical', lineHeight: 1.6 }}
                      onFocus={e => { e.target.style.borderColor = 'rgba(59,130,246,0.45)' }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label style={labelStyle}>Notes <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'rgba(100,116,139,0.5)', fontSize: 10 }}>(optional)</span></label>
                    <input
                      value={tc.notes}
                      onChange={e => updateCase(tc.id, { notes: e.target.value })}
                      placeholder="Any additional context…"
                      style={{ ...fieldStyle, padding: '9px 12px', fontSize: 12 }}
                      onFocus={e => { e.target.style.borderColor = 'rgba(59,130,246,0.45)' }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
                    />
                  </div>

                  {/* Delete test case */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
                    <button type="button" onClick={() => deleteCase(tc.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 9, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.06)', color: 'rgba(239,68,68,0.75)', fontSize: 11, cursor: 'pointer', transition: 'all 0.15s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.12)'; (e.currentTarget as HTMLElement).style.color = '#ef4444' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.06)'; (e.currentTarget as HTMLElement).style.color = 'rgba(239,68,68,0.75)' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                      Remove test case
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Add test case ── */}
      <button type="button" onClick={addCase}
        style={{ width: '100%', padding: '12px', borderRadius: 14, border: '1px dashed rgba(59,130,246,0.25)', background: 'rgba(59,130,246,0.03)', color: 'rgba(96,165,250,0.7)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'all 0.15s', marginBottom: 24 }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(59,130,246,0.08)'; (e.currentTarget as HTMLElement).style.color = '#93c5fd'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(59,130,246,0.4)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(59,130,246,0.03)'; (e.currentTarget as HTMLElement).style.color = 'rgba(96,165,250,0.7)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(59,130,246,0.25)' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
        Add test case
      </button>

      {/* ── Save / Cancel bar ── */}
      <div style={{ display: 'flex', gap: 10, position: 'sticky', bottom: 0, padding: '16px 0 4px', background: 'linear-gradient(to top, rgba(5,7,18,1) 70%, transparent)', zIndex: 10 }}>
        <button type="button" onClick={onCancel} disabled={saving}
          style={{ flex: 1, padding: '11px', borderRadius: 13, border: '1px solid rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.04)', color: 'rgba(203,213,225,0.8)', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
          Cancel
        </button>
        <button type="button" onClick={() => onSave(cases, title)} disabled={saving}
          style={{ flex: 2, padding: '11px', borderRadius: 13, border: 'none', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'opacity 0.15s', opacity: saving ? 0.7 : 1, boxShadow: '0 0 30px rgba(59,130,246,0.25)' }}>
          {saving ? (
            <><span style={{ width: 15, height: 15, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', display: 'inline-block', animation: 'spin-slow 0.7s linear infinite' }} />Saving changes…</>
          ) : (
            <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7"/></svg>Save {cases.length} test cases</>
          )}
        </button>
      </div>
    </div>
  )
}
