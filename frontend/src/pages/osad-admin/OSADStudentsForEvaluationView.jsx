import React, { useState, useEffect } from 'react'
import {
  Award,
  ArrowLeft,
  Users,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { fetchStudentsForEvaluation } from '../../services/awardAdminService'
import OSADPageHeader from '../../components/osad/OSADPageHeader'
import {
  OSADLoadingState,
  OSADEmptyState,
  OSADSearchEmptyState,
  OSADErrorState
} from '../../components/osad/OSADStateBlock'

export default function OSADStudentsForEvaluationView({
  award,
  onBack,
  onSelectStudent
}) {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    if (award?.id) {
      loadStudents()
    }
  }, [award?.id])

  const loadStudents = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchStudentsForEvaluation(award.id)
      const list = Array.isArray(data?.students) ? data.students : []
      setStudents(list)
    } catch (err) {
      setError(err.message || 'Failed to load students for evaluation.')
    } finally {
      setLoading(false)
    }
  }

  const filteredStudents = students.filter((std) => {
    const term = searchTerm.toLowerCase()
    const matchesSearch =
      !searchTerm ||
      (std.full_name || '').toLowerCase().includes(term) ||
      (std.student_id_number || std.id || '').toLowerCase().includes(term) ||
      (std.program || '').toLowerCase().includes(term) ||
      (std.college || '').toLowerCase().includes(term)

    const status = std.evaluation_status || 'NOT_REVIEWED'
    const matchesStatus =
      statusFilter === 'all' ||
      status.toLowerCase() === statusFilter.toLowerCase()

    return matchesSearch && matchesStatus
  })

  const threshold = parseFloat(award.candidate_threshold_percent || '80.00').toFixed(2)

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
        description={`Students for Evaluation • Candidate Threshold: ${threshold}% • Computable Max: ${award.portfolio_max || '50.00'} pts`}
        secondaryActions={
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#16834a] dark:text-emerald-300 text-xs font-extrabold border border-emerald-200/60 dark:border-emerald-800/50">
            {students.length} {students.length === 1 ? 'Student' : 'Students'} for Evaluation
          </span>
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#131e2e] rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student name, ID number, program, college..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#16834a]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">All Review Statuses</option>
            <option value="not_reviewed">Not Reviewed</option>
            <option value="in_progress">In Progress</option>
            <option value="evaluated">Evaluated</option>
          </select>
        </div>
      </div>

      {/* Students List */}
      {loading ? (
        <OSADLoadingState message="Loading Students for Evaluation pool..." />
      ) : error ? (
        <OSADErrorState
          title="Unable to Load Evaluation Pool"
          message={error}
          onRetry={loadStudents}
        />
      ) : students.length === 0 ? (
        <OSADEmptyState
          icon={Users}
          title="No Students for Evaluation"
          description="No enrolled students currently have eligible verified evidence matching this award criteria."
        />
      ) : filteredStudents.length === 0 ? (
        <OSADSearchEmptyState
          title="No Matching Students"
          description="No students match the selected review status filter or search query."
          onReset={() => {
            setSearchTerm('')
            setStatusFilter('all')
          }}
          resetLabel="Reset Search & Status Filter"
        />
      ) : (
        <div className="space-y-3">
          {filteredStudents.map((std) => {
            const status = std.evaluation_status || 'NOT_REVIEWED'
            const isEvaluated = status === 'EVALUATED' || status === 'completed'
            const isInProgress = status === 'IN_PROGRESS' || status === 'in_review'

            return (
              <div
                key={std.id || std.student_profile_id}
                className="bg-white dark:bg-[#131e2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs hover:border-emerald-300 dark:hover:border-emerald-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 font-black text-sm">
                    {std.full_name?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {std.full_name}
                      </h3>
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {std.student_id_number || std.id}
                      </span>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        isEvaluated
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : isInProgress
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                      {std.program} • {std.year_level || '4th Year'} • {std.college || 'Academic Unit'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-center">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    <ShieldCheck className="w-4 h-4 text-[#16834a]" />
                    <span className="font-extrabold">{std.relevant_verified_record_count || std.evidence_count || 1}</span>
                    <span className="text-slate-400 font-medium text-[11px]">Verified Records</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectStudent(std)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    <span>Review Evaluation</span>
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
