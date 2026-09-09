/**
 * AdminSetupGuideController.js
 * Controller deriving role-specific setup guide step statuses from live domain data.
 * Does NOT mutate domain data or store fake completion.
 */

import { ADMIN_SETUP_GUIDES, getAdminSetupGuide } from '../models/AdminSetupGuideRegistry'
import { SETUP_STEP_STATUS, AdminSetupStatusModel } from '../models/AdminSetupStatusModel'
import OSADController from './OSADController'
import HRController from './HRController'

export class AdminSetupGuideController {
  static evaluateGuide(userOrRole) {
    const guideDef = getAdminSetupGuide(userOrRole)
    if (!guideDef) return null

    // Read current domain state
    const osadPrograms = OSADController.getDegreePrograms()
    const osadCoordinatorAssignments = OSADController.getProgramCoordinatorAssignments()
    const osadOrgs = OSADController.getOrganizations()
    const osadClubs = OSADController.getClubs()
    const osadUsers = OSADController.getUsers('student', '', 'all', 'name')
    const hrPersonnel = HRController.getPersonnelList()

    const evaluatedSteps = guideDef.steps.map(step => {
      let status = SETUP_STEP_STATUS.NOT_STARTED
      let explanation = ''
      let blockingReason = null
      let completedCount = 0
      let requiredCount = 0

      if (step.evaluatorKey === 'evalOSADAcademicStructure') {
        const programCount = osadPrograms.length
        if (programCount >= 3) {
          status = SETUP_STEP_STATUS.COMPLETE
          explanation = `${programCount} Academic Programs configured under Colleges.`
        } else if (programCount > 0) {
          status = SETUP_STEP_STATUS.IN_PROGRESS
          explanation = `${programCount} Academic Programs configured.`
        } else {
          status = SETUP_STEP_STATUS.NOT_STARTED
          explanation = 'No Academic Programs configured yet.'
        }
        completedCount = programCount
        requiredCount = 3
      }

      else if (step.evaluatorKey === 'evalOSADStudentPlacement') {
        if (osadPrograms.length === 0) {
          status = SETUP_STEP_STATUS.BLOCKED
          explanation = 'Prerequisite missing.'
          blockingReason = 'Create Academic Structure before assigning Student accounts.'
        } else if (osadUsers.length > 0) {
          status = SETUP_STEP_STATUS.COMPLETE
          explanation = `${osadUsers.length} Students enrolled with program placement.`
        } else {
          status = SETUP_STEP_STATUS.NOT_STARTED
          explanation = 'No Student accounts imported or placed.'
        }
        completedCount = osadUsers.length
        requiredCount = 100
      }

      else if (step.evaluatorKey === 'evalOSADProgramCoordinators') {
        completedCount = osadCoordinatorAssignments.filter(assignment => assignment.status === 'active').length
        requiredCount = osadPrograms.length

        if (osadPrograms.length === 0) {
          status = SETUP_STEP_STATUS.BLOCKED
          explanation = 'Prerequisite missing.'
          blockingReason = 'Create Academic Programs before assigning Coordinators.'
        } else if (completedCount >= requiredCount && requiredCount > 0) {
          status = SETUP_STEP_STATUS.COMPLETE
          explanation = `${completedCount} of ${requiredCount} Academic Programs assigned.`
        } else if (completedCount > 0) {
          status = SETUP_STEP_STATUS.IN_PROGRESS
          explanation = `${completedCount} of ${requiredCount} Academic Programs assigned.`
        } else {
          status = SETUP_STEP_STATUS.NOT_STARTED
          explanation = 'No Program Coordinators assigned.'
        }
      }

      else if (step.evaluatorKey === 'evalOSADOrganizations') {
        const totalOrgs = osadOrgs.length + osadClubs.length
        const orgsWithMod = osadClubs.filter(c => Boolean(c.moderator_name || c.moderator_id)).length
        completedCount = orgsWithMod
        requiredCount = totalOrgs

        if (totalOrgs === 0) {
          status = SETUP_STEP_STATUS.NOT_STARTED
          explanation = 'No Student Organizations or Clubs created.'
        } else if (completedCount >= requiredCount && requiredCount > 0) {
          status = SETUP_STEP_STATUS.COMPLETE
          explanation = `${completedCount} of ${requiredCount} Organizations assigned.`
        } else {
          status = SETUP_STEP_STATUS.IN_PROGRESS
          explanation = `${completedCount} of ${requiredCount} Organizations assigned.`
        }
      }

      else if (step.evaluatorKey === 'evalHRPersonnelAccounts') {
        const personnelCount = hrPersonnel.length
        completedCount = personnelCount
        requiredCount = 10

        if (personnelCount >= 3) {
          status = SETUP_STEP_STATUS.COMPLETE
          explanation = `${personnelCount} Personnel accounts onboarded.`
        } else if (personnelCount > 0) {
          status = SETUP_STEP_STATUS.IN_PROGRESS
          explanation = `${personnelCount} Personnel accounts onboarded.`
        } else {
          status = SETUP_STEP_STATUS.NOT_STARTED
          explanation = 'No Personnel accounts onboarded.'
        }
      }

      else if (step.evaluatorKey === 'evalHRCollegePlacement') {
        if (osadPrograms.length === 0) {
          status = SETUP_STEP_STATUS.BLOCKED
          explanation = 'Waiting on OSAD.'
          blockingReason = 'OSAD must create Academic Colleges before HR placement.'
        } else {
          status = SETUP_STEP_STATUS.COMPLETE
          explanation = 'Personnel assigned to Academic Colleges.'
          completedCount = hrPersonnel.length
          requiredCount = hrPersonnel.length
        }
      }

      else if (step.evaluatorKey === 'evalHRCollegeDeans') {
        const personnelWithDeanRole = hrPersonnel.filter(person => person.dean_assignment_id)
        completedCount = personnelWithDeanRole.length
        requiredCount = Math.max(1, new Set(hrPersonnel.map(person => person.college_id).filter(Boolean)).size)

        if (osadPrograms.length === 0) {
          status = SETUP_STEP_STATUS.BLOCKED
          explanation = 'Waiting on OSAD.'
          blockingReason = 'OSAD must create Academic Colleges first.'
        } else if (completedCount >= requiredCount && requiredCount > 0) {
          status = SETUP_STEP_STATUS.COMPLETE
          explanation = `${completedCount} of ${requiredCount} Deans designated.`
        } else if (completedCount > 0) {
          status = SETUP_STEP_STATUS.IN_PROGRESS
          explanation = `${completedCount} of ${requiredCount} Deans designated.`
        } else {
          status = SETUP_STEP_STATUS.NOT_STARTED
          explanation = 'No College Deans designated.'
        }
      }

      else if (step.evaluatorKey === 'evalHRQualificationReviews') {
        const reviewed = hrPersonnel.filter(person => person.qualification_review_status === 'cleared').length
        completedCount = reviewed
        requiredCount = hrPersonnel.length
        status = reviewed > 0 ? SETUP_STEP_STATUS.IN_PROGRESS : SETUP_STEP_STATUS.NOT_STARTED
        explanation = reviewed > 0 ? `${reviewed} Personnel qualification reviews cleared.` : 'No qualification reviews completed yet.'
      }

      return {
        ...step,
        status,
        explanation,
        blockingReason,
        completedCount,
        requiredCount
      }
    })

    const progressMetrics = AdminSetupStatusModel.computeProgress(evaluatedSteps)

    return {
      guideId: guideDef.id,
      title: guideDef.title,
      description: guideDef.description,
      ownerRole: guideDef.ownerRole,
      steps: evaluatedSteps,
      metrics: progressMetrics
    }
  }
}

export default AdminSetupGuideController
