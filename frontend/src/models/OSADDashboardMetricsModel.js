/**
 * OSADDashboardMetricsModel.js
 * Model computing derived operational setup coverage and active governance counters.
 */

export class OSADDashboardMetricsModel {
  static computeMetrics({
    colleges = [],
    departments = [],
    programs = [],
    students = [],
    organizations = []
  } = {}) {
    const collegesCount = Array.isArray(colleges) ? colleges.length : 0
    const departmentsCount = Array.isArray(departments) ? departments.length : 0
    const programsCount = Array.isArray(programs) ? programs.length : 0
    const activeStudentsCount = Array.isArray(students) ? students.length : 0
    const activeOrganizationsCount = Array.isArray(organizations) ? organizations.length : 0

    // Department Coordinators Assigned
    const departmentsWithCoordinatorCount = Array.isArray(departments)
      ? departments.filter(d => Boolean(d.assigned_coordinator_id || d.assigned_coordinator || d.coordinator_name)).length
      : 0

    // Organization Moderators Assigned
    const organizationsWithModeratorCount = Array.isArray(organizations)
      ? organizations.filter(o => Boolean(o.assigned_moderator_id || o.moderator_name || o.moderator)).length
      : 0

    // Required Assignments: 1 Coordinator per Department + 1 Moderator per Organization
    const totalRequiredAssignments = departmentsCount + activeOrganizationsCount
    const configuredAssignments = departmentsWithCoordinatorCount + organizationsWithModeratorCount

    const pendingAssignmentsCount = Math.max(0, totalRequiredAssignments - configuredAssignments)

    // Operational Setup Coverage Percentage
    const setupCoveragePercent = totalRequiredAssignments > 0
      ? Math.round((configuredAssignments / totalRequiredAssignments) * 100)
      : 100

    return {
      collegesCount,
      departmentsCount,
      programsCount,
      activeStudentsCount,
      activeOrganizationsCount,
      departmentsWithCoordinatorCount,
      organizationsWithModeratorCount,
      totalRequiredAssignments,
      configuredAssignments,
      pendingAssignmentsCount,
      setupCoveragePercent
    }
  }
}

export default OSADDashboardMetricsModel
