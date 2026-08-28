import React, { useState, useMemo } from 'react'
import {
  Trophy,
  Award,
  Search,
  Crown,
  BarChart3,
  Check,
  Filter,
  CheckSquare,
  Square,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  Info,
  ArrowRight,
  RotateCcw,
  XCircle,
  CheckCircle2
} from 'lucide-react'
import CandidateStatusBadge from '../../components/osad/CandidateStatusBadge'
import CandidatePortfolioReviewDrawer from '../../components/osad/CandidatePortfolioReviewDrawer'
import BatchInterviewAdvancementToolbar from '../../components/osad/BatchInterviewAdvancementToolbar'
import BatchInterviewAdvancementModal from '../../components/osad/BatchInterviewAdvancementModal'
import AdvancementDecisionCorrectionModal from '../../components/osad/AdvancementDecisionCorrectionModal'
import CategoryOverviewCards from '../../components/osad/CategoryOverviewCards'
import CandidateReviewActions from '../../components/osad/CandidateReviewActions'
import Stage1CandidateReportService from '../../services/Stage1CandidateReportService'
import AwardPortfolioReviewService from '../../services/AwardPortfolioReviewService'

export default function OSADAwardCandidateReviewPage({
  awardCategories = [],
  awardees = [],
  candidateDecisions = [],
  getUsers,
  getStudentLeaderboards,
  advanceCandidateToInterview,
  doNotAdvanceCandidate,
  reverseAdvancementDecision,
  confirmAwardee,
  batchConfirmAwardees,
  undoAwardeeConfirmation
}) {
  const [selectedAward, setSelectedAward] = useState('all') // 'all' or categoryTitle/id
  const [collegeFilter, setCollegeFilter] = useState('all')
  const [academicYearFilter, setAcademicYearFilter] = useState('AY 2025-2026')
  const [searchTerm, setSearchTerm] = useState('')
  const [cycleStatus, setCycleStatus] = useState('ready_for_review')

  // Modal / Drawer States
  const [selectedCandidateForAudit, setSelectedCandidateForAudit] = useState(null)
  const [selectedCandidateIds, setSelectedCandidateIds] = useState(new Set())
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false)
  const [correctionTarget, setCorrectionTarget] = useState(null)

  // Local state for candidate decisions (in-memory sync for Stage 1)
  const [decisionsMap, setDecisionsMap] = useState({})

  // 0. Fetch Users Dataset
  const allUsers = typeof getUsers === 'function' ? (getUsers('student', '') || []) : []

  // Combine parent decisions with local state
  const activeDecisions = useMemo(() => {
    const parentList = Array.isArray(candidateDecisions) && candidateDecisions.length > 0
      ? candidateDecisions
      : (Array.isArray(awardees) ? awardees : [])

    const combined = [...parentList]
    Object.entries(decisionsMap).forEach(([id, dec]) => {
      const idx = combined.findIndex(c => (c.candidacyId === id || c.id === id || c.student_id === id))
      if (idx >= 0) {
        combined[idx] = { ...combined[idx], ...dec }
      } else {
        combined.push({ id, ...dec })
      }
    })
    return combined
  }, [candidateDecisions, awardees, decisionsMap])

  // 1. Compute Category Overview Summaries
  const categorySummaries = useMemo(() => {
    const defaultCategories = awardCategories.length > 0 ? awardCategories : [
      { id: 'cat-deans-list', title: "Dean's List", min_points: 50, weight_multiplier: 1.0, description: 'Academic Honor Roll Excellence' },
      { id: 'cat-leadership', title: 'Leadership', min_points: 40, weight_multiplier: 1.2, description: 'Executive Student Governance' },
      { id: 'cat-sports', title: 'Sports', min_points: 30, weight_multiplier: 1.0, description: 'Athletics & Intramurals Champions' },
      { id: 'cat-research', title: 'Research', min_points: 45, weight_multiplier: 1.5, description: 'Scientific & Academic Publications' }
    ]

    return AwardPortfolioReviewService.getAwardCategorySummaries(
      defaultCategories,
      allUsers,
      activeDecisions
    )
  }, [awardCategories, allUsers, activeDecisions])

  // 2. Selected Category Object & Calculation
  const activeCategoryObj = useMemo(() => {
    if (selectedAward === 'all') return null
    return categorySummaries.find(s => s.categoryTitle === selectedAward || s.categoryId === selectedAward) || {
      categoryTitle: selectedAward,
      minPoints: 50
    }
  }, [categorySummaries, selectedAward])

  const filteredCandidates = useMemo(() => {
    if (selectedAward === 'all') return []

    const currentCatObj = awardCategories.find(c => c.title === selectedAward || c.id === selectedAward) || {
      id: `cat-${selectedAward.toLowerCase().replace(/\s+/g, '-')}`,
      title: selectedAward,
      min_points: 50
    }

    return AwardPortfolioReviewService.calculateStage1Review({
      category: currentCatObj,
      users: allUsers,
      candidateDecisions: activeDecisions,
      collegeFilter,
      searchTerm
    })
  }, [selectedAward, awardCategories, allUsers, activeDecisions, collegeFilter, searchTerm])

  const top3Candidates = filteredCandidates.slice(0, 3)
  const advancedCandidates = filteredCandidates.filter(c => c.osadDecision === 'ADVANCED_TO_INTERVIEW' || c.confirmed)
  const advancedCount = advancedCandidates.length

  // Handlers
  const toggleCandidateSelection = (id) => {
    setSelectedCandidateIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return new Set(next)
    })
  }

  const handleSelectVisibleEligible = () => {
    const eligibleIds = filteredCandidates
      .filter(c => c.osadDecision !== 'ADVANCED_TO_INTERVIEW' && !c.confirmed && c.potentialCandidateStatus !== 'BELOW_THRESHOLD' && c.eligibilityStatus !== 'below_threshold')
      .map(c => c.candidacyId || c.id || c.studentId)
    setSelectedCandidateIds(new Set(eligibleIds))
  }

  const handleClearSelection = () => {
    setSelectedCandidateIds(new Set())
  }

  const handleAdvanceSingleCandidate = (candidateId) => {
    const candidate = filteredCandidates.find(c => c.candidacyId === candidateId || c.id === candidateId || c.studentId === candidateId)
    if (!candidate) return

    setDecisionsMap(prev => ({
      ...prev,
      [candidate.candidacyId || candidate.id]: {
        osad_decision: 'ADVANCED_TO_INTERVIEW',
        confirmed: true,
        decision_by: 'OSAD Admin',
        decision_at: new Date().toLocaleDateString()
      }
    }))

    if (typeof advanceCandidateToInterview === 'function') {
      advanceCandidateToInterview(candidate)
    } else if (typeof confirmAwardee === 'function') {
      confirmAwardee({
        ...candidate,
        award_title: candidate.award_title || selectedAward
      })
    }
  }

  const handleDoNotAdvanceCandidate = (candidateId) => {
    const candidate = filteredCandidates.find(c => c.candidacyId === candidateId || c.id === candidateId || c.studentId === candidateId)
    if (!candidate) return

    setDecisionsMap(prev => ({
      ...prev,
      [candidate.candidacyId || candidate.id]: {
        osad_decision: 'NOT_ADVANCED',
        confirmed: false,
        decision_by: 'OSAD Admin',
        decision_at: new Date().toLocaleDateString()
      }
    }))

    if (typeof doNotAdvanceCandidate === 'function') {
      doNotAdvanceCandidate(candidate)
    }
  }

  const handleReverseDecision = (candidateId, reason) => {
    const candidate = filteredCandidates.find(c => c.candidacyId === candidateId || c.id === candidateId || c.studentId === candidateId)
    if (!candidate) return

    setDecisionsMap(prev => ({
      ...prev,
      [candidate.candidacyId || candidate.id]: {
        osad_decision: 'PENDING',
        confirmed: false,
        decision_by: null,
        decision_at: null,
        decision_remarks: reason
      }
    }))

    if (typeof reverseAdvancementDecision === 'function') {
      reverseAdvancementDecision(candidate.candidacyId || candidate.id, reason)
    } else if (typeof undoAwardeeConfirmation === 'function') {
      undoAwardeeConfirmation(candidate.candidacyId || candidate.id, reason)
    }
  }

  const handleBatchAdvanceExecute = (ids) => {
    ids.forEach(id => handleAdvanceSingleCandidate(id))
    handleClearSelection()
    return { advanced: ids.length, skipped: 0 }
  }

  const handleExportSummaryReport = (isOfficial) => {
    const csvStr = Stage1CandidateReportService.generateStage1SummaryReportCsv(filteredCandidates, selectedAward, isOfficial)
    Stage1CandidateReportService.triggerCsvDownload(csvStr, `NDMU_${selectedAward}_Stage1_Candidate_Review_Report.csv`)
  }

  const selectedCandidatesList = filteredCandidates.filter(c => selectedCandidateIds.has(c.candidacyId || c.id || c.studentId))

  return (
    <div className="space-y-6 font-sans animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#131e2e] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-[#16834a] dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center shrink-0">
            <Trophy className="w-5.5 h-5.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Award Candidate Review & Stage 1 Evaluation
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-[#16834a] dark:text-emerald-400 text-[10px] font-black uppercase">
                Stage 1 Portfolio Review
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Category-specific portfolio review for NDMU Araw ng Parangal and Dean's Honor Roll ({academicYearFilter})
            </p>
          </div>
        </div>

        <CandidateReviewActions
          cycleStatus={cycleStatus}
          onPrintDraft={() => window.print()}
          onExportCsv={handleExportSummaryReport}
          onGenerateSummaryReport={handleExportSummaryReport}
          onPublishRoster={() => setCycleStatus('published')}
          onPrintOfficial={() => window.print()}
        />
      </div>

      {/* Navigation Toolbar (Category Pills & College Dropdown) */}
      <div className="bg-white dark:bg-[#131e2e] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
        
        {/* Category Pills Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedAward('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              selectedAward === 'all'
                ? 'bg-[#16834a] text-white shadow-2xs'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            All Categories (Overview)
          </button>

          {['Dean\'s List', 'Leadership', 'Sports', 'Research'].map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedAward(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                selectedAward === cat
                  ? 'bg-[#16834a] text-white shadow-2xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Filter Dropdown & Search */}
        {selectedAward !== 'all' && (
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search candidates..."
                className="w-full pl-9 pr-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#16834a] transition"
              />
            </div>

            <div className="flex items-center gap-1 px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={collegeFilter}
                onChange={(e) => setCollegeFilter(e.target.value)}
                className="bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="all">All Colleges</option>
                <option value="CEAC">CEAC</option>
                <option value="CBA">CBA</option>
                <option value="CAS">CAS</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* VIEW MODE A: OVERVIEW SUMMARY CARDS */}
      {selectedAward === 'all' ? (
        <CategoryOverviewCards
          summaries={categorySummaries}
          onSelectCategory={(catTitle) => setSelectedAward(catTitle)}
        />
      ) : (
        /* VIEW MODE B: SPECIFIC CATEGORY CANDIDATE REVIEW */
        <div className="space-y-6">
          
          {/* Category Highest Stage 1 Scores */}
          {top3Candidates.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                  <span>{selectedAward} — Potential Candidates</span>
                </h3>
                <span className="text-[11px] font-bold text-slate-400">
                  Highest Stage 1 Portfolio Scores (#1 – #{top3Candidates.length})
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {top3Candidates.map((candidate, idx) => {
                  const rankLabel = idx === 0 ? 'Highest Score (#1)' : idx === 1 ? 'Rank #2' : 'Rank #3'
                  const borderClass = idx === 0 ? 'border-emerald-300 dark:border-emerald-800/60' : 'border-slate-200/80 dark:border-slate-800'
                  const isAdvanced = candidate.osadDecision === 'ADVANCED_TO_INTERVIEW' || candidate.confirmed

                  return (
                    <div
                      key={candidate.candidacyId || candidate.id || candidate.studentId}
                      className={`bg-white dark:bg-[#131e2e] rounded-3xl p-6 border ${borderClass} shadow-2xs space-y-4 flex flex-col justify-between hover:shadow-md transition`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-[#16834a] dark:text-emerald-400 tracking-wider uppercase flex items-center gap-1">
                            <span>⭐</span> {rankLabel}
                          </span>
                          <span className="text-base font-black text-slate-900 dark:text-white">
                            {candidate.stage1_score ?? candidate.score} <span className="text-xs text-slate-400 font-medium">/ 100</span>
                          </span>
                        </div>

                        <div
                          onClick={() => setSelectedCandidateForAudit(candidate)}
                          className="cursor-pointer group"
                        >
                          <h4 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-[#16834a] transition">
                            {candidate.student_name}
                          </h4>
                          <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                            {candidate.program} • <span className="text-slate-400">{candidate.college}</span>
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setSelectedCandidateForAudit(candidate)}
                          className="text-[11px] text-slate-500 hover:text-[#16834a] font-semibold transition cursor-pointer"
                        >
                          Review Evidence &rarr;
                        </button>

                        {isAdvanced ? (
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Advanced
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAdvanceSingleCandidate(candidate.candidacyId || candidate.id || candidate.studentId)}
                            className="px-3 py-1 rounded-xl bg-[#16834a] hover:bg-[#236e3e] text-white text-xs font-extrabold transition cursor-pointer shadow-2xs"
                          >
                            Mark Eligible for Interview
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Directory Candidate Table */}
          <div className="bg-white dark:bg-[#131e2e] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#16834a]" />
                  <span>{selectedAward} Candidate Review List</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Calculated from verified student achievements and minimum threshold ({activeCategoryObj?.minPoints || 50} pts)
                </p>
              </div>
              <span className="text-[11px] font-bold text-slate-400">
                {filteredCandidates.length} Potential Candidates Reviewed ({advancedCount} Eligible for Interview)
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredCandidates.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-medium">
                  No candidate portfolios match the current category and filter parameters.
                </div>
              ) : (
                filteredCandidates.map((candidate) => {
                  const score = candidate.stage1_score ?? candidate.score
                  const percent = Math.min(100, Math.max(0, score))
                  const candId = candidate.candidacyId || candidate.id || candidate.studentId
                  const isSelected = selectedCandidateIds.has(candId)
                  const isAdvanced = candidate.osadDecision === 'ADVANCED_TO_INTERVIEW' || candidate.confirmed

                  return (
                    <div
                      key={candId}
                      className={`p-5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isSelected ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 md:w-1/3">
                        <button
                          type="button"
                          onClick={() => toggleCandidateSelection(candId)}
                          className="text-slate-400 hover:text-[#16834a] transition cursor-pointer shrink-0"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#16834a]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>

                        <span className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-black text-xs shrink-0">
                          #{candidate.stage1Rank || candidate.globalRank}
                        </span>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4
                              onClick={() => setSelectedCandidateForAudit(candidate)}
                              className="font-extrabold text-sm text-slate-900 dark:text-white truncate cursor-pointer hover:text-[#16834a] transition"
                            >
                              {candidate.student_name}
                            </h4>
                            <CandidateStatusBadge status={candidate.potentialCandidateStatus || candidate.eligibilityStatus} type="eligibility" />
                          </div>
                          <p className="text-xs font-bold text-slate-500 truncate mt-0.5">
                            {candidate.program} • <span className="text-slate-400">{candidate.college}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex-1 space-y-1 md:px-4">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-400">Available Stage 1 Score</span>
                          <span className="font-extrabold text-[#16834a] dark:text-emerald-400">{score} / 100</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-[#16834a] transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2.5 shrink-0 self-end md:self-auto">
                        <button
                          type="button"
                          onClick={() => setSelectedCandidateForAudit(candidate)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-700 dark:text-slate-300 hover:text-[#16834a] text-xs font-extrabold transition cursor-pointer"
                        >
                          Review Evidence
                        </button>

                        {isAdvanced ? (
                          <div className="flex items-center gap-1.5">
                            <CandidateStatusBadge status="ADVANCED_TO_INTERVIEW" type="decision" />
                            <button
                              type="button"
                              onClick={() => setCorrectionTarget(candidate)}
                              className="px-2 py-1 rounded-lg text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            >
                              Reverse
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAdvanceSingleCandidate(candId)}
                            disabled={candidate.potentialCandidateStatus === 'BELOW_THRESHOLD' || candidate.eligibilityStatus === 'below_threshold'}
                            className="px-3.5 py-1.5 rounded-xl bg-[#16834a] hover:bg-[#236e3e] active:scale-[0.99] text-white font-extrabold text-xs transition cursor-pointer shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Mark Eligible for Interview
                          </button>
                        )}
                      </div>

                    </div>
                  )
                })
              )}
            </div>
          </div>

        </div>
      )}

      {/* Floating Batch Selection Toolbar */}
      {selectedAward !== 'all' && (
        <BatchInterviewAdvancementToolbar
          selectedCount={selectedCandidateIds.size}
          onSelectAllEligible={handleSelectVisibleEligible}
          onClearSelection={handleClearSelection}
          onOpenBatchAdvanceModal={() => setIsBatchModalOpen(true)}
        />
      )}

      {/* Stage 1 Portfolio Review Drawer */}
      {selectedCandidateForAudit && (
        <CandidatePortfolioReviewDrawer
          candidate={selectedCandidateForAudit}
          onClose={() => setSelectedCandidateForAudit(null)}
          onAdvanceToInterview={(id) => {
            handleAdvanceSingleCandidate(id)
            setSelectedCandidateForAudit(null)
          }}
          onDoNotAdvance={(id) => {
            handleDoNotAdvanceCandidate(id)
            setSelectedCandidateForAudit(null)
          }}
          onReverseDecision={(cand) => {
            setSelectedCandidateForAudit(null)
            setCorrectionTarget(cand)
          }}
        />
      )}

      {/* Batch Interview Advancement Modal */}
      {isBatchModalOpen && (
        <BatchInterviewAdvancementModal
          selectedCandidates={selectedCandidatesList}
          onClose={() => setIsBatchModalOpen(false)}
          onAdvanceBatch={handleBatchAdvanceExecute}
        />
      )}

      {/* Advancement Decision Correction Modal */}
      {correctionTarget && (
        <AdvancementDecisionCorrectionModal
          candidate={correctionTarget}
          isPublished={cycleStatus === 'published'}
          onClose={() => setCorrectionTarget(null)}
          onConfirmReverse={handleReverseDecision}
        />
      )}

    </div>
  )
}

export const OSADIdentifyAwardeesPage = OSADAwardCandidateReviewPage
