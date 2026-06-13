'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton, useUser } from '@clerk/nextjs'
import { cn } from '@/lib/utils'
import AppLogo from './AppLogo'

const navItems = [
  {
    href: '/',
    label: 'Home',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
    exact: true,
  },
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    exact: true,
  },
  {
    href: '/generate',
    label: 'New Suite',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    href: '/suites',
    label: 'All Suites',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user } = useUser()
  const displayName = user?.firstName || user?.username || 'there'

  return (
    <aside className="w-[220px] min-h-screen flex flex-col"
      style={{
        background: 'rgba(5,7,18,0.95)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="transition-transform duration-300 group-hover:scale-105">
            <AppLogo size={34} id="sidebar" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-none">Test Copilot</p>
            <p className="text-[9.5px] mt-0.5 font-semibold tracking-wide" style={{ color: 'rgba(139,92,246,0.75)' }}>LYRA AI</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 pt-4">
        {navItems.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'text-white'
                  : 'text-slate-400 hover:text-slate-200'
              )}
              style={isActive ? {
                background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.1))',
                boxShadow: 'inset 0 0 0 1px rgba(59,130,246,0.2)',
              } : undefined}
            >
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                  style={{ background: 'linear-gradient(180deg, #3b82f6, #8b5cf6)' }}
                />
              )}
              <span className={cn(
                'transition-colors duration-200',
                isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'
              )}>
                {item.icon}
              </span>
              <span>{item.label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Badge */}
      <div className="mx-3 mb-3 p-3 rounded-xl" style={{
        background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.06))',
        border: '1px solid rgba(59,130,246,0.12)',
      }}>
        <p className="text-[10px] font-semibold text-violet-400 uppercase tracking-wider mb-1">Powered by</p>
        <p className="text-[11px] font-semibold text-slate-300">Lyra AI</p>
      </div>

      {/* User */}
      <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <Link href="/settings" className="flex items-center gap-3 group">
          <UserButton appearance={{ elements: { avatarBox: 'w-8 h-8 ring-1 ring-blue-500/30' } }} />
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-300 group-hover:text-white transition-colors truncate">
              Hello, <span style={{ background: 'linear-gradient(90deg,#93c5fd,#c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 700 }}>{displayName}</span>
            </p>
            <p className="text-[10px] text-slate-600 mt-0.5">View profile</p>
          </div>
        </Link>
      </div>
    </aside>
  )
}
