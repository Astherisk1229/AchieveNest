import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getOrganizationModeratorAssignments } from '../utils/roleContext'
import { fetchOrganization } from '../services/organizationAdminService'
import eventService from '../services/eventService'
import attendanceService from '../services/attendanceService'
import {
  combineDateAndTime,
  formatDisplaySchedule,
  parseTo24Hour
} from '../lib/eventSchedule'

const API_TO_UI_STATUS = Object.freeze({
  draft: 'Draft',
  published: 'Upcoming',
  ongoing: 'Ongoing',
  completed: 'Completed',
  cancelled: 'Cancelled'
})

const CATEGORY_LABELS = Object.freeze({
  summit: 'Summit',
  workshop: 'Workshop',
  leadership: 'Leadership',
  sports: 'Sports',
  'community service': 'Community Service',
  assembly: 'Assembly',
  institutional: 'Institutional'
})

export function mapApiEventStatusToUi(status) {
  const normalized = String(status ?? '')
    .trim()
    .toLowerCase()

  if (!normalized) return 'Upcoming'

  return (
    API_TO_UI_STATUS[normalized]
    ?? `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}`
  )
}

// A status transition is already durable once its API call has resolved. A
// follow-up list refresh is useful, but must not turn that completed mutation
// into a failure in the UI when the refresh has a transient problem.
export async function refreshAttendanceSessionsAfterTransition(loadSessions, eventId) {
  if (!eventId) return true

  try {
    await loadSessions(eventId)
    return true
  } catch {
    // loadAttendanceSessions records the retryable error in its own state.
    return false
  }
}

function normalizeCategory(value) {
  const raw = String(value ?? '').trim()

  if (!raw) return 'Institutional'

  return CATEGORY_LABELS[raw.toLowerCase()] ?? raw
}

function bannerTypeForCategory(category) {
  switch (normalizeCategory(category)) {
    case 'Sports':
      return 'soccer'

    case 'Community Service':
      return 'sprout'

    case 'Leadership':
    case 'Workshop':
      return 'target'

    default:
      return 'laptop'
  }
}

function formatBackendClock(value) {
  const match = String(value ?? '').match(
    /[ T](\d{2}):(\d{2})(?::\d{2})?/
  )

  if (!match) return ''

  let hour = Number(match[1])
  const minute = match[2]

  const suffix = (
    hour >= 12
      ? 'PM'
      : 'AM'
  )

  hour %= 12

  if (hour === 0) {
    hour = 12
  }

  return `${hour}:${minute} ${suffix}`
}

function parseUiClock(value) {
  const text = String(value ?? '').trim()

  const twelveHour = text.match(
    /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i
  )

  if (twelveHour) {
    let hour = Number(twelveHour[1])
    const minute = Number(twelveHour[2])
    const suffix = twelveHour[3].toUpperCase()

    if (
      hour < 1 ||
      hour > 12 ||
      minute < 0 ||
      minute > 59
    ) {
      throw new Error('Invalid Event time.')
    }

    if (suffix === 'AM') {
      if (hour === 12) hour = 0
    } else if (hour !== 12) {
      hour += 12
    }

    return (
      `${String(hour).padStart(2, '0')}:` +
      `${String(minute).padStart(2, '0')}:00`
    )
  }

  const twentyFourHour = text.match(
    /^([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/
  )

  if (twentyFourHour) {
    return (
      `${String(Number(twentyFourHour[1])).padStart(2, '0')}:` +
      `${twentyFourHour[2]}:` +
      `${twentyFourHour[3] ?? '00'}`
    )
  }

  throw new Error(
    'Invalid Event time window. Use a format like "9:00 AM - 5:00 PM".'
  )
}

function extract24HourClock(value) {
  const match = String(value ?? '').match(
    /[ T](\d{2}):(\d{2})(?::\d{2})?/
  )
  return match ? `${match[1]}:${match[2]}` : ''
}

export function mapApiEventToUi(event = {}) {
  const startTimeRaw = String(
    event.start_time ?? ''
  )

  const endTimeRaw = String(
    event.end_time ?? ''
  )

  const category = normalizeCategory(
    event.event_type ?? event.category
  )

  const startClock = formatBackendClock(
    startTimeRaw
  )

  const endClock = formatBackendClock(
    endTimeRaw
  )

  const startClock24 = extract24HourClock(startTimeRaw)
  const endClock24 = extract24HourClock(endTimeRaw)

  const startDate = event.startDate || (startTimeRaw.length >= 10 ? startTimeRaw.slice(0, 10) : (event.date || ''))
  const endDate = event.endDate || (endTimeRaw.length >= 10 ? endTimeRaw.slice(0, 10) : startDate)
  const startTime = startClock24 || (event.startTime ? parseTo24Hour(event.startTime) : '09:00')
  const endTime = endClock24 || (event.endTime ? parseTo24Hour(event.endTime) : '11:00')

  const displaySchedule = (startDate && startTime && endDate && endTime)
    ? formatDisplaySchedule(startDate, startTime, endDate, endTime)
    : (startClock && endClock ? `${startClock} - ${endClock}` : '')

  let certificateConfiguration = event.certificate_configuration ?? null
  if (typeof certificateConfiguration === 'string') {
    try {
      certificateConfiguration = JSON.parse(certificateConfiguration)
    } catch {
      certificateConfiguration = null
    }
  }

  return {
    ...event,
    category,
    venue_id: event.venue_id ?? null,
    venue: event.venue ?? '',
    date: startDate,
    startDate,
    startTime: startClock24,
    endDate,
    endTime: endClock24,
    time: (
      startClock && endClock && startDate === endDate
        ? `${startClock} - ${endClock}`
        : displaySchedule
    ),
    display_schedule: displaySchedule,
    status: mapApiEventStatusToUi(
      event.status
    ),
    participants_count: Number(
      event.participants_count ?? 0
    ),
    certificate_configuration: certificateConfiguration && typeof certificateConfiguration === 'object'
      ? certificateConfiguration
      : null,
    banner_type: (
      event.banner_type
      ?? bannerTypeForCategory(category)
    )
  }
}

function normalizeTimeComponent(timeVal) {
  const text = String(timeVal ?? '').trim()
  if (!text) {
    throw new Error('Time is required.')
  }

  const match24 = text.match(/^([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/)
  if (match24) {
    const h = String(Number(match24[1])).padStart(2, '0')
    const m = match24[2]
    const s = match24[3] ?? '00'
    return `${h}:${m}:${s}`
  }

  return parseUiClock(text)
}

export function mapUiEventToApi(event = {}, isUpdate = false) {
  const title = String(
    event.title ?? ''
  ).trim()

  const startDate = String(
    event.startDate || event.date || ''
  ).trim()

  const endDate = String(
    event.endDate || event.startDate || event.date || ''
  ).trim()

  const category = normalizeCategory(
    event.category ?? event.event_type
  )

  const rawDescription = String(
    event.description ?? ''
  ).trim()
  const description = rawDescription !== '' ? rawDescription : null

  if (!title) {
    throw new Error(
      'Event title is required.'
    )
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    throw new Error(
      'A valid Event date is required.'
    )
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    throw new Error(
      'A valid Event end date is required.'
    )
  }

  let startClock = ''
  let endClock = ''

  if (event.startTime && event.endTime) {
    startClock = normalizeTimeComponent(event.startTime)
    endClock = normalizeTimeComponent(event.endTime)
  } else if (event.time) {
    const timeParts = String(event.time)
      .split(/\s+[-–—]\s+/)
      .filter(Boolean)

    if (timeParts.length !== 2) {
      throw new Error(
        'Invalid Event time window. Use a format like "9:00 AM - 5:00 PM".'
      )
    }

    startClock = parseUiClock(timeParts[0])
    endClock = parseUiClock(timeParts[1])
  } else {
    throw new Error('Select a start time and end time.')
  }

  const start_time = `${startDate} ${startClock}`
  const end_time = `${endDate} ${endClock}`

  if (end_time <= start_time) {
    throw new Error('End time must be later than start time.')
  }

  const payload = {
    title,
    description,
    event_type: category,
    start_time,
    end_time
  }

  if (event.certificate_configuration && typeof event.certificate_configuration === 'object') {
    payload.certificate_configuration = event.certificate_configuration
  }

  // Canonical venue_id integration
  if (event.venue_id !== undefined && event.venue_id !== null && String(event.venue_id).trim() !== '') {
    payload.venue_id = String(event.venue_id).trim()
  } else if (event.venue && !isUpdate) {
    // Legacy fallback for tests passing venue string without venue_id
    payload.venue = String(event.venue).trim()
  }

  return payload
}

function errorMessage(error) {
  return (
    error?.response?.data?.error?.message
    ?? error?.response?.data?.message
    ?? error?.error?.message
    ?? error?.message
    ?? 'Unable to synchronize with the AchieveNest server.'
  )
}

export default function useOrganization(currentUser = {}) {
  const moderatorAssignments = getOrganizationModeratorAssignments(currentUser)
  const organizationIds = [...new Set(moderatorAssignments
    .filter(assignment => assignment.scope_type === 'organization' && assignment.scope_id)
    .map(assignment => String(assignment.scope_id)))]
  const organizationId = organizationIds.length === 1 ? organizationIds[0] : null
  const [orgInfo, setOrgInfo] = useState(null)
  const [organizationLoading, setOrganizationLoading] = useState(Boolean(organizationId))
  const [organizationError, setOrganizationError] = useState(null)

  const [events, setEvents] = useState([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [eventsError, setEventsError] = useState(null)

  const loadOrganization = useCallback(async () => {
    if (!organizationId) {
      setOrgInfo(null)
      setOrganizationLoading(false)
      setOrganizationError(organizationIds.length > 1
        ? 'More than one organization is assigned to this account. Contact OSAD to confirm the active assignment.'
        : 'No active organization is assigned to this moderator account.')
      return null
    }

    setOrganizationLoading(true)
    setOrganizationError(null)
    try {
      const organization = await fetchOrganization(organizationId)
      if (!organization) throw new Error('The assigned organization could not be found.')
      const mappedOrganization = {
        ...organization,
        college: organization.college_name || organization.programs?.[0]?.college_name || '',
        moderator_name: organization.current_moderator?.full_name || '',
        academic_year: ''
      }
      setOrgInfo(mappedOrganization)
      return mappedOrganization
    } catch (error) {
      setOrgInfo(null)
      setOrganizationError(errorMessage(error))
      throw error
    } finally {
      setOrganizationLoading(false)
    }
  }, [organizationId, organizationIds.length])

  useEffect(() => {
    loadOrganization().catch(error => {
      console.error('Unable to load the assigned organization.', error)
    })
  }, [loadOrganization])

  // Canonical Attendance State (R4 Step 2C-A)
  const [attendanceSessions, setAttendanceSessions] = useState([])
  const [attendanceSessionsLoading, setAttendanceSessionsLoading] = useState(false)
  const [attendanceSessionsError, setAttendanceSessionsError] = useState(null)
  const [activeAttendanceSession, setActiveAttendanceSession] = useState(null)
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [attendanceRecordsLoading, setAttendanceRecordsLoading] = useState(false)
  const [attendanceRecordsError, setAttendanceRecordsError] = useState(null)
  const attendanceSessionsRequestRef = useRef(0)
  const attendanceSelectionRequestRef = useRef(0)

  const loadEvents = useCallback(async () => {
    setEventsLoading(true)
    setEventsError(null)

    try {
      const rows = await eventService.list()

      const canonicalEvents = rows.map(
        mapApiEventToUi
      )

      setEvents(canonicalEvents)

      return canonicalEvents
    } catch (error) {
      setEventsError(
        errorMessage(error)
      )

      throw error
    } finally {
      setEventsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEvents().catch((error) => {
      console.error(
        'Unable to load canonical Events.',
        error
      )
    })
  }, [loadEvents])

  // Canonical Attendance Actions (R4 Step 2C-A)
  const loadAttendanceSessions = useCallback(async (eventId) => {
    const requestId = ++attendanceSessionsRequestRef.current
    if (!eventId) {
      setAttendanceSessions([])
      setAttendanceSessionsError(null)
      setAttendanceSessionsLoading(false)
      return []
    }
    setAttendanceSessionsLoading(true)
    setAttendanceSessionsError(null)
    setAttendanceSessions([])
    try {
      const sessions = await attendanceService.listEventAttendanceSessions(eventId)
      if (requestId === attendanceSessionsRequestRef.current) {
        setAttendanceSessions(sessions)
      }
      return sessions
    } catch (error) {
      const msg = errorMessage(error)
      if (requestId === attendanceSessionsRequestRef.current) {
        setAttendanceSessionsError(msg)
      }
      throw error
    } finally {
      if (requestId === attendanceSessionsRequestRef.current) {
        setAttendanceSessionsLoading(false)
      }
    }
  }, [])

  const createAttendanceSession = useCallback(async (eventId, payload) => {
    const session = await attendanceService.createAttendanceSession(eventId, payload)
    await loadAttendanceSessions(eventId)
    return session
  }, [loadAttendanceSessions])

  const selectAttendanceSession = useCallback(async (sessionId) => {
    const requestId = ++attendanceSelectionRequestRef.current
    if (!sessionId) {
      setActiveAttendanceSession(null)
      setAttendanceRecords([])
      setAttendanceRecordsError(null)
      setAttendanceRecordsLoading(false)
      return null
    }
    setAttendanceRecordsLoading(true)
    setAttendanceRecordsError(null)
    try {
      const [session, records] = await Promise.all([
        attendanceService.getAttendanceSession(sessionId),
        attendanceService.listAttendanceSessionRecords(sessionId)
      ])
      if (requestId === attendanceSelectionRequestRef.current) {
        setActiveAttendanceSession(session)
        setAttendanceRecords(records)
      }
      return { session, records }
    } catch (error) {
      const msg = errorMessage(error)
      if (requestId === attendanceSelectionRequestRef.current) {
        setAttendanceRecordsError(msg)
      }
      throw error
    } finally {
      if (requestId === attendanceSelectionRequestRef.current) {
        setAttendanceRecordsLoading(false)
      }
    }
  }, [])

  const openAttendanceSession = useCallback(async (sessionId, eventId) => {
    const updated = await attendanceService.transitionAttendanceSessionStatus(sessionId, 'open')
    setActiveAttendanceSession(updated)
    await refreshAttendanceSessionsAfterTransition(loadAttendanceSessions, eventId)
    return updated
  }, [loadAttendanceSessions])

  const closeAttendanceSession = useCallback(async (sessionId, eventId) => {
    const updated = await attendanceService.transitionAttendanceSessionStatus(sessionId, 'closed')
    setActiveAttendanceSession(updated)
    await refreshAttendanceSessionsAfterTransition(loadAttendanceSessions, eventId)
    return updated
  }, [loadAttendanceSessions])

  const loadAttendanceRecords = useCallback(async (sessionId) => {
    const requestId = ++attendanceSelectionRequestRef.current
    if (!sessionId) {
      setAttendanceRecords([])
      setAttendanceRecordsError(null)
      setAttendanceRecordsLoading(false)
      return []
    }
    setAttendanceRecordsLoading(true)
    setAttendanceRecordsError(null)
    try {
      const records = await attendanceService.listAttendanceSessionRecords(sessionId)
      if (requestId === attendanceSelectionRequestRef.current) {
        setAttendanceRecords(records)
      }
      return records
    } catch (error) {
      const msg = errorMessage(error)
      if (requestId === attendanceSelectionRequestRef.current) {
        setAttendanceRecordsError(msg)
      }
      throw error
    } finally {
      if (requestId === attendanceSelectionRequestRef.current) {
        setAttendanceRecordsLoading(false)
      }
    }
  }, [])

  const recordCheckIn = useCallback(async (sessionId, payload) => {
    if (!sessionId) throw new Error('Session ID is required for check-in.')
    const record = await attendanceService.checkInAttendance(sessionId, payload)
    await loadAttendanceRecords(sessionId)
    return record
  }, [loadAttendanceRecords])


  const metrics = useMemo(() => ({
    events_this_year: events.length,

    // Attendance becomes authoritative in R4.
    total_participants: events.reduce(
      (sum, event) => (
        sum +
        Number(event.participants_count ?? 0)
      ),
      0
    ),

    // Certificate counts become authoritative in R5.
    certs_issued: 0,

    active_members: Number(
      orgInfo?.active_members ?? 0
    )
  }), [events, orgInfo])

  const refreshData = useCallback(async () => {
    const results = await Promise.allSettled([loadOrganization(), loadEvents()])
    if (results[0].status === 'rejected') throw results[0].reason
    if (results[1].status === 'rejected') throw results[1].reason
    return results[1].value
  }, [loadEvents, loadOrganization])

  const createEvent = useCallback(
    async (eventData) => {
      const payload = mapUiEventToApi(
        eventData
      )

      const result = await eventService.create(
        payload
      )

      // The event is durable once POST resolves. A transient list refresh must
      // not keep the create modal open and make users think creation failed.
      await loadEvents().catch((error) => {
        console.error('Event was created, but the event list could not refresh.', error)
      })

      return result
    },
    [loadEvents]
  )

  const updateEvent = useCallback(
    async (eventId, eventData) => {
      const payload = mapUiEventToApi(
        eventData,
        true
      )

      const result = await eventService.update(
        eventId,
        payload
      )

      await loadEvents().catch((error) => {
        console.error('Event was updated, but the event list could not refresh.', error)
      })

      return result
    },
    [loadEvents]
  )

  const cancelEvent = useCallback(
    async (eventId) => {
      const result = await eventService.cancel(
        eventId
      )

      await loadEvents()

      return result
    },
    [loadEvents]
  )

  const getEventDetails = useCallback(
    (eventId) => (
      events.find(
        (event) => event.id === eventId
      ) ?? null
    ),
    [events]
  )

  return {
    orgInfo,
    organizationLoading,
    organizationError,
    events,
    metrics,
    eventsLoading,
    eventsError,
    attendanceSessions,
    attendanceSessionsLoading,
    attendanceSessionsError,
    activeAttendanceSession,
    attendanceRecords,
    attendanceRecordsLoading,
    attendanceRecordsError,
    loadAttendanceSessions,
    createAttendanceSession,
    selectAttendanceSession,
    openAttendanceSession,
    closeAttendanceSession,
    loadAttendanceRecords,
    recordCheckIn,
    createEvent,
    updateEvent,
    cancelEvent,
    getEventDetails,
    refreshData
  }
}
