import { auth, currentUser } from '@clerk/nextjs/server'
import Link from 'next/link'
import connectDB from '@/lib/mongodb'
import TestSuite from '@/models/TestSuite'
import { computeHealthScore } from '@/lib/health-score'

export const dynamic = 'force-dynamic'

function gradeFromScore(s: number) {
  return s >= 92 ? { grade: 'A+', color: '#10b981', bgColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.25)' } :
         s >= 82 ? { grade: 'A',  color: '#10b981', bgColor: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.2)' } :
         s >= 72 ? { grade: 'B+', color: '#3b82f6', bgColor: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.25)' } :
         s >= 62 ? { grade: 'B',  color: '#3b82f6', bgColor: 'rgba(59,130,246,0.08)', borderColor: 'rgba(59,130,246,0.2)' } :
         s >= 50 ? { grade: 'C+', color: '#eab308', bgColor: 'rgba(234,179,8,0.08)', borderColor: 'rgba(234,179,8,0.2)' } :
         s >= 38 ? { grade: 'C',  color: '#f97316', bgColor: 'rgba(249,115,22,0.08)', borderColor: 'rgba(249,115,22,0.2)' } :
         s >= 22 ? { grade: 'D',  color: '#ef4444', bgColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' } :
                   { grade: '—',  color: '#475569', bgColor: 'rgba(71,85,105,0.06)', borderColor: 'rgba(71,85,105,0.12)' }
}

export default async function DashboardPage() {
  const [{ userId }, user] = await Promise.all([auth(), currentUser()])
  const firstName = user?.firstName ?? 'there'

  let stats = { totalSuites: 0, totalCases: 0, passedCases: 0, runCases: 0, avgHealth: 0 }
  let recentSuites: any[] = []
  let attentionSuites: any[] = []
  let weeklyNew = 0

  try {
    await connectDB()
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const [aggResult, raw, weekCount] = await Promise.all([
      TestSuite.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            totalSuites: { $sum: 1 },
            totalCases: { $sum: { $size: '$testCases' } },
            avgHealth: { $avg: { $ifNull: ['$healthScore', 0] } },
            passedCases: {
              $sum: {
                $size: { $filter: { input: '$testCases', as: 'tc', cond: { $eq: ['$$tc.status', 'pass'] } } }
              }
            },
            runCases: {
              $sum: {
                $size: { $filter: { input: '$testCases', as: 'tc', cond: { $ne: ['$$tc.status', 'not_run'] } } }
              }
            },
          }
        }
      ]),
      TestSuite.aggregate([
        { $match: { userId } },
        { $sort: { createdAt: -1 } },
        { $limit: 9 },
        {
          $project: {
            title: 1, inputType: 1, priority: 1, createdAt: 1, healthScore: 1, testingTypes: 1,
            testCaseCount: { $size: '$testCases' },
            passCount: {
              $size: { $filter: { input: '$testCases', as: 'tc', cond: { $eq: ['$$tc.status', 'pass'] } } }
            },
          }
        }
      ]),
      TestSuite.countDocuments({ userId, createdAt: { $gte: oneWeekAgo } }),
    ])

    const agg = aggResult[0]
    if (agg) {
      stats = { totalSuites: agg.totalSuites, totalCases: agg.totalCases, passedCases: agg.passedCases, runCases: agg.runCases, avgHealth: Math.round(agg.avgHealth ?? 0) }
    }
    weeklyNew = weekCount
    recentSuites = raw.map((s: any) => ({ ...s, _id: String(s._id), createdAt: String(s.createdAt) }))
    attentionSuites = recentSuites.filter((s: any) => (s.healthScore ?? 0) < 50 && (s.healthScore ?? 0) > 0)
  } catch { /* DB unavailable */ }

  const passRate = stats.runCases > 0 ? Math.round((stats.passedCases / stats.runCases) * 100) : 0
  const { grade: avgGrade, color: avgColor } = gradeFromScore(stats.avgHealth)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="min-h-screen p-8 max-w-6xl">

      {/* ── Hero ── */}
      <div className="mb-8 animate-fade-up">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">QA Command Center</span>
        </div>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-black text-white">
              {greeting},{' '}
              <span style={{ background: 'linear-gradient(90deg,#93c5fd,#c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {firstName}
              </span>
            </h1>
            <p className="text-slate-400 mt-1 text-sm">
              {stats.totalSuites === 0
                ? 'Welcome! Generate your first test suite to begin.'
                : `${stats.totalCases.toLocaleString()} test cases · ${stats.totalSuites} suite${stats.totalSuites !== 1 ? 's' : ''}${weeklyNew > 0 ? ` · +${weeklyNew} new this week` : ''}`}
            </p>
          </div>
          <Link href="/generate"
            className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white relative overflow-hidden group"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', boxShadow: '0 0 28px rgba(59,130,246,0.3)' }}>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #60a5fa, #a78bfa)' }} />
            <svg className="relative w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            <span className="relative">Generate Suite</span>
          </Link>
        </div>
      </div>

      {/* ── Metrics ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Test Suites', value: stats.totalSuites, sub: weeklyNew > 0 ? `+${weeklyNew} this week` : 'in your library', gradient: 'from-blue-600/20 to-blue-900/5', glow: 'rgba(59,130,246,0.12)', iconColor: '#60a5fa',
            icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg> },
          { label: 'Test Cases', value: stats.totalCases.toLocaleString(), sub: 'AI-generated', gradient: 'from-emerald-600/20 to-emerald-900/5', glow: 'rgba(16,185,129,0.12)', iconColor: '#34d399',
            icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
          { label: 'Portfolio Health', value: stats.totalSuites > 0 ? `${stats.avgHealth}` : '—', sub: stats.totalSuites > 0 ? `Avg grade ${avgGrade}` : 'No suites yet', gradient: 'from-violet-600/20 to-violet-900/5', glow: `${avgColor}1a`, iconColor: avgColor,
            icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg> },
          { label: 'Pass Rate', value: passRate > 0 ? `${passRate}%` : '—', sub: passRate > 0 ? `${stats.runCases} cases run` : 'No executions yet', gradient: 'from-amber-600/20 to-amber-900/5', glow: 'rgba(234,179,8,0.1)', iconColor: '#fbbf24',
            icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg> },
        ].map((c, i) => (
          <div key={c.label} className={`relative rounded-2xl p-5 overflow-hidden animate-fade-up`}
            style={{ background: 'rgba(9,12,28,0.8)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', boxShadow: `0 0 40px ${c.glow}`, animationDelay: `${i * 60}ms` }}>
            <div className={`absolute inset-0 bg-gradient-to-br ${c.gradient} pointer-events-none`} />
            <div className="relative z-10">
              <div className="mb-3" style={{ color: c.iconColor, opacity: 0.85 }}>{c.icon}</div>
              <p className="text-2xl font-black text-white">{c.value}</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">{c.label}</p>
              <p className="text-xs text-slate-600 mt-0.5">{c.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Attention alert ── */}
      {attentionSuites.length > 0 && (
        <div className="rounded-2xl p-4 mb-6 animate-fade-up" style={{ animationDelay: '280ms', background: 'rgba(249,115,22,0.05)', border: '1px solid rgba(249,115,22,0.18)' }}>
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            <span className="text-sm font-bold text-orange-400">Suites Needing Attention</span>
            <span className="ml-auto text-xs text-slate-500">Low health score — open to run AI Coverage Probe</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {attentionSuites.map(s => {
              const g = gradeFromScore(s.healthScore ?? 0)
              return (
                <Link key={s._id} href={`/suites/${s._id}`}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all hover:-translate-y-px"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(249,115,22,0.15)' }}>
                  <span className="text-xs font-black" style={{ color: g.color }}>{g.grade}</span>
                  <span className="text-xs text-slate-400 max-w-[120px] truncate">{s.title}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Recent suites ── */}
      <div className="flex items-center justify-between mb-4 animate-fade-up" style={{ animationDelay: '320ms' }}>
        <div>
          <h2 className="text-lg font-bold text-white">Recent Test Suites</h2>
          <p className="text-xs text-slate-500 mt-0.5">Health grade computed from coverage breadth, step quality, and test variety</p>
        </div>
        {recentSuites.length > 0 && (
          <Link href="/suites" className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
            View all
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
          </Link>
        )}
      </div>

      {recentSuites.length === 0 ? (
        <div className="rounded-2xl p-16 text-center animate-fade-up" style={{ animationDelay: '380ms', background: 'rgba(9,12,28,0.5)', border: '1px dashed rgba(255,255,255,0.07)' }}>
          <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center animate-float"
            style={{ background: 'linear-gradient(135deg,rgba(59,130,246,0.15),rgba(139,92,246,0.1))', border: '1px solid rgba(59,130,246,0.2)' }}>
            <svg className="w-7 h-7 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
          </div>
          <h3 className="font-bold text-white mb-2">No test suites yet</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">Paste any user story, feature spec, or bug report and Lyra AI generates a full graded test suite.</p>
          <Link href="/generate" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', boxShadow: '0 0 24px rgba(59,130,246,0.3)' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            Start Generating
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentSuites.map((suite, i) => {
            const g = gradeFromScore(suite.healthScore ?? 0)
            return (
              <Link key={suite._id} href={`/suites/${suite._id}`}
                className="group relative rounded-2xl p-5 flex flex-col transition-all duration-200 animate-fade-up glass-hover hover:-translate-y-0.5"
                style={{ background: 'rgba(9,12,28,0.75)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', animationDelay: `${380 + i * 45}ms` }}>

                {/* Health badge */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs"
                  style={{ background: g.bgColor, border: `1px solid ${g.borderColor}` }}>
                  <span className="font-black" style={{ color: g.color }}>{g.grade}</span>
                  {(suite.healthScore ?? 0) > 0 && <span className="text-slate-500 font-medium">{suite.healthScore}</span>}
                </div>

                <div className="flex items-start gap-3 mb-3 pr-16">
                  <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center"
                    style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.15)' }}>
                    <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                  </div>
                  <h3 className="font-bold text-sm text-slate-200 group-hover:text-white transition-colors line-clamp-2 leading-snug">{suite.title}</h3>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap mb-3">
                  <span className="text-xs px-2 py-0.5 rounded-lg font-semibold text-blue-400"
                    style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
                    {suite.testCaseCount} cases
                  </span>
                  {(suite.testingTypes ?? []).slice(0, 2).map((t: string) => (
                    <span key={t} className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                      style={{ background: 'rgba(255,255,255,0.04)', color: '#64748b', border: '1px solid rgba(255,255,255,0.05)' }}>
                      {t.split(' ')[0]}
                    </span>
                  ))}
                </div>

                <div className="mt-auto pt-3 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="text-xs text-slate-600">
                    {new Date(suite.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <svg className="w-3.5 h-3.5 text-slate-700 group-hover:text-slate-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
