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
  #department
  #academic_rank
  #employment_status
  #tenure_years
  #verified_accomplishments_count
  #assigned_roles
  #avatar_url

  constructor(data = {}) {
    this.#id = data.id || `emp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`
    this.#employee_id = data.employee_id || 'EMP-2021-0000'
    this.#full_name = data.full_name || 'Dr. Personnel'
    this.#email = data.email || 'personnel@ndmu.edu.ph'
    this.#college = data.college || 'College of Engineering, Architecture, and Computing (CEAC)'
    this.#department = data.department || 'Department of Computer Studies'
    this.#academic_rank = data.academic_rank || 'Assistant Professor I'
    this.#employment_status = data.employment_status || 'Full-Time Permanent'
    this.#tenure_years = typeof data.tenure_years === 'number' ? data.tenure_years : 5
    this.#verified_accomplishments_count = typeof data.verified_accomplishments_count === 'number' ? data.verified_accomplishments_count : 0
    this.#assigned_roles = Array.isArray(data.assigned_roles) ? data.assigned_roles : []
    this.#avatar_url = data.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'
  }

  get id() { return this.#id }
  get employee_id() { return this.#employee_id }
  get full_name() { return this.#full_name }
  get email() { return this.#email }
  get college() { return this.#college }
  get department() { return this.#department }
  get academic_rank() { return this.#academic_rank }
  get employment_status() { return this.#employment_status }
  get tenure_years() { return this.#tenure_years }
  get verified_accomplishments_count() { return this.#verified_accomplishments_count }
  get assigned_roles() { return [...this.#assigned_roles] }
  get avatar_url() { return this.#avatar_url }

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
      department: this.#department,
      academic_rank: this.#academic_rank,
      employment_status: this.#employment_status,
      tenure_years: this.#tenure_years,
      verified_accomplishments_count: this.#verified_accomplishments_count,
      assigned_roles: [...this.#assigned_roles],
      avatar_url: this.#avatar_url
    }
  }
}

export class FacultyAccomplishmentEntity {
  #id
  #title
  #faculty_id
  #faculty_name
  #college
  #department
  #category
  #date_completed
  #publisher_or_issuer
  #status
  #secretary_endorsement_date
  #secretary_remarks
  #hr_verification_date
  #hr_verification_seal
  #proof_url

  constructor(data = {}) {
    this.#id = data.id || `acc_${Date.now()}`
    this.#title = data.title || 'Untitled Accomplishment'
    this.#faculty_id = data.faculty_id || 'EMP-2021-0000'
    this.#faculty_name = data.faculty_name || 'Faculty Member'
    this.#college = data.college || 'CEAC'
    this.#department = data.department || 'Computer Studies'
    this.#category = data.category || 'Research Publication'
    this.#date_completed = data.date_completed || new Date().toISOString().split('T')[0]
    this.#publisher_or_issuer = data.publisher_or_issuer || 'IEEE Xplore Journal'
    this.#status = data.status || 'dept_endorsed'
    this.#secretary_endorsement_date = data.secretary_endorsement_date || new Date().toISOString().split('T')[0]
    this.#secretary_remarks = data.secretary_remarks || 'Endorsed for HR verification & promotion credit.'
    this.#hr_verification_date = data.hr_verification_date || null
    this.#hr_verification_seal = data.hr_verification_seal || null
    this.#proof_url = data.proof_url || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  }

  get id() { return this.#id }
  get title() { return this.#title }
  get faculty_id() { return this.#faculty_id }
  get faculty_name() { return this.#faculty_name }
  get college() { return this.#college }
  get department() { return this.#department }
  get category() { return this.#category }
  get date_completed() { return this.#date_completed }
  get publisher_or_issuer() { return this.#publisher_or_issuer }
  get status() { return this.#status }
  get secretary_endorsement_date() { return this.#secretary_endorsement_date }
  get secretary_remarks() { return this.#secretary_remarks }
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
    this.#secretary_remarks = remarks
  }

  toJSON() {
    return {
      id: this.#id,
      title: this.#title,
      faculty_id: this.#faculty_id,
      faculty_name: this.#faculty_name,
      college: this.#college,
      department: this.#department,
      category: this.#category,
      date_completed: this.#date_completed,
      publisher_or_issuer: this.#publisher_or_issuer,
      status: this.#status,
      secretary_endorsement_date: this.#secretary_endorsement_date,
      secretary_remarks: this.#secretary_remarks,
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
  #id
  #timestamp
  #admin_name
  #action_type
  #target_personnel
  #details

  constructor(data = {}) {
    this.#id = data.id || `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`
    this.#timestamp = data.timestamp || new Date().toISOString()
    this.#admin_name = data.admin_name || 'Director Evelyn Tan (HR Director)'
    this.#action_type = data.action_type || 'ROLE_ASSIGNMENT'
    this.#target_personnel = data.target_personnel || 'N/A'
    this.#details = data.details || 'Administrative transaction executed.'
  }

  get id() { return this.#id }
  get timestamp() { return this.#timestamp }
  get admin_name() { return this.#admin_name }
  get action_type() { return this.#action_type }
  get target_personnel() { return this.#target_personnel }
  get details() { return this.#details }

  toJSON() {
    return {
      id: this.#id,
      timestamp: this.#timestamp,
      admin_name: this.#admin_name,
      action_type: this.#action_type,
      target_personnel: this.#target_personnel,
      details: this.#details
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

  static ACADEMIC_DEPARTMENTS = [
    { code: 'CS', name: 'Department of Computer Studies', college: 'CEAC' },
    { code: 'ENG', name: 'Department of Engineering & Architecture', college: 'CEAC' },
    { code: 'BUS', name: 'Department of Business Administration & Accountancy', college: 'CBA' },
    { code: 'LANG', name: 'Department of Languages & Humanities', college: 'CAS' },
    { code: 'SCI', name: 'Department of Natural Sciences & Mathematics', college: 'CAS' },
    { code: 'EDUC', name: 'Department of Teacher Education', college: 'CED' }
  ]
}
