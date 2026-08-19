import React from 'react'
import {
  X,
  Award,
  CheckCircle2,
  FileText,
  ShieldCheck,
  UserCheck,
  Info,
  Calendar,
  ExternalLink,
  ChevronRight
} from 'lucide-react'
import CandidateStatusBadge from './CandidateStatusBadge'

export default function CandidateScoreAuditDrawer({
  candidate,
  onClose,
  onConfirmAwardee,
  onUndoConfirmation,
  onMarkReviewed
}) {
  if (!candidate) return null

  const proofItems = candidate.proofItems || [
    { id: 1, title: "Dean's List Certificate 1st Sem", category: 'Academic', points: 40, verifier: 'Dr. Maria Santos • Program Coordinator', date: 'Dec 15, 2025' },
    { id: 2, title: 'Supreme Student Council President Appointment', category: 'Leadership', points: 30, verifier: 'Prof. Juan Dela Cruz • OSAD Moderator', date: 'Jan 10, 2026' },
    { id: 3, title: 'NDMU Intramurals Championship Trophy', category: 'Sports', points: 12, verifier: 'Coach Robert Tan • Sports Director', date: 'Feb 14, 2026' }
  ]

  const isConfirmed = candidate.confirmed || candidate.confirmationStatus === 'confirmed'

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-white dark:bg-[#131e2e] shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between animate-in slide-in-from-right duration-200">
          
          {/* Header */}
          <div className="p-6 bg-[#1b4332] text-white border-b border-emerald-900/60 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 text-emerald-300 border border-white/10 flex items-center justify-center font-bold shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-white leading-snug">
                  {candidate.student_name || candidate.name}
                </h2>
                <p className="text-xs text-emerald-200/90 font-medium">
                  {candidate.program} • {candidate.college}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            
            {/* Overview Metric Banner */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-black text-slate-400 block">Category Rank</span>
                <span className="text-lg font-black text-slate-900 dark:text-white">#{candidate.globalRank || 1}</span>
              </div>
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
              <div>
                <span className="text-[10px] uppercase font-black text-slate-400 block">System Score</span>
                <span className="text-lg font-black text-[#2d8a4e] dark:text-emerald-400">{candidate.score || candidate.weightedScore || 90} / 100</span>
              </div>
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
              <div>
                <span className="text-[10px] uppercase font-black text-slate-400 block">Status</span>
                <CandidateStatusBadge status={candidate.confirmationStatus || (isConfirmed ? 'confirmed' : 'unconfirmed')} type="confirmation" />
              </div>
            </div>

            {/* Criteria & Score Calculation Breakdown */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#2d8a4e]" />
                <span>Score Breakdown Trace</span>
              </h3>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 font-bold">
                  <span className="text-slate-600 dark:text-slate-300">A. Academic Performance (GPA 1.25)</span>
                  <span className="text-slate-900 dark:text-white font-extrabold">40 pts</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 font-bold">
                  <span className="text-slate-600 dark:text-slate-300">B. Executive Student Leadership</span>
                  <span className="text-slate-900 dark:text-white font-extrabold">30 pts</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 font-bold">
                  <span className="text-slate-600 dark:text-slate-300">C. Sports & Athletics Intramurals</span>
                  <span className="text-slate-900 dark:text-white font-extrabold">12 pts</span>
                </div>
                <div className="flex items-center justify-between pt-1 font-black text-slate-900 dark:text-white">
                  <span>Calculated Composite Score</span>
                  <span className="text-[#2d8a4e] dark:text-emerald-400">{candidate.score || 82} / 100</span>
                </div>
              </div>
            </div>

            {/* Verified Student Achievement Proofs (Read-Only Preview) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#2d8a4e]" />
                  <span>Verified Supporting Proofs ({proofItems.length})</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-semibold">Verified by Program Coordinators</span>
              </div>

              <div className="space-y-2.5">
                {proofItems.map(item => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white">{item.title}</span>
                      <span className="text-[11px] font-black text-[#2d8a4e] dark:text-emerald-400">+{item.points} pts</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-emerald-600" />
                        {item.verifier}
                      </span>
                      <span>{item.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Read-Only Scope Disclaimer */}
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
              <Info className="w-4 h-4 text-[#2d8a4e] shrink-0 mt-0.5" />
              <span>
                OSAD reviews verified achievement data for award candidacy. Program Coordinators remain the authoritative verifiers for individual Student submissions.
              </span>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-extrabold text-xs transition cursor-pointer"
            >
              Close
            </button>

            <div className="flex items-center gap-2">
              {isConfirmed ? (
                <button
                  type="button"
                  onClick={() => onUndoConfirmation && onUndoConfirmation(candidate)}
                  className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 text-xs font-extrabold transition cursor-pointer border border-rose-200 dark:border-rose-800"
                >
                  Undo Confirmation
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onConfirmAwardee && onConfirmAwardee(candidate.id)}
                  className="px-4 py-2.5 rounded-xl bg-[#1b4332] hover:bg-[#2d8a4e] text-white text-xs font-extrabold transition cursor-pointer shadow-2xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Confirm as Awardee</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
