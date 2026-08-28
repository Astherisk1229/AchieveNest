import React, { useState, useMemo } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { useHR } from '../../hooks/useHR'
import VerificationQueueHeader from './evaluation-submissions/queue/VerificationQueueHeader'
import VerificationStatusTabs from './evaluation-submissions/queue/VerificationStatusTabs'
import VerificationQueueToolbar from './evaluation-submissions/queue/VerificationQueueToolbar'
import PortfolioSubmissionRow from './evaluation-submissions/queue/PortfolioSubmissionRow'
import PortfolioEvaluationStudio from './evaluation-submissions/evaluation/PortfolioEvaluationStudio'
import ReturnForRevisionModal from './evaluation-submissions/evaluation/actions/ReturnForRevisionModal'
import FinalizeEvaluationModal from './evaluation-submissions/evaluation/actions/FinalizeEvaluationModal'

export function HREvaluationSubmissionsPage(props) {
  const hrHook = useHR()

  const directHRQueue = props.directHRQueue || hrHook.directHRQueue || []
  const endorsedQueue = props.endorsedQueue || hrHook.endorsedQueue || []
  const accomplishments = props.accomplishments || hrHook.accomplishments || []
  const handleSealVerification = props.handleSealVerification || hrHook.handleSealVerification
  const handleReturnAccomplishment = props.handleReturnAccomplishment || hrHook.handleReturnAccomplishment

  // Queue State: 'submitted' | 'in_evaluation' | 'ready_for_finalization' | 'returned_for_revision' | 'completed'
  const [activeTab, setActiveTab] = useState('submitted')
  const [search, setSearch] = useState('')
  const [collegeFilter, setCollegeFilter] = useState('ALL')
  const [submissionType, setSubmissionType] = useState('ALL')

  // Evaluation Studio & Modals State
  const [evaluatingSubmission, setEvaluatingSubmission] = useState(null)
  const [returningSubmission, setReturningSubmission] = useState(null)
  const [finalizingSubmission, setFinalizingSubmission] = useState(null)
  const [finalizingScores, setFinalizingScores] = useState({})
  const [toastMsg, setToastMsg] = useState(null)

  const showToast = (msg) => {
    if (props.showToast) {
      props.showToast(msg)
    } else {
      setToastMsg(msg)
      setTimeout(() => setToastMsg(null), 3500)
    }
  }

  // Authoritative Submissions Catalog
  const baseSubmissions = useMemo(() => {
    return [
      {
        id: 'sub-101',
        faculty_name: 'Dr. Ana Reyes',
        email: 'moderator@ndmu.edu.ph',
        employee_id: 'EMP-2019-0881',
        college: 'CEAC - College of Engineering, Architecture, and Computing',
        personnel_classification: 'academic',
        program_affiliations: [{ code: 'BSCS', name: 'BS Computer Science' }],
        academic_rank: 'Associate Professor I',
        submission_type: 'Personnel Ranking Evaluation',
        submissionType: 'Personnel Ranking Evaluation',
        submitted_at: '2026-08-14T08:30:00Z',
        submittedDate: 'Aug 14, 2026',
        completed_items_count: 6,
        completedItemsCount: 6,
        total_items_count: 6,
        totalItemsCount: 6,
        status: 'submitted',
        tenure_years: 7,
      },
      {
        id: 'sub-102',
        faculty_name: 'Dr. Gabriel Mendoza',
        email: 'gmendoza@ndmu.edu.ph',
        employee_id: 'EMP-2018-0412',
        college: 'CBA - College of Business Administration',
        personnel_classification: 'academic',
        program_affiliations: [{ code: 'BSBA', name: 'BS Business Administration' }],
        academic_rank: 'Full Professor I',
        submission_type: 'Personnel Ranking Evaluation',
        submissionType: 'Personnel Ranking Evaluation',
        submitted_at: '2026-08-12T09:15:00Z',
        submittedDate: 'Aug 12, 2026',
        completed_items_count: 4,
        completedItemsCount: 4,
        total_items_count: 6,
        totalItemsCount: 6,
        status: 'in_evaluation',
        tenure_years: 15,
      },
      {
        id: 'sub-103',
        faculty_name: 'Engr. Sarah Cruz',
        email: 'scruz@ndmu.edu.ph',
        employee_id: 'EMP-2022-0901',
        college: 'CAS - College of Arts and Sciences',
        personnel_classification: 'academic',
        program_affiliations: [{ code: 'BSPHY', name: 'BS Physics' }],
        academic_rank: 'Instructor III',
        submission_type: 'Personnel Ranking Evaluation',
        submissionType: 'Personnel Ranking Evaluation',
        submitted_at: '2026-08-10T11:00:00Z',
        submittedDate: 'Aug 10, 2026',
        completed_items_count: 3,
        completedItemsCount: 3,
        total_items_count: 6,
        totalItemsCount: 6,
        status: 'returned_for_revision',
        tenure_years: 4,
      },
    ]
  }, [])

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

      const matchesCollege = collegeFilter === 'ALL' || sub.college.includes(collegeFilter)
      
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

  const handleInspect = (sub) => {
    setEvaluatingSubmission(sub)
  }

  const handleSaveProgress = (items, scores) => {
    showToast('Evaluation draft saved.')
  }

  const handleConfirmReturn = (subId, returnData) => {
    if (handleReturnAccomplishment) {
      handleReturnAccomplishment(subId, returnData.remarks)
    }
    showToast(`Returned portfolio to ${returningSubmission?.faculty_name || 'personnel'} for revision.`)
    setReturningSubmission(null)
    setEvaluatingSubmission(null)
  }

  const handleConfirmFinalize = (subId, scores) => {
    if (handleSealVerification) {
      handleSealVerification(subId, 'HR-FINALIZED')
    }
    const totalPts = scores.grandTotalAwarded ?? scores.total_score ?? scores.totalScore ?? 0
    showToast(`Successfully finalized evaluation for ${finalizingSubmission?.faculty_name || 'personnel'} (${Number(totalPts).toFixed(2)} / 160.00 Points).`)
    setFinalizingSubmission(null)
    setEvaluatingSubmission(null)
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

      {/* Header & Workload Counters */}
      <VerificationQueueHeader stats={counts} />

      {/* Status Tabs */}
      <VerificationStatusTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        counts={counts}
      />

      {/* Search & Filter Toolbar */}
      <VerificationQueueToolbar
        search={search}
        setSearch={setSearch}
        collegeFilter={collegeFilter}
        setCollegeFilter={setCollegeFilter}
        submissionType={submissionType}
        setSubmissionType={setSubmissionType}
      />

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
