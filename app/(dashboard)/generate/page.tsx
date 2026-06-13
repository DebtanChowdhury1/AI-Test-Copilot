'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import GeneratorForm, { FormData } from '@/components/GeneratorForm'
import TestCaseTable from '@/components/TestCaseTable'
import ExportButtons from '@/components/ExportButtons'
import GenerationLoader from '@/components/GenerationLoader'
import { TestCase } from '@/lib/ai-router'

interface GenerationMeta {
  modelUsed: string
  fallbackUsed: boolean
  generationTime: number
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

const cardStyle = {
  background: 'rgba(9,12,28,0.7)',
  border: '1px solid rgba(255,255,255,0.06)',
  backdropFilter: 'blur(20px)',
}

export default function GeneratePage() {
  const router = useRouter()
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [meta, setMeta] = useState<GenerationMeta | null>(null)
  const [suiteId, setSuiteId] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [suiteTitle, setSuiteTitle] = useState('Untitled Suite')
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTestingTypes, setActiveTestingTypes] = useState<string[]>([])

  const handleGenerated = async (cases: TestCase[], generationMeta: GenerationMeta, formData: FormData) => {
    setIsGenerating(false)
    setTestCases(cases)
    setMeta(generationMeta)
    setSuiteId(null)
    setSaveState('saving')
    setSuiteTitle(formData.title || 'Untitled Suite')

    try {
      const res = await fetch('/api/suites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title || 'Untitled Suite',
          inputType: formData.inputType,
          inputText: formData.userStory,
          testingTypes: formData.testingTypes,
          priority: formData.priority,
          aiModel: 'Lyra AI',
          testCases: cases,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setSuiteId(data._id)
        setSaveState('saved')
        router.refresh()
        toast.success('Test suite saved to history', {
          description: `${cases.length} test cases · Lyra AI`,
        })
      } else {
        const errData = await res.json().catch(() => ({}))
        setSaveState('error')
        toast.error('Failed to save suite', {
          description: errData.error ?? `Server error ${res.status}`,
        })
      }
    } catch (err) {
      setSaveState('error')
      toast.error('Failed to save suite', {
        description: err instanceof Error ? err.message : 'Network error',
      })
    }
  }

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="mb-8 animate-fade-up">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
          <span className="text-xs text-slate-500 uppercase tracking-widest font-medium">Lyra AI · Generation</span>
        </div>
        <h1 className="text-3xl font-bold text-white">New Test Suite</h1>
        <p className="text-slate-400 mt-1 text-sm">Paste your user story and let Lyra AI generate comprehensive test cases.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ── Left: Form ── */}
        <div className="rounded-2xl p-6 animate-fade-up" style={{ ...cardStyle, animationDelay: '80ms' }}>
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.15))', border: '1px solid rgba(59,130,246,0.2)' }}>
              <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-white">Input</h2>
          </div>
          <GeneratorForm
            onGenerated={handleGenerated}
            onLoadingChange={(loading, types) => { setIsGenerating(loading); if (types) setActiveTestingTypes(types) }}
          />
        </div>

        {/* ── Right: Output ── */}
        <div className="flex flex-col gap-4 animate-fade-up" style={{ animationDelay: '160ms' }}>

          {/* ── LOADING STATE ── */}
          {isGenerating && (
            <div className="rounded-2xl overflow-hidden" style={{ ...cardStyle, border: '1px solid rgba(139,92,246,0.2)', boxShadow: '0 0 60px rgba(139,92,246,0.08)' }}>
              {/* Top gradient stripe */}
              <div style={{ height: 3, background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #a78bfa, #3b82f6)', backgroundSize: '200% 100%' }} className="animate-gradient" />
              <GenerationLoader testingTypes={activeTestingTypes} />
            </div>
          )}

          {/* ── RESULTS STATE ── */}
          {!isGenerating && testCases.length > 0 && (
            <div className="flex flex-col gap-4 animate-fade-up">
              {/* Meta banner */}
              {meta && (
                <div className="rounded-2xl p-4" style={cardStyle}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {saveState === 'saving' && (
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <span className="w-4 h-4 border-2 border-slate-600 border-t-blue-400 rounded-full animate-spin" />
                          Saving to history...
                        </div>
                      )}
                      {saveState === 'saved' && (
                        <div className="flex items-center gap-2 text-sm text-emerald-400">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Saved to history
                        </div>
                      )}
                      {saveState === 'error' && (
                        <span className="text-sm text-red-400">Save failed</span>
                      )}
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        <span className="flex items-center gap-1.5 text-violet-400 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                          Lyra AI
                        </span>
                        <span>· {(meta.generationTime / 1000).toFixed(1)}s</span>
                        <span>· {testCases.length} cases</span>
                      </div>
                    </div>
                    {saveState === 'saved' && suiteId && (
                      <button
                        onClick={() => router.push(`/suites/${suiteId}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all duration-200"
                        style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
                      >
                        View Suite
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Title + export row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{suiteTitle}</span>
                  <span className="text-xs px-2 py-0.5 rounded-lg text-blue-400"
                    style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                    {testCases.length} cases
                  </span>
                </div>
                <ExportButtons testCases={testCases} suiteTitle={suiteTitle} />
              </div>

              <TestCaseTable testCases={testCases} />
            </div>
          )}

          {/* ── EMPTY STATE ── */}
          {!isGenerating && testCases.length === 0 && (
            <div className="flex-1 rounded-2xl flex flex-col items-center justify-center text-center"
              style={{ background: 'rgba(9,12,28,0.4)', border: '1px dashed rgba(255,255,255,0.06)', minHeight: 460, padding: '60px 24px' }}>
              {/* Animated icon */}
              <div className="relative mb-8">
                <div className="animate-spin-slow" style={{ position: 'absolute', inset: -14, borderRadius: '50%', border: '1px dashed rgba(59,130,246,0.2)' }} />
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center animate-float"
                  style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.08))', border: '1px solid rgba(59,130,246,0.15)' }}>
                  <svg className="w-7 h-7 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <p className="text-base font-semibold text-slate-300 mb-2">Ready to generate</p>
              <p className="text-sm text-slate-600 max-w-xs leading-relaxed">
                Fill in the form on the left and click <span style={{ color: '#a78bfa' }}>Generate Test Cases</span>. Lyra AI will produce 8–15 structured test cases in seconds.
              </p>
              <div className="flex items-center gap-2 mt-6">
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }} className="animate-pulse" />
                <span className="text-xs text-slate-600">Lyra AI is ready</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
