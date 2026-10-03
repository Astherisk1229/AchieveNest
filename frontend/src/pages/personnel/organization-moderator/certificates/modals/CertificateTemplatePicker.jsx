import React from 'react'
import { AlertCircle, Check, LoaderCircle, Lock } from 'lucide-react'

export default function CertificateTemplatePicker({ recipient, onSelectTemplate, isLoading = false }) {
  const templates = recipient?.compatibleTemplates || []

  return (
    <section className="space-y-4" aria-labelledby="compatible-template-heading">
      <div>
        <h3 id="compatible-template-heading" className="text-sm font-extrabold text-slate-900 dark:text-white">Compatible published templates</h3>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Only variants returned for the backend-resolved certificate purpose are shown.</p>
      </div>
      <div className="flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-xs leading-relaxed text-blue-900 dark:bg-blue-950/50 dark:text-blue-200">
        <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        Template purpose and compatibility cannot be overridden in this workspace.
      </div>

      {templates.length === 0 ? (
        <div className="flex items-start gap-2 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200" role="status">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          A published compatible certificate template is not available.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {templates.map(template => {
            const selected = template.versionId === recipient.template?.versionId
            return (
              <button key={template.versionId} type="button" onClick={() => onSelectTemplate(template)} disabled={isLoading} aria-pressed={selected} className={`min-w-0 rounded-2xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${selected ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-950'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-extrabold text-slate-900 dark:text-white">{template.name}</p>
                    <p className="mt-1 break-words text-xs text-slate-600 dark:text-slate-300">{[template.code, template.version && `Version ${template.version}`].filter(Boolean).join(' • ') || 'Published template'}</p>
                  </div>
                  {selected && <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white"><Check className="h-4 w-4" aria-hidden="true" /></span>}
                </div>
              </button>
            )
          })}
        </div>
      )}
      {isLoading && <p className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300" role="status"><LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> Rechecking readiness for the selected template…</p>}
    </section>
  )
}
