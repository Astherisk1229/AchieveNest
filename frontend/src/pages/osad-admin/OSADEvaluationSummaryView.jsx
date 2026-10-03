import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, BadgeCheck, ExternalLink, FileText, Printer } from 'lucide-react'
import EvaluationSummaryAwardSection from '../../components/osad/EvaluationSummaryAwardSection'
import OSADAwardAuthorityBadge from '../../components/osad/OSADAwardAuthorityBadge'
import OSADAwardPageShell from '../../components/osad/OSADAwardPageShell'
import { OSADErrorState, OSADLoadingState } from '../../components/osad/OSADStateBlock'
import { useEvidenceObjectUrl } from '../../components/common/EvidenceThumbnail'
import EvaluationSummaryModel from '../../models/EvaluationSummaryModel'
import { fetchEvaluationSummary } from '../../services/awardAdminService'

/** Loads a file only once it scrolls near the viewport, so a long portfolio does not fetch everything at once. */
function useNearViewport() {
  const ref = useRef(null)
  const [near, setNear] = useState(false)
  useEffect(() => {
    const node = ref.current
    if (!node || near) return undefined
    if (typeof IntersectionObserver === 'undefined') { setNear(true); return undefined }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) { setNear(true); observer.disconnect() }
    }, { rootMargin: '600px 0px' })
    observer.observe(node)
    return () => observer.disconnect()
  }, [near])
  return [ref, near]
}

/** One real evidence file shown inline (image or PDF). Print shows the file reference instead of the viewer. */
function EvidenceFile({ file, total }) {
  const [ref, near] = useNearViewport()
  const { url, loading, failed } = useEvidenceObjectUrl(near ? file : null)
  const label = `${total > 1 ? `File ${file.position} of ${total} · ` : ''}${file.kindLabel}`

  return (
    <figure ref={ref} className="break-inside-avoid">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-[10.5pt] text-slate-600">
        <span><span className="font-semibold text-slate-800">{label}:</span> {file.original_filename || 'Unnamed file'}{file.uploadedOn ? ` · uploaded ${file.uploadedOn}` : ''}</span>
        {url && (
          <a href={url} target="_blank" rel="noreferrer" className="print-hide inline-flex min-h-9 items-center gap-1 text-[10pt] font-semibold text-emerald-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> Open full size
          </a>
        )}
      </figcaption>
      <div className="print-hide mt-2 overflow-hidden rounded border border-slate-200 bg-slate-50">
        {file.file_kind === 'other' ? <p className="px-4 py-6 text-center text-sm text-slate-600">This file type cannot be previewed here.</p>
          : !near || loading ? <div className="flex h-64 items-center justify-center text-sm text-slate-500">Loading document…</div>
          : (!url || failed) ? <p className="px-4 py-6 text-center text-sm text-slate-600">The document could not be loaded.</p>
          : file.file_kind === 'pdf'
            ? <iframe title={`Evidence: ${file.original_filename}`} src={`${url}#view=FitH`} className="h-[75vh] w-full border-0" />
            : <img src={url} alt={`Evidence: ${file.original_filename}`} className="mx-auto max-h-[80vh] w-auto max-w-full object-contain" />}
      </div>
    </figure>
  )
}

export function PortfolioEntry({ record }) {
  return (
    <article id={record.anchorId} tabIndex={-1} className="scroll-mt-6 border-t border-slate-300 pt-5 focus:outline-none" aria-labelledby={`${record.anchorId}-title`}>
      <p className="text-[10.5pt] font-semibold uppercase tracking-[0.06em] text-slate-500">{record.date || 'Date not provided'}</p>
      <h3 id={`${record.anchorId}-title`} className="mt-0.5 text-[13pt] font-bold leading-snug text-slate-950">{record.achievement_title || 'Untitled achievement'}</h3>
      <dl className="mt-2 grid grid-cols-[130px_1fr] gap-x-3 gap-y-0.5 text-[11pt] leading-[1.35]">
        {record.categoryLabel && <><dt className="text-slate-500">Category</dt><dd>{record.categoryLabel}</dd></>}
        {record.organizer && <><dt className="text-slate-500">Organizer</dt><dd>{record.organizer}</dd></>}
        {record.criteria?.length > 0 && <><dt className="text-slate-500">Criterion</dt><dd>{record.criteria.join('; ')}</dd></>}
        <dt className="text-slate-500">Result</dt>
        <dd className={record.counted ? 'font-semibold text-emerald-800' : 'font-semibold text-slate-700'}>
          {record.counted ? `Counted · ${record.pointsText} ${record.points === 1 ? 'point' : 'points'}` : 'Not counted · 0 points'}
        </dd>
        {!record.counted && record.not_counted_reason && <><dt className="text-slate-500">Reason</dt><dd>{record.not_counted_reason}</dd></>}
      </dl>
      <div className="mt-3 space-y-4">
        {record.files.length === 0
          ? <p className="text-[11pt] text-slate-600">No supporting document is attached to this achievement.</p>
          : record.files.map((file) => <EvidenceFile key={file.id} file={file} total={record.files.length} />)}
      </div>
    </article>
  )
}

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

export default function OSADEvaluationSummaryView({ award, studentId, onBack, onCatalog, onAward }) {
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

  const goToEvidence = useCallback((recordId, anchorId) => {
    const node = typeof document !== 'undefined' ? document.getElementById(anchorId) : null
    if (!node) return
    node.scrollIntoView({ behavior: 'smooth', block: 'start' })
    node.focus({ preventScroll: true })
  }, [])

  const section = model && {
    ...model.section,
    rows: model.section.rows.map((row) => {
      const anchorId = `portfolio-record-${row.recordId}`
      return {
        ...row,
        evidenceNode: (
          <span className="block">
            <span className="block">{row.evidence}</span>
            {row.date && <span className="block text-[10.5pt] text-slate-500">{row.date}</span>}
            {model.portfolioIds.has(row.recordId) && (
              <button type="button" onClick={() => goToEvidence(row.recordId, anchorId)} className="print-hide mt-1 inline-flex min-h-9 items-center gap-1 text-[10pt] font-semibold text-emerald-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">
                <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" /> View evidence
              </button>
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
        { label: 'Award Candidates', onClick: onBack },
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
        : (
          <div className="space-y-5">
            <section aria-label="Candidate status" className="mx-auto flex max-w-[210mm] items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
              <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <p>
                <strong>{model.isPotentialCandidate ? 'Potential Candidate' : model.statusLabel}</strong>
                {model.isPotentialCandidate
                  ? ' — automatically identified from verified achievements and this award\'s criteria.'
                  : ' — this student has not reached the award threshold, so the system has not identified them as a potential candidate.'}
                {' '}Below: the Evaluation Summary (how the score was computed), then the Award Portfolio (the approved evidence behind it), both newest first.
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
              <article aria-labelledby="evaluation-summary-heading" className={`${paper} flex min-h-[297mm] flex-col print:min-h-0`}>
                <span id="evaluation-summary-heading" className="sr-only">Evaluation Summary</span>
                <DocumentHeader kicker="AchieveNest" title="STUDENT EVALUATION SUMMARY" />
                <StudentFields fields={model.fields} />
                <div className="mt-6 space-y-6">
                  <EvaluationSummaryAwardSection award={section} />
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

              <article aria-labelledby="award-portfolio-heading" className={`${paper} [break-before:page]`}>
                <span id="award-portfolio-heading" className="sr-only">Award Portfolio</span>
                <DocumentHeader kicker={model.awardName} title="AWARD PORTFOLIO" />
                <StudentFields fields={model.fields.slice(0, 3)} />
                <p className="mt-4 text-[11pt] leading-snug text-slate-700">
                  Approved achievements that belong to this award's criteria, newest first: {model.countedCount} counted, {model.portfolio.length - model.countedCount} not counted.
                  <span className="hidden print-show mt-1 text-[10pt] text-slate-500">Supporting documents are listed by file name; open them in AchieveNest to view the originals.</span>
                </p>
                <div className="mt-5 space-y-6">
                  {model.portfolio.length === 0
                    ? <p className="text-[11pt] text-slate-600">This student has no approved achievements that belong to this award's criteria.</p>
                    : model.portfolio.map((record) => <PortfolioEntry key={record.record_id} record={record} />)}
                </div>
              </article>
            </div>
          </div>
        )}
    </OSADAwardPageShell>
  )
}
