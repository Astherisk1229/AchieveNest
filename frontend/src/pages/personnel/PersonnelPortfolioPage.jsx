import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PersonnelPortfolioBookletModal from './PersonnelPortfolioBookletModal'
import PersonnelPortfolioGallery from './PersonnelPortfolioGallery'
import PersonnelEvaluationResultModal from './PersonnelEvaluationResultModal'
import campusBanner from '../../assets/ndmu_campus_banner.png'
import { AchieveNestLogo } from '../../components/brand'

import {
  Calendar,
  BookOpen,
  ShieldCheck,
  CreditCard,
} from 'lucide-react'
import { getCurrentUser } from '../../services/authService'
import { fetchOwnLengthOfService, lengthOfServiceLabel } from '../../services/personnelProfileService'
import { usePersonnelPortfolio } from '../../hooks/usePersonnelPortfolio'
import { formatPersonnelPlacement } from '../../utils/personnelPlacement'
import PersonnelProfilePhotoService from '../../services/PersonnelProfilePhotoService'
import personnelEvaluationResultService from '../../services/PersonnelEvaluationResultService'
import PersonnelPortfolioController from '../../controllers/PersonnelPortfolioController'
import { getCurrentPersonnelEvaluationPeriod } from '../../services/personnelEvaluationPeriodService'
import { getCurrentEligibility } from '../../services/personnelPortfolioService'

export default function PersonnelPortfolioPage({ currentUser }) {
  const navigate = useNavigate()
  const activeUser = currentUser || getCurrentUser()

  const {
    portfolio,
    latestSubmission,
    submissionHistory
  } = usePersonnelPortfolio(activeUser?.employee_id || activeUser?.id || '')

  // Modals & Toast State
  const [isCanvaModalOpen, setIsCanvaModalOpen] = useState(false)
  const [selectedSnapshot, setSelectedSnapshot] = useState(null)
  const [evaluationResult, setEvaluationResult] = useState(null)
  const [resultLoading, setResultLoading] = useState(false)
  const [resultError, setResultError] = useState('')
  const [resultOpen, setResultOpen] = useState(false)
  const [evaluationPeriod, setEvaluationPeriod] = useState(null)
  const [eligibility, setEligibility] = useState(null)

  useEffect(() => {
    let active = true
    getCurrentPersonnelEvaluationPeriod()
      .then(async response => {
        const period = response?.period || null
        if (!active) return
        setEvaluationPeriod(period)
        const currentEligibility = period?.id && period.can_submit
          ? await getCurrentEligibility(period.id).catch(() => null)
          : null
        if (active) setEligibility(currentEligibility)
      })
      .catch(() => {
        if (active) { setEvaluationPeriod(null); setEligibility(null) }
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!evaluationPeriod?.id || evaluationPeriod.can_submit) return undefined
    const refreshScheduledPeriod = async () => {
      try {
        const response = await getCurrentPersonnelEvaluationPeriod()
        const period = response?.period || null
        setEvaluationPeriod(period)
        const currentEligibility = period?.id && period.can_submit
          ? await getCurrentEligibility(period.id).catch(() => null)
          : null
        setEligibility(currentEligibility)
      } catch {
        // Keep the last successfully loaded period visible during transient errors.
      }
    }
    const timer = window.setInterval(() => { void refreshScheduledPeriod() }, 60_000)
    return () => window.clearInterval(timer)
  }, [evaluationPeriod?.id, evaluationPeriod?.can_submit])

  const eligibleBookletPreview = useMemo(
    () => PersonnelPortfolioController.eligiblePortfolioPreview(portfolio),
    [portfolio]
  )
  const currentPeriodId = String(evaluationPeriod?.id || '')
  const latestPeriodId = String(latestSubmission?.evaluation_period_id || latestSubmission?.evaluation_cycle_id || '')
  const currentCycleSubmission = currentPeriodId && latestPeriodId === currentPeriodId ? latestSubmission : null
  const currentCycleStatus = String(currentCycleSubmission?.status || '').toLowerCase()

  const openCompletedResult = async (card) => {
    setResultOpen(true)
    setResultLoading(true)
    setResultError('')
    setEvaluationResult(null)
    try {
      const result = await personnelEvaluationResultService.fetchCompletedResult(card.id)
      setEvaluationResult(result)
    } catch (error) {
      setResultError(error?.response?.data?.error?.message || error?.message || 'Your completed evaluation result could not be loaded.')
    } finally {
      setResultLoading(false)
    }
  }

  // Years of Service (C3): server-computed from the HR service history, full-time only.
  const [lengthOfService, setLengthOfService] = useState(null)
  useEffect(() => {
    let active = true
    fetchOwnLengthOfService().then(service => { if (active) setLengthOfService(service) }).catch(() => {})
    return () => { active = false }
  }, [])

  // Personnel Profile State
  const personnel = activeUser || { program_affiliations: [] }

  const initials = PersonnelProfilePhotoService.getInitials(personnel.full_name)

  return (
    <>
      <div className="space-y-6 font-sans">

        {/* ================= 1. PAGE TITLE HEADER (DARK MODE COMPATIBLE) ================= */}
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Personnel Portfolio</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Review the current HR evaluation portfolio and your previous submitted evaluation snapshots.
          </p>
        </div>

        {/* ================= 2. HERO PROFILE BANNER (COMPACT & SLEEK) ================= */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-6 relative">

          {/* SVG Background Layer */}
          <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-0">
            <svg viewBox="0 0 1200 180" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="heroGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#143d2b" />
                  <stop offset="50%" stopColor="#064e2b" />
                  <stop offset="100%" stopColor="#0d281e" />
                </linearGradient>
              </defs>
              <path d="M 0,0 L 180,0 C 160,50 130,110 45,180 L 0,180 Z" fill="url(#heroGreenGrad)" />
            </svg>

            <div className="absolute top-0 left-0 w-[14%] h-full mix-blend-overlay opacity-30 pointer-events-none overflow-hidden" style={{ clipPath: 'polygon(0 0, 100% 0, 25% 100%, 0 100%)' }}>
              <img
                src={campusBanner}
                alt="NDMU Campus Backdrop"
                width="1200"
                height="180"
                className="w-full h-full object-cover"
                decoding="async"
                loading="eager"
              />
            </div>
          </div>

          {/* Banner Body */}
          <div className="relative z-20 p-5 sm:p-6 space-y-4">

            {/* Top Brand & Motto Bar */}
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-white px-2 py-1"><AchieveNestLogo variant="horizontal" size="compact" /></div>

              <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 tracking-wide font-serif italic hidden sm:block">
                Character, Competence and Culture in harmony
              </div>
            </div>

            {/* Main Info & Metrics Row */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pt-1">

              {/* Avatar + Faculty Info */}
              <div className="flex items-center gap-5 sm:gap-6">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-3 border-white dark:border-slate-800 shadow-md bg-emerald-950 text-emerald-100 overflow-hidden shrink-0 aspect-square flex items-center justify-center font-black text-xl">
                  {personnel.avatar_url ? (
                    <img
                      src={personnel.avatar_url}
                      alt={personnel.full_name}
                      width="96"
                      height="96"
                      className="w-full h-full object-cover rounded-full aspect-square"
                      fetchPriority="high"
                      decoding="async"
                      loading="eager"
                    />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">{personnel.full_name}</h2>
                    <span className="w-4 h-4 rounded-full bg-[#16834a] text-white inline-flex items-center justify-center text-[10px] shadow-xs font-bold" title="Verified Account">
                      ✓
                    </span>
                  </div>

                  <p className="text-xs font-extrabold text-[#16834a] dark:text-emerald-400">{personnel.current_rank_title || personnel.academic_rank || personnel.position_title || personnel.designation || 'Personnel'} • {formatPersonnelPlacement(personnel)}</p>

                  {/* Compact Credential Chips Row */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                    <span className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-[#16834a] dark:text-emerald-400" />
                      {formatPersonnelPlacement(personnel)}
                    </span>

                    <span className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1">
                      <CreditCard className="w-3 h-3 text-[#16834a] dark:text-emerald-400" />
                      ID: {personnel.employee_id || '—'}
                    </span>

                    <span
                      data-testid="years-of-service-chip"
                      title={lengthOfService?.basis && lengthOfService.basis !== 'service_history' ? 'Based on your employment start date; not yet verified by HR service history.' : 'Full-time service recorded by HR. Part-time periods are not counted.'}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1"
                    >
                      <Calendar className="w-3 h-3 text-[#16834a] dark:text-emerald-400" />
                      {lengthOfServiceLabel(lengthOfService)}
                    </span>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

        <section aria-labelledby="current-evaluation-heading" className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-5 dark:border-emerald-900 dark:bg-emerald-950/25">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">Current HR Evaluation</p>
              <h2 id="current-evaluation-heading" className="mt-1 text-lg font-extrabold text-slate-950 dark:text-white">
                {evaluationPeriod ? `${evaluationPeriod.period_name || 'Personnel Ranking & Promotion Evaluation'}${evaluationPeriod.academic_year_label ? ` · ${evaluationPeriod.academic_year_label}` : ''}` : 'No portfolio submission is currently open.'}
              </h2>
              {evaluationPeriod && (
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {evaluationPeriod.can_submit
                    ? 'Portfolio submission period opened by Human Resources.'
                    : `HR has scheduled this period${evaluationPeriod.submission_open_at ? ` for ${new Date(evaluationPeriod.submission_open_at).toLocaleDateString()}` : ''}, but submissions are not open yet.`}
                </p>
              )}
              {evaluationPeriod && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full border border-emerald-300 bg-white px-2.5 py-1 font-bold text-emerald-800 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-300">
                    {currentCycleSubmission ? currentCycleStatus.replaceAll('_', ' ') : (evaluationPeriod.can_submit ? 'Open for submission' : 'Upcoming')}
                  </span>
                  {eligibility?.eligibility_label && <span className="text-slate-600 dark:text-slate-300">Eligibility: {eligibility.eligibility_label}</span>}
                </div>
              )}
            </div>
            {evaluationPeriod && (
              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const frozenSnapshotStatuses = ['submitted', 'in_evaluation', 'ready_for_finalization', 'completed']
                    const hasCurrentFrozenSnapshot = currentCycleSubmission?.items?.length
                      && frozenSnapshotStatuses.includes(currentCycleStatus)
                    setSelectedSnapshot(hasCurrentFrozenSnapshot ? currentCycleSubmission : eligibleBookletPreview)
                    setIsCanvaModalOpen(true)
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-700 bg-white px-3.5 py-2 text-xs font-extrabold text-emerald-900 hover:bg-emerald-50 dark:border-emerald-700 dark:bg-slate-900 dark:text-emerald-200 dark:hover:bg-emerald-950/50"
                >
                  <BookOpen className="h-4 w-4" /> Review Before Submission
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/personnel/portfolio/edit')}
                  disabled={!evaluationPeriod.can_submit || ['submitted', 'in_evaluation', 'ready_for_finalization', 'completed'].includes(currentCycleStatus)}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-extrabold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ShieldCheck className="h-4 w-4" />
                  {currentCycleStatus === 'returned_for_revision' || currentCycleStatus === 'returned_to_personnel' ? 'Revise and Resubmit' : 'Submit Portfolio'}
                </button>
              </div>
            )}
          </div>
          {!evaluationPeriod && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Your permanent accomplishment repository remains available on Profile.</p>}
        </section>

        {/* Previous submissions are immutable evaluation snapshots, not living academic-year portfolios. */}
        <PersonnelPortfolioGallery
          latestSubmission={latestSubmission}
          submissionHistory={submissionHistory}
          onOpenBooklet={(card) => {
            setSelectedSnapshot(card?.raw_snapshot || portfolio)
            setIsCanvaModalOpen(true)
          }}
          onOpenFeedback={(card) => {
            setSelectedSnapshot(card?.raw_snapshot || portfolio)
            setIsCanvaModalOpen(true)
          }}
          onViewResult={openCompletedResult}
        />

      </div>

      {/* Portfolio Booklet View Presenter Modal */}
      <PersonnelPortfolioBookletModal
        isOpen={isCanvaModalOpen}
        onClose={() => setIsCanvaModalOpen(false)}
        portfolio={selectedSnapshot || eligibleBookletPreview}
        user={personnel}
      />
      {resultOpen && <PersonnelEvaluationResultModal result={evaluationResult} loading={resultLoading} error={resultError} onClose={() => setResultOpen(false)} />}
    </>
  )
}
