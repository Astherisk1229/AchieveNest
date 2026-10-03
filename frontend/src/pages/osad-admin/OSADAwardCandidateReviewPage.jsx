import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowRight, Printer, Search, Trophy } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import OSADPageHeader from '../../components/osad/OSADPageHeader'
import { OSADEmptyState, OSADErrorState, OSADLoadingState, OSADSearchEmptyState } from '../../components/osad/OSADStateBlock'
import { fetchAwards, fetchCandidates } from '../../services/awardAdminService'

const text = (value) => String(value || '').trim()

export function filterAwardCandidates(candidates, filters) {
  const query = text(filters.search).toLowerCase()
  return candidates.filter((candidate) => {
    const matchesSearch = !query || [candidate.student_name, candidate.student_id_number]
      .some((value) => text(value).toLowerCase().includes(query))
    const matchesAward = filters.award === 'all' || candidate.award_definition_id === filters.award
    const matchesCollege = filters.college === 'all' || candidate.college_id === filters.college
    const matchesStatus = filters.status === 'all'
      || (filters.status === 'dean_nomination' && candidate.eligibility_source === 'dean_nomination')
      || (filters.status === 'potential' && candidate.eligibility_source === 'portfolio_evaluation' && candidate.is_candidate)
      || (filters.status === 'below_threshold' && candidate.eligibility_source === 'portfolio_evaluation' && !candidate.is_candidate)
    return matchesSearch && matchesAward && matchesCollege && matchesStatus
  })
}

const uniqueOptions = (items, idKey, labelKey) => Array.from(
  new Map(items.filter((item) => item[idKey]).map((item) => [item[idKey], item[labelKey] || item[idKey]])).entries()
).map(([value, label]) => ({ value, label })).sort((a, b) => String(a.label).localeCompare(String(b.label)))

export default function OSADAwardCandidateReviewPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [candidates, setCandidates] = useState([])
  const [awardCatalog, setAwardCatalog] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
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
  const review = (candidate) => navigate(`/osad/awards/${candidate.award_definition_id}/candidates/${candidate.student_profile_id}/review`)

  return <div className="space-y-6 font-sans">
    <OSADPageHeader
      title="Award Candidates"
      description={selectedAwardName
        ? `Potential and Dean-nominated candidates for ${selectedAwardName}.`
        : 'Potential (portfolio-qualified) and Dean-nominated candidates across active awards.'}
      icon={Trophy}
      badge="OSAD Review"
      primaryAction={visible.length > 0 && !loading && !error
        ? <button type="button" onClick={() => window.print()} className="print-hide inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"><Printer className="h-4 w-4" aria-hidden="true" /> Print / Export PDF</button>
        : null}
    />

    {loading ? <OSADLoadingState message="Loading award candidates…" />
      : error ? <OSADErrorState title="We couldn't load award candidates." message={error} onRetry={load} retryLabel="Try again" />
      : candidates.length === 0 ? <OSADEmptyState icon={Trophy} title="No award candidates are currently available for review." description="Candidate records will appear here when the active award cycle produces portfolio-qualified or Dean-nominated candidates." />
      : <>
        <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-[#131e2e] sm:grid-cols-2 xl:grid-cols-4" aria-label="Candidate filters">
          <label className="relative"><span className="sr-only">Search candidates</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="search" value={filters.search} onChange={(event) => setFilter('search', event.target.value)} placeholder="Student name or number" className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label>
          <label><span className="sr-only">Filter award</span><select value={filters.award} onChange={(event) => setFilter('award', event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"><option value="all">All awards</option>{awards.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label><span className="sr-only">Filter college</span><select value={filters.college} onChange={(event) => setFilter('college', event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"><option value="all">All colleges</option>{colleges.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label><span className="sr-only">Filter candidate status</span><select value={filters.status} onChange={(event) => setFilter('status', event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"><option value="all">All review statuses</option><option value="potential">Potential candidates</option><option value="dean_nomination">Dean nominations</option><option value="below_threshold">Below threshold</option></select></label>
        </section>

        {visible.length === 0 ? <OSADSearchEmptyState title="No candidates match these filters." description="Try a different student, award, college, or review status." onReset={resetFilters} />
          : <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-[#131e2e]" aria-label="Award candidates">
            <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-200" aria-live="polite">{visible.length} {visible.length === 1 ? 'candidate' : 'candidates'} available</div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">{visible.map((candidate) => <article key={candidate.candidate_id} className="grid gap-4 p-4 md:grid-cols-[1.3fr_1fr_1.2fr_auto] md:items-center">
              <div className="min-w-0"><h2 className="truncate text-sm font-bold text-slate-900 dark:text-white">{candidate.student_name || 'Student name unavailable'}</h2><p className="text-xs text-slate-500">{candidate.student_id_number || 'Student number unavailable'}</p></div>
              <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{candidate.program_code || candidate.program_name || 'Program unavailable'}</p><p className="truncate text-xs text-slate-500">{candidate.college_code || candidate.college_name || 'College unavailable'}</p></div>
              <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{candidate.award_name || candidate.award_code || 'Award unavailable'}</p><p className="text-xs text-slate-500">{candidate.eligibility_source === 'dean_nomination' ? 'Dean nomination' : candidate.is_candidate ? `${candidate.potential_score}% potential score` : 'Below candidate threshold'}</p></div>
              <button type="button" onClick={() => review(candidate)} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-[#16834a] px-4 py-2 text-xs font-bold text-white hover:bg-[#126b3c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"><span>Review Candidate</span><ArrowRight className="h-4 w-4" /></button>
            </article>)}</div>
          </section>}
      </>}
  </div>
}
