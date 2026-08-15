import React, { useState, useMemo } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { useHR } from '../../hooks/useHR'
import VerificationQueueHeader from './verification-queue/queue/VerificationQueueHeader'
import VerificationStatusTabs from './verification-queue/queue/VerificationStatusTabs'
import VerificationQueueToolbar from './verification-queue/queue/VerificationQueueToolbar'
import PortfolioSubmissionRow from './verification-queue/queue/PortfolioSubmissionRow'
import PortfolioEvaluationStudio from './verification-queue/evaluation/PortfolioEvaluationStudio'
import ReturnForRevisionModal from './verification-queue/evaluation/actions/ReturnForRevisionModal'
import FinalizeVerificationModal from './verification-queue/evaluation/actions/FinalizeVerificationModal'

export function HRVerificationQueuePage(props) {
  const hrHook = useHR()

  const directHRQueue = props.directHRQueue || hrHook.directHRQueue || []
  const endorsedQueue = props.endorsedQueue || hrHook.endorsedQueue || []
  const accomplishments = props.accomplishments || hrHook.accomplishments || []
  const handleSealVerification = props.handleSealVerification || hrHook.handleSealVerification
  const handleReturnAccomplishment = props.handleReturnAccomplishment || hrHook.handleReturnAccomplishment

  // Queue State
  const [activeTab, setActiveTab] = useState('pending') // 'pending' | 'in_review' | 'returned' | 'completed'
  const [search, setSearch] = useState('')
  const [collegeFilter, setCollegeFilter] = useState('ALL')
  const [deptFilter, setDeptFilter] = useState('ALL')
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

  // Portfolio Submissions Catalog Mock Data
  const mockSubmissions = useMemo(() => {
    return [
      {
        id: 'sub-101',
        faculty_name: 'Dr. Ana Reyes',
        email: 'moderator@ndmu.edu.ph',
        employee_id: 'EMP-2019-0881',
        college: 'CEAC - College of Engineering, Architecture, and Computing',
        department: 'Department of Computer Studies',
        academic_rank: 'Associate Professor I',
        submissionType: 'Ranking & Promotion Portfolio',
        submittedDate: 'Aug 14, 2026',
        completedItemsCount: 16,
        totalItemsCount: 18,
        status: 'pending',
        tenure_years: 7,
      },
      {
        id: 'sub-102',
        faculty_name: 'Dr. Gabriel Mendoza',
        email: 'gmendoza@ndmu.edu.ph',
        employee_id: 'EMP-2018-0412',
        college: 'CBA - College of Business Administration',
        department: 'Department of Business Management',
        academic_rank: 'Full Professor I',
        submissionType: 'Tenure & Promotion Portfolio',
        submittedDate: 'Aug 12, 2026',
        completedItemsCount: 18,
        totalItemsCount: 18,
        status: 'in_review',
        tenure_years: 15,
      },
      {
        id: 'sub-103',
        faculty_name: 'Engr. Sarah Cruz',
        email: 'scruz@ndmu.edu.ph',
        employee_id: 'EMP-2022-0901',
        college: 'CAS - College of Arts and Sciences',
        department: 'Department of Physical Sciences',
        academic_rank: 'Instructor III',
        submissionType: 'Ranking Portfolio',
        submittedDate: 'Aug 10, 2026',
        completedItemsCount: 12,
        totalItemsCount: 15,
        status: 'returned',
        tenure_years: 4,
      },
    ]
  }, [])

  // Filter Submissions
  const filteredSubmissions = useMemo(() => {
    return mockSubmissions.filter(sub => {
      const q = search.toLowerCase().trim()
      const matchesSearch = !q ||
        sub.faculty_name.toLowerCase().includes(q) ||
        sub.employee_id.toLowerCase().includes(q) ||
        sub.email.toLowerCase().includes(q) ||
        sub.department.toLowerCase().includes(q)

      const matchesCollege = collegeFilter === 'ALL' || sub.college.includes(collegeFilter)
      const matchesDept = deptFilter === 'ALL' || sub.department === deptFilter
      const matchesTab = sub.status === activeTab || (activeTab === 'pending' && sub.status === 'pending')

      return matchesSearch && matchesCollege && matchesDept && matchesTab
    })
  }, [mockSubmissions, search, collegeFilter, deptFilter, activeTab])

  // Counts
  const counts = useMemo(() => ({
    pending: mockSubmissions.filter(s => s.status === 'pending').length,
    inReview: mockSubmissions.filter(s => s.status === 'in_review').length,
    returned: mockSubmissions.filter(s => s.status === 'returned').length,
    completed: mockSubmissions.filter(s => s.status === 'completed').length,
  }), [mockSubmissions])

  // Action Handlers
  const handleInspect = (sub) => {
    setEvaluatingSubmission(sub)
  }

  const handleSaveProgress = () => {
    showToast('Evaluation progress saved successfully.')
  }

  const handleConfirmReturn = (subId, returnData) => {
    if (handleReturnAccomplishment) {
      handleReturnAccomplishment(subId, returnData.remarks)
    }
    showToast(`Returned portfolio to ${returningSubmission?.faculty_name || 'faculty'} for revision.`)
    setReturningSubmission(null)
    setEvaluatingSubmission(null)
  }

  const handleConfirmFinalize = (subId, scores) => {
    if (handleSealVerification) {
      handleSealVerification(subId, 'HR-SEAL-2026-0099')
    }
    showToast(`Successfully finalized portfolio for ${finalizingSubmission?.faculty_name || 'faculty'} (${scores.grandTotalAwarded || 141} / 160 Points). Official HR Seal Applied!`)
    setFinalizingSubmission(null)
    setEvaluatingSubmission(null)
  }

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-[#1b4332] text-white font-extrabold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
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
        deptFilter={deptFilter}
        setDeptFilter={setDeptFilter}
        submissionType={submissionType}
        setSubmissionType={setSubmissionType}
      />

      {/* Portfolio Submissions Queue */}
      <div className="space-y-3">
        {filteredSubmissions.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-[#131e2e] rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400 font-medium">
            No portfolio submissions match your search or filter criteria.
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
          onOpenReturnModal={(sub) => setReturningSubmission(sub)}
          onOpenFinalizeModal={(sub, scores) => {
            setFinalizingSubmission(sub)
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

      {/* Finalize Verification Checklist Modal */}
      <FinalizeVerificationModal
        submission={finalizingSubmission}
        scores={finalizingScores}
        isOpen={Boolean(finalizingSubmission)}
        onClose={() => setFinalizingSubmission(null)}
        onConfirmFinalize={handleConfirmFinalize}
      />
    </div>
  )
}

export const HRVerificationQueue = HRVerificationQueuePage
export default HRVerificationQueuePage
