import { describe, expect, it } from 'vitest'
import {
  mapApiEventStatusToUi,
  mapApiEventToUi,
  mapUiEventToApi
} from '../useOrganization'

describe('Organization Event canonical mapping', () => {
  it('maps persisted Event records with canonical venue_id into the moderator UI shape', () => {
    const event = mapApiEventToUi({
      id: 'event-1',
      title: 'Technology Summit',
      event_type: 'Workshop',
      start_time: '2026-10-01 09:00:00',
      end_time: '2026-10-01 17:00:00',
      venue_id: 'f0490559-b777-11f1-809c-b48c9d01dd3e',
      venue: 'BRC Convention Hall',
      status: 'published'
    })

    expect(event).toMatchObject({
      id: 'event-1',
      title: 'Technology Summit',
      category: 'Workshop',
      date: '2026-10-01',
      startTime: '09:00',
      endTime: '17:00',
      time: '9:00 AM - 5:00 PM',
      venue_id: 'f0490559-b777-11f1-809c-b48c9d01dd3e',
      venue: 'BRC Convention Hall',
      status: 'Upcoming',
      participants_count: 0,
      banner_type: 'target'
    })
  })

  it('maps historical legacy event (venue_id=NULL) preserving historical venue text', () => {
    const legacyEvent = mapApiEventToUi({
      id: 'legacy-event-1',
      title: 'R3 Acceptance Event',
      event_type: 'Institutional',
      start_time: '2026-09-23 18:19:48',
      end_time: '2026-09-23 20:19:48',
      venue_id: null,
      venue: 'R3 Acceptance Hall',
      status: 'cancelled'
    })

    expect(legacyEvent.venue_id).toBeNull()
    expect(legacyEvent.venue).toBe('R3 Acceptance Hall')
    expect(legacyEvent.status).toBe('Cancelled')
    expect(legacyEvent.date).toBe('2026-09-23')
    expect(legacyEvent.startTime).toBe('18:19')
    expect(legacyEvent.endTime).toBe('20:19')
  })

  it('maps cancelled into the moderator lifecycle label', () => {
    expect(
      mapApiEventStatusToUi('cancelled')
    ).toBe('Cancelled')
  })

  it('maps structured form schedule to backend local datetime without UTC shift', () => {
    const result = mapUiEventToApi({
      title: 'Technology Summit',
      category: 'Summit',
      date: '2026-10-15',
      startTime: '09:00',
      endTime: '11:00',
      venue_id: 'f0490559-b777-11f1-809c-b48c9d01dd3e',
      description: 'Official technology event.'
    })

    expect(result).toEqual({
      title: 'Technology Summit',
      description: 'Official technology event.',
      event_type: 'Summit',
      start_time: '2026-10-15 09:00:00',
      end_time: '2026-10-15 11:00:00',
      venue_id: 'f0490559-b777-11f1-809c-b48c9d01dd3e'
    })
    // Ensure no client authority fields
    expect(result).not.toHaveProperty('organization_id')
    expect(result).not.toHaveProperty('organizer_profile_id')
    expect(result).not.toHaveProperty('status')
  })

  it('omits venue fields when updating a legacy event without changing venue', () => {
    const updatePayload = mapUiEventToApi({
      title: 'R3 Acceptance Event EDITED',
      category: 'Institutional',
      date: '2026-09-23',
      startTime: '18:19',
      endTime: '20:19',
      venue_id: '', // left empty / unselected
      description: 'Updated description'
    }, true) // isUpdate = true

    expect(updatePayload).toEqual({
      title: 'R3 Acceptance Event EDITED',
      description: 'Updated description',
      event_type: 'Institutional',
      start_time: '2026-09-23 18:19:00',
      end_time: '2026-09-23 20:19:00'
    })
    expect(updatePayload.venue_id).toBeUndefined()
    expect(updatePayload.venue).toBeUndefined()
  })

  it('includes canonical venue_id when updating an event with new venue selection', () => {
    const updatePayload = mapUiEventToApi({
      title: 'R3 Acceptance Event Upgraded Venue',
      category: 'Institutional',
      date: '2026-09-23',
      startTime: '18:19',
      endTime: '20:19',
      venue_id: 'f049080b-b777-11f1-809c-b48c9d01dd3e',
      description: 'Upgraded to canonical venue'
    }, true)

    expect(updatePayload.venue_id).toBe('f049080b-b777-11f1-809c-b48c9d01dd3e')
  })

  it('rejects end time earlier than or equal to start time', () => {
    expect(() => (
      mapUiEventToApi({
        title: 'Invalid Window Event',
        category: 'Summit',
        date: '2026-10-01',
        startTime: '17:00',
        endTime: '09:00',
        venue_id: 'v-1'
      })
    )).toThrow('End time must be later than start time.')

    expect(() => (
      mapUiEventToApi({
        title: 'Zero Duration Event',
        category: 'Summit',
        date: '2026-10-01',
        startTime: '10:00',
        endTime: '10:00',
        venue_id: 'v-1'
      })
    )).toThrow('End time must be later than start time.')
  })

  it('supports legacy time-range format for backward compatibility', () => {
    expect(
      mapUiEventToApi({
        title: 'Legacy Compatibility Test',
        category: 'Workshop',
        date: '2026-10-01',
        time: '9:00 AM - 5:00 PM',
        venue_id: 'v-1'
      })
    ).toEqual({
      title: 'Legacy Compatibility Test',
      description: null,
      event_type: 'Workshop',
      start_time: '2026-10-01 09:00:00',
      end_time: '2026-10-01 17:00:00',
      venue_id: 'v-1'
    })
  })

  it('maps overnight event from backend and correctly extracts startDate, startTime, endDate, endTime', () => {
    const overnight = mapApiEventToUi({
      id: 'event-overnight-1',
      title: 'Overnight Hackathon',
      event_type: 'Workshop',
      start_time: '2026-06-24 21:00:00',
      end_time: '2026-06-25 03:00:00',
      venue_id: 'v-123',
      venue: 'NDMU Gymnasium',
      status: 'published'
    })

    expect(overnight.startDate).toBe('2026-06-24')
    expect(overnight.startTime).toBe('21:00')
    expect(overnight.endDate).toBe('2026-06-25')
    expect(overnight.endTime).toBe('03:00')
    expect(overnight.display_schedule).toContain('Wed, Jun 24, 2026, 9:00 PM')
    expect(overnight.display_schedule).toContain('Thu, Jun 25, 2026, 3:00 AM')
  })

  it('maps multi-day event from backend and extracts separate dates and times', () => {
    const multiDay = mapApiEventToUi({
      id: 'event-multiday-1',
      title: 'Annual Youth Summit',
      event_type: 'Summit',
      start_time: '2026-06-24 09:00:00',
      end_time: '2026-06-26 13:00:00',
      venue_id: 'v-123',
      venue: 'BRC Convention Hall',
      status: 'published'
    })

    expect(multiDay.startDate).toBe('2026-06-24')
    expect(multiDay.startTime).toBe('09:00')
    expect(multiDay.endDate).toBe('2026-06-26')
    expect(multiDay.endTime).toBe('13:00')
    expect(multiDay.display_schedule).toContain('Wed, Jun 24, 2026, 9:00 AM')
    expect(multiDay.display_schedule).toContain('Fri, Jun 26, 2026, 1:00 PM')
  })

  it('maps UI overnight schedule to backend local datetime without UTC shift', () => {
    const payload = mapUiEventToApi({
      title: 'Overnight Tech Night',
      category: 'Workshop',
      startDate: '2026-06-24',
      startTime: '21:00',
      endDate: '2026-06-25',
      endTime: '03:00',
      venue_id: 'v-123',
      description: 'Overnight event'
    })

    expect(payload.start_time).toBe('2026-06-24 21:00:00')
    expect(payload.end_time).toBe('2026-06-25 03:00:00')
    // Crucial: Wall-clock numbers must match exactly, no toISOString timezone offset
    expect(payload.start_time).not.toContain('Z')
    expect(payload.end_time).not.toContain('Z')
  })

  it('maps UI multi-day schedule to backend local datetime', () => {
    const payload = mapUiEventToApi({
      title: 'Multi-Day Conference',
      category: 'Summit',
      startDate: '2026-06-24',
      startTime: '09:00',
      endDate: '2026-06-26',
      endTime: '13:00',
      venue_id: 'v-123'
    })

    expect(payload.start_time).toBe('2026-06-24 09:00:00')
    expect(payload.end_time).toBe('2026-06-26 13:00:00')
  })

  it('rejects multi-day event if end date is before start date', () => {
    expect(() => (
      mapUiEventToApi({
        title: 'Backwards Date Event',
        category: 'Summit',
        startDate: '2026-06-25',
        startTime: '09:00',
        endDate: '2026-06-24',
        endTime: '17:00',
        venue_id: 'v-1'
      })
    )).toThrow('End time must be later than start time.')
  })
})