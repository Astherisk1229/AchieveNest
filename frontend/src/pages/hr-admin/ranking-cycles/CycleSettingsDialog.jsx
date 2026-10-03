import React, { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText } from 'lucide-react'
import {
  addRankingCycleCoverage, getRankingCycle, transitionPersonnelEvaluationPeriod, updateRankingCycleAchievementCoverage, updateRankingCycleSchedule,
} from '../../../services/personnelEvaluationPeriodService'
import RankingCycleDialog, { LockedBadge, buttonStyles, errorMessage, inputClass } from './RankingCycleDialog'
import CriteriaPreviewDialog from './CriteriaPreviewDialog'
import { CoverageToggle, CriteriaRows, DateRange, useActiveCriteria } from './NewRankingCycleDialog'
import {
  GROUPS, GROUP_LABELS, conflictingGroups, criteriaLabel, dateOnly, formatDate, formatRange, localToday, validateCycleDraft,
} from './rankingCyclePresentation'

export const SETTINGS_SECTIONS = [
  ['general', 'General'],
  ['schedule', 'Schedule'],
  ['achievement-coverage', 'Achievement Coverage'],
  ['coverage', 'Personnel Coverage'],
  ['criteria', 'Criteria'],
  ['lifecycle', 'Lifecycle'],
]

const TRACK_STATUS = {
  DRAFT: 'Not yet open for submissions',
  OPEN_FOR_SUBMISSION: 'Submissions open',
  SUBMISSION_CLOSED: 'Submissions closed',
  EVALUATION_ONGOING: 'Evaluation in progress',
  CLOSED: 'Completed',
  ARCHIVED: 'Archived',
}
// The existing period lifecycle, unchanged: one forward step at a time.
const NEXT_ACTION = {
  DRAFT: ['open-submissions', 'Open Submissions'],
  OPEN_FOR_SUBMISSION: ['close-submissions', 'Close Submissions'],
  SUBMISSION_CLOSED: ['start-evaluation', 'Start Evaluation'],
  EVALUATION_ONGOING: ['close', 'Complete Evaluation'],
}

const Notice = ({ tone = 'info', children }) => <p role={tone === 'error' ? 'alert' : undefined} className={`rounded-lg px-3 py-2.5 text-sm font-semibold ${tone === 'error' ? 'bg-rose-50 text-rose-800 dark:bg-rose-950/30 dark:text-rose-200' : tone === 'success' ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200' : 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300'}`}>{children}</p>
const Row = ({ label, children }) => <div className="grid gap-1 py-2.5 text-sm sm:grid-cols-[11rem_1fr] sm:gap-4"><dt className="text-slate-500 dark:text-slate-400">{label}</dt><dd className="font-semibold text-slate-900 dark:text-slate-100">{children}</dd></div>

function General({ cycle }) {
  return <dl className="divide-y divide-slate-200 dark:divide-slate-800">
    <Row label="Cycle name">{cycle.display_name}<span className="block text-xs font-normal text-slate-500">Generated from the academic year and personnel coverage.</span></Row>
    <Row label="Academic year">{cycle.academic_year.replace('-', '–')}{cycle.track_count > 0 && <span className="block text-xs font-normal text-slate-500">Locked once personnel coverage is configured.</span>}</Row>
    <Row label="Status">{cycle.lifecycle_status?.label}</Row>
    <Row label="Current stage">{cycle.current_stage?.label || 'Not started'}</Row>
    <Row label="Created">{formatDate(cycle.created_at)}{cycle.created_by_label ? ` · ${cycle.created_by_label}` : ''}</Row>
    {cycle.is_legacy && <Row label="Record origin">Migrated from an earlier ranking period</Row>}
  </dl>
}

// Which accomplishments belong to this cycle. Separate from the submission and evaluation windows.
function AchievementCoverage({ cycle, onSaved }) {
  const current = cycle.achievement_coverage
  const editable = Boolean(cycle.coverage_editable)
  const [form, setForm] = useState({ coverage_start: current?.start || '', coverage_end: current?.end || '' })
  const [state, setState] = useState({ saving: false, error: '', saved: false })
  const formError = !form.coverage_start || !form.coverage_end ? 'Enter both dates.' : form.coverage_start > form.coverage_end ? 'The coverage must end on or after its start.' : ''
  const save = async () => {
    setState({ saving: true, error: '', saved: false })
    try { await updateRankingCycleAchievementCoverage(cycle.id, form); setState({ saving: false, error: '', saved: true }); onSaved() }
    catch (failure) { setState({ saving: false, error: errorMessage(failure, 'The achievement coverage could not be saved.'), saved: false }) }
  }
  return <div className="space-y-4">
    <dl className="divide-y divide-slate-200 dark:divide-slate-800">
      <Row label="Achievement coverage">{current ? formatRange(current.start, current.end) : 'Not set'}<span className="block text-xs font-normal text-slate-500">Accomplishments dated in this range (or, for degrees, obtained by its end) are copied into submitted portfolios. Older records stay in each portfolio but are not scored in this cycle.</span></Row>
    </dl>
    {!current && <Notice tone="error">Set the achievement coverage before opening submissions.</Notice>}
    {!editable && <Notice>{cycle.is_read_only ? 'This period is read-only.' : 'The achievement coverage is locked because portfolios have already been submitted for this cycle.'}</Notice>}
    {editable && <div className="space-y-4 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
      <DateRange idPrefix="settings-achievement-coverage" label="Achievement coverage" start={form.coverage_start} end={form.coverage_end} onStart={value => setForm({ ...form, coverage_start: value })} onEnd={value => setForm({ ...form, coverage_end: value })}/>
      {form.coverage_start && form.coverage_end && formError && <Notice tone="error">{formError}</Notice>}
      {state.error && <Notice tone="error">{state.error}</Notice>}
      {state.saved && <Notice tone="success">Achievement coverage saved.</Notice>}
      <div className="flex justify-end"><button type="button" onClick={save} disabled={Boolean(formError) || state.saving} className={buttonStyles.primary}>{state.saving ? 'Saving…' : 'Save Coverage'}</button></div>
    </div>}
  </div>
}

function Schedule({ cycle, onSaved }) {
  const editable = !cycle.is_read_only && cycle.tracks.length > 0 && cycle.tracks.every(track => ['DRAFT', 'OPEN_FOR_SUBMISSION'].includes(track.status))
  const needsReason = cycle.tracks.some(track => track.status !== 'DRAFT')
  const [form, setForm] = useState(() => ({
    submission_open_at: dateOnly(cycle.schedule?.submission_open_at), submission_close_at: dateOnly(cycle.schedule?.submission_close_at),
    evaluation_start_at: dateOnly(cycle.schedule?.evaluation_start_at), evaluation_end_at: dateOnly(cycle.schedule?.evaluation_end_at), reason: '',
  }))
  const [state, setState] = useState({ saving: false, error: '', saved: false })
  const { errors } = validateCycleDraft({ ...form, academic_year: cycle.academic_year, coverage: 'BOTH' }, { criteria: { FACULTY: { phase: 'ready' }, NON_TEACHING_FACULTY: { phase: 'ready' } } })
  const scheduleError = errors.submission || errors.evaluation
  const reasonMissing = needsReason && form.reason.trim().length < 10
  const save = async () => {
    setState({ saving: true, error: '', saved: false })
    try { await updateRankingCycleSchedule(cycle.id, form); setState({ saving: false, error: '', saved: true }); onSaved() }
    catch (failure) { setState({ saving: false, error: errorMessage(failure, 'The schedule could not be saved.'), saved: false }) }
  }
  return <div className="space-y-4">
    <dl className="divide-y divide-slate-200 dark:divide-slate-800">
      {cycle.tracks.map(track => <Row key={track.id} label={track.personnel_group_label}>Submission {formatRange(track.submission_open_at, track.submission_close_at)}<span className="block">Evaluation {formatRange(track.evaluation_start_at, track.evaluation_end_at)}</span></Row>)}
    </dl>
    {!editable && <Notice>{cycle.is_read_only ? 'This period is read-only. Its schedule is kept as historical record.' : cycle.tracks.length ? 'The schedule can no longer change after submissions have closed.' : 'Set the schedule under Personnel Coverage to complete this cycle.'}</Notice>}
    {editable && <div className="space-y-4 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
      <div className="grid gap-4">
        <div><p className="mb-1.5 text-sm font-bold">Submission Period</p><DateRange idPrefix="settings-submission" label="Submission period" start={form.submission_open_at} end={form.submission_close_at} onStart={value => setForm({ ...form, submission_open_at: value })} onEnd={value => setForm({ ...form, submission_close_at: value })}/></div>
        <div><p className="mb-1.5 text-sm font-bold">Evaluation Period</p><DateRange idPrefix="settings-evaluation" label="Evaluation period" start={form.evaluation_start_at} end={form.evaluation_end_at} onStart={value => setForm({ ...form, evaluation_start_at: value })} onEnd={value => setForm({ ...form, evaluation_end_at: value })}/></div>
      </div>
      {needsReason && <label className="block"><span className="text-sm font-bold">Reason for change</span><textarea rows={2} value={form.reason} onChange={event => setForm({ ...form, reason: event.target.value })} className={`${inputClass} mt-1.5 h-auto py-2`} placeholder="Required once submissions are open (10–500 characters)"/></label>}
      {scheduleError && <Notice tone="error">{scheduleError}</Notice>}
      {state.error && <Notice tone="error">{state.error}</Notice>}
      {state.saved && <Notice tone="success">Schedule saved for every personnel group in this cycle.</Notice>}
      <div className="flex justify-end"><button type="button" onClick={save} disabled={Boolean(scheduleError) || reasonMissing || state.saving} className={buttonStyles.primary}>{state.saving ? 'Saving…' : 'Save Schedule'}</button></div>
    </div>}
  </div>
}

function Coverage({ cycle, cycles, onSaved }) {
  const present = cycle.tracks.map(track => track.personnel_group)
  const missing = GROUPS.filter(group => !present.includes(group))
  const [groups, setGroups] = useState(present.length ? present : [...GROUPS])
  const [dates, setDates] = useState({ submission_open_at: '', submission_close_at: '', evaluation_start_at: '', evaluation_end_at: '' })
  const [state, setState] = useState({ saving: false, error: '' })
  const key = useRef(crypto.randomUUID())
  const criteria = useActiveCriteria(GROUPS)
  const [viewing, setViewing] = useState(null)
  const conflicts = useMemo(() => conflictingGroups(cycles, cycle.academic_year, cycle.id), [cycles, cycle])
  const adding = groups.filter(group => !present.includes(group))
  const needsSchedule = present.length === 0
  const draft = { academic_year: cycle.academic_year, coverage: adding.length === 2 ? 'BOTH' : adding[0] || '', ...(needsSchedule ? dates : { submission_open_at: '2000-01-01', submission_close_at: '2000-01-02', evaluation_start_at: '2000-01-03', evaluation_end_at: '2000-01-04' }) }
  const { errors, ready } = validateCycleDraft(draft, { criteria, conflicts, today: needsSchedule ? localToday() : null })
  const save = async () => {
    setState({ saving: true, error: '' })
    try { await addRankingCycleCoverage(cycle.id, { personnel_coverage: adding, ...(needsSchedule ? dates : {}) }, key.current); setState({ saving: false, error: '' }); onSaved() }
    catch (failure) { setState({ saving: false, error: errorMessage(failure, 'Personnel coverage could not be added.') }); key.current = crypto.randomUUID() }
  }
  return <div className="space-y-4">
    <dl className="divide-y divide-slate-200 dark:divide-slate-800"><Row label="Current coverage">{cycle.coverage?.label}</Row></dl>
    {cycle.is_read_only && <Notice>This period is read-only. Its personnel coverage is kept as historical record.</Notice>}
    {!cycle.is_read_only && missing.length > 0 && <div className="space-y-4 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
      <p className="text-sm text-slate-600 dark:text-slate-300">{needsSchedule ? 'Choose who this period covers and set its schedule. Each personnel group uses its active, locked criteria.' : `Add ${missing.map(group => GROUP_LABELS[group]).join(' and ')} to this cycle. The new group uses this cycle's schedule and its own active criteria.`}</p>
      <CoverageToggle groups={groups} onChange={setGroups} blocked={conflicts} disabledGroups={new Set(present)}/>
      {needsSchedule && <div className="grid gap-4">
        <div><p className="mb-1.5 text-sm font-bold">Submission Period</p><DateRange idPrefix="setup-submission" label="Submission period" start={dates.submission_open_at} end={dates.submission_close_at} onStart={value => setDates({ ...dates, submission_open_at: value })} onEnd={value => setDates({ ...dates, submission_close_at: value })}/></div>
        <div><p className="mb-1.5 text-sm font-bold">Evaluation Period</p><DateRange idPrefix="setup-evaluation" label="Evaluation period" start={dates.evaluation_start_at} end={dates.evaluation_end_at} onStart={value => setDates({ ...dates, evaluation_start_at: value })} onEnd={value => setDates({ ...dates, evaluation_end_at: value })}/></div>
      </div>}
      {adding.length > 0 && <CriteriaRows groups={adding} criteria={criteria} onView={setViewing}/>}
      {adding.length > 0 && Object.values(errors)[0] && <Notice tone="error">{Object.values(errors)[0]}</Notice>}
      {state.error && <Notice tone="error">{state.error}</Notice>}
      <div className="flex justify-end"><button type="button" onClick={save} disabled={!adding.length || !ready || state.saving} className={buttonStyles.primary}>{state.saving ? 'Saving…' : needsSchedule ? 'Complete Setup' : 'Add Personnel Group'}</button></div>
    </div>}
    {!cycle.is_read_only && missing.length === 0 && <Notice>This period covers Faculty and Non-Teaching Faculty. Personnel groups with records stay attached to preserve their history.</Notice>}
    {viewing && <CriteriaPreviewDialog versionId={viewing} onClose={() => setViewing(null)}/>}
  </div>
}

function Criteria({ cycle }) {
  const [viewing, setViewing] = useState(null)
  return <div className="space-y-4">
    {cycle.tracks.length === 0 && <Notice>Criteria are assigned automatically when personnel coverage is configured.</Notice>}
    <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
      {cycle.tracks.map(track => <li key={track.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-sm">
        <FileText aria-hidden="true" className="h-4 w-4 text-slate-400"/>
        <span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-slate-500">{track.personnel_group_label}</span><span className="font-semibold">{criteriaLabel(track.criteria)}</span></span>
        {track.criteria && <><button type="button" onClick={() => setViewing(track.criteria.version_id)} className={buttonStyles.link}>View Criteria</button><LockedBadge/></>}
      </li>)}
    </ul>
    <p className="text-xs leading-5 text-slate-500">Each personnel group keeps the exact criteria version it was created with. Evaluations also store a snapshot of that version, so completed and archived cycles always show the criteria they used. <Link to="/hr/personnel-evaluation-setup" className="font-bold text-emerald-800 hover:underline dark:text-emerald-300">Manage criteria versions</Link></p>
    {viewing && <CriteriaPreviewDialog versionId={viewing} onClose={() => setViewing(null)}/>}
  </div>
}

function Lifecycle({ cycle, onSaved, onArchive }) {
  const [pending, setPending] = useState(null)
  const [state, setState] = useState({ saving: false, error: '' })
  const run = async (track, action) => {
    setState({ saving: true, error: '' })
    try { await transitionPersonnelEvaluationPeriod(track.id, action, track.version); setPending(null); setState({ saving: false, error: '' }); onSaved() }
    catch (failure) { setState({ saving: false, error: errorMessage(failure, 'The lifecycle step could not be completed.') }) }
  }
  return <div className="space-y-4">
    <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
      {cycle.tracks.map(track => {
        const next = cycle.is_read_only ? null : NEXT_ACTION[track.status]
        const confirming = pending === track.id
        return <li key={track.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
          <span className="min-w-0 flex-1"><span className="block font-bold text-slate-900 dark:text-white">{track.personnel_group_label}</span><span className="text-slate-600 dark:text-slate-300">{TRACK_STATUS[track.status] || track.status} · Stage: {track.current_stage?.label}</span></span>
          {next && !confirming && <button type="button" onClick={() => setPending(track.id)} disabled={state.saving} className={buttonStyles.secondary}>{next[1]}</button>}
          {next && confirming && <span className="flex items-center gap-2"><span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{next[1]} for {track.personnel_group_label}?</span><button type="button" onClick={() => setPending(null)} disabled={state.saving} className={buttonStyles.secondary}>Cancel</button><button type="button" onClick={() => run(track, next[0])} disabled={state.saving} className={buttonStyles.primary}>{state.saving ? 'Working…' : 'Confirm'}</button></span>}
        </li>
      })}
    </ul>
    {state.error && <Notice tone="error">{state.error}</Notice>}
    <p className="text-xs leading-5 text-slate-500">Lifecycle steps follow the existing ranking rules: submissions open only inside the submission window with an approved criteria version and valid reviewer assignments, and evaluation starts on its scheduled date.</p>
    {cycle.allowed_actions?.includes('archive') && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800"><p className="text-sm text-slate-600 dark:text-slate-300">This period is completed. Archiving keeps every record and makes the period historical.</p><button type="button" onClick={onArchive} className={buttonStyles.secondary}>Archive Period</button></div>}
    {cycle.is_archived && <Notice>This period is archived. It stays searchable and viewable, and its records cannot change.</Notice>}
  </div>
}

export default function CycleSettingsDialog({ cycle: initial, cycles = [], section = 'general', onClose, onChanged, onArchive }) {
  const [cycle, setCycle] = useState(initial)
  const [active, setActive] = useState(section)
  const refresh = async () => {
    const result = await getRankingCycle(cycle.id)
    const next = result?.cycle || result
    setCycle(next)
    onChanged?.(next)
  }
  const panels = {
    general: <General cycle={cycle}/>,
    schedule: <Schedule key={`schedule-${cycle.updated_at}-${cycle.tracks.map(t => t.version).join('.')}`} cycle={cycle} onSaved={refresh}/>,
    'achievement-coverage': <AchievementCoverage key={`achievement-coverage-${cycle.updated_at}`} cycle={cycle} onSaved={refresh}/>,
    coverage: <Coverage key={`coverage-${cycle.track_count}`} cycle={cycle} cycles={cycles} onSaved={refresh}/>,
    criteria: <Criteria cycle={cycle}/>,
    lifecycle: <Lifecycle cycle={cycle} onSaved={refresh} onArchive={() => onArchive?.(cycle)}/>,
  }
  return <RankingCycleDialog width="max-w-4xl" title="Period Settings" description={cycle.display_name} onClose={onClose} footer={<button type="button" onClick={onClose} className={buttonStyles.secondary}>Close</button>}>
    <div className="grid min-h-[26rem] md:grid-cols-[12rem_1fr]">
      <nav aria-label="Cycle settings sections" className="flex gap-1 overflow-x-auto border-b border-slate-200 p-2 md:flex-col md:border-b-0 md:border-r dark:border-slate-800">
        {SETTINGS_SECTIONS.map(([key, label]) => <button key={key} type="button" aria-current={active === key ? 'page' : undefined} onClick={() => setActive(key)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${active === key ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white'}`}>{label}</button>)}
      </nav>
      <div className="p-5 sm:p-6">{panels[active]}</div>
    </div>
  </RankingCycleDialog>
}
