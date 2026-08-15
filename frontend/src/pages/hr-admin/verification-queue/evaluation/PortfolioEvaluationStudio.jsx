import React, { useState, useMemo } from 'react'
import { ArrowLeft, Save, X, ShieldCheck } from 'lucide-react'
import FacultyPortfolioPane from './portfolio/FacultyPortfolioPane'
import NDMURatingPane from './rating/NDMURatingPane'
import { calculateNDMUScores } from './rating/NDMURatingEngine'

export default function PortfolioEvaluationStudio({
  submission,
  onClose,
  onSaveProgress,
  onOpenReturnModal,
  onOpenFinalizeModal
}) {
  if (!submission) return null

  // Initialize mock evidence items for the portfolio
  const [evidenceItems, setEvidenceItems] = useState([
    { id: 'ev-1', categoryArea: 'areaA', criterionKey: 'degrees', title: 'Ph.D. Computer Science Diploma', criterionTitle: 'A.1 Educational Degrees', eligiblePoints: 40, awardedPoints: 40, verificationStatus: 'verified', fileName: 'PhD_Diploma_Ana_Reyes.pdf', submittedDate: 'Aug 10, 2026' },
    { id: 'ev-2', categoryArea: 'areaA', criterionKey: 'memberships', title: 'IEEE Senior Professional Member', criterionTitle: 'A.2 Professional Organization Memberships', eligiblePoints: 5, awardedPoints: 5, verificationStatus: 'verified', fileName: 'IEEE_Membership_Cert.pdf', submittedDate: 'Aug 11, 2026' },
    { id: 'ev-3', categoryArea: 'areaA', criterionKey: 'seminars', title: 'International Conference on AI & Higher Education', criterionTitle: 'A.3 Seminars & Trainings', eligiblePoints: 10, awardedPoints: 10, verificationStatus: 'verified', fileName: 'AI_Conference_Cert.pdf', submittedDate: 'Aug 12, 2026' },
    { id: 'ev-4', categoryArea: 'areaB', criterionKey: 'publications', title: 'IEEE Transactions Scholarly Paper on Deep Learning', criterionTitle: 'B.2 Publications (Papers, Articles, Books)', eligiblePoints: 8, awardedPoints: 8, verificationStatus: 'verified', fileName: 'IEEE_Transactions_Paper.pdf', submittedDate: 'Aug 13, 2026' },
    { id: 'ev-5', categoryArea: 'areaB', criterionKey: 'research', title: 'CHED Institutional Research Grant Final Report', criterionTitle: 'B.3 Conduct of Research', eligiblePoints: 10, awardedPoints: 10, verificationStatus: 'verified', fileName: 'CHED_Research_Report.pdf', submittedDate: 'Aug 13, 2026' },
    { id: 'ev-6', categoryArea: 'areaC', criterionKey: 'extracurricular', title: 'Department Secretary & Computer Society Moderator', criterionTitle: 'C.1 Extracurricular / Club Moderation', eligiblePoints: 20, awardedPoints: 20, verificationStatus: 'verified', fileName: 'Moderator_Appointment.pdf', submittedDate: 'Aug 14, 2026' },
  ])

  const [selectedEvidence, setSelectedEvidence] = useState(null)

  // Calculate live NDMU scores using engine
  const scores = useMemo(() => {
    return calculateNDMUScores(evidenceItems, submission.tenure_years || 7)
  }, [evidenceItems, submission.tenure_years])

  const handleVerifyItem = (itemId, awardedPts) => {
    setEvidenceItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, verificationStatus: 'verified', awardedPoints: awardedPts }
      }
      return item
    }))
  }

  const handleRejectItem = (itemId, reason) => {
    setEvidenceItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, verificationStatus: 'rejected', awardedPoints: 0, rejectionReason: reason }
      }
      return item
    }))
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col font-sans overflow-hidden">
      {/* Studio Header Bar */}
      <div className="px-6 py-3 bg-[#131e2e] border-b border-slate-800 flex items-center justify-between text-white shrink-0">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Queue</span>
          </button>

          <div className="h-4 w-px bg-slate-700" />

          <div>
            <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>NDMU HR Portfolio Evaluation Studio — {submission.faculty_name}</span>
            </h2>
            <p className="text-[10px] text-slate-400 font-medium">
              <span className="font-mono text-slate-300">{submission.employee_id}</span> · {submission.department} ({submission.college})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSaveProgress}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Progress</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center transition cursor-pointer"
            title="Exit Studio"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Synchronized 2-Pane Split Windows (Left: 50% Portfolio | Right: 50% Rating Matrix) */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
        {/* WINDOW 1: FACULTY PORTFOLIO SHOWCASE (LEFT) */}
        <FacultyPortfolioPane
          submission={submission}
          evidenceItems={evidenceItems}
          selectedEvidence={selectedEvidence}
          onSelectEvidence={setSelectedEvidence}
        />

        {/* WINDOW 2: OFFICIAL NDMU RATING SHEET (RIGHT) */}
        <NDMURatingPane
          submission={submission}
          scores={scores}
          evidenceItems={evidenceItems}
          selectedEvidence={selectedEvidence}
          onVerifyItem={handleVerifyItem}
          onRejectItem={handleRejectItem}
          onOpenReturnModal={() => onOpenReturnModal(submission)}
          onOpenFinalizeModal={() => onOpenFinalizeModal(submission, scores)}
        />
      </div>
    </div>
  )
}
