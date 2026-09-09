import PersonnelPortfolioModel from '../models/PersonnelPortfolioModel.js'
import personnelAccomplishmentService from '../services/personnelAccomplishmentService.js'
import personnelPortfolioService from '../services/personnelPortfolioService.js'

/**
 * PersonnelPortfolioController.js
 * MVC Controller managing Personnel Portfolio reflection directly from canonical Plan A achievement records.
 *
 * Invariant (Phase B1 & B2):
 * Plan A achievement records are authoritative. The working Personnel portfolio reflects
 * those records; it does not recreate or duplicate them. Personnel may organize and review
 * their reflected achievements, but cannot verify, accept, or self-score as an evaluator.
 */
export default class PersonnelPortfolioController {
  /**
   * Maps a canonical backend accomplishment DTO into a portfolio reflection item.
   * Retains stable identity: portfolio item ID = canonical accomplishment ID.
   *
   * @param {Object} acc Canonical accomplishment record from backend/service
   * @returns {Object} Reflected portfolio item
   */
  static mapAccomplishmentToPortfolioItem(acc) {
    if (!acc) return null

    const id = acc.id || acc._id || `acc_${Math.random().toString(36).substr(2, 9)}`
    const rawCategory = acc.category || acc.advisory_classification?.criterion_reference || 'General Accomplishment'
    const isUnclassified = Boolean(
      acc.is_unclassified ||
      !acc.category ||
      acc.category === 'Unclassified' ||
      acc.category === 'General Accomplishment' ||
      acc.advisory_classification?.is_unclassified
    )

    const claimedPoints = Number(
      acc.claimed_points !== undefined && acc.claimed_points !== null
        ? acc.claimed_points
        : (acc.advisory_classification?.suggested_points ?? acc.points ?? 0)
    ) || 0

    // Compute proof filename from evidence object or direct field
    const proofFileName = acc.attached_file_name ||
      acc.evidence?.original_filename ||
      acc.evidence_file_name ||
      acc.proof_file_name ||
      ''

    const evidenceId = acc.evidence_id || acc.evidence?.id || null

    return {
      id,
      canonical_id: id,
      title: acc.title || '',
      category: rawCategory,
      category_code: acc.advisory_classification?.criterion_code || (
        rawCategory.startsWith('A.') ? 'A.1' :
        rawCategory.startsWith('B.') ? 'B.1' :
        rawCategory.startsWith('C.') ? 'C.1' : ''
      ),
      scope_level: acc.scope_level || acc.advisory_classification?.scope || 'Local',
      claimed_points: claimedPoints,
      verified_points: 0, // Advisory only in working draft; evaluator accepted scoring belongs to Plan G
      proof_file_name: proofFileName,
      evidence_id: evidenceId,
      is_proof_verified: false,
      is_unclassified: isUnclassified,
      advisory_status: isUnclassified ? 'Needs Classification' : 'Advisory Record',
      date: acc.occurrence_date || acc.date || acc.date_achieved || '',
      date_achieved: acc.occurrence_date || acc.date || acc.date_achieved || '',
      issuer: acc.organizer_or_publisher || acc.issuer || acc.location || '',
      organizer_or_publisher: acc.organizer_or_publisher || acc.issuer || '',
      status: acc.status || (isUnclassified ? 'Needs Review' : 'Active'),
      remarks: acc.description || acc.remarks || '',
      academic_year: acc.academic_year || '',
      advisory_classification: acc.advisory_classification || null,
      ocr_metadata: acc.ocr_metadata || null,
      created_at: acc.created_at || null,
      updated_at: acc.updated_at || null
    }
  }

  /**
   * Classifies which portfolio area ('A', 'B', or 'C') an accomplishment belongs to
   * based on its canonical domain or category code.
   *
   * @param {Object} item Accomplishment or mapped portfolio item
   * @returns {'A' | 'B' | 'C'}
   */
  static determinePortfolioArea(item) {
    if (!item) return 'A'

    const domain = (item.domain || '').toLowerCase()
    const catArea = (item.category_area || '').toLowerCase()
    const cat = (item.category || '').toUpperCase()

    if (domain === 'professional_development' || catArea === 'areaa' || cat.startsWith('A.') || cat.startsWith('AREA A') || cat.startsWith('A')) {
      return 'A'
    }
    if (domain === 'productivity_creative_work' || catArea === 'areab' || cat.startsWith('B.') || cat.startsWith('AREA B') || cat.startsWith('B')) {
      return 'B'
    }
    if (domain === 'service_leadership' || catArea === 'areac' || cat.startsWith('C.') || cat.startsWith('AREA C') || cat.startsWith('C')) {
      return 'C'
    }

    // Default to Area A for unclassified items so they remain accessible for classification
    return 'A'
  }

  /**
   * Reconstructs an authoritative PersonnelPortfolioModel instance directly from canonical accomplishments.
   * Enforces deduplication by canonical ID and deterministic sorting.
   *
   * @param {string} personnelId
   * @param {Array<Object>} accomplishments List of canonical accomplishment records
   * @param {Object} profileContext Read-only Personnel master/profile context
   * @returns {PersonnelPortfolioModel}
   */
  static buildPortfolioFromAccomplishments(personnelId = 'EMP-2024-001', accomplishments = [], profileContext = {}) {
    const seenIds = new Set()
    const area_a_items = []
    const area_b_items = []
    const area_c_items = []

    // Deduplicate and map canonical accomplishments
    for (const acc of accomplishments) {
      if (!acc) continue
      const mapped = PersonnelPortfolioController.mapAccomplishmentToPortfolioItem(acc)
      if (!mapped || !mapped.id) continue

      if (seenIds.has(mapped.id)) {
        console.warn(`[PersonnelPortfolioController] Duplicate accomplishment ID detected: ${mapped.id}. Ignored redundant item.`)
        continue
      }
      seenIds.add(mapped.id)

      const areaKey = PersonnelPortfolioController.determinePortfolioArea(acc)
      if (areaKey === 'A') area_a_items.push(mapped)
      else if (areaKey === 'B') area_b_items.push(mapped)
      else if (areaKey === 'C') area_c_items.push(mapped)
    }

    // Deterministic ordering: date descending (newest first), then alphabetical by title
    const sortFn = (a, b) => {
      const dateA = new Date(a.date || a.occurrence_date || '1970-01-01').getTime()
      const dateB = new Date(b.date || b.occurrence_date || '1970-01-01').getTime()
      if (dateB !== dateA) return dateB - dateA
      return (a.title || '').localeCompare(b.title || '')
    }

    area_a_items.sort(sortFn)
    area_b_items.sort(sortFn)
    area_c_items.sort(sortFn)

    return new PersonnelPortfolioModel({
      personnel_id: personnelId,
      personnel_name: profileContext.personnel_name || profileContext.full_name || 'Dr. Maria Santos',
      academic_rank: profileContext.academic_rank || profileContext.designation || 'Associate Professor II',
      college_id: profileContext.college_id || profileContext.college_code || 'COL-CEAC',
      college_name: profileContext.college_name || 'College of Engineering, Architecture, and Technology',
      program_affiliations: profileContext.program_affiliations || ['BSCS'],
      academic_year: profileContext.academic_year || 'AY 2025-2026',
      years_of_service: Number(profileContext.years_of_service !== undefined ? profileContext.years_of_service : 6),
      area_a_items,
      area_b_items,
      area_c_items
    })
  }

  /**
   * Asynchronously loads canonical accomplishments from backend and builds the working portfolio model.
   * If backend fails, throws or surfaces error cleanly without falling back to mock seeds.
   *
   * @param {string} personnelId
   * @param {Object} profileContext
   * @returns {Promise<PersonnelPortfolioModel>}
   */
  static async loadPortfolioAsync(personnelId = 'EMP-2024-001', profileContext = {}) {
    const rawList = await personnelAccomplishmentService.fetchAccomplishments()
    return PersonnelPortfolioController.buildPortfolioFromAccomplishments(personnelId, rawList, profileContext)
  }

  /**
   * Synchronously initializes a clean PersonnelPortfolioModel instance.
   * Does NOT inject static mock seeds (e.g. item_a1, item_a2, item_b1, item_c1).
   *
   * @param {string} personnelId
   * @param {Object} defaultData
   * @returns {PersonnelPortfolioModel}
   */
  static loadPortfolio(personnelId = 'EMP-2024-001', defaultData = {}) {
    return new PersonnelPortfolioModel({
      personnel_id: personnelId,
      personnel_name: defaultData.personnel_name || defaultData.full_name || 'Dr. Maria Santos',
      academic_rank: defaultData.academic_rank || defaultData.designation || 'Associate Professor II',
      college_id: defaultData.college_id || defaultData.college_code || 'COL-CEAC',
      college_name: defaultData.college_name || 'College of Engineering, Architecture, and Technology',
      program_affiliations: defaultData.program_affiliations || ['BSCS'],
      academic_year: defaultData.academic_year || 'AY 2025-2026',
      years_of_service: Number(defaultData.years_of_service !== undefined ? defaultData.years_of_service : 6),
      area_a_items: Array.isArray(defaultData.area_a_items) ? defaultData.area_a_items : [],
      area_b_items: Array.isArray(defaultData.area_b_items) ? defaultData.area_b_items : [],
      area_c_items: Array.isArray(defaultData.area_c_items) ? defaultData.area_c_items : []
    })
  }

  /**
   * Adds a new line item to a specific portfolio area in memory.
   */
  static addItem(portfolioModel, areaKey, itemData) {
    portfolioModel.addItem(areaKey, itemData)
    return portfolioModel
  }

  /**
   * Removes a line item from a portfolio area in memory.
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

    return new PersonnelPortfolioModel(json)
  }

  /**
   * Updates an existing line item in a portfolio area in memory.
   */
  static updateItem(portfolioModel, areaKey, itemId, updatedFields) {
    const json = portfolioModel.toJSON()
    const targetArray = areaKey === 'A' ? json.area_a_items : areaKey === 'B' ? json.area_b_items : json.area_c_items
    const index = targetArray.findIndex(i => i.id === itemId)
    if (index >= 0) {
      targetArray[index] = { ...targetArray[index], ...updatedFields }
    }
    return new PersonnelPortfolioModel(json)
  }

  /**
   * Updates NDMU Years of Service in memory.
   */
  static updateYearsOfService(portfolioModel, years) {
    portfolioModel.years_of_service = years
    return portfolioModel
  }

  /**
   * Validates proof attachment requirements for submission.
   * Returns { isValid: boolean, missingProofCount: number, missingItems: Array }
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
   * Asynchronously submits whole portfolio package to backend server.
   * Creates an immutable snapshot in personnel_evaluations and personnel_evaluation_items.
   *
   * @param {PersonnelPortfolioModel} portfolioModel
   * @param {Object} options { academicYear, tenureYears }
   * @returns {Promise<Object>}
   */
  static async submitPortfolioAsync(portfolioModel, options = {}) {
    const validation = PersonnelPortfolioController.validateSubmissionGuard(portfolioModel)
    if (!validation.isValid) {
      throw new Error(`Cannot submit portfolio: ${validation.missingProofCount} item(s) are missing required proof documents.`)
    }

    const payload = {
      academic_year: options.academicYear || portfolioModel.academic_year || '2025-2026',
      tenure_years: options.tenureYears !== undefined ? options.tenureYears : portfolioModel.years_of_service
    }

    const response = await personnelPortfolioService.submitPortfolio(payload)
    const resultData = response?.data || response

    portfolioModel.transitionStatus(
      'submitted',
      portfolioModel.personnel_name,
      'Personnel',
      `Submitted complete ranking portfolio package. (Submission ID: ${resultData?.submission_id})`
    )

    return {
      success: true,
      submission_id: resultData?.submission_id,
      status: resultData?.status || 'submitted',
      submitted_at: resultData?.submitted_at,
      total_items: resultData?.total_items
    }
  }

  /**
   * Asynchronously resubmits the corrected working portfolio draft as a new immutable version (Plan C Phase C4).
   *
   * @param {PersonnelPortfolioModel} portfolioModel
   * @param {Object} options
   * @returns {Promise<Object>}
   */
  static async resubmitPortfolioAsync(portfolioModel, options = {}) {
    const validation = PersonnelPortfolioController.validateSubmissionGuard(portfolioModel)
    if (!validation.isValid) {
      throw new Error(`Cannot resubmit portfolio: ${validation.missingProofCount} item(s) are missing required proof documents.`)
    }

    const payload = {
      academic_year: options.academicYear || portfolioModel.academic_year || '2025-2026',
      tenure_years: options.tenureYears !== undefined ? options.tenureYears : portfolioModel.years_of_service
    }

    const response = await personnelPortfolioService.resubmitPortfolio(payload)
    const resultData = response?.data || response

    const newVersion = resultData?.version_number || 2
    portfolioModel.transitionStatus(
      'submitted',
      portfolioModel.personnel_name,
      'Personnel',
      `Resubmitted corrected portfolio package as Version ${newVersion}. (Submission ID: ${resultData?.submission_id})`
    )

    return {
      success: true,
      submission_id: resultData?.submission_id,
      version_number: newVersion,
      previous_version_id: resultData?.previous_version_id,
      status: resultData?.status || 'submitted',
      submitted_at: resultData?.submitted_at,
      total_items: resultData?.total_items
    }
  }

  /**
   * Submits portfolio for evaluation transition (synchronous fallback/in-memory guard).
   */
  static submitToDean(portfolioModel, actorName = 'Personnel') {
    const validation = PersonnelPortfolioController.validateSubmissionGuard(portfolioModel)
    if (!validation.isValid) {
      throw new Error(`Cannot submit portfolio: ${validation.missingProofCount} item(s) are missing required proof documents.`)
    }

    portfolioModel.transitionStatus(
      'submitted',
      actorName,
      'Personnel',
      'Submitted complete ranking portfolio for evaluation and verification.'
    )

    return portfolioModel
  }

  /**
   * Auto-populates/syncs portfolio from canonical accomplishments repository.
   * Reconstructs the active portfolio directly from canonical accomplishments,
   * removing stale items and reflecting latest reclassifications and advisory points.
   *
   * @param {PersonnelPortfolioModel} portfolioModel
   * @param {Array<Object>|null} accomplishments
   * @returns {PersonnelPortfolioModel}
   */
  static autoPopulateFromVault(portfolioModel, accomplishments = null) {
    if (!portfolioModel) return portfolioModel
    if (!Array.isArray(accomplishments)) {
      return portfolioModel
    }

    return PersonnelPortfolioController.buildPortfolioFromAccomplishments(
      portfolioModel.personnel_id,
      accomplishments,
      {
        personnel_name: portfolioModel.personnel_name,
        academic_rank: portfolioModel.academic_rank,
        college_id: portfolioModel.college_id,
        college_name: portfolioModel.college_name,
        program_affiliations: portfolioModel.program_affiliations,
        academic_year: portfolioModel.academic_year,
        years_of_service: portfolioModel.years_of_service
      }
    )
  }

  /**
   * Asynchronously purges the complete personnel portfolio and history (Plan C Phase C5 Deletion Exception).
   *
   * @param {PersonnelPortfolioModel} portfolioModel
   * @param {Object} options { confirmation: "DELETE_PORTFOLIO", reason?: string, personnel_profile_id?: string }
   * @returns {Promise<Object>}
   */
  static async purgePortfolioAsync(portfolioModel, options = {}) {
    const payload = {
      confirmation: options.confirmation || 'DELETE_PORTFOLIO',
      reason: options.reason || undefined,
      personnel_profile_id: options.personnel_profile_id || undefined
    }

    const response = await personnelPortfolioService.purgePortfolio(payload)
    const resultData = response?.data || response

    if (portfolioModel) {
      portfolioModel.clearAllItems()
      portfolioModel.transitionStatus('draft', portfolioModel.personnel_name, 'Personnel', 'Portfolio purged per deletion exception.')
    }

    return {
      success: true,
      message: resultData?.message || 'Portfolio successfully purged.',
      purged_evaluations: resultData?.purged_evaluations || 0,
      purged_accomplishments: resultData?.purged_accomplishments || 0
    }
  }
}
