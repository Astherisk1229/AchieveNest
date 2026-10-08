import React from 'react'
import { ArrowRight } from 'lucide-react'
import OSADAwardAuthorityBadge from './OSADAwardAuthorityBadge'

const TONES = {
  valid: 'text-slate-700 dark:text-slate-300',
  pending: 'text-amber-800 dark:text-amber-300',
  warning: 'text-sky-800 dark:text-sky-300',
  unavailable: 'text-slate-500 dark:text-slate-400'
}

export default function AwardCatalogRow({ award, onOpen, onManage }) {
  const qualification = award.qualificationPresentation()

  return (
    <li>
      <div className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/70">
        <button
          type="button"
          onClick={() => onOpen(award.record)}
          className="group grid min-w-0 flex-1 gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-6"
          aria-label={`Open ${award.name}`}
        >
          <span className="min-w-0 space-y-1.5">
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate text-sm font-semibold text-slate-950 dark:text-white">{award.name}</span>
              <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform motion-reduce:transition-none group-hover:translate-x-0.5 motion-reduce:group-hover:translate-x-0" aria-hidden="true" />
            </span>
            <span className="block text-xs text-slate-600 dark:text-slate-300">{award.eligibilityText()}</span>
            <span className={`block text-xs ${TONES[qualification.tone] || TONES.unavailable}`}>{qualification.text}</span>
            {award.description && <span className="block max-w-3xl truncate text-xs text-slate-500 dark:text-slate-400">{award.description}</span>}
          </span>
          <OSADAwardAuthorityBadge value={award.authorityStatus} className="justify-self-start sm:justify-self-end" />
        </button>
        {onManage && <button type="button" onClick={() => onManage(award.record)} className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-emerald-800 hover:border-emerald-700 hover:bg-emerald-50 dark:border-slate-700 dark:text-emerald-300" aria-label={`Manage ${award.name} criteria`}>Manage Criteria</button>}
      </div>
    </li>
  )
}
