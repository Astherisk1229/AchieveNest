/**
 * OSADDashboardMetricsModel.js
 * Model computing derived operational setup coverage and active governance counters.
 */

export class OSADDashboardMetricsModel {
  static computeMetrics({
    colleges = [],
    academicPrograms = [],
    programs = [],
    students = [],
    organizations = [],
    coordinators = []
  } = {}) {
    const collegesCount = Array.isArray(colleges) ? colleges.length : 0
    const resolvedPrograms = Array.isArray(academicPrograms) && academicPrograms.length > 0
      ? academicPrograms
      : (Array.isArray(programs) ? programs : [])
    const programsCount = resolvedPrograms.length
    const activeStudentsCount = Array.isArray(students) ? students.length : 0
    const activeOrganizationsCount = Array.isArray(organizations) ? organizations.length : 0

    // Program Coordinators Assigned
    const programsWithCoordinatorCount = Array.isArray(coordinators) && coordinators.length > 0
      ? coordinators.filter(c => c.status === 'active').length
      : resolvedPrograms.filter(p => Boolean(p.assigned_coordinator_id || p.coordinator_name || p.coordinator_id)).length

    // Organization Moderators Assigned
    const organizationsWithModeratorCount = Array.isArray(organizations)
      ? organizations.filter(o => Boolean(o.assigned_moderator_id || o.moderator_name || o.moderator)).length
      : 0

    // Required Assignments: 1 Coordinator per Academic Program + 1 Moderator per Organization
    const totalRequiredAssignments = programsCount + activeOrganizationsCount
    const configuredAssignments = programsWithCoordinatorCount + organizationsWithModeratorCount

    const pendingAssignmentsCount = Math.max(0, totalRequiredAssignments - configuredAssignments)

    // Operational Setup Coverage Percentage
    const setupCoveragePercent = totalRequiredAssignments > 0
      ? Math.round((configuredAssignments / totalRequiredAssignments) * 100)
      : 100

    return {
      collegesCount,
      programsCount,
      activeStudentsCount,
      activeOrganizationsCount,
      programsWithCoordinatorCount,
      organizationsWithModeratorCount,
      totalRequiredAssignments,
      configuredAssignments,
      pendingAssignmentsCount,
      setupCoveragePercent
    }
  }
}

export default OSADDashboardMetricsModel
