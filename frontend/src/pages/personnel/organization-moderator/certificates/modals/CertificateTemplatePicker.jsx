/**
 * CertificateTemplatePicker.jsx
 * Step 3 of Certificate Issuance Modal.
 * Pick from active OSAD-published Event certificate templates.
 */

import React from 'react'
import { Sparkles, Check, ShieldCheck, Lock } from 'lucide-react'

export default function CertificateTemplatePicker({ templates = [], selectedTemplateId, setSelectedTemplateId }) {
  return (
    <div className="space-y-4 font-sans">
      <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-300 flex items-center gap-2">
        <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
        <span>
          <strong>OSAD Governance Active:</strong> Organization Moderators may select active OSAD-published templates. Template design, seals, and layout cannot be altered during issuance.
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {templates.map(tpl => {
          const isSelected = selectedTemplateId === tpl.id
          return (
            <div
              key={tpl.id}
              onClick={() => setSelectedTemplateId(tpl.id)}
              className={`p-4 rounded-2xl border transition cursor-pointer relative flex flex-col justify-between space-y-3 ${
                isSelected
                  ? 'bg-emerald-50/70 border-emerald-500 dark:bg-emerald-950/60 dark:border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                  : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Check className="w-4 h-4" />
                </div>
              )}

              <div className="space-y-1.5 pr-6">
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-[#245F42] text-[10px] font-black uppercase tracking-wider">
                  {tpl.code} • {tpl.version}
                </span>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white pt-1">
                  {tpl.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {tpl.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold text-slate-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  OSAD Accredited
                </span>
                <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">
                  {tpl.signatorySlots.length} Signatories
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
