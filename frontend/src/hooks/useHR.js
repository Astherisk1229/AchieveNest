/**
 * useHR.js
 * Custom React Hook bridging View components to live target HR endpoints.
 */

import { useState, useEffect, useCallback } from 'react'
import HRController from '../controllers/HRController'
import { provisioningService } from '../services/provisioningService'
import { fetchPasswordResetRequests, executePasswordReset } from '../services/passwordResetAdminService'
import { fetchHRAudit, fetchHRDashboard, fetchPersonnelDirectory, assignDeanRole, revokeDeanRole } from '../services/hrAdminService'

export function useHR() {
  const [activeTab, setActiveTab] = useState('overview')
  const [personnelList, setPersonnelList] = useState([])
  const [accomplishments, setAccomplishments] = useState([])
  const [serviceAwards, setServiceAwards] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [passwordResets, setPasswordResets] = useState([])
  const [dashboardMetrics, setDashboardMetrics] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('')
  const [collegeFilter, setCollegeFilter] = useState('ALL')
  const [selectedAwardId, setSelectedAwardId] = useState('')
  const [rankedCandidates, setRankedCandidates] = useState([])

  // Modal State
  const [selectedPersonnel, setSelectedPersonnel] = useState(null)
  const [selectedAccomplishment, setSelectedAccomplishment] = useState(null)
  const [isRankModalOpen, setIsRankModalOpen] = useState(false)
  const [isProofModalOpen, setIsProofModalOpen] = useState(false)

  // Refresh All Data
  const refreshData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const accList = HRController.getAccomplishments()
    const awdList = HRController.getServiceAwards()
    setAccomplishments(accList)
    setServiceAwards(awdList)

    if (awdList.length > 0 && !selectedAwardId) {
      setSelectedAwardId(awdList[0].id)
    }

    try {
      const [directory, dashboard, resets, audit] = await Promise.all([
        fetchPersonnelDirectory({ per_page: 100 }),
        fetchHRDashboard(),
        fetchPasswordResetRequests('all'),
        fetchHRAudit({ per_page: 50 })
      ])

      setPersonnelList((directory.personnel || []).map(person => ({
        ...person,
        employee_id: person.institutional_id,
        email: person.institutional_email,
        college: person.college_name || person.college_code || 'Pending placement',
        employment_status: person.status,
        academic_rank: person.designation || 'Personnel',
        assigned_roles: person.assigned_roles || []
      })))
      setDashboardMetrics(dashboard)
      setPasswordResets(resets)
      setAuditLogs(audit.events || [])
    } catch (requestError) {
      setError(requestError?.error?.message || requestError?.message || 'Unable to load HR data.')
      setPersonnelList([])
      setPasswordResets([])
      setAuditLogs([])
    } finally {
      setIsLoading(false)
    }
  }, [selectedAwardId])

  useEffect(() => {
    void refreshData()
    const handleResetEvent = () => refreshData()
    window.addEventListener('achievenest_reset_request_submitted', handleResetEvent)
    window.addEventListener('storage', handleResetEvent)
    return () => {
      window.removeEventListener('achievenest_reset_request_submitted', handleResetEvent)
      window.removeEventListener('storage', handleResetEvent)
    }
  }, [refreshData])

  // Recalculate candidates when award changes or personnel list refreshes
  useEffect(() => {
    if (selectedAwardId) {
      const candidates = HRController.identifyAwardCandidates(selectedAwardId)
      setRankedCandidates(candidates)
    }
  }, [selectedAwardId, personnelList])

  // --- Business Actions ---
  const handleCreatePersonnelAccount = async (accountData) => {
    const createdRecord = await provisioningService.provisionManualPersonnel(accountData)
    await refreshData()
    return createdRecord
  }

  const handleAssignDean = async (personnelId, collegeId) => {
    const res = await assignDeanRole(personnelId, collegeId)
    await refreshData()
    return res
  }

  const handleRevokeDean = async (personnelId, assignmentId) => {
    const res = await revokeDeanRole(personnelId, assignmentId)
    await refreshData()
    return res
  }

  const handleUpdateRank = (personnelId, newRank, newStatus) => {
    HRController.updatePersonnelRank(personnelId, newRank, newStatus)
    refreshData()
    setIsRankModalOpen(false)
  }

  const handleAssignRole = (personnelId, roleKey) => {
    HRController.assignPersonnelRole(personnelId, roleKey)
    refreshData()
  }

  const handleRevokeRole = (personnelId, roleKey) => {
    HRController.revokePersonnelRole(personnelId, roleKey)
    refreshData()
  }

  const handleStartReview = (accomplishmentId, hrReviewerId = 'HR-2010-001') => {
    const result = HRController.startReview(accomplishmentId, hrReviewerId)
    refreshData()
    return result
  }

  const handleMarkReadyForFinalization = (accomplishmentId) => {
    const res = HRController.markReadyForFinalization(accomplishmentId)
    refreshData()
    return res
  }

  const handleSealVerification = (accomplishmentId, sealCode) => {
    HRController.sealVerification(accomplishmentId, sealCode)
    refreshData()
    setIsProofModalOpen(false)
  }

  const handleReturnAccomplishment = (accomplishmentId, remarks) => {
    HRController.returnAccomplishment(accomplishmentId, remarks)
    refreshData()
    setIsProofModalOpen(false)
  }

  const handleApprovePasswordReset = async (requestId) => {
    const res = await executePasswordReset(requestId)
    await refreshData()
    return res
  }

  // --- Filtered Computed Lists ---
  const filteredPersonnel = personnelList.filter(p => {
    const matchesSearch = (p.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.employee_id || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCollege = collegeFilter === 'ALL' || (p.college || '').includes(collegeFilter)
    return matchesSearch && matchesCollege
  })

  const pendingEndorsements = accomplishments.filter(a => a.status === 'dept_endorsed' || a.status === 'FORWARDED_TO_HR')
  const activeReview = accomplishments.find(a => a.status === 'in_hr_review' || a.status === 'UNDER_HR_REVIEW') || null
  const readyForFinalizationQueue = accomplishments.filter(a => a.status === 'ready_for_finalization' || a.status === 'READY_FOR_FINALIZATION')

  const directHRQueue = accomplishments.filter(a => {
    const submitter = personnelList.find(p => p.employee_id === a.faculty_id || p.full_name === a.faculty_name)
    const isOfficialOrSec = submitter && (
      (submitter.assigned_roles || []).includes('dean') ||
      (submitter.assigned_roles || []).includes('program_coordinator') ||
      submitter.academic_rank.includes('Professor') ||
      submitter.academic_rank.includes('Dean')
    )
    return isOfficialOrSec && (a.status === 'dept_endorsed' || a.status === 'FORWARDED_TO_HR')
  })

  const endorsedQueue = accomplishments.filter(a => {
    return (a.status === 'dept_endorsed' || a.status === 'FORWARDED_TO_HR') && !directHRQueue.some(d => d.id === a.id)
  })

  // Stats computation
  const stats = {
    totalPersonnel: dashboardMetrics?.total_personnel ?? personnelList.length,
    verifiedAccomplishments: accomplishments.filter(a => a.status === 'hr_verified' || a.status === 'COMPLETED').length,
    pendingEndorsements: pendingEndorsements.length,
    inReviewCount: activeReview ? 1 : 0,
    activeReview: activeReview,
    readyForFinalizationCount: readyForFinalizationQueue.length,
    directHRCount: directHRQueue.length,
    pendingResets: dashboardMetrics?.pending_password_resets ?? passwordResets.filter(r => r.status === 'pending').length,
    pendingQualifications: dashboardMetrics?.pending_qualification_reviews ?? 0,
    evaluationCounts: dashboardMetrics?.evaluations || {},
    accreditationScore: '98.4%'
  }

  return {
    activeTab,
    setActiveTab,
    personnelList,
    filteredPersonnel,
    accomplishments,
    pendingEndorsements,
    activeReview,
    readyForFinalizationQueue,
    directHRQueue,
    endorsedQueue,
    serviceAwards,
    auditLogs,
    passwordResets,
    searchQuery,
    setSearchQuery,
    collegeFilter,
    setCollegeFilter,
    selectedAwardId,
    setSelectedAwardId,
    rankedCandidates,
    selectedPersonnel,
    setSelectedPersonnel,
    selectedAccomplishment,
    setSelectedAccomplishment,
    isRankModalOpen,
    setIsRankModalOpen,
    isProofModalOpen,
    setIsProofModalOpen,
    stats,
    dashboardMetrics,
    isLoading,
    error,
    handleCreatePersonnelAccount,
    handleAssignDean,
    handleRevokeDean,
    handleUpdateRank,
    handleAssignRole,
    handleRevokeRole,
    handleStartReview,
    handleMarkReadyForFinalization,
    handleSealVerification,
    handleReturnAccomplishment,
    handleApprovePasswordReset,
    refreshData
  }
}

export default useHR
