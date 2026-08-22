import React, { useState } from 'react'
import { X, RotateCcw, ShieldAlert, Check } from 'lucide-react'

export default function ReturnForRevisionModal({ submission, isOpen, onClose, onConfirmReturn }) {
  const [reasons, setReasons] = useState({
    missingEvidence: false,
    unreadableDocument: false,
    incorrectInformation: false,
    additionalProofRequired: false,
  })
  const [remarks, setRemarks] = useState('')

  if (!isOpen || !submission) return null

  const handleToggle = (key) => {
    setReasons(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (onConfirmReturn) {
      onConfirmReturn(submission.id, { reasons, remarks })
    }
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 transition-opacity" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#131e2e] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150 font-sans">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider">
              <RotateCcw className="w-4 h-4" />
              <span>Return Portfolio for Revision</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>Select the specific reasons for returning this portfolio to {submission.faculty_name}. The faculty member will receive these details.</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Reasons Checklist */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">
                Revision Reasons (Select all that apply)
              </label>

              {[
                { key: 'missingEvidence', label: 'Missing supporting evidence document' },
                { key: 'unreadableDocument', label: 'Unreadable or blurry document file' },
                { key: 'incorrectInformation', label: 'Incorrect category or details provided' },
                { key: 'additionalProofRequired', label: 'Additional institutional proof required' },
              ].map(item => (
                <label
                  key={item.key}
                  onClick={() => handleToggle(item.key)}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  <input
                    type="checkbox"
                    checked={reasons[item.key]}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-[#064e2b] focus:ring-[#064e2b]"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>

            {/* HR Remarks */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                HR Evaluation Remarks / Instructions for Faculty
              </label>
              <textarea
                required
                rows={3}
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                placeholder="Specify exact instructions (e.g., 'Please re-upload a clear copy of your Ph.D. diploma and official transcript...')"
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:outline-none focus:border-[#69A97C]"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-extrabold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Return Portfolio for Revision</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
