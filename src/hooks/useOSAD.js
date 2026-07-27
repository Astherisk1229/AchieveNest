import { useState, useCallback } from 'react'
import OSADController from '../controllers/OSADController'

export default function useOSAD() {
  const [metrics, setMetrics] = useState(() => OSADController.getMetrics())
  const [awardCategories, setAwardCategories] = useState(() => OSADController.getAwardCategories())
  const [awardees, setAwardees] = useState(() => OSADController.getAwardees())
  const [accreditationReports, setAccreditationReports] = useState(() => OSADController.getAccreditationReports())
  const [auditLogs, setAuditLogs] = useState(() => OSADController.getAuditLogs())

  const refreshMetrics = useCallback(() => {
    setMetrics(OSADController.getMetrics())
  }, [])

  const refreshCategories = useCallback(() => {
    setAwardCategories(OSADController.getAwardCategories())
  }, [])

  const refreshAwardees = useCallback(() => {
    setAwardees(OSADController.getAwardees())
  }, [])

  const refreshAuditLogs = useCallback((term = '', cat = 'all') => {
    setAuditLogs(OSADController.getAuditLogs(term, cat))
  }, [])

  const getUsers = useCallback((roleFilter, searchTerm) => {
    return OSADController.getUsers(roleFilter, searchTerm)
  }, [])

  const assignProgramCoordinator = useCallback((userId, programName) => {
    const updated = OSADController.assignProgramCoordinator(userId, programName)
    refreshMetrics()
    refreshAuditLogs()
    return updated
  }, [refreshMetrics, refreshAuditLogs])

  const assignOrganizationModerator = useCallback((userId, orgName) => {
    const updated = OSADController.assignOrganizationModerator(userId, orgName)
    refreshMetrics()
    refreshAuditLogs()
    return updated
  }, [refreshMetrics, refreshAuditLogs])

  const revokeRole = useCallback((userId, roleId) => {
    const updated = OSADController.revokeRole(userId, roleId)
    refreshMetrics()
    refreshAuditLogs()
    return updated
  }, [refreshMetrics, refreshAuditLogs])

  const createAwardCategory = useCallback((categoryData) => {
    const created = OSADController.createAwardCategory(categoryData)
    refreshCategories()
    refreshMetrics()
    refreshAuditLogs()
    return created
  }, [refreshCategories, refreshMetrics, refreshAuditLogs])

  const updateAwardCategory = useCallback((id, updatedData) => {
    const updated = OSADController.updateAwardCategory(id, updatedData)
    refreshCategories()
    refreshAuditLogs()
    return updated
  }, [refreshCategories, refreshAuditLogs])

  const generateAwardCandidates = useCallback((categoryId) => {
    return OSADController.generateAwardCandidates(categoryId)
  }, [])

  const confirmAwardee = useCallback((candidateData) => {
    const confirmed = OSADController.confirmAwardee(candidateData)
    refreshAwardees()
    refreshCategories()
    refreshAuditLogs()
    return confirmed
  }, [refreshAwardees, refreshCategories, refreshAuditLogs])

  const getStudentLeaderboards = useCallback((collegeFilter = 'all') => {
    return OSADController.getStudentLeaderboards(collegeFilter)
  }, [])

  return {
    metrics,
    awardCategories,
    awardees,
    accreditationReports,
    auditLogs,
    getUsers,
    getStudentLeaderboards,
    assignProgramCoordinator,
    assignOrganizationModerator,
    revokeRole,
    createAwardCategory,
    updateAwardCategory,
    generateAwardCandidates,
    confirmAwardee,
    refreshAuditLogs
  }
}
