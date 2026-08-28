import React, { useMemo, useState } from 'react'
import { X, UserPlus } from 'lucide-react'
import { validatePersonnelPlacement } from '../../../utils/personnelPlacement'

export default function OnboardPersonnelModal({ isOpen, onClose, onSubmit, placementOptions = { colleges: [], academicPrograms: [], administrativeUnits: [] } }) {
  const [form, setForm] = useState({ institutionalId: '', email: '', firstName: '', middleName: '', lastName: '', suffix: '', designation: '', classification: 'academic', collegeId: '', academicProgramIds: [], administrativeUnitId: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const programs = useMemo(() => placementOptions.academicPrograms.filter(program => program.collegeId === form.collegeId), [placementOptions.academicPrograms, form.collegeId])
  if (!isOpen) return null

  const update = (key, value) => setForm(current => ({ ...current, [key]: value }))
  const setClassification = classification => setForm(current => ({ ...current, classification, collegeId: '', academicProgramIds: [], administrativeUnitId: '' }))
  const setCollege = collegeId => setForm(current => ({ ...current, collegeId, academicProgramIds: current.academicProgramIds.filter(id => placementOptions.academicPrograms.some(program => program.id === id && program.collegeId === collegeId)) }))
  const toggleProgram = id => setForm(current => ({ ...current, academicProgramIds: current.academicProgramIds.includes(id) ? current.academicProgramIds.filter(item => item !== id) : [...current.academicProgramIds, id] }))

  const submit = async event => {
    event.preventDefault()
    const nextErrors = {}
    if (!form.institutionalId.trim()) nextErrors.institutionalId = 'Institutional ID is required.'
    if (!form.email.trim().toLowerCase().endsWith('@ndmu.edu.ph')) nextErrors.email = 'Use an @ndmu.edu.ph email.'
    if (!form.firstName.trim()) nextErrors.firstName = 'First name is required.'
    if (!form.lastName.trim()) nextErrors.lastName = 'Last name is required.'
    const placement = validatePersonnelPlacement({ classification: form.classification, collegeId: form.collegeId, academicProgramIds: form.academicProgramIds, administrativeUnitId: form.administrativeUnitId }, placementOptions)
    Object.assign(nextErrors, placement.errors)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setSubmitting(true)
    try {
      await onSubmit({
        institutional_id: form.institutionalId.trim().toUpperCase(),
        institutional_email: form.email.trim().toLowerCase(),
        first_name: form.firstName.trim(), middle_name: form.middleName.trim() || null,
        last_name: form.lastName.trim(), suffix: form.suffix.trim() || null,
        designation: form.designation.trim() || 'Personnel',
        personnel_classification: form.classification,
        college_id: form.classification === 'academic' ? form.collegeId : null,
        academic_program_ids: form.classification === 'academic' ? form.academicProgramIds : [],
        administrative_unit_id: form.classification === 'non_academic' ? form.administrativeUnitId : null
      })
      onClose()
    } finally { setSubmitting(false) }
  }

  const field = (label, key, type = 'text') => <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{label}<input type={type} value={form[key]} onChange={e => update(key, e.target.value)} className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900" />{errors[key] && <span className="text-rose-600">{errors[key]}</span>}</label>

  return <><div className="fixed inset-0 bg-slate-900/50 z-50" onClick={onClose} /><div className="fixed inset-0 z-50 flex items-center justify-center p-4"><form onSubmit={submit} className="bg-white dark:bg-[#131e2e] rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
    <header className="flex items-center justify-between border-b pb-3"><h2 className="font-black flex items-center gap-2"><UserPlus className="w-4 h-4" /> Onboard Personnel Account</h2><button type="button" onClick={onClose}><X className="w-4 h-4" /></button></header>
    <div className="grid sm:grid-cols-2 gap-3">{field('Institutional ID', 'institutionalId')}{field('Institutional Email', 'email', 'email')}{field('First Name', 'firstName')}{field('Middle Name', 'middleName')}{field('Last Name', 'lastName')}{field('Suffix', 'suffix')}{field('Designation', 'designation')}</div>
    <fieldset className="space-y-2"><legend className="text-xs font-black">Personnel Classification</legend><label className="mr-4"><input type="radio" checked={form.classification === 'academic'} onChange={() => setClassification('academic')} /> Academic</label><label><input type="radio" checked={form.classification === 'non_academic'} onChange={() => setClassification('non_academic')} /> Non-Academic</label></fieldset>
    {form.classification === 'academic' ? <div className="space-y-3"><label className="block text-xs font-bold">College<select value={form.collegeId} onChange={e => setCollege(e.target.value)} className="mt-1 w-full p-2.5 rounded-xl border"><option value="">Select a College</option>{placementOptions.colleges.map(item => <option key={item.id} value={item.id}>{item.code} — {item.name}</option>)}</select>{errors.collegeId && <span className="text-rose-600">{errors.collegeId}</span>}</label><fieldset><legend className="text-xs font-bold">Academic Program affiliations</legend>{programs.map(program => <label key={program.id} className="block text-xs py-1"><input type="checkbox" checked={form.academicProgramIds.includes(program.id)} onChange={() => toggleProgram(program.id)} /> {program.code} — {program.name}</label>)}{errors.academicProgramIds && <span className="text-xs text-rose-600">{errors.academicProgramIds}</span>}</fieldset></div> : <label className="block text-xs font-bold">Administrative Unit<select value={form.administrativeUnitId} onChange={e => update('administrativeUnitId', e.target.value)} className="mt-1 w-full p-2.5 rounded-xl border"><option value="">Select an Administrative Unit</option>{placementOptions.administrativeUnits.map(item => <option key={item.id} value={item.id}>{item.code} — {item.name}</option>)}</select>{errors.administrativeUnitId && <span className="text-rose-600">{errors.administrativeUnitId}</span>}</label>}
    <p className="text-[11px] text-slate-500">Governance roles are assigned separately. HR may manage College-scoped Dean assignments; OSAD owns Program Coordinator and Organization Moderator assignments.</p>
    <footer className="flex justify-end gap-2 border-t pt-3"><button type="button" onClick={onClose} className="px-4 py-2">Cancel</button><button disabled={submitting} className="px-4 py-2 rounded-xl bg-[#176B43] text-white font-bold disabled:opacity-50">{submitting ? 'Creating…' : 'Create Personnel'}</button></footer>
  </form></div></>
}
