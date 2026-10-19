import React, { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ClipboardCheck, FileCheck2, Plus, ShieldCheck } from 'lucide-react'
import OSADPageHeader from '../../components/osad/OSADPageHeader'
import PortfolioSubmissionDocument from '../../components/student/PortfolioSubmissionDocument'
import portfolioService from '../../services/portfolioService'
import portfolioSubmissionPortalService from '../../services/portfolioSubmissionPortalService'

export default function StudentPortfolioSubmissionPortalPage() {
  const { portalId } = useParams()
  const navigate = useNavigate()
  const [portals, setPortals] = useState([])
  const [portal, setPortal] = useState(null)
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [selectedAwardIds, setSelectedAwardIds] = useState([])

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const available = await portfolioSubmissionPortalService.listStudentPortals()
      setPortals(available)
      if (portalId) {
        const detail = await portfolioSubmissionPortalService.getStudentPortal(portalId)
        setPortal(detail)
        setSelectedAwardIds((detail.submission?.awards || []).map(award => award.id))
        if (detail.can_edit) setRecords(await portfolioService.fetchRecords())
        else setRecords([])
      } else setPortal(null)
    } catch (reason) {
      setPortal(null); setError(reason?.response?.data?.error?.message || reason?.message || 'This submission portal is not available.')
    } finally { setLoading(false) }
  }, [portalId])

  useEffect(() => { load() }, [load])

  const submit = async () => {
    if (!portalId) return
    setSaving(true); setError(''); setNotice('')
    try {
      await portfolioSubmissionPortalService.submitStudentPortfolio(portalId, selectedAwardIds)
      setConfirming(false)
      setNotice('Your portfolio was submitted and is now locked. OSAD can reopen it if a correction is needed.')
      await load()
    } catch (reason) {
      setError(reason?.response?.data?.error?.message || reason?.message || 'The portfolio could not be submitted.')
    } finally { setSaving(false) }
  }

  const rawUser = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}') } catch { return {} } })()
  const student = { name: rawUser.full_name || rawUser.name || portal?.student?.name || 'Student', student_id: rawUser.institutional_id || rawUser.student_id || portal?.student?.student_id || '' }
  const preview = records.map(record => ({
    ...record,
    record_id: record.id,
    title: record.title,
    category: record.category_name || record.category,
    subcategory: record.subcategory_name || record.subcategory,
    start_date: record.start_date || record.occurrence_date,
    verification_status: record.status,
    details: typeof record.structured_metadata === 'string' ? (() => { try { return JSON.parse(record.structured_metadata) } catch { return {} } })() : record.structured_metadata,
    evidence: record.evidence || []
  }))
  const snapshot = portal?.submission ? { ...portal.submission, submitted_at: portal.submission.submitted_at } : { name: 'Portfolio Submission', student, awards: (portal?.awards || []).filter(award => selectedAwardIds.includes(award.id)) }
  const previewDownload = file => portfolioService.downloadEvidence(file.id)
  const finalDownload = file => portfolioSubmissionPortalService.downloadStudentFile(portalId, portal.submission.submission_id || portal.submission.id, file.id)

  if (loading) return <div className="mx-auto max-w-5xl animate-pulse rounded-2xl bg-white p-10 text-sm text-slate-500">Loading Portfolio Submission…</div>
  if (!portalId) return <div className="space-y-5"><OSADPageHeader title="Portfolio Submission" description="Review and submit your student portfolio when OSAD opens access." icon={FileCheck2} />
    {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
    {portals.length === 0 ? <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center"><ShieldCheck className="mx-auto h-9 w-9 text-slate-400"/><h2 className="mt-3 font-bold">No portfolio submission is open for your account</h2><p className="mt-1 text-sm text-slate-600">When OSAD grants you access, the submission portal will appear here.</p></section>
      : <section className="divide-y overflow-hidden rounded-2xl border border-slate-200 bg-white">{portals.map(item => <button key={item.id} type="button" onClick={() => navigate(`/student/portfolio-submissions/${item.id}`)} className="flex min-h-20 w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-emerald-50"><span><strong className="block">Portfolio Submission</strong><span className="mt-1 block text-sm text-slate-600">{item.submission_state === 'submitted' ? 'Submitted · view your final portfolio' : item.submission_state === 'reopened' ? 'Reopened for correction' : 'In progress · complete and review your portfolio'}</span><span className="mt-1 block text-xs text-slate-500">Submission period: {item.start_date || 'not set'} to {item.end_date || 'not set'}</span></span><span className="font-semibold text-emerald-800">Open →</span></button>)}</section>}
  </div>

  return <div className="space-y-5">
    <button type="button" onClick={() => navigate('/student/portfolio-submissions')} className="print-hide inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-emerald-800"><ArrowLeft className="h-4 w-4"/>All submissions</button>
    <OSADPageHeader title="Portfolio Submission" description="Enter, review, and submit your complete portfolio." icon={FileCheck2} />
    {(portal?.portal?.start_date || portal?.portal?.end_date) && <p className="print-hide rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">Submission period: <strong>{portal.portal.start_date || 'not set'} to {portal.portal.end_date || 'not set'}</strong></p>}
    {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{notice}</p>}
    {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
    {portal?.can_edit && <section className="print-hide flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
      <div><p className="font-bold text-emerald-950">{portal.portal.status === 'reopened' ? 'Correction requested' : 'Your portfolio is open for submission'}</p><p className="mt-1 text-sm text-emerald-900">Add or update accomplishments and attach their supporting files, then return here to review the complete portfolio.</p></div>
      <Link to="/student/achievements" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900"><Plus className="h-4 w-4"/>Manage accomplishments</Link>
    </section>}
    {portal?.can_edit ? <>
      <section className="print-hide rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-bold">Select the awards for this portfolio submission.</h2><p className="mt-1 text-sm text-slate-600">Choose one or more awards assigned to you by OSAD. Your portfolio will be submitted once and shared with each award you select.</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{(portal.awards || []).map(award => <label key={award.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 hover:bg-slate-50"><input type="checkbox" checked={selectedAwardIds.includes(award.id)} onChange={() => setSelectedAwardIds(current => current.includes(award.id) ? current.filter(id => id !== award.id) : [...current, award.id])}/><span className="font-medium">{award.name}</span></label>)}</div>{(portal.awards || []).length === 0 && <p className="mt-3 text-sm text-rose-800">OSAD has not assigned any awards to this portal access yet. Contact OSAD before submitting.</p>}</section>
      <section className="print-hide rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><strong>Review before submitting.</strong> Check every accomplishment and supporting file below. Final submission locks your portfolio. You will be able to view it afterward; changes require OSAD to reopen it for correction.</section>
      <PortfolioSubmissionDocument snapshot={snapshot} previewRecords={preview} downloadFile={previewDownload} onPrint={() => window.print()} />
      {!confirming ? <button type="button" disabled={records.length === 0 || selectedAwardIds.length === 0} onClick={() => setConfirming(true)} className="print-hide inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-800 px-5 font-bold text-white disabled:opacity-50"><ClipboardCheck className="h-4 w-4"/>Submit final portfolio</button>
        : <section className="print-hide rounded-2xl border border-slate-300 bg-white p-5"><h2 className="font-bold">Submit and lock this portfolio?</h2><p className="mt-1 text-sm text-slate-600">This saves a final version with copies of the supporting files. You cannot edit it unless OSAD reopens it.</p><div className="mt-4 flex flex-wrap justify-end gap-2"><button type="button" onClick={() => setConfirming(false)} className="min-h-10 rounded-lg border px-4 font-semibold">Continue reviewing</button><button type="button" disabled={saving} onClick={submit} className="min-h-10 rounded-lg bg-emerald-800 px-4 font-semibold text-white">{saving ? 'Submitting…' : 'Confirm submission'}</button></div></section>}
    </> : portal?.submission ? <>
      <section className="print-hide rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950"><strong>Final submission is locked.</strong> This is your saved Version {portal.submission.version}. Contact OSAD if a correction is needed.</section>
      <PortfolioSubmissionDocument snapshot={snapshot} downloadFile={finalDownload} onPrint={() => window.print()} />
    </> : <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center"><h2 className="font-bold">Submission unavailable</h2><p className="mt-1 text-sm text-slate-600">This portal is closed or OSAD has not selected your account.</p></section>}
  </div>
}
