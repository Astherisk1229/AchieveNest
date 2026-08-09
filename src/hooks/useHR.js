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

  const pendingEndorsements = accomplishments.filter(a => a.status === 'dept_endorsed')

  // Stats computation
  const stats = {
    totalPersonnel: personnelList.length,
    verifiedAccomplishments: accomplishments.filter(a => a.status === 'hr_verified').length,
    pendingEndorsements: pendingEndorsements.length,
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
    handleUpdateRank,
    handleAssignRole,
    handleRevokeRole,
    handleSealVerification,
    handleReturnAccomplishment,
    handleApprovePasswordReset,
    refreshData
  }
}
