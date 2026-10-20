import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Clock3, FileCheck2, Plus, RefreshCw, Search, UserRound, Users } from 'lucide-react'
import OSADPageHeader from '../../components/osad/OSADPageHeader'
import PortfolioSubmissionDocument from '../../components/student/PortfolioSubmissionDocument'
import portfolioSubmissionPortalService from '../../services/portfolioSubmissionPortalService'
import provisioningService from '../../services/provisioningService'
import { fetchEvaluatedResults } from '../../services/awardAdminService'

const errorMessage = error => error?.response?.data?.error?.message || error?.message || 'The request could not be completed.'
const button = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50'
const primary = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 text-sm font-bold text-white hover:bg-emerald-900 disabled:opacity-50'
const localDateString = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

export default function OSADPortfolioSubmissionPortalPage() {
  const navigate = useNavigate()
  const [portals, setPortals] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [detail, setDetail] = useState(null)
  const [awards, setAwards] = useState([])
  const [addAwardId, setAddAwardId] = useState('')
  const [studentsByAward, setStudentsByAward] = useState({})
  const [studentSearchByAward, setStudentSearchByAward] = useState({})
  const [selectedStudentsByAward, setSelectedStudentsByAward] = useState({})
  const [setupAwards, setSetupAwards] = useState([])
  const [scoredCandidatesByAward, setScoredCandidatesByAward] = useState({})
  const [candidateErrorsByAward, setCandidateErrorsByAward] = useState({})
  const [portalTitle, setPortalTitle] = useState('')
  const [awardYear, setAwardYear] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [reopenTarget, setReopenTarget] = useState(null)
  const [reopenReason, setReopenReason] = useState('')
  const [ackException, setAckException] = useState(false)
  const [ackRequired, setAckRequired] = useState(false)
  const [historyStudent, setHistoryStudent] = useState('')
  const [history, setHistory] = useState(null)
  const [version, setVersion] = useState(null)
  const candidateRequests = useRef(new Set())

  const loadPortals = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [items, awardItems, activeYear] = await Promise.all([portfolioSubmissionPortalService.listOsadPortals(), portfolioServiceAwards(), portfolioSubmissionPortalService.getActiveAwardYear()])
      setPortals(items); setAwards(awardItems)
      setAwardYear(activeYear.active_award_year || '')
      if (selectedId) {
        try { setDetail(await portfolioSubmissionPortalService.getOsadPortal(selectedId)) }
        catch { setSelectedId(''); setDetail(null) }
      }
    } catch (reason) { setError(errorMessage(reason)) }
    finally { setLoading(false) }
  }, [selectedId])
  useEffect(() => { loadPortals() }, [loadPortals])

  useEffect(() => {
    let active = true
    const timers = Object.entries(studentSearchByAward).map(([awardId, search]) => {
      if (!search.trim()) {
        setStudentsByAward(current => ({ ...current, [awardId]: [] }))
        return null
      }
      return setTimeout(async () => {
        try {
          const result = await provisioningService.fetchStudentsPage({ page: 1, per_page: 100, status: 'active', search: search.trim() })
          if (active) setStudentsByAward(current => ({ ...current, [awardId]: result.students || [] }))
        } catch (reason) { if (active) setError(errorMessage(reason)) }
      }, 200)
    })
    return () => { active = false; timers.filter(Boolean).forEach(clearTimeout) }
  }, [studentSearchByAward])

  const awardGroupKey = (selectedId ? detail?.award_groups || [] : setupAwards.map(award => ({ award }))).map(group => group.award.id).join('|')
  useEffect(() => {
    let active = true
    for (const awardId of awardGroupKey.split('|').filter(Boolean)) {
      if (candidateRequests.current.has(awardId)) continue
      candidateRequests.current.add(awardId)
      setScoredCandidatesByAward(current => ({ ...current, [awardId]: null }))
      fetchEvaluatedResults(awardId)
        .then(result => { if (active) setScoredCandidatesByAward(current => ({ ...current, [awardId]: result?.evaluated_results || [] })) })
        .catch(reason => { if (active) { setScoredCandidatesByAward(current => ({ ...current, [awardId]: [] })); setCandidateErrorsByAward(current => ({ ...current, [awardId]: errorMessage(reason) })) } })
    }
    return () => { active = false }
  }, [detail?.portal?.id, awardGroupKey])

  const openPortal = async id => {
    setBusy(true); setError(''); setNotice('')
    try {
      const response = await portfolioSubmissionPortalService.getOsadPortal(id)
      candidateRequests.current.clear()
      setSelectedId(id); setDetail(response); setHistory(null); setVersion(null)
      const queries = Object.fromEntries((response.award_groups || []).map(group => [group.award.id, '']))
      setStudentSearchByAward(queries)
      setStudentsByAward({}); setSelectedStudentsByAward({}); setScoredCandidatesByAward({}); setCandidateErrorsByAward({})
    } catch (reason) { setError(errorMessage(reason)) }
    finally { setBusy(false) }
  }

  const createPortal = async event => {
    event.preventDefault(); setBusy(true); setError(''); setNotice('')
    try {
      const created = await portfolioSubmissionPortalService.createPortal({
        title: portalTitle,
        start_date: startDate,
        end_date: endDate,
        // Insert oldest first so the backend's newest-added-first ordering matches the setup list.
        awards: [...setupAwards].reverse().map(award => ({ award_id: award.id, student_profile_ids: selectedStudentsByAward[award.id] || [] })),
      })
      const response = created.data || created
      const portalId = response.portal?.id || response.id
      if (!portalId) throw new Error('The portal was created but its ID was not returned.')
      candidateRequests.current.clear()
      setScoredCandidatesByAward({}); setCandidateErrorsByAward({})
      setSelectedId(portalId); setDetail(response); setPortalTitle(''); setStartDate(''); setEndDate(''); setSetupAwards([])
      setStudentSearchByAward(Object.fromEntries((response.award_groups || []).map(group => [group.award.id, ''])))
      setStudentsByAward({}); setSelectedStudentsByAward({}); setNotice('Portal created and opened for the selected students.')
      setPortals(await portfolioSubmissionPortalService.listOsadPortals())
    } catch (reason) {
      setError(errorMessage(reason))
    }
    finally { setBusy(false) }
  }

  const addSetupAward = () => {
    const award = awards.find(item => item.id === addAwardId)
    if (!award || setupAwards.some(item => item.id === award.id)) return
    setSetupAwards(current => [award, ...current])
    setStudentSearchByAward(current => ({ ...current, [award.id]: '' }))
    setAddAwardId('')
  }
  const removeSetupAward = awardId => {
    setSetupAwards(current => current.filter(award => award.id !== awardId))
    setStudentSearchByAward(current => { const next = { ...current }; delete next[awardId]; return next })
    setStudentsByAward(current => { const next = { ...current }; delete next[awardId]; return next })
    setSelectedStudentsByAward(current => { const next = { ...current }; delete next[awardId]; return next })
    candidateRequests.current.delete(awardId)
    setScoredCandidatesByAward(current => { const next = { ...current }; delete next[awardId]; return next })
    setCandidateErrorsByAward(current => { const next = { ...current }; delete next[awardId]; return next })
  }

  const refreshDetail = async () => {
    if (!detail?.portal?.id) return
    setDetail(await portfolioSubmissionPortalService.getOsadPortal(detail.portal.id))
    setPortals(await portfolioSubmissionPortalService.listOsadPortals())
  }
  const mutate = async action => {
    if (!detail?.portal?.id) return
    setBusy(true); setError(''); setNotice('')
    try { await action(); await refreshDetail() }
    catch (reason) { setError(errorMessage(reason)) }
    finally { setBusy(false) }
  }
  const addAwardToPortal = async () => {
    if (!detail?.portal?.id || !addAwardId) return
    setBusy(true); setError(''); setNotice('')
    try {
      await portfolioSubmissionPortalService.addPortalAward(detail.portal.id, addAwardId)
      setAddAwardId('')
      await refreshDetail()
      setStudentSearchByAward(current => ({ ...current, [addAwardId]: '' }))
      setNotice('Award added. Select students for this award below.')
    } catch (reason) { setError(errorMessage(reason)) }
    finally { setBusy(false) }
  }
  const toggleAwardStudent = (awardId, studentId) => setSelectedStudentsByAward(current => {
    const selected = current[awardId] || []
    return { ...current, [awardId]: selected.includes(studentId) ? selected.filter(item => item !== studentId) : [...selected, studentId] }
  })
  const saveAwardStudents = async awardId => {
    const studentIds = selectedStudentsByAward[awardId] || []
    if (!detail?.portal?.id || studentIds.length === 0) return
    setBusy(true); setError(''); setNotice('')
    try {
      await portfolioSubmissionPortalService.selectStudents(detail.portal.id, studentIds, [awardId])
      setSelectedStudentsByAward(current => ({ ...current, [awardId]: [] }))
      await refreshDetail()
      setNotice('Students assigned to this award. They gain access when the portal is open.')
    } catch (reason) { setError(errorMessage(reason)) }
    finally { setBusy(false) }
  }

  const showHistory = async student => {
    setError(''); setHistoryStudent(student.student_profile_id); setVersion(null)
    try { setHistory(await portfolioSubmissionPortalService.getSubmissionHistory(detail.portal.id, student.student_profile_id)) }
    catch (reason) { setError(errorMessage(reason)) }
  }
  const reopen = async (studentId, acknowledge = false) => {
    setBusy(true); setError('')
    try {
      await portfolioSubmissionPortalService.reopen(detail.portal.id, studentId, reopenReason, acknowledge)
      setReopenTarget(null); setReopenReason(''); setAckException(false); setAckRequired(false); setNotice('Submission reopened for correction. The previous final version remains in history.')
      await refreshDetail()
    } catch (reason) {
      const code = reason?.response?.data?.error?.code
      if (code === 'EVALUATION_EXCEPTION_ACK_REQUIRED') setAckRequired(true)
      else setError(errorMessage(reason))
    } finally { setBusy(false) }
  }

  const reviewSnapshot = useMemo(() => version?.snapshot || null, [version])
  const downloadFile = async file => portfolioSubmissionPortalService.downloadOsadFile(detail.portal.id, historyStudent, version.id, file.id)
  const setupSelectionCount = setupAwards.reduce(
    (count, award) => count + (selectedStudentsByAward[award.id] || []).length,
    0
  )
  const today = localDateString()
  const setupRequirements = [
    !portalTitle.trim() && 'Enter a portal name',
    !awardYear && 'Wait for the system award year to load',
    !startDate && 'Choose a start date',
    !endDate && 'Choose an end date',
    startDate && startDate < today && 'Choose a start date that is today or later',
    startDate && endDate && endDate < startDate && 'Choose an end date on or after the start date',
    setupAwards.length === 0 && 'Add at least one award',
    setupAwards.length > 0 && setupSelectionCount === 0 && 'Select at least one student for an award',
  ].filter(Boolean)
  const canCreatePortal = !busy && setupRequirements.length === 0

  return <div className="space-y-5">
    <OSADPageHeader title="Portfolio Submission Portal" description="Set submission dates, choose awards and students, then review portfolio submissions." icon={FileCheck2} />
    {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
    {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{notice}</p>}
    {selectedId && detail ? <>
      <button type="button" onClick={() => { setSelectedId(''); setDetail(null); setHistory(null); setVersion(null) }} className={`${button} border-0 text-emerald-800`}><ArrowLeft className="h-4 w-4"/>All portals</button>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-xl font-bold text-slate-950">{detail.portal.title}</h2><p className="mt-1 text-sm text-slate-600">Award year: {detail.portal.award_period || 'not recorded'} · Submission dates: {detail.portal.start_date || 'not set'} to {detail.portal.end_date || 'not set'} · <span className="capitalize">{detail.portal.status}</span></p></div><button type="button" disabled={busy} className={detail.portal.status === 'open' ? button : primary} onClick={() => mutate(() => portfolioSubmissionPortalService.setPortalStatus(detail.portal.id, detail.portal.status === 'open' ? 'closed' : 'open'))}><RefreshCw className="h-4 w-4"/>{detail.portal.status === 'open' ? 'Close portal' : 'Open portal'}</button></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3"><Stat icon={Users} label="Selected" value={detail.students.filter(student => student.access_status === 'active').length}/><Stat icon={Clock3} label="In progress" value={detail.students.filter(student => ['draft','reopened'].includes(student.submission_state)).length}/><Stat icon={Check} label="Submitted" value={detail.students.filter(student => student.submission_state === 'submitted').length}/></div>
      </section>

      {detail.portal.status !== 'closed' && <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="flex flex-wrap items-end justify-between gap-3 border-b p-5"><div><h3 className="font-bold">Awards and student access</h3><p className="mt-1 text-sm text-slate-600">Add an award, then find and select the students who may submit for it. Repeat for each award. A student can be assigned to more than one award.</p></div><div className="flex w-full flex-wrap gap-2 sm:w-auto"><label className="sr-only" htmlFor="add-portal-award">Add award</label><select id="add-portal-award" className="min-h-10 min-w-56 rounded-lg border border-slate-300 bg-white px-3 text-sm" value={addAwardId} onChange={event => setAddAwardId(event.target.value)}><option value="">Choose an award</option>{awards.filter(award => !(detail.awards || []).some(existing => existing.id === award.id)).map(award => <option key={award.id} value={award.id}>{award.name}</option>)}</select><button type="button" disabled={busy || !addAwardId} onClick={addAwardToPortal} className={primary}><Plus className="h-4 w-4"/>Add award</button></div></div>
        {(detail.award_groups || []).length ? <div className="divide-y">{detail.award_groups.map(group => {
          const assigned = detail.students.filter(student => student.access_status === 'active' && (student.awards || []).some(award => award.id === group.award.id))
          const pending = selectedStudentsByAward[group.award.id] || []
          const scoredCandidates = scoredCandidatesByAward[group.award.id]
          return <article key={group.award.id} className="p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h4 className="font-semibold text-slate-950">{group.award.name}</h4><p className="mt-1 text-sm text-slate-600">{group.selected_count} selected</p></div></div>
            {assigned.length > 0 && <p className="mt-3 text-sm text-slate-700">Selected: {assigned.map(student => student.full_name).join(', ')}</p>}
            <CalculatedResultsReference candidates={scoredCandidates} error={candidateErrorsByAward[group.award.id]} />
            <StudentPicker awardId={group.award.id} students={studentsByAward[group.award.id] || []} search={studentSearchByAward[group.award.id] || ''} selectedIds={pending} assigned={assigned} busy={busy} onSearch={value => { setStudentSearchByAward(current => ({ ...current, [group.award.id]: value })); setStudentsByAward(current => ({ ...current, [group.award.id]: [] })) }} onToggle={studentId => toggleAwardStudent(group.award.id, studentId)} />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><span className="text-sm text-slate-600">{pending.length} new selection{pending.length === 1 ? '' : 's'} for this award</span><button type="button" disabled={busy || pending.length === 0} onClick={() => saveAwardStudents(group.award.id)} className={primary}>Save student selections</button></div>
          </article>
        })}</div> : <p className="p-5 text-sm text-slate-600">No awards added yet. Add an award above to begin its student selection.</p>}</section>}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="border-b p-4"><h3 className="font-bold">Submitted portfolios by award</h3><p className="mt-1 text-sm text-slate-600">Each entry points to one submitted portfolio version. Evaluate each award using its own criteria.</p></div>{(detail.award_groups || []).some(group => group.students.length) ? <div className="divide-y">{detail.award_groups.filter(group => group.students.length).map(group => <div key={group.award.id} className="p-4"><h4 className="font-semibold">{group.award.name}</h4><ul className="mt-2 divide-y rounded-xl border border-slate-200">{group.students.map(student => <li key={`${group.award.id}-${student.student_profile_id}`} className="flex flex-wrap items-center justify-between gap-2 px-3 py-3"><span><strong>{student.full_name}</strong><span className="ml-2 text-sm text-slate-600">{student.institutional_id} · portfolio Version {student.version_number || 'current'}</span></span><span className="flex flex-wrap gap-2"><button type="button" className={button} onClick={() => showHistory(student)}>Review portfolio / history</button><button type="button" className={primary} onClick={() => navigate(`/osad/awards/${group.award.id}/candidates/${student.student_profile_id}/review`)}>Evaluate this award</button></span></li>)}</ul></div>)}</div> : <p className="p-5 text-sm text-slate-600">No final portfolios have been submitted for an assigned award yet.</p>}</section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="border-b p-4"><h3 className="font-bold">Student access and submission status</h3></div><div className="divide-y">{detail.students.map(student => <article key={student.access_id} className="p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="rounded-xl bg-emerald-50 p-2 text-emerald-800"><UserRound className="h-5 w-5"/></span><div><h4 className="font-semibold">{student.full_name}</h4><p className="text-sm text-slate-600">{student.institutional_id} · <Status state={student.submission_state} access={student.access_status}/></p><p className="mt-1 text-xs text-slate-600">Allowed awards: {(student.awards || []).map(award => award.name).join(', ') || 'None assigned'}</p></div></div><div className="flex flex-wrap gap-2">{student.current_submission_id && <button type="button" className={button} onClick={() => showHistory(student)}>Review portfolio / history</button>}{student.submission_state === 'submitted' && <button type="button" disabled={busy} className={button} onClick={() => { setReopenTarget(student); setReopenReason(''); setAckException(false) }}>Reopen for correction</button>}{student.submission_state === 'submitted' && !student.evaluation_started_at && <button type="button" disabled={busy} className={button} onClick={() => mutate(() => portfolioSubmissionPortalService.startEvaluation(detail.portal.id, student.student_profile_id))}>Mark evaluation started</button>}{student.access_status === 'active' && student.submission_state !== 'submitted' && <button type="button" disabled={busy} className={button} onClick={() => mutate(() => portfolioSubmissionPortalService.revokeStudent(detail.portal.id, student.student_profile_id))}>Revoke access</button>}</div></div>{student.evaluation_started_at && <p className="mt-2 text-xs text-amber-800">Evaluation started {student.evaluation_started_at}; any reopening is tracked as an evaluation exception.</p>}{(student.history || []).length > 0 && <details className="mt-3 text-sm"><summary className="cursor-pointer font-semibold text-slate-700">Access and correction history ({student.history.length})</summary><ol className="mt-2 space-y-1">{student.history.map(item => <li key={item.id}>{item.event_type.replaceAll('_', ' ')} · {item.occurred_at}{item.reason ? ` · ${item.reason}` : ''}{Number(item.evaluation_exception) ? ' · evaluation exception' : ''}</li>)}</ol></details>}</article>)}{detail.students.length === 0 && <p className="p-6 text-sm text-slate-600">No student accounts have been selected yet.</p>}</div></section>
      {history && <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between gap-3"><h3 className="font-bold">Submission history</h3><button className={button} onClick={() => { setHistory(null); setVersion(null) }}>Close</button></div><div className="flex flex-wrap gap-2">{history.versions.map(item => <button key={item.id} className={version?.id === item.id ? primary : button} onClick={() => setVersion(item)}>Version {item.version_number} · {item.status}</button>)}</div>{reviewSnapshot && <PortfolioSubmissionDocument snapshot={{ ...reviewSnapshot, version: version.version_number, submitted_at: version.submitted_at }} downloadFile={downloadFile} onPrint={() => window.print()}/>}</section>}
      {reopenTarget && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4"><section role="dialog" aria-modal="true" aria-labelledby="reopen-title" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"><h2 id="reopen-title" className="text-lg font-bold">Reopen {reopenTarget.full_name}’s submission?</h2><p className="mt-2 text-sm text-slate-600">The previous final version will remain preserved. The student must submit a new version after making the correction.</p><label className="mt-4 block text-sm font-semibold">Reason for correction<textarea className="mt-1 min-h-24 w-full rounded-xl border border-slate-300 p-3" value={reopenReason} onChange={event => setReopenReason(event.target.value)} placeholder="Explain what needs to be corrected"/></label>{ackRequired && <label className="mt-4 flex gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950"><input type="checkbox" checked={ackException} onChange={event => setAckException(event.target.checked)}/><span>Evaluation has already started. Reopening is an exception and may affect the evaluation record; acknowledge and record this exception.</span></label>}<div className="mt-5 flex justify-end gap-2"><button type="button" className={button} onClick={() => setReopenTarget(null)}>Cancel</button><button type="button" disabled={busy || reopenReason.trim().length < 8 || (ackRequired && !ackException)} className={primary} onClick={() => reopen(reopenTarget.student_profile_id, ackException)}>Reopen for correction</button></div></section></div>}
    </> : <>
      <form onSubmit={createPortal} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <section className="border-b border-slate-200 p-5 sm:p-6" aria-labelledby="portal-details-heading">
          <div className="flex items-start gap-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-900">1</span>
            <div>
              <h2 id="portal-details-heading" className="text-lg font-bold text-slate-950">Portal details</h2>
              <p className="mt-1 text-sm text-slate-600">Name the portal and set the dates students can submit.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-slate-800">Portal name
              <input required maxLength={180} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 font-normal focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20" value={portalTitle} onChange={event => setPortalTitle(event.target.value)} placeholder="e.g. Student Honors Portfolio" />
            </label>
            <div className="text-sm font-semibold text-slate-800">Award year
              <div aria-live="polite" className="mt-1.5 flex min-h-11 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 font-normal text-slate-700">{awardYear ? `AY ${awardYear}` : 'Loading award year…'}</div>
              <p className="mt-1 text-xs font-normal text-slate-600">Set by the system.</p>
            </div>
            <label className="text-sm font-semibold text-slate-800">Start date
              <input required type="date" min={today} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 font-normal focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20" value={startDate} onChange={event => setStartDate(event.target.value)} />
              <span className="mt-1 block text-xs font-normal text-slate-600">Choose today or a future date. Students can submit starting on this date.</span>
            </label>
            <label className="text-sm font-semibold text-slate-800">End date
              <input required type="date" min={startDate || undefined} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 font-normal focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20" value={endDate} onChange={event => setEndDate(event.target.value)} />
              <span className="mt-1 block text-xs font-normal text-slate-600">The portal closes after this date.</span>
            </label>
          </div>
        </section>

        <section className="p-5 sm:p-6" aria-labelledby="portal-awards-heading">
          <div className="flex items-start gap-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-900">2</span>
            <div>
              <h2 id="portal-awards-heading" className="text-lg font-bold text-slate-950">Choose awards and students</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">Add an award, then find and select the students who may submit for it. Repeat for each award. A student can be assigned to more than one award.</p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="w-full sm:max-w-md">
              <label className="mb-1.5 block text-sm font-semibold text-slate-800" htmlFor="setup-award">Award</label>
              <select id="setup-award" className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm" value={addAwardId} onChange={event => setAddAwardId(event.target.value)}>
                <option value="">Choose an award</option>
                {awards.filter(award => !setupAwards.some(existing => existing.id === award.id)).map(award => <option key={award.id} value={award.id}>{award.name}</option>)}
              </select>
            </div>
            <button type="button" disabled={busy || !addAwardId} onClick={addSetupAward} className={`${primary} min-h-11 shrink-0`}><Plus className="h-4 w-4" />Add award</button>
          </div>

          {setupAwards.length ? <div className="mt-5 divide-y divide-slate-200 rounded-xl border border-slate-200">
            {setupAwards.map(award => {
              const pending = selectedStudentsByAward[award.id] || []
              const candidates = scoredCandidatesByAward[award.id]
              const students = studentsByAward[award.id] || []
              return <article key={award.id} className="p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-950">{award.name}</h3>
                    <p className="mt-1 text-sm text-slate-600">{pending.length} student{pending.length === 1 ? '' : 's'} selected</p>
                  </div>
                  <button type="button" disabled={busy} onClick={() => removeSetupAward(award.id)} className={button}>Remove award</button>
                </div>

                <CalculatedResultsReference candidates={candidates} error={candidateErrorsByAward[award.id]} />
                <p className="mt-3 text-sm text-slate-600">Calculated results can help with your decision. They do not select students or give portal access.</p>

                <label className="mt-4 block max-w-2xl text-sm font-semibold text-slate-800">
                  Search student accounts
                  <span className="relative mt-1.5 block">
                    <Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input className="min-h-11 w-full rounded-lg border border-slate-300 pl-9 pr-3 font-normal focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20" value={studentSearchByAward[award.id] || ''} onChange={event => { setStudentSearchByAward(current => ({ ...current, [award.id]: event.target.value })); setStudentsByAward(current => ({ ...current, [award.id]: [] })) }} placeholder="Type a name or student ID" />
                  </span>
                </label>

                <StudentSearchResults students={students} search={studentSearchByAward[award.id] || ''} selectedIds={pending} busy={busy} onToggle={studentId => toggleAwardStudent(award.id, studentId)} />
                <p className="mt-3 text-sm text-slate-600">{pending.length} selected. Your selections stay checked when you search again.</p>
              </article>
            })}
          </div> : <p className="mt-5 rounded-lg bg-slate-50 px-4 py-5 text-sm text-slate-600">Choose an award above to start selecting its students.</p>}
        </section>

        <section className="border-t border-slate-200 bg-slate-50/70 p-5 sm:p-6" aria-labelledby="portal-review-heading">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 id="portal-review-heading" className="font-bold text-slate-950">3. Review and create</h2>
              {setupRequirements.length ? <p className="mt-1 text-sm text-slate-700">Before creating the portal, complete: {setupRequirements.join(', ')}.</p> : <p className="mt-1 text-sm leading-6 text-slate-700">{setupAwards.length} award{setupAwards.length === 1 ? '' : 's'} · {setupSelectionCount} student assignment{setupSelectionCount === 1 ? '' : 's'} · {startDate} to {endDate}. Creating the portal opens it for selected students.</p>}
            </div>
            <button type="submit" disabled={!canCreatePortal} className={`${primary} w-full shrink-0 sm:w-auto`}><FileCheck2 className="h-4 w-4" />{busy ? 'Creating portal…' : 'Create Portal'}</button>
          </div>
        </section>
      </form>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="border-b p-4"><h2 className="font-bold">Submission portals</h2></div>{loading ? <p className="p-5 text-sm text-slate-600">Loading portals…</p> : portals.length ? <div className="divide-y">{portals.map(item => <button type="button" key={item.id} onClick={() => openPortal(item.id)} className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50"><span><strong className="block">{item.title}</strong><span className="text-sm text-slate-600">Award year: {item.award_period || 'not recorded'} · {item.start_date || 'Start date not set'} to {item.end_date || 'End date not set'} · {item.selected_count || 0} selected · {item.submitted_count || 0} submitted · {item.draft_count || 0} in progress</span></span><span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold capitalize">{item.status}</span></button>)}</div> : <p className="p-5 text-sm text-slate-600">No submission portals yet.</p>}</section>
    </>}
  </div>
}

function CalculatedResultsReference({ candidates, error }) {
  return <details className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/40 p-3">
    <summary className="cursor-pointer text-sm font-semibold text-slate-800">View calculated results <span className="font-normal text-slate-600">(OSAD reference only)</span></summary>
    <p className="mt-2 text-sm leading-5 text-slate-600">These scores may help guide your choice. Selecting a student below is what grants portal access.</p>
    {error ? <p className="mt-3 text-sm text-amber-900">Calculated results are currently unavailable. You can still search for and select any student account.</p>
      : candidates === null || candidates === undefined ? <p className="mt-3 text-sm text-slate-600">Loading calculated results…</p>
      : candidates.length === 0 ? <p className="mt-3 text-sm text-slate-600">No calculated results are available for this award. You can still search for any student account.</p>
      : <div className="mt-3 max-h-52 divide-y overflow-y-auto rounded-lg border border-emerald-100 bg-white">{candidates.map((candidate, index) => <div key={candidate.student_id || candidate.student_profile_id || index} className="flex items-center justify-between gap-3 px-3 py-2">
        <span><strong className="block">{candidate.student_name || candidate.full_name || 'Student'}</strong><span className="text-sm text-slate-600">{candidate.student_id_number || candidate.institutional_id || 'Student account'}</span></span>
        <span className="whitespace-nowrap text-right text-sm font-semibold tabular-nums">{candidate.raw_portfolio_score ?? 0} / {candidate.computable_max_score ?? 0}<span className="block text-xs font-normal text-slate-500">{candidate.portfolio_potential_score ?? 0}%</span></span>
      </div>)}</div>}
  </details>
}

function StudentSearchResults({ students, search, selectedIds, busy, onToggle }) {
  if (!search.trim()) return <p className="mt-3 rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-600">Type a student name or ID to find an account.</p>
  if (!students.length) return <p className="mt-3 rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-600">No matching student accounts found. Try another name or ID.</p>
  return <div className="mt-3 max-h-56 divide-y overflow-y-auto rounded-xl border border-slate-200">{students.map(student => <label key={student.id} className="flex cursor-pointer items-center gap-3 px-3 py-3 hover:bg-slate-50"><input type="checkbox" disabled={busy} checked={selectedIds.includes(student.id)} onChange={() => onToggle(student.id)} /><span><strong className="block">{student.full_name}</strong><span className="text-sm text-slate-600">{student.institutional_id || student.student_id || student.email || 'Student account'}</span></span></label>)}</div>
}

function StudentPicker({ students, search, selectedIds, assigned, busy, onSearch, onToggle }) {
  const alreadySelected = new Set(assigned.map(student => student.student_profile_id))
  return <>
    <label className="mt-4 block max-w-2xl text-sm font-semibold text-slate-800">Find student accounts
      <span className="relative mt-1.5 block"><Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input className="min-h-11 w-full rounded-lg border border-slate-300 pl-9 pr-3 font-normal focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20" value={search} onChange={event => onSearch(event.target.value)} placeholder="Type a name or student ID" /></span>
    </label>
    {!search.trim() ? <p className="mt-3 rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-600">Type a student name or ID to find an account.</p>
      : !students.length ? <p className="mt-3 rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-600">No matching student accounts found. Try another name or ID.</p>
      : <div className="mt-3 max-h-56 divide-y overflow-y-auto rounded-xl border border-slate-200">{students.map(student => {
        const assignedAlready = alreadySelected.has(student.id)
        return <label key={student.id} className={`flex items-center gap-3 px-3 py-3 ${assignedAlready ? 'cursor-not-allowed bg-slate-50' : 'cursor-pointer hover:bg-slate-50'}`}><input type="checkbox" disabled={assignedAlready || busy} checked={assignedAlready || selectedIds.includes(student.id)} onChange={() => onToggle(student.id)} /><span><strong className="block">{student.full_name}</strong><span className="text-sm text-slate-600">{student.institutional_id || student.student_id || student.email || 'Student account'}{assignedAlready ? ' · already selected' : ''}</span></span></label>
      })}</div>}
    <p className="mt-3 text-sm text-slate-600">Your checked choices stay selected when you search for another student.</p>
  </>
}

function Stat({ icon: Icon, label, value }) { return <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4"><Icon className="h-5 w-5 text-emerald-800"/><div><div className="text-xl font-bold">{value}</div><div className="text-sm text-slate-600">{label}</div></div></div> }
function Status({ state, access }) { return <span className="capitalize">{access === 'revoked' ? 'access revoked' : (state || 'not started').replaceAll('_', ' ')}</span> }
async function portfolioServiceAwards() {
  const module = await import('../../services/portfolioService')
  return module.default.fetchAwards()
}
