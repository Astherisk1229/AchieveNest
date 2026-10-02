import React, { useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import {
  Trophy,
  Users,
  Award,
  ShieldCheck,
  Plus,
  Building2,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  X,
  Check
} from 'lucide-react'

import useOSAD from '../../hooks/useOSAD'
import { Button } from '../../components/ui/button'
import PersonnelSelectorModal from './modals/PersonnelSelectorModal'
import CreateCollegeModal from './modals/CreateCollegeModal'
import CreateProgramModal from './modals/CreateProgramModal'
import CreateOrganizationModal from './modals/CreateOrganizationModal'
import {
  fetchOrganizations as apiFetchOrganizations,
  createOrganization as apiCreateOrganization,
  assignOrganizationModerator as apiAssignOrganizationModerator,
  fetchOrganizationModeratorCandidates
} from '../../services/organizationAdminService'
import {
  fetchColleges as apiFetchColleges,
  createCollege as apiCreateCollege,
  updateCollegeStatus as apiUpdateCollegeStatus,
  fetchAcademicPrograms as apiFetchAcademicPrograms,
  createAcademicProgram as apiCreateAcademicProgram
} from '../../services/collegeAdminService'
import roleService from '../../services/roleService'
import OSADCommandCenterPage from './OSADCommandCenterPage'
import OSADStudentAccountsPage from './OSADStudentAccountsPage'
import OSADAcademicProgramsPage from './OSADAcademicProgramsPage'
import OSADStudentOrganizationsPage from './OSADStudentOrganizationsPage'
import OSADCertificateTemplatesPage from './OSADCertificateTemplatesPage'
import OSADAccreditationReportsPage from './OSADAccreditationReportsPage'
import OSADSystemAuditLogsPage from './OSADSystemAuditLogsPage'
import OSADPasswordResetRequestsPage from './OSADPasswordResetRequestsPage'

export default function OSADDashboardPage({ currentUser }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const rawTab = searchParams.get('tab') || 'overview'
  const activeTab = rawTab === 'awardees'
    ? 'candidate-review'
    : rawTab === 'academic-structure' ? 'academic-programs' : rawTab

  const {
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
    createOrganization,
    createClub,
    getStudentLeaderboards,
    getAccreditationReportDetails,
    assignOrganizationModerator,
    revokeRole,
    createAwardCategory,
    generateAwardCandidates,
    confirmAwardee,
    batchConfirmAwardees,
    undoAwardeeConfirmation,
    resetStudentPassword,
    getPasswordResetRequests,
    approvePasswordResetRequest,
    refreshAuditLogs
  } = useOSAD()

  // Account & Portfolio Viewing States
  const [userRoleFilter, setUserRoleFilter] = useState('student')
  const [selectedCollege, setSelectedCollege] = useState('all')
  const [selectedSort, setSelectedSort] = useState('name')
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [personnelSelectorTarget, setPersonnelSelectorTarget] = useState(null)

  // Initial Form Constants
  const INITIAL_ORG_DATA = { name: '', category: 'College Academic Organization' }

  // Modal States
  const [isAddCollegeOpen, setIsAddCollegeOpen] = useState(false)
  const [isAddProgramOpen, setIsAddProgramOpen] = useState(false)
  const [isAddOrgOpen, setIsAddOrgOpen] = useState(false)
  const [isAddClubOpen, setIsAddClubOpen] = useState(false)
  const [newClubData, setNewClubData] = useState({ name: '', parent_org: 'Computer Society NDMU', category: 'Non-Academic Club & Extra-Curricular' })

  // Persistent Student Organizations & Academic Structure State
  const [persistentOrgs, setPersistentOrgs] = useState([])
  const [moderatorCandidates, setModeratorCandidates] = useState([])
  const [persistentColleges, setPersistentColleges] = useState([])
  const [persistentPrograms, setPersistentPrograms] = useState([])

  const loadPersistentOrgs = React.useCallback(async () => {
    try {
      const data = await apiFetchOrganizations()
      if (Array.isArray(data)) setPersistentOrgs(data)
    } catch (err) {
      console.warn('Failed to load persistent organizations:', err)
    }
  }, [])

  const loadPersistentColleges = React.useCallback(async () => {
    try {
      const data = await apiFetchColleges()
      if (Array.isArray(data)) setPersistentColleges(data)
    } catch (err) {
      console.warn('Failed to load persistent colleges:', err)
    }
  }, [])

  const loadPersistentPrograms = React.useCallback(async () => {
    try {
      const data = await apiFetchAcademicPrograms()
      if (Array.isArray(data)) setPersistentPrograms(data)
    } catch (err) {
      console.warn('Failed to load persistent academic programs:', err)
    }
  }, [])

  React.useEffect(() => {
    loadPersistentOrgs()
    loadPersistentColleges()
    loadPersistentPrograms()
  }, [loadPersistentOrgs, loadPersistentColleges, loadPersistentPrograms])

  React.useEffect(() => {
    const organizationId = personnelSelectorTarget?.roleType === 'moderator'
      ? personnelSelectorTarget.organizationId
      : null
    if (!organizationId) {
      setModeratorCandidates([])
      return
    }
    let active = true
    setModeratorCandidates([])
    fetchOrganizationModeratorCandidates(organizationId)
      .then((personnel) => { if (active) setModeratorCandidates(personnel) })
      .catch((err) => {
        if (active) {
          setPersonnelSelectorTarget(null)
          showToast(`Failed to load eligible moderators: ${err?.response?.data?.error?.message || err?.message || 'Server error'}`)
        }
      })
    return () => { active = false }
  }, [personnelSelectorTarget])

  // Toast Notification
  const [toastMessage, setToastMessage] = useState(null)
  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Hierarchy Creation Handlers
  const handleCreateCollegeSubmit = async (payload) => {
    try {
      const created = await apiCreateCollege(payload)
      await loadPersistentColleges()
      await loadPersistentPrograms()
      const code = created?.college?.code || (payload instanceof FormData ? payload.get('code') : payload.code)
      const name = created?.college?.name || (payload instanceof FormData ? payload.get('name') : payload.name)
      showToast(`Created Academic College: [${code}] ${name}`)
      return created
    } catch (err) {
      showToast(`Failed to create Academic College: ${err?.message || 'Server error'}`)
      throw err
    }
  }

  const handleCreateProgramSubmit = async (progData) => {
    try {
      const created = await apiCreateAcademicProgram(progData)
      await loadPersistentColleges()
      await loadPersistentPrograms()
      const code = created?.program?.code || progData.code
      const name = created?.program?.name || progData.name
      showToast(`Created Academic Program: [${code}] ${name}`)
      return created
    } catch (err) {
      showToast(`Failed to create Academic Program: ${err?.message || 'Server error'}`)
      throw err
    }
  }

  const handleCollegeStatusChange = async (college, status) => {
    const result = await apiUpdateCollegeStatus(college.id, status)
    await loadPersistentColleges()
    showToast(status === 'inactive' ? `Archived College: [${college.code}]` : `Reactivated College: [${college.code}]`)
    return result
  }

  // Handle Create Organization (Persistent API Submission)
  const handleCreateOrganizationSubmit = async (formData, rawData) => {
    const created = await apiCreateOrganization(formData)
    await loadPersistentOrgs()
    showToast(`Created Student Organization: [${rawData.code || rawData.name}] ${rawData.name}`)
    return created
  }

  // Handle Create Club
  const handleCreateClubSubmit = (e) => {
    e.preventDefault()
    if (!newClubData.name) return
    createClub(newClubData)
    setIsAddClubOpen(false)
    setNewClubData({ name: '', parent_org: organizations[0]?.name || 'Computer Society NDMU', category: 'Non-Academic Club & Extra-Curricular' })
    showToast(`Created Student Club: [${newClubData.name}]`)
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-xl bg-[#176B43] text-white text-xs font-bold shadow-2xl flex items-center gap-3 border border-emerald-500 animate-in fade-in slide-in-from-top duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sub-View Routing */}
      {activeTab === 'overview' && (
        <OSADCommandCenterPage 
          setSearchParams={setSearchParams} 
          awardees={awardees} 
          candidateDecisions={awardees}
          currentUser={currentUser}
          metrics={metrics}
          awardCategories={awardCategories}
          getUsers={getUsers}
        />
      )}

      {activeTab === 'accounts' && (
        <OSADStudentAccountsPage
          userSearchTerm={userSearchTerm}
          setUserSearchTerm={setUserSearchTerm}
          selectedCollege={selectedCollege}
          setSelectedCollege={setSelectedCollege}
          selectedSort={selectedSort}
          setSelectedSort={setSelectedSort}
          getUsers={getUsers}
          getStudentPortfolios={getStudentPortfolios}
          resetStudentPassword={resetStudentPassword}
          getPasswordResetRequests={getPasswordResetRequests}
          approvePasswordResetRequest={approvePasswordResetRequest}
          showToast={showToast}
          colleges={persistentColleges}
          degreePrograms={persistentPrograms}
        />
      )}

      {activeTab === 'academic-programs' && (
        <OSADAcademicProgramsPage
          colleges={persistentColleges}
          academicPrograms={persistentPrograms}
          setIsAddCollegeOpen={setIsAddCollegeOpen}
          setIsAddProgramOpen={setIsAddProgramOpen}
          onCollegeStatusChange={handleCollegeStatusChange}
          onCollegeChanged={async (college) => { await loadPersistentColleges(); showToast(`Updated College: [${college?.code}]`) }}
          onCollegeDeleted={async (college) => { await loadPersistentColleges(); await loadPersistentPrograms(); showToast(`Deleted College: [${college?.code}]`) }}
          onViewCollegeStudents={(college) => {
            // OS-4: one click from a college to its students, filtered by the college.
            setSelectedCollege(college?.code || 'all')
            setSearchParams(prev => { const next = new URLSearchParams(prev); next.set('tab', 'accounts'); return next })
          }}
        />
      )}

      {activeTab === 'organizations' && (
        <OSADStudentOrganizationsPage
          organizations={persistentOrgs}
          colleges={persistentColleges.length > 0 ? persistentColleges : colleges}
          clubs={clubs}
          selectedOrganizationId={searchParams.get('orgId') || null}
          onSelectOrganization={(orgId) => setSearchParams({ tab: 'organizations', orgId })}
          onBackToOrganizations={() => setSearchParams({ tab: 'organizations' })}
          setIsAddOrgOpen={setIsAddOrgOpen}
          setIsAddClubOpen={setIsAddClubOpen}
          setPersonnelSelectorTarget={setPersonnelSelectorTarget}
        />
      )}

      {activeTab === 'awards' && (
        <Navigate to="/osad/awards" replace />
      )}

      {activeTab === 'certificate-templates' && (
        <OSADCertificateTemplatesPage />
      )}

      {(activeTab === 'candidate-review' || activeTab === 'awardees') && (
        <Navigate to="/osad/candidates" replace />
      )}

      {activeTab === 'accreditation-reports' && (
        <OSADAccreditationReportsPage
          accreditationReports={accreditationReports}
          getAccreditationReportDetails={getAccreditationReportDetails}
          showToast={showToast}
        />
      )}

      {activeTab === 'system-logs' && (
        <OSADSystemAuditLogsPage
          auditLogs={auditLogs}
          refreshAuditLogs={refreshAuditLogs}
        />
      )}

      {activeTab === 'password-resets' && (
        <OSADPasswordResetRequestsPage />
      )}

      {/* Personnel Selector Modal for Organization Moderation */}
      {personnelSelectorTarget && (
        <PersonnelSelectorModal
          isOpen={Boolean(personnelSelectorTarget)}
          title={personnelSelectorTarget.title}
          targetName={personnelSelectorTarget.targetName}
          roleType={personnelSelectorTarget.roleType}
          personnelList={personnelSelectorTarget.roleType === 'moderator' ? moderatorCandidates : getPersonnelList()}
          onClose={() => setPersonnelSelectorTarget(null)}
          onSelect={async (personnel) => {
            if (personnelSelectorTarget.roleType === 'moderator') {
              if (personnelSelectorTarget.organizationId) {
                try {
                  await apiAssignOrganizationModerator(personnelSelectorTarget.organizationId, personnel.id)
                  await loadPersistentOrgs()
                  showToast(`Assigned ${personnel.full_name} as Org Moderator for [${personnelSelectorTarget.targetName}]`)
                } catch (err) {
                  showToast(`Failed to assign moderator: ${err?.message || 'Server error'}`)
                }
              } else {
                assignOrganizationModerator(personnel.id, personnelSelectorTarget.targetName)
                showToast(`Assigned ${personnel.full_name} as Org Moderator for [${personnelSelectorTarget.targetName}]`)
              }
            }
            setPersonnelSelectorTarget(null)
          }}
        />
      )}

      {/* Hierarchy Modals */}
      <CreateCollegeModal
        isOpen={isAddCollegeOpen}
        onClose={() => setIsAddCollegeOpen(false)}
        onSubmit={handleCreateCollegeSubmit}
      />

      <CreateProgramModal
        isOpen={Boolean(isAddProgramOpen)}
        onClose={() => setIsAddProgramOpen(false)}
        onSubmit={handleCreateProgramSubmit}
        colleges={persistentColleges.filter((college) => college.status === 'active')}
        initialCollegeId={typeof isAddProgramOpen === 'string' ? isAddProgramOpen : (isAddProgramOpen?.collegeId || null)}
      />

      {/* Create Organization Modal */}
      <CreateOrganizationModal
        isOpen={isAddOrgOpen}
        onClose={() => setIsAddOrgOpen(false)}
        onSubmit={handleCreateOrganizationSubmit}
        colleges={(persistentColleges.length > 0 ? persistentColleges : colleges).filter((college) => !college.status || college.status === 'active')}
        degreePrograms={degreePrograms}
      />

    </div>
  )
}
