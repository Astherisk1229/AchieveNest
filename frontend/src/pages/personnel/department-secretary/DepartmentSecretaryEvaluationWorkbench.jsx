import React, { useState } from 'react'
import { ShieldCheck, AlertTriangle, CheckCircle2, FileText, ExternalLink, ArrowLeft, Send, Sparkles, Paperclip, MessageSquare } from 'lucide-react'

export default function DepartmentSecretaryEvaluationWorkbench({
  portfolio,
  onUpdateItemVerification,
  onEndorseToHR,
  onReturnToPersonnel,
  onBackToRoster,
  error
}) {
  const [activeArea, setActiveArea] = useState('A') // 'A' | 'B' | 'C'
  const [activeProofFile, setActiveProofFile] = useState(null)
  
  // Modals state
  const [showEndorseModal, setShowEndorseModal] = useState(false)
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [endorseRemarks, setEndorseRemarks] = useState('All line items and attached proof documents verified.')
  const [returnRemarks, setReturnRemarks] = useState('')
  const [modalError, setModalError] = useState('')

  if (!portfolio) return null

  const totals = portfolio.calculateAcceptedCappedTotals()
  const { verified } = totals

  const currentItems = activeArea === 'A' ? portfolio.area_a_items : activeArea === 'B' ? portfolio.area_b_items : portfolio.area_c_items

  const isEditableByDepSec = portfolio.status === 'SUBMITTED_TO_DEP_SEC' || portfolio.status === 'UNDER_DEP_SEC_REVIEW'

  const handleEndorseSubmit = (e) => {
    e.preventDefault()
    const result = onEndorseToHR('Dept. Secretary', endorseRemarks)
    if (result && result.success) {
      setShowEndorseModal(false)
    }
  }

  const handleReturnSubmit = (e) => {
    e.preventDefault()
    if (!returnRemarks.trim()) {
      setModalError('Please provide feedback explaining the requested revisions.')
      return
    }
    const result = onReturnToPersonnel('Dept. Secretary', returnRemarks)
    if (result && result.success) {
      setShowReturnModal(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Top Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToRoster}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Evaluating: {portfolio.personnel_name}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {portfolio.academic_rank} • {portfolio.department_name} ({portfolio.academic_year})
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        {isEditableByDepSec && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setReturnRemarks(''); setModalError(''); setShowReturnModal(true) }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
            >
              Request Revision
            </button>
            <button
              onClick={() => { setModalError(''); setShowEndorseModal(true) }}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow transition-all"
            >
              <ShieldCheck className="w-4 h-4" /> Endorse to HR
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 text-xs">
          {error}
        </div>
      )}

      {/* Split Workbench Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Verification Controls & Item Evaluation */}
        <div className="lg:col-span-7 space-y-6">
          {/* Capped Score Cards */}
          <div className="grid grid-cols-4 gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <div className="text-[10px] font-bold text-emerald-600 uppercase">Accepted Total</div>
              <div className="text-xl font-extrabold text-slate-900 dark:text-white">{verified.acceptedTotal}</div>
              <div className="text-[10px] text-slate-400">/ 160 Max</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
              <div className="text-[10px] font-semibold text-slate-500">Area A</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">{verified.acceptedA} <span className="text-[10px] font-normal text-slate-400">/ 70</span></div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
              <div className="text-[10px] font-semibold text-slate-500">Area B</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">{verified.acceptedB} <span className="text-[10px] font-normal text-slate-400">/ 50</span></div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
              <div className="text-[10px] font-semibold text-slate-500">Area C</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">{verified.acceptedC} <span className="text-[10px] font-normal text-slate-400">/ 40</span></div>
            </div>
          </div>

          {/* Section Navigation Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-t-2xl px-4 pt-3 gap-2">
            <button
              onClick={() => setActiveArea('A')}
              className={`px-4 py-2.5 text-xs font-extrabold border-b-2 transition-all ${
                activeArea === 'A'
                  ? 'border-[#2d8a4e] text-[#1b4332] dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Area A: Prof. Dev ({verified.acceptedA} pts)
            </button>
            <button
              onClick={() => setActiveArea('B')}
              className={`px-4 py-2.5 text-xs font-extrabold border-b-2 transition-all ${
                activeArea === 'B'
                  ? 'border-[#2d8a4e] text-[#1b4332] dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Area B: Productivity ({verified.acceptedB} pts)
            </button>
            <button
              onClick={() => setActiveArea('C')}
              className={`px-4 py-2.5 text-xs font-extrabold border-b-2 transition-all ${
                activeArea === 'C'
                  ? 'border-[#2d8a4e] text-[#1b4332] dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Area C: Leadership ({verified.acceptedC} pts)
            </button>
          </div>

          {/* Verification Items List */}
          <div className="bg-white dark:bg-slate-900 rounded-b-2xl p-4 border border-t-0 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            {currentItems.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No items logged in this area.</div>
            ) : (
              currentItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {item.category} • {item.scope_level}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                        {item.title}
                      </h4>
                    </div>

                    <button
                      onClick={() => setActiveProofFile(item.proof_file_name)}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 hover:bg-emerald-100 transition-all shrink-0"
                    >
                      <Paperclip className="w-3.5 h-3.5" /> Inspect Proof
                    </button>
                  </div>

                  {/* Verification Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-500 font-medium">Claimed:</label>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.claimed_points} pts</span>

                      <span className="text-slate-300 dark:text-slate-700">|</span>

                      <label className="text-xs font-semibold text-slate-900 dark:text-white">Verified Points:</label>
                      <input
                        type="number"
                        min="0"
                        max="40"
                        disabled={!isEditableByDepSec}
                        value={item.verified_points}
                        onChange={(e) => onUpdateItemVerification(activeArea, item.id, e.target.value, item.is_proof_verified, item.remarks)}
                        className="w-16 px-2 py-1 text-xs font-bold rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-center"
                      />
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        disabled={!isEditableByDepSec}
                        checked={item.is_proof_verified}
                        onChange={(e) => onUpdateItemVerification(activeArea, item.id, item.verified_points, e.target.checked, item.remarks)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Proof Verified</span>
                    </label>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Interactive Document Proof Viewer */}
        <div className="lg:col-span-5 bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 flex flex-col min-h-[500px] shadow-2xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" /> Evidence Proof Viewer
            </h3>
            {activeProofFile && (
              <span className="text-xs text-slate-400 truncate max-w-[180px]">{activeProofFile}</span>
            )}
          </div>

          {activeProofFile ? (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-xl p-6 text-center">
              <FileText className="w-16 h-16 text-emerald-400 mb-3 animate-pulse" />
              <h4 className="text-sm font-bold text-white mb-1">{activeProofFile}</h4>
              <p className="text-xs text-slate-400 max-w-xs mb-4">
                Official verification document uploaded by personnel.
              </p>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); alert(`Opening preview for ${activeProofFile}`) }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open Full Document
              </a>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <Paperclip className="w-12 h-12 mb-2 stroke-1" />
              <p className="text-xs">Click "Inspect Proof" on any accomplishment entry to render attached evidence document.</p>
            </div>
          )}
        </div>
      </div>

      {/* Endorse Modal */}
      {showEndorseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Endorse Portfolio to HR</h3>
            <p className="text-xs text-slate-500 mb-4">
              Confirm that all line items, proof documents, and area ceiling caps have been verified for {portfolio.personnel_name}.
            </p>

            <form onSubmit={handleEndorseSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Evaluator Endorsement Remarks</label>
                <textarea
                  rows="3"
                  value={endorseRemarks}
                  onChange={(e) => setEndorseRemarks(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEndorseModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow"
                >
                  Confirm Endorsement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Request Revision from Personnel</h3>
            <p className="text-xs text-slate-500 mb-4">
              Provide mandatory feedback explaining required corrections or missing proof files.
            </p>

            {modalError && (
              <div className="mb-3 p-2.5 rounded bg-rose-50 text-rose-600 text-xs font-medium">{modalError}</div>
            )}

            <form onSubmit={handleReturnSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Required Revisions / Feedback *</label>
                <textarea
                  rows="3"
                  placeholder="e.g. Please re-upload legible diploma copy for Ph.D. claim in Area A."
                  value={returnRemarks}
                  onChange={(e) => setReturnRemarks(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow"
                >
                  Return to Personnel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
