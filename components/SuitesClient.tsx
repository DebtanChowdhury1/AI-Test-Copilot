'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'

export interface Suite {
  _id: string
  title: string
  aiModel: string
  testCaseCount: number
  priority: string
  createdAt: string
  inputType: string
  healthScore?: number
  testingTypes?: string[]
}

function gradeFromScore(s: number) {
  return s >= 92 ? { grade: 'A+', color: '#10b981', bgColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.25)' } :
         s >= 82 ? { grade: 'A',  color: '#10b981', bgColor: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.2)' } :
         s >= 72 ? { grade: 'B+', color: '#3b82f6', bgColor: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.25)' } :
         s >= 62 ? { grade: 'B',  color: '#3b82f6', bgColor: 'rgba(59,130,246,0.08)', borderColor: 'rgba(59,130,246,0.2)' } :
         s >= 50 ? { grade: 'C+', color: '#eab308', bgColor: 'rgba(234,179,8,0.08)', borderColor: 'rgba(234,179,8,0.2)' } :
         s >= 38 ? { grade: 'C',  color: '#f97316', bgColor: 'rgba(249,115,22,0.08)', borderColor: 'rgba(249,115,22,0.2)' } :
         s >= 22 ? { grade: 'D',  color: '#ef4444', bgColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' } :
                   { grade: '—',  color: '#475569', bgColor: 'rgba(71,85,105,0.06)', borderColor: 'rgba(71,85,105,0.1)' }
}

const cardStyle = {
  background: 'rgba(9,12,28,0.7)',
  border: '1px solid rgba(255,255,255,0.06)',
  backdropFilter: 'blur(20px)',
}

const INPUT_TYPE_LABELS: Record<string, string> = {
  user_story: 'Story',
  feature_spec: 'Spec',
  bug_report: 'Bug',
}

export default function SuitesClient({ initialSuites }: { initialSuites: Suite[] }) {
  const router = useRouter()
  const [suites, setSuites] = useState<Suite[]>(initialSuites)
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteTitle, setDeleteTitle] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await fetch(`/api/suites/${id}`, { method: 'DELETE' })
      setSuites(prev => prev.filter(s => s._id !== id))
      toast.success('Suite deleted')
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeleteId(null)
      setDeletingId(null)
    }
  }

  const handleDuplicate = async (id: string, title: string) => {
    setDuplicatingId(id)
    try {
      const res = await fetch(`/api/suites/${id}/duplicate`, { method: 'POST' })
      if (res.ok) {
        router.refresh()
        toast.success(`Duplicated "${title}"`)
      }
    } catch {
      toast.error('Failed to duplicate')
    } finally {
      setDuplicatingId(null)
    }
  }

  const filtered = suites.filter(s => s.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 animate-fade-up">
        <div>
          <h1 className="text-3xl font-bold text-white">Test Suites</h1>
          <p className="text-slate-400 mt-1 text-sm">
            {suites.length} suite{suites.length !== 1 ? 's' : ''} in your library
          </p>
        </div>
        <Link href="/generate"
          className="relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white overflow-hidden group transition-all duration-200"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #60a5fa, #a78bfa)' }} />
          <svg className="relative w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span className="relative">New Suite</span>
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6 animate-fade-up" style={{ animationDelay: '60ms' }}>
        <div className="relative max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Search suites..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 outline-none"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }} />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl p-16 text-center animate-fade-up"
          style={{ background: 'rgba(9,12,28,0.4)', border: '1px dashed rgba(255,255,255,0.07)' }}>
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center animate-float"
            style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.12)' }}>
            <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="font-semibold text-white mb-1">{search ? 'No suites match' : 'No suites yet'}</h3>
          {!search && (
            <Link href="/generate" className="text-sm text-blue-400 hover:text-blue-300 transition-colors mt-1 inline-block">
              Generate your first suite →
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((suite, i) => {
            const g = gradeFromScore(suite.healthScore ?? 0)
            return (
            <div key={suite._id}
              className="rounded-2xl p-5 group animate-fade-up transition-all duration-200 glass-hover hover:-translate-y-0.5 relative"
              style={{ ...cardStyle, animationDelay: `${i * 50}ms` }}>

              {/* Health grade badge */}
              <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-1 rounded-xl text-xs"
                style={{ background: g.bgColor, border: `1px solid ${g.borderColor}` }}>
                <span className="font-black text-xs" style={{ color: g.color }}>{g.grade}</span>
                {(suite.healthScore ?? 0) > 0 && <span className="font-medium" style={{ color: '#475569' }}>{suite.healthScore}</span>}
              </div>

              <button onClick={() => router.push(`/suites/${suite._id}`)} className="w-full text-left">
                <div className="flex items-start gap-3 mb-3 pr-14">
                  <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5"
                    style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.15)' }}>
                    <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-sm text-slate-200 group-hover:text-white transition-colors line-clamp-2 leading-snug flex-1 min-w-0">
                    {suite.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-lg text-blue-400 font-semibold"
                    style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
                    {suite.testCaseCount} cases
                  </span>
                  {(suite.testingTypes ?? []).slice(0, 2).map(t => (
                    <span key={t} className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                      style={{ background: 'rgba(255,255,255,0.04)', color: '#64748b', border: '1px solid rgba(255,255,255,0.05)' }}>
                      {t.split(' ')[0]}
                    </span>
                  ))}
                  <span className="text-xs text-slate-600 ml-auto">
                    {new Date(suite.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </button>

              <div className="flex gap-1 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <button onClick={() => handleDuplicate(suite._id, suite.title)} disabled={duplicatingId === suite._id}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all duration-150 disabled:opacity-60"
                  style={{ background: duplicatingId === suite._id ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.02)', color: duplicatingId === suite._id ? '#93c5fd' : 'rgba(100,116,139,0.8)', border: duplicatingId === suite._id ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent' }}>
                  {duplicatingId === suite._id
                    ? <span className="w-3 h-3 border border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                    : <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
                  {duplicatingId === suite._id ? 'Copying…' : 'Duplicate'}
                </button>
                <button onClick={() => { setDeleteId(suite._id); setDeleteTitle(suite.title) }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all duration-150 ml-auto hover:bg-red-500/10 hover:text-red-400"
                  style={{ color: 'rgba(239,68,68,0.6)' }}>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          )})}
        </div>
      )}

      {/* Delete modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6 animate-fade-up"
            style={{ background: 'rgba(9,12,28,0.95)', border: '1px solid rgba(239,68,68,0.2)', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="font-semibold text-white mb-1">Delete suite?</h3>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              <span className="text-slate-300 font-medium">&quot;{deleteTitle}&quot;</span> and all its test cases will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} disabled={!!deletingId}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors disabled:opacity-50"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteId!)} disabled={deletingId === deleteId}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-80"
                style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                {deletingId === deleteId
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Deleting…</>
                  : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
