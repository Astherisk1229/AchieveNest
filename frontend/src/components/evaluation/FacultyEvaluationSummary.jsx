import React, { useEffect, useState } from 'react'
import { Download, Printer, X } from 'lucide-react'
import { FACULTY_SUMMARY_ROWS } from '../../services/facultyEvaluationSummary'

const amount = value => Number(value || 0).toFixed(2)
const text = value => value || '________________________'
const graduateCodes = {
  'A.1.a': ['A.1.1', 'A1_PHD_HOLDER'],
  'A.1.b': ['A.1.2', 'A1_PHD_UNITS'],
  'A.1.c': ['A.1.3', 'A1_MA_HOLDER'],
  'A.1.d': ['A.1.4', 'A1_MA_UNITS'],
}
const areas = [
  ['A', 'A. Professional Development'],
  ['B', 'B. Productivity and Creative Work'],
  ['C', 'C. Service and Leadership'],
]
const officialLabels = {
  'A.1.b': 'b. Ph.D. units (2 pts for every 3 units earned)',
  'A.1.d': 'd. MA units (1 pt for every 3 units earned)',
  'B.2': '2. Publication (Scholarly Paper / Article / Research)',
  'B.6': '6. Creative Work (Painting, Music, etc.)',
  'C.3': '3. No. of Years at NDMU (1 pt for every 2 years)',
}

const itemCode = item => String(item.criterion_snapshot?.criterion_reference || item.criterion_key || item.criterion_code || '').toUpperCase()
const categoryCode = item => String(item.criterion_code || item.criterion_snapshot?.category?.category_code || '').toUpperCase()
const matches = (row, item) => {
  const codes = graduateCodes[row.code]
  if (codes) return codes.includes(itemCode(item))
  if (row.code.startsWith('C.1.') || row.code.startsWith('C.2.')) return itemCode(item) === row.code || categoryCode(item) === row.code
  return categoryCode(item) === row.code || itemCode(item) === row.code
}
const snapshotWeight = (snapshot, row) => {
  const area = (snapshot?.areas || []).find(entry => String(entry.area_code).toUpperCase() === row.area)
  const parentCode = row.code.startsWith('A.1.') ? 'A.1' : row.code.startsWith('C.1.') ? 'C.1' : row.code.startsWith('C.2.') ? 'C.2' : row.code
  const category = (area?.categories || []).find(entry => String(entry.category_code).toUpperCase() === parentCode)
  if (row.code.startsWith('A.1.') || row.code.startsWith('C.1.') || row.code.startsWith('C.2.')) {
    const leafCode = graduateCodes[row.code]?.[0] || row.code
    const leaf = (category?.subcategories || []).find(entry => String(entry.subcategory_code).toUpperCase() === leafCode)
    return leaf?.default_points ?? row.weight
  }
  return category?.max_points ?? row.weight
}
const areaWeight = (snapshot, code) => (snapshot?.areas || []).find(entry => String(entry.area_code).toUpperCase() === code)?.max_points ?? { A: 70, B: 50, C: 40 }[code]
const aggregatePoints = (summary, row) => {
  if (!['A.1.b', 'A.1.d'].includes(row.code)) return null
  const code = graduateCodes[row.code][0]
  const total = (summary?.sections || []).flatMap(section => section.items || [])
    .find(item => item.aggregate && String(item.criterion_code || '').toUpperCase() === code)
  return total?.points_earned ?? total?.points ?? null
}

export default function FacultyEvaluationSummary({ report, context = {}, onClose, onSaveComments, onDownloadPdf }) {
  const printSummary = () => {
    const originalTitle = document.title
    const restoreTitle = () => { document.title = originalTitle }
    window.addEventListener('afterprint', restoreTitle, { once: true })
    document.title = ' '
    try { window.print() } catch (error) {
      window.removeEventListener('afterprint', restoreTitle)
      restoreTitle()
      throw error
    }
  }
  const summary = report.official_summary || {}
  const snapshot = report.criteria_snapshot || {}
  const items = report.items || []
  const rows = FACULTY_SUMMARY_ROWS.map(row => {
    const contributing = items.filter(item => matches(row, item))
    const names = contributing.map(item => {
      const title = item.achievement || item.item_description
      return item.rejection_reason ? `${title} (rejected: ${item.rejection_reason})` : title
    }).filter(Boolean)
    const awarded = aggregatePoints(summary, row) ?? contributing.reduce((sum, item) => sum + Number(item.awarded_points || 0), 0)
    return { ...row, names, awarded, weight: snapshotWeight(snapshot, row) }
  })
  const personnel = summary.personnel_information || {}
  const specificJob = context?.specific_job || personnel.position || report.assignment?.position || ''
  const isDean = /\bdean\b/i.test(String(specificJob))
  const department = isDean
    ? personnel.college || report.assignment?.college || personnel.department || report.assignment?.department
    : personnel.department || report.assignment?.department || personnel.college || report.assignment?.college
  const passing = summary.passing_score ?? snapshot?.version?.passing_score ?? snapshot?.sheet?.passing_score
  const maximum = snapshot?.version?.total_max_points ?? snapshot?.sheet?.overall_max_points ?? 160
  const sectionTotals = report.section_totals || {}
  const decisionLabel = (value, status, fallback) => value ? `${value}${status === 'suggested' ? ' (suggested, awaiting confirmation)' : ''}` : fallback
  const itemComments = [...new Set(items.map(item => String(item.evaluator_remarks || '').trim()).filter(Boolean))]
  const comments = context?.comments !== undefined ? context.comments : summary.comments || itemComments.join('; ')
  const finishedAt = context?.effectivity || report.completed_at || report.generated_at || report.result_snapshot?.generated_at || summary.effectivity
  const effectivity = finishedAt ? String(finishedAt).slice(0, 10) : 'Evaluation completion date unavailable'
  const [draftComments, setDraftComments] = useState(comments || '')
  const [savingComments, setSavingComments] = useState(false)
  const [commentsError, setCommentsError] = useState('')
  const [editingComments, setEditingComments] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [pdfError, setPdfError] = useState('')
  useEffect(() => { setDraftComments(comments || ''); setCommentsError('') }, [comments])
  const saveComments = async () => {
    if (!onSaveComments || savingComments) return
    setSavingComments(true)
    setCommentsError('')
    try { await onSaveComments(draftComments.trim()); setEditingComments(false) }
    catch (error) { setCommentsError(error?.response?.data?.error?.message || error?.message || 'Comments could not be saved.') }
    finally { setSavingComments(false) }
  }
  const savePdf = async () => {
    if (!onDownloadPdf || downloadingPdf) return
    setDownloadingPdf(true)
    setPdfError('')
    try {
      const blob = await onDownloadPdf()
      if (!(blob instanceof Blob) || !blob.type.includes('pdf')) throw new Error('The PDF response was invalid.')
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Faculty-Evaluation-Summary-v${Number(report.portfolio_version) || 1}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch { setPdfError('The PDF could not be saved. Please try again.') }
    finally { setDownloadingPdf(false) }
  }

  return <div className="mx-auto max-w-[210mm] print:max-w-none">
    <div className="mb-3 flex flex-wrap items-center justify-end gap-2 font-sans print:hidden">
      {context?.comments_editable && onSaveComments && <button type="button" onClick={() => setEditingComments(value => !value)} aria-expanded={editingComments} aria-controls="faculty-summary-comments-editor" className="rounded border border-emerald-700 px-3 py-2 font-semibold text-emerald-900 hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">{editingComments ? 'Close editor' : 'Edit comments'}</button>}
      {onClose && <button type="button" onClick={onClose} className="rounded border px-3 py-2"><X className="mr-1 inline h-4 w-4" />Close</button>}
      <button type="button" onClick={printSummary} className="rounded border border-slate-300 bg-white px-3 py-2 font-bold text-slate-800"><Printer className="mr-1 inline h-4 w-4" />Print</button>
      {onDownloadPdf && <button type="button" onClick={savePdf} disabled={downloadingPdf} className="rounded bg-emerald-800 px-3 py-2 font-bold text-white disabled:opacity-50"><Download className="mr-1 inline h-4 w-4" />{downloadingPdf ? 'Preparing PDF…' : 'Save PDF'}</button>}
    </div>
    {pdfError && <p role="alert" className="mb-3 text-right font-sans text-sm text-rose-700 print:hidden">{pdfError}</p>}
    {editingComments && context?.comments_editable && onSaveComments && <div id="faculty-summary-comments-editor" className="mb-4 space-y-3 rounded-lg border border-slate-300 bg-white p-4 font-sans shadow-sm print:hidden">
      <label htmlFor="faculty-summary-comments" className="block text-sm font-bold text-slate-900">Evaluation summary comments</label>
      <textarea id="faculty-summary-comments" value={draftComments} onChange={event => setDraftComments(event.target.value)} rows={3} maxLength={2000} className="w-full rounded border border-slate-300 p-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700" />
      <div className="flex flex-wrap items-center justify-between gap-3"><span role="alert" className="text-sm text-rose-700">{commentsError}</span><button type="button" disabled={savingComments || draftComments.trim() === (comments || '').trim()} onClick={saveComments} className="rounded bg-emerald-800 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">{savingComments ? 'Saving…' : 'Save comments'}</button></div>
    </div>}
    <section data-evaluation-summary className="bg-white p-5 font-serif text-[11px] leading-tight text-slate-950 shadow-sm print:p-0 print:shadow-none" aria-label="Administrators Ranking Scale evaluation summary">
    <style>{`@media print { body * { visibility: hidden !important; } [data-evaluation-summary], [data-evaluation-summary] * { visibility: visible !important; } [data-evaluation-summary] { position: absolute; inset: 0; width: 100%; } @page { size: A4; margin: 12mm; } }`}</style>
    <header className="mb-2 text-center"><p className="text-base font-bold uppercase tracking-wide">Notre Dame of Marbel University</p><p className="italic">City of Koronadal, South Cotabato</p><h2 className="mt-3 text-base font-bold uppercase tracking-wide">Administrators Ranking Scale</h2></header>
    <div className="grid grid-cols-2 border border-black px-2 py-1 font-bold"><span>Name: {text(personnel.name || report.personnel?.full_name)}</span><span>Department: {text(department)}</span></div>
    <dl className="mb-2 grid grid-cols-2 gap-x-3 px-1 py-1 font-semibold"><div>Specific Job: {specificJob || 'Job title not recorded'}</div><div>Employee’s Progress Last Ranking: {context?.previous_rank || 'No prior rank recorded'}</div><div>Present Rank: {context?.present_rank || summary.present_rank || 'Present rank not recorded'}</div><div>Period Covered: {summary.period_covered || report.evaluation_period?.name || report.evaluation_period?.academic_year || 'Period not recorded'}</div><div>Rank Applied for: {decisionLabel(context?.rank_applied_for || summary.rank_applied_for, context?.rank_applied_for_status, 'Not recorded in Annual Review')}</div></dl>
    <div className="overflow-x-auto"><table className="w-full min-w-[620px] border-collapse border border-black text-left"><colgroup><col className="w-[49%]"/><col className="w-[11%]"/><col className="w-[30%]"/><col className="w-[10%]"/></colgroup><thead><tr className="border border-black"><th className="border border-black px-2 py-1 text-center">Criteria</th><th className="border border-black px-2 py-1 text-center">Weight<br/>(pts)</th><th className="border border-black px-2 py-1 text-center">Documents Submitted</th><th className="border border-black px-2 py-1 text-center">Points<br/>Earned</th></tr></thead><tbody>{areas.map(([area, title]) => {
      let lastParent = ''
      return <React.Fragment key={area}><tr className="break-after-avoid border border-black"><th colSpan="4" className="border border-black px-2 py-1 text-sm">{title}</th></tr>{rows.filter(row => row.area === area).map(row => {
        const parent = row.parent && row.parent !== lastParent ? row.parent : ''
        if (row.parent) lastParent = row.parent
        return <React.Fragment key={row.code}>{parent && <tr className="break-after-avoid"><th className="border border-black px-2 py-1" colSpan="4">{parent}</th></tr>}<tr className="break-inside-avoid"><td className="border border-black px-2 py-1">{officialLabels[row.code] || row.criterion}</td><td className="border border-black px-2 py-1 text-center tabular-nums">{amount(row.weight)}</td><td className="border border-black px-2 py-1">{row.names.length ? row.names.join('; ') : '—'}</td><td className="border border-black px-2 py-1 text-right tabular-nums">{row.names.length || row.awarded ? amount(row.awarded) : '—'}</td></tr></React.Fragment>
      })}<tr className="break-inside-avoid font-bold italic"><td className="border border-black px-2 py-1 text-right">Maximum Points</td><td className="border border-black px-2 py-1 text-center tabular-nums">{amount(areaWeight(snapshot, area))}</td><td className="border border-black px-2 py-1"/><td className="border border-black px-2 py-1 text-right tabular-nums not-italic">{amount(sectionTotals[area])}</td></tr></React.Fragment>
    })}<tr className="break-inside-avoid font-bold"><td className="border border-black px-2 py-1 text-right">TOTAL</td><td className="border border-black px-2 py-1 text-center tabular-nums">{amount(maximum)}</td><td className="border border-black px-2 py-1"/><td className="border border-black px-2 py-1 text-right tabular-nums">{amount(report.grand_total)}</td></tr></tbody></table></div>
    <p className="mt-1 font-bold italic">Passing Score: {passing == null ? '—' : `${amount(passing)} POINTS`}</p>
    <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2 font-semibold"><p>Recommended Rank: {context?.recommended_rank || 'Recommendation unavailable'}</p><p>Effectivity: {effectivity}</p><p className="col-span-2 whitespace-pre-wrap break-words">Comments: {comments || '—'}</p></div>
    <div className="mt-5 border-t border-black pt-1 font-semibold">Recommended for Approval:</div>
    <div className="mt-5 grid grid-cols-2 gap-x-10 gap-y-5 font-semibold"><p>Chair: __________________________</p><p>Members: ________________________<br/>　　　　________________________<br/>　　　　________________________</p><p>Approved: ______________________<br/>　　　　　President</p><p>Date: __________________________</p></div>
    <p className="mt-4 text-[9px] text-slate-600 print:hidden">Evaluation version {report.portfolio_version} · {String(report.status || '').replaceAll('_', ' ')} · Scores and criteria from the saved evaluation report.</p>
    </section>
  </div>
}
