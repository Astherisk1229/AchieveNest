/**
 * useHR.js
 * Custom React Hook bridging View components to HRController & HRModel entities.
 */

import { useState, useEffect, useCallback } from 'react'
import HRController from '../controllers/HRController'

export function useHR() {
  const [activeTab, setActiveTab] = useState('overview')
  const [personnelList, setPersonnelList] = useState([])
  const [accomplishments, setAccomplishments] = useState([])
  const [serviceAwards, setServiceAwards] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [passwordResets, setPasswordResets] = useState([])

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
  const refreshData = useCallback(() => {
    const pList = HRController.getPersonnelList()
    const accList = HRController.getAccomplishments()
    const awdList = HRController.getServiceAwards()
    const logs = HRController.getAuditLogs()
    const resets = HRController.getPersonnelPasswordResetRequests()

    setPersonnelList(pList)
    setAccomplishments(accList)
    setServiceAwards(awdList)
    setAuditLogs(logs)
    setPasswordResets(resets)

    if (awdList.length > 0 && !selectedAwardId) {
      setSelectedAwardId(awdList[0].id)
    }
  }, [selectedAwardId])

  useEffect(() => {
    refreshData()
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
  const handleCreatePersonnelAccount = (accountData) => {
    HRController.createPersonnelAccount(accountData)
    refreshData()
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

  const handleAssignDepartmentSecretary = (personnelId, departmentName) => {
    HRController.assignDepartmentSecretary(personnelId, departmentName)
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

  const handleApprovePasswordReset = (requestId, tempPassword = 'NDMU-Faculty2026!', hrOfficerName = 'Director Evelyn Tan') => {
    const res = HRController.approvePersonnelPasswordReset(requestId, tempPassword, hrOfficerName)
    refreshData()
    return res
  }

  // --- Filtered Computed Lists ---
  const filteredPersonnel = personnelList.filter(p => {
    const matchesSearch = p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.department.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCollege = collegeFilter === 'ALL' || p.college.includes(collegeFilter)
    return matchesSearch && matchesCollege
  })

  const pendingEndorsements = accomplishments.filter(a => a.status === 'dept_endorsed' || a.status === 'FORWARDED_TO_HR')
  const activeReview = accomplishments.find(a => a.status === 'in_hr_review' || a.status === 'UNDER_HR_REVIEW') || null
  const readyForFinalizationQueue = accomplishments.filter(a => a.status === 'ready_for_finalization' || a.status === 'READY_FOR_FINALIZATION')

  // Anti-Bias Verification Queues:
  // Direct HR Verification: Accomplishments submitted by Department Secretaries & Institutional Officials
  const directHRQueue = accomplishments.filter(a => {
    const submitter = personnelList.find(p => p.employee_id === a.faculty_id || p.full_name === a.faculty_name)
    const isOfficialOrSec = submitter && (
      (submitter.assigned_roles || []).includes('department_secretary') ||
      (submitter.assigned_roles || []).includes('program_coordinator') ||
      submitter.academic_rank.includes('Professor') ||
      submitter.academic_rank.includes('Dean')
    )
    return isOfficialOrSec && (a.status === 'dept_endorsed' || a.status === 'FORWARDED_TO_HR')
  })

  // Endorsed Queue: Accomplishments from regular personnel endorsed by Department Secretaries
  const endorsedQueue = accomplishments.filter(a => {
    return (a.status === 'dept_endorsed' || a.status === 'FORWARDED_TO_HR') && !directHRQueue.some(d => d.id === a.id)
  })

  // Stats computation
  const stats = {
    totalPersonnel: personnelList.length,
    verifiedAccomplishments: accomplishments.filter(a => a.status === 'hr_verified' || a.status === 'COMPLETED').length,
    pendingEndorsements: pendingEndorsements.length,
    inReviewCount: activeReview ? 1 : 0,
    activeReview: activeReview,
    readyForFinalizationCount: readyForFinalizationQueue.length,
    directHRCount: directHRQueue.length,
    pendingResets: passwordResets.filter(r => r.status === 'pending').length,
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
    handleCreatePersonnelAccount,
    handleUpdateRank,
    handleAssignRole,
    handleAssignDepartmentSecretary,
    handleRevokeRole,
    handleStartReview,
    handleMarkReadyForFinalization,
    handleSealVerification,
    handleReturnAccomplishment,
    handleApprovePasswordReset,
    refreshData
  }
}
