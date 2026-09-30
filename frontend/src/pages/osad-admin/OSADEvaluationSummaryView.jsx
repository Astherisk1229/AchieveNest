import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { FileText, Printer, X } from 'lucide-react'
import EvaluationSummaryAwardSection from '../../components/osad/EvaluationSummaryAwardSection'
import OSADAwardAuthorityBadge from '../../components/osad/OSADAwardAuthorityBadge'
import OSADAwardPageShell from '../../components/osad/OSADAwardPageShell'
import { OSADErrorState, OSADLoadingState } from '../../components/osad/OSADStateBlock'
import { evidenceMime, useEvidenceObjectUrl } from '../../components/common/EvidenceThumbnail'
import EvaluationSummaryModel from '../../models/EvaluationSummaryModel'
import { fetchEvaluationSummary } from '../../services/awardAdminService'

/** Full-size view of one supporting document, fetched through the protected download endpoint. */
function DocumentViewer({ item, evidence, onClose }) {
  const { url, loading, failed } = useEvidenceObjectUrl(evidence)
  useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="print-hide fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="document-viewer-title">
      <div className="flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-xl dark:bg-[#131e2e]">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <div className="min-w-0">
            <h2 id="document-viewer-title" className="truncate text-sm font-semibold text-slate-900 dark:text-white">{item.achievement_title || 'Untitled achievement'}</h2>
            <p className="truncate text-xs text-slate-500">{evidence.original_filename}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close document" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-slate-300 dark:hover:bg-slate-800">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="flex flex-1 items-center justify-center bg-slate-100 dark:bg-slate-950">
          {loading ? <p className="text-sm text-slate-500">Loading document…</p>
            : (!url || failed) ? <p className="px-6 text-center text-sm text-slate-600">Preview unavailable for this file.</p>
            : evidenceMime(evidence) === 'application/pdf'
              ? <iframe title={`Document: ${evidence.original_filename}`} src={url} className="h-full w-full border-0" />
              : <img src={url} alt={`Document: ${evidence.original_filename}`} className="max-h-full max-w-full object-contain" />}
        </div>
      </div>
    </div>
  )
}

function DocumentPage({ children }) {
  return (
    <article className="print-area mx-auto flex min-h-[297mm] w-[210mm] flex-col bg-white px-[17mm] py-[15mm] text-[12pt] leading-[1.35] text-slate-950 shadow-[0_12px_35px_rgba(15,23,42,0.12)]">
      {children}
    </article>
  )
}

export default function OSADEvaluationSummaryView({ award, studentId, onBack, onCatalog, onAward }) {
  const [state, setState] = useState({ loading: true, error: null, payload: null })
  const [viewing, setViewing] = useState(null)

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
  const closeViewer = useCallback(() => setViewing(null), [])

  const section = model && {
    ...model.section,
    rows: model.section.rows.map((row, index) => {
      const item = model.items[index]
      return {
        ...row,
        evidenceNode: (
          <span className="block">
            <span className="block">{row.evidence}</span>
            {item.date && <span className="block text-[10.5pt] text-slate-500">{item.date}</span>}
            {item.evidence?.length > 0 && (
              <span className="print-hide mt-1 flex flex-wrap gap-1.5">
                {item.evidence.map((file) => (
                  <button key={file.id} type="button" onClick={() => setViewing({ item, evidence: file })} className="inline-flex min-h-9 items-center gap-1 rounded-md border border-emerald-200 px-2 text-[10pt] font-semibold text-emerald-800 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">
                    <FileText className="h-3.5 w-3.5" aria-hidden="true" /> View document
                  </button>
                ))}
              </span>
            )}
          </span>
        )
      }
    })
  }

  return (
    <OSADAwardPageShell
      title="Student Evaluation Summary"
      description={award?.name}
      icon={FileText}
      badge={<OSADAwardAuthorityBadge value={award?.authority_status} />}
      breadcrumbs={[
        { label: 'Awards & Criteria', onClick: onCatalog },
        { label: award?.name || 'Award', onClick: onAward },
        { label: 'Potential Candidates', onClick: onBack },
        { label: model?.fields[0]?.value || 'Student' }
      ]}
      actions={model && (
        <button type="button" onClick={() => window.print()} className="print-hide inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">
          <Printer className="h-4 w-4" aria-hidden="true" /> Print / Save as PDF
        </button>
      )}
    >
      {state.loading ? <OSADLoadingState message="Loading evaluation summary…" />
        : state.error ? <OSADErrorState title="We couldn't load the evaluation summary." message="Your data hasn't been changed." onRetry={load} retryLabel="Try again" />
        : <>
          {(!model.studentEligible || model.exceedsMaximum) && (
            <p role="note" className="mx-auto max-w-[210mm] rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              {!model.studentEligible
                ? 'This student does not currently meet the award\'s eligibility requirements, so they are not listed as a potential candidate.'
                : 'The earned points exceed the award maximum. Please report this so the scoring can be checked.'}
            </p>
          )}

          <div className="overflow-x-auto rounded-xl bg-slate-100 px-4 py-6 sm:px-8 sm:py-10 dark:bg-slate-950/40" aria-label="Student evaluation summary document">
            <div className="min-w-[210mm]">
              <DocumentPage>
                <header className="border-b-2 border-slate-900 pb-3 text-center">
                  <p className="text-[9.5pt] font-semibold uppercase tracking-[0.12em] text-emerald-800">AchieveNest</p>
                  <h2 className="mt-0.5 text-[17pt] font-bold tracking-[0.06em]">STUDENT EVALUATION SUMMARY</h2>
                </header>

                <dl className="mt-4 grid grid-cols-[175px_1fr] gap-x-3 gap-y-1 border-b border-slate-300 pb-4 text-[12pt] leading-[1.3]">
                  {model.fields.map((field) => (
                    <React.Fragment key={field.label}>
                      <dt className="font-semibold text-slate-600">{field.label}:</dt>
                      <dd className="font-medium text-slate-950">{field.value}</dd>
                    </React.Fragment>
                  ))}
                </dl>

                <div className="mt-6 space-y-8">
                  <EvaluationSummaryAwardSection award={section} />

                  {model.criteria.length > 0 && (
                    <section aria-labelledby="criteria-breakdown-heading" className="break-inside-avoid [page-break-inside:avoid]">
                      <h3 id="criteria-breakdown-heading" className="border-b border-slate-900 pb-1 text-[12pt] font-bold uppercase tracking-[0.04em] text-slate-950">Points by criterion</h3>
                      <table className="mt-2.5 w-full table-fixed border-collapse text-[12pt] leading-[1.3] text-slate-800">
                        <thead className="[display:table-header-group]">
                          <tr className="border-y border-slate-400 bg-slate-50 text-left text-slate-950">
                            <th scope="col" className="w-[70%] px-1.5 py-1.5 font-semibold">Criterion</th>
                            <th scope="col" className="w-[30%] px-1.5 py-1.5 text-right font-semibold">Earned / Maximum</th>
                          </tr>
                        </thead>
                        <tbody>
                          {model.criteria.map((criterion) => (
                            <tr key={criterion.criterion_id} className="border-b border-slate-200">
                              <td className="px-1.5 py-1.5">{criterion.criterion_name}</td>
                              <td className="px-1.5 py-1.5 text-right tabular-nums">{criterion.earnedText} / {criterion.maxText}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </section>
                  )}

                  {model.humanOnlyCriteria.length > 0 && (
                    <p className="text-[10.5pt] leading-snug text-slate-600">
                      Not scored by the system: {model.humanOnlyCriteria.join('; ')}.
                    </p>
                  )}
                </div>

                <footer className="mt-auto pt-8 text-center text-[9pt] leading-tight text-slate-500">
                  Generated by AchieveNest from approved achievements. Potential candidate status is identified automatically from the award criteria.
                </footer>
              </DocumentPage>
            </div>
          </div>

          {viewing && <DocumentViewer item={viewing.item} evidence={viewing.evidence} onClose={closeViewer} />}
        </>}
    </OSADAwardPageShell>
  )
}
