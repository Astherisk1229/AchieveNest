import React, { useState, useEffect } from 'react'
import { CheckCircle2, AlertCircle, HelpCircle, ChevronRight, MessageSquare, Check, ExternalLink, FileText } from 'lucide-react'

export default function CriterionEvaluation({
  selectedEvidence,
  onVerifyAndNext,
  onVerify,
  onReject,
  hasNextItem = false
}) {
  const [classification, setClassification] = useState('')
  const [remarks, setRemarks] = useState('')
  const [showRemarks, setShowRemarks] = useState(false)

  // Classification options based on category
  const classificationOptions = {
    degrees: [
      { label: 'Ph.D. Degree Holder (40 pts)', points: 40 },
      { label: 'Ph.D. Units Earned (10 pts max)', points: 10 },
      { label: "Master's (MA/MS) Degree Holder (20 pts)", points: 20 },
      { label: "Master's Units Earned (10 pts max)", points: 10 },
    ],
    memberships: [
      { label: 'Officer in Professional Org (10 pts)', points: 10 },
      { label: 'Active Member in Professional Org (5 pts)', points: 5 },
    ],
    seminars: [
      { label: 'International Seminar / Workshop (10 pts)', points: 10 },
      { label: 'National Seminar / Workshop (8 pts)', points: 8 },
      { label: 'Regional Seminar / Workshop (6 pts)', points: 6 },
      { label: 'Provincial / City Seminar (4 pts)', points: 4 },
      { label: 'In-House / Institutional Seminar (3 pts)', points: 3 },
    ],
    publications: [
      { label: 'Book / Scholarly Monograph (10 pts)', points: 10 },
      { label: 'Scholarly Paper / Journal Article (8 pts)', points: 8 },
      { label: 'Research Output / Publication (5 pts)', points: 5 },
    ],
    lectures: [
      { label: 'International Keynote / Resource Person (10 pts)', points: 10 },
      { label: 'National Resource Person (8 pts)', points: 8 },
      { label: 'Regional / Local Guest Lecturer (5 pts)', points: 5 },
    ],
    extracurricular: [
      { label: 'Club / Organization Moderator (20 pts)', points: 20 },
      { label: 'Coach / Trainer (20 pts)', points: 20 },
      { label: 'Working Committee Member (10 pts)', points: 10 },
    ]
  }

  useEffect(() => {
    if (selectedEvidence) {
      setClassification(selectedEvidence.classification || '')
      setRemarks(selectedEvidence.remarks || '')
    }
  }, [selectedEvidence])

  if (!selectedEvidence) {
    return (
      <div className="p-8 text-center text-xs text-slate-400 font-medium rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
        <HelpCircle className="w-6 h-6 mx-auto text-slate-300" />
        <p className="font-extrabold text-slate-700 dark:text-slate-300">No Evidence Selected</p>
        <p>Click any evidence item from the Left Portfolio Navigator to inspect documents and verify criteria.</p>
      </div>
    )
  }

  const currentOpts = classificationOptions[selectedEvidence.criterionKey] || classificationOptions.seminars
  const currentAwardedPts = parseFloat(selectedEvidence.awardedPoints) || selectedEvidence.eligiblePoints || 40

  const handleVerifyCurrent = () => {
    onVerify(selectedEvidence.id, currentAwardedPts)
  }

  const handleVerifyNextCurrent = () => {
    onVerifyAndNext(selectedEvidence.id, currentAwardedPts)
  }

  return (
    <div className="space-y-4 font-sans">
      {/* Evidence Title & Criterion Header */}
      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
          NDMU CRITERION: {selectedEvidence.criterionTitle || 'A.1 Educational Degrees'}
        </span>
        <h3 className="text-sm font-black text-slate-900 dark:text-white">
          {selectedEvidence.title}
        </h3>
      </div>

      {/* Neutral Responsive Document Preview Canvas */}
      <div className="rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
        <div className="p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800 dark:text-slate-200">
            <FileText className="w-4 h-4 text-[#1b4332] dark:text-emerald-400" />
            <span>{selectedEvidence.fileName || `${selectedEvidence.title}_Proof.pdf`}</span>
          </div>
          <a
            href="#"
            onClick={e => e.preventDefault()}
            className="text-[11px] font-extrabold text-[#1b4332] dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>Expand Fullscreen</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="h-48 p-4 bg-white dark:bg-slate-950 flex flex-col items-center justify-center text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-[#1b4332] dark:text-emerald-400 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Official Institutional Proof Asset</p>
            <p className="text-[10px] text-slate-400 font-mono">Digitally Signed &amp; Verified PDF Document · 2.4 MB</p>
          </div>
        </div>
      </div>

      {/* NDMU Rule-Based Classification Selection */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 space-y-3">
        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">
          NDMU Scoring Classification
        </label>

        <select
          value={classification}
          onChange={e => setClassification(e.target.value)}
          className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-extrabold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#1b4332]"
        >
          {currentOpts.map((opt, idx) => (
            <option key={idx} value={opt.label}>{opt.label}</option>
          ))}
        </select>

        <div className="flex items-center justify-between text-xs font-extrabold text-slate-700 dark:text-slate-300 pt-1">
          <span>Awarded Points</span>
          <span className="text-sm font-black text-[#1b4332] dark:text-emerald-400">
            {currentAwardedPts} / 40 Points
          </span>
        </div>

        {/* Verification Action Buttons & Review Accelerator */}
        <div className="flex items-center gap-2 pt-2">
          {hasNextItem ? (
            <button
              type="button"
              onClick={handleVerifyNextCurrent}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#1b4332] hover:bg-[#143326] dark:bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Verify &amp; Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleVerifyCurrent}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#1b4332] hover:bg-[#143326] dark:bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Verify Evidence (+{currentAwardedPts} pts)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onReject(selectedEvidence.id)}
            className="py-2.5 px-4 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-200 font-extrabold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
          >
            <AlertCircle className="w-4 h-4" />
            <span>Reject</span>
          </button>
        </div>

        {/* Contextual Remark Toggle */}
        <div className="pt-2">
          {!showRemarks ? (
            <button
              type="button"
              onClick={() => setShowRemarks(true)}
              className="text-[11px] font-extrabold text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>+ Add Remark</span>
            </button>
          ) : (
            <div className="space-y-1.5 animate-in fade-in duration-150">
              <label className="block text-[11px] font-extrabold text-slate-500">
                Item Verification Remarks
              </label>
              <textarea
                rows={2}
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                placeholder="Optional verification note..."
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:outline-none focus:border-[#1b4332]"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
