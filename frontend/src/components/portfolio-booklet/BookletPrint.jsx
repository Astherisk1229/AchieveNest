import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { LoaderCircle } from 'lucide-react'

const PRINT_TIMEOUT_MS = 25000

/**
 * Print / Save-as-PDF for a booklet. The print copy is mounted only while printing, with every
 * attached document drawn as images; the browser dialog opens once all of them have loaded
 * (or after a safety timeout), so the PDF matches the on-screen booklet exactly — no links.
 */
export function useBookletPrint(proofCount) {
  const [state, setState] = useState({ printing: false, settled: 0 })
  const timeoutRef = useRef(null)

  const startPrint = useCallback(() => setState({ printing: true, settled: 0 }), [])
  const onEvidenceSettled = useCallback(() => setState((current) => ({ ...current, settled: current.settled + 1 })), [])

  useEffect(() => {
    if (!state.printing) return undefined
    const finish = () => {
      clearTimeout(timeoutRef.current)
      // Let the last images paint before the dialog snapshots the page.
      setTimeout(() => {
        window.print()
        setState({ printing: false, settled: 0 })
      }, 250)
    }
    if (state.settled >= proofCount) { finish(); return undefined }
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(finish, PRINT_TIMEOUT_MS)
    return () => clearTimeout(timeoutRef.current)
  }, [state, proofCount])

  return { printing: state.printing, prepared: Math.min(state.settled, proofCount), startPrint, onEvidenceSettled }
}

export function BookletPrintPortal({ printing, prepared, total, pages, renderPage, label = 'Portfolio booklet', formatId = 'non_teaching' }) {
  if (!printing || typeof document === 'undefined') return null
  return createPortal(
    <>
      <div className="booklet-print-progress fixed inset-0 z-[11000] grid place-items-center bg-slate-950/60 print:hidden" role="status" aria-live="polite">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 text-sm font-bold text-slate-800 shadow-2xl">
          <LoaderCircle className="h-5 w-5 animate-spin text-emerald-700" aria-hidden="true" />
          Preparing PDF… {total > 0 ? `${prepared} of ${total} documents` : ''}
        </div>
      </div>
      <div className="booklet-print-root hidden print:block" data-format={formatId} aria-label={label}>
        {pages.map((page) => <div key={`print-${page.key}`} className="booklet-print-page" data-page-type={page.type}>{renderPage(page)}</div>)}
        <style>{`@media print {
  body > *:not(.booklet-print-root) { display: none !important; }
  html, body { background: #fff !important; }
  .booklet-print-root { display: block !important; }
  .booklet-print-root, .booklet-print-root * { visibility: visible !important; }
  .booklet-print-root a { color: inherit !important; text-decoration: none !important; }
  .booklet-print-root a[href]::after { content: none !important; }
  .booklet-print-root[data-format="non_teaching"] .booklet-print-page { break-after: page; }
  .booklet-print-root[data-format="non_teaching"] .booklet-page { width: 210mm !important; min-height: 297mm !important; }
  .booklet-print-page[data-page-type="proof"] { break-before: page; }
  .booklet-print-page[data-page-type="proof"] .booklet-page { width: 100% !important; min-height: 11in !important; margin: 0 !important; padding: 0 !important; break-inside: avoid; }
  .booklet-page { box-shadow: none !important; }
  .booklet-page img { break-inside: avoid; max-height: 200mm; width: auto; }
  .faculty-document { width: 7.5in !important; min-height: 0 !important; margin: 0 !important; padding: 0 !important; font-family: "Century Schoolbook", "Bookman Old Style", serif !important; }
  .faculty-area-section, .faculty-criterion-table { margin: 0 !important; }
  .faculty-grid { width: 100% !important; border-collapse: collapse !important; }
  .faculty-grid thead { display: table-header-group; }
  .faculty-grid tr { break-inside: avoid; }
  .faculty-area-row { background: #fff !important; color: #000 !important; font-size: 14pt !important; }
  .faculty-criterion-row { background: #0F243E !important; color: #fff !important; font-size: 12pt !important; }
  .faculty-subcriterion-row { background: #fff !important; color: #000 !important; font-size: 12pt !important; }
  .faculty-column-header th { background: #DAEEF3 !important; color: #000 !important; }
  .faculty-record-row td, .faculty-grid th { border: 1px solid #000 !important; }
  .faculty-print-footer { position: fixed; right: 0; bottom: -0.5in; left: 0; justify-content: flex-end; border-top: 1px solid #000; padding-top: 3pt; font-family: "Century Schoolbook", "Bookman Old Style", serif; font-size: 9pt; }
  .faculty-page-number::before { content: counter(page); }
  .faculty-document, .faculty-document * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  @page { size: ${formatId === 'faculty_academic' ? '8.5in 13in' : 'A4'}; margin: ${formatId === 'faculty_academic' ? '0.6in 0.5in 0.75in' : '0'}; }
}`}</style>
      </div>
    </>,
    document.body
  )
}
