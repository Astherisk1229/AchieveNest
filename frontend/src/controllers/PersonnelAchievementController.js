import AchievementModel from '../models/AchievementModel.js'

/**
 * PersonnelAchievementController.js
 * MVC Controller managing personnel achievement repository, search indexing & autocomplete suggestions,
 * portfolio attachment state, and LocalStorage persistence.
 */
export default class PersonnelAchievementController {
  static STORAGE_KEY = 'achievenest_personnel_achievements'

  /**
   * Raw localStorage getter
   */
  static getRawStorage() {
    try {
      const raw = localStorage.getItem(PersonnelAchievementController.STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  /**
   * Raw localStorage setter
   */
  static saveRawStorage(items) {
    try {
      localStorage.setItem(PersonnelAchievementController.STORAGE_KEY, JSON.stringify(items))
    } catch (err) {
      console.error('Failed to persist personnel achievements:', err)
    }
  }

  /**
   * Initial default sample data
   */
  static getDefaultSeedData() {
    return [
      {
        id: 'ach_1',
        title: 'Machine Learning Frameworks in Higher Education Analytics',
        location: 'IEEE Access Journal (Scopus)',
        issuer: 'IEEE Access Journal',
        date: 'Apr 15, 2026',
        status: 'Verified',
        category: 'B.2 Publication',
        description: 'Peer-reviewed research article on predictive student performance modeling.',
        attached_file_name: 'ieee_access_publication_santos.pdf',
        is_favorited: true,
        portfolio_id: 'port_ay2526',
        portfolio_name: 'AY 2025-2026 Evaluation Portfolio',
        portfolio_status: 'Verified in Portfolio'
      },
      {
        id: 'ach_2',
        title: 'CHED Regional Training on AI Curriculum Integration',
        location: 'CHED Region XII',
        issuer: 'CHED Region XII',
        date: 'Mar 20, 2026',
        status: 'Pending Review',
        category: 'A.3 Attendance to Seminars/Trainings',
        description: 'Resource speaker and trainer for 45 IT program faculty members.',
        attached_file_name: 'ched_ai_workshop_certificate.pdf',
        is_favorited: false,
        portfolio_id: 'port_ay2526',
        portfolio_name: 'AY 2025-2026 Evaluation Portfolio',
        portfolio_status: 'Included in Active Portfolio'
      },
      {
        id: 'ach_3',
        title: 'Koronadal City LGU Digital Governance Extension Project',
        location: 'City Government of Koronadal',
        issuer: 'City Government of Koronadal',
        date: 'Feb 14, 2026',
        status: 'Verified',
        category: 'C.2 Community Involvement',
        description: 'Project Lead for community IT extension program training local barangay secretaries.',
        attached_file_name: 'lgu_extension_project_mou.pdf',
        is_favorited: true,
        portfolio_id: 'port_ay2526',
        portfolio_name: 'AY 2025-2026 Evaluation Portfolio',
        portfolio_status: 'Verified in Portfolio'
      },
      {
        id: 'ach_4',
        title: 'NDMU Outstanding Research Faculty of the Year',
        location: 'Notre Dame of Marbel University',
        issuer: 'Notre Dame of Marbel University',
        date: 'Jan 10, 2026',
        status: 'Verified',
        category: 'B.4 Professional Recognition or Awards',
        description: 'Conferred during University Foundation Day for highest Scopus citations.',
        attached_file_name: 'outstanding_faculty_award_2026.pdf',
        is_favorited: false,
        portfolio_id: 'port_ay2526',
        portfolio_name: 'AY 2025-2026 Evaluation Portfolio',
        portfolio_status: 'Verified in Portfolio'
      },
      {
        id: 'ach_5',
        title: 'AWS Certified Solutions Architect - Associate',
        location: 'Amazon Web Services',
        issuer: 'Amazon Web Services',
        date: 'Nov 5, 2025',
        status: 'Returned',
        category: 'A.2 Active Membership to Prof Orgs',
        description: 'International cloud architecture professional certification.',
        attached_file_name: 'aws_solutions_architect_certificate.pdf',
        return_remarks: 'Please attach official verification badge or clear transcript scan.',
        is_favorited: false,
        portfolio_id: null,
        portfolio_name: 'Not attached',
        portfolio_status: 'Returned for Correction'
      }
    ]
  }

  /**
   * Loads list of AchievementModel instances
   */
  static loadAchievements() {
    const raw = PersonnelAchievementController.getRawStorage()
    let dataList = raw

    if (!dataList || !Array.isArray(dataList) || dataList.length === 0) {
      dataList = PersonnelAchievementController.getDefaultSeedData()
      PersonnelAchievementController.saveRawStorage(dataList)
    }

    return dataList.map(item => AchievementModel.fromJSON(item))
  }

  /**
   * Saves models list
   */
  static persistAchievements(achievements) {
    const rawList = achievements.map(a => (a instanceof AchievementModel ? a.toJSON() : a))
    PersonnelAchievementController.saveRawStorage(rawList)
    return achievements
  }

  /**
   * Add new achievement
   */
  static addAchievement(currentList, newEntry) {
    const model = new AchievementModel({
      id: newEntry.id || `ach_${Date.now()}`,
      title: newEntry.title,
      location: newEntry.location || newEntry.issuer || 'NDMU CITE',
      issuer: newEntry.issuer || newEntry.location || 'NDMU CITE',
      date: newEntry.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'Pending Review',
      category: newEntry.category || 'B.2 Publication',
      description: newEntry.description || '',
      attached_file_name: newEntry.attached_file_name || 'proof_document.pdf',
      portfolio_status: 'Available for Portfolio'
    })

    const updated = [model, ...currentList]
    PersonnelAchievementController.persistAchievements(updated)
    return updated
  }

  /**
   * Update existing achievement
   */
  static updateAchievement(currentList, targetId, updateData) {
    const updated = currentList.map(item => {
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
    PersonnelAchievementController.persistAchievements(updated)
    return updated
  }

  /**
   * Delete non-verified achievement
   */
  static deleteAchievement(currentList, targetId) {
    const updated = currentList.filter(item => item.id !== targetId || item.status === 'Verified')
    PersonnelAchievementController.persistAchievements(updated)
    return updated
  }

  /**
   * Toggle favorite status
   */
  static toggleFavorite(currentList, targetId) {
    const updated = currentList.map(item => {
      if (item.id === targetId) {
        item.toggleFavorite()
      }
      return item
    })
    PersonnelAchievementController.persistAchievements(updated)
    return updated
  }

  /**
   * Attach item to annual portfolio
   */
  static attachToPortfolio(currentList, targetId, portfolioId = 'port_ay2526', portfolioName = 'AY 2025-2026 Evaluation Portfolio') {
    const updated = currentList.map(item => {
      if (item.id === targetId) {
        item.attachToPortfolio(portfolioId, portfolioName)
      }
      return item
    })
    PersonnelAchievementController.persistAchievements(updated)
    return updated
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
