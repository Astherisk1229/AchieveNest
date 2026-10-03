import { useState, useCallback } from 'react'
import OSADController from '../controllers/OSADController'

export default function useOSAD() {
  const [metrics, setMetrics] = useState(() => OSADController.getMetrics())
  const [organizations, setOrganizations] = useState(() => OSADController.getOrganizations())
  const [clubs, setClubs] = useState(() => OSADController.getClubs())
  const [awardCategories, setAwardCategories] = useState(() => OSADController.getAwardCategories())
  const [awardees, setAwardees] = useState(() => OSADController.getAwardees())
  const [accreditationReports, setAccreditationReports] = useState(() => OSADController.getAccreditationReports())
  const [auditLogs, setAuditLogs] = useState(() => OSADController.getAuditLogs())

  const refreshMetrics = useCallback(() => {
    setMetrics(OSADController.getMetrics())
  }, [])

  const refreshOrganizations = useCallback(() => {
    setOrganizations(OSADController.getOrganizations())
  }, [])

  const refreshClubs = useCallback(() => {
    setClubs(OSADController.getClubs())
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

  const getUsers = useCallback((roleFilter, searchTerm, collegeFilter, sortBy) => {
    return OSADController.getUsers(roleFilter, searchTerm, collegeFilter, sortBy)
  }, [])

  const getPersonnelList = useCallback((searchQuery) => {
    return OSADController.getPersonnelList(searchQuery)
  }, [])

  const getStudentPortfolios = useCallback((searchQuery, collegeFilter) => {
    return OSADController.getStudentPortfolios(searchQuery, collegeFilter)
  }, [])

  const createOrganization = useCallback((orgData) => {
    const created = OSADController.createOrganization(orgData)
    refreshOrganizations()
    refreshAuditLogs()
    return created
  }, [refreshOrganizations, refreshAuditLogs])

  const createClub = useCallback((clubData) => {
    const created = OSADController.createClub(clubData)
    refreshClubs()
    refreshAuditLogs()
    return created
  }, [refreshClubs, refreshAuditLogs])

  const assignProgramCoordinator = useCallback((userId, orgName) => {
    const updated = OSADController.assignProgramCoordinator(userId, orgName)
    refreshMetrics()
    refreshOrganizations()
    refreshAuditLogs()
    return updated
  }, [refreshMetrics, refreshOrganizations, refreshAuditLogs])

  const assignOrganizationModerator = useCallback((userId, clubName) => {
    const updated = OSADController.assignOrganizationModerator(userId, clubName)
    refreshMetrics()
    refreshClubs()
    refreshAuditLogs()
    return updated
  }, [refreshMetrics, refreshClubs, refreshAuditLogs])

  const revokeRole = useCallback((userId, roleId) => {
    const updated = OSADController.revokeRole(userId, roleId)
    refreshMetrics()
    refreshOrganizations()
    refreshClubs()
    refreshAuditLogs()
    return updated
  }, [refreshMetrics, refreshOrganizations, refreshClubs, refreshAuditLogs])

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

  const batchConfirmAwardees = useCallback((candidateIds) => {
    const results = OSADController.batchConfirmAwardees(candidateIds)
    refreshAwardees()
    refreshCategories()
    refreshAuditLogs()
    return results
  }, [refreshAwardees, refreshCategories, refreshAuditLogs])

  const undoAwardeeConfirmation = useCallback((candidateId, reason) => {
    const undone = OSADController.undoAwardeeConfirmation(candidateId, reason)
    refreshAwardees()
    refreshCategories()
    refreshAuditLogs()
    return undone
  }, [refreshAwardees, refreshCategories, refreshAuditLogs])

  const getStudentLeaderboards = useCallback((categoryFilter = 'all', searchTerm = '') => {
    return OSADController.getStudentLeaderboards(categoryFilter, searchTerm)
  }, [])

  const getAccreditationReportDetails = useCallback((reportId) => {
    return OSADController.getAccreditationReportDetails(reportId)
  }, [])

  const resetStudentPassword = useCallback((studentId, newPassword) => {
    const result = OSADController.resetStudentPassword(studentId, newPassword)
    refreshAuditLogs()
    return result
  }, [refreshAuditLogs])

  const getPasswordResetRequests = useCallback(() => {
    return OSADController.getPasswordResetRequests()
  }, [])

  const approvePasswordResetRequest = useCallback((requestId, tempPassword) => {
    const approved = OSADController.approvePasswordResetRequest(requestId, tempPassword)
    refreshAuditLogs()
    return approved
  }, [refreshAuditLogs])

  const [colleges, setColleges] = useState(() => OSADController.getColleges())
  const [degreePrograms, setDegreePrograms] = useState(() => OSADController.getDegreePrograms())

  const refreshColleges = useCallback(() => {
    setColleges(OSADController.getColleges())
  }, [])

  const refreshDegreePrograms = useCallback(() => {
    setDegreePrograms(OSADController.getDegreePrograms())
  }, [])

  const createCollege = useCallback((payload) => {
    const created = OSADController.createCollege(payload)
    refreshColleges()
    refreshAuditLogs()
    return created
  }, [refreshColleges, refreshAuditLogs])

  const createDegreeProgram = useCallback((payload) => {
    const created = OSADController.createDegreeProgram(payload)
    refreshDegreePrograms()
    refreshAuditLogs()
    return created
  }, [refreshDegreePrograms, refreshAuditLogs])

  const createStudentOrganizationWithScope = useCallback((payload) => {
    const created = OSADController.createStudentOrganizationWithScope(payload)
    refreshOrganizations()
    refreshAuditLogs()
    return created
  }, [refreshOrganizations, refreshAuditLogs])

  return {
    metrics,
    colleges,
    degreePrograms,
    organizations,
    clubs,
    awardCategories,
    awardees,
    accreditationReports,
    auditLogs,
    getUsers,
    getPersonnelList,
    getStudentPortfolios,
    createCollege,
    createDegreeProgram,
    createOrganization,
    createStudentOrganizationWithScope,
    createClub,
    getStudentLeaderboards,
    getAccreditationReportDetails,
    assignProgramCoordinator,
    assignOrganizationModerator,
    assignOrganizationModeratorToOrg: useCallback((orgId, persId, persName) => {
      const res = OSADController.assignOrganizationModeratorToOrg(orgId, persId, persName)
      refreshOrganizations()
      refreshAuditLogs()
      return res
    }, [refreshOrganizations, refreshAuditLogs]),
    revokeRole,
    createAwardCategory,
    updateAwardCategory,
    generateAwardCandidates,
    confirmAwardee,
    batchConfirmAwardees,
    undoAwardeeConfirmation,
    resetStudentPassword,
    getPasswordResetRequests,
    approvePasswordResetRequest,
    refreshAuditLogs
  }
}
