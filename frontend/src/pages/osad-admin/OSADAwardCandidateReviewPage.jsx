import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, Download, Printer, Search, Trophy, X } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import OSADPageHeader from '../../components/osad/OSADPageHeader'
import { OSADEmptyState, OSADErrorState, OSADLoadingState, OSADSearchEmptyState } from '../../components/osad/OSADStateBlock'
import OSADEvaluationSummaryView from './OSADEvaluationSummaryView'
import { fetchAwards, fetchCandidates } from '../../services/awardAdminService'
import { buildAwardCandidatesPdf } from '../../utils/awardCandidatesPdf'

const text = (value) => String(value || '').trim()

export function filterAwardCandidates(candidates, filters) {
  const query = text(filters.search).toLowerCase()
  return candidates.filter((candidate) => {
    const matchesSearch = !query || [candidate.student_name, candidate.student_id_number]
      .some((value) => text(value).toLowerCase().includes(query))
    const matchesAward = filters.award === 'all' || candidate.award_definition_id === filters.award
    const matchesCollege = filters.college === 'all' || candidate.college_id === filters.college
    const matchesStatus = filters.status === 'all'
      || (filters.status === 'potential' && candidate.is_candidate)
      || (filters.status === 'below_threshold' && !candidate.is_candidate)
    return matchesSearch && matchesAward && matchesCollege && matchesStatus
  })
}

const uniqueOptions = (items, idKey, labelKey) => Array.from(
  new Map(items.filter((item) => item[idKey]).map((item) => [item[idKey], item[labelKey] || item[idKey]])).entries()
).map(([value, label]) => ({ value, label })).sort((a, b) => String(a.label).localeCompare(String(b.label)))

function CandidateReviewDialog({ candidate, onClose }) {
  const dialogRef = useRef(null)
  const closeButtonRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return undefined
    if (!dialog.open) dialog.showModal()
    closeButtonRef.current?.focus()
    return () => { if (dialog.open) dialog.close() }
  }, [])

  const award = {
    id: candidate.award_definition_id,
    name: candidate.award_name || candidate.award_code || 'Award'
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="candidate-review-dialog-title"
      onCancel={(event) => { event.preventDefault(); onClose() }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose() }}
      className="m-auto flex max-h-[calc(100vh-2rem)] w-[min(96vw,1280px)] max-w-none flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 text-left shadow-2xl backdrop:bg-slate-950/60 dark:border-slate-700 dark:bg-[#131e2e]"
    >
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 px-5 py-3 dark:border-slate-800">
        <div className="min-w-0">
          <h2 id="candidate-review-dialog-title" className="text-base font-semibold text-slate-900 dark:text-white">Candidate review</h2>
          <p className="truncate text-sm text-slate-600 dark:text-slate-300">{award.name}</p>
        </div>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Close candidate review"
          className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <OSADEvaluationSummaryView award={award} studentId={candidate.student_profile_id} embedded />
      </div>
    </dialog>
  )
}

export default function OSADAwardCandidateReviewPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [candidates, setCandidates] = useState([])
  const [awardCatalog, setAwardCatalog] = useState([])
  const [reviewCandidate, setReviewCandidate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [exportError, setExportError] = useState('')
  // ?award=<id> arrives from an award's "View candidates" button (Awards & Scoring Criteria).
  const [filters, setFilters] = useState(() => ({ search: '', award: searchParams.get('award') || 'all', college: 'all', status: 'all' }))

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await fetchCandidates()
      setCandidates(Array.isArray(rows) ? rows : [])
    } catch (err) {
      setCandidates([])
      setError(err?.response?.data?.error?.message || err?.message || 'Unable to load award candidates.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    let active = true
    fetchAwards().then(items => { if (active) setAwardCatalog(Array.isArray(items) ? items : []) }).catch(() => {})
    return () => { active = false }
  }, [])

  const awards = useMemo(() => {
    const fromCandidates = uniqueOptions(candidates, 'award_definition_id', 'award_name')
    const known = new Set(fromCandidates.map(option => String(option.value)))
    const extra = awardCatalog.filter(award => award?.id && !known.has(String(award.id))).map(award => ({ value: award.id, label: award.name || award.code || award.id }))
    return [...fromCandidates, ...extra].sort((a, b) => String(a.label).localeCompare(String(b.label)))
  }, [candidates, awardCatalog])
  const selectedAwardName = filters.award === 'all' ? '' : (awards.find(option => String(option.value) === String(filters.award))?.label || '')
  const colleges = useMemo(() => uniqueOptions(candidates, 'college_id', 'college_name'), [candidates])
  const visible = useMemo(() => filterAwardCandidates(candidates, filters), [candidates, filters])
  const syncAwardParam = (award) => setSearchParams(current => {
    const next = new URLSearchParams(current)
    if (award && award !== 'all') next.set('award', award)
    else next.delete('award')
    return next
  }, { replace: true })
  const setFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }))
    if (key === 'award') syncAwardParam(value)
  }
  const resetFilters = () => { setFilters({ search: '', award: 'all', college: 'all', status: 'all' }); syncAwardParam('all') }
  const review = (candidate) => setReviewCandidate(candidate)
  const printCandidates = () => window.print()
  const downloadCandidatesPdf = () => {
    try {
      const collegeName = filters.college === 'all' ? 'All colleges' : colleges.find(option => String(option.value) === String(filters.college))?.label || 'Selected college'
      const statusName = { all: 'All review statuses', potential: 'Potential candidates', below_threshold: 'Below candidate threshold' }[filters.status]
      const searchSummary = [filters.search ? `Search: ${filters.search}` : 'All students', collegeName, statusName].filter(Boolean).join(' · ')
      const blob = buildAwardCandidatesPdf(visible, { awardLabel: selectedAwardName || 'All awards', searchSummary })
      const awardSlug = (selectedAwardName || 'All-Awards').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '')
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${awardSlug}-Candidates.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setExportError('')
    } catch {
      setExportError('The PDF could not be generated. Please try again.')
    }
  }

  return <div className="space-y-6 font-sans" data-award-candidates>
    <OSADPageHeader
      title="Award Candidates"
      description={selectedAwardName
        ? `Portfolio evaluation results for ${selectedAwardName}.`
        : 'Portfolio-based candidate results across active awards.'}
      icon={Trophy}
      badge="OSAD Review"
      primaryAction={visible.length > 0 && !loading && !error
        ? <div className="print-hide flex flex-wrap gap-2"><button type="button" onClick={printCandidates} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"><Printer className="h-4 w-4" aria-hidden="true" /> Print</button><button type="button" onClick={downloadCandidatesPdf} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-800 px-3.5 py-2 text-sm font-semibold text-white hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"><Download className="h-4 w-4" aria-hidden="true" /> Save as PDF</button></div>
        : null}
    />
    {exportError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{exportError}</p>}

    {loading ? <OSADLoadingState message="Loading award candidates…" />
      : error ? <OSADErrorState title="We couldn't load award candidates." message={error} onRetry={load} retryLabel="Try again" />
      : candidates.length === 0 ? <OSADEmptyState icon={Trophy} title="No award candidates are currently available for review." description="Candidate records will appear here when the active award cycle has portfolio evaluation results." />
      : <>
        <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-[#131e2e] sm:grid-cols-2 xl:grid-cols-4" aria-label="Candidate filters">
          <label className="relative"><span className="sr-only">Search candidates</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="search" value={filters.search} onChange={(event) => setFilter('search', event.target.value)} placeholder="Student name or number" className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label>
          <label><span className="sr-only">Filter award</span><select value={filters.award} onChange={(event) => setFilter('award', event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"><option value="all">All awards</option>{awards.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label><span className="sr-only">Filter college</span><select value={filters.college} onChange={(event) => setFilter('college', event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"><option value="all">All colleges</option>{colleges.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label><span className="sr-only">Filter candidate status</span><select value={filters.status} onChange={(event) => setFilter('status', event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"><option value="all">All review statuses</option><option value="potential">Potential candidates</option><option value="below_threshold">Below threshold</option></select></label>
        </section>

        {visible.length === 0 ? <OSADSearchEmptyState title="No candidates match these filters." description="Try a different student, award, college, or review status." onReset={resetFilters} />
          : <section className="print-area overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-[#131e2e]" aria-label="Award candidates">
            <div className="print-only px-4 pb-3 pt-4"><h2 className="text-xl font-bold">Award Candidates</h2><p className="mt-1 text-sm">{selectedAwardName || 'All awards'} · {visible.length} {visible.length === 1 ? 'candidate' : 'candidates'}</p></div>
            <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-200" aria-live="polite">{visible.length} {visible.length === 1 ? 'candidate' : 'candidates'} available</div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">{visible.map((candidate) => <article key={candidate.candidate_id} className="grid gap-4 p-4 md:grid-cols-[1.3fr_1fr_1.2fr_auto] md:items-center">
              <div className="min-w-0"><h2 className="truncate text-sm font-bold text-slate-900 dark:text-white">{candidate.student_name || 'Student name unavailable'}</h2><p className="text-xs text-slate-500">{candidate.student_id_number || 'Student number unavailable'}</p></div>
              <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{candidate.program_code || candidate.program_name || 'Program unavailable'}</p><p className="truncate text-xs text-slate-500">{candidate.college_code || candidate.college_name || 'College unavailable'}</p></div>
              <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{candidate.award_name || candidate.award_code || 'Award unavailable'}</p><p className="text-xs text-slate-500">{candidate.is_candidate ? `${candidate.potential_score}% potential score` : 'Below candidate threshold'}</p></div>
              <button type="button" onClick={() => review(candidate)} className="print-hide inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-[#16834a] px-4 py-2 text-xs font-bold text-white hover:bg-[#126b3c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"><span>Review Candidate</span><ArrowRight className="h-4 w-4" /></button>
            </article>)}</div>
          </section>}
      </>}
    {reviewCandidate && <CandidateReviewDialog candidate={reviewCandidate} onClose={() => setReviewCandidate(null)} />}
  </div>
}
