import React, { useEffect, useRef, useState } from 'react'
import { AlertCircle, Download, FileSpreadsheet, LoaderCircle, X } from 'lucide-react'
import { downloadAnnualReviewImport, fetchAnnualReviewImportFile } from '../../services/deanAnnualReviewService'
import { readXlsxWorkbook } from '../../utils/xlsxPreview'

const title = value => value ? String(value).replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase()) : 'Missing'
const passStyle = status => status === 'passed'
  ? 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200'
  : status === 'not_passed'
    ? 'bg-rose-50 text-rose-800 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-200'
    : 'bg-amber-50 text-amber-900 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-100'

/** Turns an API failure (possibly a JSON error delivered as a Blob) into a readable message. */
export async function annualReviewFileError(error) {
  let payload = error
  if (typeof Blob !== 'undefined' && error instanceof Blob) {
    try { payload = JSON.parse(await error.text()) } catch { payload = {} }
  }
  const apiError = payload?.error || {}
  if (apiError.code === 'NOT_FOUND') {
    return { missingFile: true, message: 'The original workbook file is not stored on the server, so it cannot be shown. The confirmed ratings above are the official record.' }
  }
  if (String(apiError.code || '').startsWith('FORBIDDEN')) return { missingFile: false, message: 'This annual review is outside your authorized scope.' }
  return { missingFile: false, message: String(apiError.message || payload?.message || 'The annual-review workbook could not be loaded.').replace(/^[A-Z_]+:\s*/, '') }
}

function SheetTable({ sheet }) {
  if (!sheet.rows.length) return <p className="py-10 text-center text-sm text-slate-500">This worksheet is empty.</p>
  const covered = new Set()
  const spans = new Map()
  for (const merge of sheet.merges) {
    spans.set(`${merge.row}:${merge.col}`, merge)
    for (let r = merge.row; r < merge.row + merge.rowSpan; r += 1) {
      for (let c = merge.col; c < merge.col + merge.colSpan; c += 1) if (r !== merge.row || c !== merge.col) covered.add(`${r}:${c}`)
    }
  }
  return <table className="border-collapse text-xs text-slate-800 dark:text-slate-200">
    <tbody>{sheet.rows.map((cells, row) => <tr key={row}>{cells.map((value, col) => {
      const key = `${row}:${col}`
      if (covered.has(key)) return null
      const span = spans.get(key)
      return <td key={col} rowSpan={span?.rowSpan} colSpan={span?.colSpan} className={`min-w-[3.5rem] max-w-[22rem] border border-slate-200 px-2 py-1 align-top whitespace-pre-wrap break-words dark:border-slate-800 ${span ? 'text-center font-semibold' : ''}`}>{value}</td>
    })}</tr>)}</tbody>
  </table>
}

/**
 * In-app viewer for a confirmed annual-review workbook: the confirmed ratings first,
 * then the uploaded workbook rendered sheet by sheet, with a download option.
 */
export default function AnnualReviewViewerDialog({ person, review, onClose, returnFocusRef }) {
  const dialogRef = useRef(null)
  const [state, setState] = useState({ loading: true, sheets: [], error: '', missingFile: false })
  const [activeSheet, setActiveSheet] = useState(0)
  const [downloading, setDownloading] = useState(false)
  const filename = review.filename || `Annual_Review_${person.institutional_id || 'personnel'}.xlsx`

  useEffect(() => {
    let active = true
    fetchAnnualReviewImportFile(review.import_id)
      .then(blob => blob.arrayBuffer())
      .then(buffer => readXlsxWorkbook(buffer))
      .then(sheets => { if (active) setState({ loading: false, sheets, error: sheets.length ? '' : 'The workbook has no visible worksheets.', missingFile: false }) })
      .catch(async error => {
        const failure = error instanceof Error && !error.response && !(error?.error) ? { missingFile: false, message: error.message } : await annualReviewFileError(error)
        if (active) setState({ loading: false, sheets: [], error: failure.message, missingFile: failure.missingFile })
      })
    return () => { active = false }
  }, [review.import_id])

  useEffect(() => {
    const returnTarget = returnFocusRef?.current
    dialogRef.current?.focus()
    const onKey = event => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); returnTarget?.focus?.() }
  }, [onClose, returnFocusRef])

  const download = async () => {
    setDownloading(true)
    try { await downloadAnnualReviewImport(review.import_id, filename) }
    catch (error) { const failure = await annualReviewFileError(error); setState(current => ({ ...current, error: failure.message, missingFile: failure.missingFile })) }
    finally { setDownloading(false) }
  }

  const sheet = state.sheets[activeSheet]
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-3 sm:p-6" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="annual-review-viewer-title" tabIndex={-1} className="flex max-h-full w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl outline-none dark:bg-slate-950">
      <header className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 dark:border-slate-800">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Annual review</p>
          <h2 id="annual-review-viewer-title" className="mt-1 text-xl font-black text-slate-950 dark:text-white">{person.full_name}</h2>
          <p className="mt-1 truncate text-sm text-slate-500">{person.institutional_id}{review.filename ? ` · ${review.filename}` : ''}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-emerald-600 dark:hover:bg-slate-900" aria-label="Close annual review"><X className="h-5 w-5" /></button>
      </header>

      <div className="grid gap-3 border-b border-slate-200 p-5 sm:grid-cols-3 dark:border-slate-800">
        {[[review.review_1_school_year, review.review_1_rating], [review.review_2_school_year, review.review_2_rating]].map(([year, rating], index) => <div key={index} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
          <p className="text-xs font-bold text-slate-500">{year || (index ? 'Second review' : 'First review')}</p>
          <p className="mt-1 font-black text-slate-950 dark:text-white">{title(rating)}</p>
        </div>)}
        <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
          <p className="text-xs font-bold text-slate-500">2-year requirement</p>
          <span className={`mt-1.5 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${passStyle(review.status)}`}>{title(review.status || 'pending')}</span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {state.loading ? <div aria-busy="true" className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" />Loading workbook…</div>
          : state.error ? <div role="alert" className="m-5 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><p>{state.error}</p></div>
          : <>
            {state.sheets.length > 1 && <div role="tablist" aria-label="Worksheets" className="flex gap-1 overflow-x-auto border-b border-slate-200 px-5 pt-3 dark:border-slate-800">{state.sheets.map((item, index) => <button key={item.name} type="button" role="tab" aria-selected={index === activeSheet} onClick={() => setActiveSheet(index)} className={`whitespace-nowrap rounded-t-lg border-b-2 px-3 py-2 text-xs font-bold ${index === activeSheet ? 'border-emerald-700 text-emerald-800 dark:text-emerald-300' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>{item.name}</button>)}</div>}
            <div className="min-h-[12rem] flex-1 overflow-auto p-5">{sheet && <SheetTable sheet={sheet} />}{sheet?.truncated && <p className="mt-3 text-xs text-slate-500">Only the first 300 rows are shown. Download the workbook to see everything.</p>}</div>
          </>}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-4 dark:border-slate-800">
        <p className="inline-flex items-center gap-2 text-xs text-slate-500"><FileSpreadsheet className="h-4 w-4" />Preview shows cell values; formatting is simplified.</p>
        <div className="flex gap-2">
          <button type="button" onClick={download} disabled={downloading || state.missingFile} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900">{downloading ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}Download workbook</button>
          <button type="button" onClick={onClose} className="rounded-lg bg-emerald-800 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-900 focus-visible:ring-2 focus-visible:ring-emerald-600">Close</button>
        </div>
      </footer>
    </section>
  </div>
}
