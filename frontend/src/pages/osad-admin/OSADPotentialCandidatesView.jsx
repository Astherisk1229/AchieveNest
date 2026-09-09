import React, { useState, useEffect } from 'react'
import {
  Award,
  ArrowLeft,
  Users,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Info,
  TrendingUp
} from 'lucide-react'
import { fetchPotentialCandidates, fetchEvaluatedResults } from '../../services/awardAdminService'
import OSADPageHeader from '../../components/osad/OSADPageHeader'
import {
  OSADLoadingState,
  OSADEmptyState,
  OSADSearchEmptyState,
  OSADErrorState
} from '../../components/osad/OSADStateBlock'

export default function OSADPotentialCandidatesView({
  award,
  onBack,
  onSelectStudent
}) {
  const [activeTab, setActiveTab] = useState('potential') // 'potential' | 'all_evaluated'
  const [potentialData, setPotentialData] = useState(null)
  const [evaluatedData, setEvaluatedData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (award?.id) {
      loadData()
    }
  }, [award?.id])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [pRes, eRes] = await Promise.all([
        fetchPotentialCandidates(award.id),
        fetchEvaluatedResults(award.id)
      ])
      setPotentialData(pRes)
      setEvaluatedData(eRes)
    } catch (err) {
      setError(err.message || 'Failed to load potential candidate data.')
    } finally {
      setLoading(false)
    }
  }

  const threshold = parseFloat(award.candidate_threshold_percent || '80.00').toFixed(2)
  const potentialList = potentialData?.potential_candidates || []
  const evaluatedList = evaluatedData?.evaluated_results || []

  const currentList = activeTab === 'potential' ? potentialList : evaluatedList

  const filteredList = currentList.filter((item) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      (item.student_name || '').toLowerCase().includes(term) ||
      (item.student_id_number || item.student_id || '').toLowerCase().includes(term) ||
      (item.program || '').toLowerCase().includes(term) ||
      (item.college || '').toLowerCase().includes(term)
    )
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-150 font-sans">
      {/* Standardized Detail Header */}
      <OSADPageHeader
        variant="detail"
        onBack={onBack}
        backLabel="Back to All Awards"
        breadcrumbs={[
          { label: 'Awards & Criteria', onClick: onBack },
          { label: award.code || 'Award' }
        ]}
        title={award.name}
        badge={
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-emerald-800 dark:text-emerald-300">
              {award.code}
            </span>
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50">
              {award.graduating_only ? 'Graduating Only' : 'Open Pool'}
            </span>
            {award.gender_restriction && (
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/50">
                {award.gender_restriction}
              </span>
            )}
          </div>
        }
        description={`Phase 7 Portfolio Potential Score Normalization • Universal Threshold: ${threshold}%`}
        secondaryActions={
          <div className="bg-emerald-50 dark:bg-emerald-950/60 p-3 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/50 text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">
              Qualified Potential Candidates
            </span>
            <span className="text-sm font-black text-[#16834a] dark:text-emerald-300">
              {potentialList.length} Qualified (≥ {threshold}%)
            </span>
          </div>
        }
      />

      {/* Non-Winner Institutional Safeguard Banner */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
        <Info className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <div>
          <span className="font-bold text-slate-800 dark:text-slate-200">Institutional Governance Notice: </span>
          <span>
            Potential Candidate status is an automated portfolio qualification preselection based on the normalized 80% threshold. It does <strong>not</strong> constitute a final awardee selection, ranking cutoff, or winner decision.
          </span>
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div className="bg-white dark:bg-[#131e2e] rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('potential')}
            className={`px-4 py-2 text-xs font-extrabold rounded-xl transition ${
              activeTab === 'potential'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Potential Candidates ({potentialList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all_evaluated')}
            className={`px-4 py-2 text-xs font-extrabold rounded-xl transition ${
              activeTab === 'all_evaluated'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Evaluated Results ({evaluatedList.length})
          </button>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student name, ID number, program..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#16834a]"
          />
        </div>
      </div>

      {/* Candidate List / Cards */}
      {loading ? (
        <OSADLoadingState message="Loading normalized potential candidate results..." />
      ) : error ? (
        <OSADErrorState
          title="Unable to Load Potential Candidates"
          message={error}
          onRetry={loadData}
        />
      ) : (activeTab === 'potential' ? potentialList.length === 0 : evaluatedList.length === 0) ? (
        <OSADEmptyState
          icon={Sparkles}
          title={activeTab === 'potential' ? 'No Potential Candidates Qualified' : 'No Evaluated Student Results'}
          description={
            activeTab === 'potential'
              ? 'No candidates currently meet the 80% universal potential portfolio threshold. Ensure all student portfolios have been finalized.'
              : 'No evaluated student results are currently recorded for this award cycle.'
          }
        />
      ) : filteredList.length === 0 ? (
        <OSADSearchEmptyState
          title="No Matching Candidates"
          description={`No candidates match your search query: "${searchTerm}".`}
          onReset={() => setSearchTerm('')}
          resetLabel="Clear Candidate Search"
        />
      ) : (
        <div className="space-y-3">
          {filteredList.map((item, idx) => {
            const isQualified = item.candidate_status === 'POTENTIAL_CANDIDATE' || item.qualified
            const rawScore = parseFloat(item.raw_portfolio_score || 0).toFixed(2)
            const maxScore = parseFloat(item.computable_max_score || 50).toFixed(2)
            const potScore = parseFloat(item.portfolio_potential_score || 0).toFixed(2)

            return (
              <div
                key={item.student_id || idx}
                className={`bg-white dark:bg-[#131e2e] rounded-2xl border p-5 shadow-2xs transition flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                  isQualified
                    ? 'border-emerald-300 dark:border-emerald-700/80 ring-1 ring-emerald-500/20'
                    : 'border-slate-200/80 dark:border-slate-800'
                }`}
              >
                {/* Student Identity */}
                <div className="flex items-start sm:items-center gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-sm ${
                      isQualified
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {item.student_name?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {item.student_name}
                      </h3>
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {item.student_id_number || item.student_id}
                      </span>
                      <span
                        className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          isQualified
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {isQualified ? 'Potential Candidate' : 'Below Threshold'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                      {item.program || 'Undergraduate'} • {item.college || 'Academic Unit'}
                    </p>
                  </div>
                </div>

                {/* Score Transparency Metrics */}
                <div className="flex items-center gap-5 flex-wrap lg:flex-nowrap self-end lg:self-center">
                  <div className="text-right">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase block">
                      Portfolio Score
                    </span>
                    <span className="text-xs font-black text-slate-900 dark:text-white font-mono">
                      {rawScore} / {maxScore} pts
                    </span>
                  </div>

                  <div className="text-right pl-4 border-l border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase block">
                      Potential Score
                    </span>
                    <span
                      className={`text-sm font-black font-mono ${
                        isQualified
                          ? 'text-[#16834a] dark:text-emerald-400'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {potScore}%
                    </span>
                  </div>

                  <div className="text-right pl-4 border-l border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase block">
                      Threshold
                    </span>
                    <span className="text-xs font-bold text-slate-500 font-mono">
                      ≥ {threshold}%
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectStudent({ id: item.student_id, full_name: item.student_name })}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-slate-800 dark:text-slate-200 hover:text-emerald-800 text-xs font-bold transition-colors ml-2"
                  >
                    <span>View Review</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
