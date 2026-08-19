import { describe, it, expect } from 'vitest'
import { AdminSetupStatusModel, SETUP_STEP_STATUS } from '../AdminSetupStatusModel'

describe('AdminSetupStatusModel', () => {
  it('computes 0% progress when no steps are completed', () => {
    const steps = [
      { id: 'step-1', status: SETUP_STEP_STATUS.NOT_STARTED },
      { id: 'step-2', status: SETUP_STEP_STATUS.IN_PROGRESS },
      { id: 'step-3', status: SETUP_STEP_STATUS.BLOCKED }
    ]

    const result = AdminSetupStatusModel.computeProgress(steps)

    expect(result.totalApplicable).toBe(3)
    expect(result.completedCount).toBe(0)
    expect(result.progressPercent).toBe(0)
    expect(result.isFullyComplete).toBe(false)
    expect(result.hasBlocked).toBe(true)
    expect(result.hasInProgress).toBe(true)
  })

  it('computes correct percentage and excludes NOT_APPLICABLE steps from denominator', () => {
    const steps = [
      { id: 'step-1', status: SETUP_STEP_STATUS.COMPLETE },
      { id: 'step-2', status: SETUP_STEP_STATUS.COMPLETE },
      { id: 'step-3', status: SETUP_STEP_STATUS.NOT_STARTED },
      { id: 'step-4', status: SETUP_STEP_STATUS.NOT_APPLICABLE }
    ]

    const result = AdminSetupStatusModel.computeProgress(steps)

    expect(result.totalApplicable).toBe(3)
    expect(result.completedCount).toBe(2)
    expect(result.progressPercent).toBe(67)
    expect(result.isFullyComplete).toBe(false)
  })

  it('reports 100% and isFullyComplete when all applicable steps are complete', () => {
    const steps = [
      { id: 'step-1', status: SETUP_STEP_STATUS.COMPLETE },
      { id: 'step-2', status: SETUP_STEP_STATUS.COMPLETE },
      { id: 'step-3', status: SETUP_STEP_STATUS.NOT_APPLICABLE }
    ]

    const result = AdminSetupStatusModel.computeProgress(steps)

    expect(result.totalApplicable).toBe(2)
    expect(result.completedCount).toBe(2)
    expect(result.progressPercent).toBe(100)
    expect(result.isFullyComplete).toBe(true)
    expect(result.hasBlocked).toBe(false)
    expect(result.hasInProgress).toBe(false)
  })

  it('handles empty step array safely', () => {
    const result = AdminSetupStatusModel.computeProgress([])

    expect(result.totalApplicable).toBe(0)
    expect(result.completedCount).toBe(0)
    expect(result.progressPercent).toBe(100)
    expect(result.isFullyComplete).toBe(false)
  })
})
