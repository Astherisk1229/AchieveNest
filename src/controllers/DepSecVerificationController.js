import PersonnelPortfolioController from './PersonnelPortfolioController.js'
import PersonnelPortfolioModel from '../models/PersonnelPortfolioModel.js'
import SecurityController from './SecurityController.js'

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
   * Auto-seeds sample faculty portfolios if storage is empty.
   * @returns {Array<PersonnelPortfolioModel>}
   */
  getDepartmentPortfolios() {
    let list = PersonnelPortfolioController.getRawStorage()
    
    if (list.length === 0) {
      // Auto-seed sample department faculty portfolios for evaluation
      const sample1 = PersonnelPortfolioController.loadPortfolio('EMP-2024-001', { personnel_name: 'Dr. Maria Santos', academic_rank: 'Assistant Professor II', department_id: 'DEP-CEAC' })
      const sample2 = PersonnelPortfolioController.loadPortfolio('EMP-2024-002', { personnel_name: 'Engr. Roberto Cruz', academic_rank: 'Associate Professor I', department_id: 'DEP-CEAC' })
      const sample3 = PersonnelPortfolioController.loadPortfolio('EMP-2024-003', { personnel_name: 'Prof. Ana Reyes', academic_rank: 'Assistant Professor III', department_id: 'DEP-CEAC' })
      
      sample1.status = 'SUBMITTED_TO_DEP_SEC'
      sample2.status = 'SUBMITTED_TO_DEP_SEC'
      sample3.status = 'UNDER_DEP_SEC_REVIEW'

      PersonnelPortfolioController.persistPortfolio(sample1)
      PersonnelPortfolioController.persistPortfolio(sample2)
      PersonnelPortfolioController.persistPortfolio(sample3)

      list = PersonnelPortfolioController.getRawStorage()
    }

    return list
      .map(data => new PersonnelPortfolioModel(data))
      .filter(p => p.matchesDepartment(this.#assignedDepartmentId))
  }

  /**
   * Checks if a portfolio belongs to the currently logged in Department Secretary.
   * Department Secretaries cannot evaluate their own portfolio to prevent conflict of interest.
   */
  isSelfPortfolio(portfolio, currentUserId = 'FAC-2024-SEC') {
    if (!portfolio || !currentUserId) return false
    return portfolio.personnel_id === currentUserId || 
           portfolio.personnel_name.toLowerCase().includes('secretary')
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
   * Enforces self-review prevention rule.
   */
  updateItemVerification(portfolioId, areaKey, itemId, verifiedPoints, isProofVerified, remarks = '', evaluatorId = '') {
    const list = PersonnelPortfolioController.getRawStorage()
    const index = list.findIndex(p => p.id === portfolioId)
    if (index < 0) throw new Error('Portfolio not found.')

    const model = new PersonnelPortfolioModel(list[index])
    if (this.isSelfPortfolio(model, evaluatorId)) {
      throw new Error('Conflict of Interest: Department Secretaries cannot evaluate their own portfolio. Self-portfolios are audited directly by HR.')
    }

    model.updateItemVerification(areaKey, itemId, verifiedPoints, isProofVerified, remarks)

    if (model.status === 'SUBMITTED_TO_DEP_SEC') {
      model.transitionStatus('UNDER_DEP_SEC_REVIEW', 'Dept. Secretary', 'Department Secretary', 'Started reviewing portfolio entries.')
    }

    PersonnelPortfolioController.persistPortfolio(model)
    return model
  }

  /**
   * Endorses the verified portfolio to HR.
   * Enforces self-review prevention rule.
   */
  endorseToHR(portfolioId, evaluatorName = 'Dept. Secretary', remarks = '', evaluatorId = '') {
    const list = PersonnelPortfolioController.getRawStorage()
    const index = list.findIndex(p => p.id === portfolioId)
    if (index < 0) throw new Error('Portfolio not found.')

    const model = new PersonnelPortfolioModel(list[index])
    if (this.isSelfPortfolio(model, evaluatorId)) {
      throw new Error('Conflict of Interest: Department Secretaries cannot evaluate their own portfolio. Self-portfolios are audited directly by HR.')
    }

    model.transitionStatus('ENDORSED_TO_HR', evaluatorName, 'Department Secretary', remarks || 'Portoflio verified and endorsed to HR.')
    
    PersonnelPortfolioController.persistPortfolio(model)
    SecurityController.logEvent('PORTFOLIO_ENDORSED', evaluatorName, 'department_secretary', `Endorsed ranking portfolio for ${model.personnel_name} (${model.academic_rank}) to HR Director.`)
    return model
  }

  /**
   * Returns portfolio to personnel for revision with mandatory remarks.
   * Enforces self-review prevention rule.
   */
  returnToPersonnel(portfolioId, evaluatorName = 'Dept. Secretary', remarks = '', evaluatorId = '') {
    if (!remarks || !remarks.trim()) {
      throw new Error('Mandatory feedback remarks required when requesting revisions.')
    }

    const list = PersonnelPortfolioController.getRawStorage()
    const index = list.findIndex(p => p.id === portfolioId)
    if (index < 0) throw new Error('Portfolio not found.')

    const model = new PersonnelPortfolioModel(list[index])
    if (this.isSelfPortfolio(model, evaluatorId)) {
      throw new Error('Conflict of Interest: Department Secretaries cannot evaluate their own portfolio. Self-portfolios are audited directly by HR.')
    }

    model.transitionStatus('RETURNED_TO_PERSONNEL', evaluatorName, 'Department Secretary', remarks.trim())

    PersonnelPortfolioController.persistPortfolio(model)
    SecurityController.logEvent('PORTFOLIO_RETURNED', evaluatorName, 'department_secretary', `Returned ranking portfolio for ${model.personnel_name} for revision: ${remarks.trim()}`)
    return model
  }
}
