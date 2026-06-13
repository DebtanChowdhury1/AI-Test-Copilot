'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import AppLogo from './AppLogo'

/* ────────────────────────────────────────────
   HOOKS
──────────────────────────────────────────── */
function useReveal(threshold = 0.18) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true) },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

function useTyped(text: string, visible: boolean, speed = 28) {
  const [out, setOut] = useState('')
  const idx = useRef(0)
  useEffect(() => {
    if (!visible) return
    idx.current = 0
    setOut('')
    const id = setInterval(() => {
      if (idx.current < text.length) {
        idx.current++
        setOut(text.slice(0, idx.current))
      } else clearInterval(id)
    }, speed)
    return () => clearInterval(id)
  }, [visible, text, speed])
  return out
}

function useCountUp(target: number, visible: boolean, delay = 0) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!visible) return
    const t = setTimeout(() => {
      const dur = 1600
      const start = Date.now()
      const tick = () => {
        const p = Math.min((Date.now() - start) / dur, 1)
        const e = 1 - Math.pow(1 - p, 3)
        setVal(Math.round(e * target))
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, delay)
    return () => clearTimeout(t)
  }, [visible, target, delay])
  return val
}

/* ────────────────────────────────────────────
   SHARED ATOMS
──────────────────────────────────────────── */
const P = { perspective: 1400 }

function FlowArrow({ color = '#3b82f6', active }: { color?: string; active: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 auto', width: 2, gap: 0 }}>
      <div style={{
        width: 2, height: active ? 80 : 0, background: `linear-gradient(180deg, transparent, ${color}80, ${color})`,
        transition: 'height 1s ease', position: 'relative', overflow: 'visible',
      }}>
        {active && [0, 1, 2].map(i => (
          <div key={i} style={{
            position: 'absolute', left: -4, width: 10, height: 10, borderRadius: '50%',
            background: color, boxShadow: `0 0 12px ${color}`,
            animation: `dotFlow 1.6s linear ${i * 0.52}s infinite`,
          }} />
        ))}
      </div>
      <div style={{
        width: 0, height: 0,
        borderLeft: '6px solid transparent', borderRight: '6px solid transparent',
        borderTop: `8px solid ${color}`,
        opacity: active ? 0.8 : 0, transition: 'opacity 1s ease 0.5s',
      }} />
    </div>
  )
}

function StagePill({ n, label, color, active }: { n: string; label: string; color: string; active: boolean }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '5px 14px 5px 8px', borderRadius: 100,
      background: active ? `${color}18` : 'rgba(255,255,255,0.04)',
      border: `1px solid ${active ? color + '45' : 'rgba(255,255,255,0.07)'}`,
      transition: 'all 0.4s',
    }}>
      <span style={{ width: 22, height: 22, borderRadius: '50%', background: active ? color : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: active ? '#fff' : 'rgba(255,255,255,0.3)', transition: 'all 0.4s', flexShrink: 0 }}>{n}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: active ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.3)', letterSpacing: '0.04em', transition: 'color 0.4s' }}>{label}</span>
    </div>
  )
}

/* ────────────────────────────────────────────
   STAGE 1 — INPUT
──────────────────────────────────────────── */
const STORY = `As a registered user, I want to log in to the
platform using my email and password so that
I can access my personal dashboard and manage
my test suites securely.`

function StageInput({ visible }: { visible: boolean }) {
  const typed = useTyped(STORY, visible, 22)
  const done = typed.length >= STORY.length

  const entities = [
    { label: 'Actor', value: 'Registered User', color: '#60a5fa' },
    { label: 'Action', value: 'Log In', color: '#a78bfa' },
    { label: 'Input', value: 'Email + Password', color: '#34d399' },
    { label: 'Goal', value: 'Access Dashboard', color: '#f59e0b' },
    { label: 'Constraint', value: 'Secure Auth', color: '#f87171' },
  ]

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', ...P }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center' }}>

        {/* 3D document card */}
        <div style={{
          transform: visible ? 'rotateY(12deg) rotateX(3deg)' : 'rotateY(12deg) rotateX(3deg) translateY(50px)',
          opacity: visible ? 1 : 0, transition: 'all 1s cubic-bezier(0.22,1,0.36,1)',
          transformStyle: 'preserve-3d',
        }}>
          <div style={{ borderRadius: 18, background: 'rgba(9,12,28,0.92)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 30px 70px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)', overflow: 'hidden' }}>
            {/* Chrome */}
            <div style={{ background: 'rgba(5,7,18,0.8)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
              {['#ef4444','#f59e0b','#22c55e'].map((c,i) => <div key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: c, opacity: 0.5 }} />)}
              <span style={{ marginLeft: 8, fontSize: 10, color: 'rgba(148,163,184,0.5)', fontWeight: 500 }}>user-story.txt</span>
            </div>
            <div style={{ padding: '18px 20px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6"/></svg>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#60a5fa', letterSpacing: '0.1em' }}>USER STORY INPUT</span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(226,232,240,0.85)', lineHeight: 1.75, fontFamily: 'monospace', margin: 0, minHeight: 88, whiteSpace: 'pre-line' }}>
                {typed}
                {!done && <span style={{ display: 'inline-block', width: 2, height: 14, background: '#60a5fa', marginLeft: 2, verticalAlign: 'middle' }} className="animate-pulse" />}
              </p>
            </div>
          </div>
        </div>

        {/* Entity extraction */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(148,163,184,0.6)', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 6px' }}>AI Extracts →</p>
          {entities.map((e, i) => (
            <div key={e.label} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 11,
              background: `${e.color}0d`, border: `1px solid ${e.color}2e`,
              opacity: done ? 1 : 0, transform: done ? 'translateX(0)' : 'translateX(30px)',
              transition: `all 0.5s cubic-bezier(0.22,1,0.36,1) ${i * 0.1}s`,
            }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: e.color, width: 60, flexShrink: 0 }}>{e.label}</span>
              <div style={{ width: 1, height: 20, background: `${e.color}30` }} />
              <span style={{ fontSize: 12, color: 'rgba(226,232,240,0.85)', fontWeight: 500 }}>{e.value}</span>
              <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: e.color, boxShadow: `0 0 8px ${e.color}` }} className="animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────
   STAGE 2 — AI CORE
──────────────────────────────────────────── */
const MODULES = [
  { label: 'Functional', sub: 'Core user flows', angle: -90, color: '#60a5fa', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { label: 'Security', sub: 'Auth & injection', angle: -30, color: '#f87171', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
  { label: 'Edge Cases', sub: 'Boundary inputs', angle: 30, color: '#f59e0b', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
  { label: 'Regression', sub: 'Existing flows', angle: 90, color: '#a78bfa', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
  { label: 'Performance', sub: 'Load & timing', angle: 150, color: '#34d399', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { label: 'UX Flow', sub: 'User journey', angle: 210, color: '#fb923c', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0' },
]

function AICore({ visible }: { visible: boolean }) {
  const R = 210
  const [scanAngle, setScanAngle] = useState(0)
  useEffect(() => {
    if (!visible) return
    let frame: number
    let a = 0
    const tick = () => { a = (a + 1.2) % 360; setScanAngle(a); frame = requestAnimationFrame(tick) }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [visible])

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', ...P }}>
      <div style={{
        opacity: visible ? 1 : 0, transform: visible ? 'rotateX(8deg)' : 'rotateX(8deg) translateY(60px)',
        transition: 'all 1s cubic-bezier(0.22,1,0.36,1)',
        transformStyle: 'preserve-3d',
      }}>
        {/* Outer container */}
        <div style={{ borderRadius: 28, background: 'rgba(7,10,24,0.85)', border: '1px solid rgba(59,130,246,0.15)', padding: '60px 40px', position: 'relative', overflow: 'hidden', boxShadow: '0 50px 100px rgba(0,0,0,0.6), 0 0 80px rgba(59,130,246,0.08)' }}>

          {/* Background grid */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', width: 480, height: 480, margin: '0 auto' }}>

            {/* Connection lines */}
            {MODULES.map((m, i) => {
              const rad = (m.angle + 90) * Math.PI / 180
              const x2 = 240 + R * Math.cos(rad)
              const y2 = 240 + R * Math.sin(rad)
              const len = Math.sqrt(Math.pow(x2 - 240, 2) + Math.pow(y2 - 240, 2))
              const lineAngle = Math.atan2(y2 - 240, x2 - 240) * 180 / Math.PI
              return (
                <div key={i} style={{
                  position: 'absolute', left: 240, top: 240, width: len - 54, height: 1,
                  transformOrigin: 'left center',
                  transform: `rotate(${lineAngle}deg)`,
                  background: `linear-gradient(90deg, ${m.color}50, ${m.color}15)`,
                  opacity: visible ? 1 : 0, transition: `opacity 0.4s ease ${0.3 + i * 0.08}s`,
                }}>
                  {visible && [0, 1].map(j => (
                    <div key={j} style={{
                      position: 'absolute', top: -2, left: 0, width: 16, height: 5, borderRadius: 3,
                      background: `linear-gradient(90deg, transparent, ${m.color})`,
                      animation: `beamFlow ${1.8 + i * 0.15}s linear ${j * 0.9 + i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              )
            })}

            {/* Radar sweep */}
            {visible && (
              <div style={{ position: 'absolute', left: 240, top: 240, width: 100, height: 1, transformOrigin: 'left center', transform: `rotate(${scanAngle}deg)`, background: 'linear-gradient(90deg, rgba(96,165,250,0.6), transparent)', pointerEvents: 'none' }} />
            )}

            {/* Outer rings */}
            <div className="animate-spin-slow" style={{ position: 'absolute', inset: 20, borderRadius: '50%', border: '1px dashed rgba(59,130,246,0.2)' }} />
            <div className="animate-spin-slow" style={{ position: 'absolute', inset: 50, borderRadius: '50%', border: '1px dashed rgba(139,92,246,0.25)', animationDirection: 'reverse', animationDuration: '10s' }} />

            {/* Module cards positioned in a circle */}
            {MODULES.map((m, i) => {
              const rad = (m.angle + 90) * Math.PI / 180
              const x = 240 + R * Math.cos(rad)
              const y = 240 + R * Math.sin(rad)
              return (
                <div key={i} style={{
                  position: 'absolute', left: x - 54, top: y - 38, width: 108, height: 76,
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'scale(1)' : 'scale(0.6)',
                  transition: `all 0.55s cubic-bezier(0.34,1.56,0.64,1) ${0.4 + i * 0.1}s`,
                }}>
                  <div style={{ borderRadius: 12, background: 'rgba(9,12,28,0.9)', border: `1px solid ${m.color}30`, padding: '8px 10px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', boxShadow: `0 8px 24px rgba(0,0,0,0.4), 0 0 20px ${m.color}10` }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={m.color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 5 }}>
                      <path d={m.icon} />
                    </svg>
                    <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.85)', margin: '0 0 2px', textAlign: 'center' }}>{m.label}</p>
                    <p style={{ fontSize: 8.5, color: 'rgba(148,163,184,0.55)', margin: 0, textAlign: 'center' }}>{m.sub}</p>
                  </div>
                </div>
              )
            })}

            {/* Centre logo */}
            <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', zIndex: 10 }}>
              <div style={{
                width: 110, height: 110, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'radial-gradient(circle, rgba(59,130,246,0.18), rgba(139,92,246,0.1) 60%, transparent)',
                position: 'relative',
                opacity: visible ? 1 : 0, transform: visible ? 'scale(1)' : 'scale(0)',
                transition: 'all 0.8s cubic-bezier(0.34,1.56,0.64,1) 0.3s',
              }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1.5px solid rgba(59,130,246,0.35)' }} className="animate-pulse" />
                <AppLogo size={66} id="core2" />
              </div>
              <p style={{ textAlign: 'center', marginTop: 8, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', background: 'linear-gradient(90deg,#60a5fa,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>LYRA AI</p>
            </div>
          </div>

          {/* Processing chips at bottom */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
            {['Parsing context', 'Identifying scenarios', 'Building test matrix', 'Scoring coverage'].map((label, i) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 100,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                opacity: visible ? 1 : 0, transition: `opacity 0.5s ease ${0.8 + i * 0.12}s`,
              }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#34d399' }} className="animate-pulse" />
                <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.75)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────
   STAGE 3 — TEST CASE CASCADE
──────────────────────────────────────────── */
const CASES = [
  { id: 'TC01', title: 'Successful login redirects to dashboard', type: 'Functional', priority: 'High', color: '#60a5fa', steps: 3 },
  { id: 'TC02', title: 'Invalid password shows error message', type: 'Negative', priority: 'High', color: '#f87171', steps: 4 },
  { id: 'TC03', title: 'Account locked after 5 failed attempts', type: 'Security', priority: 'Critical', color: '#ef4444', steps: 6 },
  { id: 'TC04', title: 'SQL injection in email field sanitized', type: 'Security', priority: 'Critical', color: '#f87171', steps: 3 },
  { id: 'TC05', title: 'Session persists after browser refresh', type: 'Regression', priority: 'Medium', color: '#a78bfa', steps: 4 },
  { id: 'TC06', title: 'Empty fields trigger validation errors', type: 'Edge Case', priority: 'Medium', color: '#f59e0b', steps: 3 },
  { id: 'TC07', title: '"Remember me" sets 30-day session', type: 'Functional', priority: 'Low', color: '#60a5fa', steps: 5 },
  { id: 'TC08', title: 'Login page loads under 2 seconds', type: 'Performance', priority: 'High', color: '#34d399', steps: 2 },
]

function StageCascade({ visible }: { visible: boolean }) {
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', ...P }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {CASES.map((c, i) => (
          <div key={c.id} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 13,
            background: 'rgba(9,12,28,0.85)', border: `1px solid ${c.color}25`,
            boxShadow: `0 8px 24px rgba(0,0,0,0.35)`,
            opacity: visible ? 1 : 0,
            transform: visible
              ? 'perspective(800px) rotateX(0deg) translateY(0)'
              : `perspective(800px) rotateX(-20deg) translateY(-30px)`,
            transition: `all 0.55s cubic-bezier(0.22,1,0.36,1) ${0.1 + i * 0.12}s`,
          }}>
            <span style={{ fontSize: 9, fontFamily: 'monospace', color: c.color, fontWeight: 700, flexShrink: 0, width: 28 }}>{c.id}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 11.5, color: 'rgba(226,232,240,0.88)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{c.title}</p>
              <div style={{ display: 'flex', gap: 6, marginTop: 5 }}>
                <span style={{ fontSize: 8.5, padding: '1px 7px', borderRadius: 5, background: `${c.color}18`, border: `1px solid ${c.color}35`, color: c.color, fontWeight: 600 }}>{c.type}</span>
                <span style={{ fontSize: 8.5, color: 'rgba(100,116,139,0.7)', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                  {c.steps} steps
                </span>
              </div>
            </div>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: c.color, flexShrink: 0, boxShadow: `0 0 8px ${c.color}` }} />
          </div>
        ))}
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────
   STAGE 4 — ANATOMY OF A TEST CASE
──────────────────────────────────────────── */
function StageAnatomy({ visible }: { visible: boolean }) {
  const fields = [
    { label: 'Test ID', value: 'TC03', color: '#60a5fa', mono: true },
    { label: 'Type', value: 'Security', color: '#f87171' },
    { label: 'Priority', value: 'Critical', color: '#ef4444' },
    { label: 'Preconditions', value: 'User has a valid account, app is running', color: '#94a3b8' },
    { label: 'Steps', value: null, color: '#a78bfa' },
    { label: 'Expected Result', value: 'Account is locked, user notified by email, brute-force blocked', color: '#34d399' },
    { label: 'Tags', value: 'auth · lockout · brute-force · security', color: '#f59e0b' },
  ]
  const steps = ['Navigate to the login page','Enter valid email address','Enter incorrect password','Repeat steps 2–3 four more times','Attempt final login with correct password']

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', ...P }}>
      <div style={{
        transform: visible ? 'rotateX(4deg) rotateY(-5deg)' : 'rotateX(4deg) rotateY(-5deg) translateY(50px)',
        opacity: visible ? 1 : 0, transition: 'all 1s cubic-bezier(0.22,1,0.36,1)',
        transformStyle: 'preserve-3d',
      }}>
        <div style={{ borderRadius: 20, background: 'rgba(8,12,28,0.92)', border: '1px solid rgba(255,255,255,0.09)', boxShadow: '0 40px 90px rgba(0,0,0,0.6)', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '14px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(5,7,18,0.6)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} className="animate-pulse" />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.1em' }}>ANATOMY OF A GENERATED TEST CASE</span>
          </div>
          {/* Title */}
          <div style={{ padding: '18px 22px 0' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'white', margin: '0 0 18px' }}>Account locked after 5 failed login attempts</p>
          </div>
          {/* Fields grid */}
          <div style={{ padding: '0 22px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            {fields.filter(f => f.label !== 'Steps').map((f, i) => (
              <div key={f.label} style={{
                padding: '10px 14px', borderRadius: 10,
                background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)',
                opacity: visible ? 1 : 0, transition: `opacity 0.4s ease ${0.3 + i * 0.08}s`,
              }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(148,163,184,0.55)', margin: '0 0 5px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{f.label}</p>
                <p style={{ fontSize: 12, fontWeight: f.mono ? 700 : 400, color: f.mono ? f.color : 'rgba(226,232,240,0.85)', margin: 0, fontFamily: f.mono ? 'monospace' : 'inherit', lineHeight: 1.5 }}>{f.value}</p>
              </div>
            ))}
          </div>
          {/* Steps */}
          <div style={{ padding: '0 22px 22px' }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(148,163,184,0.55)', margin: '0 0 10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>STEPS</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {steps.map((s, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  opacity: visible ? 1 : 0, transition: `opacity 0.4s ease ${0.7 + i * 0.1}s`,
                }}>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#a78bfa', flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                  <span style={{ fontSize: 12, color: 'rgba(203,213,225,0.8)', lineHeight: 1.5 }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────
   STAGE 5 — BEFORE VS AFTER
──────────────────────────────────────────── */
function TimelineBar({ label, minutes, max, color, visible, delay }: { label: string; minutes: number; max: number; color: string; visible: boolean; delay: number }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.7)' }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>{minutes < 1 ? `${Math.round(minutes * 60)}s` : `${minutes}m`}</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 3, background: color, width: visible ? `${(minutes / max) * 100}%` : '0%', transition: `width 1.4s ease ${delay}s` }} />
      </div>
    </div>
  )
}

function StageComparison({ visible }: { visible: boolean }) {
  return (
    <div style={{ maxWidth: 980, margin: '0 auto', ...P }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr', alignItems: 'center', gap: 0 }}>

        {/* OLD WAY */}
        <div style={{
          transform: visible ? 'perspective(1000px) rotateY(10deg)' : 'perspective(1000px) rotateY(10deg) translateX(-60px)',
          opacity: visible ? 1 : 0, transition: 'all 0.9s cubic-bezier(0.22,1,0.36,1)',
          transformStyle: 'preserve-3d',
        }}>
          <div style={{ borderRadius: 18, background: 'rgba(20,8,10,0.9)', border: '1px solid rgba(239,68,68,0.2)', boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 60px rgba(239,68,68,0.06)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 18px', background: 'rgba(239,68,68,0.06)', borderBottom: '1px solid rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#f87171', letterSpacing: '0.1em' }}>MANUAL PROCESS</span>
              <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 6, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5', fontWeight: 700 }}>~ 4–6 hours</span>
            </div>
            <div style={{ padding: '18px 18px' }}>
              <TimelineBar label="Reading & understanding story" minutes={30} max={360} color="#f87171" visible={visible} delay={0.3} />
              <TimelineBar label="Writing test case headers" minutes={45} max={360} color="#f87171" visible={visible} delay={0.5} />
              <TimelineBar label="Writing steps manually" minutes={120} max={360} color="#ef4444" visible={visible} delay={0.7} />
              <TimelineBar label="Adding edge cases (if remembered)" minutes={60} max={360} color="#dc2626" visible={visible} delay={0.9} />
              <TimelineBar label="Review & formatting" minutes={45} max={360} color="#b91c1c" visible={visible} delay={1.1} />
              <TimelineBar label="Copy to spreadsheet / Jira" minutes={60} max={360} color="#991b1b" visible={visible} delay={1.3} />

              <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['Low coverage — edge cases missed', 'Inconsistent format across team', 'Becomes stale as specs change', 'Boring, error-prone, repeated work'].map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', opacity: visible ? 1 : 0, transition: `opacity 0.4s ease ${1.5 + i * 0.1}s` }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" style={{ marginTop: 1, flexShrink: 0 }}><path d="M18 6L6 18M6 6l12 12"/></svg>
                    <span style={{ fontSize: 12, color: 'rgba(252,165,165,0.7)' }}>{t}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 18, padding: '12px', borderRadius: 10, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 10, color: 'rgba(148,163,184,0.6)' }}>Coverage estimate</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#f87171' }}>~30–40%</span>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: visible ? '35%' : '0%', background: 'linear-gradient(90deg, #ef4444, #f87171)', borderRadius: 3, transition: 'width 1.5s ease 1.4s' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* VS badge */}
        <div style={{ display: 'flex', justifyContent: 'center', zIndex: 10 }}>
          <div style={{
            width: 58, height: 58, borderRadius: '50%',
            background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 50px rgba(59,130,246,0.45), 0 10px 30px rgba(0,0,0,0.5)',
            border: '2px solid rgba(255,255,255,0.15)',
            opacity: visible ? 1 : 0, transform: visible ? 'scale(1)' : 'scale(0)',
            transition: 'all 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.5s',
          }} className="animate-float">
            <span style={{ fontSize: 15, fontWeight: 900, color: 'white' }}>VS</span>
          </div>
        </div>

        {/* LYRA AI WAY */}
        <div style={{
          transform: visible ? 'perspective(1000px) rotateY(-10deg)' : 'perspective(1000px) rotateY(-10deg) translateX(60px)',
          opacity: visible ? 1 : 0, transition: 'all 0.9s cubic-bezier(0.22,1,0.36,1) 0.15s',
          transformStyle: 'preserve-3d',
        }}>
          <div style={{ borderRadius: 18, background: 'rgba(8,12,28,0.92)', border: '1px solid rgba(59,130,246,0.25)', boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 80px rgba(59,130,246,0.1)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 18px', background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.06))', borderBottom: '1px solid rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', background: 'linear-gradient(90deg,#60a5fa,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>LYRA AI PROCESS</span>
              <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 6, background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)', color: '#6ee7b7', fontWeight: 700 }}>4.2 seconds</span>
            </div>
            <div style={{ padding: '18px 18px' }}>
              <TimelineBar label="Parse & extract entities" minutes={0.02} max={360} color="#60a5fa" visible={visible} delay={0.4} />
              <TimelineBar label="Run 6 analysis modules" minutes={0.08} max={360} color="#a78bfa" visible={visible} delay={0.55} />
              <TimelineBar label="Generate all test cases" minutes={0.05} max={360} color="#34d399" visible={visible} delay={0.7} />
              <TimelineBar label="Add steps & expected results" minutes={0.03} max={360} color="#60a5fa" visible={visible} delay={0.85} />
              <TimelineBar label="Categorise & prioritise" minutes={0.01} max={360} color="#a78bfa" visible={visible} delay={1.0} />
              <TimelineBar label="Export to Excel/PDF/MD" minutes={0.01} max={360} color="#34d399" visible={visible} delay={1.15} />

              <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['8–15 cases with full edge coverage', 'Consistent, structured format always', 'Regenerate instantly when specs change', 'Frees engineers for higher-value work'].map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', opacity: visible ? 1 : 0, transition: `opacity 0.4s ease ${1.5 + i * 0.1}s` }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" style={{ marginTop: 1, flexShrink: 0 }}><path d="M5 13l4 4L19 7"/></svg>
                    <span style={{ fontSize: 12, color: 'rgba(167,243,208,0.75)' }}>{t}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 18, padding: '12px', borderRadius: 10, background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 10, color: 'rgba(148,163,184,0.6)' }}>Coverage estimate</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#34d399' }}>95–100%</span>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: visible ? '98%' : '0%', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #34d399)', borderRadius: 3, transition: 'width 1.5s cubic-bezier(0.22,1,0.36,1) 1.4s' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────
   VERDICT — animated numbers
──────────────────────────────────────────── */
function Verdict({ visible }: { visible: boolean }) {
  const v1 = useCountUp(340, visible, 0)
  const v2 = useCountUp(95, visible, 200)
  const v3 = useCountUp(8, visible, 400)
  const stats = [
    { num: `${v1}×`, label: 'faster than manual writing', color: '#60a5fa' },
    { num: `${v2}%+`, label: 'test coverage achieved', color: '#a78bfa' },
    { num: `${v3}–15`, label: 'cases from any story', color: '#34d399' },
    { num: '0', label: 'templates or setup needed', color: '#f59e0b' },
  ]
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
      borderRadius: 22, overflow: 'hidden',
      background: 'rgba(9,12,28,0.8)', backdropFilter: 'blur(24px)',
      border: '1px solid rgba(255,255,255,0.07)',
      opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(40px)',
      transition: 'all 0.8s cubic-bezier(0.22,1,0.36,1)',
    }}>
      {stats.map((s, i) => (
        <div key={s.label} style={{ padding: '28px 18px', textAlign: 'center', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
          <p style={{ fontSize: 36, fontWeight: 800, margin: '0 0 5px', color: s.color, letterSpacing: '-0.02em' }}>{s.num}</p>
          <p style={{ fontSize: 12, color: 'rgba(148,163,184,0.75)', margin: 0 }}>{s.label}</p>
        </div>
      ))}
    </div>
  )
}

/* ────────────────────────────────────────────
   MAIN EXPORT
──────────────────────────────────────────── */
const STAGES = ['Input', 'Analysis', 'Generation', 'Anatomy', 'Before vs After', 'Results']

export default function FlowShowcase() {
  const s1 = useReveal(0.2)
  const s2 = useReveal(0.15)
  const s3 = useReveal(0.15)
  const s4 = useReveal(0.15)
  const s5 = useReveal(0.1)
  const s6 = useReveal(0.25)

  const active = [s1, s2, s3, s4, s5, s6].findLastIndex(s => s.visible)

  return (
    <section id="showcase" style={{ position: 'relative', zIndex: 1, padding: '40px 28px 130px', scrollMarginTop: 80, overflow: 'hidden' }}>

      {/* Section heading */}
      <div style={{ maxWidth: 1100, margin: '0 auto 24px', textAlign: 'center' }}>
        <p style={{ color: '#a78bfa', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 14px' }}>FULL PIPELINE</p>
        <h2 style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.025em', margin: '0 0 14px', color: 'white', lineHeight: 1.12 }}>
          From user story to test suite —<br />
          <span style={{ background: 'linear-gradient(135deg,#60a5fa,#a78bfa,#34d399)', backgroundSize: '200% 100%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }} className="animate-gradient">every step, visualised</span>
        </h2>
        <p style={{ color: 'rgba(148,163,184,0.72)', fontSize: 15, maxWidth: 500, margin: '0 auto' }}>See exactly what Lyra AI does in 4.2 seconds that takes a human 4 hours.</p>
      </div>

      {/* Stage pills */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 64 }}>
        {STAGES.map((s, i) => <StagePill key={s} n={String(i + 1)} label={s} color={['#60a5fa','#a78bfa','#34d399','#f59e0b','#f87171','#34d399'][i]} active={active >= i} />)}
      </div>

      {/* ── STAGE 1 ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#60a5fa', letterSpacing: '0.12em', textTransform: 'uppercase' }}>STAGE 01 · INPUT</span>
          <h3 style={{ fontSize: 22, fontWeight: 700, color: 'white', margin: '8px 0 0' }}>User story arrives. AI starts parsing.</h3>
        </div>
        <div ref={s1.ref}><StageInput visible={s1.visible} /></div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', margin: '52px 0' }}>
        <FlowArrow color="#60a5fa" active={s1.visible} />
      </div>

      {/* ── STAGE 2 ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', letterSpacing: '0.12em', textTransform: 'uppercase' }}>STAGE 02 · ANALYSIS</span>
          <h3 style={{ fontSize: 22, fontWeight: 700, color: 'white', margin: '8px 0 0' }}>6 AI modules run simultaneously.</h3>
        </div>
        <div ref={s2.ref}><AICore visible={s2.visible} /></div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', margin: '52px 0' }}>
        <FlowArrow color="#a78bfa" active={s2.visible} />
      </div>

      {/* ── STAGE 3 ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#34d399', letterSpacing: '0.12em', textTransform: 'uppercase' }}>STAGE 03 · GENERATION</span>
          <h3 style={{ fontSize: 22, fontWeight: 700, color: 'white', margin: '8px 0 0' }}>8 structured test cases generated.</h3>
        </div>
        <div ref={s3.ref}><StageCascade visible={s3.visible} /></div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', margin: '52px 0' }}>
        <FlowArrow color="#34d399" active={s3.visible} />
      </div>

      {/* ── STAGE 4 ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', letterSpacing: '0.12em', textTransform: 'uppercase' }}>STAGE 04 · ANATOMY</span>
          <h3 style={{ fontSize: 22, fontWeight: 700, color: 'white', margin: '8px 0 0' }}>Every case is structured, complete, and ready to run.</h3>
        </div>
        <div ref={s4.ref}><StageAnatomy visible={s4.visible} /></div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', margin: '52px 0' }}>
        <FlowArrow color="#f87171" active={s4.visible} />
      </div>

      {/* ── STAGE 5 ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#f87171', letterSpacing: '0.12em', textTransform: 'uppercase' }}>STAGE 05 · BEFORE VS AFTER</span>
          <h3 style={{ fontSize: 22, fontWeight: 700, color: 'white', margin: '8px 0 0' }}>4 hours of manual work. 4.2 seconds with Lyra AI.</h3>
        </div>
        <div ref={s5.ref}><StageComparison visible={s5.visible} /></div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', margin: '52px 0' }}>
        <FlowArrow color="#34d399" active={s5.visible} />
      </div>

      {/* ── VERDICT ── */}
      <div ref={s6.ref} style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#34d399', letterSpacing: '0.12em', textTransform: 'uppercase' }}>STAGE 06 · RESULTS</span>
        </div>
        <Verdict visible={s6.visible} />
      </div>

    </section>
  )
}
