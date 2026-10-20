import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { BadgeCheck, Download, FileText, Printer } from 'lucide-react'
import EvaluationSummaryAwardSection from '../../components/osad/EvaluationSummaryAwardSection'
import OSADAwardPageShell from '../../components/osad/OSADAwardPageShell'
import { OSADErrorState, OSADLoadingState } from '../../components/osad/OSADStateBlock'
import EvaluationSummaryModel from '../../models/EvaluationSummaryModel'
import { fetchEvaluationSummary } from '../../services/awardAdminService'
import { buildEvaluationSummaryPdf, evaluationSummaryPdfFilename } from '../../utils/evaluationSummaryPdf'

function DocumentHeader({ kicker, title }) {
  return (
    <header className="border-b-2 border-slate-900 pb-3 text-center">
      <p className="text-[9.5pt] font-semibold uppercase tracking-[0.12em] text-emerald-800">{kicker}</p>
      <h2 className="mt-0.5 text-[17pt] font-bold tracking-[0.06em]">{title}</h2>
    </header>
  )
}

function StudentFields({ fields }) {
  return (
    <dl className="mt-4 grid grid-cols-[175px_1fr] gap-x-3 gap-y-1 border-b border-slate-300 pb-4 text-[12pt] leading-[1.3]">
      {fields.map((field) => (
        <React.Fragment key={field.label}>
          <dt className="font-semibold text-slate-600">{field.label}:</dt>
          <dd className="font-medium text-slate-950">{field.value}</dd>
        </React.Fragment>
      ))}
    </dl>
  )
}

const paper = 'mx-auto w-[210mm] max-w-full bg-white px-[17mm] py-[15mm] text-[12pt] leading-[1.35] text-slate-950 shadow-[0_12px_35px_rgba(15,23,42,0.12)] print:shadow-none'

export default function OSADEvaluationSummaryView({ award, studentId, onBack, onCatalog, onAward, embedded = false }) {
  const [state, setState] = useState({ loading: true, error: null, payload: null })

  const load = useCallback(async () => {
    setState({ loading: true, error: null, payload: null })
    try {
      setState({ loading: false, error: null, payload: await fetchEvaluationSummary(award.id, studentId) })
    } catch (reason) {
      setState({ loading: false, error: reason?.message || "We couldn't load the evaluation summary.", payload: null })
    }
  }, [award.id, studentId])

  useEffect(() => { load() }, [load])

  const model = useMemo(() => (state.payload ? new EvaluationSummaryModel(state.payload) : null), [state.payload])
  const printSummary = () => window.print()
  const saveSummaryAsPdf = () => {
    const studentName = model?.fields.find(field => field.label === 'Student Name')?.value
    const pdf = buildEvaluationSummaryPdf(model)
    const url = URL.createObjectURL(pdf)
    const link = document.createElement('a')
    link.href = url
    link.download = evaluationSummaryPdfFilename(studentName, award?.name)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <OSADAwardPageShell
      title={model?.fields[0]?.value || 'Student'}
      description={(
        <span className="text-sm font-medium text-slate-600 sm:text-base dark:text-slate-300">
          Student Evaluation Summary{award?.name ? ` · ${award.name}` : ''}
        </span>
      )}
      icon={FileText}
      embedded={embedded}
      breadcrumbs={embedded ? [] : [
        { label: 'Awards & Criteria', onClick: onCatalog },
        { label: award?.name || 'Award', onClick: onAward },
        { label: 'Award Candidates', onClick: onBack },
        { label: model?.fields[0]?.value || 'Student' }
      ]}
      actions={model && (
        <div className="print-hide flex flex-wrap gap-2">
          <button type="button" onClick={printSummary} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">
            <Printer className="h-4 w-4" aria-hidden="true" /> Print
          </button>
          <button type="button" onClick={saveSummaryAsPdf} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">
            <Download className="h-4 w-4" aria-hidden="true" /> Save as PDF
          </button>
        </div>
      )}
    >
      {state.loading ? <OSADLoadingState message="Loading evaluation summary…" />
        : state.error ? <OSADErrorState title="We couldn't load the evaluation summary." message="Your data hasn't been changed." onRetry={load} retryLabel="Try again" />
        : (
          <div className="space-y-5">
            <section aria-label="Candidate status" className="mx-auto flex max-w-[210mm] items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
              <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <p>
                <strong>{model.isPotentialCandidate ? 'Potential Candidate' : model.statusLabel}</strong>
                {model.isPotentialCandidate
                  ? ' — automatically identified from verified achievements and this award\'s criteria.'
                  : ' — this student has not reached the award threshold, so the system has not identified them as a potential candidate.'}
                {' '}The report below shows the award-specific evaluation summary and points by criterion.
              </p>
            </section>

            {(!model.studentEligible || model.exceedsMaximum || !model.scoringInSync) && (
              <p role="note" className="mx-auto max-w-[210mm] rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                {!model.studentEligible
                  ? 'This student does not currently meet the award\'s eligibility requirements, so they are not listed as a potential candidate.'
                  : model.exceedsMaximum
                    ? 'The earned points exceed the award maximum. Please report this so the scoring can be checked.'
                    : 'Some saved points differ from what the current scoring rules give. The saved points are shown; the scores need to be refreshed.'}
              </p>
            )}

            <div className="print-area space-y-8 rounded-xl bg-slate-100 px-4 py-6 sm:px-8 sm:py-10 dark:bg-slate-950/40 print:bg-white print:p-0">
              <style>{'@media print { @page { size: A4; margin: 0; } }'}</style>
              <article data-evaluation-summary aria-labelledby="evaluation-summary-heading" className={`${paper} flex min-h-[297mm] flex-col print:min-h-0`}>
                <span id="evaluation-summary-heading" className="sr-only">Evaluation Summary</span>
                <DocumentHeader kicker="AchieveNest" title="STUDENT EVALUATION SUMMARY" />
                <StudentFields fields={model.fields} />
                <div className="mt-6 space-y-6">
                  <EvaluationSummaryAwardSection award={model.section} />
                  {model.humanOnlyCriteria.length > 0 && (
                    <p className="text-[10.5pt] leading-snug text-slate-600">Not scored by the system: {model.humanOnlyCriteria.join('; ')}.</p>
                  )}
                </div>
                <footer className="mt-auto pt-8 text-center text-[9pt] leading-tight text-slate-500">
                  Generated by AchieveNest from approved achievements. Potential candidate status is identified automatically from the award criteria.
                </footer>
              </article>

              {model.criteria.length > 0 && (
                <section aria-labelledby="criteria-breakdown-heading" className="print-hide mx-auto w-[210mm] max-w-full rounded-lg bg-white px-6 py-4 dark:bg-[#131e2e]">
                  <h2 id="criteria-breakdown-heading" className="text-sm font-semibold text-slate-900 dark:text-white">Points by criterion</h2>
                  <ul className="mt-2 divide-y divide-slate-100 text-sm dark:divide-slate-800">
                    {model.criteria.map((criterion) => (
                      <li key={criterion.criterion_id} className="flex justify-between gap-4 py-1.5 text-slate-700 dark:text-slate-200">
                        <span>{criterion.criterion_name}</span>
                        <span className="tabular-nums">{criterion.earnedText} / {criterion.maxText}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

            </div>
          </div>
        )}
    </OSADAwardPageShell>
  )
}
