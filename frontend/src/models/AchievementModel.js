/**
 * AchievementModel.js
 * OOP Domain Model encapsulating achievement submissions, verification statuses, and remarks.
 */
export default class AchievementModel {
  #id
  #student_id
  #student_name
  #program
  #title
  #event_name
  #issuer
  #location
  #category
  #scope_level
  #rank_conferred
  #academic_year
  #semester
  #description
  #attached_file_name
  #date
  #status
  #return_remarks
  #docs_count
  #participation_photo_name
  #is_favorited
  #portfolio_id
  #portfolio_name
  #portfolio_status
  #evidence_id
  #evidence
  #claimed_points
  #advisory_classification
  #ocr_metadata

  constructor(data = {}) {
    this.#id = data.id || `ach_${Math.random().toString(36).substr(2, 9)}`
    this.#student_id = data.student_id || data.personnel_profile_id || '2024-00000'
    this.#student_name = data.student_name || data.personnel_name || 'Anonymous'
    this.#program = data.program || ''
    this.#title = data.title || 'Untitled Achievement'
    this.#event_name = data.event_name || ''
    this.#issuer = data.issuer || data.organizer_or_publisher || ''
    this.#location = data.location || data.organizer_or_publisher || data.issuer || ''
    this.#category = data.category || (data.domain === 'productivity_creative_work' ? 'B.2 Publication' : data.domain === 'service_leadership' ? 'C.2 Community Involvement' : 'A.3 Attendance to Seminars/Trainings')
    this.#scope_level = data.scope_level || 'Institutional / Campus-Wide'
    this.#rank_conferred = data.rank_conferred || 'Participant / Special Award'
    this.#academic_year = data.academic_year || 'AY 2025-2026'
    this.#semester = data.semester || '1st Semester'
    this.#description = data.description || ''
    this.#attached_file_name = data.attached_file_name || data.primary_evidence?.original_filename || data.evidence?.[0]?.original_filename || 'supporting_document.pdf'
    this.#date = data.date || data.occurrence_date || data.date_achieved || new Date().toISOString().split('T')[0]
    this.#status = data.status === 'submitted' ? 'Pending Review' : (data.status === 'verified' ? 'Verified' : (data.status === 'rejected' ? 'Returned' : (data.status || 'Pending Review')))
    this.#return_remarks = data.return_remarks || data.rejection_reason || ''
    this.#docs_count = Number(data.docs_count) || (Array.isArray(data.evidence) ? data.evidence.length : 1) || 1
    this.#participation_photo_name = data.participation_photo_name || ''
    this.#is_favorited = Boolean(data.is_favorited)
    this.#portfolio_id = data.portfolio_id || null
    this.#portfolio_name = data.portfolio_name || (data.portfolio_id ? 'AY 2025-2026 Personnel Ranking Portfolio' : 'Not attached')
    this.#portfolio_status = data.portfolio_status || (data.status === 'Verified' ? 'Verified in Portfolio' : data.portfolio_id ? 'Included in Active Portfolio' : 'Available for Portfolio')
    this.#evidence_id = data.evidence_id || data.primary_evidence?.id || data.evidence?.[0]?.id || null
    this.#evidence = Array.isArray(data.evidence) ? data.evidence : []
    this.#claimed_points = Number(data.claimed_points || data.points || 0)
    this.#advisory_classification = data.advisory_classification || null
    this.#ocr_metadata = data.ocr_metadata || null
  }

  // Encapsulated Getters
  get id() { return this.#id }
  get evidence_id() { return this.#evidence_id || this.#evidence?.[0]?.id || null }
  get evidence() { return this.#evidence }
  get claimed_points() { return this.#claimed_points }
  get advisory_classification() { return this.#advisory_classification }
  get ocr_metadata() { return this.#ocr_metadata }
  get student_id() { return this.#student_id }
  get student_name() { return this.#student_name }
  get program() { return this.#program }
  get title() { return this.#title }
  get event_name() { return this.#event_name }
  get issuer() { return this.#issuer }
  get location() { return this.#location }
  get category() { return this.#category }
  get scope_level() { return this.#scope_level }
  get rank_conferred() { return this.#rank_conferred }
  get academic_year() { return this.#academic_year }
  get semester() { return this.#semester }
  get description() { return this.#description }
  get attached_file_name() { return this.#attached_file_name }
  get date() { return this.#date }
  get status() { return this.#status }
  get return_remarks() { return this.#return_remarks }
  get docs_count() { return this.#docs_count }
  get participation_photo_name() { return this.#participation_photo_name }
  get is_favorited() { return this.#is_favorited }
  get portfolio_id() { return this.#portfolio_id }
  get portfolio_name() { return this.#portfolio_name }
  get portfolio_status() { return this.#portfolio_status }

  // NDMU Evaluation Rating Sheet Helper
  get ndmu_area() {
    const cat = this.#category
    if (cat.startsWith('A.') || cat.includes('Degree') || cat.includes('Seminar') || cat.includes('Training') || cat.includes('Membership')) {
      return 'Area A: Professional Development'
    }
    if (cat.startsWith('B.') || cat.includes('Publication') || cat.includes('Research') || cat.includes('Award') || cat.includes('Instructional') || cat.includes('Lecturer')) {
      return 'Area B: Productivity & Creative Work'
    }
    if (cat.startsWith('C.') || cat.includes('Service') || cat.includes('Community') || cat.includes('Involvement')) {
      return 'Area C: Service & Leadership'
    }
    return 'Area B: Productivity & Creative Work'
  }

  // Personnel Capabilities
  canEdit() {
    return this.#status === 'Pending Review' || this.#status === 'Pending' || this.#status === 'Returned' || this.#status === 'Draft'
  }

  canDelete() {
    return this.#status !== 'Verified'
  }

  canResubmit() {
    return this.#status === 'Returned'
  }

  toggleFavorite() {
    this.#is_favorited = !this.#is_favorited
    return this
  }

  attachToPortfolio(portfolioId, portfolioName = 'AY 2025-2026 Evaluation Portfolio') {
    this.#portfolio_id = portfolioId
    this.#portfolio_name = portfolioName
    this.#portfolio_status = 'Included in Active Portfolio'
    return this
  }

  // State Mutator Methods
  verify() {
    this.#status = 'Verified'
    this.#portfolio_status = 'Verified in Portfolio'
    this.#return_remarks = ''
    return this
  }

  returnWithRemarks(remarks = '') {
    this.#status = 'Returned'
    this.#portfolio_status = 'Returned for Correction'
    this.#return_remarks = remarks
    return this
  }

  matchesFilter(searchQuery = '', statusFilter = 'All', categoryFilter = 'All') {
    const q = searchQuery.toLowerCase().trim()
    const matchesSearch = !q ||
      this.#title.toLowerCase().includes(q) ||
      this.#student_name.toLowerCase().includes(q) ||
      this.#category.toLowerCase().includes(q) ||
      (this.#event_name && this.#event_name.toLowerCase().includes(q)) ||
      (this.#issuer && this.#issuer.toLowerCase().includes(q)) ||
      (this.#location && this.#location.toLowerCase().includes(q))

    const matchesStatus = statusFilter === 'All' || this.#status === statusFilter
    const matchesCategory = categoryFilter === 'All' || this.#category === categoryFilter || this.ndmu_area === categoryFilter

    return matchesSearch && matchesStatus && matchesCategory
  }

  toJSON() {
    return {
      id: this.#id,
      student_id: this.#student_id,
      student_name: this.#student_name,
      program: this.#program,
      title: this.#title,
      event_name: this.#event_name,
      issuer: this.#issuer,
      location: this.#location,
      category: this.#category,
      scope_level: this.#scope_level,
      rank_conferred: this.#rank_conferred,
      academic_year: this.#academic_year,
      semester: this.#semester,
      description: this.#description,
      attached_file_name: this.#attached_file_name,
      date: this.#date,
      status: this.#status,
      return_remarks: this.#return_remarks,
      docs_count: this.#docs_count,
      participation_photo_name: this.#participation_photo_name,
      is_favorited: this.#is_favorited,
      portfolio_id: this.#portfolio_id,
      portfolio_name: this.#portfolio_name,
      portfolio_status: this.#portfolio_status,
      evidence_id: this.#evidence_id,
      evidence: this.#evidence,
      claimed_points: this.#claimed_points,
      advisory_classification: this.#advisory_classification,
      ocr_metadata: this.#ocr_metadata
    }
  }

  static fromJSON(data) {
    return new AchievementModel(data)
  }
}

