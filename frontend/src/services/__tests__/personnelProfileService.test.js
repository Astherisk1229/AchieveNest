import { describe, expect, it, vi } from 'vitest'

vi.mock('../apiClient', () => ({ default: { get: vi.fn(async () => ({ data: { data: { length_of_service: { display: '7 years, 4 months', basis: 'service_history' } } } })) } }))

import { fetchOwnLengthOfService, lengthOfServiceLabel } from '../personnelProfileService'

describe('Personnel portfolio Years of Service (C3)', () => {
  it('reads the server-computed length of service from the personnel profile', async () => {
    expect(await fetchOwnLengthOfService()).toMatchObject({ display: '7 years, 4 months' })
  })

  it('labels recorded and missing values', () => {
    expect(lengthOfServiceLabel({ display: '7 years, 4 months' })).toBe('7 years, 4 months of service')
    expect(lengthOfServiceLabel(null)).toBe('Years of service not yet recorded by HR')
    expect(lengthOfServiceLabel({ display: null, basis: 'unavailable' })).toBe('Years of service not yet recorded by HR')
  })
})
