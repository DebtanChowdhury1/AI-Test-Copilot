'use client'

import { useState, useEffect, useRef } from 'react'

const STAGES = [
  { label: 'Parsing requirements', sub: 'Reading story context & constraints', color: '#60a5fa', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { label: 'Mapping test dimensions', sub: 'Identifying edge cases & coverage gaps', color: '#a78bfa', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
  { label: 'Generating test cases', sub: 'Building scenarios with Lyra AI', color: '#f59e0b', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { label: 'Validating & formatting', sub: 'Quality check and final structure', color: '#34d399', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
]

const TYPE_META: Record<string, { color: string; icon: string }> = {
  Functional:    { color: '#60a5fa', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  Regression:    { color: '#a78bfa', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
  'Edge Cases':  { color: '#f59e0b', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
  Negative:      { color: '#f87171', icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' },
  Performance:   { color: '#34d399', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  Security:      { color: '#fb923c', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  Accessibility: { color: '#c084fc', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
}

function Particle({ duration, radius }: { duration: number; radius: number }) {
  return (
    <div style={{ position: 'absolute', top: '50%', left: '50%', width: radius * 2, height: radius * 2, marginLeft: -radius, marginTop: -radius, borderRadius: '50%', animation: `spin-slow ${duration}s linear infinite` }}>
      <div style={{ position: 'absolute', top: 0, left: '50%', marginLeft: -3, marginTop: -3, width: 6, height: 6, borderRadius: '50%', background: 'rgba(139,92,246,0.7)', boxShadow: '0 0 8px rgba(139,92,246,0.9)' }} />
    </div>
  )
}

interface Props {
  testingTypes?: string[]
}

export default function GenerationLoader({ testingTypes = [] }: Props) {
  const [stage, setStage] = useState(0)
  const [tick, setTick] = useState(0)
  const [visibleTypes, setVisibleTypes] = useState<number>(0)
  const stageTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const delays = [2500, 2500, 3000]
    let cur = 0
    const advance = () => {
      if (cur < delays.length) {
        stageTimer.current = setTimeout(() => { cur++; setStage(cur); advance() }, delays[cur])
      }
    }
    advance()
    const tickT = setInterval(() => setTick(t => t + 1), 500)
    return () => {
      if (stageTimer.current) clearTimeout(stageTimer.current)
      clearInterval(tickT)
    }
  }, [])

  /* Stagger-reveal the type chips */
  useEffect(() => {
    if (!testingTypes.length) return
    setVisibleTypes(0)
    testingTypes.forEach((_, i) => {
      setTimeout(() => setVisibleTypes(v => Math.max(v, i + 1)), 180 + i * 120)
    })
  }, [testingTypes])

  const dots = ['', '.', '..', '...'][tick % 4]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '44px 24px 40px', minHeight: 480, position: 'relative', overflow: 'hidden' }}>
      {/* Ambient glow */}
      <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(30px)' }} />

      {/* ── Testing types header ── */}
      {testingTypes.length > 0 && (
        <div style={{ width: '100%', maxWidth: 380, marginBottom: 28 }}>
          {/* Section label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
            <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.3))' }} />
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(139,92,246,0.7)' }}>Running Analysis For</span>
            <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, rgba(139,92,246,0.3), transparent)' }} />
          </div>

          {/* Type chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {testingTypes.map((type, i) => {
              const meta = TYPE_META[type] ?? { color: '#94a3b8', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2' }
              const visible = i < visibleTypes
              return (
                <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 30, border: `1px solid ${meta.color}30`, background: `${meta.color}0e`, opacity: visible ? 1 : 0, transform: visible ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(6px)', transition: 'opacity 0.35s ease, transform 0.35s ease', boxShadow: visible ? `0 0 16px ${meta.color}18` : 'none' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={meta.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={meta.icon} />
                  </svg>
                  <span style={{ fontSize: 11, fontWeight: 700, color: meta.color, letterSpacing: '0.02em' }}>{type}</span>
                  {/* Animated active dot */}
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: meta.color, display: 'block', animation: 'pulse-glow 1.2s ease-in-out infinite', boxShadow: `0 0 6px ${meta.color}` }} />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Spinner ── */}
      <div style={{ position: 'relative', width: 120, height: 120, marginBottom: 28, flexShrink: 0 }}>
        <div className="animate-spin-slow" style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(139,92,246,0.25)', borderTopColor: 'rgba(139,92,246,0.85)', borderRightColor: 'rgba(59,130,246,0.5)' }} />
        <div className="animate-spin-slow" style={{ position: 'absolute', inset: 10, borderRadius: '50%', border: '1px solid rgba(59,130,246,0.2)', borderBottomColor: 'rgba(59,130,246,0.75)', borderLeftColor: 'rgba(139,92,246,0.4)', animationDirection: 'reverse', animationDuration: '2.2s' }} />
        <div className="animate-pulse-glow" style={{ position: 'absolute', inset: 22, borderRadius: '50%', border: '1px solid rgba(139,92,246,0.35)' }} />
        <Particle duration={3.5} radius={60} />
        <Particle duration={4.5} radius={50} />
        <Particle duration={5.5} radius={60} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 50, height: 50, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(139,92,246,0.25))', border: '1px solid rgba(139,92,246,0.3)', boxShadow: '0 0 24px rgba(139,92,246,0.2)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <defs>
                <linearGradient id="lg-anim" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#60a5fa" /><stop offset="100%" stopColor="#a78bfa" />
                </linearGradient>
              </defs>
              <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="url(#lg-anim)" />
            </svg>
          </div>
        </div>
      </div>

      {/* Title */}
      <p style={{ fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 4, letterSpacing: '-0.02em' }}>
        Lyra AI is working{dots}
      </p>
      <p style={{ fontSize: 12, color: 'rgba(100,116,139,0.7)', marginBottom: 24 }}>
        Generating comprehensive test cases
      </p>

      {/* ── Stage list ── */}
      <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {STAGES.map((s, i) => {
          const isDone = i < stage
          const isActive = i === stage
          const isPending = i > stage
          return (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 13px', borderRadius: 13, background: isActive ? 'rgba(139,92,246,0.07)' : isDone ? 'rgba(52,211,153,0.04)' : 'rgba(255,255,255,0.02)', border: `1px solid ${isActive ? 'rgba(139,92,246,0.22)' : isDone ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.04)'}`, opacity: isPending ? 0.38 : 1, transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)' }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: isDone ? 'rgba(52,211,153,0.1)' : isActive ? `${s.color}12` : 'rgba(255,255,255,0.03)', border: `1px solid ${isDone ? 'rgba(52,211,153,0.22)' : isActive ? `${s.color}28` : 'rgba(255,255,255,0.05)'}` }}>
                {isDone ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                ) : isActive ? (
                  <span className="animate-spin" style={{ display: 'block', width: 13, height: 13, borderRadius: '50%', border: `2px solid ${s.color}28`, borderTopColor: s.color }} />
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(100,116,139,0.45)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={s.icon} /></svg>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: isDone ? '#34d399' : isActive ? 'white' : 'rgba(100,116,139,0.65)', margin: 0 }}>{s.label}</p>
                {isActive && <p style={{ fontSize: 10, color: 'rgba(100,116,139,0.6)', marginTop: 1 }}>{s.sub}</p>}
              </div>
              {!isDone && !isActive && <span style={{ fontSize: 9, color: 'rgba(100,116,139,0.35)', fontFamily: 'monospace', letterSpacing: '0.05em' }}>0{i + 1}</span>}
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#a78bfa', display: 'block' }} className="animate-pulse" />
        <span style={{ fontSize: 10, color: 'rgba(100,116,139,0.5)' }}>Estimated time: 6–12 seconds</span>
      </div>
    </div>
  )
}
