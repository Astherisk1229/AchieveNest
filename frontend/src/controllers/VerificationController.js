import VerificationQueueModel from '../models/VerificationQueueModel'

/**
 * VerificationController.js
 * MVC Controller handling submission reviews, verification workflows, status filtering, and report downloads.
 */
export default class VerificationController {
  #queueModel

  constructor(initialSubmissions = []) {
    this.#queueModel = new VerificationQueueModel(initialSubmissions)
  }

  get queueModel() {
    return this.#queueModel
  }

  getPendingCount() {
    return this.#queueModel.pendingCount
  }

  getVerifiedCount() {
    return this.#queueModel.verifiedCount
  }

  getReturnedCount() {
    return this.#queueModel.returnedCount
  }

  getFilteredSubmissions(searchQuery = '', statusFilter = 'All') {
    return this.#queueModel.filter(searchQuery, statusFilter)
  }

  approveSubmission(id) {
    this.#queueModel.approveItem(id)
    return this.#queueModel.items
  }

  returnSubmission(id, remarks) {
    this.#queueModel.returnItem(id, remarks)
    return this.#queueModel.items
  }

  exportCSV(programScope = 'BS Computer Science') {
    const { encodedUri, filename } = this.#queueModel.generateCSVReport(programScope)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}
