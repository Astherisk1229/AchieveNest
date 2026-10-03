/**
 * HRModel.js
 * OOP Domain Model encapsulating HR entity schemas, personnel records, academic rank tracks,
 * verification queues, service award criteria, and HR security audit logs.
 */

export class PersonnelEntity {
  #id
  #employee_id
  #full_name
  #email
  #college
  #college_code
  #program
  #program_affiliations
  #administrative_unit
  #academic_rank
  #employment_status
  #tenure_years
  #verified_accomplishments_count
  #assigned_roles
  #avatar_url
  #created_at

  constructor(data = {}) {
    this.#id = data.id || `emp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`
    this.#employee_id = data.employee_id || 'EMP-2021-0000'
    this.#full_name = data.full_name || 'Dr. Personnel'
    this.#email = data.email || 'personnel@ndmu.edu.ph'
    this.#college = data.college || 'College of Engineering, Architecture, and Technology'
    this.#college_code = data.college_code || 'CEAC'
    this.#program = data.program || 'Bachelor of Science in Computer Science'
    this.#program_affiliations = Array.isArray(data.program_affiliations) ? data.program_affiliations : []
    this.#administrative_unit = data.administrative_unit || ''
    this.#academic_rank = data.academic_rank || 'Assistant Professor I'
    this.#employment_status = data.employment_status || 'Full-Time Permanent'
    this.#tenure_years = typeof data.tenure_years === 'number' ? data.tenure_years : 5
    this.#verified_accomplishments_count = typeof data.verified_accomplishments_count === 'number' ? data.verified_accomplishments_count : 0
    this.#assigned_roles = Array.isArray(data.assigned_roles) ? data.assigned_roles : []
    this.#avatar_url = data.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'
    this.#created_at = data.created_at || null
  }

  get id() { return this.#id }
  get employee_id() { return this.#employee_id }
  get full_name() { return this.#full_name }
  get email() { return this.#email }
  get college() { return this.#college }
  get college_code() { return this.#college_code }
  get program() { return this.#program }
  get program_affiliations() { return [...this.#program_affiliations] }
  get administrative_unit() { return this.#administrative_unit }
  get academic_rank() { return this.#academic_rank }
  get employment_status() { return this.#employment_status }
  get tenure_years() { return this.#tenure_years }
  get verified_accomplishments_count() { return this.#verified_accomplishments_count }
  get assigned_roles() { return [...this.#assigned_roles] }
  get avatar_url() { return this.#avatar_url }
  get created_at() { return this.#created_at }

  set academic_rank(newRank) {
    if (newRank && typeof newRank === 'string') {
      this.#academic_rank = newRank.trim()
    }
  }

  set employment_status(newStatus) {
    if (newStatus && typeof newStatus === 'string') {
      this.#employment_status = newStatus.trim()
    }
  }

  assignRole(role) {
    if (role && !this.#assigned_roles.includes(role)) {
      this.#assigned_roles.push(role)
    }
  }

  revokeRole(role) {
    this.#assigned_roles = this.#assigned_roles.filter(r => r !== role)
  }

  toJSON() {
    return {
      id: this.#id,
      employee_id: this.#employee_id,
      full_name: this.#full_name,
      email: this.#email,
      college: this.#college,
      college_code: this.#college_code,
      program: this.#program,
      program_affiliations: this.#program_affiliations,
      administrative_unit: this.#administrative_unit,
      academic_rank: this.#academic_rank,
      employment_status: this.#employment_status,
      tenure_years: this.#tenure_years,
      verified_accomplishments_count: this.#verified_accomplishments_count,
      assigned_roles: [...this.#assigned_roles],
      avatar_url: this.#avatar_url,
      created_at: this.#created_at
    }
  }
}

export class FacultyAccomplishmentEntity {
  #id
  #title
  #faculty_id
  #faculty_name
  #college
  #program
  #category
  #date_completed
  #publisher_or_issuer
  #status
  #endorsement_date
  #endorsement_remarks
  #hr_verification_date
  #hr_verification_seal
  #proof_url

  constructor(data = {}) {
    this.#id = data.id || `acc_${Date.now()}`
    this.#title = data.title || 'Untitled Accomplishment'
    this.#faculty_id = data.faculty_id || 'EMP-2021-0000'
    this.#faculty_name = data.faculty_name || 'Faculty Member'
    this.#college = data.college || 'CEAC'
    this.#program = data.program || 'BS Computer Science'
    this.#category = data.category || 'Research Publication'
    this.#date_completed = data.date_completed || new Date().toISOString().split('T')[0]
    this.#publisher_or_issuer = data.publisher_or_issuer || 'IEEE Xplore Journal'
    this.#status = data.status || 'endorsed'
    this.#endorsement_date = data.endorsement_date || data.secretary_endorsement_date || new Date().toISOString().split('T')[0]
    this.#endorsement_remarks = data.endorsement_remarks || data.secretary_remarks || 'Endorsed for HR verification & promotion credit.'
    this.#hr_verification_date = data.hr_verification_date || null
    this.#hr_verification_seal = data.hr_verification_seal || null
    this.#proof_url = data.proof_url || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  }

  get id() { return this.#id }
  get title() { return this.#title }
  get faculty_id() { return this.#faculty_id }
  get faculty_name() { return this.#faculty_name }
  get college() { return this.#college }
  get program() { return this.#program }
  get category() { return this.#category }
  get date_completed() { return this.#date_completed }
  get publisher_or_issuer() { return this.#publisher_or_issuer }
  get status() { return this.#status }
  get endorsement_date() { return this.#endorsement_date }
  get secretary_endorsement_date() { return this.#endorsement_date }
  get endorsement_remarks() { return this.#endorsement_remarks }
  get secretary_remarks() { return this.#endorsement_remarks }
  get hr_verification_date() { return this.#hr_verification_date }
  get hr_verification_seal() { return this.#hr_verification_seal }
  get proof_url() { return this.#proof_url }

  sealVerification(sealCode = 'HR-SEAL-2026') {
    this.#status = 'hr_verified'
    this.#hr_verification_date = new Date().toISOString()
    this.#hr_verification_seal = sealCode
  }

  returnToFaculty(remarks) {
    this.#status = 'returned'
    this.#endorsement_remarks = remarks
  }

  toJSON() {
    return {
      id: this.#id,
      title: this.#title,
      faculty_id: this.#faculty_id,
      faculty_name: this.#faculty_name,
      college: this.#college,
      program: this.#program,
      category: this.#category,
      date_completed: this.#date_completed,
      publisher_or_issuer: this.#publisher_or_issuer,
      status: this.#status,
      endorsement_date: this.#endorsement_date,
      secretary_endorsement_date: this.#endorsement_date,
      endorsement_remarks: this.#endorsement_remarks,
      secretary_remarks: this.#endorsement_remarks,
      hr_verification_date: this.#hr_verification_date,
      hr_verification_seal: this.#hr_verification_seal,
      proof_url: this.#proof_url
    }
  }
}

export class ServiceAwardCategoryEntity {
  #id
  #title
  #min_tenure_years
  #min_verified_points
  #target_group
  #badge_color

  constructor(data = {}) {
    this.#id = data.id || `awd_${Date.now()}`
    this.#title = data.title || 'Loyalty & Dedicated Service Award'
    this.#min_tenure_years = typeof data.min_tenure_years === 'number' ? data.min_tenure_years : 10
    this.#min_verified_points = typeof data.min_verified_points === 'number' ? data.min_verified_points : 50
    this.#target_group = data.target_group || 'All University Personnel'
    this.#badge_color = data.badge_color || 'emerald'
  }

  get id() { return this.#id }
  get title() { return this.#title }
  get min_tenure_years() { return this.#min_tenure_years }
  get min_verified_points() { return this.#min_verified_points }
  get target_group() { return this.#target_group }
  get badge_color() { return this.#badge_color }

  toJSON() {
    return {
      id: this.#id,
      title: this.#title,
      min_tenure_years: this.#min_tenure_years,
      min_verified_points: this.#min_verified_points,
      target_group: this.#target_group,
      badge_color: this.#badge_color
    }
  }
}

export class HRAuditLogEntity {
  #schema_version
  #id
  #timestamp
  #event_code
  #category
  #actor_id
  #actor_name
  #actor_role
  #target_type
  #target_id
  #target_label
  #details
  #reference_id
  #metadata

  constructor(data = {}) {
    this.#schema_version = data.schema_version || '1.0'
    this.#id = data.id || `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`
    
    // Canonical timestamp field (accepts legacy timestamp or created_at)
    this.#timestamp = data.timestamp || data.created_at || new Date().toISOString()
    
    // Canonical event code (accepts legacy action_type)
    this.#event_code = data.event_code || data.action_type || 'ROLE_ASSIGNMENT'
    this.#category = data.category || null
    
    // Actor credentials (accepts legacy admin_name)
    this.#actor_id = data.actor_id || 'HR-DIR-001'
    this.#actor_name = data.actor_name || data.admin_name || 'Director Evelyn Tan'
    this.#actor_role = data.actor_role || (data.admin_name?.includes('HR Director') ? 'HR Director' : 'HR Staff')
    
    // Target entity context (accepts legacy target_personnel)
    this.#target_type = data.target_type || 'personnel'
    this.#target_id = data.target_id || null
    this.#target_label = data.target_label || data.target_personnel || 'N/A'
    
    this.#details = data.details || 'Administrative transaction executed.'
    this.#reference_id = data.reference_id || null
    this.#metadata = data.metadata && typeof data.metadata === 'object' ? data.metadata : {}
  }

  get schema_version() { return this.#schema_version }
  get id() { return this.#id }
  get timestamp() { return this.#timestamp }
  get created_at() { return this.#timestamp } // Legacy alias for CSV compatibility
  get event_code() { return this.#event_code }
  get action_type() { return this.#event_code } // Legacy alias
  get category() { return this.#category }
  get actor_id() { return this.#actor_id }
  get actor_name() { return this.#actor_name }
  get admin_name() { return this.#actor_name } // Legacy alias
  get actor_role() { return this.#actor_role }
  get target_type() { return this.#target_type }
  get target_id() { return this.#target_id }
  get target_label() { return this.#target_label }
  get target_personnel() { return this.#target_label } // Legacy alias
  get details() { return this.#details }
  get reference_id() { return this.#reference_id }
  get metadata() { return { ...this.#metadata } }

  toJSON() {
    return {
      schema_version: this.#schema_version,
      id: this.#id,
      timestamp: this.#timestamp,
      event_code: this.#event_code,
      action_type: this.#event_code,
      category: this.#category,
      actor_id: this.#actor_id,
      actor_name: this.#actor_name,
      admin_name: this.#actor_name,
      actor_role: this.#actor_role,
      target_type: this.#target_type,
      target_id: this.#target_id,
      target_label: this.#target_label,
      target_personnel: this.#target_label,
      details: this.#details,
      reference_id: this.#reference_id,
      metadata: { ...this.#metadata }
    }
  }
}

export default class HRModel {
  static ACADEMIC_RANKS = [
    'Instructor I', 'Instructor II', 'Instructor III',
    'Assistant Professor I', 'Assistant Professor II', 'Assistant Professor III', 'Assistant Professor IV',
    'Associate Professor I', 'Associate Professor II', 'Associate Professor III', 'Associate Professor IV',
    'Full Professor I', 'Full Professor II', 'Full Professor III', 'University Professor'
  ]

  static EMPLOYMENT_STATUSES = [
    'Full-Time Permanent',
    'Full-Time Probationary',
    'Part-Time Faculty',
    'Administrative Staff',
    'On Official Study Leave',
    'Professor Emeritus'
  ]

  static COLLEGES = [
    'CEAC - College of Engineering, Architecture, and Computing',
    'CBA - College of Business Administration',
    'CAS - College of Arts and Sciences',
    'CED - College of Education',
    'CON - College of Nursing'
  ]

  static ACADEMIC_PROGRAMS = [
    { code: 'BSCS', name: 'Bachelor of Science in Computer Science', college: 'CEAC' },
    { code: 'BSIT', name: 'Bachelor of Science in Information Technology', college: 'CEAC' },
    { code: 'BSCE', name: 'Bachelor of Science in Civil Engineering', college: 'CEAC' },
    { code: 'BSBA', name: 'Bachelor of Science in Business Administration', college: 'CBA' },
    { code: 'BAENG', name: 'Bachelor of Arts in English Language', college: 'CAS' },
    { code: 'BSED', name: 'Bachelor of Secondary Education', college: 'CED' }
  ]
}
