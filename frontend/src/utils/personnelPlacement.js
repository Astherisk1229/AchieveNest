export function isAcademicPersonnel(personnel) {
  if (!personnel || typeof personnel !== 'object') return false
  const side = personnel.organizational_side || personnel.personnel_classification || personnel.personnel_category || ''
  return side.toLowerCase() === 'academic'
}

export function formatPersonnelPlacement(personnel) {
  if (!personnel || typeof personnel !== 'object') return 'Placement unassigned'
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

  if (Array.isArray(personnelList)) {
    personnelList.forEach(person => {
      if (!person || typeof person !== 'object') return
      if (person.college_id) {
        colleges.set(person.college_id, {
          id: person.college_id,
          code: person.college_code || '',
          name: person.college_name || person.college || person.college_code
        })
      }
      ;(person.program_affiliations || []).forEach(program => {
        if (!program) return
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
  }

  return {
    colleges: [...colleges.values()],
    academicPrograms: [...academicPrograms.values()],
    administrativeUnits: [...administrativeUnits.values()]
  }
}

export function validatePersonnelPlacement({ classification, group, side, collegeId, academicProgramIds = [], administrativeUnitId }, options) {
  const errors = {}

  // Validate group & side pairing
  if (group || side) {
    const effectiveGroup = (group || 'faculty').toLowerCase()
    const effectiveSide  = (side || classification || 'academic').toLowerCase()

    if (effectiveGroup === 'faculty' && effectiveSide === 'non_academic') {
      errors.classificationPair = 'Invalid combination: Faculty must belong to the Academic organizational side.'
    }
  }

  const effectiveClassification = (side || classification || 'academic').toLowerCase()

  if (effectiveClassification === 'academic') {
    if (!collegeId) errors.collegeId = 'Select a College.'
    if (!academicProgramIds.length) errors.academicProgramIds = 'Select at least one Academic Program.'
    if (options && options.academicPrograms) {
      const validIds = new Set(options.academicPrograms.filter(program => program.collegeId === collegeId).map(program => program.id))
      if (academicProgramIds.some(id => !validIds.has(id))) errors.academicProgramIds = 'Every Academic Program must belong to the selected College.'
    }
  } else if (!administrativeUnitId) {
    errors.administrativeUnitId = 'Select an Administrative Unit.'
  }
  return { isValid: Object.keys(errors).length === 0, errors }
}

export function formatPersonnelClassification(personnel) {
  if (!personnel || typeof personnel !== 'object') return ''
  const isAcad = isAcademicPersonnel(personnel)
  const group = (personnel.personnel_group || (isAcad ? 'faculty' : 'non_teaching_faculty')).toLowerCase()
  const side = (personnel.organizational_side || (isAcad ? 'academic' : 'non_academic')).toLowerCase()

  const groupLabel = group === 'faculty' ? 'Faculty' : 'Non-Teaching Faculty'
  const sideLabel  = side === 'academic' ? 'Academic' : 'Non-Academic'

  return `${groupLabel} • ${sideLabel}`
}

export function formatFacultyEngagement(personnel) {
  if (!personnel || typeof personnel !== 'object') return 'Unassigned'
  const engagement = (personnel.faculty_engagement || '').toLowerCase()
  if (engagement === 'full_time_faculty') return 'Full-time Faculty'
  if (engagement === 'part_time_faculty') return 'Part-time Faculty'
  return personnel.faculty_engagement || 'Unassigned'
}

export function formatEmploymentStatus(personnel) {
  if (!personnel || typeof personnel !== 'object') return 'Unassigned'
  const status = (personnel.employment_status || '').toLowerCase()
  if (status === 'permanent') return 'Permanent'
  if (status === 'probationary') return 'Probationary'
  return personnel.employment_status || 'Unassigned'
}

export function validatePersonnelMasterData({
  facultyEngagement,
  employmentStatus,
  positionTitle,
  currentRankTitle
}) {
  const errors = {}
  const validEngagements = ['full_time_faculty', 'part_time_faculty']
  const validStatuses = ['permanent', 'probationary']

  if (facultyEngagement && !validEngagements.includes(facultyEngagement.toLowerCase())) {
    errors.facultyEngagement = 'Faculty engagement must be either Full-time Faculty or Part-time Faculty.'
  }

  if (employmentStatus && !validStatuses.includes(employmentStatus.toLowerCase())) {
    errors.employmentStatus = 'Employment status must be either Permanent or Probationary.'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

