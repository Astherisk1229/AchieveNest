import React, { useEffect, useMemo, useState } from 'react'
import { Building2, Check, X } from 'lucide-react'
import { isAcademicPersonnel, validatePersonnelPlacement } from '../../../utils/personnelPlacement'

export default function EditAssignmentModal({ personnel, isOpen, onClose, onSave, placementOptions = { colleges: [], academicPrograms: [], administrativeUnits: [] } }) {
  const [collegeId, setCollegeId] = useState('')
  const [academicProgramIds, setAcademicProgramIds] = useState([])
  const [administrativeUnitId, setAdministrativeUnitId] = useState('')
  const [error, setError] = useState('')
  const academic = isAcademicPersonnel(personnel)
  const programs = useMemo(() => placementOptions.academicPrograms.filter(program => program.collegeId === collegeId), [placementOptions.academicPrograms, collegeId])
  useEffect(() => {
    if (!personnel) return
    setCollegeId(personnel.college_id || '')
    setAcademicProgramIds((personnel.program_affiliations || []).map(program => program.academic_program_id || program.id).filter(Boolean))
    setAdministrativeUnitId(personnel.administrative_unit_id || '')
  }, [personnel])
  if (!isOpen || !personnel) return null
  const changeCollege = id => { setCollegeId(id); setAcademicProgramIds(current => current.filter(programId => placementOptions.academicPrograms.some(program => program.id === programId && program.collegeId === id))) }
  const toggleProgram = id => setAcademicProgramIds(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id])
  const submit = event => {
    event.preventDefault()
    const result = validatePersonnelPlacement({ classification: academic ? 'academic' : 'non_academic', collegeId, academicProgramIds, administrativeUnitId }, placementOptions)
    if (!result.isValid) { setError(Object.values(result.errors)[0]); return }
    onSave?.({ ...personnel, college_id: academic ? collegeId : null, academic_program_ids: academic ? academicProgramIds : [], administrative_unit_id: academic ? null : administrativeUnitId })
    onClose()
  }
  return <><div className="fixed inset-0 bg-slate-900/40 z-50" onClick={onClose} /><div className="fixed inset-0 z-50 flex items-center justify-center p-4"><form onSubmit={submit} className="bg-white dark:bg-[#131e2e] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4"><header className="flex justify-between border-b pb-3"><h2 className="font-black text-xs flex items-center gap-2"><Building2 className="w-4 h-4" /> Edit Institutional Affiliation</h2><button type="button" onClick={onClose}><X className="w-4 h-4" /></button></header><p className="text-xs font-bold">{personnel.full_name}</p>
    {academic ? <><label className="block text-xs font-bold">College<select value={collegeId} onChange={e => changeCollege(e.target.value)} className="mt-1 w-full p-2.5 rounded-xl border"><option value="">Select a College</option>{placementOptions.colleges.map(item => <option key={item.id} value={item.id}>{item.code} — {item.name}</option>)}</select></label><fieldset><legend className="text-xs font-bold">Academic Program affiliations</legend>{programs.map(program => <label key={program.id} className="block text-xs py-1"><input type="checkbox" checked={academicProgramIds.includes(program.id)} onChange={() => toggleProgram(program.id)} /> {program.code} — {program.name}</label>)}</fieldset></> : <label className="block text-xs font-bold">Administrative Unit<select value={administrativeUnitId} onChange={e => setAdministrativeUnitId(e.target.value)} className="mt-1 w-full p-2.5 rounded-xl border"><option value="">Select an Administrative Unit</option>{placementOptions.administrativeUnits.map(item => <option key={item.id} value={item.id}>{item.code} — {item.name}</option>)}</select></label>}
    {error && <p className="text-xs text-rose-600">{error}</p>}<p className="text-[11px] text-slate-500">This changes personnel affiliation only. Governance roles remain in their owning workflow.</p><footer className="flex justify-end gap-2 border-t pt-3"><button type="button" onClick={onClose}>Cancel</button><button className="px-4 py-2 rounded-xl bg-[#176B43] text-white font-bold flex gap-1"><Check className="w-4 h-4" /> Save Affiliation</button></footer></form></div></>
}
