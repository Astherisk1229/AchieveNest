import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Printer } from 'lucide-react'
import BookletPage, { buildBookletPages } from './BookletPage'
import { BookletPrintPortal, useBookletPrint } from './BookletPrint'
import { resolveBookletFormat } from './bookletFormats'
import { nonTeachingAreaARows } from '../../utils/nonTeachingBooklet'

const PAGE_WIDTH = 794

/**
 * The Portfolio Booklet embedded in a review workspace (Dean, HR). Same pages as the personnel
 * booklet and its PDF; rows can be selected to drive the reviewer's decision panel.
 */
export default function PortfolioBookletDocument({
  user = {}, portfolio = {}, format: formatOverride, selectedSourceId, onSelectRow, onOpenProof, renderAreaADs, toolbar = true, className = ''
}) {
  const format = formatOverride || resolveBookletFormat(user, portfolio)
  const rows = useMemo(() => format.normalize(portfolio), [format, portfolio])
  const pages = useMemo(() => buildBookletPages(format, rows), [format, rows])
  const areaARows = useMemo(() => (format.id === 'non_teaching' ? nonTeachingAreaARows(portfolio) : []), [format.id, portfolio])
  const criterionLabelByKey = useMemo(() => Object.fromEntries(format.criteria.map((criterion) => [criterion.key, criterion.label])), [format])
  const proofCount = pages.filter((page) => page.type === 'proof').length
  const print = useBookletPrint(proofCount)

  const scrollRef = useRef(null)
  const [zoom, setZoom] = useState(1)
  useEffect(() => {
    const element = scrollRef.current
    if (!element) return undefined
    const measure = () => { if (element.clientWidth) setZoom(Math.min(1.1, Math.max(0.3, (element.clientWidth - 32) / PAGE_WIDTH))) }
    measure()
    if (typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const shared = { format, rows, user, portfolio, areaARows, criterionLabelByKey }
  return (
    <div className={`flex min-h-0 flex-1 flex-col ${className}`}>
      {toolbar && (
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-950">
          <p className="truncate text-xs font-bold text-slate-700 dark:text-slate-200">{format.viewerTitle} · {rows.length} accomplishment{rows.length === 1 ? '' : 's'} · {proofCount} proof{proofCount === 1 ? '' : 's'}</p>
          <button type="button" onClick={print.startPrint} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:border-emerald-700 hover:text-emerald-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-slate-700 dark:text-slate-200"><Printer className="h-3.5 w-3.5" aria-hidden="true" />Print / Save PDF</button>
        </div>
      )}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto bg-slate-200 px-2 py-4 dark:bg-slate-900 sm:px-4">
        <div className="mx-auto w-fit space-y-5" style={{ zoom }}>
          {pages.map((page) => (
            <div key={page.key}>
              <BookletPage {...shared} page={page} interactive selectedSourceId={selectedSourceId} onSelectRow={onSelectRow} onOpenProof={onOpenProof} renderAreaADs={renderAreaADs} />
            </div>
          ))}
        </div>
      </div>
      <BookletPrintPortal printing={print.printing} prepared={print.prepared} total={proofCount} pages={pages} label={format.viewerTitle}
        renderPage={(page) => <BookletPage {...shared} page={page} eagerEvidence onEvidenceSettled={print.onEvidenceSettled} />} />
    </div>
  )
}
