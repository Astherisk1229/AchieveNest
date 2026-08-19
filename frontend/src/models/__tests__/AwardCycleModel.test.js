import { describe, it, expect } from 'vitest'
import { AwardCycleModel, AWARD_CYCLE_STATUS } from '../AwardCycleModel'

describe('AwardCycleModel', () => {
  it('correctly reports confirmation eligibility based on cycle status', () => {
    expect(AwardCycleModel.canConfirm(AWARD_CYCLE_STATUS.READY_FOR_REVIEW)).toBe(true)
    expect(AwardCycleModel.canConfirm(AWARD_CYCLE_STATUS.CONFIRMED)).toBe(true)
    expect(AwardCycleModel.canConfirm(AWARD_CYCLE_STATUS.DRAFT)).toBe(false)
    expect(AwardCycleModel.canConfirm(AWARD_CYCLE_STATUS.PUBLISHED)).toBe(false)
  })

  it('correctly reports publication and revocation permissions', () => {
    expect(AwardCycleModel.canPublish(AWARD_CYCLE_STATUS.READY_FOR_REVIEW)).toBe(true)
    expect(AwardCycleModel.canRevoke(AWARD_CYCLE_STATUS.PUBLISHED)).toBe(true)
    expect(AwardCycleModel.canRevoke(AWARD_CYCLE_STATUS.READY_FOR_REVIEW)).toBe(false)
  })

  it('formats status labels cleanly', () => {
    expect(AwardCycleModel.formatStatusLabel(AWARD_CYCLE_STATUS.READY_FOR_REVIEW)).toBe('Ready for OSAD Review')
    expect(AwardCycleModel.formatStatusLabel(AWARD_CYCLE_STATUS.PUBLISHED)).toBe('Official Published')
  })
})
