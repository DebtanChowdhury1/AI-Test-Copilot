'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import AppLogo from './AppLogo'
import FlowShowcase from './FlowShowcase'

/* ─── Nav items ─── */
const NAV_ITEMS = [
  { label: 'Home', href: '#top' },
  { label: 'Live Demo', href: '#showcase' },
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
]

/* ─── Mouse parallax hook (RAF-throttled, no jank) ─── */
function useMouseParallax() {
  const [m, setM] = useState({ x: 0, y: 0 })
  const pending = useRef(false)
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (pending.current) return
      pending.current = true
      requestAnimationFrame(() => {
        setM({
          x: (e.clientX / window.innerWidth - 0.5) * 2,
          y: (e.clientY / window.innerHeight - 0.5) * 2,
        })
        pending.current = false
      })
    }
    window.addEventListener('mousemove', h, { passive: true })
    return () => window.removeEventListener('mousemove', h)
  }, [])
  return m
}

/* ─── Scroll reveal hook ─── */
function useReveal(threshold = 0.18) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

/* ─── Animated nav pill ─── */
function AnimatedNavItems() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pill, setPill] = useState({ left: 0, width: 0, visible: false })
  const onEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const c = containerRef.current; if (!c) return
    const cr = c.getBoundingClientRect(); const ir = e.currentTarget.getBoundingClientRect()
    setPill({ left: ir.left - cr.left, width: ir.width, visible: true })
  }
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href === '#top') { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); return }
    if (href.startsWith('#')) { e.preventDefault(); document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
  }
  return (
    <div ref={containerRef} onMouseLeave={() => setPill(p => ({ ...p, visible: false }))}
      style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 2 }}>
      <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: pill.left, width: pill.width, height: 36, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, transition: 'left 0.22s cubic-bezier(0.4,0,0.2,1), width 0.18s cubic-bezier(0.4,0,0.2,1), opacity 0.15s', opacity: pill.visible ? 1 : 0, pointerEvents: 'none', zIndex: 0 }} />
      {NAV_ITEMS.map((item, i) => (
        <a key={item.label} href={item.href} onMouseEnter={onEnter} onClick={(e) => handleClick(e, item.href)}
          style={{ padding: '8px 16px', borderRadius: 10, fontSize: 14, fontWeight: 500, color: 'rgba(203,213,225,0.82)', textDecoration: 'none', position: 'relative', zIndex: 1, whiteSpace: 'nowrap', transition: 'color 0.2s', animation: `fadeInDown 0.4s ease ${i * 60 + 80}ms both` }}
          onMouseOver={e => (e.currentTarget.style.color = '#fff')}
          onMouseOut={e => (e.currentTarget.style.color = 'rgba(203,213,225,0.82)')}>
          {item.label}
        </a>
      ))}
    </div>
  )
}

/* ─── 3D Floating Rings (hero bg decoration) ─── */
function FloatingRings({ mouse }: { mouse: { x: number; y: number } }) {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {/* Large tilted orbit ring */}
      <div className="animate-spin-slow" style={{
        position: 'absolute', top: '8%', left: '-8%', width: 600, height: 600,
        borderRadius: '50%', border: '1px solid rgba(59,130,246,0.12)',
        transform: `perspective(800px) rotateX(72deg) rotateZ(${25 + mouse.x * 4}deg)`,
        transition: 'transform 0.8s ease',
      }} />
      {/* Medium ring top-right */}
      <div className="animate-spin-slow" style={{
        position: 'absolute', top: '5%', right: '-5%', width: 420, height: 420,
        borderRadius: '50%', border: '1px solid rgba(139,92,246,0.1)',
        transform: `perspective(600px) rotateX(65deg) rotateZ(${-15 + mouse.y * 3}deg)`,
        transition: 'transform 0.8s ease', animationDirection: 'reverse', animationDuration: '12s',
      }} />
      {/* Small accent ring */}
      <div className="animate-spin-slow" style={{
        position: 'absolute', bottom: '10%', left: '35%', width: 200, height: 200,
        borderRadius: '50%', border: '1px solid rgba(52,211,153,0.1)',
        transform: `perspective(400px) rotateX(60deg) rotateZ(${mouse.x * 5}deg)`,
        transition: 'transform 0.8s ease', animationDuration: '7s',
      }} />
      {/* Floating dot grid card — depth layer */}
      <div style={{
        position: 'absolute', right: '2%', top: '25%', width: 340, height: 200,
        borderRadius: 20, border: '1px solid rgba(255,255,255,0.04)',
        background: 'rgba(255,255,255,0.015)',
        transform: `perspective(1000px) rotateY(-18deg) rotateX(${4 + mouse.y * 2}deg) translateZ(-40px)`,
        transition: 'transform 0.6s ease',
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
        backgroundSize: '22px 22px',
        opacity: 0.7,
      }} />
    </div>
  )
}

/* ─── 3D Mock App Preview ─── */
function MockPreview3D({ mouse }: { mouse: { x: number; y: number } }) {
  const rows = [
    { label: 'Valid login redirects to dashboard', dot: '#34d399', type: 'Functional' },
    { label: 'Error shown for invalid password', dot: '#f87171', type: 'Negative' },
    { label: 'Session persists after page refresh', dot: '#60a5fa', type: 'Regression' },
    { label: 'Rate-limit after 5 failed attempts', dot: 'rgba(100,116,139,0.5)', type: 'Security' },
    { label: 'Redirect preserves return URL param', dot: 'rgba(100,116,139,0.5)', type: 'Edge Case' },
  ]
  return (
    <div style={{
      position: 'relative',
      transform: `perspective(1400px) rotateY(${-22 + mouse.x * 4}deg) rotateX(${7 + mouse.y * 2}deg) rotateZ(-1deg)`,
      transition: 'transform 0.5s cubic-bezier(0.4,0,0.2,1)',
      transformStyle: 'preserve-3d',
    }}>
      {/* Glow behind */}
      <div style={{ position: 'absolute', inset: -30, background: 'radial-gradient(ellipse, rgba(59,130,246,0.2), transparent 70%)', filter: 'blur(30px)', pointerEvents: 'none', borderRadius: '50%' }} />

      {/* Shadow depth layer */}
      <div style={{ position: 'absolute', inset: 8, borderRadius: 22, background: 'rgba(0,0,0,0.5)', filter: 'blur(16px)', transform: 'translateZ(-20px)' }} />

      <div style={{ borderRadius: 18, overflow: 'hidden', background: 'rgba(7,10,24,0.94)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 50px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)' }}>
        {/* Window chrome */}
        <div style={{ background: 'rgba(5,7,18,0.85)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
          {['#ef4444','#f59e0b','#22c55e'].map((c,i) => <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.55 }} />)}
          <div style={{ marginLeft: 10, height: 7, width: 120, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }} />
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            {[80, 56].map((w,i) => <div key={i} style={{ height: 7, width: w, background: 'rgba(255,255,255,0.04)', borderRadius: 4 }} />)}
          </div>
        </div>
        {/* Header strip */}
        <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <div style={{ height: 9, width: 150, background: 'rgba(255,255,255,0.12)', borderRadius: 5, marginBottom: 7 }} />
              <div style={{ display: 'flex', gap: 6 }}>
                <div style={{ height: 6, width: 55, background: 'rgba(139,92,246,0.38)', borderRadius: 3 }} />
                <div style={{ height: 6, width: 44, background: 'rgba(255,255,255,0.07)', borderRadius: 3 }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ height: 27, width: 62, background: 'rgba(59,130,246,0.14)', border: '1px solid rgba(59,130,246,0.22)', borderRadius: 8 }} />
              <div style={{ height: 27, width: 74, background: 'linear-gradient(135deg, rgba(59,130,246,0.45), rgba(139,92,246,0.45))', borderRadius: 8 }} />
            </div>
          </div>
          <div style={{ height: 3, background: 'rgba(255,255,255,0.04)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '40%', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', borderRadius: 2 }} />
          </div>
        </div>
        {/* Rows */}
        <div style={{ padding: '6px 0' }}>
          {rows.map((r,i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 18px', borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
              <span style={{ fontSize: 9, color: 'rgba(100,116,139,0.55)', width: 22, flexShrink: 0, fontFamily: 'monospace' }}>TC{String(i+1).padStart(2,'0')}</span>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: r.dot, flexShrink: 0 }} />
              <span style={{ fontSize: 11.5, color: 'rgba(203,213,225,0.78)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</span>
              <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 5, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(100,116,139,0.8)', flexShrink: 0 }}>{r.type}</span>
            </div>
          ))}
        </div>
        {/* Footer */}
        <div style={{ padding: '10px 18px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa' }} className="animate-pulse" />
            <span style={{ fontSize: 9, color: '#a78bfa', fontWeight: 600 }}>Lyra AI</span>
          </div>
          <span style={{ fontSize: 9, color: 'rgba(100,116,139,0.55)' }}>· Generated in 4.2s</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 5 }}>
            {['.xlsx','.pdf','.md'].map(ext => (
              <div key={ext} style={{ fontSize: 8, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(100,116,139,0.7)' }}>{ext}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Feature data ─── */
const FEATURES = [
  { title: 'Generate in seconds', desc: 'Paste any user story or spec. Lyra AI creates 8–15 structured test cases in under 10 seconds — no templates, no setup.', icon: '#60a5fa', bg: 'rgba(59,130,246,0.07)', border: 'rgba(59,130,246,0.18)', tiltY: 8, tiltX: -3,
    svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> },
  { title: 'Lyra AI engine', desc: 'Dual-model AI with self-healing fallback. Zero downtime, always accurate even when one model is unavailable.', icon: '#a78bfa', bg: 'rgba(139,92,246,0.07)', border: 'rgba(139,92,246,0.18)', tiltY: 0, tiltX: -4,
    svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg> },
  { title: 'Export & track', desc: 'One-click export to Excel, PDF, or Markdown. Mark results inline, add notes, track execution live.', icon: '#34d399', bg: 'rgba(16,185,129,0.07)', border: 'rgba(16,185,129,0.18)', tiltY: -8, tiltX: -3,
    svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg> },
]

/* ─── 3D Feature card ─── */
function FeatureCard({ f, i, visible }: { f: typeof FEATURES[0]; i: number; visible: boolean }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        padding: '32px 28px', borderRadius: 22,
        background: hovered ? `linear-gradient(135deg, ${f.bg}, rgba(255,255,255,0.03))` : 'rgba(9,12,28,0.75)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${hovered ? f.border : 'rgba(255,255,255,0.065)'}`,
        boxShadow: hovered ? `0 30px 60px rgba(0,0,0,0.5), 0 0 40px ${f.icon}18` : '0 8px 30px rgba(0,0,0,0.3)',
        transform: visible
          ? hovered
            ? `perspective(1000px) rotateY(0deg) rotateX(0deg) translateY(-8px) translateZ(20px)`
            : `perspective(1000px) rotateY(${f.tiltY}deg) rotateX(${f.tiltX}deg)`
          : `perspective(1000px) rotateY(${f.tiltY}deg) rotateX(${f.tiltX}deg) translateY(50px)`,
        opacity: visible ? 1 : 0,
        transition: hovered
          ? 'all 0.25s cubic-bezier(0.4,0,0.2,1)'
          : `all 0.75s cubic-bezier(0.22,1,0.36,1) ${i * 0.12}s`,
        transformStyle: 'preserve-3d',
        cursor: 'default',
      }}>
      {/* Icon */}
      <div style={{ width: 50, height: 50, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: f.bg, border: `1px solid ${f.border}`, color: f.icon, marginBottom: 22, transform: hovered ? 'translateZ(10px)' : 'translateZ(0)', transition: 'transform 0.25s' }}>
        {f.svg}
      </div>
      <h3 style={{ fontSize: 17, fontWeight: 700, color: 'white', margin: '0 0 10px', transform: hovered ? 'translateZ(8px)' : 'none', transition: 'transform 0.25s' }}>{f.title}</h3>
      <p style={{ color: 'rgba(148,163,184,0.75)', fontSize: 14, lineHeight: 1.68, margin: 0 }}>{f.desc}</p>

      {/* Corner glow dot */}
      <div style={{ position: 'absolute', top: 18, right: 18, width: 6, height: 6, borderRadius: '50%', background: f.icon, opacity: hovered ? 1 : 0, boxShadow: `0 0 10px ${f.icon}`, transition: 'opacity 0.3s' }} />
    </div>
  )
}

/* ─── 3D Steps (staircase depth) ─── */
const STEPS = [
  { num: '01', title: 'Paste your story', desc: 'Add any user story, feature description, or bug report. Any format works.', color: '#60a5fa', tiltY: -14, tiltX: 3, tz: 40 },
  { num: '02', title: 'AI generates cases', desc: 'Lyra AI analyses context and produces comprehensive test scenarios in under 10 seconds.', color: '#a78bfa', tiltY: 0, tiltX: 0, tz: 0 },
  { num: '03', title: 'Export and ship', desc: 'Download as Excel, PDF, or Markdown — or track test execution right inside the app.', color: '#34d399', tiltY: 14, tiltX: -3, tz: -40 },
]

export default function LandingPage({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const [scrolled, setScrolled] = useState(false)
  const [navVisible, setNavVisible] = useState(false)
  const mouse = useMouseParallax()
  const featReveal = useReveal(0.15)
  const stepsReveal = useReveal(0.15)
  const ctaReveal = useReveal(0.2)

  useEffect(() => {
    setNavVisible(true)
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div id="top" style={{ background: '#050712', minHeight: '100vh', color: 'white' }}>

      {/* ── Animated background blobs ── */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div className="animate-blob1" style={{ position: 'absolute', top: '-20%', left: '-15%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.18), transparent 70%)', filter: 'blur(90px)' }} />
        <div className="animate-blob2" style={{ position: 'absolute', bottom: '-20%', right: '-15%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.16), transparent 70%)', filter: 'blur(90px)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.065) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      </div>

      {/* ── NAVBAR ── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)', transform: navVisible ? 'translateY(0)' : 'translateY(-100%)', opacity: navVisible ? 1 : 0 }}>
        <div style={{ backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', background: scrolled ? 'rgba(5,7,18,0.92)' : 'rgba(5,7,18,0.55)', borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.03)', transition: 'background 0.35s, border-color 0.35s', boxShadow: scrolled ? '0 4px 32px rgba(0,0,0,0.4)' : 'none' }}>
          <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 28px', height: 66, display: 'flex', alignItems: 'center', gap: 32 }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 11, textDecoration: 'none', flexShrink: 0, animation: 'fadeInDown 0.4s ease both' }}>
              <AppLogo size={36} id="nav" />
              <div>
                <p style={{ color: 'white', fontWeight: 700, fontSize: 15, lineHeight: 1, margin: 0 }}>AI Test Copilot</p>
                <p style={{ color: 'rgba(139,92,246,0.78)', fontSize: 9.5, margin: '3px 0 0', fontWeight: 600, letterSpacing: '0.07em' }}>POWERED BY LYRA AI</p>
              </div>
            </Link>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}><AnimatedNavItems /></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, animation: 'fadeInDown 0.4s ease 120ms both' }}>
              {isLoggedIn ? (
                <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, color: 'white', textDecoration: 'none', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', boxShadow: '0 0 20px rgba(59,130,246,0.28)', transition: 'all 0.2s' }}
                  onMouseOver={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 36px rgba(59,130,246,0.5)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
                  onMouseOut={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px rgba(59,130,246,0.28)'; (e.currentTarget as HTMLElement).style.transform = 'none' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/sign-in" style={{ padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, color: 'rgba(203,213,225,0.85)', textDecoration: 'none', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', transition: 'all 0.2s' }}
                    onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.color = 'white' }}
                    onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.color = 'rgba(203,213,225,0.85)' }}>
                    Sign in
                  </Link>
                  <Link href="/sign-up" style={{ padding: '8px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, color: 'white', textDecoration: 'none', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', boxShadow: '0 0 20px rgba(59,130,246,0.28)', transition: 'all 0.2s' }}
                    onMouseOver={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 36px rgba(59,130,246,0.45)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
                    onMouseOut={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px rgba(59,130,246,0.28)'; (e.currentTarget as HTMLElement).style.transform = 'none' }}>
                    Get Started Free
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ─────────────────────────── HERO ─────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: 66, overflow: 'hidden' }}>
        <FloatingRings mouse={mouse} />
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '80px 28px 100px', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>

          {/* Left — text, reactive to mouse at slow depth */}
          <div style={{ transform: `perspective(1200px) rotateY(${mouse.x * 1.5}deg) rotateX(${-mouse.y * 1}deg)`, transition: 'transform 0.6s ease' }}>
            <div className="animate-fade-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 100, marginBottom: 30, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.28)' }}>
              <span className="animate-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: '#60a5fa', display: 'inline-block' }} />
              <span style={{ color: '#93c5fd', fontSize: 12, fontWeight: 600 }}>Now powered by Lyra AI · Always on</span>
            </div>
            <h1 className="animate-fade-up" style={{ fontSize: 62, fontWeight: 800, lineHeight: 1.06, letterSpacing: '-0.03em', margin: '0 0 22px', animationDelay: '80ms' }}>
              <span style={{ color: 'white' }}>Generate test</span><br />
              <span style={{ color: 'white' }}>suites that</span><br />
              <span className="animate-gradient" style={{ background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #60a5fa 100%)', backgroundSize: '200% 100%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>actually ship.</span>
            </h1>
            <p className="animate-fade-up" style={{ fontSize: 17, color: 'rgba(148,163,184,0.88)', lineHeight: 1.72, margin: '0 0 36px', maxWidth: 460, animationDelay: '160ms' }}>
              Paste a user story and Lyra AI generates 8–15 professional test cases in under 10 seconds. No templates. No friction. Just results.
            </p>
            <div className="animate-fade-up" style={{ display: 'flex', gap: 12, marginBottom: 26, animationDelay: '240ms' }}>
              {isLoggedIn ? (
                <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 13, fontSize: 15, fontWeight: 700, color: 'white', textDecoration: 'none', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', boxShadow: '0 0 48px rgba(59,130,246,0.32), 0 6px 24px rgba(0,0,0,0.4)' }}>
                  Go to Dashboard
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
              ) : (
                <>
                  <Link href="/sign-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 13, fontSize: 15, fontWeight: 700, color: 'white', textDecoration: 'none', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', boxShadow: '0 0 48px rgba(59,130,246,0.32), 0 6px 24px rgba(0,0,0,0.4)' }}>
                    Start for free
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </Link>
                  <Link href="/sign-in" style={{ display: 'inline-flex', alignItems: 'center', padding: '13px 26px', borderRadius: 13, fontSize: 15, fontWeight: 600, color: 'rgba(203,213,225,0.88)', textDecoration: 'none', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    Sign in
                  </Link>
                </>
              )}
            </div>
            <p className="animate-fade-up" style={{ color: 'rgba(100,116,139,0.7)', fontSize: 12, animationDelay: '320ms' }}>
              {isLoggedIn ? 'Welcome back · Your suites are waiting' : 'No credit card required · Free to start · Ready in 60 seconds'}
            </p>
          </div>

          {/* Right — 3D reactive mock preview */}
          <div className="animate-fade-up" style={{ animationDelay: '200ms' }}>
            <MockPreview3D mouse={mouse} />
          </div>
        </div>
      </section>

      {/* ─────────────────────────── STATS ─────────────────────────── */}
      <div style={{ position: 'relative', zIndex: 1, padding: '0 28px 90px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', transform: 'perspective(1200px) rotateX(6deg)', transformOrigin: 'top center' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: 'rgba(9,12,28,0.8)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 22, overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.4)' }}>
            {[
              { val: '< 10s', label: 'Generation time' },
              { val: '8–15', label: 'Test cases per suite' },
              { val: '3', label: 'Export formats' },
              { val: '100%', label: 'AI uptime' },
            ].map((s, i) => (
              <div key={s.label} style={{ padding: '30px 20px', textAlign: 'center', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <p style={{ fontSize: 34, fontWeight: 800, margin: '0 0 5px', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.val}</p>
                <p style={{ color: 'rgba(100,116,139,0.85)', fontSize: 12, fontWeight: 500, margin: 0 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─────────────────────────── FLOW SHOWCASE ─────────────────────────── */}
      <FlowShowcase />

      {/* ─────────────────────────── FEATURES ─────────────────────────── */}
      <section id="features" style={{ position: 'relative', zIndex: 1, padding: '0 28px 110px', scrollMarginTop: 80 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <p style={{ color: '#60a5fa', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 14px' }}>CAPABILITIES</p>
            <h2 style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.025em', margin: '0 0 16px', color: 'white' }}>Everything QA engineers need</h2>
            <p style={{ color: 'rgba(148,163,184,0.75)', fontSize: 16, maxWidth: 460, margin: '0 auto', lineHeight: 1.65 }}>No more writing test cases by hand. Let AI do the heavy lifting.</p>
          </div>
          <div ref={featReveal.ref} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 22, perspective: 1200 }}>
            {FEATURES.map((f, i) => (
              <FeatureCard key={f.title} f={f} i={i} visible={featReveal.visible} />
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────── HOW IT WORKS ─────────────────────────── */}
      <section id="how-it-works" style={{ position: 'relative', zIndex: 1, padding: '0 28px 120px', scrollMarginTop: 80 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <p style={{ color: '#a78bfa', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 14px' }}>WORKFLOW</p>
            <h2 style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.025em', margin: '0 0 16px', color: 'white' }}>Up and running in 3 steps</h2>
            <p style={{ color: 'rgba(148,163,184,0.75)', fontSize: 16, margin: '0 auto', lineHeight: 1.65 }}>From story to exportable test suite without leaving your browser.</p>
          </div>

          {/* 3D staircase steps */}
          <div ref={stepsReveal.ref} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, perspective: 1400 }}>
            {STEPS.map((step, i) => (
              <div key={step.num} style={{
                padding: '36px 28px', borderRadius: 22, position: 'relative',
                background: 'rgba(9,12,28,0.8)', backdropFilter: 'blur(20px)',
                border: `1px solid ${step.color}22`,
                boxShadow: `0 20px 50px rgba(0,0,0,0.4), 0 0 30px ${step.color}0a`,
                transform: stepsReveal.visible
                  ? `perspective(1200px) rotateY(${step.tiltY}deg) rotateX(${step.tiltX}deg) translateZ(${step.tz}px)`
                  : `perspective(1200px) rotateY(${step.tiltY}deg) rotateX(${step.tiltX}deg) translateZ(${step.tz}px) translateY(60px)`,
                opacity: stepsReveal.visible ? 1 : 0,
                transition: `all 0.8s cubic-bezier(0.22,1,0.36,1) ${i * 0.15}s`,
                transformStyle: 'preserve-3d',
              }}>
                {/* Large step number */}
                <div style={{ fontSize: 56, fontWeight: 900, color: `${step.color}18`, lineHeight: 1, marginBottom: 6, letterSpacing: '-0.03em', fontFamily: 'monospace' }}>{step.num}</div>
                {/* Number chip */}
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 11, background: `${step.color}15`, border: `1px solid ${step.color}35`, marginBottom: 18 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: step.color }}>{parseInt(step.num)}</span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'white', margin: '0 0 12px' }}>{step.title}</h3>
                <p style={{ color: 'rgba(148,163,184,0.72)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>{step.desc}</p>
                {/* Depth indicator dot */}
                <div style={{ position: 'absolute', bottom: 18, right: 18, width: 7, height: 7, borderRadius: '50%', background: step.color, opacity: 0.6, boxShadow: `0 0 10px ${step.color}` }} />
              </div>
            ))}
          </div>

          {/* Connector — spans grid */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24, gap: 0 }}>
            <div style={{ width: 66, height: 1, background: 'linear-gradient(90deg, transparent, #60a5fa)' }} />
            <div style={{ width: 100, height: 1, background: 'linear-gradient(90deg, #60a5fa, #a78bfa)' }} />
            <div style={{ width: 100, height: 1, background: 'linear-gradient(90deg, #a78bfa, #34d399)' }} />
            <div style={{ width: 66, height: 1, background: 'linear-gradient(90deg, #34d399, transparent)' }} />
          </div>
        </div>
      </section>

      {/* ─────────────────────────── FINAL CTA ─────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '0 28px 130px' }}>
        <div ref={ctaReveal.ref} style={{ maxWidth: 820, margin: '0 auto', perspective: 1200 }}>
          <div style={{
            borderRadius: 28, padding: '72px 50px', textAlign: 'center', position: 'relative', overflow: 'hidden',
            background: 'rgba(9,12,28,0.85)', backdropFilter: 'blur(28px)',
            border: '1px solid rgba(59,130,246,0.2)',
            boxShadow: '0 0 120px rgba(59,130,246,0.12), 0 50px 100px rgba(0,0,0,0.6)',
            transform: ctaReveal.visible
              ? `perspective(1200px) rotateX(4deg) rotateY(${mouse.x * 2}deg)`
              : 'perspective(1200px) rotateX(4deg) translateY(50px)',
            opacity: ctaReveal.visible ? 1 : 0,
            transition: ctaReveal.visible
              ? 'opacity 0.8s ease, transform 0.5s cubic-bezier(0.4,0,0.2,1)'
              : 'all 0.8s ease',
            transformOrigin: 'center top',
          }}>
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 80% 60% at 50% 110%, rgba(59,130,246,0.14), transparent)' }} />
            {/* Subtle top beam */}
            <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.5), rgba(139,92,246,0.5), transparent)' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '7px 16px', borderRadius: 100, marginBottom: 28, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.28)' }}>
                <AppLogo size={22} id="cta" />
                <span style={{ color: '#c4b5fd', fontSize: 13, fontWeight: 600 }}>AI Test Copilot</span>
              </div>
              <h2 style={{ fontSize: 48, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 18px', lineHeight: 1.1 }}>
                <span style={{ color: 'white' }}>Start generating</span><br />
                <span style={{ background: 'linear-gradient(135deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>test suites today.</span>
              </h2>
              <p style={{ color: 'rgba(148,163,184,0.8)', fontSize: 16, lineHeight: 1.7, margin: '0 auto 38px', maxWidth: 440 }}>
                Join QA engineers shipping faster with AI-generated suites. Free to start, no card required.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <Link href={isLoggedIn ? '/dashboard' : '/sign-up'} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 34px', borderRadius: 14, fontSize: 16, fontWeight: 700, color: 'white', textDecoration: 'none', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', boxShadow: '0 0 50px rgba(59,130,246,0.35), 0 8px 32px rgba(0,0,0,0.4)' }}>
                  {isLoggedIn ? 'Open Dashboard' : 'Get started free'}
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
                {!isLoggedIn && (
                  <Link href="/sign-in" style={{ display: 'inline-flex', alignItems: 'center', padding: '14px 28px', borderRadius: 14, fontSize: 16, fontWeight: 600, color: 'rgba(203,213,225,0.85)', textDecoration: 'none', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    Sign in
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────── FOOTER ─────────────────────────── */}
      <footer style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.05)', padding: '32px 28px' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AppLogo size={28} id="footer" />
            <div>
              <p style={{ color: 'rgba(203,213,225,0.7)', fontSize: 13, fontWeight: 600, margin: 0 }}>AI Test Copilot</p>
              <p style={{ color: 'rgba(100,116,139,0.6)', fontSize: 11, margin: '2px 0 0' }}>QA Intelligence, Reimagined</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#a78bfa', display: 'inline-block' }} />
            <span style={{ color: 'rgba(100,116,139,0.6)', fontSize: 12 }}>Powered by Lyra AI</span>
            <span style={{ color: 'rgba(100,116,139,0.4)', fontSize: 12, marginLeft: 16 }}>© 2025 AI Test Copilot</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
