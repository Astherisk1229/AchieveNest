import { beforeEach, describe, expect, it, vi } from 'vitest'

const { get, post, patch } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn()
}))

vi.mock('../apiClient', () => ({
  default: {
    get,
    post,
    patch
  }
}))

import eventService from '../eventService'

describe('eventService', () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
    patch.mockReset()
  })

  it('loads canonical persisted events', async () => {
    const events = [
      {
        id: 'event-1',
        title: 'NDMU Technology Summit',
        event_type: 'Summit',
        status: 'published'
      }
    ]

    get.mockResolvedValue({
      data: {
        events
      }
    })

    await expect(eventService.list()).resolves.toEqual(events)

    expect(get).toHaveBeenCalledTimes(1)
    expect(get).toHaveBeenCalledWith('/events')
  })

  it('loads canonical active event venues via GET /event-venues', async () => {
    const venues = [
      { id: 'v-1', name: 'BRC Convention Hall', sort_order: 1 },
      { id: 'v-2', name: 'NDMU Gymnasium', sort_order: 6 }
    ]

    get.mockResolvedValue({
      data: {
        venues
      }
    })

    const result = await eventService.listVenues()
    expect(result).toEqual(venues)

    expect(get).toHaveBeenCalledTimes(1)
    expect(get).toHaveBeenCalledWith('/event-venues')
  })

  it('creates an event sending canonical venue_id and omitting non-persisted client authority', async () => {
    const canonicalPayload = {
      title: 'NDMU Technology Summit',
      description: 'Official organization event.',
      event_type: 'Summit',
      osad_template_id: 'OSAD-TPL-01',
      start_time: '2026-10-01 08:00:00',
      end_time: '2026-10-01 17:00:00',
      venue_id: 'f0490559-b777-11f1-809c-b48c9d01dd3e'
    }

    post.mockResolvedValue({
      data: {
        message: 'Official event created successfully.',
        id: 'event-1',
        title: canonicalPayload.title
      }
    })

    await eventService.create(canonicalPayload)

    expect(post).toHaveBeenCalledWith('/events', canonicalPayload)
    // Verify server authority fields are not sent
    expect(post).not.toHaveBeenCalledWith('/events', expect.objectContaining({
      organization_id: expect.anything(),
      organizer_profile_id: expect.anything(),
      status: expect.anything(),
      venue: expect.anything()
    }))
  })

  it('updates an Event through the canonical PATCH endpoint with changed venue_id', async () => {
    const payload = {
      title: 'Updated Summit',
      event_type: 'Summit',
      start_time: '2026-10-01 09:00:00',
      end_time: '2026-10-01 17:00:00',
      venue_id: 'f049080b-b777-11f1-809c-b48c9d01dd3e'
    }

    patch.mockResolvedValue({
      data: {
        message: 'Official event updated successfully.',
        event: {
          id: 'event-1',
          ...payload
        }
      }
    })

    await eventService.update('event-1', payload)

    expect(patch).toHaveBeenCalledTimes(1)
    expect(patch).toHaveBeenCalledWith('/events/event-1', payload)
  })

  it('updates an Event while omitting venue entirely for legacy preservation', async () => {
    const payload = {
      title: 'Updated Title Only',
      event_type: 'Workshop',
      start_time: '2026-10-01 09:00:00',
      end_time: '2026-10-01 12:00:00'
    }

    patch.mockResolvedValue({
      data: {
        message: 'Official event updated successfully.',
        event: {
          id: 'legacy-event-1',
          ...payload
        }
      }
    })

    await eventService.update('legacy-event-1', payload)

    expect(patch).toHaveBeenCalledWith('/events/legacy-event-1', payload)
    expect(payload.venue_id).toBeUndefined()
    expect(payload.venue).toBeUndefined()
  })

  it('cancels an Event through the canonical lifecycle endpoint', async () => {
    post.mockResolvedValue({
      data: {
        message: 'Official event cancelled successfully.',
        event: {
          id: 'event-1',
          status: 'cancelled'
        }
      }
    })

    await eventService.cancel('event-1')

    expect(post).toHaveBeenCalledWith('/events/event-1/cancel')
  })

  it('returns safe empty values when API data envelopes are absent', async () => {
    get.mockResolvedValue({})
    post.mockResolvedValue({})
    patch.mockResolvedValue({})

    await expect(eventService.list()).resolves.toEqual([])
    await expect(eventService.listVenues()).resolves.toEqual([])
    await expect(eventService.create({})).resolves.toBeNull()
    await expect(eventService.update('event-1', {})).resolves.toBeNull()
    await expect(eventService.cancel('event-1')).resolves.toBeNull()
  })
})
