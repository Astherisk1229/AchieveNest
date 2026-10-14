import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getCurrentUser } from '../../services/authService'
import apiClient from '../../services/apiClient'
import portfolioService from '../../services/portfolioService'
import ExportPortfolioPreviewModal from './modals/ExportPortfolioPreviewModal'
import campusBanner from '../../assets/ndmu_campus_banner.png'
import { Avatar, AvatarImage, AvatarFallback, AvatarBadge } from '../../components/ui/avatar'
import { AchieveNestLogo } from '../../components/brand'
import StudentCertificateBadge from '../../components/common/StudentCertificateBadge'
import { ArrowRight, BookOpen, Check, CheckCircle2, Clock, CreditCard, FileText, GraduationCap, Mail, RotateCcw, Share2, Sparkles, Trophy } from 'lucide-react'

/**
 * Counts and lists derived only from the student's own /portfolio records.
 * The student never sees any scoring data here.
 */
export function summarizePortfolio(records = []) {
  const byStatus = status => records.filter(record => String(record.status || '').toLowerCase() === status)
  const verified = byStatus('verified')
  const categories = {}
  verified.forEach(record => {
    const name = record.category_name || 'Uncategorized'
    categories[name] = (categories[name] || 0) + 1
  })
  return {
    total: records.filter(record => String(record.status || '').toLowerCase() !== 'draft').length,
    verified: verified.length,
    pending: byStatus('submitted').length,
    returned: byStatus('revision_requested').length,
    verifiedRecords: verified,
    categories: Object.entries(categories).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  }
}

const initials = name => String(name || '').split(' ').filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase() || '?'

export const portfolioAchievementPreviewState = recordId => ({ highlightId: recordId })

export default function StudentPortfolioPage({ currentUser }) {
  const navigate = useNavigate()
  const outletCtx = useOutletContext()
  const { user: authUser } = useAuth()
  const activeUser = currentUser || outletCtx?.currentUser || authUser || getCurrentUser() || {}

  const [records, setRecords] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [showCopiedToast, setShowCopiedToast] = useState(false)

  useEffect(() => {
    let active = true
    Promise.allSettled([portfolioService.fetchRecords(), apiClient.get('/student/profile')])
      .then(([recordResult, profileResult]) => {
        if (!active) return
        if (recordResult.status === 'fulfilled') setRecords(Array.isArray(recordResult.value) ? recordResult.value : [])
        else setLoadError(recordResult.reason?.error?.message || 'Your portfolio records could not be loaded.')
        if (profileResult.status === 'fulfilled') {
          const body = profileResult.value
          setProfile(body?.data?.identity ? body.data : body?.data?.data || null)
        }
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const summary = useMemo(() => summarizePortfolio(records), [records])

  // Identity comes from the authenticated session and /student/profile; nothing is invented.
  const student = {
    full_name: profile?.identity?.full_name || activeUser.full_name || '',
    student_id: profile?.identity?.student_id || activeUser.student_id || activeUser.institutional_id || '',
    email: profile?.identity?.institutional_email || activeUser.email || activeUser.institutional_email || '',
    avatar_url: profile?.identity?.avatar_url || activeUser.avatar_url || null,
    program: profile?.academic?.program_name || activeUser.program || '',
    year_level: profile?.academic?.year_level || '',
    college: profile?.college?.college_name || ''
  }

  const featuredAchievements = summary.verifiedRecords.map(record => ({
    id: record.id,
    title: record.title,
    date: record.start_date || record.occurrence_date || record.verified_at,
    category: record.category_name || 'Achievement',
    certificate: record.certificate || null
  }))

  const evidenceItems = summary.verifiedRecords.flatMap(record => (record.evidence || []).map(evidence => ({
    id: evidence.id,
    title: evidence.original_filename,
    category: record.category_name
  })))

  const handleSharePortfolio = () => {
    navigator.clipboard?.writeText(window.location.href)
    setShowCopiedToast(true)
    setTimeout(() => setShowCopiedToast(false), 3000)
  }

  const handleCategoryClick = name => navigate('/student/achievements', { state: { selectedCategory: name } })

  const statTiles = [
    { label: 'Submitted', value: summary.total, icon: Trophy },
    { label: 'Verified', value: summary.verified, icon: CheckCircle2 },
    { label: 'Pending', value: summary.pending, icon: Clock },
    { label: 'Returned', value: summary.returned, icon: RotateCcw }
  ]

  return (
    <>
      <div className="space-y-6 font-sans pb-12">
        {showCopiedToast && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Portfolio link copied to clipboard!</span>
          </div>
        )}
        {loadError && <div role="alert" className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-2xl">{loadError}</div>}

        {/* HERO */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
          <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-0">
            <svg viewBox="0 0 1200 240" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="studentHeroGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#143d2b" />
                  <stop offset="50%" stopColor="#064e2b" />
                  <stop offset="100%" stopColor="#0d281e" />
                </linearGradient>
              </defs>
              <path d="M 0,0 L 220,0 C 210,70 170,150 90,240 L 0,240 Z" fill="url(#studentHeroGreenGrad)" />
            </svg>
            <div className="absolute top-0 left-0 w-[18%] h-full mix-blend-overlay opacity-30 pointer-events-none overflow-hidden" style={{ clipPath: 'polygon(0 0, 100% 0, 40% 100%, 0 100%)' }}>
              <img src={campusBanner} alt="NDMU Campus Backdrop" width="1200" height="240" className="w-full h-full object-cover" decoding="async" loading="eager" />
            </div>
          </div>

          <div className="relative z-10 px-6 pt-5 sm:px-8 sm:pt-6 flex items-center justify-between">
            <div className="rounded-lg bg-white px-2 py-1"><AchieveNestLogo variant="horizontal" size="compact" /></div>
            <div className="text-xs font-semibold text-slate-400 tracking-wide font-serif italic hidden sm:block">Veritas • Caritas • Excellentia</div>
          </div>

          <div className="px-6 pb-6 pt-6 sm:px-8 sm:pb-8 relative z-20">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="flex flex-col sm:flex-row sm:items-end gap-5">
                <div className="relative shrink-0 z-30 sm:-mb-1">
                  <Avatar size="xl" className="w-28 h-28 sm:w-36 sm:h-36 border-4 border-white shadow-xl aspect-square bg-white">
                    <AvatarImage src={student.avatar_url} alt={student.full_name} fetchPriority="high" decoding="async" loading="eager" />
                    <AvatarFallback className="text-2xl font-black bg-gradient-to-br from-emerald-600 to-[#064e2b]">{initials(student.full_name)}</AvatarFallback>
                    <AvatarBadge className="student-profile-verification-badge" title="Verified Student Profile"><Check /></AvatarBadge>
                  </Avatar>
                </div>
                <div className="space-y-1.5 pt-1 sm:pt-0">
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">{student.full_name || 'Student'}</h2>
                  {student.program && <p className="text-xs font-extrabold text-[#16834a]">{student.program}</p>}
                  <p className="text-xs text-slate-600 font-semibold">{[student.year_level, student.college, 'Notre Dame of Marbel University'].filter(Boolean).join(' • ')}</p>
                  <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px]">
                    {student.program && <div className="px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50/90 text-slate-700 font-semibold flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5 text-[#16834a]" /><span>{student.program}</span></div>}
                    {student.student_id && <div className="px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50/90 text-slate-700 font-semibold flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-[#16834a]" /><span>Student ID: {student.student_id}</span></div>}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-start lg:items-end gap-4 shrink-0 pt-2 lg:pt-0">
                <div className="flex items-center gap-2.5">
                  {statTiles.map(tile => (
                    <div key={tile.label} className="bg-white border border-slate-200/90 rounded-2xl p-3 text-center min-w-[84px] shadow-2xs">
                      <span className="text-xl font-black text-[#064e2b] block leading-none">{loading ? '—' : tile.value}</span>
                      <span className="text-[10px] font-bold text-slate-600 mt-1 block">{tile.label}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button type="button" onClick={handleSharePortfolio} className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-slate-500" /><span>Share</span>
                  </button>
                  <button type="button" onClick={() => setIsExportModalOpen(true)} disabled={summary.verified === 0} className="px-4 py-2 rounded-xl bg-[#16834a] hover:bg-[#123124] text-white text-xs font-extrabold flex items-center gap-1.5 disabled:opacity-50">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-200" /><span>Portfolio Booklet View</span><Sparkles className="w-3 h-3 text-amber-300" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* VERIFIED ACHIEVEMENTS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2"><Trophy className="w-5 h-5 text-[#16834a]" /><span>Verified Achievements</span></h2>
                <span className="text-xs font-bold text-slate-400">{featuredAchievements.length} verified</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {!loading && featuredAchievements.length === 0 && <p className="sm:col-span-2 rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">Verified achievements will appear here after your Program Coordinator approves them.</p>}
                {featuredAchievements.map(item => (
                  <Link
                    key={item.id}
                    to="/student/achievements"
                    state={portfolioAchievementPreviewState(item.id)}
                    aria-label={`View ${item.title || 'verified achievement'}`}
                    className="group overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xs transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                  >
                    <div className="h-20 bg-[#16834a] flex items-center justify-center relative">
                      <Trophy className="w-8 h-8 text-white" />
                      <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-white/90 text-[#064e2b] text-[10px] font-extrabold">Verified</span>
                    </div>
                    <div className="p-4 space-y-2">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">{item.category}</span>
                      <h3 className="text-xs font-bold text-slate-900 leading-snug">{item.title}</h3>
                      {item.date && <p className="text-[11px] text-slate-400 font-medium">{item.date}</p>}
                      {item.certificate && <div className="pt-1"><StudentCertificateBadge certificate={item.certificate} /></div>}
                      <span className="flex items-center gap-1 pt-1 text-[11px] font-bold text-[#16834a] transition group-hover:gap-1.5">
                        View achievement <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* SUPPORTING EVIDENCE */}
            <div className="p-6 sm:p-7 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2"><FileText className="w-5 h-5 text-[#16834a]" /><span>Supporting Evidence</span></h2>
              {evidenceItems.length === 0
                ? <p className="text-xs text-slate-500">Evidence files of verified achievements are listed here.</p>
                : <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {evidenceItems.map(item => (
                    <li key={item.id}>
                      <button type="button" onClick={() => handleCategoryClick(item.category)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left text-xs hover:border-emerald-300">
                        <p className="truncate font-bold text-slate-800">{item.title}</p>
                        <p className="text-[11px] text-slate-500">{item.category}</p>
                      </button>
                    </li>
                  ))}
                </ul>}
              <button type="button" onClick={() => navigate('/student/achievements')} className="text-xs font-bold text-[#16834a] flex items-center gap-1"><span>View all achievements</span><ArrowRight className="w-3.5 h-3.5" /></button>
            </div>
          </div>

          <div className="space-y-6">
            {/* CONTACT (institutional record only) */}
            {student.email && (
              <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2"><Mail className="w-4 h-4 text-[#16834a]" /><span>Contact Information</span></h3>
                <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Institutional email</p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5 break-all">{student.email}</p>
                </div>
              </div>
            )}

            {/* ACHIEVEMENTS BY CATEGORY (verified records) */}
            <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2"><Trophy className="w-4 h-4 text-[#16834a]" /><span>Verified Achievements by Category</span></h3>
              {summary.categories.length === 0
                ? <p className="text-xs text-slate-500">No verified achievements yet.</p>
                : <div className="space-y-2">
                  {summary.categories.map(category => (
                    <button key={category.name} type="button" onClick={() => handleCategoryClick(category.name)} className="w-full p-2.5 rounded-2xl bg-emerald-50/60 hover:bg-[#eef7f0] border border-emerald-100 flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>{category.name}</span>
                      <span className="px-2 py-0.5 rounded-full bg-white text-[#16834a] font-black text-[11px] border border-emerald-200">{category.count}</span>
                    </button>
                  ))}
                </div>}
            </div>

            {/* PORTFOLIO SUMMARY */}
            <div className="p-6 bg-[#133220] text-white rounded-3xl shadow-md space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-200">Portfolio Summary</h3>
              <div className="grid grid-cols-2 gap-3">
                {statTiles.map(tile => (
                  <div key={tile.label} className="p-3 rounded-2xl bg-white/10 border border-emerald-600/30 text-center">
                    <p className="text-2xl font-black text-white">{loading ? '—' : tile.value}</p>
                    <p className="text-[10px] font-bold text-emerald-300 uppercase">{tile.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ExportPortfolioPreviewModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        student={student}
        achievements={summary.verifiedRecords}
      />
    </>
  )
}
