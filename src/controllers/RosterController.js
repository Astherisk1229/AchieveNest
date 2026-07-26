import StudentModel from '../models/StudentModel'

/**
 * RosterController.js
 * MVC Controller handling student roster filtering, search queries, and student dossier lookups.
 */
export default class RosterController {
  #students

  constructor(initialStudents = []) {
    this.#students = (initialStudents || []).map(std =>
      std instanceof StudentModel ? std : StudentModel.fromJSON(std)
    )
  }

  get allStudents() {
    return [...this.#students]
  }

  getFilteredRoster(searchQuery = '', yearFilter = 'All Years', courseFilter = 'All Courses') {
    return this.#students.filter(std => std.matchesFilter(searchQuery, yearFilter, courseFilter))
  }

  findStudentById(id) {
    return this.#students.find(std => std.id === id || std.student_id === id) || null
  }
}
