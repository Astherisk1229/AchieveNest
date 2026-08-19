/**
 * AdminSetupStatusModel.js
 * Model representing step statuses, coverage metrics, and progress percentages.
 */

export const SETUP_STEP_STATUS = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  BLOCKED: 'BLOCKED',
  COMPLETE: 'COMPLETE',
  NOT_APPLICABLE: 'NOT_APPLICABLE'
}

export class AdminSetupStatusModel {
  static computeProgress(evaluatedSteps = []) {
    const applicableSteps = evaluatedSteps.filter(s => s.status !== SETUP_STEP_STATUS.NOT_APPLICABLE)
    const totalApplicable = applicableSteps.length

    const completedSteps = applicableSteps.filter(s => s.status === SETUP_STEP_STATUS.COMPLETE)
    const completedCount = completedSteps.length

    const hasBlocked = applicableSteps.some(s => s.status === SETUP_STEP_STATUS.BLOCKED)
    const hasInProgress = applicableSteps.some(s => s.status === SETUP_STEP_STATUS.IN_PROGRESS)

    const progressPercent = totalApplicable > 0 ? Math.round((completedCount / totalApplicable) * 100) : 100

    return {
      totalApplicable,
      completedCount,
      progressPercent,
      isFullyComplete: completedCount === totalApplicable && totalApplicable > 0,
      hasBlocked,
      hasInProgress
    }
  }
}

export default AdminSetupStatusModel
