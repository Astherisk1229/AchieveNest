import React, { useState } from 'react'
import { ShieldCheck, Lock, AlertTriangle, FileText, CheckCircle2, X, Clock, ArrowRight, UserCheck } from 'lucide-react'

export default function HRScoreAuditModal({
  portfolio,
  onApproveAndLock,
  onReturnToDepSec,
  onOverrideItemScore,
  onClose,
  error
}) {
  const [hrOfficerName, setHrOfficerName] = useState('Dr. HR Director')
  const [hrRemarks, setHrRemarks] = useState('Audited and confirmed compliance with NDMU Ranking Guidelines.')
  const [returnRemarks, setReturnRemarks] = useState('')
  const [showReturnDialog, setShowReturnDialog] = useState(false)
  const [modalError, setModalError] = useState('')

  if (!portfolio) return null

  const totals = portfolio.calculateAcceptedCappedTotals()
  const { verified } = totals
  const isLocked = portfolio.status === 'HR_APPROVED'

  const handleConfirmLock = (e) => {
    e.preventDefault()
    const result = onApproveAndLock(hrOfficerName, hrRemarks)
    if (result && result.success) {
      onClose()
    }
  }

  const handleConfirmReturn = (e) => {
    e.preventDefault()
    if (!returnRemarks.trim()) {
      setModalError('Please provide feedback remarks for the Department Secretary.')
      return
    }
    const result = onReturnToDepSec(hrOfficerName, returnRemarks)
    if (result && result.success) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <div>
              <h3 className="text-lg font-bold">HR Ranking Score Audit & Lock</h3>
              <p className="text-xs text-slate-400">
                {portfolio.personnel_name} • {portfolio.department_name} ({portfolio.academic_year})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="m-6 mb-0 p-3 rounded-xl bg-rose-50 text-rose-600 text-xs font-medium border border-rose-200">
            {error}
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Dept Sec Endorsement Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
            <UserCheck className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Endorsed by Department Secretary: {portfolio.dep_sec_evaluator_name || 'Dept. Secretary'}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                "{portfolio.dep_sec_remarks || 'All line items and attached proof documents verified.'}"
              </p>
            </div>
          </div>

          {/* Area Ceilings Score Summary */}
          <div className="grid grid-cols-4 gap-3 bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/20">
            <div className="text-center">
              <div className="text-[10px] font-bold text-emerald-600 uppercase">Accepted Total</div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{verified.acceptedTotal}</div>
              <div className="text-[10px] text-slate-400">/ 160 Max</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] font-semibold text-slate-500">Area A (Max 70)</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">{verified.acceptedA}</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] font-semibold text-slate-500">Area B (Max 50)</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">{verified.acceptedB}</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] font-semibold text-slate-500">Area C (Max 40)</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">{verified.acceptedC}</div>
            </div>
          </div>

          {/* Itemized Audit List */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Verified Line Items</h4>

            {['A', 'B', 'C'].map((areaKey) => {
              const items = areaKey === 'A' ? portfolio.area_a_items : areaKey === 'B' ? portfolio.area_b_items : portfolio.area_c_items
              if (items.length === 0) return null

              return (
                <div key={areaKey} className="space-y-2">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Area {areaKey} Entries ({items.length})
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    {items.map((item) => (
                      <div key={item.id} className="p-3 bg-white dark:bg-slate-900 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">{item.title}</div>
                          <div className="text-[11px] text-slate-400">{item.category} • Proof: {item.proof_file_name}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-900 dark:text-white">
                            Verified: {item.verified_points} pts
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Audit Trail Timeline */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Lifecycle Audit Trail</h4>
            <div className="space-y-2 text-xs">
              {portfolio.audit_trail.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-slate-600 dark:text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">{log.actor_name}</span> ({log.actor_role}) — <span className="font-medium text-emerald-600">{log.action}</span>
                    <div className="text-[11px] text-slate-400">{new Date(log.timestamp).toLocaleString()} • {log.remarks}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowReturnDialog(!showReturnDialog)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800"
          >
            Return to Dept. Sec
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            {!isLocked && (
              <button
                type="button"
                onClick={handleConfirmLock}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow"
              >
                <Lock className="w-4 h-4" /> Approve & Lock Score
              </button>
            )}
          </div>
        </div>

        {/* Return Dialog Extension */}
        {showReturnDialog && (
          <div className="p-6 bg-rose-50/50 dark:bg-rose-950/30 border-t border-rose-200 dark:border-rose-900/50">
            <h4 className="text-xs font-bold text-rose-900 dark:text-rose-300 mb-2">Return to Department Secretary for Re-Evaluation</h4>
            {modalError && <div className="text-xs text-rose-600 mb-2">{modalError}</div>}
            <textarea
              rows="2"
              placeholder="Provide mandatory HR remarks explaining evaluation corrections needed..."
              value={returnRemarks}
              onChange={(e) => setReturnRemarks(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white mb-3"
            />
            <button
              type="button"
              onClick={handleConfirmReturn}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow"
            >
              Confirm Return to Dept. Secretary
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
