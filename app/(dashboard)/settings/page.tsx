'use client'

import { useState, useRef, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { toast } from 'sonner'

/* ── Preset avatars ── */
const AVATARS = [
  { id: 'aurora',   label: 'Aurora',   gradient: ['#3b82f6', '#8b5cf6'] as [string,string], pattern: 'rings' },
  { id: 'ember',    label: 'Ember',    gradient: ['#f97316', '#ef4444'] as [string,string], pattern: 'burst' },
  { id: 'forest',   label: 'Forest',   gradient: ['#10b981', '#06b6d4'] as [string,string], pattern: 'hex' },
  { id: 'dusk',     label: 'Dusk',     gradient: ['#a855f7', '#ec4899'] as [string,string], pattern: 'star' },
  { id: 'midnight', label: 'Midnight', gradient: ['#1e40af', '#0e7490'] as [string,string], pattern: 'grid' },
  { id: 'rose',     label: 'Rose',     gradient: ['#f43f5e', '#f97316'] as [string,string], pattern: 'petals' },
]

type Pattern = typeof AVATARS[0]['pattern']

function drawPattern(ctx: CanvasRenderingContext2D, size: number, pattern: Pattern) {
  const cx = size / 2, cy = size / 2
  ctx.save()

  if (pattern === 'rings') {
    // Concentric glowing rings
    for (let i = 4; i >= 1; i--) {
      const r = (size * 0.12) * i
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(255,255,255,${0.08 + i * 0.06})`
      ctx.lineWidth = size * 0.025
      ctx.stroke()
    }
    // Inner filled circle
    ctx.beginPath()
    ctx.arc(cx, cy, size * 0.12, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.fill()

  } else if (pattern === 'burst') {
    // Sunburst rays
    const rays = 12
    for (let i = 0; i < rays; i++) {
      const angle = (i / rays) * Math.PI * 2 - Math.PI / 2
      const inner = size * 0.14
      const outer = size * (i % 2 === 0 ? 0.42 : 0.30)
      ctx.beginPath()
      ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner)
      ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer)
      ctx.strokeStyle = `rgba(255,255,255,${i % 2 === 0 ? 0.35 : 0.18})`
      ctx.lineWidth = i % 2 === 0 ? size * 0.022 : size * 0.012
      ctx.lineCap = 'round'
      ctx.stroke()
    }
    ctx.beginPath()
    ctx.arc(cx, cy, size * 0.1, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.fill()

  } else if (pattern === 'hex') {
    // Single large hexagon + small inner hex
    const drawHex = (r: number, alpha: number, lw: number) => {
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 6
        const x = cx + Math.cos(a) * r
        const y = cy + Math.sin(a) * r
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.strokeStyle = `rgba(255,255,255,${alpha})`
      ctx.lineWidth = lw
      ctx.stroke()
    }
    drawHex(size * 0.37, 0.25, size * 0.018)
    drawHex(size * 0.24, 0.35, size * 0.022)
    drawHex(size * 0.12, 0.45, size * 0.028)
    ctx.beginPath()
    ctx.arc(cx, cy, size * 0.07, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,255,255,0.45)'
    ctx.fill()

  } else if (pattern === 'star') {
    // 4-point sparkle + 8-point star
    const drawStar = (spikes: number, outerR: number, innerR: number, alpha: number, lw: number) => {
      ctx.beginPath()
      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR
        const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2
        i === 0 ? ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
                : ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
      }
      ctx.closePath()
      ctx.strokeStyle = `rgba(255,255,255,${alpha})`
      ctx.lineWidth = lw
      ctx.fillStyle = `rgba(255,255,255,${alpha * 0.12})`
      ctx.fill()
      ctx.stroke()
    }
    drawStar(4, size * 0.40, size * 0.17, 0.22, size * 0.016)
    drawStar(4, size * 0.24, size * 0.10, 0.40, size * 0.022)
    // Center diamond
    ctx.beginPath()
    ctx.moveTo(cx, cy - size * 0.08)
    ctx.lineTo(cx + size * 0.055, cy)
    ctx.lineTo(cx, cy + size * 0.08)
    ctx.lineTo(cx - size * 0.055, cy)
    ctx.closePath()
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.fill()

  } else if (pattern === 'grid') {
    // Diamond grid / lattice
    const step = size * 0.175
    ctx.globalAlpha = 0.22
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'
    ctx.lineWidth = size * 0.012
    for (let x = -size * 0.5; x < size * 1.5; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + size, size); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x - size, size); ctx.stroke()
    }
    ctx.globalAlpha = 1
    // Center circle
    ctx.beginPath()
    ctx.arc(cx, cy, size * 0.14, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(cx, cy, size * 0.07, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.fill()

  } else if (pattern === 'petals') {
    // Rose petals (6 rotated ellipses)
    const petals = 6
    for (let i = 0; i < petals; i++) {
      const angle = (i / petals) * Math.PI * 2
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(angle)
      ctx.beginPath()
      ctx.ellipse(0, -size * 0.19, size * 0.09, size * 0.19, 0, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255,255,255,${0.12 + (i % 2) * 0.08})`
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'
      ctx.lineWidth = size * 0.012
      ctx.fill()
      ctx.stroke()
      ctx.restore()
    }
    // Center
    ctx.beginPath()
    ctx.arc(cx, cy, size * 0.1, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,255,255,0.45)'
    ctx.fill()
  }

  ctx.restore()
}

function buildAvatarPng(g: [string, string], pattern: Pattern): Promise<File> {
  return new Promise((resolve, reject) => {
    const size = 400
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) { reject(new Error('canvas unavailable')); return }

    // Circular clip
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
    ctx.clip()

    // Gradient background
    const grad = ctx.createLinearGradient(0, 0, size, size)
    grad.addColorStop(0, g[0])
    grad.addColorStop(1, g[1])
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)

    // Radial sheen (top-left highlight)
    const sheen = ctx.createRadialGradient(size * 0.3, size * 0.28, 0, size * 0.3, size * 0.28, size * 0.75)
    sheen.addColorStop(0, 'rgba(255,255,255,0.22)')
    sheen.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = sheen
    ctx.fillRect(0, 0, size, size)

    // Pattern art
    drawPattern(ctx, size, pattern)

    canvas.toBlob(blob => {
      if (!blob) { reject(new Error('canvas toBlob failed')); return }
      resolve(new File([blob], 'avatar.png', { type: 'image/png' }))
    }, 'image/png')
  })
}

/* Tiny SVG preview rendered in the picker grid (matches what gets uploaded) */
function AvatarPreviewSvg({ av, size = 44 }: { av: typeof AVATARS[0], size?: number }) {
  const [g0, g1] = av.gradient
  const cx = size / 2, cy = size / 2
  const p = av.pattern

  const patternEl = (() => {
    if (p === 'rings') return (
      <>
        {[4,3,2,1].map(i => <circle key={i} cx={cx} cy={cy} r={size*0.12*i} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth={size*0.025}/>)}
        <circle cx={cx} cy={cy} r={size*0.12} fill="rgba(255,255,255,0.35)"/>
      </>
    )
    if (p === 'burst') {
      const rays = 12
      return (
        <>
          {Array.from({length: rays}, (_, i) => {
            const a = (i/rays)*Math.PI*2 - Math.PI/2
            const inner = size*0.14, outer = size*(i%2===0?0.42:0.30)
            return <line key={i}
              x1={cx+Math.cos(a)*inner} y1={cy+Math.sin(a)*inner}
              x2={cx+Math.cos(a)*outer} y2={cy+Math.sin(a)*outer}
              stroke={`rgba(255,255,255,${i%2===0?0.35:0.18})`}
              strokeWidth={i%2===0?size*0.022:size*0.012} strokeLinecap="round"/>
          })}
          <circle cx={cx} cy={cy} r={size*0.1} fill="rgba(255,255,255,0.4)"/>
        </>
      )
    }
    if (p === 'hex') {
      const hexPath = (r: number) => {
        const pts = Array.from({length:6}, (_,i) => {
          const a = (i/6)*Math.PI*2 - Math.PI/6
          return `${cx+Math.cos(a)*r},${cy+Math.sin(a)*r}`
        })
        return `M${pts.join('L')}Z`
      }
      return (
        <>
          <path d={hexPath(size*0.37)} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth={size*0.018}/>
          <path d={hexPath(size*0.24)} fill="none" stroke="rgba(255,255,255,0.32)" strokeWidth={size*0.022}/>
          <path d={hexPath(size*0.12)} fill="none" stroke="rgba(255,255,255,0.42)" strokeWidth={size*0.028}/>
          <circle cx={cx} cy={cy} r={size*0.07} fill="rgba(255,255,255,0.45)"/>
        </>
      )
    }
    if (p === 'star') {
      const starPath = (spikes: number, outerR: number, innerR: number) => {
        const pts = Array.from({length:spikes*2}, (_,i) => {
          const r = i%2===0?outerR:innerR
          const a = (i/(spikes*2))*Math.PI*2 - Math.PI/2
          return `${cx+Math.cos(a)*r},${cy+Math.sin(a)*r}`
        })
        return `M${pts.join('L')}Z`
      }
      return (
        <>
          <path d={starPath(4,size*0.40,size*0.17)} fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.22)" strokeWidth={size*0.016}/>
          <path d={starPath(4,size*0.24,size*0.10)} fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.40)" strokeWidth={size*0.022}/>
          <polygon points={`${cx},${cy-size*0.08} ${cx+size*0.055},${cy} ${cx},${cy+size*0.08} ${cx-size*0.055},${cy}`} fill="rgba(255,255,255,0.5)"/>
        </>
      )
    }
    if (p === 'grid') {
      const step = size*0.175
      const lines = []
      for (let x = -size*0.5; x < size*1.5; x += step) {
        lines.push(<line key={`a${x}`} x1={x} y1={0} x2={x+size} y2={size} stroke="rgba(255,255,255,0.55)" strokeWidth={size*0.012}/>)
        lines.push(<line key={`b${x}`} x1={x} y1={0} x2={x-size} y2={size} stroke="rgba(255,255,255,0.55)" strokeWidth={size*0.012}/>)
      }
      return (
        <>
          <g opacity="0.22">{lines}</g>
          <circle cx={cx} cy={cy} r={size*0.14} fill="rgba(255,255,255,0.3)"/>
          <circle cx={cx} cy={cy} r={size*0.07} fill="rgba(255,255,255,0.5)"/>
        </>
      )
    }
    if (p === 'petals') {
      const petals = 6
      return (
        <>
          {Array.from({length:petals}, (_,i) => {
            const a = (i/petals)*Math.PI*2
            const ex = cx + Math.cos(a)*0, ey = cy - size*0.19
            return (
              <g key={i} transform={`rotate(${(i/petals)*360},${cx},${cy})`}>
                <ellipse cx={cx} cy={cy-size*0.19} rx={size*0.09} ry={size*0.19}
                  fill={`rgba(255,255,255,${0.10+(i%2)*0.08})`} stroke="rgba(255,255,255,0.28)" strokeWidth={size*0.012}/>
              </g>
            )
            void ex; void ey
          })}
          <circle cx={cx} cy={cy} r={size*0.1} fill="rgba(255,255,255,0.45)"/>
        </>
      )
    }
    return null
  })()

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`g-${av.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={g0}/>
          <stop offset="100%" stopColor={g1}/>
        </linearGradient>
        <radialGradient id={`s-${av.id}`} cx="30%" cy="28%" r="75%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.22)"/>
          <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
        </radialGradient>
        <clipPath id={`c-${av.id}`}>
          <circle cx={cx} cy={cy} r={size/2}/>
        </clipPath>
      </defs>
      <g clipPath={`url(#c-${av.id})`}>
        <rect width={size} height={size} fill={`url(#g-${av.id})`}/>
        <rect width={size} height={size} fill={`url(#s-${av.id})`}/>
        {patternEl}
      </g>
    </svg>
  )
}

const inputCls: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 12,
  color: '#e2e8f0',
  padding: '11px 14px',
  fontSize: 14,
  outline: 'none',
  transition: 'border-color 0.15s',
  fontFamily: 'inherit',
}

export default function ProfilePage() {
  const { user, isLoaded } = useUser()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName]   = useState('')
  const [username, setUsername]   = useState('')
  const [saving, setSaving]       = useState(false)
  const [avatarLoading, setAvatarLoading] = useState<string | null>(null)
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? '')
      setLastName(user.lastName ?? '')
      setUsername(user.username ?? '')
    }
  }, [user])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      await user.update({ firstName, lastName, username: username || undefined })
      toast.success('Profile updated')
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'errors' in err
        ? (err as { errors: { message: string }[] }).errors?.[0]?.message
        : 'Update failed'
      toast.error(msg ?? 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarPreset = async (av: typeof AVATARS[0]) => {
    if (!user) return
    setAvatarLoading(av.id)
    try {
      const file = await buildAvatarPng(av.gradient, av.pattern)
      await user.setProfileImage({ file })
      setSelectedAvatar(av.id)
      toast.success(`Avatar set to ${av.label}`)
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'errors' in err
        ? (err as { errors: { message: string }[] }).errors?.[0]?.message
        : null
      toast.error(msg ?? 'Failed to set avatar')
    } finally {
      setAvatarLoading(null)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setAvatarLoading('upload')
    try {
      await user.setProfileImage({ file })
      setSelectedAvatar(null)
      toast.success('Photo updated')
    } catch {
      toast.error('Failed to upload photo')
    } finally {
      setAvatarLoading(null)
      e.target.value = ''
    }
  }

  if (!isLoaded) return null

  const displayName = [firstName, lastName].filter(Boolean).join(' ') || username || user?.emailAddresses[0]?.emailAddress?.split('@')[0] || 'User'

  return (
    <div className="min-h-screen p-8 max-w-2xl">
      {/* Header */}
      <div className="mb-10 animate-fade-up">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
          <span className="text-xs text-slate-500 uppercase tracking-widest font-medium">Account</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Your Profile</h1>
        <p className="text-slate-400 mt-1 text-sm">Manage your identity and preferences.</p>
      </div>

      {/* ── Avatar hero card ── */}
      <div className="rounded-2xl p-6 mb-5 animate-fade-up"
        style={{ background: 'rgba(9,12,28,0.7)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', animationDelay: '60ms' }}>

        {/* Current avatar + upload */}
        <div className="flex items-center gap-5 mb-7">
          <div className="relative flex-shrink-0">
            <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', background: 'conic-gradient(from 0deg, #3b82f6, #8b5cf6, #ec4899, #3b82f6)', padding: 2, zIndex: 0 }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#050712' }} />
            </div>
            <div className="relative z-10" style={{ width: 76, height: 76, borderRadius: '50%', overflow: 'hidden' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={user?.imageUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <button onClick={() => fileRef.current?.click()}
              style={{ position: 'absolute', bottom: 0, right: 0, zIndex: 20, width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', border: '2px solid #050712', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </button>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="hidden" onChange={handleUpload} />
          </div>

          <div className="flex-1">
            <p className="text-base font-bold text-white">{displayName}</p>
            <p className="text-sm text-slate-500 mt-0.5">{user?.emailAddresses[0]?.emailAddress}</p>
            <button onClick={() => fileRef.current?.click()}
              style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(203,213,225,0.8)', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)' }}>
              {avatarLoading === 'upload'
                ? <span style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', display: 'inline-block', animation: 'spin-slow 0.7s linear infinite' }} />
                : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>}
              Upload photo
            </button>
          </div>
        </div>

        {/* Avatar presets */}
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(100,116,139,0.7)', marginBottom: 12 }}>Choose an avatar style</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
            {AVATARS.map((av) => {
              const isSelected = selectedAvatar === av.id
              const isLoading  = avatarLoading === av.id
              const [g0, g1]   = av.gradient
              return (
                <button key={av.id} onClick={() => handleAvatarPreset(av)} disabled={!!avatarLoading}
                  style={{ position: 'relative', padding: 0, border: 'none', background: 'none', cursor: !!avatarLoading ? 'not-allowed' : 'pointer', opacity: !!avatarLoading && !isLoading ? 0.5 : 1, transition: 'opacity 0.15s' }}>
                  {/* Glow ring when selected */}
                  <div style={{
                    position: 'relative', borderRadius: '50%',
                    padding: isSelected ? 2.5 : 1.5,
                    background: isSelected
                      ? `linear-gradient(135deg, ${g0}, ${g1})`
                      : 'rgba(255,255,255,0.08)',
                    transition: 'all 0.25s',
                    boxShadow: isSelected ? `0 0 22px ${g0}70` : 'none',
                    transform: isSelected ? 'scale(1.07)' : 'scale(1)',
                  }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', position: 'relative' }}>
                      {/* SVG preview */}
                      {!isLoading && <AvatarPreviewSvg av={av} size={44}/>}
                      {/* Spinner overlay */}
                      {isLoading && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg,${g0},${g1})` }}>
                          <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin-slow 0.7s linear infinite' }} />
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Check badge */}
                  {isSelected && !isLoading && (
                    <div style={{ position: 'absolute', bottom: 10, right: -1, width: 16, height: 16, borderRadius: '50%', background: '#22c55e', border: '2px solid #050712', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                    </div>
                  )}
                  <p style={{ marginTop: 6, fontSize: 9, color: isSelected ? 'rgba(203,213,225,0.85)' : 'rgba(100,116,139,0.6)', fontWeight: isSelected ? 700 : 600, textAlign: 'center', letterSpacing: '0.03em', transition: 'color 0.2s' }}>{av.label}</p>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Edit profile form ── */}
      <div className="rounded-2xl p-6 mb-5 animate-fade-up"
        style={{ background: 'rgba(9,12,28,0.7)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', animationDelay: '120ms' }}>
        <div className="flex items-center gap-2.5 mb-6">
          <div style={{ width: 28, height: 28, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round">
              <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-white">Edit Profile</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(100,116,139,0.75)', marginBottom: 7 }}>First Name</label>
            <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" style={inputCls}
              onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'rgba(59,130,246,0.45)' }}
              onBlur={e  => { (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.09)' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(100,116,139,0.75)', marginBottom: 7 }}>Last Name</label>
            <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name" style={inputCls}
              onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'rgba(59,130,246,0.45)' }}
              onBlur={e  => { (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.09)' }} />
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(100,116,139,0.75)', marginBottom: 7 }}>Username</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'rgba(100,116,139,0.5)', fontWeight: 600, pointerEvents: 'none' }}>@</span>
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="username" style={{ ...inputCls, paddingLeft: 26 }}
              onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'rgba(59,130,246,0.45)' }}
              onBlur={e  => { (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.09)' }} />
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(100,116,139,0.75)', marginBottom: 7 }}>Email</label>
          <input value={user?.emailAddresses[0]?.emailAddress ?? ''} readOnly
            style={{ ...inputCls, opacity: 0.5, cursor: 'not-allowed', borderStyle: 'dashed' }} />
          <p style={{ fontSize: 10, color: 'rgba(100,116,139,0.5)', marginTop: 5 }}>Email is managed through your authentication provider.</p>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(100,116,139,0.75)', marginBottom: 7 }}>User ID</label>
          <input value={user?.id ?? ''} readOnly
            style={{ ...inputCls, opacity: 0.4, cursor: 'not-allowed', fontFamily: 'monospace', fontSize: 11 }} />
        </div>

        <button onClick={handleSave} disabled={saving}
          style={{ width: '100%', padding: '11px', borderRadius: 13, border: 'none', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: saving ? 0.7 : 1, boxShadow: '0 0 30px rgba(59,130,246,0.2)', transition: 'opacity 0.15s' }}>
          {saving
            ? <><span style={{ width: 15, height: 15, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', display: 'inline-block', animation: 'spin-slow 0.7s linear infinite' }} />Saving…</>
            : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 13l4 4L19 7"/></svg>Save changes</>}
        </button>
      </div>

      {/* ── AI Models ── */}
      <div className="rounded-2xl p-6 mb-5 animate-fade-up"
        style={{ background: 'rgba(9,12,28,0.7)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', animationDelay: '180ms' }}>
        <div className="flex items-center gap-2.5 mb-5">
          <div style={{ width: 28, height: 28, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-white">AI Engine</h2>
        </div>
        <div className="flex items-center justify-between p-4 rounded-xl"
          style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.07), rgba(59,130,246,0.05))', border: '1px solid rgba(139,92,246,0.15)' }}>
          <div>
            <div className="flex items-center gap-2">
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', display: 'inline-block', boxShadow: '0 0 8px #34d399' }} className="animate-pulse" />
              <p className="text-sm font-semibold text-white">Lyra AI</p>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 ml-[15px]">Intelligent test generation with self-healing fallback</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-lg font-semibold" style={{ color: '#34d399', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>Active</span>
        </div>
      </div>

    </div>
  )
}
