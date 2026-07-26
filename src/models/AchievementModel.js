/**
 * AchievementModel.js
 * OOP Domain Model encapsulating achievement submissions, verification statuses, and remarks.
 */
export default class AchievementModel {
  #id
  #student_id
  #student_name
  #title
  #category
  #scope_level
  #description
  #attached_file_name
  #date
  #points
  #status
  #return_remarks
  #docs_count

  constructor(data = {}) {
    this.#id = data.id || `ach_${Math.random().toString(36).substr(2, 9)}`
    this.#student_id = data.student_id || '2024-00000'
    this.#student_name = data.student_name || 'Anonymous Student'
    this.#title = data.title || 'Untitled Achievement'
    this.#category = data.category || 'Academic & Innovation'
    this.#scope_level = data.scope_level || 'Institutional Level'
    this.#description = data.description || ''
    this.#attached_file_name = data.attached_file_name || 'supporting_document.pdf'
    this.#date = data.date || new Date().toISOString().split('T')[0]
    this.#points = Number(data.points) || 10
    this.#status = data.status || 'Pending' // 'Pending' | 'Verified' | 'Returned'
    this.#return_remarks = data.return_remarks || ''
    this.#docs_count = Number(data.docs_count) || 1
  }

  // Encapsulated Getters
  get id() { return this.#id }
  get student_id() { return this.#student_id }
  get student_name() { return this.#student_name }
  get title() { return this.#title }
  get category() { return this.#category }
  get scope_level() { return this.#scope_level }
  get description() { return this.#description }
  get attached_file_name() { return this.#attached_file_name }
  get date() { return this.#date }
  get points() { return this.#points }
  get status() { return this.#status }
  get return_remarks() { return this.#return_remarks }
  get docs_count() { return this.#docs_count }

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
      this.#category.toLowerCase().includes(q)

    const matchesStatus = statusFilter === 'All' || this.#status === statusFilter
    return matchesSearch && matchesStatus
  }

  toJSON() {
    return {
      id: this.#id,
      student_id: this.#student_id,
      student_name: this.#student_name,
      title: this.#title,
      category: this.#category,
      scope_level: this.#scope_level,
      description: this.#description,
      attached_file_name: this.#attached_file_name,
      date: this.#date,
      points: this.#points,
      status: this.#status,
      return_remarks: this.#return_remarks,
      docs_count: this.#docs_count
    }
  }

  static fromJSON(data) {
    return new AchievementModel(data)
  }
}
