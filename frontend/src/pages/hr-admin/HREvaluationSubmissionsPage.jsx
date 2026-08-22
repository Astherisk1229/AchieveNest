import React, { useState, useMemo } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { useHR } from '../../hooks/useHR'
import VerificationQueueHeader from './evaluation-submissions/queue/VerificationQueueHeader'
import VerificationStatusTabs from './evaluation-submissions/queue/VerificationStatusTabs'
import VerificationQueueToolbar from './evaluation-submissions/queue/VerificationQueueToolbar'
import PortfolioSubmissionRow from './evaluation-submissions/queue/PortfolioSubmissionRow'
import PortfolioEvaluationStudio from './evaluation-submissions/evaluation/PortfolioEvaluationStudio'
import ReturnForRevisionModal from './evaluation-submissions/evaluation/actions/ReturnForRevisionModal'
import FinalizeVerificationModal from './evaluation-submissions/evaluation/actions/FinalizeVerificationModal'

export function HREvaluationSubmissionsPage(props) {
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

  // Active Review Conflict Check
  const [conflictModalActive, setConflictModalActive] = useState(false)
  const activeReview = hrHook.activeReview

  const handleInspect = (sub) => {
    // If starting a new review while another is active, trigger conflict modal
    if ((sub.status === 'pending' || sub.status === 'FORWARDED_TO_HR') && activeReview && activeReview.id !== sub.id) {
      setConflictModalActive(true)
      return
    }
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
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-[#176B43] text-white font-extrabold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header & Workload Counters */}
      <VerificationQueueHeader stats={counts} />

      {/* Persistent Current Review Banner */}
      {activeReview && (
        <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-[#064e2b] dark:text-[#245F42] flex items-center justify-center font-bold shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-[#176B43] text-white text-[10px] font-extrabold uppercase">My Current Review</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{activeReview.faculty_name || 'Dr. Maria Santos'}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                {activeReview.department || 'Department of Computer Studies'} · 16 of 18 evidence items reviewed (89%)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleInspect(activeReview)}
            className="px-4 py-2 rounded-xl bg-[#EFF7F0] hover:bg-[#143326] text-white font-extrabold text-xs transition cursor-pointer shrink-0 shadow-2xs"
          >
            Continue Review →
          </button>
        </div>
      )}

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

      {/* Active Review Conflict Warning Modal */}
      {conflictModalActive && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#131e2e] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100 dark:border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Active Review Already in Progress</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-normal">
              You already have an evaluation in progress for <strong className="text-slate-900 dark:text-white">{activeReview?.faculty_name || 'Dr. Maria Santos'}</strong>. Each HR staff account can actively review one portfolio at a time.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConflictModalActive(false)}
                className="w-1/2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setConflictModalActive(false)
                  if (activeReview) handleInspect(activeReview)
                }}
                className="w-1/2 py-2.5 rounded-xl bg-[#176B43] text-white text-xs font-extrabold hover:bg-[#143326] cursor-pointer shadow-2xs"
              >
                Continue Review →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export const HREvaluationSubmissions = HREvaluationSubmissionsPage
export default HREvaluationSubmissionsPage
