import { describe, it, expect } from 'vitest'
import { AdminSetupGuideController } from '../AdminSetupGuideController'

describe('AdminSetupGuideController', () => {
  it('evaluates OSAD guide for osad_staff role', () => {
    const result = AdminSetupGuideController.evaluateGuide('osad_staff')

    expect(result).not.toBeNull()
    expect(result.guideId).toBe('osad-get-started')
    expect(result.title).toBe('Get Started with OSAD')
    expect(result.ownerRole).toBe('osad_staff')
    expect(result.steps).toHaveLength(4)
    expect(result.metrics).toHaveProperty('progressPercent')
    expect(typeof result.metrics.progressPercent).toBe('number')
  })

  it('evaluates HR guide for hr_staff role', () => {
    const result = AdminSetupGuideController.evaluateGuide('hr_staff')

    expect(result).not.toBeNull()
    expect(result.guideId).toBe('hr-get-started')
    expect(result.title).toBe('Get Started with HR Administration')
    expect(result.ownerRole).toBe('hr_staff')
    expect(result.steps).toHaveLength(4)
    expect(result.metrics).toHaveProperty('completedCount')
  })

  it('returns null for unsupported roles (e.g. student)', () => {
    const result = AdminSetupGuideController.evaluateGuide('student')
    expect(result).toBeNull()
  })
})
