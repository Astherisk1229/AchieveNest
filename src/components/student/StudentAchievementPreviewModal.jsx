import React, { useState } from 'react'
import { 
  X, 
  Award, 
  CheckCircle2, 
  Clock, 
  RotateCcw, 
  FileText, 
  Download, 
  Calendar, 
  MapPin, 
  Building2, 
  Tag, 
  User, 
  GraduationCap, 
  Copy, 
  Check, 
  PlusCircle, 
  Edit3, 
  AlertCircle 
} from 'lucide-react'

/**
 * StudentAchievementPreviewModal.jsx
 * High-resolution preview viewer modal tailored for Student Achievements.
 */
export default function StudentAchievementPreviewModal({
  achievement,
  isOpen,
  onClose,
  onEdit,
  onDownload,
  onResubmit,
  onAttachPortfolio
}) {
  const [copied, setCopied] = useState(false)

  if (!isOpen || !achievement) return null

  const isReturned = achievement.status === 'Returned'
  const isEditable = achievement.status === 'Pending Review' || achievement.status === 'Pending' || isReturned || achievement.status === 'Draft'
  const isInPortfolio = Boolean(achievement.portfolio_id)
  const refCode = achievement.id ? `REF-${String(achievement.id).toUpperCase()}` : 'REF-STU-2026-9842'

  const handleCopyRefCode = () => {
    const shareText = `[AchieveNest Student Submission] Title: "${achievement.title}" | Category: ${achievement.category} | Ref Code: ${refCode}`
    navigator.clipboard.writeText(shareText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Banner Top Graphic */}
        <div className="bg-gradient-to-r from-[#2d8a4e] to-[#1e5831] p-6 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-amber-300 shadow-inner shrink-0">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] font-black tracking-widest uppercase text-emerald-200">STUDENT ACHIEVEMENT PREVIEW</span>
              <h2 className="text-lg font-extrabold text-white leading-snug mt-0.5">{achievement.title}</h2>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/15 pt-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold">
                {achievement.category}
              </span>
              <span className="text-emerald-100 text-[11px] font-medium">
                Ref: {refCode}
              </span>
            </div>

            {/* Status Badge */}
            {achievement.status === 'Verified' && (
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 backdrop-blur-md text-emerald-100 border border-emerald-300/40 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" /> Verified by Coordinator
              </span>
            )}
            {(achievement.status === 'Pending Review' || achievement.status === 'Pending') && (
              <span className="px-3 py-1 rounded-full bg-amber-400/20 backdrop-blur-md text-amber-100 border border-amber-300/40 text-xs font-bold flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-300" /> Pending Review
              </span>
            )}
            {isReturned && (
              <span className="px-3 py-1 rounded-full bg-rose-500/20 backdrop-blur-md text-rose-100 border border-rose-300/40 text-xs font-bold flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-rose-300" /> Returned for Revisions
              </span>
            )}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-700 text-xs">
          
          {/* Coordinator Reviewer Comments Box (If Returned) */}
          {isReturned && achievement.return_remarks && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
              <div className="flex items-center gap-2 font-extrabold text-rose-800 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Program Coordinator Reviewer Remarks</span>
              </div>
              <p className="text-xs text-rose-700 font-medium pl-6 leading-relaxed">
                "{achievement.return_remarks}"
              </p>
              <div className="pt-2 pl-6">
                <button
                  type="button"
                  onClick={() => { onClose(); onResubmit(achievement) }}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Re-submit with Corrected Files
                </button>
              </div>
            </div>
          )}

          {/* Core Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" /> Event / Host Body
              </span>
              <p className="font-extrabold text-slate-900 text-sm">
                {achievement.event_name || achievement.issuer || achievement.location}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> Location / Scope
              </span>
              <p className="font-bold text-slate-800 text-xs">
                {achievement.location} • <span className="text-[#2d8a4e]">{achievement.scope_level || 'Institutional'}</span>
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Date Conferred
              </span>
              <p className="font-bold text-slate-800 text-xs">{achievement.date}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-slate-400" /> Student Profile
              </span>
              <p className="font-bold text-slate-800 text-xs">
                {achievement.student_name || 'Maria Santos'} ({achievement.student_id || 'STU-2024-01234'})
              </p>
            </div>
          </div>

          {/* Description Section */}
          {achievement.description && (
            <div className="space-y-1.5">
              <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider text-slate-400">Accomplishment Overview</h4>
              <p className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed font-medium">
                {achievement.description}
              </p>
            </div>
          )}

          {/* Attached Document Proof Card */}
          <div className="p-4 rounded-2xl bg-[#eef7f0] border border-[#cbe6d2] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white text-[#2d8a4e] border border-[#cbe6d2] flex items-center justify-center shrink-0 font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h5 className="font-extrabold text-slate-900 text-xs">
                  {achievement.attached_file_name || 'certificate_proof_document.pdf'}
                </h5>
                <p className="text-[11px] text-slate-500 font-medium">Verified PDF Document Proof • Official Attachment</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onDownload(achievement)}
              className="px-3.5 py-2 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-extrabold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Download className="w-4 h-4" /> Download Proof
            </button>
          </div>

        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyRefCode}
              className="px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'Ref Code Copied!' : 'Copy Ref Code'}</span>
            </button>

            <button
              type="button"
              onClick={() => onAttachPortfolio(achievement.id)}
              className="px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isInPortfolio ? 'In Portfolio' : 'Attach to Portfolio'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {isEditable && (
              <button
                type="button"
                onClick={() => { onClose(); onEdit(achievement) }}
                className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-500" /> Edit Submission
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-sm transition cursor-pointer"
            >
              Close Viewer
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
