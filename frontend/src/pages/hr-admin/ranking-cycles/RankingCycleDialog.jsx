import React, { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'

/** Shared accessible dialog shell for the Ranking Periods module. */
export default function RankingCycleDialog({ title, description, onClose, children, footer, width = 'max-w-3xl', layer = 'z-50', labelledBy }) {
  const panelRef = useRef(null)
  const autoId = useId()
  const titleId = labelledBy || autoId
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    const previous = document.activeElement
    const first = panelRef.current?.querySelector('[data-autofocus], input, select, button, [href], textarea, [tabindex]:not([tabindex="-1"])')
    first?.focus?.()
    const onKey = event => {
      if (event.key !== 'Escape') return
      const dialogs = document.querySelectorAll('[role="dialog"][aria-modal="true"]')
      if (dialogs[dialogs.length - 1] === panelRef.current) closeRef.current?.()
    }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); previous?.focus?.() }
  }, [])

  return <div className={`fixed inset-0 ${layer} grid place-items-center bg-slate-950/60 p-3 sm:p-6`} onMouseDown={event => { if (event.target === event.currentTarget) onClose?.() }}>
    <section ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId} className={`flex max-h-[94vh] w-full ${width} flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-800`}>
      <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6 dark:border-slate-800">
        <div className="min-w-0">
          <h2 id={titleId} className="text-lg font-black tracking-[-0.01em] text-slate-950 dark:text-white">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{description}</p>}
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:hover:bg-slate-800 dark:hover:text-white"><X className="h-5 w-5"/></button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      {footer && <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 px-5 py-3.5 sm:px-6 dark:border-slate-800">{footer}</footer>}
    </section>
  </div>
}

export const buttonStyles = {
  primary: 'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 text-sm font-bold text-white transition-colors hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 dark:disabled:bg-slate-800 dark:disabled:text-slate-400',
  secondary: 'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900',
  danger: 'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-rose-700 px-4 text-sm font-bold text-white transition-colors hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600',
  link: 'inline-flex items-center gap-1 rounded text-sm font-bold text-emerald-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-emerald-300',
}

export const inputClass = 'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:border-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/30 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100'

export function LockedBadge() {
  return <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900">Locked</span>
}

export const errorMessage = (failure, fallback) => failure?.error?.message || failure?.message || fallback
