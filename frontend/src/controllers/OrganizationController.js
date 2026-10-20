import OrganizationModel from '../models/OrganizationModel'
import EventModel from '../models/EventModel'

/**
 * OrganizationController.js
 * Business logic controller for managing organization events, attendance, and metrics.
 */
class OrganizationController {
  #organization
  #events

  constructor() {
    this.#organization = new OrganizationModel({
      id: 'org-cs-ndmu',
      name: 'Computer Society NDMU',
      college: 'College of Engineering, Architecture, and Technology',
      academic_year: 'AY 2025-2026',
      moderator_name: 'Dr. Ana Reyes',
      active_members: 45
    })

    this.#events = [
      new EventModel({
        id: 'evt-1',
        title: 'Computer Society Tech Summit 2026',
        category: 'Summit',
        date: '2026-08-15',
        time: '9:00 AM - 5:00 PM',
        venue: 'NDMU Convention Center',
        status: 'Ongoing',
        participants_count: 156,
        capacity: 200,
        banner_type: 'laptop'
      }),
      new EventModel({
        id: 'evt-2',
        title: 'Leadership Training Workshop',
        category: 'Workshop',
        date: '2026-06-20',
        time: '2:00 PM - 6:00 PM',
        venue: 'Student Center Hall',
        status: 'Upcoming',
        participants_count: 0,
        capacity: 100,
        banner_type: 'target'
      }),
      new EventModel({
        id: 'evt-3',
        title: 'Annual Intramurals 2026',
        category: 'Sports',
        date: '2026-05-10',
        time: '7:00 AM - 6:00 PM',
        venue: 'NDMU Sports Complex',
        status: 'Completed',
        participants_count: 450,
        capacity: 500,
        banner_type: 'soccer'
      }),
      new EventModel({
        id: 'evt-4',
        title: 'Environmental Awareness Campaign',
        category: 'Community Service',
        date: '2026-06-25',
        time: '8:00 AM - 12:00 PM',
        venue: 'Sarangani Bay',
        status: 'Upcoming',
        participants_count: 0,
        capacity: 150,
        banner_type: 'sprout'
      })
    ]
  }

  getOrganizationInfo() {
    return this.#organization.toJSON()
  }

  getEvents() {
    return this.#events.map(evt => evt.toJSON())
  }

  getEventDetails(eventId) {
    const evt = this.#events.find(e => e.id === eventId)
    if (!evt) return null
    return evt.toJSON()
  }

  getMetrics() {
    const totalEvents = this.#events.length
    const totalParticipants = this.#events.reduce((sum, evt) => sum + evt.participants_count, 0)
    const certsIssued = 150
    const activeMembers = this.#organization.active_members

    return {
      events_this_year: totalEvents,
      total_participants: totalParticipants,
      certs_issued: certsIssued,
      active_members: activeMembers
    }
  }

  addEvent(eventData) {
    const newEvt = new EventModel(eventData)
    this.#events.push(newEvt)
    return newEvt.toJSON()
  }

  updateEvent(eventId, updatedData) {
    const idx = this.#events.findIndex(e => e.id === eventId)
    if (idx !== -1) {
      const existing = this.#events[idx].toJSON()
      this.#events[idx] = new EventModel({
        ...existing,
        ...updatedData
      })
      return this.#events[idx].toJSON()
    }
    return null
  }

  archiveEvent(eventId) {
    return this.updateEvent(eventId, { status: 'Archived' })
  }

  updateProfile(profileData) {
    this.#organization = new OrganizationModel({
      ...this.#organization.toJSON(),
      ...profileData
    })
    return this.#organization.toJSON()
  }
}

export default new OrganizationController()
