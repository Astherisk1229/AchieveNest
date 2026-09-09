import React, { useState, useEffect } from 'react'
import { X, Check, ShieldCheck, FileText, AlertTriangle, History, ExternalLink, ArrowRight } from 'lucide-react'
import { formatFacultyEngagement, formatEmploymentStatus, formatPersonnelClassification } from '../../../utils/personnelPlacement'

export default function DeanRecordReviewModal({
  personnelRecord,
  isOpen,
  onClose,
  onSubmitReview,
  onSupersedeReview
}) {
  const isSuperseding = Boolean(personnelRecord?.annual_review?.id)
  const existingReview = personnelRecord?.annual_review || null
  const personnel = personnelRecord?.personnel || personnelRecord || {}
  const cycleId = personnelRecord?.evaluation_cycle_id || '2025-2026'

  const [decision, setDecision] = useState('cleared')
  const [decisionReason, setDecisionReason] = useState('')
  const [evidenceReference, setEvidenceReference] = useState('')
  const [instructionalRating, setInstructionalRating] = useState('')
  const [attendanceRating, setAttendanceRating] = useState('')
  const [overallRating, setOverallRating] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    if (existingReview) {
      setDecision(existingReview.decision || 'cleared')
      setDecisionReason(existingReview.decision_reason || '')
      setEvidenceReference(existingReview.evidence_reference || '')
      const summary = existingReview.review_summary_payload || {}
      setInstructionalRating(summary.instructional_rating || '')
      setAttendanceRating(summary.attendance_rating || '')
      setOverallRating(summary.overall_rating || '')
    } else {
      setDecision('cleared')
      setDecisionReason('')
      setEvidenceReference('')
      setInstructionalRating('')
      setAttendanceRating('')
      setOverallRating('')
    }
    setError('')
    setShowHistory(false)
  }, [isOpen, personnelRecord, existingReview])

  if (!isOpen || !personnelRecord) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (decision === 'not_cleared' && !decisionReason.trim()) {
      setError('A specific reason is required when Subject to Portfolio Validation is No (not cleared).')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        personnel_profile_id: personnel.id,
        evaluation_cycle_id: cycleId,
        review_period_label: `AY ${cycleId} Annual Performance Review`,
        decision,
        decision_reason: decision === 'not_cleared' ? decisionReason.trim() : null,
        evidence_reference: evidenceReference.trim() || null,
        review_summary_payload: {
          instructional_rating: instructionalRating.trim() || null,
          attendance_rating: attendanceRating.trim() || null,
          overall_rating: overallRating.trim() || null,
          source_document: evidenceReference.trim() || 'Annual Performance Evaluation Form'
        }
      }

      if (isSuperseding && existingReview?.id) {
        await onSupersedeReview?.(existingReview.id, payload)
      } else {
        await onSubmitReview?.(payload)
      }

      onClose()
    } catch (err) {
      const apiMsg = err?.response?.data?.error?.message || err?.error?.message || err?.message || 'Failed to record decision.'
      setError(apiMsg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/50 z-50 transition-opacity" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-[#131e2e] rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto font-sans"
        >
          {/* Header */}
          <header className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#064e2b] dark:text-emerald-400" />
                <h2 className="font-black text-sm text-slate-900 dark:text-white">
                  {isSuperseding ? 'Correct Annual Review Decision (Dean Authority)' : 'Record Annual Review Decision (Dean Authority)'}
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Target: <strong>{personnel.full_name}</strong> ({personnel.institutional_id || 'ID Pending'}) • Evaluation Cycle: <strong>{cycleId}</strong>
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </header>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Read-Only HR Master Data */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Official HR Canonical Profile (Read-Only)
              </h3>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-md">
                Plan D Master Data
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700 dark:text-slate-300">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Classification</span>
                <strong className="text-[#064e2b] dark:text-emerald-400 font-extrabold">{formatPersonnelClassification(personnel)}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Engagement</span>
                <strong>{formatFacultyEngagement(personnel)}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Employment Status</span>
                <strong>{formatEmploymentStatus(personnel)}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Academic Rank</span>
                <strong>{personnel.current_rank_title || personnel.academic_rank || 'N/A'}</strong>
              </div>
            </div>
          </div>

          {/* Section 2: Official Review Evidence Reference */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#064e2b] dark:text-emerald-400" />
              <span>Annual Review Source &amp; Evidence Reference</span>
            </h3>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Evidence Reference / Official Archive Link
              <input
                type="text"
                value={evidenceReference}
                onChange={e => setEvidenceReference(e.target.value)}
                placeholder="e.g. Dean Archive Ref: CEAC-AR-2025-042 / HR Annual Review Form Attached"
                className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs"
              />
            </label>
            
            {/* Optional transcription fields retaining source form values */}
            <div className="grid grid-cols-3 gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Instructional Skills
                <input
                  type="text"
                  value={instructionalRating}
                  onChange={e => setInstructionalRating(e.target.value)}
                  placeholder="e.g. 94.5% / Very Satisfactory"
                  className="mt-1 w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs"
                />
              </label>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Attendance &amp; Punctuality
                <input
                  type="text"
                  value={attendanceRating}
                  onChange={e => setAttendanceRating(e.target.value)}
                  placeholder="e.g. Satisfactory / 98%"
                  className="mt-1 w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs"
                />
              </label>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Overall Performance Rating
                <input
                  type="text"
                  value={overallRating}
                  onChange={e => setOverallRating(e.target.value)}
                  placeholder="e.g. Outstanding"
                  className="mt-1 w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs"
                />
              </label>
            </div>
            <p className="text-[10px] text-slate-400 italic">
              * Note: Summary fields preserve source review transcriptions only. No automated score formula is executed.
            </p>
          </div>

          {/* Section 3: Authoritative Dean Decision: Subject to Portfolio Validation */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#064e2b] dark:text-emerald-400">
                Subject to Portfolio Validation (Dean Decision)
              </h3>
              <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-200/60 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md">
                Authoritative Gate
              </span>
            </div>

            <fieldset className="space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <label className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition ${
                  decision === 'cleared'
                    ? 'bg-white dark:bg-slate-900 border-[#064e2b] dark:border-emerald-500 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800'
                }`}>
                  <input
                    type="radio"
                    name="decision"
                    value="cleared"
                    checked={decision === 'cleared'}
                    onChange={() => setDecision('cleared')}
                  />
                  <div>
                    <strong className="block text-xs text-slate-900 dark:text-white font-extrabold">
                      Yes — Cleared for Portfolio Validation
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      Cleared to use the portfolio-validation path for Cycle {cycleId}.
                    </span>
                  </div>
                </label>

                <label className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition ${
                  decision === 'not_cleared'
                    ? 'bg-white dark:bg-slate-900 border-rose-500 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800'
                }`}>
                  <input
                    type="radio"
                    name="decision"
                    value="not_cleared"
                    checked={decision === 'not_cleared'}
                    onChange={() => setDecision('not_cleared')}
                  />
                  <div>
                    <strong className="block text-xs text-rose-700 dark:text-rose-400 font-extrabold">
                      No — Not Cleared
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      Not cleared for portfolio validation; reason required.
                    </span>
                  </div>
                </label>
              </div>
            </fieldset>

            {decision === 'not_cleared' && (
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 pt-2">
                Mandatory Explanation / Justification for Not Cleared <span className="text-rose-600">*</span>
                <textarea
                  rows={2}
                  value={decisionReason}
                  onChange={e => setDecisionReason(e.target.value)}
                  placeholder="State the official Annual Review basis for not clearing this personnel member for portfolio validation..."
                  className="mt-1 w-full p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-900 text-xs"
                />
              </label>
            )}
          </div>

          {/* Supersession Context Notice */}
          {isSuperseding && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <History className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                This correction creates an append-only successor record. The previous decision ({existingReview.decision}) recorded at {existingReview.recorded_at} will be preserved in audit lineage as superseded.
              </span>
            </div>
          )}

          {/* Footer */}
          <footer className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-[#176B43] text-white font-bold text-xs disabled:opacity-50 hover:bg-[#125333] transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{submitting ? 'Saving…' : (isSuperseding ? 'Supersede & Save Decision' : 'Record Official Decision')}</span>
            </button>
          </footer>
        </form>
      </div>
    </>
  )
}
