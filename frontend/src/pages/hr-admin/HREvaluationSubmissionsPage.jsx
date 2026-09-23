import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { CheckCircle2 } from 'lucide-react'
import VerificationQueueHeader from './evaluation-submissions/queue/VerificationQueueHeader'
import VerificationStatusTabs from './evaluation-submissions/queue/VerificationStatusTabs'
import VerificationQueueToolbar from './evaluation-submissions/queue/VerificationQueueToolbar'
import PortfolioSubmissionRow from './evaluation-submissions/queue/PortfolioSubmissionRow'
import PortfolioEvaluationStudio from './evaluation-submissions/evaluation/PortfolioEvaluationStudio'
import ReturnForRevisionModal from './evaluation-submissions/evaluation/actions/ReturnForRevisionModal'
import FinalizeEvaluationModal from './evaluation-submissions/evaluation/actions/FinalizeEvaluationModal'
import hrEvaluationService from '../../services/hrEvaluationService'
import periodService from '../../services/personnelEvaluationPeriodService'
import FacultyEvaluationSummary from '../../components/evaluation/FacultyEvaluationSummary'

export function HREvaluationSubmissionsPage(props) {
  // Queue State: 'submitted' | 'in_evaluation' | 'ready_for_finalization' | 'returned_for_revision' | 'completed'
  const [activeTab, setActiveTab] = useState(props.initialTab || 'submitted')
  const [search, setSearch] = useState('')
  const [collegeFilter, setCollegeFilter] = useState('ALL')
  const [submissionType, setSubmissionType] = useState('ALL')
  const [periodFilter, setPeriodFilter] = useState(props.fixedPeriodId || 'ALL')
  const [periods, setPeriods] = useState([])

  // Evaluation Studio & Modals State
  const [evaluatingSubmission, setEvaluatingSubmission] = useState(null)
  const [returningSubmission, setReturningSubmission] = useState(null)
  const [finalizingSubmission, setFinalizingSubmission] = useState(null)
  const [finalizingScores, setFinalizingScores] = useState({})
  const [toastMsg, setToastMsg] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [loadError, setLoadError] = useState(null)
  const [summaryReport, setSummaryReport] = useState(null)

  const loadSubmissions = useCallback(async () => {
    try {
      setLoadError(null)
      const [rows, periodData] = await Promise.all([
        hrEvaluationService.list(periodFilter === 'ALL' ? {} : { evaluation_period_id: periodFilter }),
        periodService.listPersonnelEvaluationPeriods()
      ])
      setSubmissions(rows)
      setPeriods(periodData?.periods || [])
    } catch (error) {
      setSubmissions([])
      setLoadError(error?.response?.data?.error?.message || error?.message || 'Failed to load evaluations.')
    }
  }, [periodFilter])

  useEffect(() => { loadSubmissions() }, [loadSubmissions])
  useEffect(() => { if (props.fixedPeriodId) setPeriodFilter(props.fixedPeriodId) }, [props.fixedPeriodId])

  const showToast = (msg) => {
    if (props.showToast) {
      props.showToast(msg)
    } else {
      setToastMsg(msg)
      setTimeout(() => setToastMsg(null), 3500)
    }
  }

  // Authoritative Submissions Catalog
  const baseSubmissions = submissions

  // Filter Submissions
  const filteredSubmissions = useMemo(() => {
    return baseSubmissions.filter(sub => {
      const q = search.toLowerCase().trim()
      const matchesSearch = !q ||
        sub.faculty_name.toLowerCase().includes(q) ||
        (sub.employee_id && sub.employee_id.toLowerCase().includes(q)) ||
        (sub.institutional_id && sub.institutional_id.toLowerCase().includes(q)) ||
        sub.email.toLowerCase().includes(q) ||
        (sub.program_affiliations || []).some(program => `${program.code} ${program.name}`.toLowerCase().includes(q))

      const matchesCollege = collegeFilter === 'ALL' || String(sub.college || sub.department_name || '').includes(collegeFilter)
      
      const matchesTab =
        sub.status === activeTab ||
        (activeTab === 'submitted' && (sub.status === 'submitted' || sub.status === 'pending')) ||
        (activeTab === 'in_evaluation' && (sub.status === 'in_evaluation' || sub.status === 'in_review')) ||
        (activeTab === 'returned_for_revision' && (sub.status === 'returned_for_revision' || sub.status === 'returned')) ||
        (activeTab === 'ready_for_finalization' && (sub.status === 'ready_for_finalization' || sub.status === 'ready_finalization'))

      return matchesSearch && matchesCollege && matchesTab
    })
  }, [baseSubmissions, search, collegeFilter, activeTab])

  // Zero-Safe Counts
  const counts = useMemo(() => ({
    submitted: baseSubmissions.filter(s => s.status === 'submitted' || s.status === 'pending').length,
    in_evaluation: baseSubmissions.filter(s => s.status === 'in_evaluation' || s.status === 'in_review').length,
    ready_for_finalization: baseSubmissions.filter(s => s.status === 'ready_for_finalization' || s.status === 'ready_finalization').length,
    returned_for_revision: baseSubmissions.filter(s => s.status === 'returned_for_revision' || s.status === 'returned').length,
    completed: baseSubmissions.filter(s => s.status === 'completed').length,
  }), [baseSubmissions])

  const handleInspect = async (sub) => {
    try {
      if (['ready_for_finalization', 'completed'].includes(sub.status)) {
        const result = await hrEvaluationService.getReport(sub.id)
        setSummaryReport(result.report?.snapshot || result.report?.report_payload || result.report)
        return
      }
      if (sub.status === 'submitted') await hrEvaluationService.start(sub.id)
      const detail = await hrEvaluationService.get(sub.id)
      setEvaluatingSubmission({ ...sub, ...(detail?.evaluation || detail) })
      await loadSubmissions()
    } catch (error) {
      showToast(error?.response?.data?.error?.message || error?.message || 'Unable to open evaluation.')
    }
  }

  const handleSaveProgress = () => {
    showToast('Evaluation draft saved.')
  }

  const handleConfirmReturn = async (subId, returnData) => {
    try {
      await hrEvaluationService.returnForRevision(subId, returnData)
      await loadSubmissions()
      showToast(`Returned portfolio to ${returningSubmission?.faculty_name || 'personnel'} for revision.`)
      setReturningSubmission(null)
      setEvaluatingSubmission(null)
    } catch (error) {
      showToast(error?.response?.data?.error?.message || error?.message || 'Unable to return evaluation.')
    }
  }

  const handleConfirmFinalize = async (subId, scores) => {
    try {
      if (finalizingSubmission?.status === 'in_evaluation') await hrEvaluationService.markReady(subId)
      await hrEvaluationService.finalize(subId, scores)
      await loadSubmissions()
      const totalPts = scores.grandTotalAwarded ?? scores.total_score ?? scores.totalScore ?? 0
      showToast(`Successfully finalized evaluation for ${finalizingSubmission?.faculty_name || 'personnel'} (${Number(totalPts).toFixed(2)} / 160.00 Points).`)
      setFinalizingSubmission(null)
      setEvaluatingSubmission(null)
    } catch (error) {
      showToast(error?.response?.data?.error?.message || error?.message || 'Unable to finalize evaluation.')
    }
  }

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-[#176B43] text-white font-bold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}
      {summaryReport && <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 p-4 sm:p-8"><FacultyEvaluationSummary report={summaryReport} onClose={() => setSummaryReport(null)} /></div>}

      {/* The cycle shell supplies context when this queue is embedded. */}
      {!props.embedded && <VerificationQueueHeader stats={counts} />}

      {/* Status Tabs */}
      {!props.lockStatus && <VerificationStatusTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        counts={counts}
      />}

      {/* Search & Filter Toolbar */}
      <VerificationQueueToolbar
        search={search}
        setSearch={setSearch}
        collegeFilter={collegeFilter}
        setCollegeFilter={setCollegeFilter}
        submissionType={submissionType}
        setSubmissionType={setSubmissionType}
      />
      {!props.fixedPeriodId && <label className="flex max-w-sm items-center gap-3 text-xs font-bold text-slate-600 dark:text-slate-300"><span className="shrink-0">Evaluation period</span><select value={periodFilter} onChange={(event)=>setPeriodFilter(event.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"><option value="ALL">All evaluation periods</option>{periods.map(period=><option key={period.id} value={period.id}>{period.period_name} · {period.academic_year_label}</option>)}</select></label>}
      {loadError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100">{loadError}</p>}
      {/* Personnel Ranking Submissions Queue */}
      <div className="space-y-3">
        {filteredSubmissions.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-[#131e2e] rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400 font-medium">
            No evaluation submissions match your search or filter criteria in this queue.
          </div>
        ) : (
          filteredSubmissions.map(sub => (
            <PortfolioSubmissionRow
              key={sub.id}
              submission={sub}
              onInspect={handleInspect}
            />
          ))
        )}
      </div>

      {/* Full-Screen Dual-Pane Evaluation Studio */}
      {evaluatingSubmission && (
        <PortfolioEvaluationStudio
          submission={evaluatingSubmission}
          onClose={() => setEvaluatingSubmission(null)}
          onSaveProgress={handleSaveProgress}
          onOpenReturnModal={() => setReturningSubmission(evaluatingSubmission)}
          onOpenFinalizeModal={(scores) => {
            setFinalizingSubmission(evaluatingSubmission)
            setFinalizingScores(scores)
          }}
        />
      )}

      {/* Return for Revision Modal */}
      <ReturnForRevisionModal
        submission={returningSubmission}
        isOpen={Boolean(returningSubmission)}
        onClose={() => setReturningSubmission(null)}
        onConfirmReturn={handleConfirmReturn}
      />

      {/* Finalize Evaluation Modal */}
      <FinalizeEvaluationModal
        submission={finalizingSubmission}
        scores={finalizingScores}
        isOpen={Boolean(finalizingSubmission)}
        onClose={() => setFinalizingSubmission(null)}
        onConfirmFinalize={handleConfirmFinalize}
      />
    </div>
  )
}
export default HREvaluationSubmissionsPage
