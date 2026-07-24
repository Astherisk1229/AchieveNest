import React, { useState } from 'react'
import { 
  Shield, 
  Clock, 
  CheckCircle2, 
  RotateCcw, 
  TrendingUp, 
  Filter, 
  User, 
  FileText, 
  Check, 
  X, 
  MessageSquare,
  AlertCircle
} from 'lucide-react'

export default function CoordinatorDashboardView({ currentUser }) {
  const user = currentUser || {
    full_name: 'Dr. Ana Reyes',
    program_scope: 'BS Computer Science',
    department: 'College of Information Technology'
  }

  // Interactive state for pending verification queue
  const [queueItems, setQueueItems] = useState([
    {
      id: 101,
      title: 'Community Outreach Volunteer',
      student_name: 'Maria Santos',
      category: 'Community',
      date: '3/20/2026',
      docs_count: 1,
      attached_file_name: 'community_outreach_proof.pdf',
      description: 'Participated in a 3-day barangay digital literacy workshop for local officials.',
      status: 'Pending'
    }
  ])

  // Summary counts
  const [summaryStats, setSummaryStats] = useState({
    verified: 3,
    pending: 1,
    returned: 1
  })

  const [selectedReviewItem, setSelectedReviewItem] = useState(null)
  const [returnRemarks, setReturnRemarks] = useState('')
  const [isActionSuccess, setIsActionSuccess] = useState('')

  // Approve action
  const handleApprove = (itemId) => {
    setQueueItems(prev => prev.filter(item => item.id !== itemId))
    setSummaryStats(prev => ({
      ...prev,
      verified: prev.verified + 1,
      pending: Math.max(0, prev.pending - 1)
    }))
    setIsActionSuccess('Achievement approved & verified successfully!')
    setSelectedReviewItem(null)
    setTimeout(() => setIsActionSuccess(''), 3000)
  }

  // Return action
  const handleReturn = (itemId) => {
    if (!returnRemarks.trim()) {
      alert('Please provide remarks explaining why the achievement is being returned.')
      return
    }
    setQueueItems(prev => prev.filter(item => item.id !== itemId))
    setSummaryStats(prev => ({
      ...prev,
      returned: prev.returned + 1,
      pending: Math.max(0, prev.pending - 1)
    }))
    setIsActionSuccess('Achievement returned to student with remarks.')
    setSelectedReviewItem(null)
    setReturnRemarks('')
    setTimeout(() => setIsActionSuccess(''), 3000)
  }

  return (
    <div className="space-y-6 font-sans animate-in fade-in duration-200">
      
      {/* Toast Notification */}
      {isActionSuccess && (
        <div className="p-4 rounded-2xl bg-[#eef7f0] border border-[#cbe6d2] text-[#1e5831] text-xs font-bold flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#2d8a4e]" />
            <span>{isActionSuccess}</span>
          </div>
          <button onClick={() => setIsActionSuccess('')} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ================= 1. HERO SUMMARY BANNER ================= */}
      <div className="bg-[#1b4332] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-[#245233] relative overflow-hidden">
        
        {/* Top Header Row */}
        <div className="flex items-start justify-between mb-8 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#2d8a4e] border border-emerald-400/30 flex items-center justify-center text-white shadow-lg shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Program Coordinator Dashboard</h1>
              <p className="text-xs text-emerald-200/80 font-medium mt-0.5">
                Achievement Verification & Management • {user.program_scope || 'BS Computer Science'}
              </p>
            </div>
          </div>

          {/* NDMU Crest Emblem Badge */}
          <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-1.5 flex items-center justify-center shrink-0 shadow-md">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <path d="M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z" fill="#ffffff" opacity="0.9" />
              <path d="M50 15 L80 30 L80 70 L50 85 L20 70 L20 30 Z" fill="#1b4332" />
              <path d="M50 30 L56 42 L69 42 L58 51 L62 64 L50 55 L38 64 L42 51 L31 42 L44 42 Z" fill="#f59e0b" />
            </svg>
          </div>
        </div>

        {/* 4 Stat Counter Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 relative z-10">
          
          <div className="p-4 rounded-2xl bg-[#133220]/90 border border-emerald-600/30">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200/90 mb-2">
              <Clock className="w-4 h-4 text-amber-300" />
              <span>Pending Reviews</span>
            </div>
            <p className="text-3xl font-black text-white">{summaryStats.pending}</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#133220]/90 border border-emerald-600/30">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200/90 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Verified</span>
            </div>
            <p className="text-3xl font-black text-white">{summaryStats.verified}</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#133220]/90 border border-emerald-600/30">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200/90 mb-2">
              <RotateCcw className="w-4 h-4 text-emerald-300" />
              <span>Returned</span>
            </div>
            <p className="text-3xl font-black text-white">{summaryStats.returned}</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#133220]/90 border border-emerald-600/30">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200/90 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-300" />
              <span>Avg Review Time</span>
            </div>
            <p className="text-3xl font-black text-white">2.5 hrs</p>
          </div>

        </div>

      </div>

      {/* ================= 2. PROGRAM SCOPE FILTER NOTICE BANNER ================= */}
      <div className="p-4 rounded-2xl bg-[#eef7f0] border border-[#cbe6d2] flex items-center gap-3">
        <div className="p-2 rounded-xl bg-white text-[#2d8a4e] border border-[#cbe6d2] shrink-0 shadow-2xs">
          <Filter className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs font-extrabold text-[#1e5831]">
            Program Scope: {user.program_scope || 'BS Computer Science'}
          </p>
          <p className="text-[11px] text-emerald-800/80 font-medium mt-0.5">
            You can only view and manage students enrolled in your assigned program.
          </p>
        </div>
      </div>

      {/* ================= 3. PENDING VERIFICATION QUEUE ================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Pending Verification Queue</h2>
            <p className="text-xs text-slate-500 mt-0.5">BS Computer Science students only</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-[#1e5831] border border-emerald-200 text-xs font-bold">
            {queueItems.length} pending
          </span>
        </div>

        <div className="space-y-3">
          {queueItems.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center text-slate-500 text-xs">
              <CheckCircle2 className="w-8 h-8 text-[#2d8a4e] mx-auto mb-2" />
              <p className="font-bold text-slate-800 text-sm">Verification Queue Clear!</p>
              <p className="text-slate-400 mt-1">All student achievement submissions for BS Computer Science have been reviewed.</p>
            </div>
          ) : (
            queueItems.map(item => (
              <div
                key={item.id}
                onClick={() => setSelectedReviewItem(item)}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-[#2d8a4e] hover:shadow-md transition cursor-pointer flex items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200 group-hover:bg-[#eef7f0] group-hover:text-[#2d8a4e] transition">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-[#2d8a4e] transition">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-600 font-medium">{item.student_name}</span>
                      <span className="text-slate-300">•</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold">
                        {item.category}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xs text-slate-400 font-medium">{item.date}</p>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">{item.docs_count} docs</p>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* ================= 4. VERIFICATION SUMMARY - BS COMPUTER SCIENCE ================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-base font-extrabold text-slate-900">
          Verification Summary — {user.program_scope || 'BS Computer Science'}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <div className="p-6 rounded-2xl bg-[#eef7f0]/60 border border-[#cbe6d2]">
            <p className="text-3xl font-black text-[#2d8a4e] mb-1">{summaryStats.verified}</p>
            <p className="text-xs font-bold text-[#1e5831]">Verified Achievements</p>
          </div>

          <div className="p-6 rounded-2xl bg-[#eef7f0]/60 border border-[#cbe6d2]">
            <p className="text-3xl font-black text-[#1e5831] mb-1">{summaryStats.pending}</p>
            <p className="text-xs font-bold text-[#1e5831]">Pending Review</p>
          </div>

          <div className="p-6 rounded-2xl bg-[#eef7f0]/60 border border-[#cbe6d2]">
            <p className="text-3xl font-black text-amber-700 mb-1">{summaryStats.returned}</p>
            <p className="text-xs font-bold text-amber-800">Returned with Remarks</p>
          </div>

        </div>
      </div>

      {/* REVIEW & APPROVAL MODAL */}
      {selectedReviewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <button
              onClick={() => setSelectedReviewItem(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5 shrink-0">
              <div className="p-3 rounded-2xl bg-[#eef7f0] text-[#2d8a4e] border border-[#cbe6d2]">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">Review Student Submission</h3>
                <p className="text-xs text-slate-500">{user.program_scope || 'BS Computer Science'} Verification</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{selectedReviewItem.title}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    {selectedReviewItem.category}
                  </span>
                </div>
                <p className="text-slate-600 font-medium">Submitted by: <strong className="text-slate-900">{selectedReviewItem.student_name}</strong></p>
                <p className="text-slate-500">{selectedReviewItem.description}</p>
                <p className="text-[11px] text-slate-400 font-medium pt-1">Attached proof: <span className="text-[#2d8a4e] font-bold">{selectedReviewItem.attached_file_name}</span></p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Return Remarks (Required if returning entry)
                </label>
                <textarea
                  value={returnRemarks}
                  onChange={(e) => setReturnRemarks(e.target.value)}
                  rows={2}
                  placeholder="Specify missing document details or correction required..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-[#2d8a4e] focus:ring-2 focus:ring-[#2d8a4e]/20 outline-none text-xs text-slate-800 transition resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleReturn(selectedReviewItem.id)}
                  className="px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold flex items-center gap-1.5 transition"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Return with Remarks</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApprove(selectedReviewItem.id)}
                  className="px-5 py-2.5 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-bold flex items-center gap-1.5 transition shadow-md"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve & Verify</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
