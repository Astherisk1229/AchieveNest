import PersonnelPortfolioController from './PersonnelPortfolioController.js'
import PersonnelPortfolioModel from '../models/PersonnelPortfolioModel.js'

/**
 * HRRankingController.js
 * MVC Controller managing HR global university ranking masterboard, department secretary assignments,
 * final score audit overrides, and official ranking score lock (`HR_APPROVED`).
 */
export default class HRRankingController {
  /**
   * Fetches all personnel portfolios across all university departments.
   * @returns {Array<PersonnelPortfolioModel>}
   */
  static getAllPortfolios() {
    const list = PersonnelPortfolioController.getRawStorage()
    return list.map(data => new PersonnelPortfolioModel(data))
  }

  /**
   * Filters portfolios by department, college, search query, or status.
   */
  static filterMasterboard(searchQuery = '', departmentFilter = 'All', statusFilter = 'All') {
    const all = HRRankingController.getAllPortfolios()
    const q = searchQuery.toLowerCase().trim()

    return all.filter(p => {
      const matchesSearch = !q ||
        p.personnel_name.toLowerCase().includes(q) ||
        p.personnel_id.toLowerCase().includes(q) ||
        p.academic_rank.toLowerCase().includes(q) ||
        p.department_name.toLowerCase().includes(q)

      const matchesDept = departmentFilter === 'All' || p.department_id === departmentFilter
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter

      return matchesSearch && matchesDept && matchesStatus
    })
  }

  /**
   * Performs an HR final score audit override on a specific line item.
   */
  static overrideItemScore(portfolioId, areaKey, itemId, verifiedPoints, hrRemarks = '') {
    const list = PersonnelPortfolioController.getRawStorage()
    const index = list.findIndex(p => p.id === portfolioId)
    if (index < 0) throw new Error('Portfolio not found.')

    const model = new PersonnelPortfolioModel(list[index])
    model.updateItemVerification(areaKey, itemId, verifiedPoints, true, `HR Override: ${hrRemarks}`)

    PersonnelPortfolioController.persistPortfolio(model)
    return model
  }

  /**
   * HR locks the official ranking score for a portfolio.
   */
  static approveAndLockRankingScore(portfolioId, hrOfficerName = 'HR Director', remarks = '') {
    const list = PersonnelPortfolioController.getRawStorage()
    const index = list.findIndex(p => p.id === portfolioId)
    if (index < 0) throw new Error('Portfolio not found.')

    const model = new PersonnelPortfolioModel(list[index])
    model.transitionStatus('HR_APPROVED', hrOfficerName, 'Human Resources', remarks || 'Official NDMU Ranking Score Audited and Locked.')

    PersonnelPortfolioController.persistPortfolio(model)
    return model
  }

  /**
   * HR returns portfolio back to Department Secretary if evaluation error found.
   */
  static returnToDepSec(portfolioId, hrOfficerName = 'HR Director', remarks = '') {
    if (!remarks || !remarks.trim()) {
      throw new Error('Mandatory feedback remarks required when returning portfolio to Department Secretary.')
    }

    const list = PersonnelPortfolioController.getRawStorage()
    const index = list.findIndex(p => p.id === portfolioId)
    if (index < 0) throw new Error('Portfolio not found.')

    const model = new PersonnelPortfolioModel(list[index])
    model.transitionStatus('UNDER_DEP_SEC_REVIEW', hrOfficerName, 'Human Resources', `HR Audit Return: ${remarks.trim()}`)

    PersonnelPortfolioController.persistPortfolio(model)
    return model
  }
}
