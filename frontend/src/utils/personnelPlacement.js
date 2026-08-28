export function isAcademicPersonnel(personnel = {}) {
  return (personnel.personnel_classification || personnel.personnel_category || '').toLowerCase() === 'academic'
}

export function formatPersonnelPlacement(personnel = {}) {
  if (isAcademicPersonnel(personnel)) {
    const college = personnel.college_name || personnel.college_code || personnel.college || 'College unassigned'
    const programs = (personnel.program_affiliations || [])
      .map(program => program.code || program.name || program.academic_program_name)
      .filter(Boolean)
    return programs.length ? `${college} • ${programs.join(', ')}` : college
  }
  return personnel.administrative_unit_name || personnel.administrative_unit_code || 'Administrative Unit unassigned'
}

export function collectPersonnelPlacementOptions(personnelList = []) {
  const colleges = new Map()
  const academicPrograms = new Map()
  const administrativeUnits = new Map()

  personnelList.forEach(person => {
    if (person.college_id) {
      colleges.set(person.college_id, {
        id: person.college_id,
        code: person.college_code || '',
        name: person.college_name || person.college || person.college_code
      })
    }
    ;(person.program_affiliations || []).forEach(program => {
      const id = program.academic_program_id || program.id
      if (id) academicPrograms.set(id, {
        id,
        collegeId: program.college_id || person.college_id,
        code: program.code || program.academic_program_code || '',
        name: program.name || program.academic_program_name || program.code
      })
    })
    if (person.administrative_unit_id) {
      administrativeUnits.set(person.administrative_unit_id, {
        id: person.administrative_unit_id,
        code: person.administrative_unit_code || '',
        name: person.administrative_unit_name || person.administrative_unit_code
      })
    }
  })

  return {
    colleges: [...colleges.values()],
    academicPrograms: [...academicPrograms.values()],
    administrativeUnits: [...administrativeUnits.values()]
  }
}

export function validatePersonnelPlacement({ classification, collegeId, academicProgramIds = [], administrativeUnitId }, options) {
  const errors = {}
  if (classification === 'academic') {
    if (!collegeId) errors.collegeId = 'Select a College.'
    if (!academicProgramIds.length) errors.academicProgramIds = 'Select at least one Academic Program.'
    const validIds = new Set(options.academicPrograms.filter(program => program.collegeId === collegeId).map(program => program.id))
    if (academicProgramIds.some(id => !validIds.has(id))) errors.academicProgramIds = 'Every Academic Program must belong to the selected College.'
  } else if (!administrativeUnitId) {
    errors.administrativeUnitId = 'Select an Administrative Unit.'
  }
  return { isValid: Object.keys(errors).length === 0, errors }
}
