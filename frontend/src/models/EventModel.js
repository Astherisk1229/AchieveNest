/**
 * EventModel.js
 * Domain model class representing an Organization Event.
 */
export default class EventModel {
  #id
  #title
  #category
  #date
  #time
  #venue
  #status
  #participants_count
  #capacity
  #banner_type
  #description
  #target_audience
  #osad_template_id
  #signatory_1
  #signatory_2
  #signatory_1_img
  #signatory_2_img
  #attendance_start_time
  #attendance_end_time
  #session_status
  #scanned_participants

  constructor(data = {}) {
    this.#id = data.id || `evt-${Date.now()}`
    this.#title = data.title || 'Untitled Event'
    this.#category = data.category || 'Workshop'
    this.#date = data.date || '2026-08-15'
    this.#time = data.time || '9:00 AM - 5:00 PM'
    this.#venue = data.venue || 'NDMU Convention Center'
    this.#status = data.status || 'Upcoming'
    this.#participants_count = data.participants_count || 0
    this.#capacity = data.capacity || 100
    this.#banner_type = data.banner_type || 'laptop'
    this.#description = data.description || 'Join us for an engaging session designed to foster institutional excellence, technology integration, and student leadership development.'
    this.#target_audience = data.target_audience || 'All College Students & Faculty'
    this.#osad_template_id = data.osad_template_id || 'OSAD-TPL-01'
    this.#signatory_1 = data.signatory_1 || 'Dr. Ana Reyes (Club Moderator)'
    this.#signatory_2 = data.signatory_2 || 'Prof. Juan Dela Cruz (OSAD Director)'
    this.#signatory_1_img = data.signatory_1_img || null
    this.#signatory_2_img = data.signatory_2_img || null

    this.#attendance_start_time = data.attendance_start_time || '08:30'
    this.#attendance_end_time = data.attendance_end_time || '09:30'
    this.#session_status = data.session_status || 'Locked'
    this.#scanned_participants = data.scanned_participants || []
  }

  // Getters
  get id() { return this.#id }
  get title() { return this.#title }
  get category() { return this.#category }
  get date() { return this.#date }
  get time() { return this.#time }
  get venue() { return this.#venue }
  get status() { return this.#status }
  get participants_count() { return this.#participants_count }
  get capacity() { return this.#capacity }
  get banner_type() { return this.#banner_type }
  get description() { return this.#description }
  get target_audience() { return this.#target_audience }
  get osad_template_id() { return this.#osad_template_id }
  get signatory_1() { return this.#signatory_1 }
  get signatory_2() { return this.#signatory_2 }
  get signatory_1_img() { return this.#signatory_1_img }
  get signatory_2_img() { return this.#signatory_2_img }
  get attendance_start_time() { return this.#attendance_start_time }
  get attendance_end_time() { return this.#attendance_end_time }
  get session_status() { return this.#session_status }
  get scanned_participants() { return this.#scanned_participants }

  // Status helper
  get statusBadgeColor() {
    switch (this.#status) {
      case 'Ongoing':
        return 'bg-emerald-500/20 text-emerald-700 border-emerald-300 font-bold'
      case 'Completed':
        return 'bg-slate-200 text-slate-700 border-slate-300 font-bold'
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 font-bold'
    }
  }

  toJSON() {
    return {
      id: this.#id,
      title: this.#title,
      category: this.#category,
      date: this.#date,
      time: this.#time,
      venue: this.#venue,
      status: this.#status,
      participants_count: this.#participants_count,
      capacity: this.#capacity,
      banner_type: this.#banner_type,
      description: this.#description,
      target_audience: this.#target_audience,
      osad_template_id: this.#osad_template_id,
      signatory_1: this.#signatory_1,
      signatory_2: this.#signatory_2,
      signatory_1_img: this.#signatory_1_img,
      signatory_2_img: this.#signatory_2_img,
      attendance_start_time: this.#attendance_start_time,
      attendance_end_time: this.#attendance_end_time,
      session_status: this.#session_status,
      scanned_participants: this.#scanned_participants
    }
  }

}

