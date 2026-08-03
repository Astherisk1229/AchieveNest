import PersonnelPortfolioController from './PersonnelPortfolioController.js'
import PersonnelPortfolioModel from '../models/PersonnelPortfolioModel.js'

/**
 * DepSecVerificationController.js
 * MVC Controller handling Department Secretary portfolio reviews, department-scoped filtering,
 * line-item verification updates (claimed vs verified points), section remarks, and HR endorsement.
 */
export default class DepSecVerificationController {
  #assignedDepartmentId

  constructor(assignedDepartmentId = 'DEP-CEAC') {
    this.#assignedDepartmentId = assignedDepartmentId
  }

  get assignedDepartmentId() {
    return this.#assignedDepartmentId
  }

  /**
   * Loads all portfolios filtered strictly to the Department Secretary's assigned department.
   * @returns {Array<PersonnelPortfolioModel>}
   */
  getDepartmentPortfolios() {
    const list = PersonnelPortfolioController.getRawStorage()
    return list
      .map(data => new PersonnelPortfolioModel(data))
      .filter(p => p.matchesDepartment(this.#assignedDepartmentId))
  }

  /**
   * Filters department portfolios by search query and status.
   */
  filterPortfolios(searchQuery = '', statusFilter = 'All') {
    const all = this.getDepartmentPortfolios()
    const q = searchQuery.toLowerCase().trim()

    return all.filter(p => {
      const matchesSearch = !q ||
        p.personnel_name.toLowerCase().includes(q) ||
        p.personnel_id.toLowerCase().includes(q) ||
        p.academic_rank.toLowerCase().includes(q)

      const matchesStatus = statusFilter === 'All' || p.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }

  /**
   * Updates line-item verification details (verified points, proof checkbox, remarks).
   */
  updateItemVerification(portfolioId, areaKey, itemId, verifiedPoints, isProofVerified, remarks = '') {
    const list = PersonnelPortfolioController.getRawStorage()
    const index = list.findIndex(p => p.id === portfolioId)
    if (index < 0) throw new Error('Portfolio not found.')

    const model = new PersonnelPortfolioModel(list[index])
    model.updateItemVerification(areaKey, itemId, verifiedPoints, isProofVerified, remarks)

    if (model.status === 'SUBMITTED_TO_DEP_SEC') {
      model.transitionStatus('UNDER_DEP_SEC_REVIEW', 'Dept. Secretary', 'Department Secretary', 'Started reviewing portfolio entries.')
    }

    PersonnelPortfolioController.persistPortfolio(model)
    return model
  }

  /**
   * Endorses the verified portfolio to HR.
   */
  endorseToHR(portfolioId, evaluatorName = 'Dept. Secretary', remarks = '') {
    const list = PersonnelPortfolioController.getRawStorage()
    const index = list.findIndex(p => p.id === portfolioId)
    if (index < 0) throw new Error('Portfolio not found.')

    const model = new PersonnelPortfolioModel(list[index])
    model.transitionStatus('ENDORSED_TO_HR', evaluatorName, 'Department Secretary', remarks || 'Portoflio verified and endorsed to HR.')
    
    PersonnelPortfolioController.persistPortfolio(model)
    return model
  }

  /**
   * Returns portfolio to personnel for revision with mandatory remarks.
   */
  returnToPersonnel(portfolioId, evaluatorName = 'Dept. Secretary', remarks = '') {
    if (!remarks || !remarks.trim()) {
      throw new Error('Mandatory feedback remarks required when requesting revisions.')
    }

    const list = PersonnelPortfolioController.getRawStorage()
    const index = list.findIndex(p => p.id === portfolioId)
    if (index < 0) throw new Error('Portfolio not found.')

    const model = new PersonnelPortfolioModel(list[index])
    model.transitionStatus('RETURNED_TO_PERSONNEL', evaluatorName, 'Department Secretary', remarks.trim())

    PersonnelPortfolioController.persistPortfolio(model)
    return model
  }
}
