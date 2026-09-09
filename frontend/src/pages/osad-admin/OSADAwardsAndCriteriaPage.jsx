import React, { useState, useEffect, useRef } from 'react'
import {
  Trophy,
  Award,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Layers,
  Percent,
  Star,
  Info,
  SlidersHorizontal,
  CheckSquare,
  FileCheck,
  Clock,
  HelpCircle,
  Users,
  ChevronRight,
  Sparkles
} from 'lucide-react'
import { fetchAwards, fetchStudentsForEvaluation, fetchPotentialCandidates } from '../../services/awardAdminService'
import { scrollIntoComfortableView } from '../../utils/scrollIntoComfortableView'
import OSADStudentsForEvaluationView from './OSADStudentsForEvaluationView'
import OSADPageHeader from '../../components/osad/OSADPageHeader'
import {
  OSADLoadingState,
  OSADEmptyState,
  OSADSearchEmptyState,
  OSADErrorState
} from '../../components/osad/OSADStateBlock'
import OSADStudentAwardReviewWorkspace from './OSADStudentAwardReviewWorkspace'
import OSADPotentialCandidatesView from './OSADPotentialCandidatesView'

export default function OSADAwardsAndCriteriaPage() {
  const [awards, setAwards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedAwardId, setExpandedAwardId] = useState(null)
  const [expandedCriteria, setExpandedCriteria] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [studentCounts, setStudentCounts] = useState({})
  const [potentialCounts, setPotentialCounts] = useState({})
  
  // Navigation & View States
  const [viewMode, setViewMode] = useState('catalog') // 'catalog' | 'students' | 'candidates' | 'review'
  const [selectedAward, setSelectedAward] = useState(null)
  const [selectedStudent, setSelectedStudent] = useState(null)

  const awardHeaderRefs = useRef({})

  useEffect(() => {
    loadAwards()
  }, [])

  async function loadAwards() {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAwards()
      if (Array.isArray(data)) {
        setAwards(data)
        // Pre-fetch student & candidate counts for all awards
        data.forEach(async (aw) => {
          try {
            const stData = await fetchStudentsForEvaluation(aw.id)
            if (stData?.total_students !== undefined) {
              setStudentCounts(prev => ({ ...prev, [aw.id]: stData.total_students }))
            } else if (Array.isArray(stData?.students)) {
              setStudentCounts(prev => ({ ...prev, [aw.id]: stData.students.length }))
            }
          } catch (e) {}

          try {
            const pData = await fetchPotentialCandidates(aw.id)
            if (pData?.total_potential_candidates !== undefined) {
              setPotentialCounts(prev => ({ ...prev, [aw.id]: pData.total_potential_candidates }))
            }
          } catch (e) {}
        })
      } else {
        throw new Error('Invalid award data received from server.')
      }
    } catch (err) {
      console.warn('Failed to load active award definitions:', err)
      setError(err.message || 'Award definitions could not be loaded. Please retry or contact the system administrator.')
    } finally {
      setLoading(false)
    }
  }

  const filteredAwards = awards.filter((a) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      (a.name || '').toLowerCase().includes(term) ||
      (a.code || '').toLowerCase().includes(term) ||
      (a.description || '').toLowerCase().includes(term) ||
      (a.source_fidelity_status || '').toLowerCase().includes(term)
    )
  })

  const verifiedCount = awards.filter(
    (a) => a.source_fidelity_status === 'VERIFIED'
  ).length

  const toggleExpand = (id) => {
    const isCollapsing = expandedAwardId === id
    setExpandedAwardId(isCollapsing ? null : id)

    if (isCollapsing) return

    requestAnimationFrame(() => {
      scrollIntoComfortableView(awardHeaderRefs.current[id])
    })
  }

  const toggleCriterionBreakdown = (critId) => {
    setExpandedCriteria(prev => ({
      ...prev,
      [critId]: !prev[critId]
    }))
  }

  const handleAwardKeyDown = (event, id) => {
    if (event.target !== event.currentTarget) return
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    toggleExpand(id)
  }

  const handleOpenStudents = (event, award) => {
    event.stopPropagation()
    setSelectedAward(award)
    setViewMode('students')
  }

  const handleOpenCandidates = (event, award) => {
    event.stopPropagation()
    setSelectedAward(award)
    setViewMode('candidates')
  }

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-2xs">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            Verified
          </span>
        )
      case 'PROPOSED_PENDING_APPROVAL':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200/70 dark:border-purple-800/60">
            <HelpCircle className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            Proposed — Pending Approval
          </span>
        )
      case 'PENDING_RECONCILIATION':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/60">
            <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            Pending Reconciliation
          </span>
        )
    }
  }

  // Level 3: Student Review Workspace View
  if (viewMode === 'review' && selectedAward && selectedStudent) {
    return (
      <OSADStudentAwardReviewWorkspace
        awardId={selectedAward.id}
        studentId={selectedStudent.id || selectedStudent.student_profile_id}
        onBack={() => setViewMode('students')}
        onFinalized={() => {}}
      />
    )
  }

  // Phase 7: Potential Candidates View
  if (viewMode === 'candidates' && selectedAward) {
    return (
      <OSADPotentialCandidatesView
        award={selectedAward}
        onBack={() => setViewMode('catalog')}
        onSelectStudent={(std) => {
          setSelectedStudent(std)
          setViewMode('review')
        }}
      />
    )
  }

  // Level 2: Students for Evaluation View
  if (viewMode === 'students' && selectedAward) {
    return (
      <OSADStudentsForEvaluationView
        award={selectedAward}
        onBack={() => setViewMode('catalog')}
        onSelectStudent={(std) => {
          setSelectedStudent(std)
          setViewMode('review')
        }}
      />
    )
  }

  // Level 1: Authoritative Award Catalog
  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-sans max-w-7xl mx-auto pb-16">
      {/* Standardized Page Header */}
      <OSADPageHeader
        title="Awards & Scoring Criteria"
        description="Authoritative institutional 15-award catalog under progressive source-fidelity remediation."
        icon={Trophy}
        badge={`${verifiedCount} Verified / ${awards.length} Authoritative Baseline`}
        secondaryActions={
          <input
            type="text"
            placeholder="Search award, code, or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#16834a] w-64"
          />
        }
      />

      {/* Awards Grid */}
      {loading ? (
        <OSADLoadingState message="Loading authoritative award definitions..." />
      ) : error ? (
        <OSADErrorState
          title="Unable to Load Award Definitions"
          message={error}
          onRetry={loadAwards}
        />
      ) : awards.length === 0 ? (
        <OSADEmptyState
          icon={Trophy}
          title="No Award Definitions Configured"
          description="No authoritative institutional award criteria are currently active in the database."
        />
      ) : filteredAwards.length === 0 ? (
        <OSADSearchEmptyState
          title="No Matching Awards"
          description={`No award definitions match your search query: "${searchTerm}".`}
          onReset={() => setSearchTerm('')}
          resetLabel="Clear Search Filter"
        />
      ) : (
        <div className="space-y-4">
          {filteredAwards.map((award, index) => {
            const isExpanded = expandedAwardId === award.id
            const criteria = award.criteria || []
            const threshold = parseFloat(award.candidate_threshold_percent || '80.00').toFixed(2)
            const authorityStatus = award.authority_status || 'OFFICIAL'
            const isOfficial = authorityStatus === 'OFFICIAL'
            const isVerified = award.source_fidelity_status === 'VERIFIED'
            const countStudents = studentCounts[award.id] !== undefined ? studentCounts[award.id] : '...'

            // Computable max points sum
            let computableMax = 0
            criteria.forEach(c => {
              if (c.is_portfolio_computable) {
                computableMax += parseFloat(c.max_points || 0)
              }
            })
            if (computableMax === 0) computableMax = parseFloat(award.portfolio_max || 50)

            return (
              <div
                key={award.id}
                className={`bg-white dark:bg-[#131e2e] rounded-2xl border shadow-2xs overflow-hidden transition ${
                  isVerified
                    ? 'border-emerald-300 dark:border-emerald-700/80 ring-1 ring-emerald-500/20'
                    : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Award Summary Row */}
                <div
                  ref={(element) => {
                    if (element) awardHeaderRefs.current[award.id] = element
                    else delete awardHeaderRefs.current[award.id]
                  }}
                  onClick={() => toggleExpand(award.id)}
                  onKeyDown={(event) => handleAwardKeyDown(event, award.id)}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  aria-controls={`award-criteria-${award.id}`}
                  className="scroll-mt-4 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div
                      className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                        isVerified
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">
                          {award.name}
                        </h3>
                        <span className="font-mono text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-emerald-800 dark:text-emerald-300">
                          {award.code}
                        </span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                            isOfficial
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50'
                              : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/50'
                          }`}
                        >
                          {isOfficial ? 'Official' : 'Proposed'}
                        </span>
                        {renderStatusBadge(award.source_fidelity_status)}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          v1.0 Published
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                        {award.description || 'Authoritative institutional award evaluated against verified student portfolio achievements.'}
                      </p>
                    </div>
                  </div>

                  {/* Compact Metrics & Action Button at First Glance */}
                  <div className="flex items-center gap-4 flex-wrap lg:flex-nowrap self-end lg:self-center">
                    <div className="text-right">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase block">
                        Eligibility Pool
                      </span>
                      <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                        {award.graduating_only ? 'Graduating Only' : 'Open Pool'}
                        {award.gender_restriction && ` (${award.gender_restriction})`}
                      </span>
                    </div>

                    <div className="text-right pl-3 border-l border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase block">
                        Candidate Threshold
                      </span>
                      <span className="text-xs font-black text-[#16834a] dark:text-emerald-400">
                        {threshold}% Potential
                      </span>
                    </div>

                    <div className="text-right pl-3 border-l border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase block">
                        Portfolio Max
                      </span>
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        {computableMax.toFixed(2)} pts
                      </span>
                    </div>

                    <div className="text-right pl-3 border-l border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase block">
                        Evaluation Pool
                      </span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {countStudents} {countStudents === 1 ? 'Student' : 'Students'}
                      </span>
                    </div>

                    <div className="text-right pl-3 border-l border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase block">
                        Candidates (≥80%)
                      </span>
                      <span className="text-xs font-black text-[#16834a] dark:text-emerald-400">
                        {potentialCounts[award.id] !== undefined ? potentialCounts[award.id] : 0} Qualified
                      </span>
                    </div>

                    {/* View Students for Evaluation Action */}
                    <button
                      type="button"
                      onClick={(e) => handleOpenStudents(e, award)}
                      className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors shrink-0"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Students for Evaluation</span>
                    </button>

                    {/* View Potential Candidates Action */}
                    <button
                      type="button"
                      onClick={(e) => handleOpenCandidates(e, award)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-[#16834a] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-xs font-extrabold transition-colors shrink-0"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Potential Candidates</span>
                    </button>

                    <button
                      type="button"
                      aria-label="Toggle criteria"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expandable Criteria Breakdown */}
                {isExpanded && (
                  <div id={`award-criteria-${award.id}`} className="bg-slate-50/70 dark:bg-slate-900/50 p-5 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-in fade-in duration-150">

                    {/* Award Governance & Version Metadata */}
                    <div className="p-3.5 rounded-xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Scoring Version</span>
                          <span className="font-extrabold text-slate-900 dark:text-white">v1.0 (AY 2025-2026)</span>
                        </div>
                        <div className="pl-4 border-l border-slate-200 dark:border-slate-800">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Governance</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {award.code === 'CAMPUS_JOURNALISM_AWARD'
                              ? 'Official Criterion with Automated Portfolio Adaptation'
                              : award.code.includes('SPORTS') || award.code.includes('ATHLETE')
                              ? 'Partially Portfolio Computable (Skills 20 + Attitude 20 Panel)'
                              : award.code.includes('SOCIO') || award.code.includes('PERFORMER')
                              ? 'Proposed AchieveNest Portfolio Model'
                              : 'Official OSAD Rubric'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleOpenStudents(e, award)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Open Students for Evaluation Workspace</span>
                        </button>
                      </div>
                    </div>

                    {/* Criteria List with Progressive Disclosure */}
                    <div className="space-y-3">
                      {criteria.map((crit) => {
                        const isCritExpanded = !!expandedCriteria[crit.id]
                        const isComputable = !!crit.is_portfolio_computable
                        const maxPts = parseFloat(crit.max_points || 0).toFixed(2)

                        return (
                          <div
                            key={crit.id}
                            className="bg-white dark:bg-[#131e2e] rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden"
                          >
                            <div
                              onClick={() => toggleCriterionBreakdown(crit.id)}
                              className="p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition text-left"
                            >
                              <div className="flex items-center gap-3">
                                {isCritExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-slate-400" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-slate-400" />
                                )}
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">
                                      {crit.name}
                                    </h4>
                                    <span className="font-mono text-[10px] text-slate-400">
                                      {crit.code}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                    {crit.description || 'Criterion rules and component point contributions.'}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  isComputable
                                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                                    : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300'
                                }`}>
                                  {isComputable ? 'Portfolio Computable' : 'Panel / Institutional'}
                                </span>
                                <span className="text-xs font-black text-slate-900 dark:text-white font-mono">
                                  {maxPts} pts
                                </span>
                                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold underline ml-1">
                                  {isCritExpanded ? 'Hide' : 'View Breakdown'}
                                </span>
                              </div>
                            </div>

                            {/* Detailed Subcriterion & Rule Breakdown */}
                            {isCritExpanded && (
                              <div className="p-4 bg-slate-50/60 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800 text-xs space-y-3">
                                {crit.components && crit.components.length > 0 ? (
                                  <div className="space-y-2">
                                    {crit.components.map((comp) => (
                                      <div
                                        key={comp.id}
                                        className="p-3 bg-white dark:bg-[#131e2e] rounded-lg border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3"
                                      >
                                        <div>
                                          <div className="font-bold text-slate-800 dark:text-slate-200">
                                            {comp.name}
                                          </div>
                                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                            Rule: {comp.rule_type || 'ACCUMULATE_WITH_CAP'} • Cap: {comp.max_points} pts
                                          </div>
                                        </div>
                                        <span className="font-black text-slate-900 dark:text-white font-mono">
                                          Max: {parseFloat(comp.max_points || 0).toFixed(2)} pts
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-slate-400 text-xs italic">
                                    Official criterion evaluated directly according to institutional guidelines.
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
