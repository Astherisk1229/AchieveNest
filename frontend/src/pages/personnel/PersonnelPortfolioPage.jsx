import React, { useState, useMemo, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
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
import { fetchOwnProfileFields, lengthOfServiceLabel } from '../../services/personnelProfileService'
import { usePersonnelPortfolio } from '../../hooks/usePersonnelPortfolio'
import PersonnelPortfolioController from '../../controllers/PersonnelPortfolioController'
import { hasValidPersonnelEvidence } from '../../utils/personnelEvidence'
import { derivePersonnelSubmissionContext, derivePersonnelSubmissionActionGate, personnelSubmissionReadiness } from '../../utils/personnelPortfolioState'
import { usesFacultyAcademicPortfolio } from '../../utils/personnelPortfolioFormat'
import { formatPersonnelPlacement } from '../../utils/personnelPlacement'
import PersonnelProfilePhotoService from '../../services/PersonnelProfilePhotoService'
import personnelEvaluationResultService from '../../services/PersonnelEvaluationResultService'
import { getCurrentPersonnelEvaluationPeriod } from '../../services/personnelEvaluationPeriodService'
import { getCurrentEligibility } from '../../services/personnelPortfolioService'
import { facultySubcategoryByCode } from '../../config/facultyAcademicAccomplishmentSchema'
import { CANONICAL_ROLES, normalizeAssignedRoles } from '../../utils/roleContext'

const userHasDeanRole = user => {
  const roles = [
    ...(Array.isArray(user?.assigned_roles) ? user.assigned_roles : []),
    ...(Array.isArray(user?.roles) ? user.roles : []),
    ...(Array.isArray(user?.role_assignments) ? user.role_assignments : [])
  ]
  return normalizeAssignedRoles(roles, user?.account_type || user?.user_type).includes(CANONICAL_ROLES.DEAN)
}

const asObject = value => {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value
  if (typeof value !== 'string') return {}
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch { return {} }
}

const isFacultyResearchOutput = item => {
  const metadata = asObject(item?.category_metadata)
  const code = String(item?.category_code || item?.subcategory_code || metadata.subcategory_code || '').trim().toUpperCase()
  if (['B.3', 'B3_RESEARCH'].includes(code) || code.startsWith('B.3.')) return true
  if (!['B.2', 'B2_PUBLICATION'].includes(code) && !code.startsWith('B.2.')) return false
  const publicationType = String(metadata.details?.publication_type || metadata.publication_type || '').trim().toLowerCase()
  return publicationType.replace(/[\s_-]+/g, ' ') === 'research output'
}

// Eligibility responses may contain structured API issues (for example
// { code, message }) alongside plain text reasons. React cannot render those
// objects directly, so reduce each reason to its human-readable message first.
const eligibilityReasonText = value => {
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (value && typeof value === 'object') {
    if (typeof value.message === 'string') return value.message
    if (typeof value.label === 'string') return value.label
    if (typeof value.code === 'string') return value.code.replaceAll('_', ' ').toLowerCase()
  }
  return ''
}

const portfolioCriterionLabel = item => {
  const snapshot = asObject(item?.criterion_snapshot)
  const criterion = asObject(snapshot.criterion)
  const category = asObject(snapshot.category)
  const metadata = asObject(item?.category_metadata)
  const code = String(criterion.code || item?.subcategory_code || metadata.subcategory_code || category.code || item?.category_code || '').trim()
  const configuredLabel = facultySubcategoryByCode(code)?.label
  const name = String(criterion.name || configuredLabel || category.name || '').trim()
  if (code && name) return `${code} · ${name}`
  return code || name
}

const provisionalScoringFor = item => {
  const snapshot = asObject(item?.criterion_snapshot)
  const saved = asObject(item?.provisional_scoring || snapshot.provisional_scoring)
  if (Object.keys(saved).length > 0) return saved
  const criterion = asObject(snapshot.criterion)
  const configuredPoints = Number(snapshot.configured_points ?? criterion.configured_points ?? criterion.maximum_points)
  if (snapshot.evaluator_judgment_required === true || Number(snapshot.evaluator_judgment_required) === 1
    || criterion.evaluator_judgment_required === true || Number(criterion.evaluator_judgment_required) === 1) {
    return { status: 'evaluator_rating_required', maximum_points: snapshot.criterion_cap ?? snapshot.category?.max_points }
  }
  if (Number.isFinite(configuredPoints) && configuredPoints > 0) {
    return { status: 'pending_verification', points: configuredPoints }
  }
  return {}
}

const provisionalMaximumFor = (item, scoring = provisionalScoringFor(item)) => {
  const snapshot = asObject(item?.criterion_snapshot)
  const category = asObject(snapshot.category)
  const criterion = asObject(snapshot.criterion)
  const maximum = Number(scoring.maximum_points ?? snapshot.criterion_cap ?? criterion.maximum_points ?? category.maximum_points ?? item?.maximum_points)
  return Number.isFinite(maximum) && maximum > 0 ? maximum : null
}

const areaMaximumFor = (item, areaCode) => {
  const snapshot = asObject(item?.criterion_snapshot)
  const snapshotArea = asObject(snapshot.area)
  const category = asObject(snapshot.category)
  const configuration = asObject(snapshot.scoring_configuration)
  const configuredArea = Array.isArray(configuration.areas)
    ? configuration.areas.find(area => String(area?.area_code || '').toUpperCase() === String(areaCode || '').toUpperCase())
    : null
  const maximum = Number(snapshotArea.maximum_points ?? snapshotArea.max_points ?? category.area_max_points ?? configuredArea?.max_points)
  return Number.isFinite(maximum) && maximum > 0 ? maximum : null
}

const categoryMaximumFor = item => {
  const snapshot = asObject(item?.criterion_snapshot)
  const category = asObject(snapshot.category)
  const configuration = asObject(snapshot.scoring_configuration)
  const categoryCode = String(category.code || item?.category_code || '').trim().toUpperCase()
  let configuredCategory = null
  if (Array.isArray(configuration.areas)) {
    for (const area of configuration.areas) {
      configuredCategory = Array.isArray(area?.categories)
        ? area.categories.find(candidate => String(candidate?.category_code || '').trim().toUpperCase() === categoryCode)
        : null
      if (configuredCategory) break
    }
  }
  const maximum = Number(category.maximum_points ?? category.max_points ?? configuredCategory?.max_points)
  return Number.isFinite(maximum) && maximum > 0 ? maximum : null
}

export const submissionPointEstimate = submissionAreas => {
  const groups = new Map()
  const areaMaximums = { A: null, B: null, C: null }
  let calculatedRecords = 0
  let maximumRecords = 0
  let pendingRecords = 0

  submissionAreas.forEach(([area, items]) => items.forEach(item => {
    const scoring = provisionalScoringFor(item)
    const points = Number(scoring.points)
    const hasCalculatedPoints = scoring.points !== null && scoring.points !== undefined && scoring.points !== '' && Number.isFinite(points)
    const maximum = provisionalMaximumFor(item, scoring)
    const areaMaximum = areaMaximumFor(item, area)
    const categoryMaximum = categoryMaximumFor(item)
    if (areaMaximum !== null) {
      areaMaximums[area] = areaMaximums[area] === null ? areaMaximum : Math.min(areaMaximums[area], areaMaximum)
    }
    const useMaximum = !hasCalculatedPoints && ['evaluator_rating_required', 'hr_data_required'].includes(String(scoring.status || '')) && maximum !== null
    if (!hasCalculatedPoints && !useMaximum) {
      pendingRecords += 1
      return
    }

    const snapshot = asObject(item?.criterion_snapshot)
    const category = asObject(snapshot.category)
    const categoryCode = String(category.code || item?.category_code || item?.subcategory_code || item?.id || '').trim()
    const key = `${area}:${categoryCode}`
    const current = groups.get(key) || { area, points: 0, maximum: null }
    current.points += Math.max(0, useMaximum ? maximum : points)
    if (categoryMaximum !== null) current.maximum = current.maximum === null ? categoryMaximum : Math.min(current.maximum, categoryMaximum)
    groups.set(key, current)
    calculatedRecords += 1
    if (useMaximum) maximumRecords += 1
  }))

  const byArea = { A: 0, B: 0, C: 0 }
  groups.forEach(group => {
    byArea[group.area] += group.maximum === null ? group.points : Math.min(group.points, group.maximum)
  })
  Object.keys(byArea).forEach(area => {
    if (areaMaximums[area] !== null) byArea[area] = Math.min(byArea[area], areaMaximums[area])
  })

  return {
    byArea,
    total: byArea.A + byArea.B + byArea.C,
    calculatedRecords,
    maximumRecords,
    pendingRecords,
  }
}

const pointsLabel = value => Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function PersonnelPortfolioPage({ currentUser }) {
  const navigate = useNavigate()
  const location = useLocation()
  const activeUser = currentUser || getCurrentUser()
  const hasDeanRole = userHasDeanRole(activeUser)

  const {
    portfolio,
    latestSubmission,
    submissionHistory,
    submitPortfolio,
    resubmitPortfolio,
    reload,
    loading,
    error: portfolioError,
    returnFeedback
  } = usePersonnelPortfolio(activeUser?.employee_id || activeUser?.id || '')

  // Modals & Toast State
  const [isCanvaModalOpen, setIsCanvaModalOpen] = useState(false)
  const [selectedSnapshot, setSelectedSnapshot] = useState(null)
  const [feedbackSnapshot, setFeedbackSnapshot] = useState(null)
  useEffect(() => {
    if (!feedbackSnapshot) return undefined
    const closeOnEscape = event => { if (event.key === 'Escape') setFeedbackSnapshot(null) }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [feedbackSnapshot])
  const [evaluationResult, setEvaluationResult] = useState(null)
  const [resultLoading, setResultLoading] = useState(false)
  const [resultError, setResultError] = useState('')
  const [resultOpen, setResultOpen] = useState(false)
  const [evaluationPeriod, setEvaluationPeriod] = useState(null)
  const [eligibility, setEligibility] = useState(null)
  const [eligibilityError, setEligibilityError] = useState('')
  const [reviewOpen, setReviewOpen] = useState(() => new URLSearchParams(location.search).has('review'))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')
  const reviewRef = useRef(null)
  const eligibilityReasons = (Array.isArray(eligibility?.eligibility_reasons) ? eligibility.eligibility_reasons : [])
    .map(eligibilityReasonText)
    .filter(Boolean)

  useEffect(() => {
    if (new URLSearchParams(location.search).has('review')) setReviewOpen(true)
  }, [location.search])

  const openReview = () => {
    setReviewOpen(true)
    setSubmitError('')
    window.requestAnimationFrame(() => reviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  useEffect(() => {
    let active = true
    getCurrentPersonnelEvaluationPeriod()
      .then(async response => {
        const period = response?.period || null
        if (!active) return
        setEvaluationPeriod(period)
        let currentEligibility = null
        if (period?.id && period.can_submit) {
          try { currentEligibility = await getCurrentEligibility(period.id) }
          catch { if (active) setEligibilityError('Eligibility could not be loaded. Refresh this page before submitting.') }
        }
        if (active) {
          setEligibility(currentEligibility)
          if (currentEligibility) setEligibilityError('')
        }
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
          ? await getCurrentEligibility(period.id)
          : null
        setEligibility(currentEligibility)
        setEligibilityError('')
      } catch {
        // Keep the last successfully loaded period visible during transient errors.
      }
    }
    const timer = window.setInterval(() => { void refreshScheduledPeriod() }, 60_000)
    return () => window.clearInterval(timer)
  }, [evaluationPeriod?.id, evaluationPeriod?.can_submit])

  const { currentCycleSubmission, isReturned, actionSubmission, actionState } = derivePersonnelSubmissionContext(portfolio, latestSubmission, evaluationPeriod)
  const currentCycleStatus = String(currentCycleSubmission?.status || '').toLowerCase()
  const submissionGate = derivePersonnelSubmissionActionGate({
    portfolioState: actionState,
    evaluationPeriod,
    eligibilityStatus: personnelSubmissionReadiness(eligibility),
    isSubmitting
  })
  const eligiblePreview = useMemo(() => PersonnelPortfolioController.eligiblePortfolioPreview(portfolio), [portfolio])
  const facultySubmission = String(evaluationPeriod?.personnel_group || actionSubmission?.personnel_group_snapshot || activeUser?.personnel_group || '').toUpperCase() === 'FACULTY'
  const nonTeachingSubmission = String(evaluationPeriod?.personnel_group || actionSubmission?.personnel_group_snapshot || activeUser?.personnel_group || '').toUpperCase() === 'NON_TEACHING_FACULTY'
  const submissionAreas = [
    ['A', eligiblePreview?.area_a_items || []],
    ['B', eligiblePreview?.area_b_items || []],
    ...(!nonTeachingSubmission ? [['C', eligiblePreview?.area_c_items || []]] : [])
  ]
  const submissionItems = submissionAreas.flatMap(([, items]) => items)
  const pointEstimate = submissionPointEstimate(submissionAreas)
  const missingProofItems = submissionItems.filter(item => !hasValidPersonnelEvidence(item))
  const researchOutputIncluded = submissionItems.some(item => isFacultyResearchOutput(item) && hasValidPersonnelEvidence(item))
  const researchOutputMissing = facultySubmission && !researchOutputIncluded
  const researchReviewer = eligibility?.review_responsibility === 'hr' || hasDeanRole ? 'HR' : 'the Dean'
  const submissionReady = personnelSubmissionReadiness(eligibility) === 'eligible'
  const submissionReadinessLabel = nonTeachingSubmission && submissionReady
    ? 'Eligible — HR will complete Area A during evaluation'
    : facultySubmission && researchOutputMissing && submissionReady
      ? 'Ready to submit — research evidence will be checked after submission'
      : eligibility?.eligibility_label || eligibility?.eligibility_status || 'Pending'
  const canConfirmSubmission = !loading && !portfolioError && !submissionGate.disabled && submissionItems.length > 0 && missingProofItems.length === 0

  const confirmSubmission = async () => {
    if (!canConfirmSubmission || isSubmitting) return
    setSubmitError('')
    setSubmitSuccess('')
    setIsSubmitting(true)
    try {
      if (submissionGate.action !== 'resubmit') {
        const currentEligibility = await getCurrentEligibility(evaluationPeriod.id)
        setEligibility(currentEligibility)
        if (personnelSubmissionReadiness(currentEligibility) !== 'eligible') {
          setSubmitError('Eligibility has changed. Review the requirements below before submitting.')
          return
        }
      }
      const options = {
        evaluationPeriodId: evaluationPeriod?.id || actionSubmission?.evaluation_period_id || actionSubmission?.evaluation_cycle_id,
        tenureYears: eligibility?.service_requirement?.completed_years ?? eligibility?.service_completed_years ?? currentServiceYears ?? 0
      }
      const result = submissionGate.action === 'resubmit'
        ? await resubmitPortfolio(options)
        : await submitPortfolio(options)
      if (!result?.success) throw new Error(result?.message || 'The portfolio could not be submitted.')
      await reload()
      setReviewOpen(false)
      setSubmitSuccess(submissionGate.action === 'resubmit' ? 'Your revised portfolio was submitted.' : 'Your portfolio was submitted.')
    } catch (submitFailure) {
      setSubmitError(submitFailure?.response?.data?.error?.message || submitFailure?.message || 'The portfolio could not be submitted.')
    } finally {
      setIsSubmitting(false)
    }
  }

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

  // Current display uses the HR employment start date; evaluation snapshots keep their cycle cutoff.
  const [ownProfileFields, setOwnProfileFields] = useState({})
  const [lengthOfService, setLengthOfService] = useState(() => activeUser?.length_of_service || null)
  useEffect(() => {
    let active = true
    fetchOwnProfileFields()
      .then(fields => {
        if (!active) return
        setOwnProfileFields(fields || {})
        if (fields?.length_of_service) setLengthOfService(fields.length_of_service)
      })
      .catch(() => {})
    return () => { active = false }
  }, [activeUser?.id, activeUser?.employee_id])
  const displayedLengthOfService = lengthOfService
    ?? activeUser?.length_of_service
    ?? (activeUser?.tenure_years != null ? { completed_years: activeUser.tenure_years } : null)
    ?? (activeUser?.years_of_service != null ? { completed_years: activeUser.years_of_service } : null)
  const currentServiceYears = displayedLengthOfService?.completed_years
    ?? displayedLengthOfService?.years
    ?? activeUser?.tenure_years
    ?? activeUser?.years_of_service
  const currentBookletPreview = useMemo(() => ({
    ...(portfolio?.toJSON?.() || portfolio || {}),
    academic_year: evaluationPeriod?.can_submit
      ? (evaluationPeriod.academic_year_label || evaluationPeriod.academic_year || portfolio?.academic_year)
      : portfolio?.academic_year,
    current_rank_title: ownProfileFields.current_rank_title || activeUser?.current_rank_title || activeUser?.academic_rank || portfolio?.current_rank_title,
    employment_status: ownProfileFields.employment_status || activeUser?.employment_status || portfolio?.employment_status,
    faculty_engagement: ownProfileFields.faculty_engagement || activeUser?.faculty_engagement || portfolio?.faculty_engagement,
    years_of_service: currentServiceYears ?? portfolio?.years_of_service
  }), [portfolio, evaluationPeriod, currentServiceYears, ownProfileFields, activeUser])

  // Personnel Profile State
  const personnel = { ...(activeUser || { program_affiliations: [] }), ...ownProfileFields }
  const profileTitle = usesFacultyAcademicPortfolio(personnel)
    ? personnel.current_rank_title || personnel.academic_rank || 'Academic rank not recorded'
    : personnel.designation_title || personnel.position_title || personnel.designation || 'Position not recorded'
  const bookletUser = personnel
  const personnelPlacement = { ...(personnel.personnel_affiliation || {}), ...personnel }
  const collegeTag = personnelPlacement.college_name || personnelPlacement.college_code || personnelPlacement.college
  const programTags = (personnelPlacement.program_affiliations || [])
    .map(program => program?.code || program?.name || program?.academic_program_name)
    .filter(Boolean)
  const programLabel = programTags.join(', ')
  const hasAcademicPlacement = String(personnelPlacement.organizational_side || personnelPlacement.personnel_classification || '').toLowerCase() === 'academic'
    || String(personnelPlacement.personnel_group || '').toLowerCase() === 'faculty'
    || programTags.length > 0

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
                Character, Competence, and Culture in harmony
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

                  <p className="mt-1 text-base font-bold leading-snug text-[#16834a] dark:text-emerald-400">{profileTitle}</p>

                  {/* Readable profile details: larger type, clear separation, and natural wrapping. */}
                  <div className={`mt-3 max-w-5xl text-sm ${hasAcademicPlacement && collegeTag && programLabel ? 'grid grid-cols-1 items-start gap-2.5 sm:grid-cols-2 sm:gap-x-3 sm:gap-y-2' : 'flex flex-wrap items-stretch gap-2.5 sm:gap-3'}`}>
                    {hasAcademicPlacement && collegeTag && programLabel ? <>
                      <span className="inline-flex min-h-11 max-w-full justify-self-start items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-semibold leading-snug text-slate-800 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100">
                        <ShieldCheck className="h-4 w-4 shrink-0 text-[#16834a] dark:text-emerald-400" aria-hidden="true" />
                        <span className="min-w-0 break-words">{collegeTag}</span>
                      </span>
                      <span className="inline-flex min-h-11 max-w-full justify-self-start items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-semibold leading-snug text-slate-800 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100">
                        <ShieldCheck className="h-4 w-4 shrink-0 text-[#16834a] dark:text-emerald-400" aria-hidden="true" />
                        <span className="min-w-0 break-words">{programLabel}</span>
                      </span>
                      <span className="inline-flex min-h-11 max-w-full justify-self-start items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-semibold leading-snug text-slate-800 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100">
                        <CreditCard className="h-4 w-4 shrink-0 text-[#16834a] dark:text-emerald-400" aria-hidden="true" />
                        <span>ID: {personnel.employee_id || '—'}</span>
                      </span>
                    </> : <>
                      <span className="inline-flex min-h-11 max-w-full items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-semibold leading-snug text-slate-800 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100">
                        <ShieldCheck className="h-4 w-4 shrink-0 text-[#16834a] dark:text-emerald-400" aria-hidden="true" />
                        <span className="min-w-0 break-words">{formatPersonnelPlacement(personnel)}</span>
                      </span>
                      <span className="inline-flex min-h-11 items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-semibold leading-snug text-slate-800 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100">
                        <CreditCard className="h-4 w-4 shrink-0 text-[#16834a] dark:text-emerald-400" aria-hidden="true" />
                        <span>ID: {personnel.employee_id || '—'}</span>
                      </span>
                    </>}

                    <span
                      data-testid="years-of-service-chip"
                      title={displayedLengthOfService?.requires_hr_verification ? 'Documented employment exception retained for HR verification.' : 'Calculated from the HR-maintained employment start date.'}
                      className={`inline-flex min-h-11 items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-semibold leading-snug text-slate-800 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 ${hasAcademicPlacement && collegeTag && programLabel ? 'justify-self-start' : ''}`}
                    >
                      <Calendar className="h-4 w-4 shrink-0 text-[#16834a] dark:text-emerald-400" aria-hidden="true" />
                      <span>{lengthOfServiceLabel(displayedLengthOfService)}</span>
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
                {evaluationPeriod ? `${evaluationPeriod.period_name || 'Personnel Ranking & Promotion Evaluation'}${evaluationPeriod.academic_year_label ? ` · ${evaluationPeriod.academic_year_label}` : ''}` : isReturned ? `${latestSubmission?.period_name_snapshot || latestSubmission?.academic_year || 'Portfolio'} · Revision requested` : 'No portfolio submission is currently open.'}
              </h2>
              {evaluationPeriod && (
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {evaluationPeriod.operational_enabled === false
                    ? 'This ranking period is temporarily disabled by HR. Existing portfolio records remain available to view.'
                    : evaluationPeriod.can_submit
                    ? 'Review the eligible records and requirements here before submitting for evaluation.'
                    : `HR has scheduled this period${evaluationPeriod.submission_open_at ? ` for ${new Date(evaluationPeriod.submission_open_at).toLocaleDateString()}` : ''}, but submissions are not open yet.`}
                </p>
              )}
              {evaluationPeriod && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  {evaluationPeriod.operational_enabled === false && <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 font-bold text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">Disabled by HR</span>}
                  <span className="rounded-full border border-emerald-300 bg-white px-2.5 py-1 font-bold text-emerald-800 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-300">
                    {currentCycleSubmission ? currentCycleStatus.replaceAll('_', ' ') : (evaluationPeriod.can_submit ? 'Submission window open' : 'Upcoming')}
                  </span>
                  {eligibility && <span className="text-slate-600 dark:text-slate-300">Submission readiness: {submissionReadinessLabel}</span>}
                </div>
              )}
            </div>
            {(evaluationPeriod || isReturned) && (
              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSnapshot(currentBookletPreview)
                    setIsCanvaModalOpen(true)
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-700 bg-white px-3.5 py-2 text-xs font-extrabold text-emerald-900 hover:bg-emerald-50 dark:border-emerald-700 dark:bg-slate-900 dark:text-emerald-200 dark:hover:bg-emerald-950/50"
                >
                  <BookOpen className="h-4 w-4" /> View Saved Portfolio
                </button>
                <button
                  type="button"
                  onClick={openReview}
                  disabled={!submissionGate.visible}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-extrabold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ShieldCheck className="h-4 w-4" />
                  {submissionGate.action === 'resubmit' ? 'Review Revision' : submissionReady ? 'Review Submission' : 'View Requirements'}
                </button>
              </div>
            )}
            {!evaluationPeriod && !isReturned && (
              <button
                type="button"
                onClick={() => {
                  setSelectedSnapshot(currentBookletPreview)
                  setIsCanvaModalOpen(true)
                }}
                className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-extrabold text-white hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
              >
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                View Portfolio
              </button>
            )}
          </div>
          {!evaluationPeriod && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Your permanent accomplishment repository remains available on Profile.</p>}
        </section>

        {submitSuccess && <p role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">{submitSuccess}</p>}

        {reviewOpen && (
          <section ref={reviewRef} id="portfolio-submission-review" aria-labelledby="submission-review-heading" className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="submission-review-heading" className="text-lg font-extrabold text-slate-950 dark:text-white">{submissionGate.action === 'resubmit' ? 'Review revised submission' : 'Review submission'}</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">These are the saved accomplishments eligible for this evaluation. Your saved portfolio booklet may also contain records from other periods.</p>
              </div>
              <button type="button" onClick={() => setReviewOpen(false)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Close review</button>
            </div>

            {isReturned && returnFeedback && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900" role="note">
                <p className="font-bold">Reviewer feedback</p>
                <p className="mt-1">{returnFeedback.reason || returnFeedback.required_corrections || 'Please revise your saved accomplishments and resubmit.'}</p>
                {returnFeedback.required_corrections && returnFeedback.required_corrections !== returnFeedback.reason && <p className="mt-1">{returnFeedback.required_corrections}</p>}
              </div>
            )}

            {!isReturned && <div className="rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-700">
              <h3 className="font-bold text-slate-900 dark:text-white">Submission requirements</h3>
              {eligibility ? <div className="mt-2 grid gap-3 sm:grid-cols-3">
                <div><p>{nonTeachingSubmission ? 'Area A scores' : 'Annual reviews'}: <strong className={nonTeachingSubmission ? '' : 'capitalize'}>{nonTeachingSubmission ? 'HR entry during evaluation' : String(eligibility.annual_review_requirement?.status || 'pending').replaceAll('_', ' ')}</strong></p>{!nonTeachingSubmission && <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{eligibility.annual_review_requirement?.review_1_school_year || 'First required year'}: {String(eligibility.annual_review_requirement?.review_1_rating || 'Pending').replaceAll('_', ' ')} · {eligibility.annual_review_requirement?.review_2_school_year || 'Second required year'}: {String(eligibility.annual_review_requirement?.review_2_rating || 'Pending').replaceAll('_', ' ')}</p>}{nonTeachingSubmission && <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">HR will enter the Area A performance scores after you submit.</p>}</div>
                <p>Service: <strong className="capitalize">{String(eligibility.service_requirement?.status || 'pending').replaceAll('_', ' ')}</strong></p>
                <p>Submission readiness: <strong>{submissionReadinessLabel}</strong></p>
              </div> : <p className="mt-2 text-amber-800">{eligibilityError || submissionGate.periodUnavailableReason || 'Eligibility is being checked.'}</p>}
              {facultySubmission && <p className={`mt-2 text-sm font-semibold ${researchOutputMissing ? 'text-amber-800' : 'text-emerald-700'}`}>Research evidence: {researchOutputMissing ? `No qualifying research record with proof is included in this submission. You may still submit; ${researchReviewer} must verify the research requirement before evaluation.` : `Research record and proof detected. ${researchReviewer} will evaluate this portfolio and verify the evidence.`}</p>}
              {eligibilityReasons.filter(reason => (!nonTeachingSubmission || !/annual.review|annual review/i.test(reason)) && !/research output|research evidence/i.test(reason)).length > 0 && <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700 dark:text-slate-300">{eligibilityReasons.filter(reason => (!nonTeachingSubmission || !/annual.review|annual review/i.test(reason)) && !/research output|research evidence/i.test(reason)).map((reason, index) => <li key={index}>{reason}</li>)}</ul>}
            </div>}

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900 dark:bg-emerald-950/25" role="note" aria-labelledby="estimated-points-heading">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 id="estimated-points-heading" className="font-extrabold text-emerald-950 dark:text-emerald-100">Estimated points</h3>
                  <p className="mt-1 text-xs text-emerald-900 dark:text-emerald-200">Calculated from your eligible records and the current saved criteria. Criteria requiring evaluator or HR scoring use their saved maximum. Final points are determined after verification.</p>
                </div>
                <div className="rounded-xl bg-white px-4 py-2 text-right shadow-sm ring-1 ring-emerald-200 dark:bg-slate-900 dark:ring-emerald-900">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Estimated total</p>
                  <p className="text-2xl font-black tabular-nums text-emerald-800 dark:text-emerald-300">{pointsLabel(pointEstimate.total)} pts</p>
                </div>
              </div>
              <div className={`mt-4 grid grid-cols-1 gap-2 ${nonTeachingSubmission ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
                {submissionAreas.map(([area]) => <div key={area} className="rounded-xl border border-emerald-100 bg-white/90 px-3 py-2 dark:border-emerald-900 dark:bg-slate-900/80"><p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Area {area}</p><p className="mt-0.5 text-lg font-extrabold tabular-nums text-slate-950 dark:text-white">{pointsLabel(pointEstimate.byArea[area])} pts</p></div>)}
              </div>
              <p className="mt-3 text-xs text-emerald-950 dark:text-emerald-100">{pointEstimate.calculatedRecords} record{pointEstimate.calculatedRecords === 1 ? '' : 's'} included in this estimate.{pointEstimate.maximumRecords > 0 ? ` ${pointEstimate.maximumRecords} evaluator/HR-scored record${pointEstimate.maximumRecords === 1 ? ' uses' : 's use'} the maximum possible points.` : ''}{pointEstimate.pendingRecords > 0 ? ` ${pointEstimate.pendingRecords} record${pointEstimate.pendingRecords === 1 ? '' : 's'} cannot be estimated from the current criteria.` : ''}</p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Records for this submission · {submissionItems.length}</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Proof attached to {submissionItems.length - missingProofItems.length} of {submissionItems.length} eligible records.</p>
              {loading ? <p className="mt-2 text-sm text-slate-600">Loading saved records…</p> : submissionItems.length === 0 ? <p className="mt-2 text-sm text-amber-800">No eligible accomplishments are saved for this period. Add records on Profile before submitting.</p> : (
                <div className="mt-3 space-y-3">
                  {submissionAreas.filter(([, items]) => items.length > 0).map(([area, items]) => <div key={area} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Area {area} · {items.length}</h4>
                    <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">{items.map((item, index) => {
                      const criterionLabel = portfolioCriterionLabel(item)
                      const scoring = provisionalScoringFor(item)
                      const estimatedPoints = scoring.points !== null && scoring.points !== undefined && scoring.points !== '' && Number.isFinite(Number(scoring.points)) ? Number(scoring.points) : null
                      const estimatedMaximum = ['evaluator_rating_required', 'hr_data_required'].includes(String(scoring.status || '')) ? provisionalMaximumFor(item, scoring) : null
                      return <li key={item.id || `${area}-${index}`} className="flex flex-wrap items-center justify-between gap-3 py-2 text-sm"><span className="min-w-0 flex-1"><span>{item.title || item.category || 'Untitled accomplishment'}{facultySubmission && isFacultyResearchOutput(item) && <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-800">Research</span>}</span>{criterionLabel && <span className="mt-0.5 block text-xs font-medium text-slate-500 dark:text-slate-400">{criterionLabel}</span>}</span><span className="flex shrink-0 flex-col items-end gap-0.5"><span className={hasValidPersonnelEvidence(item) ? 'font-semibold text-emerald-700' : 'font-semibold text-rose-700'}>{hasValidPersonnelEvidence(item) ? 'Proof attached' : 'Proof missing'}</span>{estimatedPoints !== null ? <span className="text-xs font-bold tabular-nums text-slate-700 dark:text-slate-200">Estimated: {pointsLabel(estimatedPoints)} pts</span> : estimatedMaximum !== null ? <span className="text-xs font-bold tabular-nums text-amber-700 dark:text-amber-300">Estimated maximum: {pointsLabel(estimatedMaximum)} pts</span> : scoring.status ? <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Estimate unavailable</span> : null}</span></li>
                    })}</ul>
                  </div>)}
                </div>
              )}
              {missingProofItems.length > 0 && <p className="mt-2 text-sm font-semibold text-rose-700">{missingProofItems.length} eligible record(s) need proof before submission.</p>}
              {researchOutputMissing && <p className="mt-2 text-sm font-semibold text-amber-800">No qualifying research record with proof is included. The portfolio can be submitted, but the research requirement must be verified before evaluation begins.</p>}
            </div>

            {submitError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-800">{submitError}</p>}
            {portfolioError && <p role="alert" className="text-sm text-rose-700">Saved records could not be loaded: {portfolioError}</p>}
            <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4 dark:border-slate-700">
              <button type="button" onClick={() => navigate('/personnel/dashboard')} className="rounded-xl border border-emerald-700 px-4 py-2.5 text-sm font-bold text-emerald-800 dark:text-emerald-300">Manage accomplishments on Profile</button>
              <button type="button" onClick={confirmSubmission} disabled={!canConfirmSubmission} className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting ? 'Submitting…' : submissionGate.action === 'resubmit' ? 'Confirm and resubmit' : 'Confirm and submit for evaluation'}</button>
              {!canConfirmSubmission && !isSubmitting && <span className="text-sm text-slate-600 dark:text-slate-300">{submissionGate.periodUnavailableReason || (submissionGate.eligibilityBlocked ? (nonTeachingSubmission ? 'Service requirements are not complete.' : 'Annual review or service requirements are not complete.') : missingProofItems.length ? 'Attach proof to every eligible record.' : submissionItems.length === 0 ? 'Add an eligible accomplishment first.' : '')}</span>}
            </div>
          </section>
        )}

        {/* Previous submissions are immutable evaluation snapshots, not living academic-year portfolios. */}
        <PersonnelPortfolioGallery
          latestSubmission={latestSubmission}
          submissionHistory={submissionHistory}
          onOpenBooklet={(card) => {
            setSelectedSnapshot(card?.raw_snapshot || currentBookletPreview)
            setIsCanvaModalOpen(true)
          }}
          onOpenFeedback={(card) => setFeedbackSnapshot(card?.raw_snapshot || null)}
          onViewResult={openCompletedResult}
          onRevise={openReview}
        />

      </div>

      {/* Portfolio Booklet View Presenter Modal */}
      <PersonnelPortfolioBookletModal
        isOpen={isCanvaModalOpen}
        onClose={() => setIsCanvaModalOpen(false)}
        portfolio={selectedSnapshot || currentBookletPreview}
        user={bookletUser}
      />
      {feedbackSnapshot && <div role="presentation" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4" onClick={() => setFeedbackSnapshot(null)}>
        <section role="dialog" aria-modal="true" aria-labelledby="portfolio-feedback-heading" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900" onClick={event => event.stopPropagation()}>
          <h2 id="portfolio-feedback-heading" className="text-lg font-bold text-slate-950 dark:text-white">Reviewer feedback</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{feedbackSnapshot.return_feedback?.reason || feedbackSnapshot.return_reason || 'No written reason was provided.'}</p>
          {feedbackSnapshot.return_feedback?.required_corrections && <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{feedbackSnapshot.return_feedback.required_corrections}</p>}
          <button type="button" autoFocus onClick={() => setFeedbackSnapshot(null)} className="mt-5 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white">Close</button>
        </section>
      </div>}
      {resultOpen && <PersonnelEvaluationResultModal result={evaluationResult} loading={resultLoading} error={resultError} onClose={() => setResultOpen(false)} />}
    </>
  )
}
