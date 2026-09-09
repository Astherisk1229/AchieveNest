import AchievementModel from '../models/AchievementModel.js'
import personnelAccomplishmentService from '../services/personnelAccomplishmentService.js'

/**
 * PersonnelAchievementController.js
 * MVC Controller managing personnel achievement repository, search indexing & autocomplete suggestions,
 * portfolio attachment state, and authoritative backend persistence.
 */
export default class PersonnelAchievementController {
  /**
   * Loads list of AchievementModel instances asynchronously from backend database
   */
  static async loadAchievements() {
    try {
      const rawList = await personnelAccomplishmentService.fetchAccomplishments()
      return rawList.map(item => new AchievementModel(item))
    } catch (err) {
      console.error('Failed to load personnel accomplishments from backend:', err)
      return []
    }
  }

  /**
   * Evaluates non-blocking advisory duplicate warning based on exact title/date/issuer collision (Phase A0/A4 rule).
   * @param {object} fields Candidate achievement fields
   * @param {Array<AchievementModel>} existingAchievements List of current achievements
   * @returns {{ isDuplicate: boolean, warningMessage: string|null, collidingAchievement: object|null }}
   */
  static checkDuplicateWarning(fields = {}, existingAchievements = []) {
    const candidateTitle = String(fields.title || '').trim().toLowerCase()
    const candidateDate = String(fields.date_achieved || fields.date || fields.occurrence_date || '').trim()
    const candidateIssuer = String(fields.issuer || fields.location || fields.organizer_or_publisher || '').trim().toLowerCase()

    if (!candidateTitle || !candidateDate) {
      return { isDuplicate: false, warningMessage: null, collidingAchievement: null }
    }

    const collision = existingAchievements.find(item => {
      const itemTitle = String(item.title || '').trim().toLowerCase()
      const itemDate = String(item.date || item.occurrence_date || '').trim()
      const itemIssuer = String(item.issuer || item.location || '').trim().toLowerCase()

      // Exact title + date match, and if issuer present on both, exact issuer match
      const titleMatch = itemTitle === candidateTitle
      const dateMatch = itemDate === candidateDate
      const issuerMatch = !candidateIssuer || !itemIssuer || itemIssuer === candidateIssuer

      return titleMatch && dateMatch && issuerMatch
    })

    if (collision) {
      return {
        isDuplicate: true,
        warningMessage: `A similar accomplishment ("${collision.title}") with date ${candidateDate} is already recorded in your repository.`,
        collidingAchievement: collision
      }
    }

    return { isDuplicate: false, warningMessage: null, collidingAchievement: null }
  }

  /**
   * Persist a new accomplishment to backend database with real evidence file upload
   */
  static async addAchievement(newEntry, file = null) {
    // 1. Prepare backend payload
    const payload = {
      title: newEntry.title,
      category: newEntry.category,
      category_area: newEntry.category_area || (newEntry.category?.startsWith('A.') ? 'areaA' : newEntry.category?.startsWith('B.') ? 'areaB' : 'areaC'),
      domain: newEntry.domain || (newEntry.category?.startsWith('A.') ? 'professional_development' : newEntry.category?.startsWith('B.') ? 'productivity_creative_work' : 'service_leadership'),
      organizer_or_publisher: newEntry.location || newEntry.issuer || newEntry.organizer_or_publisher || '',
      occurrence_date: newEntry.date_achieved || newEntry.date || new Date().toISOString().split('T')[0],
      description: newEntry.description || '',
      claimed_points: Number(newEntry.claimed_points || newEntry.points || 0),
      scope_level: newEntry.scope_level || '',
      academic_year: newEntry.academic_year || '',
      advisory_classification: newEntry.advisory_classification || null,
      ocr_metadata: newEntry.ocr_metadata || null
    }

    // 2. Create accomplishment record in backend
    const createRes = await personnelAccomplishmentService.createAccomplishment(payload)
    const accomplishmentId = createRes?.data?.id || createRes?.id

    let evidenceData = null
    // 3. If a real evidence file is attached, upload it directly to private server storage
    if (file && accomplishmentId) {
      const uploadRes = await personnelAccomplishmentService.uploadEvidence(accomplishmentId, file)
      evidenceData = uploadRes?.data?.evidence || uploadRes?.evidence
    }

    // 4. Return new hydrated model instance
    return new AchievementModel({
      id: accomplishmentId,
      title: payload.title,
      category: payload.category,
      domain: payload.domain,
      location: payload.organizer_or_publisher,
      issuer: payload.organizer_or_publisher,
      date: payload.occurrence_date,
      academic_year: payload.academic_year,
      scope_level: payload.scope_level,
      description: payload.description,
      claimed_points: payload.claimed_points,
      advisory_classification: payload.advisory_classification,
      ocr_metadata: payload.ocr_metadata,
      status: 'Pending Review',
      attached_file_name: evidenceData?.original_filename || file?.name || 'supporting_document.pdf',
      evidence_id: evidenceData?.id || null,
      evidence: evidenceData ? [evidenceData] : []
    })
  }

  /**
   * Delete accomplishment and linked evidence from backend
   */
  static async deleteAchievement(targetId) {
    try {
      await personnelAccomplishmentService.deleteAccomplishment(targetId)
      return true
    } catch (err) {
      console.error('Failed to delete accomplishment from backend:', err)
      throw err
    }
  }

  /**
   * Update existing achievement in backend database and synchronize memory list
   */
  static async updateAchievement(currentList, targetId, updateData) {
    // 1. Prepare update payload
    const payload = {
      title: updateData.title,
      category: updateData.category,
      category_area: updateData.category_area || (updateData.category?.startsWith('A.') ? 'areaA' : updateData.category?.startsWith('B.') ? 'areaB' : 'areaC'),
      domain: updateData.domain || (updateData.category?.startsWith('A.') ? 'professional_development' : updateData.category?.startsWith('B.') ? 'productivity_creative_work' : 'service_leadership'),
      organizer_or_publisher: updateData.location || updateData.issuer || updateData.organizer_or_publisher || '',
      occurrence_date: updateData.date_achieved || updateData.date || updateData.occurrence_date,
      description: updateData.description || '',
      claimed_points: Number(updateData.claimed_points || updateData.points || 0),
      scope_level: updateData.scope_level || '',
      academic_year: updateData.academic_year || '',
      advisory_classification: updateData.advisory_classification || null,
      ocr_metadata: updateData.ocr_metadata || null
    }

    // 2. Persist update to backend
    if (targetId && !String(targetId).startsWith('ach_')) {
      await personnelAccomplishmentService.updateAccomplishment(targetId, payload)
    }

    // 3. Return updated list with re-hydrated model
    return currentList.map(item => {
      if (item.id === targetId) {
        const json = item.toJSON()
        const merged = { ...json, ...updateData }
        if (updateData.status === 'Pending Review' || updateData.status === 'Pending') {
          merged.return_remarks = ''
        }
        return AchievementModel.fromJSON(merged)
      }
      return item
    })
  }

  /**
   * Toggle favorite status in memory list
   */
  static toggleFavorite(currentList, targetId) {
    return currentList.map(item => {
      if (item.id === targetId) {
        item.toggleFavorite()
      }
      return item
    })
  }

  /**
   * Attach item to annual portfolio in memory list
   */
  static attachToPortfolio(currentList, targetId, portfolioId = 'port_ay2526', portfolioName = 'AY 2025-2026 Evaluation Portfolio') {
    return currentList.map(item => {
      if (item.id === targetId) {
        item.attachToPortfolio(portfolioId, portfolioName)
      }
      return item
    })
  }

  /**
   * Computes rich search suggestions (titles, NDMU areas/categories, issuing venues)
   */
  static getSearchSuggestions(query = '', achievements = []) {
    const q = query.trim().toLowerCase()
    if (!q) {
      return {
        topMatch: null,
        titles: [],
        categories: [],
        venues: [],
        statuses: []
      }
    }

    const titles = []
    const categoriesSet = new Set()
    const venuesSet = new Set()
    const statusSet = new Set()

    achievements.forEach(item => {
      // Titles match
      if (item.title.toLowerCase().includes(q)) {
        titles.push({
          id: item.id,
          title: item.title,
          category: item.category,
          location: item.location
        })
      }

      // Category / Area match
      if (item.category.toLowerCase().includes(q) || item.ndmu_area.toLowerCase().includes(q)) {
        categoriesSet.add(item.category)
      }

      // Location / Venue / Issuer match
      if (item.location && item.location.toLowerCase().includes(q)) {
        venuesSet.add(item.location)
      }

      // Portfolio status match
      if (item.portfolio_status && item.portfolio_status.toLowerCase().includes(q)) {
        statusSet.add(item.portfolio_status)
      }
    })

    const topMatch = titles.length > 0 ? titles[0].title : null

    return {
      topMatch,
      titles: titles.slice(0, 4),
      categories: Array.from(categoriesSet).slice(0, 3),
      venues: Array.from(venuesSet).slice(0, 3),
      statuses: Array.from(statusSet).slice(0, 2)
    }
  }
}
