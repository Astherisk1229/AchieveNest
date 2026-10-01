import React from 'react'
import { LockKeyhole } from 'lucide-react'

const A_ROWS = [
  ['A.1', 'Job Performance', 50],
  ['A.2', 'Personal Attitudes and Qualities', 10],
  ['A.3', 'Efficiency', 30],
]

const B_SECTIONS = [
  { code: 'B.1.a', title: 'Moderator / Officer of Clubs', max: 30, columns: ['Date(s)', 'Club / Organization', 'Role', 'Conducted / Organized by', 'Remarks', 'Evidence'] },
  { code: 'B.1.b', title: 'Trainer / Coach', max: 20, columns: ['Date(s)', 'Activity', 'Conducted / Organized by', 'Remarks', 'Evidence'] },
  { code: 'B.1.c', title: 'Membership in Working Committees', max: 20, columns: ['Date(s)', 'Committee', 'Conducted / Organized by', 'Remarks', 'Evidence'] },
  { code: 'B.1.d', title: 'Rendered Service in School Activities', max: 10, columns: ['Date(s)', 'Activity', 'Conducted / Organized by', 'Remarks', 'Evidence'] },
  { code: 'B.2.a', title: 'Active Involvement in Church Activities', max: 25, columns: ['Date(s)', 'Activity', 'Role', 'Remarks', 'Evidence'] },
  { code: 'B.2.b', title: 'Active Involvement in Community / Civic Activities', max: 25, columns: ['Date(s)', 'Activity', 'Role', 'Remarks', 'Evidence'] },
  { code: 'B.2.c', title: 'Support to Charity and Community Projects', max: 5, columns: ['Date(s)', 'Project', 'Remarks', 'Evidence'] },
  { code: 'B.4', title: 'Invited as Judge, Lecturer, Resource Person', max: 30, columns: ['Date(s)', 'Engagement', 'Role', 'Organizer', 'Remarks', 'Evidence'] },
  { code: 'B.5', title: 'Recognition / Meritorious Award', max: 30, columns: ['Date(s)', 'Award', 'Issuing Body', 'Remarks', 'Evidence'] },
]

// Server rows carry scoring_payload / category_metadata as JSON strings; decode before reading fields.
const asObject = (value) => {
  if (!value) return {}
  if (typeof value === 'object') return Array.isArray(value) ? {} : value
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

const itemSource = (item) => {
  const payload = asObject(item.scoringPayload || item.scoring_payload)
  const metadata = { ...asObject(payload.category_metadata), ...asObject(item.category_metadata) }
  return { ...payload, ...metadata, ...asObject(metadata.details) }
}

const textFrom = (item, keys, fallback = '—') => {
  const source = itemSource(item)
  for (const key of keys) {
    const value = item[key] ?? source[key]
    if (value !== null && value !== undefined && String(value).trim() !== '') return String(value)
  }
  return fallback
}

const itemCode = item => String(item.subcategory_code || item.criterionCode || item.criterion_code || '').trim().toUpperCase()
const matches = (item, code) => {
  const actual = itemCode(item)
  if (actual === code.toUpperCase()) return true
  const subtype = String(item.subcategory || item.subcategory_code || item.criterionKey || '').toLowerCase()
  const aliases = {
    'B.1.A': ['moderator', 'officer'], 'B.1.B': ['trainer', 'coach'], 'B.1.C': ['committee'], 'B.1.D': ['rendered_service', 'school activit'],
    'B.2.A': ['church'], 'B.2.B': ['community', 'civic'], 'B.2.C': ['charity'],
  }
  return (aliases[code.toUpperCase()] || []).some(alias => subtype.includes(alias))
}

export default function NtfPortfolioDocument({ submission, evidenceItems, selectedEvidence, onSelectEvidence }) {
  const areaA = evidenceItems.filter(item => String(item.categoryArea || '').toLowerCase() === 'areaa')
  const areaB = evidenceItems.filter(item => String(item.categoryArea || '').toLowerCase() === 'areab')
  const tenureYears = Math.max(0, Number(submission.tenure_years) || 0)
  const servicePoints = Math.min(10, Math.floor(tenureYears / 2))

  return <div className="flex-1 overflow-y-auto bg-white p-6 font-serif text-slate-950 dark:bg-slate-950 dark:text-slate-100">
    <header className="mb-6 text-center">
      <h2 className="text-xl font-bold tracking-wide">NON-TEACHING FACULTY PORTFOLIO</h2>
      <p className="mt-1 text-sm italic text-slate-600 dark:text-slate-300">Personnel Ranking Evaluation</p>
      <dl className="mt-4 grid grid-cols-2 gap-x-6 border-t border-slate-300 pt-3 text-left text-xs dark:border-slate-700">
        <div><dt className="inline font-semibold">Name: </dt><dd className="inline">{submission.faculty_name || submission.full_name || '—'}</dd></div>
        <div><dt className="inline font-semibold">Employee ID: </dt><dd className="inline">{submission.employee_id || submission.institutional_id || '—'}</dd></div>
        <div><dt className="inline font-semibold">Assignment: </dt><dd className="inline">{submission.college || submission.department || '—'}</dd></div>
        <div><dt className="inline font-semibold">Position: </dt><dd className="inline">{submission.designation || submission.position_title || '—'}</dd></div>
      </dl>
    </header>

    <section className="border-2 border-slate-900 text-xs dark:border-slate-500">
      <SectionTitle>A. PERFORMANCE AND PERSONAL INDICATORS <span className="float-right">Maximum: 90</span></SectionTitle>
      <table className="w-full border-collapse">
        <thead><tr className="border-b border-slate-900 bg-slate-100 dark:border-slate-500 dark:bg-slate-800"><Th>Item</Th><Th>Official HR score</Th><Th>Maximum</Th><Th>Status</Th></tr></thead>
        <tbody>{A_ROWS.map(([code, title, max]) => {
          const item = areaA.find(entry => itemCode(entry) === code)
          const value = item?.awardedPoints
          const available = value !== null && value !== undefined && value !== ''
          return <tr key={code} className="border-b border-slate-300 dark:border-slate-700">
            <Td><strong>{code}</strong> {title}</Td><Td>{available ? Number(value).toFixed(2) : '—'}</Td><Td>{max}</Td>
            <Td>{available ? <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 dark:text-emerald-300"><LockKeyhole className="h-3 w-3"/>Locked</span> : <span className="text-amber-700 dark:text-amber-300">Pending annual review</span>}</Td>
          </tr>
        })}</tbody>
      </table>

      <SectionTitle>B. SERVICE AND LEADERSHIP <span className="float-right">Maximum: 60</span></SectionTitle>
      <SubTitle>B.1 School Involvement <span className="float-right">Category cap: 30</span></SubTitle>
      {B_SECTIONS.slice(0, 4).map(section => <EvidenceSection key={section.code} section={section} items={areaB.filter(item => matches(item, section.code))} selectedEvidence={selectedEvidence} onSelectEvidence={onSelectEvidence}/>)}
      <SubTitle>B.2 Community Involvement <span className="float-right">Category cap: 30</span></SubTitle>
      {B_SECTIONS.slice(4, 7).map(section => <EvidenceSection key={section.code} section={section} items={areaB.filter(item => matches(item, section.code))} selectedEvidence={selectedEvidence} onSelectEvidence={onSelectEvidence}/>)}

      <div className="border-b border-slate-900 bg-slate-50 p-2 dark:border-slate-500 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3 font-bold"><span>B.3 No. of Years at NDMU</span><span>{servicePoints} / 10</span></div>
        <p className="mt-1 font-sans text-[11px] text-slate-600 dark:text-slate-300">{tenureYears} completed year{tenureYears === 1 ? '' : 's'} from the official employment record · 1 point per 2 completed years.</p>
      </div>
      {B_SECTIONS.slice(7).map(section => <EvidenceSection key={section.code} section={section} items={areaB.filter(item => matches(item, section.code))} selectedEvidence={selectedEvidence} onSelectEvidence={onSelectEvidence}/>)}
    </section>
  </div>
}

function EvidenceSection({ section, items, selectedEvidence, onSelectEvidence }) {
  return <div className="border-b border-slate-900 dark:border-slate-500">
    <div className="flex items-center justify-between gap-3 bg-slate-100 px-3 py-1.5 font-bold dark:bg-slate-800"><span>{section.code} {section.title}</span><span>Max {section.max}</span></div>
    <table className="w-full table-fixed border-collapse">
      <thead><tr className="border-y border-slate-300 bg-white italic dark:border-slate-700 dark:bg-slate-950">{section.columns.map(column => <Th key={column}>{column}</Th>)}</tr></thead>
      <tbody>{items.length === 0 ? <tr><td colSpan={section.columns.length} className="p-3 text-center font-sans text-[11px] text-slate-500">No submitted evidence</td></tr> : items.map(item => <tr key={item.id} onClick={() => onSelectEvidence(item)} className={`cursor-pointer border-t border-slate-200 font-sans dark:border-slate-800 ${selectedEvidence?.id === item.id ? 'bg-emerald-50 dark:bg-emerald-950/40' : 'hover:bg-slate-50 dark:hover:bg-slate-900'}`}>
        {section.columns.map((column, index) => <Td key={column}>{cellValue(item, column, index)}</Td>)}
      </tr>)}</tbody>
    </table>
  </div>
}

function cellValue(item, column, index) {
  if (column === 'Date(s)') return textFrom(item, ['date', 'activity_date', 'occurrence_date', 'submittedDate', 'submitted_at'])
  if (column === 'Role') return textFrom(item, ['role', 'invitation_role'])
  if (column === 'Conducted / Organized by' || column === 'Organizer') return textFrom(item, ['conducted_by', 'conductedBy', 'organizer'])
  if (column === 'Issuing Body') return textFrom(item, ['issuing_body', 'organizer'])
  if (column === 'Remarks') return textFrom(item, ['evaluatorRemarks', 'evaluator_remarks'], '')
  if (column === 'Evidence') return item.evidence_path || item.evidence_url || item.evidence_snapshot ? 'View' : '—'
  if (index === 1) return textFrom(item, ['activityTitle', 'title', 'item_description', 'achievement'])
  return '—'
}

const SectionTitle = ({ children }) => <div className="border-b border-slate-900 bg-[#0f2537] p-2 text-sm font-bold tracking-wide text-white dark:border-slate-500">{children}</div>
const SubTitle = ({ children }) => <div className="border-b border-slate-900 bg-[#183a54] p-2 font-bold text-white dark:border-slate-500">{children}</div>
const Th = ({ children }) => <th className="border-r border-slate-300 p-2 text-left last:border-r-0 dark:border-slate-700">{children}</th>
const Td = ({ children }) => <td className="border-r border-slate-300 p-2 last:border-r-0 dark:border-slate-700">{children}</td>
