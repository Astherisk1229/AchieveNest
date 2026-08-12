import AchievementModel from './AchievementModel'

/**
 * VerificationQueueModel.js
 * OOP Domain Repository Model managing collections of student submission models,
 * status counting, and CSV dataset exports.
 */
export default class VerificationQueueModel {
  #items

  constructor(initialItems = []) {
    this.#items = (initialItems || []).map(item =>
      item instanceof AchievementModel ? item : AchievementModel.fromJSON(item)
    )
  }

  get items() {
    return [...this.#items]
  }

  get pendingCount() {
    return this.#items.filter(item => item.status === 'Pending').length
  }

  get verifiedCount() {
    return this.#items.filter(item => item.status === 'Verified').length
  }

  get returnedCount() {
    return this.#items.filter(item => item.status === 'Returned').length
  }

  filter(searchQuery = '', statusFilter = 'All') {
    return this.#items.filter(item => item.matchesFilter(searchQuery, statusFilter))
  }

  approveItem(id) {
    const target = this.#items.find(item => item.id === id)
    if (target) {
      target.verify()
    }
    return this
  }

  returnItem(id, remarks) {
    const target = this.#items.find(item => item.id === id)
    if (target) {
      target.returnWithRemarks(remarks)
    }
    return this
  }

  generateCSVReport(programScope = 'BS Computer Science') {
    const headers = ['Submission ID', 'Student Name', 'Student ID', 'Title', 'Category', 'Scope Level', 'Points', 'Status', 'Date']
    const rows = this.#items.map(s => [
      `SUB-${s.id}`,
      `"${s.student_name}"`,
      `"${s.student_id}"`,
      `"${s.title.replace(/"/g, '""')}"`,
      `"${s.category}"`,
      `"${s.scope_level}"`,
      s.points,
      `"${s.status}"`,
      `"${s.date}"`
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    return {
      encodedUri: encodeURI(csvContent),
      filename: `${programScope.replace(/\s+/g, '_')}_Verification_Report_2026.csv`
    }
  }

  toJSON() {
    return this.#items.map(item => item.toJSON())
  }
}
