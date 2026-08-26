/**
 * StudentModel.js
 * OOP Domain Model encapsulating student attributes, academic placement, achievements calculation, and filter criteria matching.
 */
export default class StudentModel {
  #id
  #student_id
  #full_name
  #email
  #academic_program_id
  #academic_program_code
  #academic_program_name
  #college_id
  #college_code
  #college_name
  #year_level
  #verified_points
  #achievements_count
  #verified_count
  #pending_count
  #avatar_url

  constructor(data = {}) {
    this.#id = data.id || `std_${Math.random().toString(36).substr(2, 9)}`
    this.#student_id = (data.student_id || data.institutional_id || '202400000').replace(/-/g, '')
    this.#full_name = data.full_name || 'Anonymous Student'
    this.#email = data.email || data.institutional_email || `${(data.full_name || 'student').toLowerCase().replace(/\s+/g, '.')}@ndmu.edu.ph`
    
    // Placement
    this.#academic_program_id = data.academic_program_id || data.degree_program_id || null
    this.#academic_program_code = data.academic_program_code || (typeof data.program === 'string' ? data.program.split(' ')[0] : 'BSCS')
    this.#academic_program_name = data.academic_program_name || data.program || 'BS Computer Science'
    this.#college_id = data.college_id || null
    this.#college_code = data.college_code || (typeof data.college === 'string' ? data.college : 'CEAC')
    this.#college_name = data.college_name || (data.college_code === 'CEAC' ? 'College of Engineering, Architecture, and Computing' : (data.college || ''))
    
    this.#year_level = data.year_level || '1st Year'
    this.#verified_points = Number(data.verified_points) || 0
    this.#achievements_count = Number(data.achievements_count || data.total_submissions) || 0
    this.#verified_count = Number(data.verified_count) || 0
    this.#pending_count = Number(data.pending_count) || 0
    this.#avatar_url = data.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
  }

  // Encapsulated Getters
  get id() { return this.#id }
  get student_id() { return this.#student_id }
  get institutional_id() { return this.#student_id }
  get full_name() { return this.#full_name }
  get email() { return this.#email }
  get institutional_email() { return this.#email }
  get academic_program_id() { return this.#academic_program_id }
  get academic_program_code() { return this.#academic_program_code }
  get academic_program_name() { return this.#academic_program_name }
  get program() { return `${this.#academic_program_code} — ${this.#academic_program_name}` }
  get college_id() { return this.#college_id }
  get college_code() { return this.#college_code }
  get college_name() { return this.#college_name }
  get college() { return this.#college_code }
  get year_level() { return this.#year_level }
  get verified_points() { return this.#verified_points }
  get achievements_count() { return this.#achievements_count }
  get verified_count() { return this.#verified_count }
  get pending_count() { return this.#pending_count }
  get avatar_url() { return this.#avatar_url }

  // Business Logic Methods
  matchesFilter(searchQuery = '', yearFilter = 'All Years', courseFilter = 'All Courses') {
    const q = searchQuery.toLowerCase().trim()
    const cleanId = this.#student_id.replace(/-/g, '')
    const matchesSearch = !q || 
      this.#full_name.toLowerCase().includes(q) ||
      cleanId.includes(q.replace(/-/g, '')) ||
      this.#email.toLowerCase().includes(q)

    const matchesYear = yearFilter === 'All Years' || this.#year_level === yearFilter
    const matchesCourse = courseFilter === 'All Courses' || 
      this.#academic_program_code.toLowerCase().includes(courseFilter.toLowerCase()) ||
      this.#academic_program_name.toLowerCase().includes(courseFilter.toLowerCase())

    return matchesSearch && matchesYear && matchesCourse
  }

  toJSON() {
    return {
      id: this.#id,
      student_id: this.#student_id,
      institutional_id: this.#student_id,
      full_name: this.#full_name,
      email: this.#email,
      institutional_email: this.#email,
      academic_program_id: this.#academic_program_id,
      academic_program_code: this.#academic_program_code,
      academic_program_name: this.#academic_program_name,
      program: this.program,
      college_id: this.#college_id,
      college_code: this.#college_code,
      college_name: this.#college_name,
      college: this.#college_code,
      year_level: this.#year_level,
      verified_points: this.#verified_points,
      achievements_count: this.#achievements_count,
      verified_count: this.#verified_count,
      pending_count: this.#pending_count,
      avatar_url: this.#avatar_url
    }
  }

  static fromJSON(data) {
    return new StudentModel(data)
  }
}
