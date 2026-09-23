import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { X, Building2, Mail, Hash, ClipboardList, FolderOpen } from 'lucide-react'

const tabs = ['Overview', 'Portfolio', 'Assignments', 'Evaluation Summary']

function Field({ label, children }) {
  return <div><dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</dt><dd className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{children || 'Not recorded'}</dd></div>
}

export default function PersonnelDetailDrawer({ isOpen, onClose, person = null }) {
  const [activeTab, setActiveTab] = useState('Overview')
  const closeRef = useRef(null)
  const panelRef = useRef(null)
  const previousFocusRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return undefined
    previousFocusRef.current = document.activeElement
    closeRef.current?.focus()
    const handleKeyDown = event => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'Tab' && panelRef.current) {
        const focusable = [...panelRef.current.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
        if (!focusable.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      previousFocusRef.current?.focus?.()
    }
  }, [isOpen, onClose])

  useEffect(() => { if (isOpen) setActiveTab('Overview') }, [isOpen, person?.id])

  const functionalResponsibilities = useMemo(() => (person?.assigned_roles || [])
    .map(role => typeof role === 'object' ? (role.role_key || role.name) : role)
    .filter(role => ['program_coordinator', 'organization_moderator'].includes(role)), [person])
  const deanAppointment = (person?.assigned_roles || []).some(role => (typeof role === 'object' ? role.role_key : role) === 'dean')
  const placement = person?.college_name || person?.college || person?.department_name || person?.administrative_unit_name

  if (!isOpen || !person) return null

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/55" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
      <section ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="personnel-panel-title" className="ml-auto flex h-full w-full flex-col bg-white shadow-[-18px_0_48px_rgba(15,23,42,0.2)] dark:bg-slate-950 md:w-4/5 lg:w-[55vw] lg:max-w-5xl">
        <header className="flex items-start justify-between gap-5 border-b border-slate-200 px-5 py-5 dark:border-slate-800 sm:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-800 text-sm font-black text-white">
              {person.full_name?.split(' ').map(name => name[0]).slice(0, 2).join('') || 'PN'}
            </div>
            <div className="min-w-0"><h2 id="personnel-panel-title" className="truncate text-xl font-black text-slate-950 dark:text-white">{person.full_name}</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Personnel details in organizational context</p></div>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close personnel details" className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-slate-300 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 px-5 dark:border-slate-800 sm:px-8" aria-label="Personnel detail sections" role="tablist">
          {tabs.map(tab => <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} onClick={() => setActiveTab(tab)} className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${activeTab === tab ? 'border-emerald-700 text-emerald-800 dark:text-emerald-300' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>{tab}</button>)}
        </nav>

        <div className="flex-1 overflow-y-auto px-5 py-7 sm:px-8">
          {activeTab === 'Overview' && <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <section><h3 className="text-base font-black text-slate-950 dark:text-white">Personnel information</h3><dl className="mt-5 grid gap-6 sm:grid-cols-2">
              <Field label="Institutional ID"><span className="inline-flex items-center gap-2"><Hash className="h-4 w-4" />{person.institutional_id}</span></Field>
              <Field label="Email"><span className="inline-flex items-center gap-2"><Mail className="h-4 w-4" />{person.institutional_email || person.email}</span></Field>
              <Field label="Job title">{person.position_title || person.designation}</Field>
              <Field label="Academic rank">{person.current_rank_title || person.academic_rank}</Field>
              <Field label="Employment status">{person.employment_status}</Field>
              <Field label="Personnel classification">{person.classification_label || person.personnel_group}</Field>
            </dl></section>
            <aside className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-900"><h3 className="text-base font-black text-slate-950 dark:text-white">Current placement</h3><div className="mt-4 flex gap-3"><Building2 className="mt-0.5 h-5 w-5 text-emerald-700" /><div><p className="font-bold text-slate-900 dark:text-white">{placement || 'No active placement'}</p><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{person.college_code || person.department_code || person.administrative_unit_code}</p></div></div></aside>
          </div>}

          {activeTab === 'Portfolio' && <section><h3 className="text-base font-black text-slate-950 dark:text-white">Portfolio</h3><p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">A concise view of this Faculty member’s submitted evidence and verified accomplishments.</p><div className="mt-6 flex items-center gap-4 rounded-2xl bg-slate-50 p-5 dark:bg-slate-900"><FolderOpen className="h-7 w-7 text-emerald-700" /><div><p className="text-2xl font-black text-slate-950 dark:text-white">{person.verified_accomplishments_count ?? 0}</p><p className="text-sm text-slate-600 dark:text-slate-300">Verified accomplishments</p></div></div></section>}

          {activeTab === 'Assignments' && <section><h3 className="text-base font-black text-slate-950 dark:text-white">Assignments</h3><div className="mt-5 grid gap-5 sm:grid-cols-2"><Field label="Organizational placement">{placement}</Field><Field label="Formal appointment">{deanAppointment ? 'Dean' : 'No formal appointment'}</Field><Field label="Functional responsibilities">{functionalResponsibilities.length ? functionalResponsibilities.map(role => role.replaceAll('_', ' ')).join(', ') : 'None assigned'}</Field><Field label="Programs">{(person.programs || []).map(program => program.name || program.code || program).join(', ')}</Field></div></section>}

          {activeTab === 'Evaluation Summary' && <section><h3 className="text-base font-black text-slate-950 dark:text-white">Evaluation summary</h3><div className="mt-5 grid gap-5 sm:grid-cols-2"><Field label="Latest status">{person.latest_evaluation_status || person.evaluation_status}</Field><Field label="Latest score">{person.latest_evaluation_score || person.evaluation_score}</Field></div><div className="mt-7 flex flex-wrap gap-3"><Link to={`/hr/evaluation-submissions?personnel_id=${encodeURIComponent(person.id)}`} className="inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"><ClipboardList className="h-4 w-4" />Open Full Evaluation Record</Link><Link to={`/hr/personnel/${encodeURIComponent(person.id)}/rank-placement`} className="inline-flex items-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">Rank &amp; Placement</Link></div></section>}
        </div>
      </section>
    </div>
  )
}
