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

export function mergePlacementMasterData(scrapedOptions = {}, masterData = {}) {
  const collegesMap = new Map()
  const programsMap = new Map()
  const unitsMap = new Map()

  // Add master data first
  ;(masterData.colleges || []).forEach(c => collegesMap.set(c.id, c))
  ;(masterData.academicPrograms || []).forEach(p => programsMap.set(p.id, p))
  ;(masterData.administrativeUnits || masterData.departments || []).forEach(u => unitsMap.set(u.id, u))

  // Merge any scraped options
  ;(scrapedOptions.colleges || []).forEach(c => {
    if (!collegesMap.has(c.id)) collegesMap.set(c.id, c)
  })
  ;(scrapedOptions.academicPrograms || []).forEach(p => {
    if (!programsMap.has(p.id)) programsMap.set(p.id, p)
  })
  ;(scrapedOptions.administrativeUnits || []).forEach(u => {
    if (!unitsMap.has(u.id)) unitsMap.set(u.id, u)
  })

  return {
    colleges: [...collegesMap.values()],
    academicPrograms: [...programsMap.values()],
    administrativeUnits: [...unitsMap.values()]
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
    errors.administrativeUnitId = 'Select a Department.'
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

/**
 * Resolves the downstream Evaluation Summary Department label (Plan D2 — Phase D2-4).
 *
 * Canonical Rules:
 * - Academic (Faculty + Academic or Non-Teaching Faculty + Academic):
 *   Projects the selected College name into the summary 'Department' display field.
 * - Non-Academic (Non-Teaching Faculty + Non-Academic):
 *   Projects the selected Department / Administrative Unit name into the same field.
 *
 * Distinct persisted identities (college_id vs administrative_unit_id) remain uncollapsed.
 *
 * @param {Object} record - Personnel record or evaluation summary context
 * @returns {string} The projected Department display label
 */
export function resolveEvaluationDepartmentLabel(record = {}) {
  if (!record || typeof record !== 'object') return 'Not assigned'

  const group = (record.personnel_group || '').toLowerCase()
  const side = (record.organizational_side || record.personnel_classification || record.personnel_category || '').toLowerCase()

  const isAcademic = side === 'academic' || group === 'faculty'
  const isNonAcademic = side === 'non_academic'

  if (isAcademic) {
    const college = record.college_name || record.college || record.target_college_name || null
    if (college) return college
    if (record.college_id) return `College ${record.college_id}`
    return record.department_name || record.department || 'College unassigned'
  }

  if (isNonAcademic) {
    const unit = record.administrative_unit_name || record.department_name || record.administrative_unit_code || record.department || null
    if (unit) return unit
    return 'Department unassigned'
  }

  // Fallback for legacy fixtures without explicit organizational_side
  if (record.college_name && !record.administrative_unit_name && !record.department_name) {
    return record.college_name
  }

  return record.department_name || record.department || record.administrative_unit_name || record.college_name || 'Department'
}

/**
 * Resolves the evaluation summary department metadata with source provenance.
 *
 * @param {Object} record
 * @returns {{ department_display: string, department_source: 'college'|'administrative_unit' }}
 */
export function resolveEvaluationDepartmentMetadata(record = {}) {
  const label = resolveEvaluationDepartmentLabel(record)
  const side = (record.organizational_side || record.personnel_classification || '').toLowerCase()
  const group = (record.personnel_group || '').toLowerCase()
  const isAcademic = side === 'academic' || group === 'faculty'

  return {
    department_display: label,
    department_source: isAcademic ? 'college' : 'administrative_unit'
  }
}


