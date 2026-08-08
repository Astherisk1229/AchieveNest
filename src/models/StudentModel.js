/**
 * StudentModel.js
 * OOP Domain Model encapsulating student attributes, achievements calculation, and filter criteria matching.
 */
export default class StudentModel {
  #id
  #student_id
  #full_name
  #email
  #program
  #year_level
  #department_id
  #college
  #verified_points
  #achievements_count
  #verified_count
  #pending_count
  #avatar_url

  constructor(data = {}) {
    this.#id = data.id || `std_${Math.random().toString(36).substr(2, 9)}`
    this.#student_id = (data.student_id || '202400000').replace(/-/g, '')
    this.#full_name = data.full_name || 'Anonymous Student'
    this.#email = data.email || `${(data.full_name || 'student').toLowerCase().replace(/\s+/g, '.')}@ndmu.edu.ph`
    this.#program = data.program || 'BS Computer Science (CEAC)'
    this.#year_level = data.year_level || '1st Year'
    this.#department_id = data.department_id || null
    this.#college = data.college || null
    this.#verified_points = Number(data.verified_points) || 0
    this.#achievements_count = Number(data.achievements_count || data.total_submissions) || 0
    this.#verified_count = Number(data.verified_count) || 0
    this.#pending_count = Number(data.pending_count) || 0
    this.#avatar_url = data.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
  }

  // Encapsulated Getters
  get id() { return this.#id }
  get student_id() { return this.#student_id }
  get full_name() { return this.#full_name }
  get email() { return this.#email }
  get program() { return this.#program }
  get year_level() { return this.#year_level }
  get department_id() { return this.#department_id }
  get college() { return this.#college }
  get verified_points() { return this.#verified_points }
  get achievements_count() { return this.#achievements_count }
  get verified_count() { return this.#verified_count }
  get pending_count() { return this.#pending_count }
  get avatar_url() { return this.#avatar_url }

  // Auto-Reconciliation Linker Method
  linkDepartment(departmentId, collegeCode) {
    this.#department_id = departmentId
    this.#college = collegeCode
  }

  // Business Logic Methods
  matchesFilter(searchQuery = '', yearFilter = 'All Years', courseFilter = 'All Courses') {
    const q = searchQuery.toLowerCase().trim()
    const cleanId = this.#student_id.replace(/-/g, '')
    const matchesSearch = !q || 
      this.#full_name.toLowerCase().includes(q) ||
      cleanId.includes(q.replace(/-/g, '')) ||
      this.#email.toLowerCase().includes(q)

    const matchesYear = yearFilter === 'All Years' || this.#year_level === yearFilter
    const matchesCourse = courseFilter === 'All Courses' || this.#program.toLowerCase().includes(courseFilter.toLowerCase())

    return matchesSearch && matchesYear && matchesCourse
  }

  toJSON() {
    return {
      id: this.#id,
      student_id: this.#student_id,
      full_name: this.#full_name,
      email: this.#email,
      program: this.#program,
      year_level: this.#year_level,
      department_id: this.#department_id,
      college: this.#college,
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
