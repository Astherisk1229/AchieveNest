import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { formatPersonnelPlacement } from '../../utils/personnelPlacement'
import { useNavigate } from 'react-router-dom'
import EditBasicInfoModal from './modals/EditBasicInfoModal'
import PersonnelSubmissionModal from './modals/PersonnelSubmissionModal'
import FacultyAcademicSubmissionModal from './modals/FacultyAcademicSubmissionModal'
import PersonnelPortfolioBookletModal from './PersonnelPortfolioBookletModal'
import SubmissionVersionHistoryModal from './modals/SubmissionVersionHistoryModal'
import PersonnelEvidencePreviewModal from './modals/PersonnelEvidencePreviewModal'
import AchievementPreviewModal from './modals/AchievementPreviewModal'
import RankingCriteriaModel from '../../models/RankingCriteriaModel.js'
import { usePersonnelPortfolio } from '../../hooks/usePersonnelPortfolio'
import { getCurrentUser } from '../../services/authService'
import { useAuth } from '../../context/AuthContext'
import { usesFacultyAcademicPortfolio } from '../../utils/personnelPortfolioFormat'
import PersonnelAchievementController from '../../controllers/PersonnelAchievementController'
import personnelAccomplishmentService, { fetchCurrentEvaluationPeriod } from '../../services/personnelAccomplishmentService'
import portfolioConfigurationService from '../../services/portfolioConfigurationService'
import { getCurrentEligibility } from '../../services/personnelPortfolioService'
import AchievementReuseBadge from '../../components/common/AchievementReuseBadge'
import { hasValidPersonnelEvidence, resolvePersonnelEvidence } from '../../utils/personnelEvidence'
import campusBanner from '../../assets/ndmu_campus_banner.png'
import {
  Plus,
  Trash2,
  Edit3,
  FileText,
  CheckCircle2,
  Sparkles,
  Paperclip,
  ShieldCheck,
  Eye,
  AlertCircle,
  GraduationCap,
  BookOpen,
  Heart,
  Upload,
  Clock,
  CreditCard,
  AlertTriangle,
  Filter,
  Search,
  RefreshCw,
  UploadCloud,
  Scan,
  Share2,
  User,
  ExternalLink,
  Award,
  History,
  GitCommit,
  Lock
} from 'lucide-react'

export default function PersonnelPortfolioEditPage({ currentUser: propUser }) {
  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  const activeUser = propUser || authUser || getCurrentUser() || {
    full_name: 'Dr. Maria Santos',
    employee_id: 'EMP-2021-0842',
    personnel_classification: 'academic',
    college_name: 'College of Information Technology',
    program_affiliations: [{ code: 'BSIT' }],
    active_role_context: 'personnel'
  }

  const {
    portfolio,
    latestSubmission,
    submissionHistory,
    versionNumber,
    returnFeedback,
    isLocked,
    submissionStatus,
    loading,
    error,
    reload,
    submitPortfolio,
    resubmitPortfolio,
    submitToDean,
    loadSubmissionHistory,
    autoPopulateFromVault
  } = usePersonnelPortfolio(activeUser.employee_id || 'EMP-2021-0842', {
    personnel_name: activeUser.full_name,
    academic_rank: activeUser.academic_rank || activeUser.designation,
    college_id: activeUser.college_id || activeUser.college_code,
    college_name: activeUser.college_name,
    program_affiliations: activeUser.program_affiliations,
    years_of_service: activeUser.years_of_service || activeUser.year_level
  })

  // Dynamic Workspace Rubric Configuration State
  const [workspaceConfig, setWorkspaceConfig] = useState(null)
  const [evaluationPeriod, setEvaluationPeriod] = useState(null)
  const [configLoading, setConfigLoading] = useState(false)
  const [eligibility, setEligibility] = useState(null)

  useEffect(() => {
    let mounted = true
    async function loadConfig() {
      try {
        setConfigLoading(true)
        const [res, periodRes] = await Promise.all([
          portfolioConfigurationService.fetchWorkspaceConfiguration(),
          fetchCurrentEvaluationPeriod()
        ])
        if (mounted && res?.data) {
          setWorkspaceConfig(res.data)
        }
        if (mounted) setEvaluationPeriod(periodRes?.period || periodRes?.data?.period || null)
        const period = periodRes?.period || periodRes?.data?.period
        if (mounted && period?.id) setEligibility(await getCurrentEligibility(period.id))
      } catch (err) {
        console.warn('Could not load dynamic workspace configuration, using fallback rubric:', err.message)
      } finally {
        if (mounted) setConfigLoading(false)
      }
    }
    loadConfig()
    return () => { mounted = false }
  }, [activeUser?.id, activeUser?.employee_id])

  // Active Workspace Tab ('A' | 'B' | 'C')
  const [activeArea, setActiveArea] = useState('A')

  // Filter States
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [scopeFilter, setScopeFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Modals State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [editingAccomplishment, setEditingAccomplishment] = useState(null)
  const [previewEvidence, setPreviewEvidence] = useState(null)
  const [viewingAccomplishment, setViewingAccomplishment] = useState(null)
  const [isBookletOpen, setIsBookletOpen] = useState(false)
  const [initialSubmissionCategory, setInitialSubmissionCategory] = useState('A.1 Degree/s')

  // Feedback Toast & Error State
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const activeStatus = (portfolio?.status || latestSubmission?.status || 'draft').toLowerCase()
  const isReturnedForRevision = activeStatus === 'returned_for_revision' || activeStatus === 'returned_to_personnel'
  const isCurrentlyLocked = !isReturnedForRevision && (isLocked || ['submitted', 'in_evaluation', 'ready_for_finalization', 'completed'].includes(activeStatus))
  const isEditable = !isCurrentlyLocked && (activeStatus === 'draft' || isReturnedForRevision)
  const eligibilityBlocked = !isReturnedForRevision && eligibility?.eligibility_status !== 'eligible'

  const showToast = (msg) => {
    setFeedbackMessage(msg)
    setTimeout(() => setFeedbackMessage(''), 3500)
  }

  const isFacultyAcademic = usesFacultyAcademicPortfolio(activeUser)

  // Open Canonical Plan A Submission Modal for Targeted Area
  const handleOpenAddAccomplishment = (areaKey = activeArea) => {
    let defaultCat = ''
    if (isFacultyAcademic) {
      defaultCat = areaKey === 'A'
        ? 'A.1 Education'
        : areaKey === 'B'
          ? 'B.1 Invited as Guest Lecturer / Consultant / Judge / Resource Person'
          : 'C.1.a Moderator of Clubs / Organizations'
    } else {
      defaultCat = areaKey === 'A'
        ? 'A.1 Degree/s'
        : areaKey === 'B'
          ? 'B.1 Guest Lecturer / Consultant / Judge'
          : 'C.1 Involvement in extra-curricular activities'
    }

    setEditingAccomplishment(null)
    setInitialSubmissionCategory(defaultCat)
    setIsSubmissionModalOpen(true)
  }


  // Handle Canonical Achievement Save / Handoff
  const handleSaveAccomplishment = async (newEntry, file, persistence = null) => {
    try {
      if (persistence?.alreadyPersisted) {
        showToast(`Accomplishment "${newEntry.title}" saved with its persisted evidence.`)
      } else if (editingAccomplishment) {
        await personnelAccomplishmentService.updateAccomplishment(editingAccomplishment.id, newEntry)
        if (file) {
          await personnelAccomplishmentService.uploadEvidence(editingAccomplishment.id, file)
        }
        showToast(`Accomplishment "${newEntry.title}" updated successfully!`)
      } else {
        await PersonnelAchievementController.addAchievement(newEntry, file)
        showToast(`Accomplishment "${newEntry.title}" added to canonical repository and reflected in portfolio!`)
      }
      setIsSubmissionModalOpen(false)
      reload()
      return true
    } catch (err) {
      showToast(`Error: ${err.message || 'Failed to save accomplishment'}`)
      return false
    }
  }

  // Handle Canonical Accomplishment Removal
  const handleRemoveLineItem = async (itemId, itemTitleStr) => {
    if (window.confirm(`Are you sure you want to remove "${itemTitleStr}" from your repository and portfolio draft?`)) {
      try {
        await personnelAccomplishmentService.deleteAccomplishment(itemId)
        showToast(`Removed "${itemTitleStr}".`)
        reload()
      } catch (err) {
        showToast(`Failed to remove accomplishment: ${err.message}`)
      }
    }
  }

  const handleAutoPopulate = async () => {
    const res = await autoPopulateFromVault()
    if (res.success) {
      showToast(`Vault Sync: Synced accomplishments from canonical repository into portfolio draft!`)
    } else {
      showToast(`Sync Notice: ${res.message || 'Vault already up to date.'}`)
    }
  }

  // Handle Real Evidence Download
  const handleDownloadEvidence = async (evidenceId, proofFileName) => {
    if (!evidenceId) {
      showToast('No electronic evidence ID linked to this record.')
      return
    }
    try {
      showToast('Downloading evidence document...')
      await personnelAccomplishmentService.downloadEvidenceBlob(evidenceId, proofFileName || 'evidence.pdf')
    } catch (err) {
      showToast(`Failed to download evidence: ${err.message}`)
    }
  }

  // Pre-submission validation: Check for missing proof attachments and execute real server submission or resubmission
  const handleSubmitPortfolio = async () => {
    setSubmitError('')

    const allItems = [
      ...(portfolio?.area_a_items || []),
      ...(portfolio?.area_b_items || []),
      ...(portfolio?.area_c_items || [])
    ]

    if (allItems.length === 0) {
      setSubmitError('Cannot submit an empty portfolio. Please add at least one accomplishment with proof.')
      return
    }

    const missingProofItems = allItems.filter(i => !hasValidPersonnelEvidence(i))

    if (missingProofItems.length > 0) {
      setSubmitError(`Validation Error: ${missingProofItems.length} accomplishment record(s) are missing documentary proof attachments. Please upload proof before submitting.`)
      return
    }

    setIsSubmitting(true)
    try {
      let res
      if (isReturnedForRevision) {
        res = await resubmitPortfolio({
          evaluationPeriodId: evaluationPeriod?.id,
          tenureYears: activeUser.years_of_service
        })
      } else {
        res = await submitPortfolio({
          evaluationPeriodId: evaluationPeriod?.id,
          tenureYears: activeUser.years_of_service
        })
      }

      if (res.success) {
        const vNum = res.version_number ? ` (Version ${res.version_number})` : ''
        showToast(`Portfolio successfully ${isReturnedForRevision ? 'resubmitted' : 'submitted'} for evaluation!${vNum}`)
        reload()
      } else {
        setSubmitError(res.message || 'Submission failed.')
      }
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit portfolio.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Active Area Items Array
  const getActiveAreaItems = () => {
    if (!portfolio) return []
    if (activeArea === 'A') return portfolio.area_a_items || []
    if (activeArea === 'B') return portfolio.area_b_items || []
    if (activeArea === 'C') return portfolio.area_c_items || []
    return []
  }

  const rawAreaItems = getActiveAreaItems()

  // Filtered Area Items
  const currentAreaItems = rawAreaItems.filter(item => {
    const matchesCat = categoryFilter === 'ALL' || item.category?.toLowerCase().includes(categoryFilter.toLowerCase())
    const matchesScope = scopeFilter === 'ALL' || item.scope_level === scopeFilter
    const matchesSearch = !searchQuery || item.title?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCat && matchesScope && matchesSearch
  })

  const allPortfolioItems = [...(portfolio?.area_a_items || []), ...(portfolio?.area_b_items || []), ...(portfolio?.area_c_items || [])]
  const persistedEvidenceCount = allPortfolioItems.filter(hasValidPersonnelEvidence).length
  const periodUnavailableReason = !evaluationPeriod
    ? 'No personnel evaluation period is currently open for submission.'
    : !evaluationPeriod.can_submit
      ? 'The current personnel evaluation period is outside its submission window.'
      : ''

  // Categories for active dropdown
  const currentHierarchy = ['A', 'B', 'C'].includes(activeArea) ? RankingCriteriaModel.CATEGORIES_HIERARCHY[activeArea] : null
  const availableCategories = currentHierarchy ? Object.keys(currentHierarchy.categories) : []

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-6 font-sans">

        {/* Feedback Alert Toast */}
        {feedbackMessage && (
          <div className="p-4 rounded-2xl bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-between shadow-xl animate-fade-in z-50">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {feedbackMessage}
            </span>
            <button type="button" onClick={() => setFeedbackMessage('')} className="text-white/80 hover:text-white font-bold">✕</button>
          </div>
        )}

        {submitError && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 font-bold text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}
        {eligibility && <section aria-labelledby="eligibility-heading" className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 id="eligibility-heading" className="font-extrabold text-slate-950 dark:text-white">Portfolio evaluation eligibility</h2><p className="mt-1 text-xs leading-5 text-slate-500">Official annual-review evidence and HR-maintained service information determine submission readiness.</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${eligibility.eligibility_status === 'eligible' ? 'bg-emerald-100 text-emerald-800' : eligibility.eligibility_status === 'not_eligible' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-900'}`}>{eligibility.eligibility_label}</span></div><dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3"><div><dt className="text-xs font-semibold text-slate-500">Annual review requirement</dt><dd className="mt-1 space-y-1"><span className="block"><strong>{eligibility.annual_review_requirement?.review_1_school_year || 'First required year'}</strong> · {(eligibility.annual_review_requirement?.review_1_rating || 'Pending').replaceAll('_', ' ')}</span><span className="block"><strong>{eligibility.annual_review_requirement?.review_2_school_year || 'Second required year'}</strong> · {(eligibility.annual_review_requirement?.review_2_rating || 'Pending').replaceAll('_', ' ')}</span><span className="block font-bold capitalize">Two Annual Reviews: {(eligibility.annual_review_requirement?.status || 'pending').replaceAll('_', ' ')}</span></dd></div><div><dt className="text-xs font-semibold text-slate-500">Service requirement</dt><dd className="mt-1 font-bold capitalize">{(eligibility.service_requirement?.status || 'pending').replaceAll('_', ' ')}</dd></div><div><dt className="text-xs font-semibold text-slate-500">Portfolio evaluation eligibility</dt><dd className="mt-1 font-bold">{eligibility.eligibility_label}</dd></div></dl>{eligibility.eligibility_reasons?.length > 0 && <p className="mt-3 text-xs leading-5 text-slate-600 dark:text-slate-300">{eligibility.eligibility_reasons.join(' ')}</p>}</section>}
        {/* Lock Notification Notice */}
        {isCurrentlyLocked && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 font-bold text-xs flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <div className="font-extrabold text-sm">Portfolio Submitted & Locked Under Review</div>
                <div className="text-xs font-medium text-amber-800 dark:text-amber-300 mt-0.5">
                  Your portfolio snapshot is currently in <strong>{portfolio?.status || latestSubmission?.status || 'submitted'}</strong> state and is immutable. Personnel may view submitted records, but no changes can be made while under evaluation.
                </div>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 shrink-0">
              Read-Only
            </span>
          </div>
        )}

        {/* Returned for Revision Feedback Notice */}
        {isReturnedForRevision && (
          <div className="p-5 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-200 shadow-xs space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-black text-sm text-rose-900 dark:text-rose-100 flex items-center gap-2">
                    <span>Portfolio Returned for Revision</span>
                    {returnFeedback?.returned_at && (
                      <span className="text-[10px] font-semibold text-rose-700 dark:text-rose-400">
                        • {new Date(returnFeedback.returned_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-semibold text-rose-800 dark:text-rose-300">
                    Reviewer: <strong>{returnFeedback?.reviewer_name || 'Authorized Reviewer'}</strong>
                  </div>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100 shrink-0">
                Revision Required
              </span>
            </div>

            {/* Overall Reason */}
            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-rose-200 dark:border-rose-900 space-y-1">
              <div className="text-[10px] font-extrabold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                Overall Return Reason
              </div>
              <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                {returnFeedback?.reason || portfolio?.return_reason || 'Revisions requested by reviewer.'}
              </p>
            </div>

            {/* Required Corrections */}
            {returnFeedback?.required_corrections && (
              <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-rose-200 dark:border-rose-900 space-y-1">
                <div className="text-[10px] font-extrabold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                  Required Corrections & Action Items
                </div>
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200 whitespace-pre-line">
                  {returnFeedback.required_corrections}
                </p>
              </div>
            )}

            {/* Item-Level Deficiencies */}
            {Array.isArray(returnFeedback?.item_deficiencies) && returnFeedback.item_deficiencies.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="text-[10px] font-extrabold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                  Item-Level Deficiency Remarks ({returnFeedback.item_deficiencies.length})
                </div>
                <div className="space-y-2">
                  {returnFeedback.item_deficiencies.map((def, idx) => (
                    <div key={def.evaluation_item_id || idx} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 text-xs">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-mono text-[10px]">
                          {def.criterion_code || 'Item'}
                        </span>
                        <span>{def.criterion_title || `Deficiency #${idx + 1}`}</span>
                      </div>
                      <div className="text-rose-700 dark:text-rose-300 font-medium mt-1">
                        "{def.comment}"
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-[11px] text-rose-800 dark:text-rose-300 font-medium">
              💡 <em>Your working portfolio draft below is reopened for editing. You may add, edit, or remove accomplishments and proof files as requested before resubmission.</em>
            </div>
          </div>
        )}

        {/* ================= 1. PAGE TOP SUMMARY & PORTFOLIO DOSSIER BANNER ================= */}
        <div className="bg-[#EFF7F0] p-4 sm:p-5 rounded-3xl shadow-xs border border-[#69A97C] space-y-4">

          {/* Top Bar Actions & Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DDE7DF] pb-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#E7F3E9] text-[#17663B] border border-[#69A97C]">
                Personnel Dossier Workbench
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                activeStatus === 'completed' || activeStatus === 'hr_approved' ? 'bg-[#E7F5EA] text-[#17663B] border border-[#BBDCC3]' :
                activeStatus === 'in_evaluation' || activeStatus === 'endorsed_to_hr' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                activeStatus === 'ready_for_finalization' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                activeStatus === 'submitted' ? 'bg-[#FFF8E7] text-[#B65F00] border border-[#E7A51D]' :
                activeStatus === 'returned_for_revision' || activeStatus === 'returned_to_personnel' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                'bg-slate-100 text-slate-700 border border-slate-300'
              }`}>
                STATUS: {portfolio?.status || latestSubmission?.status || 'DRAFT'}
              </span>
              <span className="text-xs font-bold text-[#245F42] hidden md:inline">
                {evaluationPeriod ? `${evaluationPeriod.period_name} • ${evaluationPeriod.academic_year_label} · ${evaluationPeriod.semester_label}` : 'No evaluation period open'}
              </span>
            </div>

            {/* Primary Portfolio Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <button type="button" onClick={() => setIsBookletOpen(true)} className="px-3.5 py-1.5 rounded-xl bg-[#245F42] hover:bg-[#1B4731] text-white font-extrabold text-xs flex items-center gap-1.5 transition shadow-sm">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Portfolio Booklet</span>
              </button>
              {/* Submission History Action */}
              <button
                type="button"
                onClick={() => {
                  loadSubmissionHistory()
                  setIsHistoryModalOpen(true)
                }}
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#F1F7F2] text-[#183B2A] font-extrabold text-xs border border-[#DCE6DF] flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                title="View point-in-time submission versions and feedback history"
              >
                <History className="w-3.5 h-3.5 text-[#159552]" />
                <span>History</span>
                {submissionHistory.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                    v{versionNumber}
                  </span>
                )}
              </button>

              {/* Action 1: Edit Profile */}
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#F1F7F2] text-[#183B2A] font-extrabold text-xs border border-[#DCE6DF] flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              >
                <User className="w-3.5 h-3.5 text-[#159552]" />
                <span>Edit Profile</span>
              </button>

              {/* Action 2: Manage Portfolio Draft / Resubmission */}
              {isEditable && (
                <button
                  type="button"
                  onClick={handleSubmitPortfolio}
                  disabled={isSubmitting || Boolean(periodUnavailableReason) || eligibilityBlocked}
                  className={`px-4 py-1.5 rounded-xl disabled:opacity-50 text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 transition cursor-pointer ${
                    isReturnedForRevision
                      ? 'bg-emerald-600 hover:bg-emerald-700 ring-2 ring-emerald-400/50'
                      : 'bg-[#159552] hover:bg-[#117A43]'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-white" />
                  <span>
                    {isSubmitting
                      ? (isReturnedForRevision ? 'Resubmitting...' : 'Submitting...')
                      : (isReturnedForRevision ? `Resubmit Portfolio (v${versionNumber + 1})` : 'Submit Portfolio')}
                  </span>
                </button>
              )}
              {isEditable && periodUnavailableReason && <p className="w-full text-right text-[11px] font-semibold text-amber-800">{periodUnavailableReason}</p>}
              {isEditable && !periodUnavailableReason && eligibilityBlocked && <p className="w-full max-w-xl text-right text-[11px] font-semibold text-amber-800">Portfolio submission is unavailable: {eligibility?.eligibility_reasons?.join(' ') || 'eligibility is still being confirmed.'}</p>}

              {/* Action 3: Share */}
              <button
                type="button"
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(window.location.href)
                  }
                  showToast('Portfolio link copied to clipboard!')
                }}
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#F1F7F2] text-[#183B2A] font-extrabold text-xs border border-[#DCE6DF] flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              >
                <Share2 className="w-3.5 h-3.5 text-[#159552]" />
                <span>Share</span>
              </button>
            </div>
          </div>

          {/* Workflow Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Attached Proof Certificates Card */}
            <div className="p-3.5 rounded-2xl bg-white border border-[#D9E5DC] space-y-1">
              <div className="text-[10px] font-extrabold text-[#245F42] uppercase tracking-wider">
                Canonical Achievements
              </div>
              <div className="text-xl font-black text-[#102A43]">
                {[...(portfolio?.area_a_items || []), ...(portfolio?.area_b_items || []), ...(portfolio?.area_c_items || [])].length} <span className="text-xs font-semibold text-[#64748B]">Records Reflected</span>
              </div>
              <div className="text-[10px] font-medium text-[#245F42]">
                Reflecting live from Plan A achievement repository
              </div>
            </div>

            {/* Persisted evidence coverage */}
            <div className="p-3.5 rounded-2xl bg-white border border-[#D9E5DC] space-y-1">
              <div className="text-[10px] font-extrabold text-[#245F42] uppercase tracking-wider">
                Evidence Coverage
              </div>
              <div className="text-xl font-black text-[#102A43]">
                {persistedEvidenceCount} <span className="text-xs font-semibold text-[#64748B]">of {allPortfolioItems.length} records</span>
              </div>
              <div className="text-[10px] font-medium text-[#476256]">
                Only secured, persisted PDF or image files count as attached.
              </div>
            </div>

            {/* Submission Status Card */}
            <div className={`p-3.5 rounded-2xl border space-y-1 ${
              activeStatus === 'completed' || activeStatus === 'hr_approved' ? 'bg-[#E7F5EA] border-[#BBDCC3]' :
              activeStatus === 'in_evaluation' || activeStatus === 'endorsed_to_hr' ? 'bg-blue-50 border-blue-200' :
              activeStatus === 'ready_for_finalization' ? 'bg-purple-50 border-purple-200' :
              activeStatus === 'submitted' ? 'bg-[#FFF8E7] border-[#E7A51D]' :
              activeStatus === 'returned_for_revision' || activeStatus === 'returned_to_personnel' ? 'bg-rose-50 border-rose-200' :
              'bg-slate-50 border-slate-200'
            }`}>
              <div className={`text-[10px] font-extrabold uppercase tracking-wider ${
                activeStatus === 'completed' || activeStatus === 'hr_approved' ? 'text-[#17663B]' :
                activeStatus === 'in_evaluation' || activeStatus === 'endorsed_to_hr' ? 'text-blue-700' :
                activeStatus === 'ready_for_finalization' ? 'text-purple-700' :
                activeStatus === 'submitted' ? 'text-[#B65F00]' :
                activeStatus === 'returned_for_revision' || activeStatus === 'returned_to_personnel' ? 'text-rose-700' :
                'text-slate-600'
              }`}>
                Submission Status
              </div>
              <div className={`text-xl font-black truncate uppercase ${
                activeStatus === 'completed' || activeStatus === 'hr_approved' ? 'text-[#17663B]' :
                activeStatus === 'in_evaluation' || activeStatus === 'endorsed_to_hr' ? 'text-blue-700' :
                activeStatus === 'ready_for_finalization' ? 'text-purple-700' :
                activeStatus === 'submitted' ? 'text-[#B65F00]' :
                activeStatus === 'returned_for_revision' || activeStatus === 'returned_to_personnel' ? 'text-rose-700' :
                'text-slate-800'
              }`}>
                {portfolio?.status || latestSubmission?.status || 'DRAFT'}
              </div>
              <div className={`text-[10px] font-medium ${
                isCurrentlyLocked ? 'text-amber-700 font-semibold' : 'text-slate-500'
              }`}>
                {isCurrentlyLocked ? 'Submitted & Locked Under Review' : 'Working Draft (Editable)'}
              </div>
            </div>
          </div>
        </div>

        {/* ================= 2. FACULTY COMPACT MINI BANNER ================= */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#D9E5DC] dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <img
              src={activeUser.avatar_url || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"}
              alt={activeUser.full_name}
              className="w-10 h-10 rounded-xl object-cover border border-[#D9E5DC] shrink-0"
            />
            <div>
              <h2 className="text-sm font-extrabold text-[#17663B] dark:text-white leading-tight">
                {activeUser.full_name} <span className="text-xs font-normal text-[#245F42]">• {activeUser.academic_rank || 'Associate Professor'}</span>
              </h2>
              <p className="text-xs text-[#245F42] font-medium">
                {formatPersonnelPlacement(activeUser)} • ID: {activeUser.employee_id}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsEditProfileOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#F1F7F2] text-[#183B2A] border border-[#DCE6DF] text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto shrink-0 shadow-2xs"
          >
            <User className="w-3.5 h-3.5 text-[#159552]" />
            <span>Edit Profile</span>
          </button>
        </div>

        {/* Backend Error State Banner */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Failed to load achievements from repository: {error}</span>
            </div>
            <button
              type="button"
              onClick={reload}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-extrabold transition cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Dynamic Scale & Version Banner */}
        {workspaceConfig?.scale && (
          <div className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 dark:text-slate-200">Official Rubric:</span>
              <span className="font-extrabold text-[#17663B] dark:text-emerald-400">{workspaceConfig.scale.title}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                v{workspaceConfig.version?.version_number} ({workspaceConfig.evaluation_cycle_id})
              </span>
            </div>
            <div className="text-[11px] font-semibold text-slate-500">
              Official evaluation criteria are applied by the assigned reviewer after submission.
            </div>
          </div>
        )}

        {/* ================= 3. WORKSPACE CATEGORY TABS ================= */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-3 scrollbar-none">
          {(workspaceConfig?.areas || [
            { area_code: 'A', name: 'Area A: Professional Development' },
            { area_code: 'B', name: 'Area B: Productivity' },
            { area_code: 'C', name: 'Area C: Service & Leadership' }
          ]).map((area) => {
            const isSelected = activeArea === area.area_code
            const itemCount = area.area_code === 'A'
              ? (portfolio?.area_a_items?.length || 0)
              : area.area_code === 'B'
                ? (portfolio?.area_b_items?.length || 0)
                : (portfolio?.area_c_items?.length || 0)

            return (
              <button
                key={area.area_code}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => { setActiveArea(area.area_code); setCategoryFilter('ALL'); setScopeFilter('ALL'); }}
                className={`portfolio-area-tab px-5 py-2.5 rounded-2xl text-xs flex items-center gap-2 shrink-0 cursor-pointer transition ${isSelected ? 'is-active' : ''}`}
              >
                {area.area_code === 'A' && <GraduationCap className="w-4 h-4 area-tab-icon" />}
                {area.area_code === 'B' && <BookOpen className="w-4 h-4 area-tab-icon" />}
                {area.area_code === 'C' && <Heart className="w-4 h-4 area-tab-icon" />}
                <span>{area.name}</span>
                {area.entry_policy === 'personnel_entry_disallowed_read_only' ? (
                  <span className="area-tab-count px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-200 font-semibold">
                    Read-Only
                  </span>
                ) : (
                  <span className="area-tab-count px-2 py-0.5 rounded-full text-[10px]">
                    {itemCount} Entries
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* ================= 4. ACTIVE TAB CONTENT WORKBENCH ================= */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-5">
          {(() => {
            const currentAreaConfig = (workspaceConfig?.areas || []).find(a => a.area_code === activeArea) || {
              area_code: activeArea,
              name: activeArea === 'A' ? 'Area A: Professional Development' : activeArea === 'B' ? 'Area B: Productivity & Creative Work' : 'Area C: Service & Leadership',
              description: activeArea === 'A' ? 'Educational degrees, certifications, memberships, and seminars.' : activeArea === 'B' ? 'Publications, journal articles, keynote lectures, and research grants.' : 'Committee leadership, faculty adviserships, and extension projects.',
              is_personnel_entry_allowed: true,
              entry_policy: 'personnel_entry_allowed'
            }

            const isDisallowed = currentAreaConfig.entry_policy === 'personnel_entry_disallowed_read_only' || currentAreaConfig.is_personnel_entry_allowed === false

            return (
              <>
                {/* Section Toolbar & Title */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                        {currentAreaConfig.name}
                      </h3>
                      {isDisallowed && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-200 uppercase">
                          Evaluator Indicator Area
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {String(currentAreaConfig.description || '').replace(/\s*\([^)]*(?:points?|pts?)[^)]*\)\.?/ig, '').trim()}
                    </p>
                  </div>

                  {/* Section Actions: Import from Vault & Add Accomplishment */}
                  {isEditable && !isDisallowed && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleAutoPopulate}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Refresh Portfolio</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenAddAccomplishment(activeArea)}
                        className="px-4 py-2 rounded-xl bg-[#16834a] hover:bg-[#236e3e] text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Add Accomplishment to Area {activeArea}</span>
                      </button>
                    </div>
                  )}
                </div>

                {isDisallowed ? (
                  <div className="p-8 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-center space-y-3">
                    <div className="inline-flex items-center justify-center p-3 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
                      <Lock className="w-6 h-6" />
                    </div>
                    <h4 className="font-extrabold text-sm text-amber-950 dark:text-amber-100">
                      {currentAreaConfig.name}
                    </h4>
                    <p className="text-xs text-amber-800 dark:text-amber-300 max-w-xl mx-auto font-medium leading-relaxed">
                      {currentAreaConfig.description || 'This section is evaluated directly by institutional leadership and supervisor performance assessments. Direct personnel accomplishment entry is not required or permitted.'}
                    </p>
                    <div className="inline-block px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 mt-2">
                      Official Non-Entry Section
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Filtering Control Toolbar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <select
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none"
                        >
                          <option value="ALL">All Categories</option>
                          {(currentAreaConfig.categories ? currentAreaConfig.categories.map(c => c.name) : availableCategories).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>

                        <select
                          value={scopeFilter}
                          onChange={(e) => setScopeFilter(e.target.value)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none"
                        >
                          <option value="ALL">All Geographic Scopes</option>
                          <option value="Local">Local / Institutional</option>
                          <option value="Regional">Regional</option>
                          <option value="National">National</option>
                          <option value="International">International</option>
                        </select>
                      </div>

                      <div className="relative w-full sm:w-64">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search accomplishments..."
                          className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none"
                        />
                      </div>
                    </div>
                  </>
                )}
              </>
            )
          })()}


          {/* Loading Skeleton */}
          {loading ? (
            <div className="p-12 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                Loading canonical accomplishments from repository...
              </p>
            </div>
          ) : error ? (
            <div className="p-10 text-center space-y-3" role="alert">
              <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
              <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Portfolio records could not be loaded.</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Retry to restore the authoritative accomplishment list.</p>
              <button type="button" onClick={reload} className="rounded-xl bg-rose-700 px-4 py-2 text-xs font-extrabold text-white focus:outline-none focus:ring-2 focus:ring-rose-500">Retry Loading</button>
            </div>
          ) : currentAreaItems.length === 0 ? (
            /* Genuine Empty State (No Mock Seeds) */
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-sm font-extrabold text-slate-700 dark:text-slate-300">
                No accomplishment records reflected in Area {activeArea}
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                Click "+ Add Accomplishment to Area {activeArea}" to record a new achievement with documentary proof.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentAreaItems.map((item) => {
                const evidence = resolvePersonnelEvidence(item)
                const hasProof = Boolean(evidence)
                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${!hasProof
                        ? 'border-rose-300 bg-rose-50/40 dark:bg-rose-950/20'
                        : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:border-emerald-300'
                      }`}
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950 text-[#064e2b] dark:text-[#245F42] border border-emerald-200 dark:border-emerald-800">
                          {item.category || `Category ${activeArea}`}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase bg-slate-200 text-slate-700">
                          Scope: {item.scope_level || 'Local'}
                        </span>
                        {/* Unresolved / Incomplete Classification Neutral Badge */}
                        {item.is_unclassified && (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300">
                            Needs Classification
                          </span>
                        )}

                        {/* Proof Completeness Alert Badges */}
                        {hasProof ? (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Evidence Available</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1 animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>Evidence Required</span>
                          </span>
                        )}

                        {/* Package D: 2-Year Reuse Eligibility Badge */}
                        <AchievementReuseBadge accomplishment={item} />
                      </div>

                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">
                        {item.title}
                      </h4>

                      <div className="flex items-center gap-3 text-xs text-slate-500 font-medium flex-wrap">
                        {hasProof ? (
                          <button
                            type="button"
                            onClick={() => setPreviewEvidence(evidence)}
                            className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer underline hover:no-underline"
                            title="Preview authenticated evidence file"
                          >
                            <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{evidence.original_filename}</span>
                            <ExternalLink className="w-3 h-3 text-emerald-600" />
                          </button>
                        ) : (
                          <span className="flex items-center gap-1 text-rose-600 font-medium">
                            <Paperclip className="w-3.5 h-3.5 text-rose-400" />
                            <span>No persisted evidence</span>
                          </span>
                        )}
                        {item.date && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {item.date}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Interactive Actions for Personnel */}
                    <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-200/60 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setViewingAccomplishment(item)}
                        className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:border-emerald-600 hover:bg-emerald-50 text-slate-700 font-extrabold text-xs flex items-center gap-1 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                      {isEditable && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAccomplishment(item)
                              setInitialSubmissionCategory(item.category || (isFacultyAcademic ? 'A.1 Education' : 'A.1 Degree/s'))
                              setIsSubmissionModalOpen(true)
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-extrabold text-xs flex items-center gap-1 transition cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveLineItem(item.id, item.title)}
                            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition cursor-pointer"
                            title="Remove Line-Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Canonical Accomplishment Submission & Edit Modal */}
      {isSubmissionModalOpen && (
        isFacultyAcademic ? (
          <FacultyAcademicSubmissionModal
            isOpen={isSubmissionModalOpen}
            onClose={() => { setIsSubmissionModalOpen(false); setEditingAccomplishment(null) }}
            onSubmitAccomplishment={handleSaveAccomplishment}
            initialCategory={initialSubmissionCategory}
            editingItem={editingAccomplishment}
            currentUser={activeUser}
            areaCode={editingAccomplishment?.category_area?.replace('area', '') || activeArea}
            areaName={((workspaceConfig?.areas || []).find((area) => area.area_code === (editingAccomplishment?.category_area?.replace('area', '') || activeArea))?.name || '').replace(/^Area\s+[ABC]\s*:\s*/i, '')}
          />
        ) : (
          <PersonnelSubmissionModal
            isOpen={isSubmissionModalOpen}
            onClose={() => { setIsSubmissionModalOpen(false); setEditingAccomplishment(null) }}
            onSubmitAccomplishment={handleSaveAccomplishment}
            initialCategory={initialSubmissionCategory}
            editingItem={editingAccomplishment}
          />
        )
      )}

      {/* Edit Basic Info Modal */}
      {isEditProfileOpen && (
        <EditBasicInfoModal
          user={activeUser}
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          onSave={() => {
            showToast('Profile basic information updated successfully!')
            setIsEditProfileOpen(false)
          }}
        />
      )}

      {/* Multi-Version Submission History & Comparison Modal (Plan C Phase C4) */}
      {isHistoryModalOpen && (
        <SubmissionVersionHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          versions={submissionHistory}
          personnelName={activeUser.full_name}
        />
      )}
      <PersonnelEvidencePreviewModal evidence={previewEvidence} onClose={() => setPreviewEvidence(null)} />
      <AchievementPreviewModal
        isOpen={Boolean(viewingAccomplishment)}
        achievement={viewingAccomplishment}
        onClose={() => setViewingAccomplishment(null)}
        onEdit={(item) => { setEditingAccomplishment(item); setIsSubmissionModalOpen(true) }}
        onDownload={(item) => {
          const evidence = resolvePersonnelEvidence(item)
          handleDownloadEvidence(evidence?.id, evidence?.original_filename)
        }}
        onResubmit={(item) => { setEditingAccomplishment(item); setIsSubmissionModalOpen(true) }}
      />
      <PersonnelPortfolioBookletModal isOpen={isBookletOpen} onClose={() => setIsBookletOpen(false)} portfolio={latestSubmission?.items?.length ? latestSubmission : portfolio} user={activeUser} />
    </>
  )
}
