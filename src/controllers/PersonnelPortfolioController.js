import PersonnelPortfolioModel from '../models/PersonnelPortfolioModel.js'

/**
 * PersonnelPortfolioController.js
 * MVC Controller managing Personnel Ranking Portfolio creation, line-item modifications,
 * proof attachment validation guards, dynamic score calculations, and status submissions.
 */
export default class PersonnelPortfolioController {
  static STORAGE_KEY = 'achievenest_personnel_portfolios'

  /**
   * Retrieves all portfolios stored in LocalStorage.
   * @returns {Array<Object>}
   */
  static getRawStorage() {
    try {
      const data = localStorage.getItem(PersonnelPortfolioController.STORAGE_KEY)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  }

  /**
   * Saves raw portfolio array back to LocalStorage.
   * @param {Array<Object>} array 
   */
  static saveRawStorage(array) {
    try {
      localStorage.setItem(PersonnelPortfolioController.STORAGE_KEY, JSON.stringify(array))
    } catch (err) {
      console.error('Failed to save portfolios to storage:', err)
    }
  }

  /**
   * Loads or initializes a Personnel Portfolio model by personnel ID.
   * @param {string} personnelId 
   * @param {Object} defaultData 
   * @returns {PersonnelPortfolioModel}
   */
  static loadPortfolio(personnelId = 'EMP-2024-001', defaultData = {}) {
    const list = PersonnelPortfolioController.getRawStorage()
    const found = list.find(p => p.personnel_id === personnelId)

    if (found) {
      return new PersonnelPortfolioModel(found)
    }

    // Initialize default sample portfolio if none exists
    const initial = new PersonnelPortfolioModel({
      personnel_id: personnelId,
      personnel_name: defaultData.personnel_name || 'Dr. Maria Santos',
      academic_rank: defaultData.academic_rank || 'Assistant Professor II',
      department_id: defaultData.department_id || 'DEP-CEAC',
      department_name: defaultData.department_name || 'College of Engineering, Architecture & Computing',
      academic_year: 'AY 2025-2026',
      years_of_service: 6,
      area_a_items: [
        {
          id: 'item_a1',
          category: 'Degree/s',
          title: 'Ph.D. in Computer Science',
          scope_level: 'Institutional',
          claimed_points: 40,
          verified_points: 40,
          proof_file_name: 'PhD_Diploma_Maria_Santos.pdf',
          is_proof_verified: true,
          remarks: 'Verified complete diploma.'
        },
        {
          id: 'item_a2',
          category: 'Attendance to Seminars/Trainings',
          title: 'National AI & Cloud Computing Summit 2025',
          scope_level: 'National',
          claimed_points: 8,
          verified_points: 8,
          proof_file_name: 'Certificate_AI_Summit_2025.pdf',
          is_proof_verified: true,
          remarks: ''
        }
      ],
      area_b_items: [
        {
          id: 'item_b1',
          category: 'Publication (Scholarly Paper/Article)',
          title: 'Deep Learning Algorithms in Academic Evaluation',
          scope_level: 'International',
          claimed_points: 40,
          verified_points: 40,
          proof_file_name: 'IEEE_Paper_Published_2025.pdf',
          is_proof_verified: true,
          remarks: 'Published in Scopus indexed journal.'
        },
        {
          id: 'item_b2',
          category: 'Guest Lecturer / Resource Person',
          title: 'Keynote Speaker: Regional Tech Symposium',
          scope_level: 'Regional',
          claimed_points: 15,
          verified_points: 15,
          proof_file_name: 'Keynote_Certificate_Invitation.pdf',
          is_proof_verified: true,
          remarks: ''
        }
      ],
      area_c_items: [
        {
          id: 'item_c1',
          category: 'Involvement in extra-curricular activities',
          title: 'Moderator: Computer Science Student Society',
          scope_level: 'Institutional',
          claimed_points: 20,
          verified_points: 20,
          proof_file_name: 'Moderator_Designation_AY2526.pdf',
          is_proof_verified: true,
          remarks: ''
        }
      ]
    })

    PersonnelPortfolioController.persistPortfolio(initial)
    return initial
  }

  /**
   * Persists a PersonnelPortfolioModel instance to storage.
   * @param {PersonnelPortfolioModel} portfolioModel 
   */
  static persistPortfolio(portfolioModel) {
    if (!portfolioModel) return
    const list = PersonnelPortfolioController.getRawStorage()
    const json = portfolioModel.toJSON()
    const index = list.findIndex(p => p.id === json.id || p.personnel_id === json.personnel_id)

    if (index >= 0) {
      list[index] = json
    } else {
      list.push(json)
    }

    PersonnelPortfolioController.saveRawStorage(list)
    return portfolioModel
  }

  /**
   * Adds a new line item to a specific portfolio area and saves.
   */
  static addItem(portfolioModel, areaKey, itemData) {
    portfolioModel.addItem(areaKey, itemData)
    PersonnelPortfolioController.persistPortfolio(portfolioModel)
    return portfolioModel
  }

  /**
   * Removes a line item from a portfolio area and saves.
   */
  static removeItem(portfolioModel, areaKey, itemId) {
    const json = portfolioModel.toJSON()
    if (areaKey === 'A') {
      json.area_a_items = json.area_a_items.filter(i => i.id !== itemId)
    } else if (areaKey === 'B') {
      json.area_b_items = json.area_b_items.filter(i => i.id !== itemId)
    } else if (areaKey === 'C') {
      json.area_c_items = json.area_c_items.filter(i => i.id !== itemId)
    }

    const updatedModel = new PersonnelPortfolioModel(json)
    PersonnelPortfolioController.persistPortfolio(updatedModel)
    return updatedModel
  }

  /**
   * Updates NDMU Years of Service and saves.
   */
  static updateYearsOfService(portfolioModel, years) {
    portfolioModel.years_of_service = years
    PersonnelPortfolioController.persistPortfolio(portfolioModel)
    return portfolioModel
  }

  /**
   * Validates proof attachment requirements for submission.
   * Returns { isValid: boolean, missingProofCount: number }
   */
  static validateSubmissionGuard(portfolioModel) {
    const allItems = [
      ...portfolioModel.area_a_items,
      ...portfolioModel.area_b_items,
      ...portfolioModel.area_c_items
    ]

    const missingProof = allItems.filter(item => !item.proof_file_name || !item.proof_file_name.trim())
    return {
      isValid: missingProof.length === 0,
      missingProofCount: missingProof.length,
      missingItems: missingProof
    }
  }

  /**
   * Submits portfolio to Department Secretary for evaluation.
   */
  static submitToDepSec(portfolioModel, actorName = 'Personnel') {
    const validation = PersonnelPortfolioController.validateSubmissionGuard(portfolioModel)
    if (!validation.isValid) {
      throw new Error(`Cannot submit portfolio: ${validation.missingProofCount} item(s) are missing required proof documents.`)
    }

    portfolioModel.transitionStatus(
      'SUBMITTED_TO_DEP_SEC',
      actorName,
      'Personnel',
      'Submitted complete ranking portfolio to Department Secretary for verification.'
    )

    PersonnelPortfolioController.persistPortfolio(portfolioModel)
    return portfolioModel
  }

  /**
   * 1-Click Auto-Populates Portfolio from Personnel Vault repository.
   * Maps Vault items into Area A, Area B, or Area C based on category classification.
   */
  static autoPopulateFromVault(portfolioModel, personnelId = 'EMP-2024-001') {
    if (!portfolioModel) return portfolioModel

    const defaultVaultItems = [
      { areaKey: 'A', category: 'A.1 Degree/s • Ph.D. Degree Holder', title: 'Ph.D. in Computer Science', claimed_points: 40, proof_file_name: 'PhD_Diploma_Santos.pdf' },
      { areaKey: 'A', category: 'A.3 Attendance to Seminars/Trainings • National Seminar', title: 'National AI & Cloud Summit 2025', claimed_points: 8, proof_file_name: 'Cert_AI_Summit_2025.pdf' },
      { areaKey: 'B', category: 'B.2 Publication • Research Output', title: 'Deep Learning Algorithms in Academic Evaluation', claimed_points: 40, proof_file_name: 'IEEE_Paper_Published_2025.pdf' },
      { areaKey: 'B', category: 'B.1 Guest Lecturer / Consultant / Judge • Keynote Speaker', title: 'Keynote Speaker: Regional Tech Symposium', claimed_points: 10, proof_file_name: 'Keynote_Certificate.pdf' },
      { areaKey: 'C', category: 'C.1 Involvement in Extra-Curricular Activities • C.1.1 Moderator', title: 'Moderator: Computer Science Student Society', claimed_points: 20, proof_file_name: 'Moderator_Designation_AY2526.pdf' }
    ]

    defaultVaultItems.forEach(item => {
      const existingItems = item.areaKey === 'A' ? portfolioModel.area_a_items : item.areaKey === 'B' ? portfolioModel.area_b_items : portfolioModel.area_c_items
      const exists = existingItems.some(i => i.title.toLowerCase() === item.title.toLowerCase())
      if (!exists) {
        portfolioModel.addItem(item.areaKey, item)
      }
    })

    PersonnelPortfolioController.persistPortfolio(portfolioModel)
    return portfolioModel
  }
}
