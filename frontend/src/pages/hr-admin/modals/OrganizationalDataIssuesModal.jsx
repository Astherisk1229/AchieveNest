import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { X, AlertTriangle, AlertCircle, ExternalLink, ShieldCheck, User, Building2, Briefcase } from 'lucide-react'

export default function OrganizationalDataIssuesModal({ isOpen, onClose, issues = [], onSelectPerson }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Organizational Data Issues"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-amber-50 dark:bg-amber-950/50 border-b border-amber-200 dark:border-amber-800 flex items-center justify-between text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold text-xs shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-amber-950 dark:text-amber-100">
                Organizational Data Issues ({issues.length})
              </h2>
              <p className="text-xs text-amber-800 dark:text-amber-300/90 font-medium">
                Personnel records requiring College or Department assignment review
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full bg-white/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-white flex items-center justify-center transition cursor-pointer shadow-xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Issue List */}
        <div className="p-6 space-y-3 overflow-y-auto flex-1">
          {issues.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <ShieldCheck className="w-10 h-10 text-emerald-600 mx-auto" />
              <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200">No organizational data issues detected.</p>
              <p className="text-xs text-slate-500">All active personnel have valid classifications and unit affiliations.</p>
            </div>
          ) : (
            issues.map((person) => {
              let issueReason = 'Unassigned organizational placement'
              if (!person.classification_valid) issueReason = 'Unresolved classification'
              else if (!person.college_id && !person.department_id) issueReason = 'Missing College or Department assignment'
              else if (person.organizational_side === 'academic' && !person.college_id) issueReason = 'Academic faculty without College affiliation'
              else if (person.college_id && person.department_id) issueReason = 'Dual College and Department placement'

              return (
                <div
                  key={person.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{person.full_name}</h4>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {person.institutional_id || 'ID N/A'}
                      </span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                        {issueReason}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {person.position_title || 'Position not recorded'} • {person.email}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {onSelectPerson && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose()
                          onSelectPerson(person)
                        }}
                        className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
                      >
                        Inspect
                      </button>
                    )}

                    <Link
                      to={`/hr/personnel-directory?search=${encodeURIComponent(person.institutional_id || person.full_name)}`}
                      onClick={onClose}
                      className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-xs"
                    >
                      <span>Review in Directory</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-300 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
