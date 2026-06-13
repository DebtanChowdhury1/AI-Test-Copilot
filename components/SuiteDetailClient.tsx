'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import TestCaseTable from '@/components/TestCaseTable'
import ExportButtons from '@/components/ExportButtons'
import PriorityBadge from '@/components/PriorityBadge'
import SuiteEditor from '@/components/SuiteEditor'
import CoverageAnalyzer from '@/components/CoverageAnalyzer'
import { TestCase } from '@/lib/ai-router'
import { computeHealthScore } from '@/lib/health-score'

export interface SuiteData {
  _id: string
  title: string
  inputType: string
  priority: string
  aiModel: string
  testingTypes: string[]
  testCases: TestCase[]
  createdAt: string
}

const ALL_TESTING_TYPES = ['Functional', 'Regression', 'Edge Cases', 'Negative', 'Performance', 'Security', 'Accessibility']
const TYPE_COLORS: Record<string, string> = {
  Functional: '#60a5fa', Regression: '#a78bfa', 'Edge Cases': '#f59e0b',
  Negative: '#f87171', Performance: '#34d399', Security: '#fb923c', Accessibility: '#c084fc',
}

const cardStyle = {
  background: 'rgba(9,12,28,0.7)',
  border: '1px solid rgba(255,255,255,0.06)',
  backdropFilter: 'blur(20px)',
}

export default function SuiteDetailClient({ initialSuite }: { initialSuite: SuiteData }) {
  const router = useRouter()
  const id = initialSuite._id

  const [suite, setSuite] = useState<SuiteData>(initialSuite)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editSaving, setEditSaving] = useState(false)

  // Regenerate panel (top-level, no edit mode required)
  const [showRegen, setShowRegen] = useState(false)
  const [regenMode, setRegenMode] = useState<'replace' | 'merge'>('replace')
  const [regenTypes, setRegenTypes] = useState<string[]>(
    initialSuite.testingTypes?.length ? initialSuite.testingTypes : ['Functional']
  )
  const [regenLoading, setRegenLoading] = useState(false)
  const [regenError, setRegenError] = useState('')
  const [regenBanner, setRegenBanner] = useState<{ count: number; added: number; mode: string } | null>(null)
  const [gapBanner, setGapBanner]   = useState<{ added: number } | null>(null)

  const toggleRegenType = (t: string) =>
    setRegenTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])

  const handleRegenerate = async () => {
    if (regenTypes.length === 0) { setRegenError('Select at least one testing type'); return }
    setRegenLoading(true)
    setRegenError('')
    try {
      const res = await fetch(`/api/suites/${id}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: regenMode, testingTypes: regenTypes }),
      })
      const data = await res.json()
      if (!res.ok) { setRegenError(data.error ?? 'Regeneration failed'); return }

      const newCases: TestCase[] = data.testCases.map((tc: TestCase, i: number) => ({
        ...tc, id: `TC-${String(i + 1).padStart(3, '0')}`,
      }))
      setSuite(s => ({ ...s, testCases: newCases }))
      setSaved(false)
      setShowRegen(false)
      setRegenBanner({ count: newCases.length, added: data.addedCount, mode: regenMode })
      toast.success(
        regenMode === 'replace' ? `Regenerated ${newCases.length} test cases` : `Added ${data.addedCount} new cases`,
        { description: 'Click Save to persist the changes' }
      )
    } catch {
      setRegenError('Network error — please try again')
    } finally {
      setRegenLoading(false)
    }
  }

  const handleUpdate = (tcId: string, updates: Partial<TestCase>) => {
    setSuite(s => ({ ...s, testCases: s.testCases.map(tc => tc.id === tcId ? { ...tc, ...updates } : tc) }))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/suites/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testCases: suite.testCases }),
      })
      if (res.ok) {
        setSaved(true)
        setRegenBanner(null)
        setGapBanner(null)
        toast.success('Changes saved')
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error('Save failed', { description: data.error ?? `Error ${res.status}` })
      }
    } catch {
      toast.error('Save failed', { description: 'Network error' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    await fetch(`/api/suites/${id}`, { method: 'DELETE' })
    toast.success('Suite deleted')
    router.push('/suites')
  }

  const handleDuplicate = async () => {
    setDuplicating(true)
    const res = await fetch(`/api/suites/${id}/duplicate`, { method: 'POST' })
    if (res.ok) {
      const dup = await res.json()
      toast.success('Suite duplicated')
      router.push(`/suites/${dup._id}`)
    } else {
      setDuplicating(false)
    }
  }

  const handleEditSave = async (testCases: TestCase[], title: string) => {
    setEditSaving(true)
    try {
      const res = await fetch(`/api/suites/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testCases, title }),
      })
      if (res.ok) {
        const updated = await res.json()
        setSuite(updated)
        setEditMode(false)
        setRegenBanner(null)
        router.refresh()
        toast.success('Suite updated', { description: `${testCases.length} test cases saved` })
      } else {
        toast.error('Failed to save changes')
      }
    } catch {
      toast.error('Failed to save changes')
    } finally {
      setEditSaving(false)
    }
  }

  const passCount    = suite.testCases.filter(t => t.status === 'pass').length
  const failCount    = suite.testCases.filter(t => t.status === 'fail').length
  const blockedCount = suite.testCases.filter(t => t.status === 'blocked').length
  const total        = suite.testCases.length
  const progress     = total > 0 ? Math.round(((passCount + failCount + blockedCount) / total) * 100) : 0

  const health = computeHealthScore(suite.testCases)
  const r = 20, circ = 2 * Math.PI * r

  return (
    <div className="min-h-screen p-8 max-w-6xl">
      <button onClick={() => router.push('/suites')}
        className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-300 transition-colors mb-6 animate-fade-up">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        All Suites
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4 animate-fade-up" style={{ animationDelay: '60ms' }}>
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {/* Health score ring */}
          <div className="relative flex-shrink-0 w-14 h-14 mt-0.5">
            <svg className="absolute inset-0 -rotate-90" width="56" height="56" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
              <circle cx="28" cy="28" r={r} fill="none" stroke={health.color} strokeWidth="4"
                strokeDasharray={circ} strokeDashoffset={circ - (health.score / 100) * circ}
                strokeLinecap="round" style={{ filter: `drop-shadow(0 0 5px ${health.color}80)`, transition: 'stroke-dashoffset 1s ease' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs font-black leading-none" style={{ color: health.color }}>{health.grade}</span>
              <span className="text-[8px] font-bold text-slate-600 mt-0.5">{health.score}</span>
            </div>
          </div>

          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-white leading-tight truncate">{suite.title}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-lg" style={{ background: health.bgColor, border: `1px solid ${health.borderColor}`, color: health.color }}>
                {health.label}
              </span>
              <PriorityBadge priority={suite.priority} />
              <span className="text-xs px-2 py-0.5 rounded-lg text-slate-400 capitalize"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {suite.inputType?.replace('_', ' ')}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-lg font-medium"
                style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: '#c4b5fd' }}>
                Lyra AI
              </span>
              <span className="text-xs text-slate-600">
                {new Date(suite.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
          {/* ── Regenerate ── */}
          <button
            onClick={() => { setShowRegen(v => !v); setRegenError('') }}
            disabled={editMode}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 disabled:opacity-40"
            style={{
              background: showRegen ? 'rgba(139,92,246,0.18)' : 'rgba(139,92,246,0.08)',
              border: showRegen ? '1px solid rgba(139,92,246,0.45)' : '1px solid rgba(139,92,246,0.2)',
              color: showRegen ? '#c4b5fd' : '#a78bfa',
            }}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Regenerate
          </button>

          {/* ── Edit ── */}
          <button onClick={() => { setEditMode(e => !e); setShowRegen(false) }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150"
            style={{ background: editMode ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.04)', border: editMode ? '1px solid rgba(139,92,246,0.35)' : '1px solid rgba(255,255,255,0.07)', color: editMode ? '#c4b5fd' : 'rgba(148,163,184,0.7)' }}>
            {editMode
              ? <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>}
            {editMode ? 'Exit Edit' : 'Edit'}
          </button>

          {/* ── Save ── */}
          <button onClick={handleSave} disabled={saving || saved || editMode}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 disabled:opacity-60"
            style={{ background: saved ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)', border: `1px solid ${saved ? 'rgba(16,185,129,0.3)' : 'rgba(59,130,246,0.3)'}`, color: saved ? '#34d399' : '#93c5fd' }}>
            {saving
              ? <span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
              : saved
                ? <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>}
            {saving ? 'Saving...' : saved ? 'Saved' : 'Save'}
          </button>

          <button onClick={handleDuplicate} disabled={duplicating}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 disabled:opacity-60"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(148,163,184,0.7)' }}>
            {duplicating && <span className="w-3 h-3 border border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />}
            {duplicating ? 'Copying…' : 'Duplicate'}
          </button>
          <button onClick={() => setShowDelete(true)} disabled={deleting}
            className="px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 disabled:opacity-60 hover:bg-red-500/10 hover:text-red-400"
            style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: 'rgba(239,68,68,0.8)' }}>
            Delete
          </button>
        </div>
      </div>

      {/* ── Regenerate Panel ── */}
      {showRegen && (
        <div className="rounded-2xl p-5 mb-4 animate-fade-up" style={{ background: 'rgba(9,12,28,0.92)', border: '1px solid rgba(139,92,246,0.3)', boxShadow: '0 8px 40px rgba(139,92,246,0.1)' }}>
          {/* Panel header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(99,102,241,0.15))', border: '1px solid rgba(139,92,246,0.35)' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#c4b5fd" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-white">Regenerate Test Cases</p>
              <p className="text-xs text-slate-500">Uses your original requirement — AI generates fresh coverage based on selected types</p>
            </div>
            <button onClick={() => setShowRegen(false)} className="ml-auto text-slate-600 hover:text-slate-300 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          {/* Mode */}
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Mode</p>
            <div className="flex gap-2">
              {([
                { value: 'replace' as const, label: 'Replace All', desc: 'Start fresh — removes existing cases', icon: 'M4 4l16 16M4 20L20 4' },
                { value: 'merge'   as const, label: 'Add New Cases', desc: 'Keep existing + append unique new ones', icon: 'M12 5v14M5 12h14' },
              ]).map(opt => (
                <button key={opt.value} onClick={() => setRegenMode(opt.value)}
                  className="flex-1 p-3 rounded-xl border text-left transition-all duration-150"
                  style={{
                    background: regenMode === opt.value ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.03)',
                    borderColor: regenMode === opt.value ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.07)',
                  }}>
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke={regenMode === opt.value ? '#c4b5fd' : '#475569'} strokeWidth={2.5} strokeLinecap="round"><path d={opt.icon}/></svg>
                    <span className="text-xs font-bold" style={{ color: regenMode === opt.value ? '#c4b5fd' : 'rgba(148,163,184,0.7)' }}>{opt.label}</span>
                  </div>
                  <p className="text-xs text-slate-600">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Testing types */}
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Testing Types</p>
            <div className="flex flex-wrap gap-2">
              {ALL_TESTING_TYPES.map(t => {
                const active = regenTypes.includes(t)
                const color = TYPE_COLORS[t] ?? '#93c5fd'
                return (
                  <button key={t} onClick={() => toggleRegenType(t)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
                    style={{
                      background: active ? `${color}18` : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${active ? `${color}45` : 'rgba(255,255,255,0.07)'}`,
                      color: active ? color : '#475569',
                    }}>
                    {t}
                  </button>
                )
              })}
            </div>
          </div>

          {regenError && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3 text-xs"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01" strokeLinecap="round"/></svg>
              {regenError}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button onClick={() => setShowRegen(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              Cancel
            </button>
            <button onClick={handleRegenerate} disabled={regenLoading || regenTypes.length === 0}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50"
              style={{ background: regenLoading ? 'rgba(139,92,246,0.5)' : 'linear-gradient(135deg, #7c3aed, #6d28d9)', boxShadow: regenLoading ? 'none' : '0 0 24px rgba(139,92,246,0.3)' }}>
              {regenLoading ? (
                <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating with AI…</>
              ) : (
                <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                  Regenerate ({regenTypes.length} type{regenTypes.length !== 1 ? 's' : ''})</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Regen success banner */}
      {regenBanner && !showRegen && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4 animate-fade-up"
          style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)' }}>
          <svg className="w-4 h-4 text-violet-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          <span className="text-xs font-semibold text-violet-300">
            {regenBanner.mode === 'replace'
              ? `Regenerated ${regenBanner.count} test cases`
              : `Added ${regenBanner.added} new cases · ${regenBanner.count} total`}
          </span>
          <span className="text-xs text-slate-500">— click Save to persist</span>
          <button onClick={handleSave} disabled={saving}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
            {saving ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> : null}
            {saving ? 'Saving…' : 'Save now'}
          </button>
        </div>
      )}

      {/* Gap fix banner */}
      {gapBanner && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4 animate-fade-up"
          style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
          <span className="text-xs font-semibold text-emerald-300">
            {gapBanner.added} gap fix{gapBanner.added !== 1 ? 'es' : ''} added to suite
          </span>
          <span className="text-xs text-slate-500">— click Save to persist · open Edit to complete any skeleton steps</span>
          <button onClick={handleSave} disabled={saving}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            {saving ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> : null}
            {saving ? 'Saving…' : 'Save now'}
          </button>
          <button onClick={() => setGapBanner(null)} className="text-slate-600 hover:text-slate-300 transition-colors ml-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      )}

      {/* Progress */}
      <div className="rounded-2xl p-5 mb-5 animate-fade-up" style={{ ...cardStyle, animationDelay: '120ms' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-white">Execution Progress</span>
            <span className="text-2xl font-bold" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {progress}%
            </span>
          </div>
          <ExportButtons testCases={suite.testCases} suiteTitle={suite.title} />
        </div>
        <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }} />
        </div>
        <div className="flex gap-5 text-xs">
          {[
            { label: 'Pass', value: passCount, color: '#34d399' },
            { label: 'Fail', value: failCount, color: '#f87171' },
            { label: 'Blocked', value: blockedCount, color: '#fb923c' },
            { label: 'Not Run', value: total - passCount - failCount - blockedCount, color: '#475569' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
              <span className="font-semibold" style={{ color: s.color }}>{s.value}</span>
              <span className="text-slate-600">{s.label}</span>
            </div>
          ))}
          <span className="ml-auto text-slate-600">{total} total</span>
        </div>
      </div>

      {/* ── AI Coverage Probe ── */}
      {!editMode && (
        <div className="rounded-2xl p-5 mb-5 animate-fade-up" style={{ animationDelay: '200ms', background: 'rgba(9,12,28,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-bold text-white">Coverage Intelligence</p>
              <p className="text-xs text-slate-500 mt-0.5">Let Lyra AI find what&apos;s missing — scenarios that could break in production</p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs" style={{ background: health.bgColor, border: `1px solid ${health.borderColor}` }}>
              <span className="font-black" style={{ color: health.color }}>{health.grade}</span>
              <span className="text-slate-500 font-medium">{health.score}/100</span>
              <span className="text-slate-600">·</span>
              <span className="font-semibold" style={{ color: health.color }}>{health.label}</span>
            </div>
          </div>
          <CoverageAnalyzer
            suiteId={id}
            existingCount={suite.testCases.length}
            onAddTestCases={(newCases) => {
              setSuite(s => ({
                ...s,
                testCases: [
                  ...s.testCases,
                  ...newCases.map((tc, i) => ({
                    ...tc,
                    id: `TC-${String(s.testCases.length + i + 1).padStart(3, '0')}`,
                  })),
                ],
              }))
              setSaved(false)
              setGapBanner(prev => ({ added: (prev?.added ?? 0) + newCases.length }))
            }}
          />
        </div>
      )}

      {/* Edit panel */}
      {editMode && (
        <div className="rounded-2xl p-6 mb-5 animate-fade-up" style={{ background: 'rgba(9,12,28,0.85)', border: '1px solid rgba(139,92,246,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ width: 30, height: 30, borderRadius: 10, background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(59,130,246,0.15))', border: '1px solid rgba(139,92,246,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
              </svg>
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Edit Suite</p>
              <p style={{ fontSize: 11, color: 'rgba(100,116,139,0.7)', margin: 0 }}>Modify test cases, steps, priority and category</p>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 8, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa', display: 'inline-block', animation: 'pulse-glow 1.5s ease-in-out infinite' }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: '#c4b5fd' }}>Edit Mode</span>
            </div>
          </div>
          <SuiteEditor
            testCases={suite.testCases}
            suiteTitle={suite.title}
            suiteId={id}
            originalTestingTypes={suite.testingTypes}
            onSave={handleEditSave}
            onCancel={() => setEditMode(false)}
            saving={editSaving}
          />
        </div>
      )}

      {/* Table */}
      {!editMode && (
        <div className="animate-fade-up" style={{ animationDelay: '180ms' }}>
          <TestCaseTable testCases={suite.testCases} editable onUpdate={handleUpdate} />
        </div>
      )}

      {/* Delete modal */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6 animate-fade-up"
            style={{ background: 'rgba(9,12,28,0.97)', border: '1px solid rgba(239,68,68,0.2)', boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="font-semibold text-white mb-1">Delete this suite?</h3>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              <span className="text-slate-300 font-medium">&quot;{suite.title}&quot;</span> and all {total} test cases will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(false)} disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/10 transition-all disabled:opacity-50"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-80"
                style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                {deleting ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Deleting…</> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
