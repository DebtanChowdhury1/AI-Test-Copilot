'use client'

import { useState, useEffect } from 'react'

function AnimatedLogo({ size = 100 }: { size?: number }) {
  const [cycle, setCycle] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setCycle(c => c + 1), 2600)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{ position: 'relative', width: size, height: size, animation: 'logo-glow-pulse 2.6s ease-in-out infinite' }}>
      <div style={{ position: 'absolute', inset: -20, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.22) 0%, transparent 70%)', filter: 'blur(16px)', pointerEvents: 'none', animation: 'logo-glow-pulse 2.6s ease-in-out infinite' }} />
      <svg key={cycle} width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: 'relative', zIndex: 1 }}>
        <defs>
          <linearGradient id="plg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3b82f6"/>
            <stop offset="100%" stopColor="#8b5cf6"/>
          </linearGradient>
          <clipPath id="pl-clip"><rect width="100" height="100" rx="22"/></clipPath>
        </defs>
        <rect width="100" height="100" rx="22" fill="url(#plg)"/>
        <rect width="40" height="100" rx="0" fill="white" fillOpacity="0.12" clipPath="url(#pl-clip)" style={{ animation: 'logo-shimmer-sweep 2.6s ease-in-out 1.1s both' }} />
        {[
          { cx: 20, cy: 27, r: 2.5, op: 0.4,  delay: '0.05s' },
          { cx: 36, cy: 18, r: 2.5, op: 0.65, delay: '0.13s' },
          { cx: 52, cy: 15, r: 3.5, op: 0.95, delay: '0.22s' },
          { cx: 68, cy: 18, r: 2.5, op: 0.65, delay: '0.31s' },
          { cx: 82, cy: 27, r: 2,   op: 0.4,  delay: '0.38s' },
        ].map((d, i) => (
          <circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill="white" fillOpacity={d.op} style={{ opacity: 0, animation: `logo-dot-appear 0.22s ease ${d.delay} forwards` }} />
        ))}
        <path d="M22 26 L34 19 M38 18 L50 16 M54 16 L66 19 M70 19 L80 26" stroke="white" strokeOpacity="0.28" strokeWidth="1.2" strokeLinecap="round" style={{ opacity: 0, animation: 'logo-dot-appear 0.28s ease 0.46s forwards' }} />
        <path d="M20 54 L40 75 L80 30" stroke="white" strokeWidth="9.5" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.95" strokeDasharray="130" strokeDashoffset="130" style={{ animation: 'logo-check-draw 0.72s cubic-bezier(0.4,0,0.2,1) 0.56s forwards' }} />
        <circle cx="40" cy="75" r="5.5" fill="white" fillOpacity="0.15" style={{ opacity: 0, animation: 'logo-ring-pop 0.32s ease 1.22s forwards' }} />
        <circle cx="40" cy="75" r="5.5" stroke="white" strokeWidth="3" style={{ opacity: 0, animation: 'logo-ring-pop 0.32s ease 1.22s forwards' }} />
      </svg>
    </div>
  )
}

export default function PageLoader({ label = 'Loading' }: { label?: string }) {
  const [dotIdx, setDotIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setDotIdx(d => (d + 1) % 3), 500)
    return () => clearInterval(t)
  }, [])

  /* Typewriter effect on label */
  useEffect(() => {
    setCharIdx(0)
    const t = setInterval(() => {
      setCharIdx(i => {
        if (i >= label.length) { clearInterval(t); return i }
        return i + 1
      })
    }, 38)
    return () => clearInterval(t)
  }, [label])

  const dots = ['·', '· ·', '· · ·'][dotIdx]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#050712', position: 'relative', overflow: 'hidden' }}>
      {/* Dot grid */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />
      {/* Ambient blobs */}
      <div style={{ position: 'absolute', top: '20%', left: '30%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.1), transparent 70%)', filter: 'blur(70px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '25%', right: '25%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.08), transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

      <AnimatedLogo size={100} />

      {/* Brand */}
      <p style={{ fontSize: 17, fontWeight: 700, color: 'white', margin: '28px 0 16px', letterSpacing: '-0.01em' }}>
        AI Test Copilot
      </p>

      {/* Highlighted animated label pill */}
      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 18px', borderRadius: 40, background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.1))', border: '1px solid rgba(139,92,246,0.25)', boxShadow: '0 0 24px rgba(139,92,246,0.12), inset 0 1px 0 rgba(255,255,255,0.06)' }}>
        {/* Animated ring around the dot */}
        <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 10, height: 10, flexShrink: 0 }}>
          <span style={{ position: 'absolute', inset: -3, borderRadius: '50%', border: '1px solid rgba(139,92,246,0.5)', animation: 'logo-ring-pop 1s ease-in-out infinite alternate' }} />
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'linear-gradient(135deg, #60a5fa, #a78bfa)', display: 'block', animation: 'pulse-glow 1.4s ease-in-out infinite' }} />
        </span>

        {/* Typewriter label with gradient */}
        <span style={{ fontSize: 13, fontWeight: 600, background: 'linear-gradient(90deg, #93c5fd, #c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '0.01em', minWidth: 80 }}>
          {label.slice(0, charIdx)}
          <span style={{ opacity: charIdx < label.length ? 1 : 0, WebkitTextFillColor: '#a78bfa' }}>|</span>
        </span>

        {/* Bouncing dots */}
        <span style={{ fontSize: 12, color: 'rgba(139,92,246,0.7)', letterSpacing: 2, fontWeight: 700, minWidth: 28, display: 'inline-block' }}>{dots}</span>
      </div>

      {/* Subtle progress bar */}
      <div style={{ marginTop: 28, width: 120, height: 2, borderRadius: 2, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 2, background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #3b82f6)', backgroundSize: '200% 100%', animation: 'gradient-shift 1.5s ease infinite' }} />
      </div>
    </div>
  )
}
