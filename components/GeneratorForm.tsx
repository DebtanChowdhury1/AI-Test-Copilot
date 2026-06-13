'use client'

import { useState } from 'react'
import { TestCase } from '@/lib/ai-router'

export interface FormData {
  title: string
  inputType: string
  userStory: string
  testingTypes: string[]
  priority: string
  model: string
}

interface GeneratorFormProps {
  onGenerated: (
    testCases: TestCase[],
    meta: { modelUsed: string; fallbackUsed: boolean; generationTime: number },
    formData: FormData
  ) => void
  onLoadingChange?: (loading: boolean, testingTypes?: string[]) => void
}

const INPUT_TYPES = [
  { value: 'user_story', label: 'User Story' },
  { value: 'feature_spec', label: 'Feature Spec' },
  { value: 'bug_report', label: 'Bug Report' },
]

const TESTING_TYPES = ['Functional', 'Regression', 'Edge Cases', 'Negative', 'Performance', 'Security', 'Accessibility']
const PRIORITIES = [
  { value: 'low', label: 'Low', color: '#6b7280' },
  { value: 'medium', label: 'Medium', color: '#eab308' },
  { value: 'high', label: 'High', color: '#f97316' },
  { value: 'critical', label: 'Critical', color: '#ef4444' },
]
const inputStyle = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: 'rgb(226,232,240)',
  borderRadius: '10px',
  outline: 'none',
  transition: 'all 0.2s',
  width: '100%',
}

export default function GeneratorForm({ onGenerated, onLoadingChange }: GeneratorFormProps) {
  const [title, setTitle] = useState('')
  const [inputType, setInputType] = useState('user_story')
  const [userStory, setUserStory] = useState('')
  const [testingTypes, setTestingTypes] = useState<string[]>(['Functional'])
  const [priority, setPriority] = useState('medium')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const toggleTestingType = (t: string) =>
    setTestingTypes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userStory.trim()) { setError('Please enter a user story or specification.'); return }
    setError('')
    setLoading(true)
    onLoadingChange?.(true, testingTypes)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputType, priority, testingTypes, userStory, model: 'auto' }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Generation failed')
      }
      const data = await res.json()
      onGenerated(
        data.testCases,
        { modelUsed: data.modelUsed, fallbackUsed: data.fallbackUsed, generationTime: data.generationTime },
        { title: title || 'Untitled Suite', inputType, userStory, testingTypes, priority, model: 'auto' }
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      onLoadingChange?.(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Title */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Suite Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. User Login Feature"
          className="px-3 py-2.5 text-sm placeholder:text-slate-600"
          style={inputStyle}
          onFocus={(e) => { e.target.style.borderColor = 'rgba(59,130,246,0.4)'; e.target.style.background = 'rgba(59,130,246,0.04)' }}
          onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.03)' }}
        />
      </div>

      {/* Input Type */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Input Type</label>
        <div className="flex gap-1.5 p-1 rounded-xl" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
          {INPUT_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setInputType(t.value)}
              className="flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200"
              style={inputType === t.value ? {
                background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.15))',
                color: '#93c5fd',
                border: '1px solid rgba(59,130,246,0.25)',
                boxShadow: '0 0 12px rgba(59,130,246,0.1)',
              } : { color: '#64748b', border: '1px solid transparent' }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Textarea */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
          {inputType === 'user_story' ? 'User Story' : inputType === 'feature_spec' ? 'Feature Spec' : 'Bug Report'}
        </label>
        <textarea
          value={userStory}
          onChange={(e) => setUserStory(e.target.value)}
          placeholder={
            inputType === 'user_story'
              ? 'As a user, I want to...\n\nAcceptance Criteria:\n- When I...\n- Then I should...'
              : inputType === 'feature_spec'
              ? 'Feature: Login\n\nDescription: ...\nRequirements:\n- ...'
              : 'Bug: ...\nSteps to reproduce:\n1. ...\nExpected: ...\nActual: ...'
          }
          rows={7}
          className="px-3 py-2.5 text-sm font-mono placeholder:text-slate-700 resize-y"
          style={{ ...inputStyle, lineHeight: '1.6' }}
          onFocus={(e) => { e.target.style.borderColor = 'rgba(59,130,246,0.4)'; e.target.style.background = 'rgba(59,130,246,0.03)' }}
          onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.03)' }}
        />
      </div>

      {/* Testing Types */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Testing Types</label>
        <div className="flex flex-wrap gap-1.5">
          {TESTING_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggleTestingType(t)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
              style={testingTypes.includes(t) ? {
                background: 'rgba(59,130,246,0.15)',
                color: '#93c5fd',
                border: '1px solid rgba(59,130,246,0.3)',
              } : {
                background: 'rgba(255,255,255,0.03)',
                color: '#475569',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Priority */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Priority Level</label>
        <div className="grid grid-cols-4 gap-1.5">
          {PRIORITIES.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPriority(p.value)}
              className="py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5"
              style={priority === p.value ? {
                background: `${p.color}20`,
                color: p.color,
                border: `1px solid ${p.color}40`,
              } : {
                background: 'rgba(255,255,255,0.03)',
                color: '#475569',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: priority === p.value ? p.color : '#475569' }} />
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="relative w-full py-3 rounded-xl font-semibold text-sm text-white transition-all duration-200 overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: loading ? 'rgba(59,130,246,0.5)' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
      >
        {!loading && (
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{ background: 'linear-gradient(135deg, #60a5fa, #a78bfa)' }} />
        )}
        <span className="relative flex items-center justify-center gap-2">
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating test cases...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Generate Test Cases
            </>
          )}
        </span>
      </button>
    </form>
  )
}
