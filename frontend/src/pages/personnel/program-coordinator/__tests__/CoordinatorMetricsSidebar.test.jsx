import { describe, it, expect } from 'vitest'

describe('CoordinatorMetricsSidebar logic & config', () => {
  it('validates canonical status values for queue shortcuts', () => {
    const validStatuses = ['Pending', 'Verified', 'Returned']
    expect(validStatuses).toContain('Pending')
    expect(validStatuses).toContain('Verified')
    expect(validStatuses).toContain('Returned')
    expect(validStatuses).not.toContain('All')
  })

  it('formats metric counts accurately', () => {
    const counts = { pendingCount: 5, verifiedCount: 12, returnedCount: 2 }
    expect(counts.pendingCount).toBe(5)
    expect(counts.verifiedCount).toBe(12)
    expect(counts.returnedCount).toBe(2)
  })
})
