import React, { useState, useEffect, useMemo } from 'react'
import {
  ShieldCheck, Search, Filter, RefreshCw, CheckCircle2, XCircle,
  Clock, AlertTriangle, Edit3, PlusCircle, History, Building2, User
} from 'lucide-react'
import { fetchDeanAnnualReviews, recordDeanAnnualReview, supersedeDeanAnnualReview } from '../../../services/deanAnnualReviewService'
import { formatFacultyEngagement, formatEmploymentStatus, formatPersonnelClassification } from '../../../utils/personnelPlacement'
import DeanRecordReviewModal from './DeanRecordReviewModal'
import { Select, SelectItem } from '../../../components/ui/select'

export default function DeanAnnualReviewWorkspace({ showToast }) {
  const [cycleId, setCycleId] = useState('2025-2026')
  const [records, setRecords] = useState([])
  const [collegeId, setCollegeId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters
  const [search, setSearch] = useState('')
  const [decisionFilter, setDecisionFilter] = useState('ALL')
  const [engagementFilter, setEngagementFilter] = useState('ALL')
  const [employmentFilter, setEmploymentFilter] = useState('ALL')

  // Modal State
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const loadData = async (cycle = cycleId) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetchDeanAnnualReviews({ evaluation_cycle_id: cycle })
      const data = res?.data || res || {}
      setRecords(data.personnel || [])
      setCollegeId(data.college_id || null)
    } catch (err) {
      const msg = err?.response?.data?.error?.message || err?.message || 'Failed to load Dean Annual Review queue.'
      setError(msg)
      setRecords([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData(cycleId)
  }, [cycleId])

  const handleOpenRecordModal = (record) => {
    setSelectedRecord(record)
    setIsModalOpen(true)
  }

  const handleSaveReview = async (payload) => {
    try {
      await recordDeanAnnualReview(payload)
      if (showToast) showToast('Annual review decision recorded successfully.')
      await loadData(cycleId)
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  const handleSupersedeReview = async (reviewId, payload) => {
    try {
      await supersedeDeanAnnualReview(reviewId, payload)
      if (showToast) showToast('Annual review decision updated (superseded) successfully.')
      await loadData(cycleId)
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  // Filter pipeline
  const filteredList = useMemo(() => {
    return records.filter(item => {
      const p = item.personnel || {}
      const ar = item.annual_review || {}
      const elig = item.eligibility || {}

      // 1. Search Query
      if (search.trim()) {
        const query = search.toLowerCase().trim()
        const matchName = (p.full_name || '').toLowerCase().includes(query)
        const matchId = (p.institutional_id || '').toLowerCase().includes(query)
        const matchRank = (p.current_rank_title || '').toLowerCase().includes(query)
        if (!matchName && !matchId && !matchRank) return false
      }

      // 2. Decision Filter
      if (decisionFilter !== 'ALL') {
        const dec = ar.decision || 'pending'
        if (decisionFilter === 'cleared' && dec !== 'cleared') return false
        if (decisionFilter === 'not_cleared' && dec !== 'not_cleared') return false
        if (decisionFilter === 'pending' && dec !== 'pending') return false
      }

      // 3. Faculty Engagement Filter
      if (engagementFilter !== 'ALL') {
        if ((p.faculty_engagement || '').toLowerCase() !== engagementFilter) return false
      }

      // 4. Employment Status Filter
      if (employmentFilter !== 'ALL') {
        if ((p.employment_status || '').toLowerCase() !== employmentFilter) return false
      }

      return true
    })
  }, [records, search, decisionFilter, engagementFilter, employmentFilter])

  const renderDecisionBadge = (decisionStr) => {
    if (decisionStr === 'cleared') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Yes — Cleared</span>
        </span>
      )
    }
    if (decisionStr === 'not_cleared') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
          <XCircle className="w-3.5 h-3.5" />
          <span>No — Not Cleared</span>
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
        <Clock className="w-3.5 h-3.5" />
        <span>Pending Review</span>
      </span>
    )
  }

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100">
      {/* Workspace Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#064e2b]/10 text-[#064e2b] dark:text-emerald-400 flex items-center justify-center font-black">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Dean Annual Review &amp; Portfolio Validation Queue
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Authoritative Dean decision workspace for Academic personnel in your assigned College.
            </p>
          </div>
        </div>

        {/* Cycle Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Evaluation Cycle:</span>
          <select
            value={cycleId}
            onChange={e => setCycleId(e.target.value)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold"
          >
            <option value="2025-2026">AY 2025-2026</option>
            <option value="2024-2025">AY 2024-2025</option>
            <option value="2026-2027">AY 2026-2027</option>
          </select>
          <button
            type="button"
            onClick={() => loadData(cycleId)}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition"
            title="Refresh queue"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search faculty candidate by name, institutional ID, or rank..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
            {/* Decision Filter */}
            <Select value={decisionFilter} onValueChange={setDecisionFilter} ariaLabel="Filter by decision">
              <SelectItem value="ALL">All Decisions</SelectItem>
              <SelectItem value="cleared">Yes — Cleared</SelectItem>
              <SelectItem value="not_cleared">No — Not Cleared</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </Select>

            {/* Engagement Filter */}
            <Select value={engagementFilter} onValueChange={setEngagementFilter} ariaLabel="Filter by engagement">
              <SelectItem value="ALL">All Workload</SelectItem>
              <SelectItem value="full_time_faculty">Full-time Faculty</SelectItem>
              <SelectItem value="part_time_faculty">Part-time Faculty</SelectItem>
            </Select>

            {/* Employment Status Filter */}
            <Select value={employmentFilter} onValueChange={setEmploymentFilter} ariaLabel="Filter by tenure">
              <SelectItem value="ALL">All Tenure</SelectItem>
              <SelectItem value="permanent">Permanent</SelectItem>
              <SelectItem value="probationary">Probationary</SelectItem>
            </Select>
          </div>
        </div>
      </div>

      {/* Personnel Roster Table */}
      <section className="rounded-3xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto min-w-full">
          <table className="w-full min-w-[900px] text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold select-none">
                <th className="p-4 text-left">Academic Personnel Member</th>
                <th className="p-4 text-left">Classification &amp; Status</th>
                <th className="p-4 text-left">Position &amp; Academic Rank</th>
                <th className="p-4 text-left">Annual Review Decision</th>
                <th className="p-4 text-left">Portfolio-Validation Gate</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="font-bold text-sm text-slate-700 dark:text-slate-300">No personnel records found</p>
                    <p className="text-xs">No records match the active criteria for your authorized College.</p>
                  </td>
                </tr>
              ) : (
                filteredList.map(item => {
                  const p = item.personnel || {}
                  const ar = item.annual_review || {}
                  const elig = item.eligibility || {}
                  const isRecorded = Boolean(ar.id)
                  const pvEligible = elig.portfolio_validation?.eligible || false

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/60 transition">
                      {/* Identity */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.full_name || 'P')}&background=064e2b&color=fff`}
                            alt={p.full_name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                          />
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{p.full_name}</p>
                            <p className="text-[11px] text-slate-400 font-mono">{p.institutional_id || 'ID Pending'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Classification & Status */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <span className="block font-bold text-[#064e2b] dark:text-emerald-400">
                            {formatPersonnelClassification(p)}
                          </span>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold">
                            <span>{formatFacultyEngagement(p)}</span>
                            <span>•</span>
                            <span>{formatEmploymentStatus(p)}</span>
                          </div>
                        </div>
                      </td>

                      {/* Position & Rank */}
                      <td className="p-4">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{p.position_title || 'Faculty'}</p>
                        <p className="text-[11px] text-slate-500">{p.current_rank_title || 'Rank unassigned'}</p>
                      </td>

                      {/* Annual Review Decision */}
                      <td className="p-4">
                        <div className="space-y-1">
                          {renderDecisionBadge(ar.decision)}
                          {ar.decision === 'not_cleared' && ar.decision_reason && (
                            <p className="text-[10px] text-rose-600 dark:text-rose-400 italic max-w-[200px] truncate" title={ar.decision_reason}>
                              Reason: {ar.decision_reason}
                            </p>
                          )}
                          {item.superseded_count > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                              <History className="w-3 h-3" />
                              <span>{item.superseded_count} prior revision(s)</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Portfolio Validation Status */}
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          pvEligible
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {pvEligible ? 'Validation Path Open' : 'Blocked / Pending'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenRecordModal(item)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-[#064e2b] hover:text-white text-xs font-bold text-slate-800 dark:text-slate-200 transition flex items-center gap-1.5 ml-auto cursor-pointer"
                        >
                          {isRecorded ? (
                            <>
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Correct Decision</span>
                            </>
                          ) : (
                            <>
                              <PlusCircle className="w-3.5 h-3.5 text-[#064e2b] dark:text-emerald-400" />
                              <span>Record Decision</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Record / Supersede Modal */}
      <DeanRecordReviewModal
        personnelRecord={selectedRecord}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmitReview={handleSaveReview}
        onSupersedeReview={handleSupersedeReview}
      />
    </div>
  )
}
