/**
 * AchievementModel.js
 * OOP Domain Model encapsulating achievement submissions, verification statuses, and remarks.
 */
export default class AchievementModel {
  #id
  #student_id
  #student_name
  #program
  #title
  #event_name
  #issuer
  #category
  #scope_level
  #rank_conferred
  #academic_year
  #semester
  #description
  #attached_file_name
  #date
  #status
  #return_remarks
  #docs_count
  #participation_photo_name

  constructor(data = {}) {
    this.#id = data.id || `ach_${Math.random().toString(36).substr(2, 9)}`
    this.#student_id = data.student_id || '2024-00000'
    this.#student_name = data.student_name || 'Anonymous Student'
    this.#program = data.program || 'BS Computer Science'
    this.#title = data.title || 'Untitled Achievement'
    this.#event_name = data.event_name || ''
    this.#issuer = data.issuer || ''
    this.#category = data.category || 'Academic'
    this.#scope_level = data.scope_level || 'Institutional / Campus-Wide'
    this.#rank_conferred = data.rank_conferred || 'Participant / Special Award'
    this.#academic_year = data.academic_year || 'AY 2025-2026'
    this.#semester = data.semester || '1st Semester'
    this.#description = data.description || ''
    this.#attached_file_name = data.attached_file_name || 'supporting_document.pdf'
    this.#date = data.date || new Date().toISOString().split('T')[0]
    this.#status = data.status || 'Pending' // 'Pending' | 'Verified' | 'Returned'
    this.#return_remarks = data.return_remarks || ''
    this.#docs_count = Number(data.docs_count) || 1
    this.#participation_photo_name = data.participation_photo_name || ''
  }

  // Encapsulated Getters
  get id() { return this.#id }
  get student_id() { return this.#student_id }
  get student_name() { return this.#student_name }
  get program() { return this.#program }
  get title() { return this.#title }
  get event_name() { return this.#event_name }
  get issuer() { return this.#issuer }
  get category() { return this.#category }
  get scope_level() { return this.#scope_level }
  get rank_conferred() { return this.#rank_conferred }
  get academic_year() { return this.#academic_year }
  get semester() { return this.#semester }
  get description() { return this.#description }
  get attached_file_name() { return this.#attached_file_name }
  get date() { return this.#date }
  get status() { return this.#status }
  get return_remarks() { return this.#return_remarks }
  get docs_count() { return this.#docs_count }
  get participation_photo_name() { return this.#participation_photo_name }

  // State Mutator Methods
  verify() {
    this.#status = 'Verified'
    this.#return_remarks = ''
    return this
  }

  returnWithRemarks(remarks = '') {
    this.#status = 'Returned'
    this.#return_remarks = remarks
    return this
  }

  matchesFilter(searchQuery = '', statusFilter = 'All') {
    const q = searchQuery.toLowerCase().trim()
    const matchesSearch = !q ||
      this.#title.toLowerCase().includes(q) ||
      this.#student_name.toLowerCase().includes(q) ||
      this.#category.toLowerCase().includes(q) ||
      (this.#event_name && this.#event_name.toLowerCase().includes(q)) ||
      (this.#issuer && this.#issuer.toLowerCase().includes(q))

    const matchesStatus = statusFilter === 'All' || this.#status === statusFilter
    return matchesSearch && matchesStatus
  }

  toJSON() {
    return {
      id: this.#id,
      student_id: this.#student_id,
      student_name: this.#student_name,
      program: this.#program,
      title: this.#title,
      event_name: this.#event_name,
      issuer: this.#issuer,
      category: this.#category,
      scope_level: this.#scope_level,
      rank_conferred: this.#rank_conferred,
      academic_year: this.#academic_year,
      semester: this.#semester,
      description: this.#description,
      attached_file_name: this.#attached_file_name,
      date: this.#date,
      status: this.#status,
      return_remarks: this.#return_remarks,
      docs_count: this.#docs_count,
      participation_photo_name: this.#participation_photo_name
    }
  }

  static fromJSON(data) {
    return new AchievementModel(data)
  }
}
