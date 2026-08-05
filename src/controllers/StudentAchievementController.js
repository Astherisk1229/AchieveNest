import AchievementModel from '../models/AchievementModel'

/**
 * StudentAchievementController.js
 * Controller encapsulating all business logic, storage, search, filter,
 * and state mutators for Student Achievements.
 */
class StudentAchievementController {
  #STORAGE_KEY = 'achievenest_student_achievements'
  #achievements = []

  constructor() {
    this.#loadFromStorage()
  }

  /**
   * Load achievements from localStorage or initialize with student default seed data.
   */
  #loadFromStorage() {
    try {
      const raw = localStorage.getItem(this.#STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.#achievements = parsed.map(item => AchievementModel.fromJSON(item))
          return
        }
      }
    } catch (e) {
      console.warn('Failed to parse student achievements from localStorage:', e)
    }

    // Default Seed Data tailored for Students
    const seedData = [
      {
        id: 'ach_stu_1',
        student_id: 'STU-2024-01234',
        student_name: 'Maria Santos',
        program: 'BS Information Technology',
        title: 'Best Research Paper Award',
        event_name: '12th Regional Undergraduate IT Research Symposium',
        issuer: 'General Santos City IT Consortium',
        location: 'General Santos City',
        date: 'Apr 5, 2026',
        status: 'Returned',
        category: 'Academic',
        scope_level: 'Regional / Inter-School',
        description: 'Awarded 1st place in Regional Undergraduate IT Research Symposium for Smart Campus IoT paper.',
        attached_file_name: 'research_paper_award.pdf',
        return_remarks: 'Please attach a clearer copy of the signed certificate bearing the official seal.',
        is_favorited: true,
        portfolio_id: null,
        portfolio_status: 'Available for Portfolio'
      },
      {
        id: 'ach_stu_2',
        student_id: 'STU-2024-01234',
        student_name: 'Maria Santos',
        program: 'BS Information Technology',
        title: 'Community Outreach Volunteer',
        event_name: 'Barangay Digital Literacy Extension Project',
        issuer: 'NDMU Center for Social Action',
        location: 'Barangay Poblacion, Koronadal',
        date: 'Mar 20, 2026',
        status: 'Pending Review',
        category: 'Community',
        scope_level: 'Local / Community Extension',
        description: 'Volunteered for 20 hours as lead facilitator for barangay youth computer literacy program.',
        attached_file_name: 'outreach_certificate.pdf',
        return_remarks: '',
        is_favorited: false,
        portfolio_id: null,
        portfolio_status: 'Pending Verification'
      },
      {
        id: 'ach_stu_3',
        student_id: 'STU-2024-01234',
        student_name: 'Maria Santos',
        program: 'BS Information Technology',
        title: 'Basketball Intramurals Champion',
        event_name: 'NDMU University Intramural Games 2026',
        issuer: 'NDMU Sports Development Office',
        location: 'NDMU Gymnasium',
        date: 'Feb 14, 2026',
        status: 'Verified',
        category: 'Sports',
        scope_level: 'Institutional / Campus-Wide',
        description: 'Point guard and co-captain for Champion IT Department Varsity Basketball Team.',
        attached_file_name: 'intramurals_champ_cert.pdf',
        return_remarks: '',
        is_favorited: true,
        portfolio_id: 'port_stu_2026',
        portfolio_status: 'Included in Active Portfolio'
      },
      {
        id: 'ach_stu_4',
        student_id: 'STU-2024-01234',
        student_name: 'Maria Santos',
        program: 'BS Information Technology',
        title: 'Student Council President',
        event_name: 'Supreme Student Council Election 2025',
        issuer: 'NDMU Commission on Elections',
        location: 'NDMU Main Campus',
        date: 'Jan 10, 2026',
        status: 'Verified',
        category: 'Leadership',
        scope_level: 'Institutional / Campus-Wide',
        description: 'Elected Supreme Student Council President for Academic Year 2025-2026.',
        attached_file_name: 'ssc_president_appointment.pdf',
        return_remarks: '',
        is_favorited: true,
        portfolio_id: 'port_stu_2026',
        portfolio_status: 'Included in Active Portfolio'
      },
      {
        id: 'ach_stu_5',
        student_id: 'STU-2024-01234',
        student_name: 'Maria Santos',
        program: 'BS Information Technology',
        title: "Dean's Lister - First Semester AY 2025-2026",
        event_name: 'Academic Honors Convocation',
        issuer: 'Office of the Vice President for Academic Affairs',
        location: 'Notre Dame of Marbel University',
        date: 'Dec 15, 2025',
        status: 'Verified',
        category: 'Academic',
        scope_level: 'Institutional / Campus-Wide',
        description: 'Achieved General Weighted Average of 1.18 in First Semester AY 2025-2026.',
        attached_file_name: 'deans_list_cert.pdf',
        return_remarks: '',
        is_favorited: false,
        portfolio_id: 'port_stu_2026',
        portfolio_status: 'Included in Active Portfolio'
      }
    ]

    this.#achievements = seedData.map(item => AchievementModel.fromJSON(item))
    this.#saveToStorage()
  }

  #saveToStorage() {
    try {
      const data = this.#achievements.map(a => a.toJSON())
      localStorage.setItem(this.#STORAGE_KEY, JSON.stringify(data))
    } catch (e) {
      console.warn('Failed to save student achievements to localStorage:', e)
    }
  }

  getAllAchievements() {
    return this.#achievements.map(a => a.toJSON())
  }

  getFilteredAchievements(searchQuery = '', statusFilter = 'All', categoryFilter = 'All', sortOrder = 'newest') {
    let result = this.#achievements.filter(item => item.matchesFilter(searchQuery, statusFilter, categoryFilter))

    result = [...result].sort((a, b) => {
      if (sortOrder === 'newest') return new Date(b.date) - new Date(a.date)
      if (sortOrder === 'oldest') return new Date(a.date) - new Date(b.date)
      if (sortOrder === 'title') return a.title.localeCompare(b.title)
      return 0
    })

    return result.map(a => a.toJSON())
  }

  getStats() {
    const all = this.#achievements
    return {
      total: all.length,
      verified: all.filter(a => a.status === 'Verified').length,
      pending: all.filter(a => a.status === 'Pending Review' || a.status === 'Pending').length,
      returned: all.filter(a => a.status === 'Returned').length,
      favorited: all.filter(a => a.is_favorited).length,
      in_portfolio: all.filter(a => a.portfolio_id).length
    }
  }

  addAchievement(data) {
    const newEntry = AchievementModel.fromJSON({
      ...data,
      id: `ach_stu_${Date.now()}`,
      status: 'Pending Review',
      portfolio_status: 'Pending Verification'
    })
    this.#achievements.unshift(newEntry)
    this.#saveToStorage()
    return newEntry.toJSON()
  }

  updateAchievement(id, updatedData) {
    const idx = this.#achievements.findIndex(a => a.id === id)
    if (idx !== -1) {
      const current = this.#achievements[idx].toJSON()
      const merged = AchievementModel.fromJSON({
        ...current,
        ...updatedData,
        status: updatedData.status || (current.status === 'Returned' ? 'Pending Review' : current.status),
        return_remarks: updatedData.status === 'Pending Review' ? '' : (updatedData.return_remarks ?? current.return_remarks)
      })
      this.#achievements[idx] = merged
      this.#saveToStorage()
      return merged.toJSON()
    }
    return null
  }

  resubmitAchievement(id, updatedData) {
    return this.updateAchievement(id, {
      ...updatedData,
      status: 'Pending Review',
      portfolio_status: 'Pending Verification',
      return_remarks: ''
    })
  }

  deleteAchievement(id) {
    const idx = this.#achievements.findIndex(a => a.id === id)
    if (idx !== -1) {
      const item = this.#achievements[idx]
      if (item.canDelete()) {
        this.#achievements.splice(idx, 1)
        this.#saveToStorage()
        return true
      }
    }
    return false
  }

  toggleFavorite(id) {
    const idx = this.#achievements.findIndex(a => a.id === id)
    if (idx !== -1) {
      this.#achievements[idx].toggleFavorite()
      this.#saveToStorage()
      return this.#achievements[idx].toJSON()
    }
    return null
  }

  toggleAttachPortfolio(id) {
    const idx = this.#achievements.findIndex(a => a.id === id)
    if (idx !== -1) {
      const item = this.#achievements[idx]
      if (item.portfolio_id) {
        // Detach
        item.attachToPortfolio(null, 'Not attached')
        const json = item.toJSON()
        json.portfolio_status = 'Available for Portfolio'
        this.#achievements[idx] = AchievementModel.fromJSON(json)
      } else {
        // Attach
        item.attachToPortfolio('port_stu_2026', 'AY 2025-2026 Student Co-Curricular Portfolio')
      }
      this.#saveToStorage()
      return this.#achievements[idx].toJSON()
    }
    return null
  }
}

export default new StudentAchievementController()
