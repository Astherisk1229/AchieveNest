/**
 * useHR.js
 * Custom React Hook bridging View components to live target HR endpoints.
 */

import { useState, useEffect, useCallback } from 'react'
import { provisioningService } from '../services/provisioningService'
import { fetchPasswordResetRequests, executePasswordReset } from '../services/passwordResetAdminService'
import { fetchHRAudit, fetchHRDashboard, fetchPersonnelDirectory, assignDeanRole, revokeDeanRole } from '../services/hrAdminService'
import { uniquePersonnel } from '../utils/personnelDirectoryFilters'

const ALL_RESOURCES = ['directory', 'dashboard', 'passwordResets', 'audit']

// The directory API is paged (max 100 per page). Filters and search run in the browser,
// so every page is loaded; otherwise personnel beyond the first page could never match.
const DIRECTORY_PAGE_SIZE = 100
const DIRECTORY_MAX_PAGES = 50
export async function fetchAllPersonnelDirectoryPages() {
  const first = await fetchPersonnelDirectory({ per_page: DIRECTORY_PAGE_SIZE, page: 1 })
  const firstData = first?.data || first || {}
  const personnel = Array.isArray(firstData.personnel) ? [...firstData.personnel] : []
  const total = Number(firstData.total) || personnel.length
  let page = 1
  while (personnel.length < total && page < DIRECTORY_MAX_PAGES) {
    page += 1
    const next = await fetchPersonnelDirectory({ per_page: DIRECTORY_PAGE_SIZE, page })
    const rows = (next?.data || next || {}).personnel
    if (!Array.isArray(rows) || rows.length === 0) break
    personnel.push(...rows)
  }
  return { data: { ...firstData, personnel } }
}

export function useHR({ resources = ALL_RESOURCES } = {}) {
  const resourceKey = [...resources].sort().join('|')
  const [activeTab, setActiveTab] = useState('overview')
  const [personnelList, setPersonnelList] = useState([])
  const [directorySummary, setDirectorySummary] = useState(null)
  const [auditLogs, setAuditLogs] = useState([])
  const [passwordResets, setPasswordResets] = useState([])
  const [dashboardMetrics, setDashboardMetrics] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('')
  const [collegeFilter, setCollegeFilter] = useState('ALL')

  // Modal State
  const [selectedPersonnel, setSelectedPersonnel] = useState(null)

  // Refresh All Data
  const refreshData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const enabled = new Set(resourceKey.split('|').filter(Boolean))
      const requests = []
      const names = []
      if (enabled.has('directory')) { names.push('directory'); requests.push(fetchAllPersonnelDirectoryPages()) }
      if (enabled.has('dashboard')) { names.push('dashboard'); requests.push(fetchHRDashboard()) }
      if (enabled.has('passwordResets')) { names.push('passwordResets'); requests.push(fetchPasswordResetRequests('all')) }
      if (enabled.has('audit')) { names.push('audit'); requests.push(fetchHRAudit({ per_page: 50 })) }

      const settled = await Promise.allSettled(requests)
      const results = Object.fromEntries(names.map((name, index) => [name, settled[index]]))
      const dirResult = results.directory
      const dashResult = results.dashboard
      const resetsResult = results.passwordResets
      const auditResult = results.audit

      if (dirResult?.status === 'fulfilled') {
        const directory = dirResult.value?.data || dirResult.value || {}
        const list = Array.isArray(directory.personnel) ? directory.personnel : []
        setDirectorySummary(directory.summary || null)
        setPersonnelList(uniquePersonnel(list).map(person => ({
          ...person,
          employee_id: person.institutional_id || person.employee_id,
          email: person.institutional_email || person.email,
          college: person.college_name || person.college_code || person.college || 'Pending placement',
          // Appointment as recorded by HR (permanent / probationary) or null; never the account status or a default.
          employment_status: person.employment_status || null,
          academic_rank: person.current_rank_title || person.academic_rank || person.designation || 'Personnel',
          assigned_roles: person.assigned_roles || []
        })))
      } else if (dirResult) {
        const dirErr = dirResult.reason
        const errMsg = dirErr?.error?.message || dirErr?.message || 'Unable to load Personnel Directory.'
        setError(errMsg)
      }

      if (dashResult?.status === 'fulfilled') {
        setDashboardMetrics(dashResult.value?.data || dashResult.value)
      }

      if (resetsResult?.status === 'fulfilled') {
        setPasswordResets(resetsResult.value?.data || resetsResult.value || [])
      }

      if (auditResult?.status === 'fulfilled') {
        const auditData = auditResult.value?.data || auditResult.value || {}
        setAuditLogs(auditData.events || auditData || [])
      }
    } catch (requestError) {
      setError(requestError?.error?.message || requestError?.message || 'Unable to load HR data.')
    } finally {
      setIsLoading(false)
    }
  }, [resourceKey])

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

  const handleApprovePasswordReset = async (requestId) => {
    const res = await executePasswordReset(requestId)
    await refreshData()
    return res
  }

  const filteredPersonnel = personnelList.filter(p => {
    const matchesSearch = (p.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.employee_id || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCollege = collegeFilter === 'ALL' || (p.college || '').includes(collegeFilter)
    return matchesSearch && matchesCollege
  })

  const stats = {
    totalPersonnel: dashboardMetrics?.total_personnel ?? personnelList.length,
    pendingResets: dashboardMetrics?.pending_password_resets ?? passwordResets.filter(r => r.status === 'pending').length,
    pendingQualifications: dashboardMetrics?.pending_qualification_reviews ?? 0,
    evaluationCounts: dashboardMetrics?.evaluations || {}
  }

  return {
    activeTab,
    setActiveTab,
    personnelList,
    directorySummary,
    filteredPersonnel,
    auditLogs,
    passwordResets,
    searchQuery,
    setSearchQuery,
    collegeFilter,
    setCollegeFilter,
    selectedPersonnel,
    setSelectedPersonnel,
    stats,
    dashboardMetrics,
    isLoading,
    error,
    handleCreatePersonnelAccount,
    handleAssignDean,
    handleRevokeDean,
    handleApprovePasswordReset,
    refreshData
  }
}

export default useHR
