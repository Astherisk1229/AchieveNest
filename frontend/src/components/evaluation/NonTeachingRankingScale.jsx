import React from 'react'
import { FileCheck2, Printer } from 'lucide-react'

const number = new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const date = value => value ? new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—'
const present = value => value !== null && value !== undefined && value !== ''
const display = value => present(value) ? value : '—'
const score = value => present(value) ? number.format(Number(value)) : '—'

const compactNumber = value => {
  if (!present(value) || Number.isNaN(Number(value))) return '—'
  return Number(value).toLocaleString('en-PH', { maximumFractionDigits: 2 })
}

const percentage = value => {
  if (!present(value) || Number.isNaN(Number(value))) return '—'
  const numeric = Number(value)
  return numeric >= 0 && numeric <= 1 ? numeric.toFixed(2).replace(/^0/, '') : compactNumber(numeric)
}

const criterionDetails = item => {
  const snapshot = item.criterion_snapshot || {}
  return {
    code: item.criterion_code || snapshot.code || snapshot.criterion_code || '—',
    title: snapshot.title || snapshot.name || snapshot.criterion || item.item_description || item.achievement || 'Criterion snapshot',
  }
}

export default function NonTeachingRankingScale({ result }) {
  const summary = result.summary || {}
  const performance = normalizedSection(summary.performance_personal_indicators, result.items, item => String(item.criterion_code || '').toUpperCase().startsWith('A'))
  const service = normalizedSection(summary.service_leadership, result.items, item => !String(item.criterion_code || '').toUpperCase().startsWith('A'))
  const performanceTotal = present(performance.points_earned) ? performance.points_earned : result.scores?.areas?.A
  const serviceTotal = present(service.points_earned)
    ? service.points_earned
    : sumKnown([result.scores?.areas?.B, result.scores?.areas?.C])
  const resultLabel = summary.result || result.scores?.passing_status || (Number(result.scores?.total || 0) >= Number(result.scores?.passing || Infinity) ? 'Passed' : 'Retained')
  const passed = String(resultLabel).toLowerCase() === 'passed'
  const evidence = (result.items || []).flatMap(item => item.verification_status === 'verified'
    ? (item.evidence_snapshot || []).map(entry => ({ ...entry, criterion: criterionDetails(item).code }))
    : [])

  return <article data-evaluation-summary className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm dark:border-slate-800 dark:bg-slate-950 print:overflow-visible print:border-0 print:bg-white print:shadow-none">
    <style>{`@media print { body * { visibility: hidden !important; } [data-evaluation-summary], [data-evaluation-summary] * { visibility: visible !important; } [data-evaluation-summary] { position: absolute; inset: 0; width: 100%; } [data-print-hidden] { display: none !important; } @page { size: A4; margin: 12mm; } }`}</style>
    <div data-print-hidden className="flex flex-col gap-3 border-b border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-950">
      <div><h1 className="text-xl font-black tracking-[-0.025em] text-slate-950 dark:text-white">Non-Teaching Faculty Evaluation Result</h1><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Official completed personnel ranking scale</p></div>
      <button type="button" onClick={() => window.print()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 text-sm font-bold text-white hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"><Printer className="h-4 w-4"/>Print / Export PDF</button>
    </div>

    <div className="mx-auto my-5 max-w-[980px] bg-white px-4 py-5 text-[13px] leading-snug text-slate-950 sm:px-8 sm:py-7 print:m-0 print:max-w-none print:p-0 print:text-[10px]">
      <header className="relative text-center">
        <p className="sm:absolute sm:right-0 sm:top-0">Appendix N</p>
        <p className="font-bold uppercase">Notre Dame of Marbel University</p>
        <p>City of Koronadal, South Cotabato</p>
        <h2 className="mt-2 text-lg font-black uppercase underline decoration-1 underline-offset-4 print:text-[14px]">Non-Teaching Personnel Ranking Scale</h2>
      </header>

      <section className="mt-5 grid gap-x-8 gap-y-2 sm:grid-cols-2" aria-label="Personnel ranking details">
        <FormField label="Name" value={result.personnel?.name || summary.personnel_information?.name}/>
        <FormField label="Department" value={result.personnel?.department || result.personnel?.college || summary.personnel_information?.department}/>
        <FormField label="Specific Job" value={result.personnel?.position || summary.personnel_information?.position}/>
        <FormField label="Period Covered" value={summary.period_covered || result.evaluation_period?.name || result.evaluation_period?.academic_year}/>
        <FormField label="Employee's Progress last Ranking" value={summary.employee_progress_last_ranking}/>
        <FormField label="Present Rank" value={summary.present_rank}/>
        <FormField label="Rank Applied For" value={summary.rank_applied_for}/>
        <FormField label="Employee ID" value={result.personnel?.institutional_id || summary.personnel_information?.personnel_id}/>
      </section>

      <div className="mt-5 overflow-x-auto border border-slate-950 print:overflow-visible">
        <table className="w-full min-w-[720px] border-collapse text-left print:min-w-0" aria-label="Non-teaching personnel ranking scale criteria">
          <thead><tr className="bg-slate-100 print:bg-slate-100">
            <th className="w-[52%] border-b border-r border-slate-950 px-2 py-1.5 text-center font-bold">Criteria</th>
            <th className="w-[12%] border-b border-r border-slate-950 px-2 py-1.5 text-center font-bold">Weight</th>
            <th className="w-[10%] border-b border-r border-slate-950 px-2 py-1.5 text-center font-bold">%</th>
            <th className="w-[10%] border-b border-r border-slate-950 px-2 py-1.5 text-center font-bold">DS</th>
            <th className="w-[16%] border-b border-slate-950 px-2 py-1.5 text-right font-bold">Points Earned</th>
          </tr></thead>
          <tbody>
            <SectionRow code="A" title="Performance and Personal Indicators"/>
            {performance.items.map((item, index) => <OfficialRow key={item.criterion_code || index} item={item} index={index}/>) }
            {performance.items.length === 0 && <EmptyOfficialRow/>}
            <TotalRow label="Category Total" value={performanceTotal}/>
            <SectionRow code="B" title="Service and Leadership"/>
            {service.items.map((item, index) => <OfficialRow key={item.criterion_code || index} item={item} index={index}/>) }
            {service.items.length === 0 && <EmptyOfficialRow/>}
            <TotalRow label="Category Total" value={serviceTotal}/>
            <tr className="bg-slate-100 font-black print:bg-slate-100"><td className="border-r border-slate-950 px-2 py-2 uppercase">Total</td><td colSpan="3" className="border-r border-slate-950 px-2 py-2 text-right">Maximum {score(result.scores?.maximum)}</td><td className="px-2 py-2 text-right tabular-nums">{score(result.scores?.total)}</td></tr>
          </tbody>
        </table>
      </div>

      <section className="mt-4 space-y-3" aria-label="Evaluation outcome">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-bold">
          <span>Passing Score: {score(result.scores?.passing ?? summary.passing_score)} points</span>
          <StatusBox checked={passed} label="Passed"/>
          <StatusBox checked={!passed} label="Retained"/>
          <span className="ml-auto">Effectivity: <Blank value={summary.effectivity}/></span>
        </div>
        <p><strong>Recommended Rank:</strong> <Blank value={summary.recommended_rank}/></p>
        <p><strong>Comments:</strong> <span className="inline-block min-w-[70%] border-b border-slate-950 px-2">{display(summary.comments)}</span></p>
      </section>

      <section className="mt-6 grid gap-6 sm:grid-cols-2 print:grid-cols-2" aria-label="Approval lines">
        <SignatureLine label="Recommended for Approval" value={summary.approvals?.chair?.name}/>
        <div><p className="font-bold">Members:</p><div className="mt-5 grid grid-cols-2 gap-4"><SignatureLine label="Member"/><SignatureLine label="Member"/></div></div>
        <SignatureLine label="Chair"/>
        <SignatureLine label="Approved / President" value={summary.approvals?.president?.name}/>
      </section>

      {evidence.length > 0 && <section data-print-hidden className="mt-8 border-t border-slate-200 pt-4" aria-labelledby="verified-records-heading">
        <h3 id="verified-records-heading" className="font-black">Verified supporting records</h3>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">{evidence.map((entry, index) => <li key={entry.id || index} className="flex items-center gap-2 text-sm text-slate-700"><FileCheck2 className="h-4 w-4 shrink-0 text-emerald-700"/><span><strong>{entry.criterion}</strong> · {entry.original_filename || 'Verified evidence'}</span></li>)}</ul>
      </section>}

      <footer className="mt-7 flex flex-col gap-1 border-t border-slate-300 pt-3 text-[10px] text-slate-500 sm:flex-row sm:items-end sm:justify-between">
        <div><p>Immutable report · {result.result_snapshot?.report_id}</p><p>Generated {date(result.result_snapshot?.generated_at)}</p></div>
        <p>Criteria {display(result.scale_version_id)} · Evaluation version {display(result.evaluation?.version_number)}</p>
      </footer>
    </div>
  </article>
}

function normalizedSection(section, items, predicate) {
  if (section && typeof section === 'object' && Array.isArray(section.items)) return section
  const fallback = (items || []).filter(predicate).map(item => {
    const criterion = criterionDetails(item)
    return {
      criterion_code: criterion.code,
      indicator: criterion.title,
      document: item.achievement || item.item_description || criterion.title,
      weight: item.configured_points,
      points_earned: item.awarded_points,
    }
  })
  return { items: fallback, points_earned: typeof section === 'number' ? section : undefined }
}

function sumKnown(values) {
  const known = values.filter(present).map(Number)
  return known.length ? known.reduce((total, value) => total + value, 0) : undefined
}

function FormField({ label, value }) { return <p className="flex min-w-0 gap-2"><strong className="shrink-0">{label}:</strong><span className="min-w-0 flex-1 border-b border-slate-950 px-1 font-semibold">{display(value)}</span></p> }
function SectionRow({ code, title }) { return <tr className="bg-slate-200 font-black print:bg-slate-200"><td colSpan="5" className="border-b border-slate-950 px-2 py-1.5">{code}. {title}</td></tr> }
function EmptyOfficialRow() { return <tr><td className="border-b border-r border-slate-950 px-2 py-2 text-slate-500">No frozen criterion rows were recorded.</td><td className="border-b border-r border-slate-950"/><td className="border-b border-r border-slate-950"/><td className="border-b border-r border-slate-950"/><td className="border-b border-slate-950"/></tr> }
function OfficialRow({ item, index }) {
  const label = item.indicator || item.document || item.title || 'Criterion'
  const code = item.criterion_code || `${index + 1}`
  const weight = item.weight ?? item.maximum_points ?? item.max_points
  return <tr><td className="border-b border-r border-slate-950 px-2 py-1.5"><span className="font-semibold">{code}</span> {label}</td><td className="border-b border-r border-slate-950 px-2 py-1.5 text-center tabular-nums">{present(weight) ? `${compactNumber(weight)} pts` : '—'}</td><td className="border-b border-r border-slate-950 px-2 py-1.5 text-center tabular-nums">{percentage(item.percentage)}</td><td className="border-b border-r border-slate-950 px-2 py-1.5 text-center tabular-nums">{compactNumber(item.ds)}</td><td className="border-b border-slate-950 px-2 py-1.5 text-right font-semibold tabular-nums">{score(item.points_earned)}</td></tr>
}
function TotalRow({ label, value }) { return <tr className="font-bold"><td className="border-b border-r border-slate-950 px-2 py-1.5 text-right">{label}</td><td colSpan="3" className="border-b border-r border-slate-950"/><td className="border-b border-slate-950 px-2 py-1.5 text-right tabular-nums">{score(value)}</td></tr> }
function StatusBox({ checked, label }) { return <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="inline-flex h-4 w-4 items-center justify-center border border-slate-950 text-[11px] leading-none">{checked ? 'X' : ''}</span>{label}</span> }
function Blank({ value }) { return <span className="inline-block min-w-32 border-b border-slate-950 px-2 text-center font-semibold">{display(value)}</span> }
function SignatureLine({ label, value }) { return <div className="pt-5 text-center"><p className="min-h-5 border-b border-slate-950 font-semibold">{present(value) ? value : ''}</p><p className="mt-1 text-xs">{label}</p></div> }
