import React, { useEffect, useMemo, useState } from 'react'
import { Building2, Check, X } from 'lucide-react'
import { isAcademicPersonnel, validatePersonnelPlacement } from '../../../utils/personnelPlacement'
import DepartmentSelect from './DepartmentSelect'

export default function EditAssignmentModal({
  personnel,
  isOpen,
  onClose,
  onSave,
  placementOptions = { colleges: [], academicPrograms: [], administrativeUnits: [] }
}) {
  const [collegeId, setCollegeId] = useState('')
  const [administrativeUnitId, setAdministrativeUnitId] = useState('')
  const [error, setError] = useState('')

  const academic = isAcademicPersonnel(personnel)
  const departments = useMemo(() => (placementOptions.administrativeUnits || []).filter(item => academic
    ? String(item.collegeId || item.college_id || '') === String(collegeId)
    : !(item.collegeId || item.college_id)), [placementOptions.administrativeUnits, academic, collegeId])

  useEffect(() => {
    if (!personnel) return
    setCollegeId(personnel.college_id || '')
    setAdministrativeUnitId(personnel.department_id || personnel.administrative_unit_id || '')
    setError('')
  }, [personnel, isOpen])

  if (!isOpen || !personnel) return null

  const changeCollege = id => {
    setCollegeId(id)
    setAdministrativeUnitId('')
  }

  const submit = async event => {
    event.preventDefault()
    const result = validatePersonnelPlacement(
      { classification: academic ? 'academic' : 'non_academic', collegeId, academicProgramIds: [], departmentId: academic ? administrativeUnitId : null, administrativeUnitId: academic ? null : administrativeUnitId, requireDepartment: true },
      placementOptions
    )
    if (!result.isValid) {
      setError(Object.values(result.errors)[0])
      return
    }
    setError('')
    try {
      await onSave?.({
        ...personnel,
        college_id: academic ? collegeId : null,
        academic_program_ids: (personnel.program_affiliations || []).map(program => program.academic_program_id || program.id).filter(Boolean),
        department_id: academic ? administrativeUnitId : null,
        administrative_unit_id: academic ? null : administrativeUnitId
      })
      onClose()
    } catch (err) {
      setError(err?.error?.message || err?.message || 'The assignment could not be saved.')
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <form onSubmit={submit} className="bg-white dark:bg-[#131e2e] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
          <header className="flex justify-between border-b pb-3">
            <h2 className="font-black text-xs flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Edit Institutional Affiliation
            </h2>
            <button type="button" onClick={onClose}>
              <X className="w-4 h-4" />
            </button>
          </header>
          <p className="text-xs font-bold">{personnel.full_name}</p>

          {academic ? (
            <>
              <label className="block text-xs font-bold">
                College
                <select value={collegeId} onChange={e => changeCollege(e.target.value)} className="mt-1 w-full p-2.5 rounded-xl border">
                  <option value="">Select a College</option>
                  {placementOptions.colleges.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.code ? `${item.code} — ` : ''}{item.name}
                    </option>
                  ))}
                </select>
              </label>
              <DepartmentSelect departments={departments} value={administrativeUnitId} onChange={setAdministrativeUnitId} label="Department under College" />
            </>
          ) : (
            <label className="block text-xs font-bold">
              Department
              <select value={administrativeUnitId} onChange={e => setAdministrativeUnitId(e.target.value)} className="mt-1 w-full p-2.5 rounded-xl border">
                <option value="">Select a Department</option>
                {departments.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.code ? `${item.code} — ` : ''}{item.name || item.unit_name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {error && <p className="text-xs text-rose-600 font-bold">{error}</p>}
          <p className="text-[11px] text-slate-500">
            This changes personnel affiliation only. Governance roles remain in their owning workflow.
          </p>
          <footer className="flex justify-end gap-2 border-t pt-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl">
              Cancel
            </button>
            <button className="px-4 py-2 rounded-xl bg-[#176B43] text-white font-bold flex gap-1 text-xs">
              <Check className="w-4 h-4" /> Save Affiliation
            </button>
          </footer>
        </form>
      </div>
    </>
  )
}

